import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import type { Plugin } from "vite";

/** Fichiers chargés à la demande seulement (lecteur de codes-barres) : mis en cache au premier usage. */
const lazyAssets = /\.(wasm|map)$/;

/**
 * Émet `sw.js` à la racine du build avec la liste des fichiers à précharger.
 * Sa version change avec le contenu du build, ce qui déclenche la mise à jour.
 */
export function serviceWorker(publicFiles: string[] = []): Plugin {
  return {
    name: "frigomalin:service-worker",
    apply: "build",
    enforce: "post",
    generateBundle(_options, bundle) {
      const assets = Object.keys(bundle)
        .filter((file) => file !== "index.html" && !lazyAssets.test(file))
        .sort();
      const precache = ["./", ...publicFiles, ...assets];
      const version = createHash("sha256").update(precache.join("\n")).digest("hex").slice(0, 12);
      const template = readFileSync(new URL("./sw.template.js", import.meta.url), "utf8");
      this.emitFile({
        type: "asset",
        fileName: "sw.js",
        source: template
          .replace("__VERSION__", version)
          .replace("__PRECACHE__", JSON.stringify(precache)),
      });
    },
  };
}
