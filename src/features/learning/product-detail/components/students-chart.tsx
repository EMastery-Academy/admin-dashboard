import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Empty, ErrorAlert, Loading } from "@/components/ui/kit";
import { Icon } from "@/components/ui/icon";
import { formatNumber } from "@/lib/format";
import { useT } from "@/lib/i18n";
import {
  productQueries,
  type ProductSalesParams,
  type ProductSalesPoint,
  type ProductSalesSeries,
} from "@/lib/api";

type PresetRange = "30" | "90" | "365" | "all";
type LineMetric = "cumulative" | "orders";

function computeDateRange(preset: PresetRange): { start?: string; end?: string; bucket: "day" | "week" | "month" } {
  const now = new Date();
  const toDay = (d: Date) => d.toISOString().slice(0, 10);
  const end = toDay(now);

  if (preset === "30") {
    const start = toDay(new Date(now.getTime() - 29 * 86_400_000));
    return { start, end, bucket: "day" };
  } else if (preset === "90") {
    const start = toDay(new Date(now.getTime() - 89 * 86_400_000));
    return { start, end, bucket: "week" };
  } else if (preset === "365") {
    const start = toDay(new Date(now.getTime() - 364 * 86_400_000));
    return { start, end, bucket: "month" };
  }
  return { bucket: "month" };
}

interface StudentsChartProps {
  productRef: string;
  initialSeries?: ProductSalesSeries;
}

