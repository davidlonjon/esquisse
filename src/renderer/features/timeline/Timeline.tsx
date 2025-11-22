import { TimelineFeed } from './components/TimelineFeed';
import { TimelineSidebar } from './components/TimelineSidebar';
import { TimelineRightSidebar } from './components/TimelineWidgets';

export function Timeline() {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-base-200 text-base-content">
      <TimelineSidebar />
      <TimelineFeed />
      <TimelineRightSidebar />
    </div>
  );
}
