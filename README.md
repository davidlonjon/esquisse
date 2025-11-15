# Esquisse · Minimalist Journaling Desktop App

Esquisse is a privacy-first journaling experience built with Electron, React 19, and TypeScript. Everything stays on your device thanks to a local sql.js (SQLite WASM) database.

## Table of Contents

1. [Features](#features)
2. [Architecture Snapshot](#architecture-snapshot)
3. [Documentation](#documentation)
4. [Getting Started](#getting-started)
5. [Scripts](#scripts)
6. [Project Structure](#project-structure)
7. [Tech Stack](#tech-stack)
8. [Contributing](#contributing)
9. [License](#license)

## Features

- **Local-first & offline** – Journals live in a local SQLite database; no network calls required.
- **Cross-platform** – macOS, Windows, and Linux builds via Electron Forge.
- **Focused writing flow** – Tiptap-powered editor, HUD overlays, and keyboard shortcuts (`⌘,` for settings, `⌘/.` for help).
- **Customization** – Theme, font, autosave, and language options with persistence.
- **Searchable history** – Journal/entry stores expose search-friendly metadata for future filters.
- **Strictly typed** – End-to-end TypeScript across main, preload, renderer, and shared code.
- **Internationalization** – English + French bundles powered by i18next with automatic locale detection.
- **Accessible UI** – Tailwind + DaisyUI components with semantic markup and ARIA-friendly patterns.

## Architecture Snapshot

| Layer                         | Highlights                                                                 |
| ----------------------------- | -------------------------------------------------------------------------- |
| **Main (`src/main`)**         | Manages the Electron window, IPC registration, and sql.js persistence.     |
| **Preload (`src/preload`)**   | Exposes a type-safe `window.api` surface via `contextBridge`.              |
| **Renderer (`src/renderer`)** | React SPA with feature-first folders, Zustand stores, and TanStack Router. |
| **Shared (`src/shared`)**     | Types + IPC contracts consumed by every process.                           |

Detailed diagrams and IPC checklists live in [`docs/architecture.md`](docs/architecture.md).

## Documentation

- [`docs/architecture.md`](docs/architecture.md) – multi-process design, state management, IPC pipeline, data layer.
- [`docs/development.md`](docs/development.md) – setup, commands, validation, releasing, documentation expectations.
- [`docs/contributing.md`](docs/contributing.md) – pull-request checklist and engineering principles.

Keep these files updated when workflows or features change.

## Getting Started

### Prerequisites

- Node.js 18+
- npm 10+
- macOS/Windows/Linux with Electron dependencies (Xcode CLT on macOS, build tools on Windows)

### Installation

```bash
git clone https://github.com/<owner>/esquisse.git
cd esquisse
npm install
cp .env.example .env
```

### Development

```bash
npm start
```

This command launches the Vite dev server, opens the Electron shell, and enables hot-module reload.

### Building Packages

- `npm run package` – Build without creating installers.
- `npm run make` – Produce platform installers (DMG/EXE/etc.).

Refer to [`docs/development.md`](docs/development.md) for the full workflow.

## Scripts

| Command                                   | Description                                             |
| ----------------------------------------- | ------------------------------------------------------- |
| `npm start`                               | Run the Electron app with Vite HMR.                     |
| `npm run type-check`                      | TypeScript `tsc --noEmit`.                              |
| `npm run lint`, `lint:fix`, `lint:strict` | ESLint in various modes.                                |
| `npm run lint:css`, `lint:css:fix`        | Stylelint for CSS.                                      |
| `npm run lint:md`, `lint:md:fix`          | remark-based Markdown lint/fix.                         |
| `npm run format`                          | Prettier for TS/TSX/CSS.                                |
| `npm test`, `npm run test:run`            | Vitest watch/once.                                      |
| `npm run test:e2e`                        | Playwright suite.                                       |
| `npm run validate`                        | Format → lint (TS, CSS, MD) → strict lint → type-check. |
| `npm run clean` / `npm run rebuild`       | Remove build artifacts / reinstall deps.                |

## Project Structure

```
esquisse/
├── docs/                 # Extended documentation (architecture, development, contributing)
├── src/
│   ├── main/             # Electron main process
│   ├── preload/          # contextBridge surface
│   ├── renderer/
│   │   ├── features/     # Editor, journals, entries, settings
│   │   ├── components/   # Shared UI/layout
│   │   ├── hooks/        # Shared hooks
│   │   ├── pages/        # Routed pages
│   │   └── providers/    # Context providers
│   └── shared/           # Types + IPC contracts
├── e2e/                  # Playwright specs
├── scripts/              # Utility scripts (e.g., run-type-check)
└── config files          # Vite, Forge, Tailwind, Vitest, etc.
```

Path aliases (`@features`, `@components`, `@hooks`, `@shared`, etc.) are configured in `tsconfig.json` and every Vite config to keep imports tidy.

## Tech Stack

- **Electron + Vite** for the desktop shell and HMR-ready builds.
- **React 19 + Zustand + TanStack Router** for renderer logic/state/navigation.
- **Tiptap** for the editor, **Tailwind CSS + DaisyUI** for styling.
- **sql.js (SQLite WASM)** for portable persistence.
- **i18next** for localization.
- **ESLint, Stylelint, remark, Prettier, Vitest, Playwright** for quality.

## Contributing

1. Create a feature branch (`git checkout -b feature/<name>`).
2. Implement the change with tests, updating docs/translations as needed.
3. Run `npm run validate` (and relevant test suites).
4. Commit with a descriptive message—no LLM co-author trailers.
5. Submit a PR referencing the updated docs (see `docs/contributing.md`).

## License

MIT

## Acknowledgments

- Built with [Electron Forge](https://www.electronforge.io/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide](https://lucide.dev/)
