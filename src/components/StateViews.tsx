import { Lang } from '@/lib/i18n';

export function LoadingSkeleton({ lang = 'en' }: { lang?: Lang }) {
  return (
    <div className="space-y-4 animate-pulse" aria-busy="true" aria-label="Loading content">
      <div className="h-44 bg-surface rounded-hero border border-line" />
      <div className="h-14 bg-surface rounded-panel border border-line" />
      <div className="h-32 bg-surface rounded-panel border border-line" />
      <span className="sr-only">
        {lang === 'hi' ? 'डेटा लोड हो रहा है...' : 'Loading clean air plan...'}
      </span>
    </div>
  );
}

export function EmptyState({
  title,
  message,
  actionLabel,
  onAction,
}: {
  title?: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="p-8 text-center bg-surface rounded-panel border border-line space-y-3">
      {title && <h3 className="font-display font-bold text-base text-ink">{title}</h3>}
      <p className="text-sm text-ink-muted max-w-sm mx-auto">{message}</p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-2 px-4 py-2 bg-sky text-on-sky rounded-control text-xs font-semibold"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
  lang = 'en',
}: {
  message: string;
  onRetry?: () => void;
  lang?: Lang;
}) {
  return (
    <div
      role="alert"
      className="p-6 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-panel text-center space-y-3"
    >
      <h3 className="font-display font-bold text-base text-danger-text">
        {lang === 'hi' ? 'डेटा प्राप्त करने में समस्या' : 'Air Data Temporarily Unavailable'}
      </h3>
      <p className="text-sm text-ink-muted max-w-md mx-auto">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="px-4 py-2 bg-surface hover:bg-haze border border-line rounded-control text-xs font-semibold"
        >
          {lang === 'hi' ? 'पुनः प्रयास करें' : 'Try Again'}
        </button>
      )}
    </div>
  );
}
