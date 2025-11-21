# Esquisse App Update Strategy

> Comprehensive guide for implementing automatic updates in Esquisse while maintaining privacy-first principles.
>
> **Last Updated:** November 2025

## Executive Summary

### Recommended Approach

**electron-updater + GitHub Releases**

- **Rationale:** Free, privacy-respecting, excellent UX, industry-standard solution
- **Implementation:** 8-16 hours development time
- **Cost:** $99/year (Apple Developer for macOS code signing)
- **Privacy:** Minimal data collection (version, platform only)
- **User Experience:** Opt-in automatic updates with full user control

### Key Principles

1. **Privacy First:** Opt-in by default, minimal data collection, no tracking
2. **User Control:** Never force updates, respect user workflow
3. **Transparency:** Clear communication about what data is sent
4. **Offline Support:** App works fully without update checks
5. **Cross-Platform:** Consistent experience on macOS, Windows, Linux

---

## Table of Contents

1. [Current Setup Analysis](#1-current-setup-analysis)
2. [Update Mechanisms Overview](#2-update-mechanisms-overview)
3. [Recommended Implementation](#3-recommended-implementation)
4. [Code Signing Requirements](#4-code-signing-requirements)
5. [CI/CD with GitHub Actions](#5-cicd-with-github-actions)
6. [Privacy-First Configuration](#6-privacy-first-configuration)
7. [User Experience Guidelines](#7-user-experience-guidelines)
8. [Distribution Channels](#8-distribution-channels)
9. [Testing & Quality Assurance](#9-testing--quality-assurance)
10. [Platform-Specific Considerations](#10-platform-specific-considerations)
11. [Best Practices](#11-best-practices)
12. [Troubleshooting](#12-troubleshooting)
13. [Implementation Roadmap](#13-implementation-roadmap)

---

## 1. Current Setup Analysis

### 1.1 Existing Configuration

**Electron Forge Setup:**

- **Version:** 7.10.2
- **Makers Configured:**
  - Squirrel (Windows installer)
  - ZIP (macOS, for auto-updates)
  - RPM (Linux)
  - DEB (Linux)
- **Missing:** DMG maker (recommended for macOS manual distribution)
- **Publishers:** None configured yet

**Current State:**

- ✅ ASAR packaging enabled
- ✅ Electron Fuses configured (security)
- ❌ No auto-update mechanism
- ❌ No code signing
- ❌ No CI/CD pipeline
- ❌ No published releases

**File Locations:**

```
/Users/davidlonjon/projects/personal/esquisse/
├── forge.config.ts                # Electron Forge configuration
├── package.json                   # Dependencies and scripts
└── src/
    └── main/
        └── index.ts              # App entry point (where updater will integrate)
```

### 1.2 What We Need to Add

**Dependencies:**

```json
{
  "dependencies": {
    "electron-updater": "^6.1.0"
  },
  "devDependencies": {
    "@electron-forge/publisher-github": "^7.10.2",
    "@electron-forge/maker-dmg": "^7.10.2"
  }
}
```

**New Modules:**

```
src/main/modules/updater/
├── updater.service.ts      # Core update logic
├── updater.ipc.ts          # IPC handlers
└── updater.types.ts        # TypeScript types

src/shared/types/
└── updater.types.ts        # Shared types

src/renderer/features/updater/
├── updater.store.ts        # Zustand store
└── UpdateNotification.tsx  # UI component
```

**Configuration Files:**

```
.github/workflows/
└── release.yml             # CI/CD pipeline

entitlements.plist          # macOS code signing entitlements
```

---

## 2. Update Mechanisms Overview

### 2.1 Available Solutions

#### A. electron-updater (Recommended)

**Description:** Most popular cross-platform auto-updater for Electron apps.

**Key Features:**

- Cross-platform (macOS, Windows, Linux)
- Multiple update sources (GitHub, S3, generic HTTP)
- Code signature validation
- Delta updates support
- Progress tracking
- Staged rollouts

**Privacy:**

- ⭐⭐⭐⭐ Good - Only sends version/platform to your chosen server
- No third-party telemetry
- Full control over update infrastructure

**Setup Complexity:** ⭐⭐⭐ Medium

**Cost:** Free (hosting depends on provider)

**Verdict:** ✅ **Best for Esquisse**

---

#### B. update-electron-app

**Description:** Official Electron wrapper for auto-updates via GitHub.

**Key Features:**

- ~2 lines of code integration
- Uses update.electronjs.org service
- Automatic update checks every 10 minutes
- Only works with public GitHub repos

**Privacy:**

- ⭐⭐⭐ Fair - Routes through Electron's servers
- Less control over privacy
- Minimal telemetry

**Setup Complexity:** ⭐⭐⭐⭐⭐ Very Easy

**Cost:** Free

**Verdict:** ⚠️ **Simpler but less privacy control**

---

#### C. Electron Built-in autoUpdater

**Description:** Native module using platform-specific updaters.

**Key Features:**

- Ships with Electron
- Uses Squirrel.Mac (macOS) and Squirrel.Windows
- Requires custom update server
- Manual integration

**Privacy:**

- ⭐⭐⭐⭐ Good - Full control
- No third-party services

**Setup Complexity:** ⭐⭐ Complex

**Cost:** Free (+ server hosting)

**Verdict:** ⚡ **More work, less benefit than electron-updater**

---

#### D. Manual Updates Only

**Description:** Users manually download new versions.

**Key Features:**

- No automatic checks
- Complete user control
- Simplest implementation

**Privacy:**

- ⭐⭐⭐⭐⭐ Excellent - No automatic network requests
- Maximum privacy

**Setup Complexity:** ⭐⭐⭐⭐⭐ Trivial

**Cost:** Free

**Verdict:** ✅ **Good fallback option**

---

### 2.2 Comparison Matrix

| Feature              | electron-updater | update-electron-app | Built-in autoUpdater | Manual Only |
| -------------------- | ---------------- | ------------------- | -------------------- | ----------- |
| **Privacy**          | ⭐⭐⭐⭐         | ⭐⭐⭐              | ⭐⭐⭐⭐             | ⭐⭐⭐⭐⭐  |
| **Setup Complexity** | Medium           | Very Easy           | Complex              | Trivial     |
| **User Experience**  | Excellent        | Excellent           | Good                 | Poor        |
| **Cross-platform**   | ✅               | ✅                  | ✅                   | ✅          |
| **Code Signing**     | ✅ Validates     | ✅ Validates        | ✅ Validates         | N/A         |
| **Cost**             | Free             | Free                | Free                 | Free        |
| **Control**          | High             | Medium              | High                 | Complete    |
| **Maintenance**      | Low              | Very Low            | Medium               | None        |
| **Recommendation**   | ✅ Primary       | ⚠️ Alternative      | ❌ Overkill          | ✅ Fallback |

---

## 3. Recommended Implementation

### 3.1 Installation

```bash
# Install dependencies
npm install electron-updater --save

# Install Electron Forge plugins
npm install @electron-forge/publisher-github --save-dev
npm install @electron-forge/maker-dmg --save-dev

# Rebuild native modules (important!)
npm run rebuild:native
```

### 3.2 Configure Electron Forge

Update `forge.config.ts`:

```typescript
import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerZIP } from '@electron-forge/maker-zip';
import { MakerDeb } from '@electron-forge/maker-deb';
import { MakerRpm } from '@electron-forge/maker-rpm';
import { MakerDMG } from '@electron-forge/maker-dmg';
import { VitePlugin } from '@electron-forge/plugin-vite';
import { FusesPlugin } from '@electron-forge/plugin-fuses';
import { FuseV1Options, FuseVersion } from '@electron/fuses';
import { PublisherGitHub } from '@electron-forge/publisher-github';

const config: ForgeConfig = {
  packagerConfig: {
    asar: true,

    // macOS Code Signing (required for auto-updates)
    osxSign: {
      identity: process.env.APPLE_IDENTITY,
      hardenedRuntime: true,
      entitlements: 'entitlements.plist',
      'entitlements-inherit': 'entitlements.plist',
      'signature-flags': 'library',
    },

    // macOS Notarization (required for Gatekeeper)
    osxNotarize: process.env.APPLE_ID
      ? {
          tool: 'notarytool',
          appleId: process.env.APPLE_ID,
          appleIdPassword: process.env.APPLE_APP_PASSWORD,
          teamId: process.env.APPLE_TEAM_ID,
        }
      : undefined,

    // App metadata
    appBundleId: 'com.esquisse.app',
    appCategoryType: 'public.app-category.productivity',
    icon: './assets/icon',
  },

  rebuildConfig: {},

  makers: [
    // Windows - Squirrel installer with auto-update support
    new MakerSquirrel({
      // Optional: Windows code signing
      certificateFile: process.env.WINDOWS_CERT_FILE,
      certificatePassword: process.env.WINDOWS_CERT_PASSWORD,
    }),

    // macOS - ZIP (required for auto-update)
    new MakerZIP(
      {
        macUpdateManifestBaseUrl:
          'https://github.com/yourusername/esquisse/releases/latest/download/',
      },
      ['darwin']
    ),

    // macOS - DMG (for manual distribution, user-friendly)
    new MakerDMG(
      {
        name: 'Esquisse',
        icon: './assets/icon.icns',
        overwrite: true,
      },
      ['darwin']
    ),

    // Linux
    new MakerRpm({}),
    new MakerDeb({
      options: {
        maintainer: 'Your Name',
        homepage: 'https://github.com/yourusername/esquisse',
      },
    }),
  ],

  // Publishers (for automated releases)
  publishers: [
    new PublisherGitHub({
      repository: {
        owner: 'yourusername',
        name: 'esquisse',
      },
      prerelease: false,
      draft: true, // Create draft releases for review before publishing
      generateReleaseNotes: true,
    }),
  ],

  plugins: [
    new VitePlugin({
      build: [
        {
          entry: 'src/main/index.ts',
          config: 'vite.main.config.ts',
          target: 'main',
        },
        {
          entry: 'src/preload/index.ts',
          config: 'vite.preload.config.ts',
          target: 'preload',
        },
      ],
      renderer: [
        {
          name: 'main_window',
          config: 'vite.renderer.config.ts',
        },
      ],
    }),
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};

export default config;
```

### 3.3 Create macOS Entitlements File

Create `entitlements.plist` in project root:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>com.apple.security.cs.allow-jit</key>
    <true/>
    <key>com.apple.security.cs.allow-unsigned-executable-memory</key>
    <true/>
    <key>com.apple.security.cs.disable-library-validation</key>
    <true/>
    <key>com.apple.security.network.client</key>
    <true/>
</dict>
</plist>
```

### 3.4 Implement Updater Service

Create `src/main/modules/updater/updater.service.ts`:

```typescript
import { autoUpdater } from 'electron-updater';
import { BrowserWindow, dialog } from 'electron';
import log from 'electron-log';
import type { UpdateInfo, ProgressInfo } from 'electron-updater';

interface UpdateStatus {
  status:
    | 'idle'
    | 'checking'
    | 'available'
    | 'not-available'
    | 'downloading'
    | 'downloaded'
    | 'error';
  info?: UpdateInfo;
  progress?: ProgressInfo;
  error?: string;
}

export class UpdaterService {
  private mainWindow: BrowserWindow | null = null;
  private manualCheckInProgress = false;

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;
    this.setupAutoUpdater();
  }

  private setupAutoUpdater(): void {
    // Configure logging
    autoUpdater.logger = log;
    log.transports.file.level = 'info';

    // Configure auto-updater behavior
    autoUpdater.autoDownload = false; // User must consent
    autoUpdater.autoInstallOnAppQuit = false; // User must confirm

    // Allow downgrade (for testing or rollback)
    autoUpdater.allowDowngrade = true;

    // Event: Checking for updates
    autoUpdater.on('checking-for-update', () => {
      log.info('Checking for updates...');
      this.sendToRenderer({
        status: 'checking',
      });
    });

    // Event: Update available
    autoUpdater.on('update-available', (info: UpdateInfo) => {
      log.info('Update available:', info);
      this.sendToRenderer({
        status: 'available',
        info,
      });
      this.promptUserToDownload(info);
    });

    // Event: Update not available
    autoUpdater.on('update-not-available', (info: UpdateInfo) => {
      log.info('Update not available:', info);
      this.sendToRenderer({
        status: 'not-available',
        info,
      });

      // Only show dialog if user manually checked
      if (this.manualCheckInProgress) {
        this.showNoUpdateDialog();
        this.manualCheckInProgress = false;
      }
    });

    // Event: Error occurred
    autoUpdater.on('error', (err: Error) => {
      log.error('Auto-updater error:', err);
      this.sendToRenderer({
        status: 'error',
        error: err.message,
      });

      if (this.manualCheckInProgress) {
        this.showErrorDialog(err);
        this.manualCheckInProgress = false;
      }
    });

    // Event: Download progress
    autoUpdater.on('download-progress', (progress: ProgressInfo) => {
      log.info(`Download progress: ${progress.percent.toFixed(2)}%`);
      this.sendToRenderer({
        status: 'downloading',
        progress,
      });
    });

    // Event: Update downloaded
    autoUpdater.on('update-downloaded', (info: UpdateInfo) => {
      log.info('Update downloaded:', info);
      this.sendToRenderer({
        status: 'downloaded',
        info,
      });
      this.promptUserToInstall(info);
    });
  }

  /**
   * Check for updates (manual trigger from user)
   */
  public async checkForUpdates(): Promise<void> {
    log.info('Manual update check triggered');
    this.manualCheckInProgress = true;

    try {
      const result = await autoUpdater.checkForUpdates();
      log.info('Update check result:', result);
    } catch (error) {
      log.error('Failed to check for updates:', error);
      this.manualCheckInProgress = false;
      throw error;
    }
  }

  /**
   * Check for updates quietly (background check on startup)
   */
  public async checkForUpdatesQuietly(): Promise<void> {
    log.info('Background update check triggered');
    this.manualCheckInProgress = false;

    try {
      await autoUpdater.checkForUpdates();
    } catch (error) {
      log.error('Background update check failed (non-fatal):', error);
      // Fail silently for background checks
    }
  }

  /**
   * Download the available update
   */
  public async downloadUpdate(): Promise<void> {
    log.info('Downloading update...');
    try {
      await autoUpdater.downloadUpdate();
    } catch (error) {
      log.error('Failed to download update:', error);
      throw error;
    }
  }

  /**
   * Install the downloaded update and restart app
   */
  public quitAndInstall(): void {
    log.info('Quitting and installing update...');
    autoUpdater.quitAndInstall(false, true);
  }

  /**
   * Prompt user to download available update
   */
  private promptUserToDownload(info: UpdateInfo): void {
    if (!this.mainWindow || this.mainWindow.isDestroyed()) {
      return;
    }

    const options = {
      type: 'info' as const,
      title: 'Update Available',
      message: `Esquisse ${info.version} is available`,
      detail: `You are currently running version ${autoUpdater.currentVersion.version}.\n\nWould you like to download the update now?`,
      buttons: ['Download', 'View Release Notes', 'Later'],
      defaultId: 0,
      cancelId: 2,
    };

    dialog.showMessageBox(this.mainWindow, options).then((result) => {
      if (result.response === 0) {
        // Download
        this.downloadUpdate();
      } else if (result.response === 1) {
        // View release notes
        const { shell } = require('electron');
        const repoUrl = 'https://github.com/yourusername/esquisse';
        shell.openExternal(`${repoUrl}/releases/tag/v${info.version}`);
      }
      // Otherwise: user chose "Later", do nothing
    });
  }

  /**
   * Prompt user to install downloaded update
   */
  private promptUserToInstall(info: UpdateInfo): void {
    if (!this.mainWindow || this.mainWindow.isDestroyed()) {
      return;
    }

    const options = {
      type: 'info' as const,
      title: 'Update Ready',
      message: 'Update downloaded successfully',
      detail: `Esquisse ${info.version} is ready to install.\n\nThe app will restart to complete the installation. Make sure any unsaved work is saved.`,
      buttons: ['Restart Now', 'Later'],
      defaultId: 0,
      cancelId: 1,
    };

    dialog.showMessageBox(this.mainWindow, options).then((result) => {
      if (result.response === 0) {
        // Restart and install
        this.quitAndInstall();
      }
    });
  }

  /**
   * Show "no update available" dialog
   */
  private showNoUpdateDialog(): void {
    if (!this.mainWindow || this.mainWindow.isDestroyed()) {
      return;
    }

    dialog.showMessageBox(this.mainWindow, {
      type: 'info',
      title: 'No Updates Available',
      message: 'You are running the latest version',
      detail: `Current version: ${autoUpdater.currentVersion.version}`,
      buttons: ['OK'],
    });
  }

  /**
   * Show error dialog
   */
  private showErrorDialog(error: Error): void {
    if (!this.mainWindow || this.mainWindow.isDestroyed()) {
      return;
    }

    dialog.showMessageBox(this.mainWindow, {
      type: 'error',
      title: 'Update Check Failed',
      message: 'An error occurred while checking for updates',
      detail: error.message,
      buttons: ['OK'],
    });
  }

  /**
   * Send update status to renderer process
   */
  private sendToRenderer(status: UpdateStatus): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('updater:status', status);
    }
  }
}
```

### 3.5 Create IPC Handlers

Create `src/main/modules/updater/updater.ipc.ts`:

```typescript
import { ipcMain } from 'electron';
import type { UpdaterService } from './updater.service';

export function registerUpdaterHandlers(updaterService: UpdaterService): void {
  // Check for updates (manual)
  ipcMain.handle('updater:check-for-updates', async () => {
    await updaterService.checkForUpdates();
  });

  // Download update
  ipcMain.handle('updater:download-update', async () => {
    await updaterService.downloadUpdate();
  });

  // Install update and restart
  ipcMain.handle('updater:quit-and-install', () => {
    updaterService.quitAndInstall();
  });
}
```

### 3.6 Update Shared Types

Create `src/shared/types/updater.types.ts`:

```typescript
export interface UpdateStatus {
  status:
    | 'idle'
    | 'checking'
    | 'available'
    | 'not-available'
    | 'downloading'
    | 'downloaded'
    | 'error';
  currentVersion?: string;
  latestVersion?: string;
  releaseNotes?: string;
  downloadProgress?: number;
  error?: string;
}

export interface UpdateSettings {
  autoCheckEnabled: boolean;
  autoDownloadEnabled: boolean;
  checkFrequency: 'startup' | 'daily' | 'weekly' | 'never';
  notifyWhenAvailable: boolean;
  lastCheckDate: string | null;
}
```

Update `src/shared/ipc/channels.ts`:

```typescript
export const IPC_CHANNELS = {
  // ... existing channels

  UPDATER_CHECK: 'updater:check-for-updates',
  UPDATER_DOWNLOAD: 'updater:download-update',
  UPDATER_INSTALL: 'updater:quit-and-install',
  UPDATER_STATUS: 'updater:status',
} as const;
```

Update `src/shared/ipc/api.types.ts`:

```typescript
export interface UpdaterAPI {
  checkForUpdates: () => Promise<void>;
  downloadUpdate: () => Promise<void>;
  quitAndInstall: () => Promise<void>;
  onStatusChange: (callback: (status: UpdateStatus) => void) => () => void;
}
```

### 3.7 Integrate in Main Process

Update `src/main/index.ts`:

```typescript
import { UpdaterService } from './modules/updater/updater.service';
import { registerUpdaterHandlers } from './modules/updater/updater.ipc';

async function bootstrap(): Promise<void> {
  try {
    await app.whenReady();
    await initializeDatabaseWithRetry();

    const mainWindow = createMainWindow(MAIN_WINDOW_VITE_DEV_SERVER_URL, MAIN_WINDOW_VITE_NAME);

    // Initialize updater (only in production)
    if (!isDevelopment()) {
      const updaterService = new UpdaterService(mainWindow);
      registerUpdaterHandlers(updaterService);

      // Optional: Check for updates on startup if user has enabled it
      // This should read from user settings in database
      const settings = await getUpdateSettings(); // Implement this
      if (settings.autoCheckEnabled) {
        // Wait a few seconds after app starts to avoid blocking startup
        setTimeout(() => {
          updaterService.checkForUpdatesQuietly();
        }, 5000);
      }
    }

    registerIPCHandlers();
  } catch (error) {
    logger.error('Bootstrap failure', { error: (error as Error).message });
    app.quit();
  }
}

function isDevelopment(): boolean {
  return !!process.env.VITE_DEV_SERVER_URL;
}
```

### 3.8 Create Preload API

Create `src/preload/api/updater.api.ts`:

```typescript
import { ipcRenderer, IpcRendererEvent } from 'electron';
import type { UpdaterAPI } from '@shared/ipc/api.types';
import type { UpdateStatus } from '@shared/types/updater.types';

export const updaterAPI: UpdaterAPI = {
  checkForUpdates: () => {
    return ipcRenderer.invoke('updater:check-for-updates');
  },

  downloadUpdate: () => {
    return ipcRenderer.invoke('updater:download-update');
  },

  quitAndInstall: () => {
    return ipcRenderer.invoke('updater:quit-and-install');
  },

  onStatusChange: (callback: (status: UpdateStatus) => void) => {
    const listener = (_event: IpcRendererEvent, status: UpdateStatus) => {
      callback(status);
    };

    ipcRenderer.on('updater:status', listener);

    // Return cleanup function
    return () => {
      ipcRenderer.removeListener('updater:status', listener);
    };
  },
};
```

Update `src/preload/api/index.ts`:

```typescript
import { updaterAPI } from './updater.api';
// ... other APIs

export const api = {
  // ... existing APIs
  updater: updaterAPI,
};
```

### 3.9 Create Renderer Store

Create `src/renderer/features/updater/updater.store.ts`:

```typescript
import { create } from 'zustand';
import type { UpdateStatus, UpdateSettings } from '@shared/types/updater.types';

interface UpdaterStore {
  status: UpdateStatus;
  settings: UpdateSettings;

  // Actions
  checkForUpdates: () => Promise<void>;
  downloadUpdate: () => Promise<void>;
  installUpdate: () => Promise<void>;
  updateSettings: (settings: Partial<UpdateSettings>) => Promise<void>;

  // Internal
  setStatus: (status: UpdateStatus) => void;
}

export const useUpdaterStore = create<UpdaterStore>((set, get) => ({
  status: {
    status: 'idle',
  },

  settings: {
    autoCheckEnabled: false,
    autoDownloadEnabled: false,
    checkFrequency: 'weekly',
    notifyWhenAvailable: true,
    lastCheckDate: null,
  },

  checkForUpdates: async () => {
    try {
      await window.api.updater.checkForUpdates();

      // Update last check date
      const newSettings = {
        ...get().settings,
        lastCheckDate: new Date().toISOString(),
      };
      await window.api.settings.set('update.settings', JSON.stringify(newSettings));
      set({ settings: newSettings });
    } catch (error) {
      console.error('Failed to check for updates:', error);
    }
  },

  downloadUpdate: async () => {
    try {
      await window.api.updater.downloadUpdate();
    } catch (error) {
      console.error('Failed to download update:', error);
    }
  },

  installUpdate: async () => {
    try {
      await window.api.updater.quitAndInstall();
    } catch (error) {
      console.error('Failed to install update:', error);
    }
  },

  updateSettings: async (newSettings: Partial<UpdateSettings>) => {
    const updated = { ...get().settings, ...newSettings };
    await window.api.settings.set('update.settings', JSON.stringify(updated));
    set({ settings: updated });
  },

  setStatus: (status: UpdateStatus) => {
    set({ status });
  },
}));

// Set up status listener when store is created
if (window.api?.updater) {
  window.api.updater.onStatusChange((status) => {
    useUpdaterStore.getState().setStatus(status);
  });
}
```

### 3.10 Create UI Components

Create `src/renderer/features/updater/UpdateNotification.tsx`:

```typescript
import { useEffect } from 'react';
import { useUpdaterStore } from './updater.store';

export function UpdateNotification() {
  const { status, downloadUpdate, installUpdate } = useUpdaterStore();

  if (status.status === 'idle' || status.status === 'checking' || status.status === 'not-available') {
    return null;
  }

  return (
    <div className="update-notification">
      {status.status === 'available' && (
        <div className="alert alert-info">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <div className="font-bold">Update Available</div>
            <div className="text-sm">Version {status.latestVersion} is ready to download</div>
          </div>
          <button onClick={downloadUpdate} className="btn btn-sm btn-primary">
            Download
          </button>
        </div>
      )}

      {status.status === 'downloading' && (
        <div className="alert alert-info">
          <svg className="animate-spin w-6 h-6" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <div>
            <div className="font-bold">Downloading Update</div>
            <div className="text-sm">{status.downloadProgress?.toFixed(0)}% complete</div>
          </div>
        </div>
      )}

      {status.status === 'downloaded' && (
        <div className="alert alert-success">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <div>
            <div className="font-bold">Update Ready</div>
            <div className="text-sm">Restart Esquisse to install version {status.latestVersion}</div>
          </div>
          <button onClick={installUpdate} className="btn btn-sm btn-success">
            Restart Now
          </button>
        </div>
      )}

      {status.status === 'error' && (
        <div className="alert alert-error">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          <div>
            <div className="font-bold">Update Failed</div>
            <div className="text-sm">{status.error}</div>
          </div>
        </div>
      )}
    </div>
  );
}
```

### 3.11 Add to Settings Page

Update `src/renderer/pages/SettingsPage.tsx`:

```typescript
import { useUpdaterStore } from '../features/updater/updater.store';

function UpdatesSection() {
  const { status, settings, checkForUpdates, updateSettings } = useUpdaterStore();
  const appVersion = '1.0.0'; // Or get from window.api

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold">Updates</h2>

      {/* Current Version */}
      <div className="card bg-base-200">
        <div className="card-body">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-semibold">Current Version</p>
              <p className="text-sm opacity-70">{appVersion}</p>
            </div>
            <button
              onClick={checkForUpdates}
              className="btn btn-primary btn-sm"
              disabled={status.status === 'checking'}
            >
              {status.status === 'checking' ? 'Checking...' : 'Check for Updates'}
            </button>
          </div>

          {settings.lastCheckDate && (
            <p className="text-xs opacity-50 mt-2">
              Last checked: {new Date(settings.lastCheckDate).toLocaleString()}
            </p>
          )}
        </div>
      </div>

      {/* Auto-Update Settings */}
      <div className="form-control">
        <label className="label cursor-pointer">
          <span className="label-text">
            <div>
              <div className="font-semibold">Automatically check for updates</div>
              <div className="text-sm opacity-70">Check for new versions on app startup</div>
            </div>
          </span>
          <input
            type="checkbox"
            className="toggle toggle-primary"
            checked={settings.autoCheckEnabled}
            onChange={(e) => updateSettings({ autoCheckEnabled: e.target.checked })}
          />
        </label>
      </div>

      {settings.autoCheckEnabled && (
        <div className="form-control ml-8">
          <label className="label cursor-pointer">
            <span className="label-text">
              <div>
                <div className="font-semibold">Download updates automatically</div>
                <div className="text-sm opacity-70">Download in background (you'll be notified before install)</div>
              </div>
            </span>
            <input
              type="checkbox"
              className="toggle toggle-primary"
              checked={settings.autoDownloadEnabled}
              onChange={(e) => updateSettings({ autoDownloadEnabled: e.target.checked })}
            />
          </label>
        </div>
      )}

      {/* Privacy Information */}
      <div className="alert">
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div className="text-sm">
          <p className="font-semibold">Privacy & Updates</p>
          <p className="opacity-70">
            Update checks send only your app version, platform, and architecture.
            No personal data or usage analytics are collected.
          </p>
          <a href="#" className="link link-primary text-xs mt-1">Learn more about updates</a>
        </div>
      </div>
    </section>
  );
}
```

---

## 4. Code Signing Requirements

### 4.1 macOS Code Signing

**Why Required:**

- ✅ Gatekeeper will block unsigned apps on macOS 10.15+
- ✅ Auto-updates require valid code signature
- ✅ Notarization requires code signing
- ✅ Builds trust with users

#### Prerequisites

**1. Apple Developer Account**

- Cost: $99/year
- Sign up at: <https://developer.apple.com>
- Provides access to certificates and notarization

**2. Install Xcode Command Line Tools**

```bash
xcode-select --install
```

**3. Create Certificates**

1. Open Xcode → Preferences → Accounts
2. Add your Apple ID
3. Download "Developer ID Application" certificate
4. Verify certificate is installed:

```bash
security find-identity -v -p codesigning
```

Look for: `Developer ID Application: Your Name (TEAM_ID)`

#### Environment Variables

Create `.env.local` (add to `.gitignore`):

```bash
# macOS Code Signing
APPLE_ID=your-apple-id@example.com
APPLE_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx  # App-specific password
APPLE_TEAM_ID=ABCD123456
APPLE_IDENTITY="Developer ID Application: Your Name (TEAM_ID)"
```

**Generate App-Specific Password:**

1. Go to appleid.apple.com
2. Sign in
3. Security → App-Specific Passwords
4. Generate new password

#### Troubleshooting

**Issue: "Developer ID Application certificate not found"**

```bash
# List all certificates
security find-identity -v

# If missing, download from Apple Developer portal
```

**Issue: Notarization fails**

```bash
# Check notarization status
xcrun notarytool history --apple-id YOUR_APPLE_ID --team-id YOUR_TEAM_ID

# View details of specific submission
xcrun notarytool log SUBMISSION_ID --apple-id YOUR_APPLE_ID
```

### 4.2 Windows Code Signing

**Why Recommended:**

- ⚠️ SmartScreen shows warnings for unsigned apps
- ✅ Builds trust with users
- ✅ Required for enterprise distribution

#### Prerequisites

**1. Purchase Code Signing Certificate**

Options:

- **Sectigo** (formerly Comodo): ~$200/year
- **DigiCert**: ~$300/year
- **SSL.com**: ~$150/year

Certificate types:

- Standard Code Signing (requires validation)
- EV Code Signing (higher trust, USB token required)

**2. Export Certificate as PFX**

You'll receive a `.pfx` or `.p12` file with private key.

#### Environment Variables

```bash
# Windows Code Signing
WINDOWS_CERT_FILE=path/to/certificate.pfx
WINDOWS_CERT_PASSWORD=your-certificate-password
```

#### Sign Manually (Testing)

```bash
# Using signtool (Windows SDK)
signtool sign /f certificate.pfx /p password /tr http://timestamp.digicert.com /td sha256 /fd sha256 Esquisse-Setup.exe
```

### 4.3 Linux

**No code signing required** - Linux distributions don't enforce code signing for desktop apps.

**Optional: GPG Signing**

For authenticity verification:

```bash
# Create GPG key
gpg --full-generate-key

# Sign package
gpg --detach-sign --armor esquisse-1.0.0.AppImage

# Verify
gpg --verify esquisse-1.0.0.AppImage.asc
```

---

## 5. CI/CD with GitHub Actions

### 5.1 Create Release Workflow

Create `.github/workflows/release.yml`:

```yaml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: ${{ matrix.os }}

    strategy:
      matrix:
        os: [macos-latest, ubuntu-latest, windows-latest]

    steps:
      - name: Check out Git repository
        uses: actions/checkout@v4

      - name: Install Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Rebuild native modules
        run: npm run rebuild:native

      - name: Run linter
        run: npm run lint

      - name: Run type check
        run: npm run type-check

      - name: Run tests
        run: npm run test:run

      # macOS Release
      - name: Build and Publish (macOS)
        if: matrix.os == 'macos-latest'
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          APPLE_ID: ${{ secrets.APPLE_ID }}
          APPLE_APP_PASSWORD: ${{ secrets.APPLE_APP_PASSWORD }}
          APPLE_TEAM_ID: ${{ secrets.APPLE_TEAM_ID }}
          APPLE_IDENTITY: ${{ secrets.APPLE_IDENTITY }}
        run: npm run publish

      # Windows Release
      - name: Build and Publish (Windows)
        if: matrix.os == 'windows-latest'
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          CSC_LINK: ${{ secrets.WINDOWS_CERT_BASE64 }}
          CSC_KEY_PASSWORD: ${{ secrets.WINDOWS_CERT_PASSWORD }}
        run: npm run publish

      # Linux Release
      - name: Build and Publish (Linux)
        if: matrix.os == 'ubuntu-latest'
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: npm run publish
```

### 5.2 Set Up GitHub Secrets

Go to: Repository → Settings → Secrets and variables → Actions

**Required Secrets:**

```
GITHUB_TOKEN              # Auto-provided by GitHub Actions
APPLE_ID                  # Your Apple ID email
APPLE_APP_PASSWORD        # App-specific password
APPLE_TEAM_ID             # 10-character team ID
APPLE_IDENTITY            # "Developer ID Application: Name (ID)"
WINDOWS_CERT_BASE64       # Base64-encoded PFX certificate
WINDOWS_CERT_PASSWORD     # Certificate password
```

**Encode Windows Certificate:**

```bash
# macOS/Linux
base64 -i certificate.pfx -o certificate.txt

# Windows PowerShell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("certificate.pfx")) > certificate.txt
```

### 5.3 Trigger Release

```bash
# Update version in package.json
npm version minor  # or patch, major

# This creates a git tag and commit
# Push with tags
git push --follow-tags

# GitHub Actions will automatically:
# 1. Build for all platforms
# 2. Sign and notarize
# 3. Create GitHub Release (draft)
# 4. Upload assets (DMG, ZIP, EXE, AppImage, etc.)
```

### 5.4 Manual Release Process

If you prefer manual releases:

```bash
# 1. Build locally
npm run package

# 2. Test built app
# macOS: open out/Esquisse-darwin-arm64/Esquisse.app

# 3. Create distributable
npm run make

# 4. Upload to GitHub Releases manually
# - Create new release
# - Upload files from out/make/
# - electron-updater will use latest-mac.yml, latest.yml, etc.
```

---

## 6. Privacy-First Configuration

### 6.1 Default Settings

**Opt-in by default:**

```typescript
const DEFAULT_UPDATE_SETTINGS: UpdateSettings = {
  autoCheckEnabled: false, // User must enable
  autoDownloadEnabled: false, // User must enable
  checkFrequency: 'weekly', // Conservative default
  notifyWhenAvailable: true, // Show notifications when enabled
  lastCheckDate: null,
};
```

### 6.2 Data Collection Transparency

**What electron-updater sends:**

```typescript
// Update request includes:
{
  version: "1.0.0",          // Current app version
  platform: "darwin",        // darwin, win32, or linux
  arch: "arm64",             // x64, arm64, ia32
  channel: "latest"          // Or beta, alpha if configured
}

// NO personal data:
// ❌ User identifiers
// ❌ Hardware IDs
// ❌ IP addresses (logged by server, not sent by app)
// ❌ Usage analytics
// ❌ Location data
```

### 6.3 Privacy Policy Statement

Add to your privacy documentation:

> **Automatic Updates**
>
> Esquisse can check for updates automatically if you enable this feature in Settings. When checking for updates, the app sends only:
>
> - Your current app version
> - Your operating system (macOS, Windows, or Linux)
> - Your CPU architecture (Intel or Apple Silicon)
>
> No personal information, usage data, or device identifiers are collected. Update checks are performed directly with GitHub's servers, subject to GitHub's privacy policy.
>
> You can disable automatic update checks at any time in Settings → Updates.

### 6.4 GDPR Compliance

**Requirements Met:**

✅ **Consent:** Opt-in by default (Art. 6(1)(a))
✅ **Data Minimization:** Only version/platform sent (Art. 5(1)(c))
✅ **Transparency:** Clear disclosure of data collection (Art. 13)
✅ **User Control:** Easy to enable/disable (Art. 7(3))
✅ **No Profiling:** No automated decision-making (Art. 22)

**Not Required:**

- Cookie consent (no web cookies)
- Data processing agreements (no third-party processors beyond GitHub)
- Data protection officer (small-scale processing)

---

## 7. User Experience Guidelines

### 7.1 Update Flow Diagram

```
┌─────────────────┐
│   App Startup   │
└────────┬────────┘
         │
         ▼
   ┌─────────────┐
   │Auto-check   │
   │enabled?     │
   └──┬──────┬───┘
      │No    │Yes
      │      ▼
      │  ┌───────────────┐
      │  │Check quietly  │
      │  │in background  │
      │  └───────┬───────┘
      │          │
      │          ▼
      │    ┌──────────┐
      │    │Update    │
      │    │available?│
      │    └─┬─────┬──┘
      │      │No   │Yes
      │      │     ▼
      │      │  ┌────────────────┐
      │      │  │Show notification│
      │      │  │"Update available"│
      │      │  └────────┬────────┘
      │      │           │
      │      │           ▼
      │      │    ┌──────────────┐
      │      │    │User chooses: │
      │      │    │Download/Later│
      │      │    └──────┬───────┘
      │      │           │Download
      │      │           ▼
      │      │    ┌──────────────┐
      │      │    │Download in   │
      │      │    │background    │
      │      │    └──────┬───────┘
      │      │           │
      │      │           ▼
      │      │    ┌──────────────┐
      │      │    │Show "Ready to│
      │      │    │install"      │
      │      │    └──────┬───────┘
      │      │           │
      │      │           ▼
      │      │    ┌──────────────┐
      │      │    │User chooses: │
      │      │    │Restart/Later │
      │      │    └──────────────┘
      ▼      ▼
   ┌──────────┐
   │Continue  │
   │using app │
   └──────────┘
```

### 7.2 Notification Timing

**Best Practices:**

1. **Startup check:** Wait 5-10 seconds after app fully loads
2. **Background check:** Don't interrupt active writing/editing
3. **Download progress:** Show subtle progress indicator
4. **Install prompt:** Never force immediate restart
5. **Retry logic:** Don't spam user if check fails

### 7.3 User Messaging Examples

**Update Available:**

```
✨ Update Available

Esquisse 1.1.0 is available
(You have 1.0.0)

What's New:
• Improved performance
• Bug fixes
• Dark mode enhancements

[Download Now] [View Release Notes] [Later]
```

**Download In Progress:**

```
⬇️ Downloading Update

Esquisse 1.1.0 (45% complete)

[Cancel]
```

**Ready to Install:**

```
✅ Update Ready

Esquisse 1.1.0 is ready to install.

The app will restart. Make sure to save any unsaved work.

[Restart Now] [Later]
```

**No Update:**

```
✓ You're Up to Date

You have the latest version of Esquisse (1.0.0)

[OK]
```

**Error:**

```
⚠️ Update Check Failed

Could not check for updates. Please check your internet connection.

[Retry] [Cancel]
```

### 7.4 Accessibility Considerations

**Requirements:**

✅ **Keyboard navigation:** All update dialogs keyboard-accessible
✅ **Screen reader support:** Proper ARIA labels on notifications
✅ **Focus management:** Logical tab order in dialogs
✅ **Color contrast:** Notifications meet WCAG AA standards
✅ **Motion:** Respect `prefers-reduced-motion` for spinners

**Implementation:**

```typescript
// Respect reduced motion preference
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

<div
  role="alert"
  aria-live="polite"
  className={`alert ${prefersReducedMotion ? 'no-animation' : ''}`}
>
  {/* Notification content */}
</div>
```

---

## 8. Distribution Channels

### 8.1 Primary: GitHub Releases

**Setup:**

1. Create first release manually or via GitHub CLI:

```bash
# Using GitHub CLI
gh release create v1.0.0 \
  --title "Esquisse 1.0.0" \
  --notes "Initial release" \
  ./out/make/**/*
```

2. electron-updater will automatically find:
   - `latest-mac.yml` (macOS)
   - `latest.yml` (Windows/Linux)
   - ZIP, DMG, EXE, AppImage files

**File Structure:**

```
Release v1.0.0/
├── Esquisse-1.0.0-arm64-mac.zip      # Auto-update (Apple Silicon)
├── Esquisse-1.0.0-x64-mac.zip        # Auto-update (Intel)
├── Esquisse-1.0.0-arm64.dmg          # Manual (Apple Silicon)
├── Esquisse-1.0.0-x64.dmg            # Manual (Intel)
├── Esquisse-Setup-1.0.0.exe          # Windows
├── Esquisse-1.0.0.AppImage           # Linux
├── esquisse-1.0.0.x86_64.rpm         # Linux (Fedora)
├── esquisse_1.0.0_amd64.deb          # Linux (Debian/Ubuntu)
├── latest-mac.yml                    # Update manifest (macOS)
├── latest.yml                        # Update manifest (Windows/Linux)
└── RELEASES                          # Squirrel (Windows)
```

### 8.2 Supplementary: Homebrew Cask (macOS)

**Benefits:**

- Package manager installation
- Automatic updates via Homebrew
- Trusted distribution channel

**Setup:**

1. Fork homebrew-cask repository
2. Create cask definition:

```ruby
# Formula: homebrew-cask/Casks/esquisse.rb
cask "esquisse" do
  version "1.0.0"
  sha256 "abc123..."

  url "https://github.com/yourusername/esquisse/releases/download/v#{version}/Esquisse-#{version}.dmg"
  name "Esquisse"
  desc "Minimalist journaling desktop app"
  homepage "https://github.com/yourusername/esquisse"

  livecheck do
    url :url
    strategy :github_latest
  end

  auto_updates true

  app "Esquisse.app"

  zap trash: [
    "~/Library/Application Support/esquisse",
    "~/Library/Preferences/com.esquisse.app.plist",
    "~/Library/Logs/Esquisse",
  ]
end
```

3. Submit pull request to homebrew-cask

**Installation (users):**

```bash
brew install --cask esquisse

# Updates via Homebrew
brew upgrade --cask
```

### 8.3 Alternative: Winget (Windows)

**Benefits:**

- Official Windows package manager
- Integrated with Windows 11
- Trusted distribution

**Setup:**

1. Fork winget-pkgs repository
2. Create manifest:

```yaml
# winget-pkgs/manifests/y/YourName/Esquisse/1.0.0/
PackageIdentifier: YourName.Esquisse
PackageVersion: 1.0.0
PackageLocale: en-US
Publisher: Your Name
PackageName: Esquisse
License: MIT
ShortDescription: Minimalist journaling desktop app
Installers:
  - Architecture: x64
    InstallerType: exe
    InstallerUrl: https://github.com/yourusername/esquisse/releases/download/v1.0.0/Esquisse-Setup-1.0.0.exe
    InstallerSha256: abc123...
```

3. Submit pull request

**Installation (users):**

```powershell
winget install YourName.Esquisse

# Updates
winget upgrade YourName.Esquisse
```

### 8.4 Optional: App Store Distribution

**macOS App Store:**

**Pros:**

- Trusted distribution channel
- Built-in update mechanism
- Discoverability

**Cons:**

- ❌ $99/year (same Developer account)
- ❌ Strict review process (2-5 days)
- ❌ 30% revenue share (if paid)
- ❌ Sandboxing restrictions (may affect SQLite access)
- ❌ Can't use custom auto-updater

**Recommendation:** ⚠️ **Not recommended** for Esquisse due to sandboxing limitations and loss of direct update control.

---

## 9. Testing & Quality Assurance

### 9.1 Local Testing

**Test Update Flow Locally:**

```bash
# 1. Build production app
npm run package

# 2. Create fake update server
mkdir test-update-server
cd test-update-server

# 3. Copy build artifacts
cp ../out/make/**/* .

# 4. Create dummy latest-mac.yml
cat > latest-mac.yml <<EOF
version: 999.0.0
files:
  - url: Esquisse-999.0.0-mac.zip
    sha512: abc123...
    size: 50000000
path: Esquisse-999.0.0-mac.zip
sha512: abc123...
releaseDate: '2025-01-20T10:00:00.000Z'
EOF

# 5. Start local server
python3 -m http.server 8000

# 6. Point app to local server (in UpdaterService)
# autoUpdater.setFeedURL({
#   provider: 'generic',
#   url: 'http://localhost:8000'
# });

# 7. Install and test built app
```

### 9.2 Staging Environment

**Pre-release Testing:**

1. Create pre-release on GitHub:

```bash
gh release create v1.1.0-beta \
  --title "Esquisse 1.1.0 Beta" \
  --notes "Beta release for testing" \
  --prerelease \
  ./out/make/**/*
```

2. Configure app to use pre-release channel:

```typescript
// In updater.service.ts
autoUpdater.channel = 'beta';
autoUpdater.allowPrerelease = true;
```

3. Test with real GitHub infrastructure
4. Verify code signing and notarization
5. Confirm update flow end-to-end

### 9.3 E2E Testing with Playwright

Create `tests/e2e/updates.spec.ts`:

```typescript
import { test, expect, _electron as electron } from '@playwright/test';
import path from 'path';

test.describe('Update Flow', () => {
  test('should show update check button in settings', async () => {
    // Launch app
    const electronApp = await electron.launch({
      args: [path.join(__dirname, '../../out/main/index.js')],
    });

    const window = await electronApp.firstWindow();

    // Navigate to settings
    await window.click('[data-testid="settings-button"]');

    // Verify update section exists
    await expect(window.locator('text=Check for Updates')).toBeVisible();

    await electronApp.close();
  });

  test('should handle update check', async () => {
    const electronApp = await electron.launch({
      args: [path.join(__dirname, '../../out/main/index.js')],
    });

    const window = await electronApp.firstWindow();

    // Mock update server response
    await window.route('**/latest-mac.yml', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'text/yaml',
        body: `
version: 999.0.0
files:
  - url: fake.zip
    sha512: abc
path: fake.zip
sha512: abc
releaseDate: '2025-01-01T00:00:00Z'
        `,
      });
    });

    // Trigger update check
    await window.click('[data-testid="check-updates-button"]');

    // Wait for notification
    await expect(window.locator('text=Update Available')).toBeVisible({ timeout: 10000 });

    await electronApp.close();
  });
});
```

### 9.4 Testing Checklist

**Before Each Release:**

- [ ] Build succeeds on all platforms
- [ ] Code signing succeeds (macOS, Windows)
- [ ] Notarization succeeds (macOS)
- [ ] App launches without errors
- [ ] Manual update check works
- [ ] Update notification displays correctly
- [ ] Download progress shows
- [ ] Install prompt appears after download
- [ ] Restart and update installs correctly
- [ ] User data (SQLite) preserved after update
- [ ] Settings preserved after update
- [ ] No regressions in core functionality
- [ ] Release notes accurate and complete

---

## 10. Platform-Specific Considerations

### 10.1 macOS

**Requirements:**

- ✅ Code signing (Developer ID Application)
- ✅ Notarization
- ✅ Hardened Runtime
- ✅ ZIP target (for auto-update)
- ✅ DMG target (for manual distribution)

**Gatekeeper Behavior:**

**Without notarization:**

```
"Esquisse.app" is damaged and can't be opened.
You should move it to the Trash.
```

**With notarization:**

- First launch: User approves in System Preferences
- Subsequent launches: Opens normally

**Distribution Targets:**

1. **ZIP** (auto-update): Fastest download, no user interaction
2. **DMG** (manual): Drag-to-Applications UX, familiar to Mac users

**Universal Binary:**

Support both Intel and Apple Silicon:

```typescript
// forge.config.ts
packagerConfig: {
  arch: ['x64', 'arm64'], // Build for both architectures
  // Or: arch: 'universal' (single binary, larger size)
}
```

### 10.2 Windows

**Code Signing:**

**Without code signing:**

```
Windows protected your PC
Microsoft Defender SmartScreen prevented an unrecognized app from starting.
```

**With code signing:**

- Installer runs smoothly (after certificate reputation built)
- EV certificates: Immediate SmartScreen reputation

**Distribution Formats:**

1. **Squirrel (recommended):** Modern, per-user install, auto-update support
2. **NSIS:** Traditional installer, system-wide install option

**Auto-Update Behavior:**

- Updates install in background
- Silent installation (no UAC prompt)
- Per-user installation folder: `%LOCALAPPDATA%\Esquisse`

### 10.3 Linux

**No Code Signing Required**

**Distribution Formats:**

1. **AppImage** (recommended):
   - Self-contained
   - No installation needed
   - Run anywhere
   - Auto-update support via AppImageUpdate

2. **DEB** (Debian/Ubuntu):
   - Integrates with apt
   - System-wide installation

3. **RPM** (Fedora/RHEL):
   - Integrates with yum/dnf
   - System-wide installation

**Auto-Update:**

- Works with electron-updater
- AppImage: Supports delta updates
- DEB/RPM: Users expect package manager updates

**Recommendation:**

Focus on **AppImage** for:

- Universal compatibility
- No installation required
- Built-in auto-update
- User-friendly

---

## 11. Best Practices

### 11.1 Release Process

**Standard Workflow:**

```bash
# 1. Update version
npm version minor  # 1.0.0 → 1.1.0

# 2. Update CHANGELOG.md
git add CHANGELOG.md
git commit --amend --no-edit

# 3. Push with tags
git push --follow-tags

# 4. GitHub Actions builds and creates draft release
# 5. Review draft release
# 6. Edit release notes
# 7. Publish release

# 8. Monitor for issues
# 9. If critical bug: patch release (npm version patch)
```

### 11.2 Versioning Strategy

**Semantic Versioning (semver):**

```
MAJOR.MINOR.PATCH
  │     │     │
  │     │     └─ Bug fixes (1.0.0 → 1.0.1)
  │     └─────── New features (1.0.0 → 1.1.0)
  └───────────── Breaking changes (1.0.0 → 2.0.0)
```

**For Desktop Apps:**

- **MAJOR:** Rare (database migration, major UI overhaul)
- **MINOR:** Common (new features, enhancements)
- **PATCH:** Frequent (bug fixes, minor improvements)

### 11.3 Staged Rollouts

**Gradual Deployment:**

Edit `latest-mac.yml` after publishing:

```yaml
version: 1.1.0
files:
  - url: Esquisse-1.1.0-mac.zip
    sha512: abc123...
path: Esquisse-1.1.0-mac.zip
sha512: abc123...
releaseDate: '2025-01-15T10:00:00.000Z'
stagingPercentage: 10 # Only 10% of users get update
```

**Rollout Schedule:**

- Day 1: 10% (canary)
- Day 2: 25% (if no issues)
- Day 3: 50%
- Day 4: 100% (full rollout)

**Monitoring:**

- Watch for GitHub issues
- Monitor error logs (if implemented)
- Check user feedback

### 11.4 Rollback Strategy

**If bad release deployed:**

**Option 1: Quick Patch**

```bash
# Fix bug
git commit -m "fix: critical bug in 1.1.0"

# Release patch immediately
npm version patch  # 1.1.0 → 1.1.1
git push --follow-tags
```

**Option 2: Point to Previous Version**

Edit `latest-mac.yml`:

```yaml
version: 1.0.0 # Roll back to previous version
files:
  - url: Esquisse-1.0.0-mac.zip
    sha512: abc123...
```

**Option 3: Unpublish Release**

```bash
# Delete release (users on 1.1.0 stay there)
gh release delete v1.1.0 --yes

# Users checking for updates will see 1.0.0 as latest
```

### 11.5 Delta Updates (Advanced)

**Reduce Bandwidth:**

**Problem:** Full downloads are 40-80MB
**Solution:** Delta updates are 1-5MB

**Using electron-delta:**

```bash
npm install electron-delta electron-delta-updater
```

**Server-side delta generation:**

```bash
# Generate delta from 1.0.0 to 1.1.0
electron-delta create \
  --base Esquisse-1.0.0-mac.zip \
  --target Esquisse-1.1.0-mac.zip \
  --output delta-1.0.0-to-1.1.0.zip
```

**Trade-offs:**

- ✅ 90% smaller downloads
- ✅ Faster updates
- ❌ More complex server setup
- ❌ Delta generation in CI/CD

**Recommendation:** Start without deltas; add later if needed.

---

## 12. Troubleshooting

### 12.1 Common Issues

#### Issue: Update check fails silently

**Symptoms:**

- No error message
- Update status stays "idle"

**Causes:**

- App not code signed
- Network error
- Invalid feed URL

**Solutions:**

```typescript
// Enable verbose logging
autoUpdater.logger = log;
log.transports.file.level = 'debug';

// Check feed URL
console.log('Feed URL:', autoUpdater.getFeedURL());

// Test manually
autoUpdater
  .checkForUpdates()
  .then((result) => console.log('Result:', result))
  .catch((err) => console.error('Error:', err));
```

#### Issue: "Update not available" but new version exists

**Cause:** Version comparison issue

**Solutions:**

1. Check version in `package.json` matches git tag
2. Verify GitHub release is published (not draft)
3. Check `latest-mac.yml` was uploaded

```bash
# View latest-mac.yml
curl -s https://github.com/yourusername/esquisse/releases/latest/download/latest-mac.yml
```

#### Issue: macOS notarization fails

**Symptoms:**

```
Error: Unable to notarize app
```

**Solutions:**

1. Check Apple ID credentials:

```bash
xcrun notarytool history --apple-id YOUR_APPLE_ID --team-id TEAM_ID
```

2. View specific submission logs:

```bash
xcrun notarytool log SUBMISSION_ID --apple-id YOUR_APPLE_ID
```

3. Common issues:
   - Hardened Runtime not enabled
   - Entitlements missing
   - Unsigned native modules

#### Issue: Windows SmartScreen warning

**Symptoms:**

```
Windows protected your PC
```

**Solutions:**

1. **Code sign the app** (best solution)
2. Use EV certificate for instant reputation
3. Build reputation over time (standard certificate)
4. Provide instructions for users to bypass

### 12.2 Debugging Tips

**Enable Debug Logging:**

```typescript
// updater.service.ts
import log from 'electron-log';

log.transports.file.level = 'debug';
log.info('Updater initialized');

// View logs
// macOS: ~/Library/Logs/Esquisse/main.log
// Windows: %USERPROFILE%\AppData\Roaming\Esquisse\logs\main.log
// Linux: ~/.config/Esquisse/logs/main.log
```

**Test Update Server:**

```typescript
// Temporarily point to test server
if (process.env.NODE_ENV === 'development') {
  autoUpdater.setFeedURL({
    provider: 'generic',
    url: 'http://localhost:8000',
  });
}
```

**Bypass Cache:**

```typescript
// Force check (ignores cache)
autoUpdater.checkForUpdatesAndNotify({
  force: true,
});
```

### 12.3 User Support

**Common User Issues:**

1. **"Update check fails"**
   - Check internet connection
   - Temporarily disable firewall/antivirus
   - Try manual download from GitHub

2. **"Downloaded update won't install"**
   - Ensure app has write permissions
   - Close all app instances
   - Manually download and install

3. **"Lost data after update"**
   - Check database backup location
   - Restore from automatic backup

**Provide Support Documentation:**

Create `docs/USER_UPDATES_FAQ.md`:

```markdown
# Update FAQ

## How do I enable automatic updates?

Settings → Updates → Check "Automatically check for updates"

## Where can I download updates manually?

https://github.com/yourusername/esquisse/releases/latest

## Will updates delete my journals?

No. Your data is preserved during updates. Esquisse automatically backs up your database before any update.

## Update failed. What should I do?

1. Close Esquisse completely
2. Download the latest version manually from GitHub
3. Install over existing version
4. Your data will be preserved
```

---

## 13. Implementation Roadmap

### 13.1 Phase 1: Foundation (Week 1)

**Goal:** Set up basic infrastructure

- [ ] Create Apple Developer account
- [ ] Generate code signing certificates
- [ ] Set up entitlements.plist
- [ ] Test code signing locally
- [ ] Create initial GitHub Release manually
- [ ] Document release process

**Deliverables:**

- Signed and notarized macOS build
- GitHub Release with assets
- Release documentation

---

### 13.2 Phase 2: Auto-Update Integration (Week 2)

**Goal:** Implement auto-update functionality

- [ ] Install electron-updater
- [ ] Create UpdaterService
- [ ] Implement IPC handlers
- [ ] Add update settings to database schema
- [ ] Create renderer store
- [ ] Build Settings UI
- [ ] Test update flow locally

**Deliverables:**

- Working auto-update in development
- Settings UI for update preferences
- Local testing documentation

---

### 13.3 Phase 3: CI/CD Automation (Week 3)

**Goal:** Automate releases

- [ ] Create GitHub Actions workflow
- [ ] Set up repository secrets
- [ ] Configure multi-platform builds
- [ ] Test CI/CD pipeline with pre-release
- [ ] Document deployment process
- [ ] Create release checklist

**Deliverables:**

- Automated release pipeline
- Multi-platform builds
- Release playbook

---

### 13.4 Phase 4: Testing & Polish (Week 4)

**Goal:** Ensure reliability

- [ ] Write E2E tests for update flow
- [ ] Test on real devices (not VMs)
- [ ] Verify update from multiple versions
- [ ] Test offline behavior
- [ ] Polish UI/UX
- [ ] Create user documentation

**Deliverables:**

- E2E test suite
- User FAQ documentation
- Polished update experience

---

### 13.5 Phase 5: Public Release (Week 5)

**Goal:** Launch with auto-updates

- [ ] Release v1.1.0 with auto-update support
- [ ] Monitor for issues
- [ ] Respond to user feedback
- [ ] Consider Homebrew Cask submission
- [ ] Plan future enhancements

**Deliverables:**

- Public release with auto-updates
- User adoption metrics
- Feedback collection

---

## 14. Cost Summary

### 14.1 First Year Costs

| Item                       | Cost        | Frequency | Notes                      |
| -------------------------- | ----------- | --------- | -------------------------- |
| **Apple Developer**        | $99         | Annual    | Required for macOS         |
| **Windows Code Signing**   | $150-300    | Annual    | Optional initially         |
| **GitHub Hosting**         | $0          | Free      | Unlimited for public repos |
| **CI/CD (GitHub Actions)** | $0          | Free      | 2,000 minutes/month free   |
| **Domain (optional)**      | $12         | Annual    | For marketing site         |
| **Total**                  | **$99-411** | Year 1    | Minimum: $99               |

### 14.2 Ongoing Costs

**Minimal operation:**

- Apple Developer: $99/year
- GitHub Hosting: Free
- Total: **$99/year**

**Full setup:**

- Apple Developer: $99/year
- Windows Code Signing: $150/year
- Total: **$249/year**

---

## 15. Resources & References

### 15.1 Official Documentation

- [electron-updater](https://www.electron.build/auto-update)
- [Electron Forge Auto-Update](https://www.electronforge.io/advanced/auto-update)
- [Code Signing (macOS)](https://www.electronforge.io/guides/code-signing/code-signing-macos)
- [Notarization Guide](https://github.com/electron/notarize)

### 15.2 Example Repositories

- [electron-updater-example](https://github.com/iffy/electron-updater-example)
- [Electron Forge + GitHub Actions](https://github.com/electron-userland/electron-builder/tree/master/.github/workflows)

### 15.3 Community Resources

- [Electron Discord](https://discord.gg/electron)
- [Electron GitHub Discussions](https://github.com/electron/electron/discussions)
- [Stack Overflow: electron-updater](https://stackoverflow.com/questions/tagged/electron-updater)

### 15.4 Tools

- [electron-delta](https://electrondelta.com/) (bandwidth optimization)
- [update-electron-app](https://github.com/electron/update-electron-app) (simplified updater)
- [Electron Notarize](https://github.com/electron/notarize)

---

## Conclusion

Implementing auto-updates in Esquisse with **electron-updater + GitHub Releases** provides:

✅ **Privacy-first:** Minimal data collection, user control
✅ **Free hosting:** GitHub Releases
✅ **Excellent UX:** Background updates, user-friendly
✅ **Cross-platform:** macOS, Windows, Linux
✅ **Industry-standard:** Well-maintained, battle-tested

**Required Investment:**

- Time: ~3-4 weeks development
- Cost: $99/year (Apple Developer)
- Complexity: Medium (well-documented)

**Key Success Factors:**

1. Opt-in by default (privacy)
2. Never force updates (user control)
3. Clear communication (transparency)
4. Graceful failure handling (offline support)
5. Thorough testing (reliability)

This approach aligns perfectly with Esquisse's minimalist, privacy-first philosophy while providing a modern, professional update experience.

---

_For questions or implementation assistance, refer to the code examples in this document or consult the official electron-updater documentation._

**Document Version:** 1.0
**Last Updated:** November 2025
**For:** Esquisse v1.0.0+
