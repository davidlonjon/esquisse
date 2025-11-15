"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OverlayHUD = OverlayHUD;
var clsx_1 = require("clsx");
var react_1 = require("react");
var react_i18next_1 = require("react-i18next");
var useKeyboardShortcutsPanel_1 = require("@hooks/useKeyboardShortcutsPanel");
var KeyboardShortcutsPanel_1 = require("@layout/KeyboardShortcutsPanel");
var HUDPill = function (_a) {
    var label = _a.label;
    return (<div className="rounded-full bg-background/70 px-3 py-1 text-xs font-medium text-base-content/60 backdrop-blur-sm">
    {label}
  </div>);
};
var DEFAULT_SHORTCUTS = [
    {
        combo: '⌘,',
        labelKey: 'hud.keyboard.shortcut.settings.label',
        descriptionKey: 'hud.keyboard.shortcut.settings.description',
    },
    {
        combo: '⌘.',
        labelKey: 'hud.keyboard.shortcut.hudToggle.label',
        descriptionKey: 'hud.keyboard.shortcut.hudToggle.description',
    },
    {
        combo: '⌘[',
        labelKey: 'hud.keyboard.shortcut.previousEntry.label',
        descriptionKey: 'hud.keyboard.shortcut.previousEntry.description',
    },
    {
        combo: '⌘]',
        labelKey: 'hud.keyboard.shortcut.nextEntry.label',
        descriptionKey: 'hud.keyboard.shortcut.nextEntry.description',
    },
    {
        combo: '⌘K',
        labelKey: 'hud.keyboard.shortcut.search.label',
        descriptionKey: 'hud.keyboard.shortcut.search.description',
    },
    {
        combo: '⌘P',
        labelKey: 'hud.keyboard.shortcut.commandPalette.label',
        descriptionKey: 'hud.keyboard.shortcut.commandPalette.description',
    },
];
function OverlayHUD(_a) {
    var showTop = _a.showTop, showBottom = _a.showBottom, dateLabel = _a.dateLabel, wordCountLabel = _a.wordCountLabel, sessionLabel = _a.sessionLabel, snapshotLabel = _a.snapshotLabel, _b = _a.disabled, disabled = _b === void 0 ? false : _b;
    var t = (0, react_i18next_1.useTranslation)().t;
    var _c = (0, useKeyboardShortcutsPanel_1.useKeyboardShortcutsPanel)(), isShortcutsOpen = _c.isShortcutsOpen, openShortcuts = _c.openShortcuts, closeShortcuts = _c.closeShortcuts;
    var translatedDefaults = (0, react_1.useMemo)(function () {
        return DEFAULT_SHORTCUTS.map(function (shortcut) { return ({
            combo: shortcut.combo,
            label: t(shortcut.labelKey),
            description: shortcut.descriptionKey ? t(shortcut.descriptionKey) : undefined,
        }); });
    }, [t]);
    var shortcutList = translatedDefaults;
    var hudSuppressed = disabled || isShortcutsOpen;
    return (<>
      <div className={(0, clsx_1.default)('pointer-events-none fixed left-0 right-0 top-6 z-20 flex items-center justify-between px-10 transition-all duration-300 ease-out', showTop && !hudSuppressed ? 'opacity-100 translate-y-0' : '-translate-y-4 opacity-0')}>
        <div className="flex flex-wrap gap-2">
          <HUDPill label={dateLabel}/>
          <HUDPill label={wordCountLabel}/>
        </div>

        <div className="pointer-events-auto flex flex-wrap gap-2">
          <button type="button" onClick={function () {
            if (!disabled) {
                openShortcuts();
            }
        }} disabled={disabled} className={(0, clsx_1.default)('flex items-center gap-2 rounded-full bg-background/70 px-3 py-1 text-xs font-medium text-base-content/60 backdrop-blur-sm transition', disabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-background/80')}>
            <span className="rounded bg-muted/30 px-2 py-0.5 text-xs font-semibold text-base-content/50">
              ⌘/
            </span>
            <span className="text-base-content/60">{t('hud.keyboard.button')}</span>
          </button>
        </div>
      </div>

      <div className={(0, clsx_1.default)('pointer-events-none fixed bottom-6 left-0 right-0 z-20 flex items-center justify-between px-10 transition-all duration-300 ease-out', showBottom && !hudSuppressed ? 'opacity-100 translate-y-0' : 'translate-y-4 opacity-0')}>
        <div className="flex items-center gap-2 text-xs font-medium text-base-content/60">
          <span className="h-2 w-2 rounded-full bg-emerald-400"/>
          <span>
            {t('hud.session')} · {sessionLabel}
          </span>
        </div>

        <HUDPill label={snapshotLabel}/>
      </div>

      {isShortcutsOpen && (<KeyboardShortcutsPanel_1.KeyboardShortcutsPanel shortcuts={shortcutList} onClose={closeShortcuts} title={t('hud.keyboard.title')} description={t('hud.keyboard.subtitle')} closeLabel={t('hud.keyboard.close')}/>)}
    </>);
}
