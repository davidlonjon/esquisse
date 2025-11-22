import { useTranslation } from 'react-i18next';

export function TimelineRightSidebar() {
  const { t } = useTranslation();

  // Mock data for "On This Day"
  const onThisDay = [
    { year: 2019, text: 'A short snippet from this date in 2019. Calm morning...' },
    { year: 2021, text: 'A short snippet from this date in 2021. Calm morning...' },
    { year: 2023, text: 'A short snippet from this date in 2023. Calm morning...' },
  ];

  return (
    <aside className="flex h-full w-80 flex-col border-l border-base-200 bg-base-100/50 dark:bg-base-200/20 px-6 pt-8 pb-6 text-base-content overflow-y-auto">
      <div className="mb-8">
        {/* Spacer to align with Sidebar "Collections" header (Button height + mb-6) */}
        <div className="mb-6 h-5" aria-hidden="true" />

        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-base-content/50">
          {t('timeline.onThisDay.title', 'On This Day')}
        </h2>
        <div className="space-y-4">
          {onThisDay.map((item) => (
            <div key={item.year} className="rounded-xl border border-base-200 bg-base-100 p-4">
              <div className="mb-2 font-medium">{item.year}</div>
              <p className="text-sm text-base-content/70 line-clamp-3">{item.text}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-base-content/50">
          {t('timeline.session.title', 'Session')}
        </h2>
        <div className="rounded-xl border border-base-200 bg-base-100 p-4">
          <div className="mb-2 font-medium">{t('timeline.session.today', 'Today')}</div>
          <div className="mb-4 text-xs text-base-content/60">
            {t(
              'timeline.session.stats',
              'Words: {{words}} · Entries: {{entries}} · Focus: {{focus}}m',
              {
                words: 412,
                entries: 2,
                focus: 18,
              }
            )}
          </div>
          <div className="h-24 w-full rounded-lg bg-primary/10 mb-2"></div>
          <p className="text-xs text-base-content/50">
            {t('timeline.session.feedback', 'Minimal feedback to avoid pressure.')}
          </p>
        </div>
      </div>
    </aside>
  );
}
