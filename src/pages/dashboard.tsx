import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CartesianGrid, Bar, BarChart, Line, LineChart, XAxis, YAxis } from "recharts";

import {
  dashboardSummary,
  listOrders,
  listReferralPayouts,
  listSupportTickets,
  productsReport,
  salesReport,
  type AdminOrder,
  type DailySalesPoint,
  type DashboardSummary,
  type ProductSalesRow,
} from "@/lib/api";
import { formatAmount, formatCompact, formatDate, formatDayMonth, formatMonth, formatNumber, formatShortDay } from "@/lib/format";
import { buildWindows, percentDelta } from "@/lib/dates";
import { monthlyFromDays } from "@/lib/sales";
import { useT } from "@/lib/i18n";
import { useTimeGreeting } from "@/lib/greeting";
import { orderStatusBadge, PALETTE, initialsOf } from "@/lib/status";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { HintSwatch, InfoHint } from "@/components/ui/info-hint";
import { CountUp } from "@/components/motion/count-up";
import { WavingHand } from "@/components/motion/waving-hand";
import { ViewAllLink } from "@/components/ui/view-all-link";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Avatar, Badge, Bars, Button, Card, Dl, Kpi } from "@/components/ui/kit";
import { Alert } from "@/components/ui/kit";
import { Icon } from "@/components/ui/icon";

const RANGES: { days: number; ar: string; en: string }[] = [
  { days: 7, ar: "آخر 7 أيام", en: "Last 7 days" },
  { days: 30, ar: "آخر 30 يومًا", en: "Last 30 days" },
  { days: 90, ar: "آخر 90 يومًا", en: "Last 90 days" },
];