export function StudentsChart({ productRef, initialSeries }: StudentsChartProps) {
  const t = useT();
  const [preset, setPreset] = useState<PresetRange>("365");
  const [metric, setMetric] = useState<LineMetric>("cumulative");

  const queryParams = useMemo(() => {
    const range = computeDateRange(preset);
    const p: ProductSalesParams = { bucket: range.bucket };
    if (range.start) p.start = range.start;
    if (range.end) p.end = range.end;
    return p;
  }, [preset]);

  const salesQuery = useQuery({
    ...productQueries.sales(productRef, queryParams),
    initialData: preset === "365" && !queryParams.start ? initialSeries : undefined,
  });

  const series = salesQuery.data || initialSeries;

  // Prepare chart points with cumulative students
  const chartData = useMemo(() => {
    if (!series?.points?.length) return [];
    let running = series.students_before_start || 0;
    return series.points.map((pt) => {
      running += pt.new_students || 0;
      return {
        ...pt,
        periodLabel: pt.period,
        cumulative_students: running,
      };
    });
  }, [series]);

  return (
    <div className="cd-card cd-s12">
      <div className="cd-card__h" style={{ flexWrap: "wrap", gap: 12 }}>
        <h2>
          <Icon name="chart" className="cd-ic--sm" />
          {t("نمو الطلاب والطلبات", "Student Acquisition & Orders")}
        </h2>

        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10 }}>
          {/* Preset Buttons */}
          <div className="cd-seg" role="group" aria-label={t("الفترة", "Period")}>
            <button
              type="button"
              aria-pressed={preset === "30"}
              onClick={() => setPreset("30")}
              title={t("30 يوماً", "30 days")}
            >
              30d
            </button>
            <button
              type="button"
              aria-pressed={preset === "90"}
              onClick={() => setPreset("90")}
              title={t("90 يوماً", "90 days")}
            >
              90d
            </button>
            <button
              type="button"
              aria-pressed={preset === "365"}
              onClick={() => setPreset("365")}
              title={t("سنة", "12 months")}
            >
              12m
            </button>
            <button
              type="button"
              aria-pressed={preset === "all"}
              onClick={() => setPreset("all")}
              title={t("الكل", "All time")}
            >
              All
            </button>
          </div>

          {/* Line Toggle: Cumulative students vs Total orders */}
          <div className="cd-seg" role="group" aria-label={t("المقياس", "Metric")}>
            <button
              type="button"
              style={{ width: "auto", paddingInline: 10 }}
              aria-pressed={metric === "cumulative"}
              onClick={() => setMetric("cumulative")}
            >
              {t("تراكمي", "Cumulative")}
            </button>
            <button
              type="button"
              style={{ width: "auto", paddingInline: 10 }}
              aria-pressed={metric === "orders"}
              onClick={() => setMetric("orders")}
            >
              {t("الطلبات", "Orders")}
            </button>
          </div>
        </div>
      </div>

      <div className="cd-card__b">
        {salesQuery.isLoading && !series ? (
          <div style={{ height: 260, display: "grid", placeItems: "center" }}>
            <Loading />
          </div>
        ) : salesQuery.error ? (
          <ErrorAlert error={salesQuery.error} />
        ) : !chartData.length ? (
          <div style={{ height: 240, display: "flex" }}>
            <Empty icon="chart" text={t("لا توجد مبيعات في هذه الفترة.", "No sales in this period.")} />
          </div>
        ) : (
          <div>
            <div style={{ height: 280, width: "100%", marginBlockStart: 8 }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 12, right: 12, bottom: 4, left: 4 }}>
                  <CartesianGrid stroke="var(--line)" strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="periodLabel"
                    stroke="var(--text-muted)"
                    fontSize={12}
                    tickLine={false}
                    axisLine={{ stroke: "var(--line)" }}
                  />
                  <YAxis
                    stroke="var(--text-muted)"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomTooltip t={t} />} />
                  <Bar
                    dataKey="new_students"
                    name={t("طلاب جدد", "New Students")}
                    fill="var(--series-1, #2563eb)"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={40}
                  />
                  <Line
                    type="monotone"
                    dataKey={metric === "cumulative" ? "cumulative_students" : "orders"}
                    name={metric === "cumulative" ? t("إجمالي الطلاب التراكمي", "Cumulative Students") : t("إجمالي الطلبات", "Total Orders")}
                    stroke="var(--series-2, #10b981)"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: "var(--surface)", stroke: "var(--series-2, #10b981)", strokeWidth: 2 }}
                    activeDot={{ r: 5 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Legend & quick summary numbers */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 16,
                paddingTop: 12,
                borderTop: "1px solid var(--line)",
                fontSize: 13,
                color: "var(--text-muted)",
              }}
            >
              <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: "var(--series-1, #2563eb)" }} />
                  {t("طلاب جدد", "New Students")}
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 10, height: 2, background: "var(--series-2, #10b981)" }} />
                  {metric === "cumulative" ? t("الطلاب التراكمي", "Cumulative Students") : t("الطلبات", "Orders")}
                </span>
              </div>

              {series && (
                <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                  <span>
                    {t("إجمالي الطلاب المسجلين", "Total students")}: <b style={{ color: "var(--text)" }}>{formatNumber(series.total_students)}</b>
                  </span>
                  <span>
                    {t("إجمالي الطلبات", "Total orders")}: <b style={{ color: "var(--text)" }}>{formatNumber(series.total_orders)}</b>
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CustomTooltip({ active, payload, t }: any) {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload as ProductSalesPoint & { cumulative_students: number };
  const rev = data.revenue || {};
  const currencies = Object.keys(rev);

  return (
    <div
      style={{
        background: "var(--surface)",
        color: "var(--text)",
        border: "1px solid var(--line-strong)",
        borderRadius: "var(--radius-control)",
        padding: "10px 14px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        fontSize: 13,
        minWidth: 180,
      }}
    >
      <div style={{ fontWeight: 700, marginBlockEnd: 6, borderBottom: "1px solid var(--line)", paddingBottom: 4 }}>
        {data.period}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, marginBlock: 2 }}>
        <span style={{ color: "var(--text-muted)" }}>{t("طلاب جدد", "New students")}:</span>
        <span className="cd-num" style={{ fontWeight: 600 }}>{formatNumber(data.new_students)}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, marginBlock: 2 }}>
        <span style={{ color: "var(--text-muted)" }}>{t("الطلاب التراكمي", "Cumulative")}:</span>
        <span className="cd-num" style={{ fontWeight: 600 }}>{formatNumber(data.cumulative_students)}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, marginBlock: 2 }}>
        <span style={{ color: "var(--text-muted)" }}>{t("الطلبات", "Orders")}:</span>
        <span className="cd-num">{data.orders} ({data.paid_orders} {t("مدفوع", "paid")})</span>
      </div>
      {currencies.length > 0 && (
        <div style={{ marginBlockStart: 6, paddingTop: 4, borderTop: "1px solid var(--line)" }}>
          <div style={{ color: "var(--text-muted)", fontSize: 11, marginBlockEnd: 2 }}>
            {t("الإيراد", "Revenue")}:
          </div>
          {currencies.map((c) => (
            <div key={c} style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
              <span>{c}:</span>
              <span className="cd-num" style={{ fontWeight: 600 }}>
                {rev[c].toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
