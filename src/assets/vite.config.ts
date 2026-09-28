import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import type { Plugin } from "vite";
import { existsSync } from "node:fs";

const VIRTUAL_PREFIX = "\0asset-json-shim/";

function assetJsonShim(): Plugin {
  return {
    name: "asset-json-shim",
    enforce: "pre",
    async resolveId(id, importer, options) {
      if (id.startsWith(VIRTUAL_PREFIX)) return id;
      if (!/\.(png|jpe?g|webp)\.asset\.json$/.test(id)) return null;
      const resolved = await this.resolve(id, importer, { ...options, skipSelf: true });
      if (!resolved) return null;
      const encoded = Buffer.from(resolved.id, "utf8").toString("base64url");
      return VIRTUAL_PREFIX + encoded;
    },
    load(id) {
      if (!id.startsWith(VIRTUAL_PREFIX)) return null;
      const encoded = id.slice(VIRTUAL_PREFIX.length);
      const realJsonPath = Buffer.from(encoded, "base64url").toString("utf8");
      const realImagePath = realJsonPath.replace(/\.asset\.json$/, "");
      if (!existsSync(realImagePath)) return null;
      return `import realUrl from ${JSON.stringify(realImagePath)};\nexport default { url: realUrl };`;
    },
  };
}

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  nitro: {
    preset: "node-server",
  },
  vite: {
    plugins: [assetJsonShim()],
  },
});