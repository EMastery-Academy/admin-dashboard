import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, ComposedChart, Line, XAxis, YAxis } from "recharts";

import { dashboardSummary, productsReport, salesReport } from "@/lib/api";
import { percentDelta } from "@/lib/dates";
import { formatAmount, formatCompact, formatDate, formatMonth, formatNumber } from "@/lib/format";
import { useT } from "@/lib/i18n";
import { monthlyFromDays } from "@/lib/sales";
import { Card, Kpi, PageHead } from "@/components/ui/kit";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { HintSwatch, InfoHint } from "@/components/ui/info-hint";
import { PageState } from "@/components/ui/primitives";

const DAY_MS = 86_400_000;

const toDay = (date: Date) => {
  const copy = new Date(date);
  copy.setHours(12, 0, 0, 0);
  return copy.toISOString().slice(0, 10);
};

function defaultRange(): { from: string; to: string } {
  const to = new Date();
  const from = new Date(to.getTime() - 29 * DAY_MS);
  return { from: toDay(from), to: toDay(to) };
}

/** Previous window of the same length, immediately before `from`. */
function previousRange(from: string, to: string): { from: string; to: string } {
  const start = new Date(`${from}T12:00:00`);
  const end = new Date(`${to}T12:00:00`);
  const span = Math.max(1, Math.round((end.getTime() - start.getTime()) / DAY_MS) + 1);
  const prevEnd = new Date(start.getTime() - DAY_MS);
  const prevStart = new Date(prevEnd.getTime() - (span - 1) * DAY_MS);
  return { from: toDay(prevStart), to: toDay(prevEnd) };
}

