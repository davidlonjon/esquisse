# Development Workflow

Use this guide to set up the environment, run quality gates, and ship changes confidently.

## Requirements

- Node.js 18+
- npm 10+
- macOS, Windows, or Linux with access to Electron prerequisites

## Installation

```bash
git clone https://github.com/<owner>/esquisse.git
cd esquisse
npm install
cp .env.example .env
```

## Common Commands

| Task           | Command                |
| -------------- | ---------------------- |
| Start dev app  | `npm start`            |
| Type-check     | `npm run type-check`   |
| ESLint fix     | `npm run lint:fix`     |
| CSS lint fix   | `npm run lint:css:fix` |
| Markdown lint  | `npm run lint:md`      |
| Run tests once | `npm run test:run`     |
| Watch tests    | `npm test`             |
| E2E tests      | `npm run test:e2e`     |
| Package app    | `npm run make`         |
| Cleanup        | `npm run clean`        |
| Full gate      | `npm run validate`     |

`npm run validate` executes formatting, ESLint, Stylelint, Markdown lint, strict lint, and type-checking in sequence. Run it before pushing.

## Git Workflow

1. Create a descriptive branch (e.g., `feature/tags-filter`).
2. Make focused commits; keep each change set reviewable.
3. Husky runs lint-staged (ESLint, Stylelint, remark, type-check script) on staged files.
4. Never add LLM co-author trailers; only humans belong in commit metadata.
5. Update documentation (README, `docs/`, translation files) when behavior changes.

## Coding Conventions

- Use the service layer under `src/renderer/services` for all IPC calls; stores/hooks should never import `window.api` directly.
- Keep async/business logic inside services or custom hooks and keep React components presentational (<200 lines).
- When consuming Zustand stores, rely on selectors and avoid `useStore.getState()` from components unless wrapped in a helper.

## Testing Strategy

- **Unit/UI tests**: Vitest + React Testing Library. Co-locate `*.test.ts(x)` with sources.
- **Integration/E2E**: Playwright scripts under `e2e/`. Use them for journal CRUD, settings flows, and regression coverage on keyboard shortcuts.
- **Manual QA**: Verify macOS `⌘` shortcuts, modal focus traps, and offline behavior before releases.

## Releasing

1. Run `npm run validate`.
2. Execute `npm run make` for platform installers or `npm run package` for unpackaged bundles.
3. Smoke-test the generated app.
4. Draft release notes that summarize new features, fixes, and migration steps.

## Documentation Expectations

- Keep README and the `docs/` folder accurate when features, commands, or workflows change.
- If a change impacts setup, IPC flow, or architecture decisions, update `docs/architecture.md`.
- For workflow/tooling updates, edit `docs/development.md` (this file).
- Mention documentation updates in PR descriptions to aid reviewers.
