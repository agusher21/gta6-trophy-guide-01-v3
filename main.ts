// Leonida Trophy Ledger — entrypoint (Node 22, stdlib only).
// Copies app/ and screenshots/ into the output directory, then writes the
// dossier with the kit's buildDossier. Nothing here fetches the network.
import { buildDossier } from "./vendor/makefun-frontend.ts";
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const outDir = process.env.MAKEFUN_OUTPUT_DIR || "/output";
const SHOT_MAX_BYTES = 262144;

// Fail early with a plain message when the screenshots are not ready, instead
// of letting buildDossier throw a bare cap error.
function checkScreenshots(dir: string): void {
  const shots = readdirSync(dir).filter((f) => /\.(png|jpe?g)$/i.test(f)).sort();
  if (shots.length < 3 || shots.length > 4) {
    throw new Error(`screenshots/: expected 3 or 4 images, found ${shots.length}`);
  }
  for (const f of shots) {
    const size = statSync(join(dir, f)).size;
    if (size > SHOT_MAX_BYTES) throw new Error(`screenshots/${f}: ${size} bytes, over the ${SHOT_MAX_BYTES} cap`);
  }
  console.log(`screenshots: ${shots.length} images, all under the cap`);
}

function freshDir(path: string): void {
  if (existsSync(path)) rmSync(path, { recursive: true, force: true });
  mkdirSync(path, { recursive: true });
}

function main(): void {
  const appSrc = join(root, "app");
  const shotsSrc = join(root, "screenshots");
  if (!existsSync(appSrc)) throw new Error("app/ is missing from the repo root");
  if (!existsSync(shotsSrc)) throw new Error("screenshots/ is missing from the repo root");
  checkScreenshots(shotsSrc);

  freshDir(outDir);
  cpSync(appSrc, join(outDir, "app"), { recursive: true });
  cpSync(shotsSrc, join(outDir, "screenshots"), { recursive: true });

  const dossier = buildDossier(outDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 16777216,
  });
  writeFileSync(join(outDir, "dossier.json"), dossier);
  console.log(`wrote ${join(outDir, "dossier.json")} (${dossier.length} bytes)`);
}

main();
