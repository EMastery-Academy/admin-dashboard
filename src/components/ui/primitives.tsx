import { cn } from "@/lib/cn";
import { formatNumber } from "@/lib/format";

export function Badge({ tone, children, className }: { tone?: string; children: React.ReactNode; className?: string }) {
  return <span className={cn("ma-badge", tone ? `ma-badge--${tone}` : undefined, className)}>{children}</span>;
}

export function Tag({ tone, children, className }: { tone?: string; children: React.ReactNode; className?: string }) {
  return <span className={cn("ma-tag", tone ? `ma-tag--${tone}` : undefined, className)}>{children}</span>;
}

const STATUS_TONES: Record<string, string> = {
  active: "success",
  published: "success",
  paid: "success",
  succeeded: "success",
  fulfilled: "success",
  pending: "warning",
  pending_payment: "warning",
  requested: "warning",
  draft: "info",
  failed: "danger",
  cancelled: "danger",
  blocked: "danger",
  suspended: "warning",
};

export function StatusBadge({ status }: { status: string | null | undefined }) {
  if (!status) return <span className="ma-dl__empty">—</span>;
  return <Badge tone={STATUS_TONES[status] ?? undefined}>{status.replace(/_/g, " ")}</Badge>;
}

export function PageState({ error, children }: { error?: unknown; children: React.ReactNode }) {
  if (error) {
    return (
      <div className="ma-alert ma-alert--danger" role="alert">
        {error instanceof Error ? error.message : "Something went wrong."}
      </div>
    );
  }
  return <>{children}</>;
}

export function StatTile({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) {
  return (
    <div className="ma-kpi">
      <div className="ma-kpi__label">{label}</div>
      <div className="ma-kpi__value">{value}</div>
      {hint ? <div className="ma-kpi__meta">{hint}</div> : null}
    </div>
  );
}

export function Pagination({
  total,
  limit,
  offset,
  onPage,
}: {
  total: number;
  limit: number;
  offset: number;
  onPage: (offset: number) => void;
}) {
  const from = total === 0 ? 0 : offset + 1;
  const to = Math.min(offset + limit, total);

  return (
    <div className="ma-pager">
      <button className="ma-btn ma-btn--sm" disabled={offset === 0} onClick={() => onPage(Math.max(0, offset - limit))}>
        Previous
      </button>
      <span>
        {formatNumber(from)}–{formatNumber(to)} / {formatNumber(total)}
      </span>
      <button
        className="ma-btn ma-btn--sm"
        disabled={to >= total}
        onClick={() => onPage(offset + limit)}
      >
        Next
      </button>
    </div>
  );
}

export type { Column } from "@/components/ui/data-table";
