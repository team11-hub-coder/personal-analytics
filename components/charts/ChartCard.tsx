import { card } from "@/lib/theme";

interface ChartCardProps {
  /** Card title */
  title: string;
  /** Optional subtitle or description */
  subtitle?: string;
  /** Chart content */
  children: React.ReactNode;
  /** Additional classes for the outer container */
  className?: string;
  /** Optional action element in the header (e.g. a button or link) */
  action?: React.ReactNode;
}

export default function ChartCard({
  title,
  subtitle,
  children,
  className = "",
  action,
}: ChartCardProps) {
  return (
    <div className={`${card.base} ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium text-[var(--color-text-secondary)]">
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
        {action && <div>{action}</div>}
      </div>
      {children}
    </div>
  );
}
