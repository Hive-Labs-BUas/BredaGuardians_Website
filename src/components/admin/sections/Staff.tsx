import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { addCaptain, listCaptains, removeCaptain } from "@/lib/admin.functions";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AdminOnly } from "@/components/admin/AdminOnly";
import { ImageField } from "@/components/admin/ImageField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import type { AdminData } from "@/lib/admin-data";

type Person = {
  id: string;
  name: string;
  role: string;
  blurb: string;
  photo_url: string;
  linkedin_url: string;
  is_core: boolean;
  alumni: boolean;
  visible: boolean;
  started_on: string;
  ended_on: string;
  sort_order: number;
};

const emptyPerson = (core: boolean): Person => ({
  id: "",
  name: "",
  role: "",
  blurb: "",
  photo_url: "",
  linkedin_url: "",
  is_core: core,
  alumni: false,
  visible: true,
  started_on: "",
  ended_on: "",
  sort_order: 0,
});

type Row = AdminData["interns"][number];

function toPerson(row: Row): Person {
  const extra = row as unknown as {
    linkedin_url?: string | null;
    is_core?: boolean | null;
    alumni?: boolean | null;
    started_on?: string | null;
    ended_on?: string | null;
  };
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    blurb: row.blurb ?? "",
    photo_url: row.photo_url ?? "",
    linkedin_url: extra.linkedin_url ?? "",
    is_core: Boolean(extra.is_core),
    alumni: Boolean(extra.alumni),
    visible: row.visible,
    started_on: extra.started_on ?? "",
    ended_on: extra.ended_on ?? "",
    sort_order: row.sort_order ?? 0,
  };
}

