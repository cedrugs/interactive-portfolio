# Sam’s Valley
![React](https://img.shields.io/badge/React-19-149eca?style=flat) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat) ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06b6d4?style=flat)

Samuel Cedric’s playable pixel-art portfolio, set in a farm and a furnished home.

## Tech Stack

- **UI:** React 19 and TypeScript 5.
- **Game:** Phaser 3.90 with character movement, collisions, animals, and ambient animation.
- **Build:** Vite 8 producing static assets in `dist/`.
- **Typography:** Locally bundled Pixelify Sans and Cascadia Mono.
- **Container:** Unprivileged Nginx serving static files on port 3000.
- **Automation:** GitHub Actions for validation and GitHub Container Registry image publishing.

## Project Structure

- **`src/App.tsx`:** Lazy-loaded game and legacy route with a studio splash.
- **`src/phaser/lab/Lab.tsx`:** Main menu, visitor setup, saved progress, and scene transitions.
- **`src/phaser/lab/FarmScene.ts`:** Outdoor scene and farm interactions.
- **`src/phaser/lab/scene.ts`:** Interior scene, guided tour, and character interactions.
- **`src/phaser/lab/farm-world.ts`:** Farm layout, objects, and navigation bounds.
- **`src/game/PortfolioPanel.tsx`:** Projects, background, stack, and contact dialog.
- **`lib/data.ts`:** Shared portfolio information.
- **`public/assets/workshop-lab/`:** Farm, character, menu, and dialogue artwork.
- **`public/assets/pixel-icons/`:** Pixelated technology icons and upstream licenses.
- **`tests/`:** Navigation, collision, tour, dialogue, and save regression checks.
- **`.github/workflows/`:** Validation and container publishing workflows.

## Routes Structure

- **`/`:** Sam’s Valley, with direct portfolio access from the menu.
- **`/legacy`:** Earlier Canvas 2D workshop.
- **`/CV_Samuel_Cedric.pdf`:** Downloadable CV.
- **`/healthz`:** Container health endpoint.
- **`/version.json`:** Container build revision, generated during the Docker build.
- **`/robots.txt`:** Crawler policy.
- **`/sitemap.xml`:** Canonical homepage entry.

## Supported File Types

- **Artwork:** PNG and WebP textures, sprites, and interface assets.
- **Metadata:** JSON atlas and glyph data.
- **CV:** PDF.

## Setup Instructions

Use Node.js 22.12 or newer in the Node.js 22 release line. From the project directory:

```sh
npm ci
npm run dev
```

Open `http://127.0.0.1:5173`. The dev server uses a strict port.

```sh
npm test
npm run typecheck
npm run lint
npm run build
npm run preview
```

The production preview runs at `http://127.0.0.1:4173`.

## Key Features

### Completed

- [x] Generated pixel artwork, studio splash, wooden menu title, and windblown petals.
- [x] Visitor name and character selection with locally saved progress.
- [x] Farm exploration, moving animals, readable sign interactions, and house entry and exit.
- [x] Guided interior tour with Sam, dialogue, character collisions, and reactions.
- [x] Keyboard and touch controls.
- [x] Projects, background, technology icons, contact details, and downloadable CV.
- [x] Direct portfolio access without playing through the tour.
- [x] Production container with health checks and build revision reporting.

### In Progress

- [ ] First production rollout on SGP-01 through Teleport and GitHub Actions.

## Mobile Responsive

- **Input:** Touch controls supplement keyboard movement and interaction.
- **Orientation:** The game offers fullscreen and orientation handling where supported by the browser.
- **Validation:** Automated game logic and container smoke checks run in CI. Real-device phone testing remains separate.

## Design System

- **Artwork:** Original generated pixel textures and sprites with nearest-neighbor rendering.
- **Interface:** Wooden frames, parchment panels, Pixelify Sans, and pixelated icons.
- **World:** Farm and interior layouts are assembled from reusable assets in code.
- **Motion:** Ambient farm animation and menu particles complement character movement.

## Deployment

- **Validation:** Branch pushes and pull requests to `staging` or `main` run lint, tests, TypeScript checking, a Vite build, and production-container smoke checks. There is no staging deployment.
- **Branch Flow:** Feature branches target `staging`. A separate promotion pull request moves tested work to `main`. Neither integration branch receives direct code pushes.
- **Production:** Only bare numeric semantic-version tags on commits reachable from `main` publish and deploy. The production URL is `https://samuelcedric.com`; `staging` is an integration branch only.
- **Images:** GitHub Container Registry stores the release tag and `sha-<commit>` under `ghcr.io/cedrugs/interactive-portfolio`. Publishing uses the workflow’s built-in `GITHUB_TOKEN` with `packages: write`; deployment uses `packages: read`. No separate registry credentials are required.
- **Server:** SGP-01 uses the existing `proxy` Docker network and Traefik HTTPS entry point. Portfolio containers expose no host port and run as UID 101 with a read-only filesystem and dropped capabilities.
- **Identity:** The `production` GitHub environment and `Deploy portfolio` workflow join Teleport using the `sams-valley-github-production` OIDC policy. The bot permits only `portfolio-deploy` on nodes labelled `env=ditto`, currently SGP-01; that account accepts only the validated deployment command.
- **Transfer:** CI pulls the published digest, checks its image identity, and streams a compressed image through Teleport. SGP-01 stores no registry password. The server validates the image ID, source label, and commit revision before starting it.
- **Traffic Switch:** The server starts the candidate, checks its revision, and atomically updates the Traefik route. It verifies Traefik reports the new service healthy and restores the prior route if that check fails. The previous container remains available; older containers are removed on the next successful rollout.
- **Public Verification:** CI checks HTTPS, `/version.json`, `/healthz`, and the CV after activation. An external verification failure leaves the internally healthy container active and marks the run failed, so DNS or CDN issues remain visible.
- **Client IP:** Nginx trusts forwarded addresses only from Traefik at `10.10.1.3`. A Cloudflare client header is used for access logging only when the trusted forwarding chain identifies a Cloudflare peer.
- **Rollback:** Re-run the previous release tag workflow. It builds and publishes that commit, then validates and activates its container through the same deployment path.
- **Bootstrap:** After explicit access approval, copy `deploy/portfolio-shell`, `deploy/deploy-portfolio`, and `deploy/install.sh` to a root-owned directory on SGP-01, run `bash install.sh`, and apply `deploy/teleport.yml` with `tctl create`. This creates the restricted account and identity without starting the application or changing public routing. DNS must point `samuelcedric.com` to SGP-01 for the first release and certificate issuance.
- **Static Hosting:** Publish `dist/` after `npm run build`. Configure `/legacy` to serve `index.html` if retaining the legacy route.
- **Local Docker:** Run `docker compose up --build`, then open `http://127.0.0.1:3000`. The local Compose configuration binds to loopback only and is not the SGP-01 deployment configuration.