export default function SalesOverviewPage() {
  const t = useT();
  const initial = useMemo(() => defaultRange(), []);
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);

  // Keep the range ordered so a reversed pick still works.
  const [start, end] = from <= to ? [from, to] : [to, from];
  const prev = useMemo(() => previousRange(start, end), [start, end]);

  const sales = useQuery({
    queryKey: ["sales-overview", "sales", start, end],
    queryFn: () => salesReport({ date1: start, date2: end }),
  });
  const prevSales = useQuery({
    queryKey: ["sales-overview", "sales-prev", prev.from, prev.to],
    queryFn: () => salesReport({ date1: prev.from, date2: prev.to }),
  });
  const products = useQuery({
    queryKey: ["sales-overview", "products", start, end],
    queryFn: () => productsReport({ start: `${start}T00:00:00`, end: `${end}T23:59:59` }),
  });
  const summary = useQuery({ queryKey: ["sales-overview", "summary"], queryFn: dashboardSummary });

  const revenue = sales.data?.totalSales ?? 0;
  const orders = sales.data?.totalOrders ?? 0;
  const aov = orders ? revenue / orders : 0;
  const prevRevenue = prevSales.data?.totalSales ?? 0;
  const prevOrders = prevSales.data?.totalOrders ?? 0;
  const prevAov = prevOrders ? prevRevenue / prevOrders : 0;

  const days = sales.data?.days ?? [];
  const months = monthlyFromDays(days);
  const topCourses = [...(products.data ?? [])].sort((a, b) => b.revenue - a.revenue).slice(0, 8);

  const comboConfig: ChartConfig = {
    amount: { label: t("الإيراد", "Revenue"), color: "var(--coral)" },
    numberOfOrders: { label: t("الطلبات", "Orders"), color: "var(--purple)" },
  };
  const monthlyConfig: ChartConfig = { amount: { label: t("مبيعات الشهر", "Monthly sales"), color: "var(--purple)" } };
  const coursesConfig: ChartConfig = { revenue: { label: t("الإيراد", "Revenue"), color: "var(--teal)" } };

  const error = sales.error ?? products.error ?? prevSales.error;

  return (
    <>
      <PageHead
        title={t("نظرة عامة على المبيعات", "Sales overview")}
        sub={t("اختر نطاقًا زمنيًا لعرض المبيعات خلاله.", "Pick a date range to see the sales inside it.")}
        actions={
          <div className="ma-toolbar" style={{ padding: 0, border: 0 }}>
            <label className="ma-field">
              <span className="ma-label">{t("من", "From")}</span>
              <input className="ma-input" type="date" value={from} max={to} onChange={(event) => setFrom(event.target.value)} />
            </label>
            <label className="ma-field">
              <span className="ma-label">{t("إلى", "To")}</span>
              <input className="ma-input" type="date" value={to} min={from} onChange={(event) => setTo(event.target.value)} />
            </label>
          </div>
        }
      />

      {error ? (
        <div className="ma-section-gap">
          <div className="ma-alert ma-alert--danger" role="alert">
            <div>
              <p className="ma-alert__title">{t("تعذّر تحميل المبيعات.", "Couldn't load sales.")}</p>
              <p className="ma-alert__text">{error instanceof Error ? error.message : String(error)}</p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="ma-cols ma-cols--3">
        <Kpi label={t("الإيرادات", "Revenue")} value={formatAmount(revenue)} delta={percentDelta(revenue, prevRevenue)} meta={t("مقارنة بالفترة السابقة", "vs previous period")} field="var(--coral)" />
        <Kpi label={t("الطلبات", "Orders")} value={formatNumber(orders)} delta={percentDelta(orders, prevOrders)} meta={t("مقارنة بالفترة السابقة", "vs previous period")} />
        <Kpi label={t("متوسط قيمة الطلب", "Average order value")} value={formatAmount(aov)} delta={percentDelta(aov, prevAov)} meta={t("مقارنة بالفترة السابقة", "vs previous period")} />
      </div>

      <div className="ma-section-gap">
        <Card
          title={
            <span className="ma-chart-title">
              {t("الإيراد والطلبات في النطاق", "Revenue & orders in range")}
              <InfoHint label={t("ما معنى هذا الرسم؟", "What does this chart show?")} title={t("الإيراد والطلبات", "Revenue & orders")}>
                <HintSwatch color="var(--coral)">{t("الأعمدة: إيراد كل يوم في النطاق المحدد (المحور الأيسر).", "Columns: each day's revenue in the selected range (left axis).")}</HintSwatch>
                <HintSwatch color="var(--purple)">{t("الخط: عدد الطلبات في اليوم نفسه (المحور الأيمن).", "Line: the number of orders that day (right axis).")}</HintSwatch>
                <span style={{ display: "block", marginTop: "var(--space-2)", color: "var(--text-muted)" }}>
                  {t("النطاق:", "Range:")} {start} → {end}
                </span>
              </InfoHint>
            </span>
          }
        >
          <PageState error={sales.error}>
            {days.length ? (
              <ChartContainer config={comboConfig} className="h-[320px] w-full" dir="ltr">
                <ComposedChart data={days} margin={{ top: 8, right: 12, bottom: 4, left: 4 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} minTickGap={20} tickFormatter={(value: string) => value.slice(5)} />
                  <YAxis yAxisId="revenue" width={56} domain={[0, "auto"]} tickLine={false} axisLine={false} tickFormatter={(value: number) => formatCompact(value)} />
                  <YAxis yAxisId="orders" orientation="right" width={40} domain={[0, "auto"]} tickLine={false} axisLine={false} allowDecimals={false} />
                  <ChartTooltip
                    cursor={{ fill: "var(--fill-soft)" }}
                    offset={8}
                    content={<ComboTooltip />}
                  />
                  <Bar yAxisId="revenue" dataKey="amount" fill="var(--color-amount)" radius={[4, 4, 0, 0]} maxBarSize={28} />
                  <Line yAxisId="orders" type="monotone" dataKey="numberOfOrders" stroke="var(--color-numberOfOrders)" strokeWidth={2} dot={false} />
                </ComposedChart>
              </ChartContainer>
            ) : (
              <p className="ma-muted">{t("لا مبيعات في هذا النطاق.", "No sales in this range.")}</p>
            )}
          </PageState>
        </Card>
      </div>

      <div className="ma-cols ma-cols--2 ma-section-gap">
        <Card
          title={
            <span className="ma-chart-title">
              {t("مبيعات الشهر", "Monthly sales")}
              <InfoHint label={t("ما معنى هذا الرسم؟", "What does this chart show?")} title={t("مبيعات الشهر", "Monthly sales")}>
                {t("كل عمود هو إجمالي إيراد شهر ميلادي داخل النطاق (نجمع أيام الشهر).", "Each column is one calendar month's total revenue inside the range (its days summed).")}
              </InfoHint>
            </span>
          }
        >
          <PageState error={sales.error}>
            {months.length ? (
              <ChartContainer config={monthlyConfig} className="h-[260px] w-full" dir="ltr">
                <BarChart data={months} margin={{ top: 8, right: 12, bottom: 4, left: 4 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis width={52} domain={[0, "auto"]} tickLine={false} axisLine={false} tickFormatter={(value: number) => formatCompact(value)} />
                  <ChartTooltip cursor={{ fill: "var(--fill-soft)" }} offset={8} content={<ChartTooltipContent labelFormatter={(label) => formatMonth(String(label))} valueFormatter={(value) => formatAmount(Number(value))} />} />
                  <Bar dataKey="amount" fill="var(--color-amount)" radius={[6, 6, 0, 0]} maxBarSize={54} />
                </BarChart>
              </ChartContainer>
            ) : (
              <p className="ma-muted">{t("لا مبيعات في هذا النطاق.", "No sales in this range.")}</p>
            )}
          </PageState>
        </Card>

        <Card
          title={
            <span className="ma-chart-title">
              {t("الدورات الأعلى إيرادًا", "Top courses by revenue")}
              <InfoHint label={t("ما معنى هذا الرسم؟", "What does this chart show?")} title={t("الدورات الأعلى إيرادًا", "Top courses by revenue")}>
                {t("كل عمود هو إيراد دورة داخل النطاق، مرتبة تنازليًا (أعلى 8).", "Each column is one course's revenue inside the range, sorted descending (top 8).")}
              </InfoHint>
            </span>
          }
        >
          <PageState error={products.error}>
            {topCourses.length ? (
              <ChartContainer config={coursesConfig} className="h-[260px] w-full" dir="ltr">
                <BarChart data={topCourses} margin={{ top: 8, right: 12, bottom: 4, left: 4 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="title"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    interval={0}
                    tickFormatter={(value: string) => (value.length > 14 ? `${value.slice(0, 14)}…` : value)}
                  />
                  <YAxis width={52} domain={[0, "auto"]} tickLine={false} axisLine={false} tickFormatter={(value: number) => formatCompact(value)} />
                  <ChartTooltip cursor={{ fill: "var(--fill-soft)" }} offset={8} content={<ChartTooltipContent valueFormatter={(value) => formatAmount(Number(value))} />} />
                  <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            ) : (
              <p className="ma-muted">{t("لا مبيعات في هذا النطاق.", "No sales in this range.")}</p>
            )}
          </PageState>
        </Card>
      </div>

      <div className="ma-section-gap">
        <Card title={t("الأرقام التراكمية", "All-time figures")}>
          <div className="ma-cols ma-cols--4">
            <Kpi label={t("الطلبات المدفوعة", "Paid orders")} value={formatNumber(summary.data?.paid_orders ?? 0)} />
            <Kpi label={t("التسجيلات المجانية", "Free enrolments")} value={formatNumber(summary.data?.free_enrollments ?? 0)} />
            <Kpi label={t("الكوبونات المستخدمة", "Coupons used")} value={formatNumber(summary.data?.promotions_used ?? 0)} />
            <Kpi label={t("المسوقون المعتمدون", "Approved affiliates")} value={formatNumber(summary.data?.referral_partners_approved ?? 0)} />
          </div>
        </Card>
      </div>
    </>
  );
}

/** Revenue (currency) and orders (count) share the tooltip, so each series formats itself. */
function ComboTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ dataKey?: string | number; value?: number; color?: string }>; label?: string }) {
  const t = useT();
  if (!active || !payload?.length) return null;
  return (
    <div className="ma-chart-tip">
      <span className="ma-chart-tip__label">{formatDate(String(label))}</span>
      <div className="ma-chart-tip__rows">
        {payload.map((item) => (
          <div className="ma-chart-tip__row" key={String(item.dataKey)}>
            <span className="ma-chart-tip__dot" style={{ "--c": item.color } as React.CSSProperties} />
            <span className="ma-chart-tip__name">{item.dataKey === "amount" ? t("الإيراد", "Revenue") : t("الطلبات", "Orders")}</span>
            <span className="ma-chart-tip__value">{item.dataKey === "amount" ? formatAmount(Number(item.value)) : formatNumber(Number(item.value))}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
