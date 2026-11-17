# Memory Palace Trainer

A gated daily trainer for the memory palace technique: Levels 0 to 7 and an exit exam. It runs the lists, the timing, the one-minute gap, the scoring, the next-day checks and the gates.

Plain HTML, CSS and JavaScript. No framework and no build step. Hosted as one Cloudflare Worker.

## What is in here

| Path | What it is |
| --- | --- |
| `public/index.html` | The page shell |
| `public/app.js` | The whole app: levels, word pools, scoring, gates, views, storage |
| `public/style.css` | Styles, light and dark |
| `public/sw.js` | Service worker: makes the app work offline |
| `public/manifest.webmanifest`, `public/icon*` | Lets the app install to a home screen |
| `src/worker.js` | The sync endpoint, `/api/state`, about 60 lines |
| `wrangler.jsonc` | Cloudflare config: static files, KV binding, the subdomain |

## How the data works

- **Local-first.** Progress lives in the browser's storage on each device. The app works with no network.
- **Sync is optional.** In the app footer, open "Sync between devices" and create a code on one device, then enter it on the other. The server keeps one JSON document per code in Cloudflare KV.
- **Newest save wins.** When two devices disagree, the one that saved last replaces the other. Finish a session on one device before starting on another.
- **The code is the key.** There are no accounts. Anyone with the code can read and change that progress, so keep it private.
- **Backups.** "Backup" in the footer downloads the full state as a JSON file and restores from one.

## Run it locally

```sh
npm install
npm run dev
```

Open http://localhost:8787. Local runs use a local KV store, not the real one.

## Deploy

You need Node.js and npm (`sudo pacman -S nodejs npm` on Arch), and `akintayo.dev` must be a zone in your Cloudflare account, with its DNS managed by Cloudflare.

```sh
npm install
npx wrangler login
npx wrangler deploy
```

The first deploy does three things:

1. Creates the KV namespace for the `STATE` binding and writes its id into `wrangler.jsonc`. Commit that change.
2. Uploads the files in `public/` and the Worker.
3. Attaches `memory.akintayo.dev` and creates its DNS record and certificate.

Then open https://memory.akintayo.dev.

If the deploy does not create the namespace, create it by hand and paste the id it prints into `wrangler.jsonc`:

```sh
npx wrangler kv namespace create STATE
```

```jsonc
"kv_namespaces": [{ "binding": "STATE", "id": "<the id>" }]
```

If the domain step fails, check that no DNS record named `memory` already exists on the zone. To deploy without the domain, delete the `routes` line and use the `workers.dev` address that Wrangler prints.

## Lock sync to your own code (optional)

By default the endpoint accepts any well-formed code, so a stranger could store their own document in your KV. To refuse every code but yours, create your code in the app first, then:

```sh
npx wrangler secret put SYNC_CODES
```

Paste the code when asked. Several codes can be given, separated by commas.

## Deploy on push

Put this folder in a Git repository, then in the Cloudflare dashboard open the Worker, go to Settings, and connect the repository under Builds. Every push to the main branch then deploys.

## Changing things

Everything about the course lives at the top of `public/app.js`: the two word pools, and the `L` table that defines each level's load, time limit, accuracy target and hold target. The storage code is the short block marked "state and storage"; the rest of the app only calls `save()`.