export default function DashboardPage() {
  const t = useT();
  const greeting = useTimeGreeting();
  const [days, setDays] = useState(30);
  
  const windows = useMemo(() => buildWindows(days), [days]);

  const summary = useQuery({ queryKey: ["dashboard", "summary"], queryFn: dashboardSummary });
  const sales = useQuery({
    queryKey: ["dashboard", "sales", windows.current.start],
    queryFn: () => salesReport({ date1: windows.current.start, date2: windows.current.end }),
  });
  const prevSales = useQuery({
    queryKey: ["dashboard", "sales-prev", windows.previous.start],
    queryFn: () => salesReport({ date1: windows.previous.start, date2: windows.previous.end }),
  });
  const products = useQuery({
    queryKey: ["dashboard", "products", windows.current.start],
    queryFn: () => productsReport(windows.current),
  });
  const orders = useQuery({ queryKey: ["dashboard", "orders"], queryFn: () => listOrders({ limit: 6 }) });

  const chartData = alignSeries(sales.data?.days, prevSales.data?.days);
  const months = monthlyFromDays(sales.data?.days ?? []);
  const revenue = sales.data?.totalSales ?? 0;
  const prevRevenue = prevSales.data?.totalSales ?? 0;
  const orderCount = sales.data?.totalOrders ?? 0;
  const prevOrderCount = prevSales.data?.totalOrders ?? 0;
  const aov = orderCount ? revenue / orderCount : 0;
  const prevAov = prevOrderCount ? prevRevenue / prevOrderCount : 0;

  const revenueConfig: ChartConfig = {
    current: { label: t("الفترة الحالية", "This period"), color: "var(--coral)" },
    previous: { label: t("الفترة السابقة", "Previous period"), color: "var(--purple)" },
  };

  const monthlyConfig: ChartConfig = {
    amount: { label: t("مبيعات الشهر", "Monthly sales"), color: "var(--purple)" },
  };

  const top = (products.data ?? []).slice(0, 6);
  const loadError = summary.error ?? sales.error ?? prevSales.error ?? products.error ?? orders.error;
  const orderColumns: Column<AdminOrder>[] = [
    {
      key: "order",
      header: t("الطلب", "Order"),
      cell: (row) => (
        <>
          <span className="ma-cell-main"><bdi>#{row.order_id.slice(0, 8)}</bdi></span>
          <span className="ma-cell-sub">{formatDayMonth(row.created_at ?? undefined)}</span>
        </>
      ),
    },
    {
      key: "customer",
      header: t("العميل", "Customer"),
      cell: (row) => (
        <span className="ma-cell-flex">
          <Avatar initials={initialsOf(row.customer_email)} color="var(--sky)" />
          <span className="ma-cell-main"><bdi>{row.customer_email}</bdi></span>
        </span>
      ),
    },
    { key: "total", header: t("الإجمالي", "Total"), align: "end", cell: (row) => formatAmount(row.amount_minor / 100, row.currency_code) },
    { key: "status", header: t("الحالة", "Status"), cell: (row) => <Badge def={orderStatusBadge(row.status)} /> },
  ];

  return (
    <>
      <header className="ma-page-head">
        <div className="ma-page-head__text">
          <h1>
            <span>{t(greeting.ar, greeting.en)}</span>
            <WavingHand />
          </h1>
          <p className="ma-page-head__sub">{t("ملخص أداء المنصة وما ينتظرك اليوم.", "How the academy is doing, and what needs you today.")}</p>
        </div>
        <div className="ma-page-head__actions">
          <label className="ma-field">
            <select className="ma-select" value={days} onChange={(event) => setDays(Number(event.target.value))}>
              {RANGES.map((range) => (
                <option key={range.days} value={range.days}>
                  {t(range.ar, range.en)}
                </option>
              ))}
            </select>
          </label>
          <Button label={t("إنشاء دورة", "Create course")} icon="plus" kind="primary" href="/learning/courses/new" />
        </div>
      </header>

      {loadError ? (
        <div className="ma-section-gap">
          <Alert kind="danger" title={t("تعذّر تحميل بعض البيانات.", "Some data couldn't be loaded.")}>
            {loadError instanceof Error ? loadError.message : String(loadError)}
          </Alert>
        </div>
      ) : null}

      <div className="ma-cols ma-cols--3">
        <Kpi label={t("الإيرادات المدفوعة", "Paid revenue")} value={formatAmount(revenue)} delta={percentDelta(revenue, prevRevenue)} meta={t("مقارنة بالفترة السابقة", "vs previous period")} field="var(--coral)" />
        <Kpi label={t("الطلبات المدفوعة", "Paid orders")} value={<CountUp value={orderCount} />} delta={percentDelta(orderCount, prevOrderCount)} meta={t("مقارنة بالفترة السابقة", "vs previous period")} />
        <Kpi label={t("متوسط قيمة الطلب", "Average order value")} value={formatAmount(aov)} delta={percentDelta(aov, prevAov)} meta={t("مقارنة بالفترة السابقة", "vs previous period")} />
      </div>

      <div className="ma-cols ma-cols--main-side ma-section-gap">
        <Card
          title={
            <span className="ma-chart-title">
              {t("الإيرادات اليومية", "Daily revenue")}
              <InfoHint label={t("ما معنى الخطوط؟", "What do the lines mean?")} title={t("الإيرادات اليومية", "Daily revenue")}>
                <HintSwatch color="var(--coral)">{t("الفترة الحالية: إيراد كل يوم في النطاق المحدد.", "This period: revenue for each day in the selected range.")}</HintSwatch>
                <HintSwatch color="var(--purple)">{t("الفترة السابقة: نفس عدد الأيام قبل النطاق الحالي، للمقارنة.", "Previous period: the same number of days immediately before the range, for comparison.")}</HintSwatch>
                <span style={{ display: "block", marginTop: "var(--space-2)", color: "var(--text-muted)" }}>
                  {t("النطاق الحالي:", "Current range:")} {t(`${days} يومًا`, `last ${days} days`)}
                </span>
              </InfoHint>
            </span>
          }
          actions={<Button label={t("تقرير المبيعات", "Sales report")} href="/analytics/sales" sm />}
        >
          <div className="ma-legend" style={{ marginBottom: 8 }}>
            <span style={{ "--c": "var(--coral)" } as React.CSSProperties}>{t("الفترة الحالية", "This period")}</span>
            <span style={{ "--c": "var(--purple)" } as React.CSSProperties}>{t("الفترة السابقة", "Previous period")}</span>
          </div>
          {chartData.length ? (
            <ChartContainer config={revenueConfig} className="h-[280px] w-full" dir="ltr">
              <LineChart data={chartData} margin={{ top: 8, right: 12, bottom: 4, left: 4 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} minTickGap={16} tickFormatter={(value: string) => formatShortDay(value)} />
                <YAxis width={52} domain={[0, "auto"]} tickLine={false} axisLine={false} tickFormatter={(value: number) => formatCompact(value)} />
                <ChartTooltip
                  cursor={{ stroke: "var(--line)" }}
                  offset={8}
                  content={<ChartTooltipContent labelFormatter={(label) => formatDate(String(label))} valueFormatter={(value) => formatAmount(Number(value))} />}
                />
                <Line type="monotone" dataKey="previous" stroke="var(--color-previous)" strokeWidth={2} strokeDasharray="4 4" dot={false} />
                <Line type="monotone" dataKey="current" stroke="var(--color-current)" strokeWidth={3} dot={false} activeDot={{ r: 4 }} />
              </LineChart>
            </ChartContainer>
          ) : (
            <p className="ma-muted">{t("جارٍ التحميل…", "Loading…")}</p>
          )}
        </Card>

        <Card title={t("بانتظارك", "Needs you")} actions={<Button label={t("صندوق المهام", "Ops inbox")} href="/dashboard/inbox" sm />}>
          <InboxList />
        </Card>
      </div>

      <div className="ma-section-gap">
        <Card
          title={
            <span className="ma-chart-title">
              {t("مبيعات الشهر", "Monthly sales")}
              <InfoHint label={t("ما معنى هذا الرسم؟", "What does this chart show?")} title={t("مبيعات الشهر", "Monthly sales")}>
                {t("كل عمود هو إجمالي إيراد شهر ميلادي داخل النطاق المحدد (نجمع أيام الشهر). مرّر على العمود لرؤية عدد الطلبات.", "Each column is one calendar month's total revenue inside the selected range (its days summed). Hover a column to see the order count.")}
              </InfoHint>
            </span>
          }
          actions={<Button label={t("تقرير المبيعات", "Sales report")} href="/analytics/sales" sm />}
        >
          {months.length ? (
            <ChartContainer config={monthlyConfig} className="h-[260px] w-full" dir="ltr">
              <BarChart data={months} margin={{ top: 8, right: 12, bottom: 4, left: 4 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis width={52} domain={[0, "auto"]} tickLine={false} axisLine={false} tickFormatter={(value: number) => formatCompact(value)} />
                <ChartTooltip
                  cursor={{ fill: "var(--fill-soft)" }}
                  offset={8}
                  content={<ChartTooltipContent labelFormatter={(label) => formatMonth(String(label))} valueFormatter={(value) => formatAmount(Number(value))} />}
                />
                <Bar dataKey="amount" fill="var(--color-amount)" radius={[6, 6, 0, 0]} maxBarSize={64} />
              </BarChart>
            </ChartContainer>
          ) : (
            <p className="ma-muted">{t("لا بيانات في هذه الفترة.", "No data in this period.")}</p>
          )}
        </Card>
      </div>

      <div className="ma-cols ma-cols--3 ma-section-gap">
        <Kpi label={t("المتدربون", "Trainees")} value={<CountUp value={summary.data?.learners_total ?? 0} />} meta={t("إجمالي المتدربين", "all time")} icon="users" field="var(--yellow)" />
        <Kpi label={t("الشهادات الممنوحة", "Certificates granted")} value={<CountUp value={summary.data?.certificates_issued ?? 0} />} meta={t("منذ الإطلاق", "all time")} icon="award" />
        <Kpi label={t("الدورات المنشورة", "Published courses")} value={<CountUp value={summary.data?.products_published ?? 0} />} meta={t(`${formatNumber(summary.data?.products_unpublished ?? 0)} غير منشورة`, `${formatNumber(summary.data?.products_unpublished ?? 0)} unpublished`)} icon="book" />
      </div>

      <div className="ma-cols ma-cols--2 ma-section-gap">
        <Card title={t("الدورات الأعلى إيرادًا", "Top courses by revenue")} actions={<ViewAllLink to="/learning/courses" label={t("كل الدورات", "All courses")} />}>
          {top.length ? (
            <Bars rows={top.map((row: ProductSalesRow, index) => ({ label: row.title, value: row.revenue, color: PALETTE[index % PALETTE.length] }))} fmt={(v) => formatAmount(v)} />
          ) : (
            <p className="ma-muted">{t("لا مبيعات في هذه الفترة.", "No sales in this period.")}</p>
          )}
        </Card>
        <Card title={t("المنصة بالأرقام", "Platform at a glance")}>
          <PlatformNumbers summary={summary.data} />
        </Card>
      </div>

      <div className="ma-section-gap">
        <Card
          flush
          title={t("أحدث الطلبات", "Latest orders")}
          actions={<ViewAllLink to="/sales/orders" label={t("كل الطلبات", "All orders")} />}
        >
          {orders.data ? <DataTable columns={orderColumns} rows={orders.data.items} /> : null}
        </Card>
      </div>

      <p className="ma-muted ma-section-gap" style={{ fontSize: 13 }}>
        {t("تُحمَّل هذه المؤشرات من طلب ملخص واحد بدلًا من نحو 30 طلبًا في اللوحة القديمة.", "These figures load from one summary request instead of the ~30 the legacy panel fires.")}
      </p>
    </>
  );
}

function InboxList() {
  const t = useT();
  const tickets = useQuery({ queryKey: ["dashboard", "tickets"], queryFn: () => listSupportTickets({ limit: 1 }) });
  const payouts = useQuery({ queryKey: ["dashboard", "payouts"], queryFn: () => listReferralPayouts({ limit: 100 }) });
  const pendingPayouts = (payouts.data?.items ?? []).filter((row) => row.status === 1).length;

  const items: { n: number; icon: string; label: string; href: string }[] = [
    { n: tickets.data?.total ?? 0, icon: "ticket", label: t("تذاكر دعم", "Support tickets"), href: "/customers/tickets" },
    { n: pendingPayouts, icon: "card", label: t("طلبات صرف عمولات", "Payout requests"), href: "/marketing/payouts" },
  ];

  return (
    <ul className="ma-list">
      {items.map((item) => (
        <li key={item.href}>
          <Icon name={item.icon} />
          <div className="ma-list__main">
            <Link className="ma-list__title" to={item.href}>
              {item.label}
            </Link>
          </div>
          <strong className="ma-num">{formatNumber(item.n)}</strong>
          <Icon name="chevronEnd" className="ma-icon-dir" />
        </li>
      ))}
    </ul>
  );
}

function PlatformNumbers({ summary }: { summary?: DashboardSummary }) {
  const t = useT();
  return (
    <Dl
      rows={[
        [t("العملاء المؤكدون", "Confirmed customers"), <span className="ma-num" key="c">{formatNumber(summary?.customers_confirmed ?? 0)} <span className="ma-muted">/ {formatNumber((summary?.customers_total ?? 0) - (summary?.customers_confirmed ?? 0))}</span></span>],
        [t("نشط اليوم", "Active today"), <span className="ma-num" key="a">{formatNumber(summary?.customers_active_today ?? 0)}</span>],
        [t("التسجيلات المجانية", "Free enrolments"), <span className="ma-num" key="f">{formatNumber(summary?.free_enrollments ?? 0)}</span>],
        [t("الكوبونات المستخدمة", "Coupons used"), <span className="ma-num" key="p">{formatNumber(summary?.promotions_used ?? 0)}</span>],
        [t("المسوقون المعتمدون", "Approved affiliates"), <span className="ma-num" key="af">{formatNumber(summary?.referral_partners_approved ?? 0)}</span>],
      ]}
    />
  );
}

type ChartRow = { day: string; current: number; previous: number | null };

function alignSeries(current: DailySalesPoint[] | undefined, previous: DailySalesPoint[] | undefined): ChartRow[] {
  if (!current) return [];
  const prev = previous ?? [];
  return current.map((point, index) => ({
    day: point.date,
    current: point.amount,
    previous: prev[index]?.amount ?? null,
  }));
}
