import React from 'react';
import { ShieldCheck, Sparkles, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { Badge } from './Badge.js';

interface ProvenanceBadgeProps {
  confidence?: number;
  isVerifiedManually?: boolean;
  className?: string;
}

export const ProvenanceBadge: React.FC<ProvenanceBadgeProps> = ({
  confidence,
  isVerifiedManually,
  className = '',
}) => {
  if (isVerifiedManually) {
    return (
      <Badge variant="success" icon={CheckCircle2} className={className}>
        Human Verified
      </Badge>
    );
  }

  if (confidence !== undefined) {
    const scorePct = Math.round(confidence * 100);
    const variant = confidence >= 0.85 ? 'info' : confidence >= 0.6 ? 'warning' : 'danger';
    return (
      <Badge variant={variant} icon={Sparkles} className={className}>
        AI Extracted ({scorePct}%)
      </Badge>
    );
  }

  return (
    <Badge variant="neutral" icon={Clock} className={className}>
      Unverified
    </Badge>
  );
};
