# Esquisse Licensing & Monetization Options

> Comprehensive analysis of licensing approaches, implementation strategies, and monetization models for Esquisse.
>
> **Last Updated:** November 2025

## Executive Summary

### Recommended Approach

**Time-Based Trial (30 days) + Local License File**

- **Rationale:** Perfectly aligns with Esquisse's privacy-first philosophy while providing sustainable revenue
- **Implementation:** 2-3 weeks development time
- **Expected Conversion:** 5-10% of trial users
- **Pricing:** $20-25 one-time purchase
- **User Experience:** Non-blocking trial, simple one-time activation, no recurring payments

### Key Principles

1. **Privacy First:** No tracking, telemetry, or hardware fingerprinting
2. **User Respect:** Generous trial, fair pricing, no dark patterns
3. **Local-Only:** All validation happens offline after initial activation
4. **Trust-Based:** Focus on honest users, not aggressive anti-piracy

---

## Table of Contents

1. [Current Architecture Analysis](#1-current-architecture-analysis)
2. [Licensing Implementation Approaches](#2-licensing-implementation-approaches)
3. [Alternative Monetization Models](#3-alternative-monetization-models)
4. [Technical Implementation Details](#4-technical-implementation-details)
5. [Security Considerations](#5-security-considerations)
6. [Privacy Safeguards](#6-privacy-safeguards)
7. [Industry Best Practices](#7-industry-best-practices)
8. [Comparison Matrix](#8-comparison-matrix)
9. [Recommendations](#9-recommendations)
10. [Next Steps](#10-next-steps)

---

## 1. Current Architecture Analysis

### Application Structure

- **Process Model:** Electron multi-process (Main, Preload, Renderer) with strict IPC boundaries
- **Database:** better-sqlite3 (native SQLite) at `app.getPath('userData')/esquisse.db`
- **Data Path:** Platform-specific user data directory
  - macOS: `~/Library/Application Support/esquisse/`
  - Windows: `%APPDATA%\esquisse\`
  - Linux: `~/.config/esquisse/`
- **Persistence:** SQLite with WAL mode, automatic backups every 15 minutes
- **Settings:** Key-value store in `settings` table, managed via IPC
- **Network:** Completely offline, no telemetry or analytics

### Key Files for License Integration

```
/src/main/database/
├── schema.sql                    # Database schema
├── migrations.ts                 # Migration system
└── index.ts                      # DB initialization

/src/main/modules/settings/
└── settings.ipc.ts               # Settings IPC handlers

/src/shared/types/
└── settings.types.ts             # Settings type definitions

/src/shared/ipc/
├── channels.ts                   # IPC channel constants
└── api.types.ts                  # IPC method signatures

/src/renderer/features/settings/
└── settings.store.ts             # Settings Zustand store
```

### Integration Points

License functionality would integrate at these layers:

1. **Database:** New `license_info` table or settings entries
2. **Main Process:** License validation service at `src/main/domain/license/`
3. **IPC Layer:** New channels (`LICENSE_GET_STATUS`, `LICENSE_VALIDATE`)
4. **Renderer:** License status UI in settings, trial reminder components
5. **Bootstrap:** License check during app initialization in `src/main/index.ts`

---

## 2. Licensing Implementation Approaches

### A. Local License File (Recommended)

#### How It Works

- Generate cryptographically signed license files using public-key cryptography
- App contains only the public key to verify signatures
- License stored in database alongside user data
- No server required for validation after initial purchase

#### Technical Design

```typescript
interface License {
  email: string;
  purchaseDate: string;
  licenseKey: string;
  signature: string; // Ed25519 or RSA signature
}

function validateLicense(license: License): boolean {
  const publicKey = EMBEDDED_PUBLIC_KEY;
  const data = `${license.email}|${license.purchaseDate}|${license.licenseKey}`;
  return ed25519.verify(publicKey, data, license.signature);
}
```

#### Integration Points

- Database migration: `003_add_license_table`
- New IPC channels: `LICENSE_VALIDATE`, `LICENSE_GET_STATUS`, `LICENSE_ACTIVATE`
- License service: `src/main/domain/license/license.service.ts`
- UI components: Settings page license section, activation modal

#### Pros

✅ Fully offline - perfect alignment with privacy philosophy
✅ No telemetry or tracking required
✅ User owns their license data
✅ Can be backed up/restored with database
✅ Moderate implementation complexity (2-3 weeks)
✅ Simple user experience (paste key once)

#### Cons

❌ Can be shared/pirated (copy license between machines)
❌ No remote license revocation capability
❌ Requires secure key management for generation
❌ Can be bypassed by determined users (code patching)

#### Privacy Impact

**Minimal** - Only stores user-provided email address for license. No hardware IDs, no usage tracking.

---

### B. Time-Based Local Trial

#### How It Works

- Store first-run timestamp in database settings
- Calculate days elapsed since installation
- Show gentle reminders after trial expires
- Optional enforcement (block features) or honor system

#### Technical Design

```typescript
// Database settings entries
interface TrialSettings {
  'trial.firstRunDate': string; // ISO timestamp
  'trial.reminderDismissed': boolean;
  'license.purchased': boolean;
}

function getTrialStatus() {
  const firstRun = new Date(settings.get('trial.firstRunDate'));
  const daysElapsed = daysSince(firstRun);
  const TRIAL_DAYS = 30;

  return {
    isActive: daysElapsed < TRIAL_DAYS,
    daysRemaining: Math.max(0, TRIAL_DAYS - daysElapsed),
    expired: daysElapsed >= TRIAL_DAYS,
  };
}
```

#### Integration Points

- Add trial settings on first app launch
- Migration: `003_add_trial_settings`
- Trial status component in editor HUD or footer
- Settings page showing trial countdown
- Purchase button (opens external URL)

#### Pros

✅ Extremely simple to implement (1 week)
✅ Zero privacy concerns - no external data
✅ Respectful UX (gentle reminders, non-blocking)
✅ Aligns with Sublime Text's "evaluation mode"
✅ Easy to test and debug

#### Cons

❌ Easily bypassed (delete database, change system clock)
❌ No technical enforcement possible
❌ Relies entirely on user honesty
❌ Lower conversion rates (1-3% typical)

#### Privacy Impact

**Zero** - No personal data collected, only local timestamp.

---

### C. Hardware Fingerprint Binding

#### How It Works

- Generate unique machine identifier from hardware
- Cryptographically bind license key to machine fingerprint
- Prevents license sharing between computers
- Validation remains local (no server required)

#### Technical Design

```typescript
import { machineIdSync } from 'node-machine-id';

interface BoundLicense {
  licenseKey: string;
  machineHash: string; // SHA256 of machine ID
  signature: string;
}

function validateBoundLicense(license: BoundLicense): boolean {
  const currentMachineId = machineIdSync();
  const currentHash = sha256(currentMachineId);

  if (currentHash !== license.machineHash) {
    return false; // License not for this machine
  }

  return verifySignature(license);
}
```

#### Pros

✅ Prevents casual license sharing
✅ Still offline after initial activation
✅ Moderate piracy deterrent

#### Cons

❌ **PRIVACY CONCERN** - Collects hardware identifiers
❌ Conflicts with privacy-first philosophy
❌ User friction (hardware changes require reactivation)
❌ Support burden (legitimate reactivation requests)
❌ GDPR/privacy regulations may apply
❌ Ethically questionable for journaling app

#### Privacy Impact

**HIGH CONCERN** - Collects and stores hardware identifiers (MAC addresses, disk serials, CPU IDs).

#### Recommendation

⚠️ **NOT RECOMMENDED** for Esquisse due to privacy implications.

---

### D. Online License Validation

#### How It Works

- License keys validated against remote server
- Periodic "heartbeat" checks or validation on launch
- Centralized license management and revocation

#### Available Services

- **Keygen.sh** - $50-200/month, full license management
- **Gumroad API** - Free with Gumroad checkout, simple validation
- **LemonSqueezy** - Built-in license validation
- **Paddle** - Enterprise-grade licensing
- **Custom solution** - Roll your own (most work)

#### Technical Design

```typescript
async function validateLicenseOnline(licenseKey: string): Promise<boolean> {
  try {
    const response = await fetch('https://api.keygen.sh/v1/accounts/{account}/licenses/{key}', {
      headers: { Authorization: `Bearer ${API_KEY}` },
    });

    const data = await response.json();
    return data.valid === true;
  } catch (error) {
    // What happens if offline? Block or allow?
    return false; // User-hostile
  }
}
```

#### Pros

✅ Strong piracy prevention
✅ Remote license revocation capability
✅ Usage analytics and insights
✅ Easy license management dashboard
✅ Highest conversion rates (15%+)

#### Cons

❌ **DEALBREAKER** - Requires internet connection
❌ **PRIVACY VIOLATION** - Sends data to external servers
❌ Fundamentally incompatible with "local-only" promise
❌ Monthly infrastructure costs ($50-200)
❌ Single point of failure (server down = app unusable)
❌ User resentment (DRM-like behavior)
❌ GDPR compliance requirements

#### Privacy Impact

**CRITICAL VIOLATION** - Sends license validation requests, IP addresses, timestamps to third-party servers.

#### Recommendation

❌ **NOT RECOMMENDED** for Esquisse - violates core privacy principles.

---

### E. Hybrid Approach: Optional Sync with License

#### How It Works

- Core app remains fully functional offline
- Optional paid cloud sync service (like Obsidian)
- Sync subscription includes license verification
- Free tier or separate one-time license for offline use

#### Example Pricing

```
Esquisse Core (Offline): $20 one-time
Esquisse Sync: $5/month (includes cloud backup + multi-device sync)
```

#### Pros

✅ Preserves privacy for offline-only users
✅ Recurring revenue from sync subscribers
✅ Value-add justifies ongoing payment
✅ Similar to successful apps (Obsidian, Bear)
✅ Optional - doesn't force cloud on everyone

#### Cons

❌ Complex implementation (sync infrastructure)
❌ Higher development costs (backend, conflict resolution)
❌ Operational costs (server hosting, bandwidth)
❌ May split user base (free vs sync)
❌ Requires careful privacy design for sync

#### Privacy Impact

**Moderate** - Privacy maintained for offline users, opt-in for sync users with clear disclosure.

#### Recommendation

⚡ **FUTURE CONSIDERATION** - Excellent model but requires significant infrastructure investment.

---

## 3. Alternative Monetization Models

### A. Honor System / Pay-What-You-Want

#### Description

Free indefinite trial with voluntary payment button. No enforcement, pure trust-based model.

#### Examples

- **WinRAR** - Famously never enforced trial expiration
- **Sublime Text** - Gentle reminders but functional forever
- **Indie games** - Pay-what-you-want bundles

#### Implementation

- Trial never expires technically
- Periodic gentle "Please support development" messages
- Link to purchase page (Gumroad, etc.)
- "I've purchased" button dismisses reminders permanently

#### Revenue Estimates

- **Conversion rate:** 1-5% (very low)
- **Average payment:** Often higher than fixed price (voluntary premium)
- **Suitable for:** Passion projects, building user base, ethical stance

#### Pros

✅ Maximum user goodwill and positive reputation
✅ No DRM friction or user hostility
✅ Viral potential (free to share = word-of-mouth)
✅ Ethical transparency
✅ Trivial implementation (2 days)

#### Cons

❌ Low revenue predictability
❌ May not sustain full-time development
❌ Some users never pay despite heavy use
❌ Hard to scale as business

---

### B. Feature-Limited Free Version (Freemium)

#### Description

Core functionality free forever, premium features require paid license.

#### Possible Premium Features for Esquisse

**Free Tier:**

- 1-3 journals maximum
- Basic editor features
- Local storage only
- Light/dark theme

**Premium Tier ($20-25 one-time):**

- Unlimited journals
- Export to PDF/Markdown
- Advanced search/filtering
- Custom themes and fonts
- Image attachments
- Encryption/password protection

#### Implementation

- Feature flags in database settings
- UI gating for premium features
- Clear upgrade prompts
- Comparison table in settings

#### Pros

✅ Low barrier to entry (try before buy)
✅ Users can evaluate usefulness before paying
✅ Typical conversion 2-5%
✅ Clear value proposition

#### Cons

❌ Risk of crippling free version too much
❌ Ongoing support for free users
❌ May alienate users if "premium" = basic privacy features
❌ Two codepaths to maintain

---

### C. One-Time Purchase (Perpetual License)

#### Description

Traditional software purchase model. Pay once, use forever.

#### Pricing Examples

- **MacJournal:** $40 one-time
- **Ulysses (old model):** $50 one-time
- **Typical indie apps:** $15-50

#### Implementation

- Same as "Local License File" approach
- No time limitations
- Major version upgrades may require new purchase (e.g., v1.x → v2.0)

#### Pros

✅ Users love owning software outright
✅ No recurring payment friction
✅ Premium pricing possible ($30-50 range)
✅ Clear value exchange

#### Cons

❌ No recurring revenue stream
❌ Hard to justify ongoing development costs
❌ Lower lifetime value per customer
❌ Pressure to release paid "v2.0" for revenue

---

### D. Perpetual Fallback License (Sublime Text Model)

#### Description

Pay once, receive updates for X years. After expiration, continue using the last version you received forever.

#### Pricing Example

```
Initial Purchase: $30
- 3 years of free updates (v1.0 → v1.9.x)
- Keep using v1.9.5 forever after expiration

Renewal (Optional): $15
- 3 more years of updates (v1.9.x → v2.5.x)
- Fair upgrade pricing for long-term users
```

#### Implementation

```typescript
interface FallbackLicense {
  key: string;
  purchaseDate: string;
  validUntil: string; // purchaseDate + 3 years
}

function canUseVersion(appVersion: string, license: FallbackLicense): boolean {
  const releaseDate = getVersionReleaseDate(appVersion);
  const licenseExpiry = new Date(license.validUntil);

  // Can use version if released before license expired
  return releaseDate <= licenseExpiry;
}
```

#### Pros

✅ Best of both worlds (perpetual + ongoing revenue)
✅ User-friendly and perceived as fair
✅ Proven successful (Sublime Text, Sketch)
✅ Encourages staying updated
✅ Clear value proposition for renewals

#### Cons

❌ Complex version tracking logic
❌ Users may not renew if satisfied with old version
❌ Requires clear communication and messaging
❌ More implementation work (version date tracking)

---

### E. Subscription Model

#### Description

Monthly or annual recurring payment for continued access.

#### Examples

- **Day One:** $50/year
- **Ulysses:** $40/year
- **Bear:** $15/year
- **Standard Notes:** $10/month

#### Pros

✅ Predictable recurring revenue
✅ Justifies ongoing development costs
✅ Higher lifetime value per customer

#### Cons

❌ Subscription fatigue (users tired of recurring fees)
❌ Hard to justify for local-only app (no cloud costs)
❌ May alienate privacy-focused users
❌ Many journaling apps failed with this model
❌ Requires active maintenance to retain subscribers

#### Recommendation

⚠️ **NOT RECOMMENDED** for Esquisse - Poor fit for local-first app without cloud services.

---

## 4. Technical Implementation Details

### Recommended Implementation: Trial + Local License

#### Phase 1: Trial System (Week 1)

**Database Migration**

```sql
-- Migration: 003_add_trial_and_license
CREATE TABLE IF NOT EXISTS license_info (
  id INTEGER PRIMARY KEY CHECK (id = 1),  -- Single row table
  trial_start_date TEXT NOT NULL,
  license_key TEXT,
  license_email TEXT,
  license_signature TEXT,
  license_validated_at TEXT,
  reminder_dismissed_count INTEGER DEFAULT 0,
  last_reminder_date TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Insert initial trial data
INSERT OR IGNORE INTO license_info (id, trial_start_date)
VALUES (1, datetime('now'));

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_license_info_trial
ON license_info(trial_start_date);
```

**TypeScript Types**

```typescript
// src/shared/types/license.types.ts
export interface LicenseInfo {
  id: 1;
  trialStartDate: string;
  licenseKey?: string;
  licenseEmail?: string;
  licenseSignature?: string;
  licenseValidatedAt?: string;
  reminderDismissedCount: number;
  lastReminderDate?: string;
}

export interface LicenseStatus {
  isLicensed: boolean;
  trialDaysRemaining: number;
  trialExpired: boolean;
  showReminder: boolean;
  licenseEmail?: string;
}

export interface LicenseActivationRequest {
  email: string;
  licenseKey: string;
  signature: string;
}
```

**IPC Channels**

```typescript
// src/shared/ipc/channels.ts
export const IPC_CHANNELS = {
  // ... existing channels
  LICENSE_GET_STATUS: 'license:getStatus',
  LICENSE_VALIDATE: 'license:validate',
  LICENSE_DISMISS_REMINDER: 'license:dismissReminder',
} as const;

// src/shared/ipc/api.types.ts
export interface ApiMethods {
  // ... existing methods
  'license:getStatus': () => Promise<LicenseStatus>;
  'license:validate': (
    data: LicenseActivationRequest
  ) => Promise<{ success: boolean; error?: string }>;
  'license:dismissReminder': () => Promise<void>;
}
```

**License Service**

```typescript
// src/main/domain/license/license.service.ts
import { createPublicKey, verify } from 'crypto';

const TRIAL_DAYS = 30;
const MAX_REMINDER_DISMISSALS = 3;
const REMINDER_INTERVAL_DAYS = 7;

// Public key for signature verification (embedded in app)
const PUBLIC_KEY_PEM = `-----BEGIN PUBLIC KEY-----
MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE...
-----END PUBLIC KEY-----`;

export class LicenseService {
  constructor(private db: Database) {}

  getStatus(): LicenseStatus {
    const info = this.getLicenseInfo();

    // Check if already licensed
    if (info.licenseKey && this.validateStoredLicense(info)) {
      return {
        isLicensed: true,
        trialDaysRemaining: 0,
        trialExpired: false,
        showReminder: false,
        licenseEmail: info.licenseEmail,
      };
    }

    // Calculate trial status
    const trialStart = new Date(info.trialStartDate);
    const daysElapsed = this.daysSince(trialStart);
    const daysRemaining = Math.max(0, TRIAL_DAYS - daysElapsed);
    const trialExpired = daysElapsed >= TRIAL_DAYS;

    return {
      isLicensed: false,
      trialDaysRemaining: daysRemaining,
      trialExpired,
      showReminder: this.shouldShowReminder(info, trialExpired),
    };
  }

  async activateLicense(
    request: LicenseActivationRequest
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Validate signature
      if (!this.verifyLicenseSignature(request)) {
        return { success: false, error: 'Invalid license key or signature' };
      }

      // Store license
      const stmt = this.db.prepare(`
        UPDATE license_info
        SET license_key = ?,
            license_email = ?,
            license_signature = ?,
            license_validated_at = datetime('now'),
            updated_at = datetime('now')
        WHERE id = 1
      `);

      stmt.run(request.licenseKey, request.email, request.signature);

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to activate license' };
    }
  }

  dismissReminder(): void {
    const stmt = this.db.prepare(`
      UPDATE license_info
      SET reminder_dismissed_count = reminder_dismissed_count + 1,
          last_reminder_date = datetime('now'),
          updated_at = datetime('now')
      WHERE id = 1
    `);
    stmt.run();
  }

  private validateStoredLicense(info: LicenseInfo): boolean {
    if (!info.licenseKey || !info.licenseSignature || !info.licenseEmail) {
      return false;
    }

    return this.verifyLicenseSignature({
      email: info.licenseEmail,
      licenseKey: info.licenseKey,
      signature: info.licenseSignature,
    });
  }

  private verifyLicenseSignature(license: LicenseActivationRequest): boolean {
    try {
      const publicKey = createPublicKey(PUBLIC_KEY_PEM);
      const data = `${license.email}|${license.licenseKey}`;
      const signature = Buffer.from(license.signature, 'base64');

      return verify('sha256', Buffer.from(data), publicKey, signature);
    } catch (error) {
      console.error('License verification failed:', error);
      return false;
    }
  }

  private shouldShowReminder(info: LicenseInfo, trialExpired: boolean): boolean {
    // Don't show if licensed
    if (info.licenseKey) return false;

    // Don't show if dismissed too many times
    if (info.reminderDismissedCount >= MAX_REMINDER_DISMISSALS) return false;

    // Show immediately after trial expires
    if (trialExpired && !info.lastReminderDate) return true;

    // Show weekly reminders
    if (info.lastReminderDate) {
      const lastReminder = new Date(info.lastReminderDate);
      const daysSince = this.daysSince(lastReminder);
      return daysSince >= REMINDER_INTERVAL_DAYS;
    }

    return false;
  }

  private getLicenseInfo(): LicenseInfo {
    const stmt = this.db.prepare('SELECT * FROM license_info WHERE id = 1');
    return stmt.get() as LicenseInfo;
  }

  private daysSince(date: Date): number {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }
}
```

**IPC Handlers**

```typescript
// src/main/domain/license/license.ipc.ts
import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '../../../shared/ipc/channels';
import { LicenseService } from './license.service';

export function registerLicenseHandlers(licenseService: LicenseService) {
  ipcMain.handle(IPC_CHANNELS.LICENSE_GET_STATUS, async () => {
    return licenseService.getStatus();
  });

  ipcMain.handle(IPC_CHANNELS.LICENSE_VALIDATE, async (_, request) => {
    return licenseService.activateLicense(request);
  });

  ipcMain.handle(IPC_CHANNELS.LICENSE_DISMISS_REMINDER, async () => {
    licenseService.dismissReminder();
  });
}
```

#### Phase 2: Renderer Components (Week 2)

**License Store**

```typescript
// src/renderer/features/license/license.store.ts
import { create } from 'zustand';
import type { LicenseStatus } from '../../../shared/types/license.types';

interface LicenseStore {
  status: LicenseStatus | null;
  loading: boolean;
  error: string | null;

  fetchStatus: () => Promise<void>;
  activateLicense: (email: string, licenseKey: string, signature: string) => Promise<boolean>;
  dismissReminder: () => Promise<void>;
}

export const useLicenseStore = create<LicenseStore>((set, get) => ({
  status: null,
  loading: false,
  error: null,

  fetchStatus: async () => {
    set({ loading: true, error: null });
    try {
      const status = await window.api['license:getStatus']();
      set({ status, loading: false });
    } catch (error) {
      set({ error: 'Failed to fetch license status', loading: false });
    }
  },

  activateLicense: async (email, licenseKey, signature) => {
    set({ loading: true, error: null });
    try {
      const result = await window.api['license:validate']({ email, licenseKey, signature });

      if (result.success) {
        await get().fetchStatus();
        return true;
      } else {
        set({ error: result.error || 'Activation failed', loading: false });
        return false;
      }
    } catch (error) {
      set({ error: 'Failed to activate license', loading: false });
      return false;
    }
  },

  dismissReminder: async () => {
    try {
      await window.api['license:dismissReminder']();
      await get().fetchStatus();
    } catch (error) {
      console.error('Failed to dismiss reminder:', error);
    }
  },
}));
```

**Trial Banner Component**

```typescript
// src/renderer/features/license/TrialBanner.tsx
import { useEffect } from 'react';
import { useLicenseStore } from './license.store';
import { cn } from '../../lib/utils';

export function TrialBanner() {
  const { status, fetchStatus, dismissReminder } = useLicenseStore();

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  if (!status || status.isLicensed || !status.showReminder) {
    return null;
  }

  const handlePurchase = () => {
    // Open purchase URL in default browser
    window.api['shell:openExternal']('https://gumroad.com/l/esquisse');
  };

  return (
    <div className={cn(
      'trial-banner',
      'bg-warning/10 border-b border-warning/20',
      'px-4 py-3 flex items-center justify-between gap-4'
    )}>
      <div className="flex-1">
        {status.trialExpired ? (
          <p className="text-sm">
            Your trial has expired. Please consider purchasing Esquisse to support development.
          </p>
        ) : (
          <p className="text-sm">
            Trial: <strong>{status.trialDaysRemaining} days remaining</strong>
          </p>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={handlePurchase}
          className="btn btn-sm btn-primary"
        >
          Purchase ($20)
        </button>
        <button
          onClick={dismissReminder}
          className="btn btn-sm btn-ghost"
        >
          Remind me later
        </button>
      </div>
    </div>
  );
}
```

**License Activation Modal**

```typescript
// src/renderer/features/license/LicenseActivationModal.tsx
import { useState } from 'react';
import { useLicenseStore } from './license.store';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function LicenseActivationModal({ isOpen, onClose }: Props) {
  const [email, setEmail] = useState('');
  const [licenseKey, setLicenseKey] = useState('');
  const { activateLicense, loading, error } = useLicenseStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // In real implementation, signature comes from purchase provider
    // For now, user receives full license data including signature
    const success = await activateLicense(email, licenseKey, '');

    if (success) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <dialog open className="modal modal-open">
      <div className="modal-box">
        <h3 className="font-bold text-lg mb-4">Activate License</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">
              <span className="label-text">Email Address</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input input-bordered w-full"
              placeholder="your@email.com"
              required
            />
          </div>

          <div>
            <label className="label">
              <span className="label-text">License Key</span>
            </label>
            <textarea
              value={licenseKey}
              onChange={(e) => setLicenseKey(e.target.value)}
              className="textarea textarea-bordered w-full font-mono text-xs"
              rows={4}
              placeholder="Paste your license key here"
              required
            />
          </div>

          {error && (
            <div className="alert alert-error">
              <span>{error}</span>
            </div>
          )}

          <div className="modal-action">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Activating...' : 'Activate'}
            </button>
          </div>
        </form>
      </div>
    </dialog>
  );
}
```

**Settings Page Integration**

```typescript
// src/renderer/pages/SettingsPage.tsx (add license section)

function LicenseSection() {
  const { status } = useLicenseStore();
  const [showActivation, setShowActivation] = useState(false);

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold">License</h2>

      {status?.isLicensed ? (
        <div className="alert alert-success">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <div>
            <div className="font-bold">Licensed</div>
            <div className="text-sm opacity-80">
              Thank you for supporting Esquisse!
              {status.licenseEmail && ` (${status.licenseEmail})`}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="alert alert-info">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <div className="font-bold">Trial Mode</div>
              <div className="text-sm opacity-80">
                {status?.trialDaysRemaining ?
                  `${status.trialDaysRemaining} days remaining` :
                  'Trial expired'
                }
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowActivation(true)}
              className="btn btn-primary"
            >
              Activate License
            </button>
            <button
              onClick={() => window.api['shell:openExternal']('https://gumroad.com/l/esquisse')}
              className="btn btn-outline"
            >
              Purchase License ($20)
            </button>
          </div>
        </div>
      )}

      <LicenseActivationModal
        isOpen={showActivation}
        onClose={() => setShowActivation(false)}
      />
    </section>
  );
}
```

#### Phase 3: License Generation (Offline Tool)

```typescript
// scripts/generate-license.ts
import { generateKeyPairSync, sign } from 'crypto';
import { randomUUID } from 'crypto';

// Generate key pair (run once, store securely)
function generateKeyPair() {
  const { publicKey, privateKey } = generateKeyPairSync('ed25519', {
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });

  console.log('PUBLIC KEY (embed in app):');
  console.log(publicKey);
  console.log('\nPRIVATE KEY (keep secret):');
  console.log(privateKey);
}

// Generate license for customer
function generateLicense(email: string, privateKeyPem: string) {
  const licenseKey = randomUUID();
  const data = `${email}|${licenseKey}`;

  const signature = sign('sha256', Buffer.from(data), {
    key: privateKeyPem,
    format: 'pem',
  });

  const licenseData = {
    email,
    licenseKey,
    signature: signature.toString('base64'),
  };

  console.log('\nLicense for:', email);
  console.log(JSON.stringify(licenseData, null, 2));

  return licenseData;
}

// CLI usage
const args = process.argv.slice(2);
if (args[0] === 'generate-keys') {
  generateKeyPair();
} else if (args[0] === 'generate-license') {
  const email = args[1];
  const privateKey = process.env.PRIVATE_KEY;

  if (!email || !privateKey) {
    console.error('Usage: npm run generate-license <email>');
    console.error('Set PRIVATE_KEY environment variable');
    process.exit(1);
  }

  generateLicense(email, privateKey);
}
```

**Package.json scripts**

```json
{
  "scripts": {
    "license:generate-keys": "tsx scripts/generate-license.ts generate-keys",
    "license:generate": "tsx scripts/generate-license.ts generate-license"
  }
}
```

#### Phase 4: Payment Integration

**Option 1: Gumroad (Recommended for Start)**

1. Create product on Gumroad
2. Set price ($20-25)
3. Enable "Generate license keys"
4. Configure webhook to auto-send license JSON to customer

**Option 2: LemonSqueezy**

- Lower fees (5% vs Gumroad's 10% for small sellers)
- Built-in EU VAT handling
- Better for digital products

**Option 3: Manual (Simplest)**

1. Accept payment via PayPal/Stripe
2. Manually run `npm run license:generate customer@email.com`
3. Email license data to customer
4. Scale to automated system later

---

## 5. Security Considerations

### Electron Security Reality Check

**Important Truth:**

- Electron apps are fundamentally inspectable
- ASAR archives can be extracted
- JavaScript code can be modified
- Determined users can always bypass client-side validation

**What This Means:**

- Don't waste time on aggressive DRM
- Focus on making honest users happy
- Accept that some piracy will occur
- Make buying easier than pirating

### Practical Security Measures

#### Do Implement

✅ **Cryptographic Signatures**

```typescript
// Use Ed25519 or RSA-2048 for license signing
// Store only public key in app
const isValid = ed25519.verify(publicKey, data, signature);
```

✅ **Obfuscation (Light)**

```javascript
// Use webpack/esbuild minification in production
// Split public key into parts
const KEY = [PART_A, PART_B, PART_C].join('');
```

✅ **Code Signing**

```bash
# Sign macOS app with Developer ID
codesign --deep --force --sign "Developer ID" Esquisse.app

# Notarize with Apple
xcrun notarytool submit Esquisse.dmg
```

✅ **Integrity Checks**

```typescript
// Verify critical files haven't been tampered
const expectedHash = '...';
const actualHash = sha256(readFileSync('license.db'));
if (expectedHash !== actualHash) {
  /* handle */
}
```

#### Don't Implement

❌ **Aggressive DRM**

- Don't make app hostile to legitimate users
- Don't implement invasive anti-debugging
- Don't phone home for validation

❌ **Security Through Obscurity**

- Don't rely on hidden checks
- Don't assume code can't be read
- Don't store secrets in JavaScript

❌ **Hardware Locking (for Esquisse)**

- Violates privacy principles
- Creates support burden
- Frustrates legitimate users

### Tamper Detection vs Prevention

**Detection** (Acceptable):

```typescript
// Detect if running in development/modified environment
if (isDevelopment() || isModified()) {
  // Log for analytics (if user consents)
  // Or show gentle reminder
}
```

**Prevention** (Not Recommended):

```typescript
// DON'T: Block execution if tampered
if (isTampered()) {
  app.quit(); // User-hostile!
}
```

### Philosophy

> "Make it easy to do the right thing (buy), slightly inconvenient to do the wrong thing (pirate), but never punish users who are trying to use the software legitimately."

---

## 6. Privacy Safeguards

### What to NEVER Collect

❌ **Hardware Identifiers**

- MAC addresses
- Disk serial numbers
- CPU IDs
- GPU information
- System UUIDs

❌ **Usage Telemetry**

- Feature usage statistics
- Session duration
- Journal entry counts
- Writing patterns

❌ **Personal Content**

- Journal text
- Search queries
- Tags or categories
- Export history

❌ **Network Identifiers**

- IP addresses
- Geographic location
- ISP information

### What's Acceptable to Store

✅ **User-Provided Data**

- License email address (explicitly provided)
- Purchase date (from license key)

✅ **Local Timestamps**

- Trial start date (local only)
- License activation date (local only)

✅ **Cryptographic Artifacts**

- License signatures (for validation)
- Public keys (embedded in app)

### GDPR Compliance Checklist

#### Data Minimization

- [ ] Collect only email address for license
- [ ] No automatic profiling or tracking
- [ ] No third-party analytics (unless opt-in)

#### User Rights

- [ ] Data export (already exists via backup system)
- [ ] Data deletion (clear database option)
- [ ] Access to stored data (show license info in settings)

#### Transparency

- [ ] Clear privacy policy
- [ ] Explain what data is stored locally
- [ ] No hidden data collection

#### Security

- [ ] Encrypt sensitive data at rest (optional)
- [ ] No transmission of personal data (local-only)
- [ ] Secure license signature verification

### Privacy-First License Design

```typescript
// GOOD: Minimal data storage
interface LicenseInfo {
  email: string; // User-provided
  purchaseDate: string; // From license
  licenseKey: string; // UUID, not personal
  signature: string; // Cryptographic verification
}

// BAD: Excessive data collection
interface LicenseInfo {
  email: string;
  machineId: string; // ❌ Hardware fingerprint
  ipAddress: string; // ❌ Network identifier
  usageStats: object; // ❌ Telemetry
  lastSeen: string; // ❌ Tracking
}
```

### User Communication

**Privacy Policy Snippet:**

> Esquisse is a privacy-first application. Your license information (email address and license key) is stored exclusively on your device and never transmitted to external servers. We do not collect usage data, analytics, or telemetry of any kind.

---

## 7. Industry Best Practices

### Success Stories

#### Obsidian

- **Model:** Free core app + paid cloud services
- **Pricing:** Sync $10/mo, Publish $10/mo
- **Philosophy:** Users pay for convenience, not core features
- **Result:** Sustainable business, fiercely loyal community
- **Lesson:** Align monetization with user values

#### Sublime Text

- **Model:** Perpetual fallback license ($99, 3 years updates)
- **Philosophy:** "Unlimited evaluation period" with gentle reminders
- **Result:** Widely adopted, high revenue despite honor system
- **Lesson:** Trust users, make buying easy and fair

#### Standard Notes

- **Model:** Open-source core + paid extensions
- **Pricing:** $10/mo for premium features
- **Philosophy:** Privacy-first reputation justifies premium
- **Result:** Sustainable subscription model
- **Lesson:** Privacy-conscious users will pay for aligned values

#### Sketch

- **Model:** Perpetual fallback license ($99/year for updates)
- **Philosophy:** Pay for updates, keep what you bought
- **Result:** Widely accepted as fair pricing
- **Lesson:** Users appreciate "pay for development" model

### Cautionary Tales

#### Day One's Subscription Shift

- **What happened:** Moved from $5 one-time to $50/year
- **Result:** Massive backlash, users fled to alternatives
- **Lesson:** Don't betray early adopters with pricing changes

#### Evernote's Decline

- **What happened:** Aggressive price increases + feature restrictions
- **Result:** Lost market dominance to privacy-focused competitors
- **Lesson:** Don't become user-hostile or compromise privacy

#### Ulysses Subscription Backlash

- **What happened:** Switched from paid app to subscription
- **Result:** Initial anger, eventually accepted
- **Lesson:** Subscriptions work if justified (cloud sync), otherwise risky

### Best Practice Principles

1. **Transparency**
   - Clearly explain what users pay for
   - No hidden fees or surprise charges
   - Honest communication about development costs

2. **Fairness**
   - Generous trial periods (30+ days)
   - Reasonable pricing ($15-30 for one-time)
   - Grandfather early adopters

3. **Respect**
   - No dark patterns or tricks
   - Easy to understand pricing
   - Honor user privacy commitments

4. **Value Alignment**
   - Monetization matches product values
   - Privacy-first products avoid tracking-based models
   - Clear value exchange (money for software/service)

5. **User Experience**
   - Simple activation process
   - Non-blocking trial reminders
   - Support for legitimate reactivation needs

---

## 8. Comparison Matrix

| Approach                 | Implementation Time | Complexity         | Security            | UX              | Privacy        | Maintenance   | Revenue Potential               |
| ------------------------ | ------------------- | ------------------ | ------------------- | --------------- | -------------- | ------------- | ------------------------------- |
| **Time-Based Trial**     | 1 week              | ⭐ Low             | ⚠️ Low (bypassable) | ✅ Excellent    | ✅ Perfect     | ⭐ Minimal    | 💰 Low (1-3%)                   |
| **Local License File**   | 2-3 weeks           | ⭐⭐ Medium        | ⭐⭐ Moderate       | ✅ Good         | ✅ Minimal     | ⭐⭐ Low      | 💰💰 Medium (5-10%)             |
| **Trial + License**      | 2-3 weeks           | ⭐⭐ Medium        | ⭐⭐ Moderate       | ✅ Excellent    | ✅ Minimal     | ⭐⭐ Low      | 💰💰 Medium (5-10%)             |
| **Hardware Fingerprint** | 3-4 weeks           | ⭐⭐⭐ High        | ⭐⭐⭐ Good         | ⚠️ Poor         | ❌ Concerning  | ⭐⭐⭐ Medium | 💰💰 Medium (8-12%)             |
| **Online Validation**    | 4+ weeks            | ⭐⭐⭐⭐ Very High | ⭐⭐⭐⭐ Excellent  | ❌ Poor         | ❌ Dealbreaker | ⭐⭐⭐⭐ High | 💰💰💰 High (15%+)              |
| **Honor System**         | 2 days              | ⭐ Trivial         | ❌ None             | ✅ Excellent    | ✅ Perfect     | ⭐ Minimal    | 💰 Very Low (<1%)               |
| **Freemium**             | 2-4 weeks           | ⭐⭐⭐ Medium-High | N/A                 | ⭐⭐ Acceptable | ✅ Depends     | ⭐⭐ Medium   | 💰💰 Medium (3-7%)              |
| **Perpetual Fallback**   | 3-4 weeks           | ⭐⭐⭐ High        | ⭐⭐ Moderate       | ✅ Excellent    | ✅ Minimal     | ⭐⭐⭐ Medium | 💰💰💰 High (10-15% + renewals) |
| **Subscription**         | 3-4 weeks           | ⭐⭐⭐ High        | ⭐⭐ Moderate       | ⭐⭐ Acceptable | ✅ Depends     | ⭐⭐⭐⭐ High | 💰💰💰 High (recurring)         |

### Legend

- **⭐** = Simple/Low/Minimal
- **✅** = Positive/Good
- **⚠️** = Caution/Moderate concern
- **❌** = Negative/Poor/Dealbreaker
- **💰** = Revenue potential (more = higher)

### Scoring Explanation

**Implementation Time:**

- How long to build and test
- Includes database, IPC, UI, testing

**Complexity:**

- Code complexity
- Ongoing maintenance burden
- Number of edge cases

**Security:**

- Resistance to casual piracy
- Not perfect security (impossible in Electron)

**UX (User Experience):**

- Ease of activation
- Friction during trial/usage
- Frustration level

**Privacy:**

- Amount of personal data collected
- Alignment with privacy-first philosophy

**Maintenance:**

- Ongoing support burden
- Bug fixes and updates
- Customer support needs

**Revenue Potential:**

- Expected conversion rate
- Average revenue per user
- Long-term sustainability

---

## 9. Recommendations

### For Esquisse Specifically

#### 🏆 Primary Recommendation: **Time-Based Trial + Local License**

**Why:**

1. ✅ Perfect alignment with privacy-first philosophy
2. ✅ No tracking, telemetry, or hardware fingerprinting
3. ✅ Generous user experience (30-day trial, non-blocking)
4. ✅ Proven model (Sublime Text, Sketch, etc.)
5. ✅ Reasonable revenue expectations (5-10% conversion)
6. ✅ Manageable implementation (2-3 weeks)

**Pricing:**

- **Trial:** 30 days (generous but not indefinite)
- **License:** $20-25 one-time purchase
- **Positioning:** "Support privacy-first, independent software"

**Implementation Priority:**

1. Week 1: Trial system (database, IPC, basic reminder UI)
2. Week 2: License validation (cryptography, activation flow)
3. Week 3: Purchase integration (Gumroad or manual)
4. Week 4: Testing, polish, documentation

---

#### ⚡ Alternative Recommendation: **Perpetual Fallback License**

**Consider if:**

- You want ongoing revenue to justify continued development
- You're comfortable with version tracking complexity
- You want to reward long-term users fairly

**Pricing:**

- **Initial:** $30 for 3 years of updates
- **Renewal:** $15 for 3 more years
- **Fallback:** Keep using last version forever

**Why Consider:**

- Higher lifetime value per customer
- Justifies ongoing development costs
- Users appreciate the fairness
- Proven successful (Sublime Text, Sketch)

**Added Complexity:**

- Version release date tracking
- Update eligibility logic
- Clear communication to users

---

### NOT Recommended for Esquisse

❌ **Hardware Fingerprinting**

- Violates privacy ethos
- Creates user friction
- Contradicts journaling app values

❌ **Online Validation**

- Requires internet (dealbreaker)
- Sends data to servers (privacy violation)
- Against "local-first" promise

❌ **Subscription Model**

- Hard to justify without cloud services
- Subscription fatigue
- Poor fit for local-only app

❌ **Aggressive DRM**

- User-hostile
- Damages reputation
- Alienates privacy-conscious audience

---

### Payment Processing

#### Start Simple: Gumroad

**Pros:**

- Quick setup (1 hour)
- Built-in license key delivery
- 10% fee (reasonable for small volume)
- No monthly costs

**Cons:**

- Higher fees at scale
- Limited customization

#### Scale Later: LemonSqueezy

**Pros:**

- 5% fee (better at scale)
- EU VAT handling
- Better developer experience
- More features (subscriptions, etc.)

**Cons:**

- Slightly more complex setup

#### Advanced: Paddle/Stripe

**Pros:**

- Full control
- Lower fees (2.9% + 30¢)
- Professional setup

**Cons:**

- Must handle VAT yourself
- More complex integration
- Merchant of record responsibilities

**Recommendation:** Start with Gumroad, migrate to LemonSqueezy if successful.

---

### Key Success Factors

1. **Transparency**
   - Explain why you charge
   - Show how it supports development
   - No hidden costs or surprises

2. **Generosity**
   - 30+ day trial (not 7 or 14)
   - Fair pricing ($20-25, not $50+)
   - No dark patterns

3. **Trust**
   - Never compromise privacy promise
   - Honor trial terms
   - Easy activation process

4. **Communication**
   - Clear value proposition
   - Respectful reminder messages
   - Responsive support

5. **Quality**
   - Great software justifies payment
   - Regular updates and improvements
   - Listen to user feedback

---

## 10. Next Steps

### If You Decide to Implement

#### Phase 1: Decision & Planning (Week 0)

- [ ] Review this document thoroughly
- [ ] Decide on approach (Trial + License recommended)
- [ ] Set pricing ($20-25 suggested)
- [ ] Choose payment processor (Gumroad to start)
- [ ] Plan messaging and communication

#### Phase 2: Backend Implementation (Week 1)

- [ ] Create database migration `003_add_trial_and_license`
- [ ] Implement `LicenseService` with validation logic
- [ ] Add IPC channels and handlers
- [ ] Write unit tests for license validation
- [ ] Generate Ed25519 key pair for signing

#### Phase 3: Frontend Implementation (Week 2)

- [ ] Create license Zustand store
- [ ] Build trial banner component
- [ ] Build license activation modal
- [ ] Add license section to settings page
- [ ] Implement reminder dismissal logic
- [ ] Test all UI flows

#### Phase 4: Purchase Flow (Week 3)

- [ ] Set up Gumroad product page
- [ ] Configure license key delivery
- [ ] Create license generation script
- [ ] Write customer email template
- [ ] Test end-to-end purchase flow
- [ ] Create support documentation

#### Phase 5: Testing & Polish (Week 4)

- [ ] Test trial expiration scenarios
- [ ] Test license activation edge cases
- [ ] Verify signature validation
- [ ] Test reminder dismissal limits
- [ ] Write integration tests
- [ ] Update user documentation
- [ ] Prepare launch announcement

#### Phase 6: Launch

- [ ] Deploy app update with licensing
- [ ] Announce to existing users (grandfather policy)
- [ ] Monitor activation success rate
- [ ] Respond to user questions
- [ ] Iterate based on feedback

---

### If You Want to Defer

#### Soft Launch Strategy

**Phase 1: Free Beta (Months 1-3)**

- Build user base
- Gather feedback
- Establish reputation
- No licensing yet

**Phase 2: Announce Pricing (Month 4)**

- Transparent communication
- Grandfather early users (free forever)
- Set trial/pricing for new users
- Give 30-60 day heads up

**Phase 3: Implement Licensing (Month 5)**

- Add trial system for new installs
- Launch purchase flow
- Maintain goodwill through transparency

**Risks:**

- Harder to monetize free users later
- Some churn when pricing announced

**Benefits:**

- Stronger initial user base
- Better product-market fit
- Word-of-mouth growth

---

### Questions to Answer Before Implementing

1. **Primary Goal**
   - Maximize revenue or maximize user base?
   - Full-time project or side project?

2. **Time Investment**
   - Can you allocate 3-4 weeks for implementation?
   - Can you handle ongoing support emails?

3. **Support Capacity**
   - Can you help users with activation issues?
   - Can you respond to refund requests?

4. **Long-Term Vision**
   - Is this a business or passion project?
   - Do you need recurring revenue?

5. **Ethical Stance**
   - Pure honor system vs gentle enforcement?
   - How do you feel about some users never paying?

6. **Communication**
   - How will you announce pricing to users?
   - What's your messaging/positioning?

---

### Recommended Decision Process

1. **Read this entire document**
2. **Sleep on it for a few days**
3. **Decide: Trial + License OR Honor System**
4. **Set pricing (if monetizing)**
5. **Choose payment processor**
6. **Review implementation plan**
7. **Commit to timeline**
8. **Execute phases 1-6**

---

## Conclusion

For Esquisse, a privacy-first journaling app, the ideal licensing approach is:

**Time-Based Trial (30 days) + Local License File**

This approach:

- Respects user privacy completely
- Provides generous trial period
- Offers simple, one-time payment
- Aligns with indie software values
- Proven successful by similar tools

**Avoid:**

- Hardware fingerprinting (privacy violation)
- Online validation (against local-first principles)
- Aggressive DRM (user-hostile)
- Subscriptions (hard to justify)

**The Philosophy:**

> Make it easy to do the right thing (buy), slightly inconvenient to do the wrong thing (pirate), but never punish legitimate users.

**Remember:**

- Some piracy will occur - accept it
- Focus on making honest users happy
- Trust-based relationships build loyalty
- Great software justifies its price

Good luck with your licensing implementation! 🎉

---

_For questions or clarifications about this document, refer to implementation code examples or consult Electron/licensing best practices._
