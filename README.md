# Esquisse - Minimalist Journaling Desktop App

A feature-rich, cross-platform journaling application built with Electron, React, and TypeScript.

## Features

- **Cross-Platform**: Works on macOS, Windows, and Linux
- **Local-First**: All data stored locally using SQLite
- **Full-Text Search**: Powerful search capabilities across all your entries
- **Dark Mode**: System-aware theme support with manual override
- **Modern UI**: Built with Shadcn/ui and Tailwind CSS
- **Type-Safe**: End-to-end TypeScript for reliability
- **Offline-First**: No internet connection required

## Tech Stack

### Core

- **Electron** - Desktop app framework
- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Fast build tool

### State & Data

- **Zustand** - Lightweight state management
- **sql.js** - SQLite compiled to WebAssembly (no native dependencies!)
- **React Router** - Client-side routing

### UI & Styling

- **Tailwind CSS** - Utility-first CSS
- **Shadcn/ui** - High-quality React components
- **Lucide React** - Beautiful icons

### Development Tools

- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Husky** - Git hooks
- **Lint-staged** - Run linters on staged files
- **Vitest** - Unit testing
- **Playwright** - E2E testing
- **React Testing Library** - Component testing

## Project Structure

The project follows a **feature-first architecture** for scalability and maintainability:

```
esquisse/
├── src/
│   ├── main/                    # Electron main process (Node.js)
│   │   ├── core/               # Core functionality
│   │   │   └── window/         # Window management (config, CSP, lifecycle, IPC)
│   │   ├── modules/            # Domain-specific IPC handlers
│   │   │   ├── journal/        # Journal IPC handlers
│   │   │   ├── entry/          # Entry IPC handlers
│   │   │   └── settings/       # Settings IPC handlers
│   │   ├── database/           # SQLite database layer
│   │   │   ├── index.ts        # Database initialization
│   │   │   ├── schema.sql      # Database schema
│   │   │   ├── journals.ts     # Journal CRUD operations
│   │   │   ├── entries.ts      # Entry CRUD operations
│   │   │   └── settings.ts     # Settings persistence
│   │   ├── services/           # Business logic layer (future)
│   │   └── index.ts            # Main process entry point
│   │
│   ├── preload/                # Preload scripts (bridge)
│   │   ├── api/                # Modular API by domain
│   │   │   ├── journal.api.ts  # Journal API handlers
│   │   │   ├── entry.api.ts    # Entry API handlers
│   │   │   ├── settings.api.ts # Settings API handlers
│   │   │   ├── window.api.ts   # Window API handlers
│   │   │   └── index.ts        # API aggregation
│   │   └── index.ts            # Preload entry point
│   │
│   ├── renderer/               # React application (browser)
│   │   ├── features/           # Feature-first organization
│   │   │   ├── editor/         # Editor feature
│   │   │   │   ├── components/ # Editor-specific components
│   │   │   │   ├── hooks/      # Editor-specific hooks
│   │   │   │   ├── styles/     # Editor styles
│   │   │   │   ├── extensions/ # Tiptap extensions
│   │   │   │   ├── constants.ts
│   │   │   │   ├── types.ts
│   │   │   │   └── Editor.tsx
│   │   │   ├── journals/       # Journals feature
│   │   │   │   ├── journals.store.ts
│   │   │   │   └── components/
│   │   │   ├── entries/        # Entries feature
│   │   │   │   ├── entries.store.ts
│   │   │   │   └── components/
│   │   │   └── settings/       # Settings feature
│   │   │       ├── settings.store.ts
│   │   │       └── components/
│   │   ├── components/         # Shared components
│   │   │   ├── ui/             # Shadcn/ui components
│   │   │   └── layout/         # Layout components
│   │   ├── providers/          # React context providers
│   │   ├── hooks/              # Shared React hooks
│   │   ├── pages/              # Page components (for routing)
│   │   ├── lib/                # Utilities
│   │   ├── App.tsx             # Root component
│   │   └── index.tsx           # Renderer entry point
│   │
│   ├── shared/                 # Shared code across processes
│   │   ├── types/              # Domain type definitions
│   │   │   ├── journal.types.ts
│   │   │   ├── entry.types.ts
│   │   │   └── settings.types.ts
│   │   └── ipc/                # IPC definitions
│   │       ├── channels.ts     # IPC channel constants
│   │       └── api.types.ts    # ElectronAPI interface
│   │
│   ├── test/                   # Test utilities
│   │   ├── fixtures/           # Test fixtures
│   │   └── mocks/              # Test mocks
│   │
│   └── index.css               # Global styles
│
├── e2e/                        # End-to-end tests
├── .husky/                     # Git hooks
├── CLAUDE.md                   # AI assistant instructions
├── AGENTS.md                   # Architecture documentation for AI agents
├── forge.config.ts             # Electron Forge configuration
├── vite.*.config.ts            # Vite configurations
├── vitest.config.ts            # Vitest configuration
├── tsconfig.json               # TypeScript configuration
└── package.json                # Dependencies and scripts
```

