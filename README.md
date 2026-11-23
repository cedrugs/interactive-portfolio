# Sam’s Valley
![React](https://img.shields.io/badge/React-19-149eca?style=flat) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat) ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06b6d4?style=flat)

Samuel Cedric’s playable pixel-art portfolio, set in a farm and a furnished home.

## Tech Stack

- **UI:** React 19 and TypeScript 5.
- **Game:** Phaser 3.90 with character movement, collisions, animals, and ambient animation.
- **Build:** Vite 8 producing static assets in `dist/`.
- **Typography:** Locally bundled Pixelify Sans and Cascadia Mono.
- **Container:** Unprivileged Nginx serving static files on port 3000.
- **Automation:** GitHub Actions for validation and Harbor image publishing.

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

- [ ] SGP-01 staging and production rollout through Teleport and GitHub Actions.

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

- **Validation:** Branch pushes and pull requests to `staging` or `main` run lint, tests, TypeScript checking, a Vite build, and production-container smoke checks. Staging pushes run these checks through the publishing workflow.
- **Branch Flow:** Feature branches target `staging`. A separate promotion pull request moves tested work to `main`. Neither integration branch receives direct code pushes.
- **Images:** Staging pushes publish `staging` and `sha-<commit>` image tags after validation. Bare numeric semantic-version tags publish the release version and `sha-<commit>` only when the tagged commit belongs to `main`. Tags with a `v` prefix are not accepted.
- **Registry:** Images use the existing Harbor path `projects/interactive-portfolio`. GitHub Actions requires repository secrets `REGISTRY_URL`, `HARBOR_USERNAME`, and `HARBOR_PASSWORD`.
- **Server Status:** Image publishing does not deploy the server yet. SGP-01 routing, environment ports, a scoped Teleport workload identity, and rollout verification still need configuration after authenticated server inspection.
- **Revision:** The container exposes its `APP_REVISION` build argument at `/version.json`. The image digest is recorded in the publishing job summary.
- **Static Hosting:** Publish `dist/` after `npm run build`. Configure `/legacy` to serve `index.html` if retaining the legacy route.
- **Local Docker:** Run `docker compose up --build`, then open `http://127.0.0.1:3000`. The local Compose configuration binds to loopback only and is not the SGP-01 deployment configuration.
