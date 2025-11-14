import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

/**
 * Hotkeys Context
 * Provides centralized management for all keyboard shortcuts in the app
 */

interface HotkeysContextValue {
  /**
   * Whether global hotkeys are enabled
   * When false, all shortcuts except modal-specific ones are disabled
   */
  enabled: boolean;

  /**
   * Enable all global hotkeys
   */
  enable: () => void;

  /**
   * Disable all global hotkeys (e.g., when a modal is open)
   */
  disable: () => void;

  /**
   * Number of active modals
   * Used to track when to re-enable hotkeys
   */
  modalCount: number;

  /**
   * Increment modal count (opens a modal)
   */
  openModal: () => void;

  /**
   * Decrement modal count (closes a modal)
   */
  closeModal: () => void;
}

const HotkeysContext = createContext<HotkeysContextValue | undefined>(undefined);

interface HotkeysProviderProps {
  children: ReactNode;
}

export function HotkeysProvider({ children }: HotkeysProviderProps) {
  const [enabled, setEnabled] = useState(true);
  const [modalCount, setModalCount] = useState(0);

  // Sync enabled state with modal count
  useEffect(() => {
    setEnabled(modalCount === 0);
  }, [modalCount]);

  const enable = () => setEnabled(true);
  const disable = () => setEnabled(false);

  const openModal = () => {
    setModalCount((prev) => prev + 1);
  };

  const closeModal = () => {
    setModalCount((prev) => Math.max(0, prev - 1));
  };

  const value: HotkeysContextValue = {
    enabled,
    enable,
    disable,
    modalCount,
    openModal,
    closeModal,
  };

  return <HotkeysContext.Provider value={value}>{children}</HotkeysContext.Provider>;
}

/**
 * Hook to access hotkeys context
 */
export function useHotkeysContext() {
  const context = useContext(HotkeysContext);
  if (context === undefined) {
    throw new Error('useHotkeysContext must be used within a HotkeysProvider');
  }
  return context;
}