### Path Aliases

The project uses TypeScript path aliases for cleaner imports:

```typescript
// Instead of: import { Editor } from '../../../features/editor/Editor'
import { Editor } from '@features/editor';

// Available aliases:
import { ... } from '@features/*';     // Renderer features
import { ... } from '@components/*';   // Shared components
import { ... } from '@ui/*';           // UI components
import { ... } from '@layout/*';       // Layout components
import { ... } from '@hooks/*';        // Shared hooks
import { ... } from '@providers/*';    // React providers
import { ... } from '@shared/*';       // Shared types/IPC
import { ... } from '@main/*';         // Main process code
import { ... } from '@preload/*';      // Preload code
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository

```bash
git clone <your-repo-url>
cd esquisse
```

2. Install dependencies

```bash
npm install
```

3. Set up environment variables

```bash
cp .env.example .env
```

### Development

Start the development server:

```bash
npm start
```

This will:

- Start Vite dev server for hot reloading
- Launch the Electron app
- Open DevTools automatically

### Building

Build the application for your platform:

```bash
npm run make
```

Package without creating installers:

```bash
npm run package
```

## Available Scripts

### Development

- `npm start` - Start Electron app in development mode with hot reload (Vite HMR)
- `npm run type-check` - Run TypeScript type checking without emitting files

### Code Quality

- `npm run lint` - Run ESLint on TypeScript files
- `npm run lint:fix` - Auto-fix ESLint errors where possible
- `npm run lint:strict` - Run ESLint with zero warnings allowed (fails on any warning, useful for CI/CD)
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting without modifying files

### Testing

- `npm test` - Run unit tests in watch mode with Vitest
- `npm run test:run` - Run unit tests once (useful for CI or pre-commit)
- `npm run test:ui` - Open Vitest UI for interactive test debugging
- `npm run test:coverage` - Run tests with coverage reporting (generates coverage report)
- `npm run test:e2e` - Run end-to-end tests with Playwright

### Building & Distribution

- `npm run package` - Package the app without creating installers
- `npm run make` - Create platform-specific distributables (DMG for macOS, EXE for Windows, etc.)
- `npm run publish` - Publish the app (requires configuration)

### Maintenance

- `npm run clean` - Remove all build artifacts and caches (.vite, out, dist, node_modules/.vite)
- `npm run rebuild` - Clean and reinstall dependencies from scratch (useful when dependencies act weird)

## Architecture

### Feature-First Design

The application is organized by **features** rather than technical layers, promoting:

- **Scalability**: Easy to add new features without restructuring
- **Maintainability**: Related code grouped together
- **Team collaboration**: Clear ownership boundaries
- **Code discovery**: Intuitive navigation

Each feature contains:

- Components (UI)
- Hooks (logic)
- Stores (state)
- Types (interfaces)
- Styles (CSS)

### Multi-Process Architecture

Electron apps run in three separate processes:

1. **Main Process** (`src/main/`)
   - Node.js environment with filesystem access
   - Modular architecture: `core/`, `modules/`, `database/`
   - Domain-specific IPC handlers

2. **Preload Script** (`src/preload/`)
   - Bridges main ↔ renderer securely
   - Modular API exports by domain

3. **Renderer Process** (`src/renderer/`)
   - React application in browser context
   - Feature-first organization
   - No direct Node.js access (security)

### IPC Communication

Type-safe IPC communication flow:

1. **Define Types**: `src/shared/types/` and `src/shared/ipc/`
2. **Main Handler**: `src/main/modules/{domain}/{domain}.ipc.ts`
3. **Preload API**: `src/preload/api/{domain}.api.ts`
4. **Renderer Usage**: `window.api.*` with full TypeScript support

Example:

```typescript
// Renderer
const journal = await window.api.createJournal({ name: 'My Journal' });

