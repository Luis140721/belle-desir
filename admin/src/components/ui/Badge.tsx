import React from 'react';

interface BadgeProps {
  variant?: 'success' | 'error' | 'warning' | 'info' | 'neutral';
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'neutral', children }) => {
  const variants = {
    success: 'bg-bd-success/10 text-bd-success border-bd-success/20',
    error: 'bg-bd-error/10 text-bd-error border-bd-error/20',
    warning: 'bg-bd-warning/10 text-bd-warning border-bd-warning/20',
    info: 'bg-bd-info/10 text-bd-info border-bd-info/20',
    neutral: 'bg-bd-muted/10 text-bd-muted border-bd-muted/20',
  };

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${variants[variant]}`}>
      {children}
    </span>
  );
};
