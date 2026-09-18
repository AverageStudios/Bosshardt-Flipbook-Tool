// Copies the PDF.js worker, CMaps, standard fonts and WASM image decoders into
// /public/pdfjs so they are served as static files (no CDN dependency).
// Runs automatically after `npm install` (see "postinstall" in package.json).
import { copyFileSync, cpSync, mkdirSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pkg = dirname(require.resolve("pdfjs-dist/package.json"));
const out = join(root, "public", "pdfjs");

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
copyFileSync(join(pkg, "legacy", "build", "pdf.worker.min.mjs"), join(out, "pdf.worker.min.mjs"));
for (const dir of ["cmaps", "standard_fonts", "wasm"]) {
  cpSync(join(pkg, dir), join(out, dir), { recursive: true });
}
console.log("Copied PDF.js assets to public/pdfjs");
