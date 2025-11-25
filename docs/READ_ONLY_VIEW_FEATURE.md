# Implementation Plan: Read-Only View for Past Entries

## Overview

Implement a read-only mode for entries with the ability to toggle edit mode via keyboard shortcut. By default, only new blank drafts are editable. All saved entries (including the newest) are read-only until toggled with Cmd+Shift+E.

## Behavior Specification

### Default States:

1. **New Blank Draft** (currentEntry = null):
   - Read-only by default: NO (editable)
   - Can toggle with Cmd+Shift+E: YES

2. **All Saved Entries** (including newest):
   - Read-only by default: YES
   - Can toggle with Cmd+Shift+E: YES

### Read-Only Mode Display:

- Editor is not editable (Tiptap editable=false)
- Session timer: HIDDEN
- Autosave: DISABLED
- Bottom-right HUD shows: "Last updated {date}" instead of snapshot status

### Edit Mode Display:

- Editor is editable (Tiptap editable=true)
- Session timer: SHOWN and RUNNING
- Autosave: ENABLED
- Bottom-right HUD shows: "Snapshot saved/pending"

### Toggle Behavior:

- Cmd+Shift+E toggles between read-only and edit mode
- Works on ALL entries (newest and past)
- Toggle state resets when navigating to a different entry

## Implementation Steps

### Phase 1: Add Read-Only State Management

**File**: `src/renderer/hooks/useEditorController.ts`

1. Add state for tracking edit mode override:

   ```typescript
   const [isEditModeOverride, setIsEditModeOverride] = useState<boolean | null>(null);
   ```

2. Create utility to determine if entry is newest:

   ```typescript
   const isNewestEntry =
     currentEntry === null || (entries.length > 0 && currentEntry?.id === entries[0]?.id);
   ```

3. Calculate read-only state:

   ```typescript
   const isReadOnly = isEditModeOverride !== null ? !isEditModeOverride : !isNewestEntry;
   ```

4. Reset override when entry changes:
   ```typescript
   useEffect(() => {
     setIsEditModeOverride(null);
   }, [currentEntry?.id]);
   ```

### Phase 2: Update Editor Component

**File**: `src/renderer/features/editor/Editor.tsx`

1. Add `editable` prop to `EditorProps` interface
2. Update Tiptap editor effect to respect editability:
   ```typescript
   useEffect(() => {
     if (editor && !editor.isDestroyed) {
       editor.setEditable(editable ?? true);
     }
   }, [editor, editable]);
   ```
3. Pass `editable` prop from EditorPage/Controller

**File**: `src/renderer/features/editor/types.ts`

- Add `editable?: boolean` to EditorProps

### Phase 3: Conditional Session Timer & Autosave

**File**: `src/renderer/hooks/useEditorController.ts`

1. Conditionally call `useSessionTimer`:

   ```typescript
   const sessionTimer = !isReadOnly ? useSessionTimer() : { seconds: 0, reset: () => {} };
   ```

2. Update autosave enabled flag:
   ```typescript
   const autoSave = useAutoSave({
     onSave: async (htmlContent) => {
       /* ... */
     },
     enabled: !isReadOnly && initialization.status === 'success',
   });
   ```

### Phase 4: Update HUD Display

**File**: `src/renderer/components/layout/OverlayHUD.tsx`

1. Add props:
   - `isReadOnly: boolean`
   - `lastUpdatedLabel?: string`

2. Update bottom bar conditional rendering:
   ```typescript
   {isReadOnly ? (
     <HUDPill label={lastUpdatedLabel ?? ''} />
   ) : (
     <>
       <div className="flex items-center gap-2 text-xs font-medium text-base-content/60">
         <span className="h-2 w-2 rounded-full bg-emerald-400" />
         <span>{t('hud.session')} · {sessionLabel}</span>
       </div>
       <HUDPill label={snapshotLabel} />
     </>
   )}
   ```

**File**: `src/renderer/hooks/useEditorController.ts`

3. Add `lastUpdatedLabel` to HUD view model:

   ```typescript
   const lastUpdatedLabel = useMemo(() => {
     if (!currentEntry) return '';
     const updatedDate = new Date(currentEntry.updatedAt);
     return t('hud.lastUpdated', { date: dateFormatter.format(updatedDate) });
   }, [currentEntry, dateFormatter, t]);
   ```

4. Add to HudViewModel interface and return object

### Phase 5: Add Keyboard Shortcut

**File**: `src/renderer/config/shortcuts.ts`

1. Add to ShortcutId type: `'toggleEditMode'`

2. Add shortcut definition:
   ```typescript
   {
     id: 'toggleEditMode',
     keys: 'mod+shift+e',
     category: 'editor',
     location: 'hooks/useEditorController.ts',
     globallyControlled: true,
     display: {
       labelKey: 'hud.keyboard.shortcut.toggleEditMode.label',
       descriptionKey: 'hud.keyboard.shortcut.toggleEditMode.description',
       combos: { mac: '⇧⌘E', windows: 'Shift+Ctrl+E' },
     },
   }
   ```

**File**: `src/renderer/hooks/useEditorController.ts`

3. Register shortcut handler:
   ```typescript
   useGlobalHotkeys(
     'mod+shift+e',
     (event) => {
       event.preventDefault();
       setIsEditModeOverride((prev) => (prev === null ? !isNewestEntry : !prev));
       showHudTemporarily();
     },
     { preventDefault: true }
   );
   ```

### Phase 6: Add Translation Keys

**Files**:

- `src/renderer/locales/en/common.json`
- `src/renderer/locales/fr/common.json`

Add keys:

```json
{
  "hud": {
    "lastUpdated": "Last updated {date}",
    "keyboard": {
      "shortcut": {
        "toggleEditMode": {
          "label": "Toggle Edit Mode",
          "description": "Switch between read-only and edit mode"
        }
      }
    }
  }
}
```

French:

```json
{
  "hud": {
    "lastUpdated": "Mis à jour {date}",
    "keyboard": {
      "shortcut": {
        "toggleEditMode": {
          "label": "Basculer mode édition",
          "description": "Alterner entre lecture seule et mode édition"
        }
      }
    }
  }
}
```

### Phase 7: Update Types

**File**: `src/renderer/hooks/useEditorController.ts`

Update `HudViewModel` interface:

```typescript
interface HudViewModel {
  isVisible: boolean;
  isReadOnly: boolean;
  dateLabel: string;
  wordCountLabel: string;
  sessionLabel: string;
  snapshotLabel: string;
  lastUpdatedLabel: string;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}
```

## Files to Modify (7 files)

1. `src/renderer/hooks/useEditorController.ts` - Core logic
2. `src/renderer/features/editor/Editor.tsx` - Editor editability
3. `src/renderer/features/editor/types.ts` - EditorProps interface
4. `src/renderer/components/layout/OverlayHUD.tsx` - HUD display
5. `src/renderer/config/shortcuts.ts` - Shortcut definition
6. `src/renderer/locales/en/common.json` - English translations
7. `src/renderer/locales/fr/common.json` - French translations

## Testing Checklist

- [ ] Newest entry is editable by default
- [ ] Past entries are read-only by default
- [ ] Cmd+Shift+E toggles edit mode on newest entry
- [ ] Cmd+Shift+E toggles edit mode on past entries
- [ ] Session timer shows only in edit mode
- [ ] Autosave works only in edit mode
- [ ] "Last updated" shows in read-only mode
- [ ] Toggle state resets when navigating to different entry
- [ ] Keyboard shortcut appears in shortcuts panel
- [ ] Both English and French translations work