/** Add and edit the people behind the club: core team and interns. */
function PeopleEditor({
  rows,
  core,
  onSaved,
}: {
  rows: Row[];
  core: boolean;
  onSaved: () => Promise<void>;
}) {
  const [person, setPerson] = useState<Person>(emptyPerson(core));

  async function remove(id: string): Promise<void> {
    if (!window.confirm("Delete this person?")) return;
    const { error } = await supabase.from("interns").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    await onSaved();
  }

  async function save(): Promise<void> {
    if (!person.name.trim()) {
      toast.error("Add a name.");
      return;
    }
    const payload = {
      name: person.name.trim(),
      role: person.role.trim(),
      blurb: person.blurb.trim(),
      photo_url: person.photo_url.trim() || null,
      linkedin_url: person.linkedin_url.trim() || null,
      is_core: person.is_core,
      alumni: person.alumni,
      visible: person.visible,
      started_on: person.started_on || null,
      ended_on: person.ended_on || null,
      sort_order: Number.isFinite(person.sort_order) ? person.sort_order : 0,
    };
    const { error } = person.id
      ? await supabase.from("interns").update(payload as never).eq("id", person.id)
      : await supabase.from("interns").insert(payload as never);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(person.id ? "Saved" : "Person added");
    setPerson(emptyPerson(core));
    await onSaved();
  }

  return (
    <div className="space-y-5">
      <div className="surface-card space-y-4 bg-surface-2 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg">
            {person.id ? "Edit person" : core ? "Add a core team member" : "Add an intern"}
          </h3>
          {person.id && (
            <Button variant="ghost" size="sm" onClick={() => setPerson(emptyPerson(core))}>
              Cancel edit
            </Button>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={person.name} onChange={(e) => setPerson({ ...person, name: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <Input
              value={person.role}
              placeholder={core ? "Founder, Manager…" : "Content intern, Event intern…"}
              onChange={(e) => setPerson({ ...person, role: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Short bio</Label>
          <Textarea rows={4} value={person.blurb} onChange={(e) => setPerson({ ...person, blurb: e.target.value })} />
        </div>

        <div className="space-y-2">
          <Label>LinkedIn link (optional)</Label>
          <Input
            placeholder="https://www.linkedin.com/in/…"
            value={person.linkedin_url}
            onChange={(e) => setPerson({ ...person, linkedin_url: e.target.value })}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label>Started on (optional)</Label>
            <Input
              type="date"
              value={person.started_on}
              onChange={(e) => setPerson({ ...person, started_on: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Ended on (optional)</Label>
            <Input
              type="date"
              value={person.ended_on}
              onChange={(e) => setPerson({ ...person, ended_on: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Order</Label>
            <Input
              type="number"
              value={person.sort_order}
              onChange={(e) => setPerson({ ...person, sort_order: Number(e.target.value) })}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={person.is_core} onCheckedChange={(v) => setPerson({ ...person, is_core: v })} />
            Core team member
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={person.alumni} onCheckedChange={(v) => setPerson({ ...person, alumni: v })} />
            Alumni (past crew)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={person.visible} onCheckedChange={(v) => setPerson({ ...person, visible: v })} />
            Shown on the site
          </label>
        </div>

        <ImageField
          label="Photo"
          folder="interns"
          value={person.photo_url}
          onChange={(next) => setPerson({ ...person, photo_url: next })}
        />

        <Button onClick={() => void save()}>
          <Plus className="size-4" /> {person.id ? "Save changes" : "Add person"}
        </Button>
      </div>

      <ul className="grid gap-3 sm:grid-cols-2">
        {rows.map((row) => {
          const item = toPerson(row);
          return (
            <li key={row.id} className="surface-card bg-surface-2 p-4">
              <div className="flex items-center gap-4">
                {item.photo_url && <img src={item.photo_url} alt="" className="size-14 rounded-lg object-cover" />}
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-muted-foreground">{item.role}</p>
                  <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
                    {item.is_core ? "Core team" : "Intern"}
                    {item.alumni ? " · Alumni" : ""}
                    {item.visible ? "" : " · Hidden"}
                  </p>
                </div>
                <Button size="icon" variant="ghost" aria-label="Edit" onClick={() => setPerson(item)}>
                  <Pencil className="size-4" />
                </Button>
                <AdminOnly>
                  <Button size="icon" variant="ghost" aria-label="Delete" onClick={() => void remove(row.id)}>
                    <Trash2 className="size-4" />
                  </Button>
                </AdminOnly>
              </div>
            </li>
          );
        })}
        {rows.length === 0 && <li className="text-sm text-muted-foreground">Nobody here yet.</li>}
      </ul>
    </div>
  );
}

/** Staff can hand out (and take back) the roster-only team captain role. */
function CaptainsEditor() {
  const fetchCaptains = useServerFn(listCaptains);
  const add = useServerFn(addCaptain);
  const drop = useServerFn(removeCaptain);
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");

  const captains = useQuery({
    queryKey: ["admin-captains"],
    queryFn: async () => (await fetchCaptains()) as { id: string; email: string; name: string }[],
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin-captains"] });

  const addMutation = useMutation({
    mutationFn: (value: string) => add({ data: { email: value } }),
    onSuccess: async () => {
      toast.success("Team captain added");
      setEmail("");
      await invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const removeMutation = useMutation({
    mutationFn: (userId: string) => drop({ data: { userId } }),
    onSuccess: async () => {
      toast.success("Team captain removed");
      await invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const rows = captains.data ?? [];

  return (
    <div className="space-y-5">
      <div className="surface-card space-y-4 bg-surface-2 p-5">
        <div className="space-y-2">
          <Label htmlFor="captain-email">Email of the account</Label>
          <Input
            id="captain-email"
            type="email"
            placeholder="player@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <p className="text-sm text-muted-foreground">
            They need an account on the website first. A team captain can add and edit players on the
            rosters — nothing else.
          </p>
        </div>
        <Button
          disabled={!email.trim() || addMutation.isPending}
          onClick={() => addMutation.mutate(email.trim())}
        >
          <Plus className="mr-2 size-4" /> Make team captain
        </Button>
      </div>

      <ul className="space-y-3">
        {rows.map((row) => (
          <li
            key={row.id}
            className="surface-card flex flex-wrap items-center justify-between gap-3 bg-surface-2 p-4"
          >
            <div>
              <p className="font-semibold">{row.name}</p>
              <p className="text-sm text-muted-foreground">{row.email}</p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              disabled={removeMutation.isPending}
              onClick={() => removeMutation.mutate(row.id)}
            >
              <Trash2 className="mr-2 size-4" /> Remove
            </Button>
          </li>
        ))}
        {captains.isLoading && <li className="text-sm text-muted-foreground">Loading…</li>}
        {!captains.isLoading && rows.length === 0 && (
          <li className="text-sm text-muted-foreground">No team captains yet.</li>
        )}
      </ul>
    </div>
  );
}


export function Staff({ data }: { data: AdminData | undefined }) {
  const queryClient = useQueryClient();
  const [position, setPosition] = useState({ title: "", description: "", requirements: "" });

  async function refresh(): Promise<void> {
    await queryClient.invalidateQueries({ queryKey: ["admin-data"] });
    await queryClient.invalidateQueries({ queryKey: ["interns"] });
  }

  const people = data?.interns ?? [];
  const coreRows = people.filter((row) => Boolean((row as unknown as { is_core?: boolean }).is_core));
  const internRows = people.filter((row) => !(row as unknown as { is_core?: boolean }).is_core);

  return (
    <Tabs defaultValue="core" className="space-y-6">
      <TabsList className="flex h-auto w-full flex-wrap justify-start gap-2 bg-surface p-2">
        <TabsTrigger value="core" className="min-h-11 px-5 text-sm">Core team</TabsTrigger>
        <TabsTrigger value="interns" className="min-h-11 px-5 text-sm">Intern profiles</TabsTrigger>
        <TabsTrigger value="positions" className="min-h-11 px-5 text-sm">Open positions</TabsTrigger>
        <TabsTrigger value="captains" className="min-h-11 px-5 text-sm">Team captains</TabsTrigger>
      </TabsList>

      <TabsContent value="captains">
        <p className="mb-5 rounded-lg border border-border bg-surface-2 px-4 py-3 text-sm text-muted-foreground">
          Give a player the captain role and they get their own Roster Room: they can add and edit
          players on the teams, and nothing else on the website.
        </p>
        <CaptainsEditor />
      </TabsContent>

      <TabsContent value="core">

        <p className="mb-5 rounded-lg border border-border bg-surface-2 px-4 py-3 text-sm text-muted-foreground">
          The people running the club. They appear at the top of the Our Team page, above the interns.
        </p>
        <PeopleEditor rows={coreRows} core onSaved={refresh} />
      </TabsContent>

      <TabsContent value="interns">
        <p className="mb-5 rounded-lg border border-border bg-surface-2 px-4 py-3 text-sm text-muted-foreground">
          Current and past interns. Turn on “Alumni” when someone finishes their placement.
        </p>
        <PeopleEditor rows={internRows} core={false} onSaved={refresh} />
      </TabsContent>

      <TabsContent value="positions" className="space-y-5">
        <div className="surface-card space-y-4 bg-surface-2 p-5">
          <div className="space-y-2">
            <Label htmlFor="pos-title">Title</Label>
            <Input id="pos-title" value={position.title} onChange={(e) => setPosition({ ...position, title: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pos-desc">Description</Label>
            <Textarea id="pos-desc" rows={4} value={position.description} onChange={(e) => setPosition({ ...position, description: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pos-req">Requirements (optional)</Label>
            <Textarea id="pos-req" rows={4} value={position.requirements} onChange={(e) => setPosition({ ...position, requirements: e.target.value })} />
          </div>
          <Button
            onClick={async () => {
              if (!position.title.trim()) {
                toast.error("Add a title.");
                return;
              }
              const { error } = await supabase.from("intern_positions").insert({
                title: position.title.trim(),
                description: position.description.trim(),
                requirements: position.requirements.trim(),
                sort_order: (data?.positions.length ?? 0) + 1,
              });
              if (error) {
                toast.error(error.message);
                return;
              }
              toast.success("Position added");
              setPosition({ title: "", description: "", requirements: "" });
              await refresh();
            }}
          >
            <Plus className="size-4" /> Add position
          </Button>
        </div>

        <ul className="space-y-3">
          {(data?.positions ?? []).map((row) => (
            <li key={row.id} className="surface-card flex flex-wrap items-center justify-between gap-3 bg-surface-2 p-4">
              <div className="min-w-0">
                <p className="font-medium">{row.title}</p>
                <p className="text-sm text-muted-foreground">{row.description}</p>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Switch
                    checked={row.active}
                    onCheckedChange={async (checked) => {
                      await supabase.from("intern_positions").update({ active: checked }).eq("id", row.id);
                      await refresh();
                    }}
                  />
                  Open
                </label>
                <AdminOnly>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="Delete"
                    onClick={async () => {
                      if (!window.confirm("Delete this position?")) return;
                      const { error } = await supabase.from("intern_positions").delete().eq("id", row.id);
                      if (error) {
                        toast.error(error.message);
                        return;
                      }
                      await refresh();
                    }}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </AdminOnly>
              </div>
            </li>
          ))}
        </ul>
      </TabsContent>
    </Tabs>
  );
}
