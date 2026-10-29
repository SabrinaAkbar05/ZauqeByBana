import Link from 'next/link';
import { CheckCircle2, AlertTriangle, Sparkles } from 'lucide-react';
import type { ReactNode } from 'react';

export function PageHeading({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action && <div className="page-heading-action">{action}</div>}
    </div>
  );
}

export function Card({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={`card ${className}`}>{children}</section>;
}

export function Alert({
  searchParams,
}: {
  searchParams: { ok?: string; error?: string };
}) {
  if (!searchParams.ok && !searchParams.error) return null;
  const isError = Boolean(searchParams.error);
  return (
    <div
      role="status"
      className={`alert ${isError ? 'alert-error' : 'alert-ok'}`}
    >
      {isError ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
      <span>{searchParams.error || searchParams.ok}</span>
    </div>
  );
}

export function Empty({
  title,
  description,
  href,
  label,
}: {
  title: string;
  description?: string;
  href?: string;
  label?: string;
}) {
  return (
    <div className="empty">
      <div className="empty-glyph">
        <Sparkles size={24} />
      </div>
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {href && label && (
        <Link className="btn btn-primary" href={href}>
          {label}
        </Link>
      )}
    </div>
  );
}

export function Status({ value }: { value: string }) {
  return (
    <span className={`status status-${value}`}>
      {value.replaceAll('_', ' ')}
    </span>
  );
}

export const Field = ({
  label,
  children,
  className = '',
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) => (
  <label className={`field ${className}`}>
    <span>{label}</span>
    {children}
  </label>
);
