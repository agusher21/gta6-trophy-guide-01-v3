# Leonida Trophy Ledger — GTA VI Trophy Guide & Tracker

[![make.fun bounty](https://img.shields.io/badge/make.fun-bounty-gold)](https://make.fun/bounty/gta6-trophy-guide-01)
[![55 trophies](https://img.shields.io/badge/trophies-55-blue)](https://make.fun/bounty/gta6-trophy-guide-01)
[![$250 prize pool](https://img.shields.io/badge/prize-$250-green)](https://make.fun/bounty/gta6-trophy-guide-01)

An offline web app that guides and tracks all **55 PlayStation 5 trophies** of Grand Theft Auto VI — built for the [make.fun bounty "Build the best GTA 6 trophy guide"](https://make.fun/bounty/gta6-trophy-guide-01) ($250 pool, top 50 paid).

## What it is

- **Every trophy, exact and official** — all 55 names, descriptions and grades (1 platinum, 2 gold, 6 silver, 46 bronze), with a guide in our own words for each one: what to do, where and how, and when it can be missed. Every guide cites its sources (PowerPyx, GTABase, Push Square, GTA Zone, KeenGamer, WeHunt) and never copies their text. Where no source has pinned a trigger down yet, the guide says so instead of guessing.
- **Tracker** — checklist saved in your browser (localStorage), export to file and import back, filters by kind (story, missable, collectibles, activities, online) and grade, plus text search.
- **Spoiler setting** — hides story trophy names and descriptions until you earn them.
- **Roadmap to the platinum** — 7 stages (Arrival → Open Leonida → Vice City → Top of the World → Endgame → Side Stories → Heists & Platinum), about 200 hours, one playthrough, with a "Next Up" in roadmap order.
- **Missables flagged** — only one trophy is flagged as possibly missable by the guides (Positive Mental Attitude: meditate on the balcony at Jason's house before Chapter 1 ends). 28 trophies are hidden until earned.
- **Your count** — a stepper sets your target and a "GOAL · 100% AND THE PLATINUM" bar tracks your progress.
- **Fully offline** — static files under `app/`, no build step, no external requests, no Rockstar logo or official artwork.

## How to run

Open `app/index.html` in a desktop browser. That is all: no install, no server, no network.

To build the submission dossier:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` (Node 22) copies `app/` and `screenshots/` to the output directory and writes `out/dossier.json` with the kit's `buildDossier`.

## Layout

- `app/index.html`, `app/style.css`, `app/app.js` — the guide
- `app/data/trophies.json` — the 55 trophies with guides, steps, sources, kind, stage, missable and hidden flags
- `main.ts` — entrypoint
- `vendor/makefun-frontend.ts` — the kit's dossier library, unchanged
- `screenshots/` — 4 real renders of the running app

## Verification

Checked on 20 November 2026 before this entry was pushed:

- `MAKEFUN_OUTPUT_DIR=out node main.ts` exits 0 and writes `out/dossier.json` (945,119 bytes on the first build), with all 4 screenshots inside and no source text cut.
- All 4 screenshots are real renders of this app at 1280×900, JPEG quality 85, each under the 256 KiB cap.
- Interactive smoke test in headless Chromium: 55 checklist rows render, the default detail is The Shootist, toggling a trophy saves to localStorage and moves the goal bar, search and kind/grade filters narrow the list, the spoiler setting hides and reveals story trophy names, the count stepper moves, the roadmap shows 7 stages, and export runs without error.
- Trophy data: 55 entries, every one with a non-blank own-words guide and 2–4 steps; 28 hidden, 1 flagged missable (Positive Mental Attitude), grades 1 platinum / 2 gold / 6 silver / 46 bronze.

## Licence

MIT — see `LICENSE`.