// Full type safety throughout the chain
```

### Database Schema

- **Journals**: Top-level containers for entries
- **Entries**: Individual journal entries with optional title, content, and tags
- **Settings**: User preferences (theme, auto-save, etc.)
- **Full-Text Search**: Powered by SQLite LIKE queries (FTS5 not available in sql.js)

### State Management

Zustand stores provide reactive state management, organized by feature:

- **`features/journals/journals.store.ts`**: Journal management
- **`features/entries/entries.store.ts`**: Entry management
- **`features/settings/settings.store.ts`**: User preferences

Each store:

- Calls `window.api.*` for IPC communication
- Manages loading states and errors
- Provides reactive state to components

## Adding New Features

### Adding a New Feature

To add a new feature (e.g., "tags"):

1. **Create feature folder**: `src/renderer/features/tags/`
2. **Add domain types**: `src/shared/types/tags.types.ts`
3. **Add IPC definitions**: Update `src/shared/ipc/channels.ts`
4. **Implement main handler**: `src/main/modules/tags/tags.ipc.ts`
5. **Create preload API**: `src/preload/api/tags.api.ts`
6. **Build feature components**: In `features/tags/components/`
7. **Create store**: `features/tags/tags.store.ts`
8. **Export from barrel**: `features/tags/index.ts`

### Adding Shadcn/ui Components

```bash
npx shadcn@latest add button
npx shadcn@latest add card
# etc.
```

Components will be added to `src/renderer/components/ui/`

### Adding IPC Channels

1. **Define types**: `src/shared/types/{domain}.types.ts`
2. **Add channel**: `src/shared/ipc/channels.ts`
3. **Update API interface**: `src/shared/ipc/api.types.ts`
4. **Implement main handler**: `src/main/modules/{domain}/{domain}.ipc.ts`
5. **Create preload API**: `src/preload/api/{domain}.api.ts`
6. **Use in renderer**: `window.api.*`

### Adding Routes (Future)

When adding React Router:

1. Create page components in `src/renderer/pages/`
2. Import features into pages
3. Define routes in main App component

### Database Migrations

Currently using SQL schema file. For migrations:

1. Update `src/main/database/schema.sql`
2. Add migration logic in `src/main/database/index.ts`
3. Version your schema changes

## Testing

### Unit Tests

Tests are located next to the code they test:

```typescript
// src/renderer/components/Button.test.tsx
import { render } from '@testing-library/react';
import { Button } from './Button';

test('renders button', () => {
  const { getByText } = render(<Button>Click me</Button>);
  expect(getByText('Click me')).toBeInTheDocument();
});
```

### E2E Tests

Located in `e2e/` directory using Playwright.

## Contributing

1. Create a feature branch
2. Make your changes
3. Ensure tests pass: `npm run test:run`
4. Ensure linting passes: `npm run lint`
5. Format code: `npm run format`
6. Commit (pre-commit hooks will run automatically)
7. Push and create a pull request

## License

MIT

## Acknowledgments

- Built with [Electron Forge](https://www.electronforge.io/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide](https://lucide.dev/)
