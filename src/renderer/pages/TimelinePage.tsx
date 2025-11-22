import { Timeline } from '@features/timeline';
import { useGlobalHotkeys } from '@hooks/useGlobalHotkeys';

import { router } from '../router';

export function TimelinePage() {
  // Register shortcut to go back to editor (Escape or standard navigation)
  // For now, let's just allow standard navigation.
  // Maybe we want to close timeline with Escape?
  useGlobalHotkeys('escape', () => {
    router.navigate({ to: '/' });
  });

  return <Timeline />;
}
