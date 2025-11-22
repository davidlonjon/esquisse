import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Palette, Type, Clock3 } from 'lucide-react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { SettingsSidebar, type Section, type SectionId } from './SettingsSidebar';

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue?: string) => defaultValue || key,
  }),
}));

describe('SettingsSidebar', () => {
  const mockSections: Section[] = [
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'editor', label: 'Editor', icon: Type },
    { id: 'autosave', label: 'Autosave', icon: Clock3 },
  ];

  const defaultProps = {
    sections: mockSections,
    activeSection: 'appearance' as SectionId,
    onSectionClick: vi.fn(),
    onBack: vi.fn(),
    isLoading: false,
    error: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render sidebar with title', () => {
      render(<SettingsSidebar {...defaultProps} />);

      expect(screen.getByText('settings.title')).toBeInTheDocument();
      // Description was removed from sidebar
      expect(screen.queryByText('settings.description')).not.toBeInTheDocument();
    });

    it('should render back button', () => {
      render(<SettingsSidebar {...defaultProps} />);

      const backButton = screen.getByRole('button', { name: /Back to app/i });
      expect(backButton).toBeInTheDocument();
    });

    it('should render all sections', () => {
      render(<SettingsSidebar {...defaultProps} />);

      expect(screen.getByRole('button', { name: /Appearance/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Editor/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Autosave/i })).toBeInTheDocument();
    });

    it('should highlight active section', () => {
      render(<SettingsSidebar {...defaultProps} activeSection="editor" />);

      const editorButton = screen.getByRole('button', { name: /Editor/i });
      expect(editorButton).toHaveClass('bg-primary/10', 'text-primary');
    });

    it('should not highlight inactive sections', () => {
      render(<SettingsSidebar {...defaultProps} activeSection="editor" />);

      const appearanceButton = screen.getByRole('button', { name: /Appearance/i });
      expect(appearanceButton).toHaveClass('text-base-content/70', 'hover:bg-base-200');
      expect(appearanceButton).not.toHaveClass('bg-primary/10', 'text-primary');
    });
  });

  describe('Loading and Error States', () => {
    it('should display loading message when isLoading is true', () => {
      render(<SettingsSidebar {...defaultProps} isLoading={true} />);

      expect(screen.getByText('settings.loading')).toBeInTheDocument();
    });

    it('should display error message when error is provided', () => {
      render(<SettingsSidebar {...defaultProps} error="Failed to load settings" />);

      expect(screen.getByText('Failed to load settings')).toBeInTheDocument();
    });

    it('should not display loading/error section when both are false/null', () => {
      render(<SettingsSidebar {...defaultProps} />);

      expect(screen.queryByText('settings.loading')).not.toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should call onBack when back button is clicked', async () => {
      const user = userEvent.setup();
      const onBack = vi.fn();
      render(<SettingsSidebar {...defaultProps} onBack={onBack} />);

      const backButton = screen.getByRole('button', { name: /Back to app/i });
      await user.click(backButton);

      expect(onBack).toHaveBeenCalledTimes(1);
    });

    it('should call onSectionClick with correct id when section is clicked', async () => {
      const user = userEvent.setup();
      const onSectionClick = vi.fn();
      render(<SettingsSidebar {...defaultProps} onSectionClick={onSectionClick} />);

      const editorButton = screen.getByRole('button', { name: /Editor/i });
      await user.click(editorButton);

      expect(onSectionClick).toHaveBeenCalledTimes(1);
      expect(onSectionClick).toHaveBeenCalledWith('editor');
    });

    it('should call onSectionClick for each different section', async () => {
      const user = userEvent.setup();
      const onSectionClick = vi.fn();
      render(<SettingsSidebar {...defaultProps} onSectionClick={onSectionClick} />);

      await user.click(screen.getByRole('button', { name: /Appearance/i }));
      await user.click(screen.getByRole('button', { name: /Editor/i }));
      await user.click(screen.getByRole('button', { name: /Autosave/i }));

      expect(onSectionClick).toHaveBeenCalledTimes(3);
      expect(onSectionClick).toHaveBeenNthCalledWith(1, 'appearance');
      expect(onSectionClick).toHaveBeenNthCalledWith(2, 'editor');
      expect(onSectionClick).toHaveBeenNthCalledWith(3, 'autosave');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty sections array', () => {
      render(<SettingsSidebar {...defaultProps} sections={[]} />);

      expect(screen.getByText('settings.title')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Appearance/i })).not.toBeInTheDocument();
    });

    it('should handle single section', () => {
      const singleSection = [{ id: 'appearance' as SectionId, label: 'Appearance', icon: Palette }];
      render(<SettingsSidebar {...defaultProps} sections={singleSection} />);

      expect(screen.getByRole('button', { name: /Appearance/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Editor/i })).not.toBeInTheDocument();
    });
  });
});
