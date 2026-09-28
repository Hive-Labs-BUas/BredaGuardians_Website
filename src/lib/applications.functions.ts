import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const MAX_BYTES = 6 * 1024 * 1024;

const fileSchema = z
  .object({
    name: z.string().min(1).max(200),
    type: z.string().max(120).default("application/octet-stream"),
    data: z.string().min(1),
  })
  .nullable()
  .optional();

function decode(base64: string): Uint8Array {
  const clean = base64.includes(",") ? base64.slice(base64.indexOf(",") + 1) : base64;
  const binary = atob(clean);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/**
 * Public application submission. Optional CV / motivation letter files are
 * stored in the private "applications" bucket — only admins can read them back.
 */
export const submitApplication = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        name: z.string().trim().min(1).max(100),
        email: z.string().trim().email().max(255),
        position: z.string().trim().min(1).max(150),
        motivation: z.string().trim().min(20).max(2000),
        cv: fileSchema,
        letter: fileSchema,
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: inserted, error } = await supabaseAdmin
      .from("applications")
      .insert({
        name: data.name,
        email: data.email,
        position: data.position,
        motivation: data.motivation,
      })
      .select("id")
      .single();
    if (error || !inserted) throw new Error(error?.message ?? "Could not save your application");
    const applicationId = inserted.id;

    async function store(file: NonNullable<typeof data.cv>, kind: "cv" | "letter") {
      const bytes = decode(file.data);
      if (bytes.byteLength > MAX_BYTES) throw new Error("That file is larger than 6 MB.");
      const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") ?? "pdf";
      const path = `${applicationId}/${kind}.${ext}`;
      const { error: uploadError } = await supabaseAdmin.storage
        .from("applications")
        .upload(path, bytes, { contentType: file.type || "application/octet-stream", upsert: true });
      if (uploadError) throw new Error(uploadError.message);
      return path;
    }

    const patch: Record<string, string> = {};
    if (data.cv) patch['cv_path'] = await store(data.cv, "cv");
    if (data.letter) patch['letter_path'] = await store(data.letter, "letter");
    if (Object.keys(patch).length > 0) {
      await supabaseAdmin.from("applications").update(patch as never).eq("id", applicationId);
    }

    return { ok: true };
  });

/** Admin-only temporary download link for an application attachment. */
export const getApplicationFileUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ path: z.string().min(1).max(300) }).parse(data))
  .handler(async ({ context, data }) => {
    const { data: role } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!role) throw new Error("Admins only");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: signed, error } = await supabaseAdmin.storage
      .from("applications")
      .createSignedUrl(data.path, 60 * 10);
    if (error || !signed) throw new Error(error?.message ?? "Could not create a download link");
    return { url: signed.signedUrl };
  });
