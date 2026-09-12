import React, { ReactNode } from 'react';
import { OverallStatus, Severity, ScanType } from '../types';

export function StatusBadge({ status }: { status: OverallStatus }) {
  const map: Record<OverallStatus, [string, string]> = {
    compliant: ['Compliant', 'green'],
    non_compliant: ['Non-Compliant', 'red'],
    review_required: ['Review Required', 'amber'],
    insufficient_image_quality: ['Quality Issue', 'slate'],
    pending: ['Pending', 'slate'],
    processing: ['Processing', 'blue'],
    failed: ['Failed', 'red']
  };
  const [label, tone] = map[status] || ['Unknown', 'slate'];
  return <span className={`badge ${tone}`}>{label}</span>;
}

export function SeverityBadge({ severity }: { severity: Severity }) {
  const tone = severity === 'critical' ? 'red' : severity === 'major' ? 'amber' : 'blue';
  return <span className={`badge ${tone}`}>{severity}</span>;
}

export function Page({
  title,
  subtitle,
  children,
  actions
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <section className="page">
      <div className="page-head">
        <div>
          <h1>{title}</h1>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {actions && <div className="page-actions">{actions}</div>}
      </div>
      {children}
    </section>
  );
}

export function Card({
  children,
  className = '',
  onClick
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <div className={`card ${className}`} onClick={onClick}>
      {children}
    </div>
  );
}
