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

```
esquisse/
├── src/
│   ├── main/              # Electron main process
│   │   ├── database/      # SQLite database layer
│   │   │   ├── index.ts   # Database initialization
│   │   │   ├── schema.sql # Database schema
│   │   │   ├── journals.ts # Journal CRUD operations
│   │   │   ├── entries.ts  # Entry CRUD operations
│   │   │   └── settings.ts # Settings persistence
│   │   ├── ipc/           # IPC handlers (future)
│   │   └── index.ts       # Main process entry point
│   │
│   ├── preload/           # Preload scripts
│   │   └── index.ts       # IPC bridge (contextBridge)
│   │
│   ├── renderer/          # React application
│   │   ├── components/    # React components
│   │   │   ├── ui/        # Shadcn/ui components
│   │   │   ├── features/  # Feature-specific components
│   │   │   └── theme-provider.tsx # Theme management
│   │   ├── pages/         # Page components
│   │   ├── store/         # Zustand stores
│   │   │   ├── journals.ts
│   │   │   ├── entries.ts
│   │   │   └── settings.ts
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Utilities
│   │   │   └── utils.ts   # Helper functions (cn, etc.)
│   │   ├── types/         # TypeScript types
│   │   ├── test/          # Test utilities
│   │   ├── App.tsx        # Root component
│   │   └── index.tsx      # Renderer entry point
│   │
│   ├── shared/            # Shared code between main/renderer
│   │   └── ipc-types.ts   # IPC type definitions
│   │
│   └── index.css          # Global styles
│
├── e2e/                   # End-to-end tests
├── .husky/                # Git hooks
├── forge.config.ts        # Electron Forge configuration
├── vite.*.config.ts       # Vite configurations
├── vitest.config.ts       # Vitest configuration
├── playwright.config.ts   # Playwright configuration
├── tsconfig.json          # TypeScript configuration
├── tailwind.config.js     # Tailwind configuration
├── components.json        # Shadcn/ui configuration
└── package.json           # Dependencies and scripts
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

### IPC Communication

The app uses a type-safe IPC layer for communication between the main and renderer processes:

1. **Shared Types** (`src/shared/ipc-types.ts`): Define all IPC channels and data types
2. **Preload Script** (`src/preload/index.ts`): Exposes safe API to renderer via contextBridge
3. **Main Handlers** (`src/main/index.ts`): Implements IPC handlers that interact with the database
4. **Renderer Usage**: Access via `window.api.*` with full TypeScript support

### Database Schema

- **Journals**: Top-level containers for entries
- **Entries**: Individual journal entries with optional title, content, and tags
- **Settings**: User preferences (theme, auto-save, etc.)
- **Full-Text Search**: Powered by SQLite FTS5 for fast searching

### State Management

Zustand stores provide reactive state management:

- **Journal Store**: Manages journals and current selection
- **Entry Store**: Manages entries and current editing state
- **Settings Store**: User preferences with persistence

## Adding New Features

### Adding Shadcn/ui Components

```bash
npx shadcn@latest add button
npx shadcn@latest add card
# etc.
```

Components will be added to `src/renderer/components/ui/`

### Adding IPC Channels

1. Define channel and types in `src/shared/ipc-types.ts`
2. Add handler in `src/main/index.ts`
3. Expose in preload script `src/preload/index.ts`
4. Use in renderer via `window.api.*`

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
