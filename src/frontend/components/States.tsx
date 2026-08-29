import React from 'react';
import { Inbox, AlertCircle } from 'lucide-react';
import { Button } from './Button.js';

interface EmptyStateProps {
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  icon?: React.ElementType;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionText,
  onAction,
  icon: Icon = Inbox,
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-12 text-center max-w-lg mx-auto my-6 shadow-sm">
      <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-base font-bold text-slate-900">{title}</h3>
      <p className="text-sm text-slate-500 mt-1 mb-6 leading-relaxed">{description}</p>
      {actionText && onAction && (
        <Button variant="primary" onClick={onAction}>
          {actionText}
        </Button>
      )}
    </div>
  );
};

export const LoadingState: React.FC<{ message?: string }> = ({ message = 'Loading records...' }) => (
  <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500 my-6 shadow-sm">
    <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
    <p className="text-sm font-medium text-slate-600">{message}</p>
  </div>
);

export const ErrorState: React.FC<{ title?: string; message: string; onRetry?: () => void }> = ({
  title = 'Unable to Load Data',
  message,
  onRetry,
}) => (
  <div className="bg-rose-50 border border-rose-200 text-rose-800 p-6 rounded-xl flex items-start space-x-3 my-4">
    <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
    <div className="flex-1">
      <h4 className="text-sm font-bold text-rose-900">{title}</h4>
      <p className="text-xs text-rose-700 mt-0.5">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-3 text-xs font-semibold text-rose-900 underline hover:text-rose-950"
        >
          Try Again
        </button>
      )}
    </div>
  </div>
);
