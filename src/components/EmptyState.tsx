import React from 'react';
import { InfoIcon } from './Icons';

interface EmptyStateProps {
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
}

export function EmptyState({ title, description, actionText, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-panel border border-dashed border-line bg-surface/50 p-8 text-center">
      <div className="mb-3 rounded-full bg-haze p-3 text-ink-muted">
        <InfoIcon size={24} />
      </div>
      <h3 className="text-lg font-bold text-ink">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-ink-muted">{description}</p>
      {actionText && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 rounded-control bg-sky px-4 py-2 text-sm font-semibold text-on-sky shadow-sm transition-colors hover:bg-sky-deep focus:outline-none focus:ring-2 focus:ring-sky"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}
