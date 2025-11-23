import { useState } from 'react';

import { TimelineFeed } from './components/TimelineFeed';
import { TimelineSidebar } from './components/TimelineSidebar';
import { TimelineRightSidebar } from './components/TimelineWidgets';

export type TimelineFilter = 'all' | 'today' | 'morning' | 'work' | 'favorites';

export function Timeline() {
  const [filter, setFilter] = useState<TimelineFilter>('all');

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-base-200 text-base-content">
      <TimelineSidebar currentFilter={filter} onFilterChange={setFilter} />
      <TimelineFeed filter={filter} />
      <TimelineRightSidebar />
    </div>
  );
}
