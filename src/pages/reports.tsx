import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import {
  categoriesReport,
  couponsReport,
  customersReport,
  legacyProductsReport,
  productsReport,
  reportKeys,
  salesReport,
  type DailySalesPoint,
  type DateRangeRequest,
  type LegacyRow,
  type ProductSalesRow,
} from "@/lib/api";
import { formatAmount, formatCompact, formatDate, formatDateTime, formatMonth, formatNumber, formatShortDay } from "@/lib/format";
import { useT } from "@/lib/i18n";
import { monthlyFromDays } from "@/lib/sales";
import { PALETTE } from "@/lib/status";
import { Card, Dl, Kpi, PageHead } from "@/components/ui/kit";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { InfoHint } from "@/components/ui/info-hint";
import { DataTable, type Column } from "@/components/ui/data-table";
import { PageState } from "@/components/ui/primitives";

function currentRange(): DateRangeRequest {
  const end = new Date();
  const start = new Date(end.getTime() - 90 * 24 * 60 * 60 * 1000);
  return { date1: start.toISOString().slice(0, 10), date2: end.toISOString().slice(0, 10) };
}

export default function AnalyticsSalesPage() {
  const t = useT();
  const range = currentRange();
  const report = useQuery({ queryKey: reportKeys.sales(range), queryFn: () => salesReport(range) });
  const products = useQuery({
    queryKey: ["analytics", "sales", "course-share", range],
    queryFn: () => productsReport({ start: `${range.date1}T00:00:00`, end: `${range.date2}T23:59:59` }),
  });

  const totalSales = report.data?.totalSales ?? 0;
  const totalOrders = report.data?.totalOrders ?? 0;
  const aov = totalOrders ? totalSales / totalOrders : 0;
  const days = report.data?.days ?? [];
  const months = monthlyFromDays(days);

  const productRows = products.data ?? [];
  const productTotal = productRows.reduce((sum, row) => sum + row.revenue, 0);
  const share = [...productRows]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8)
    .map((row) => ({ ...row, pct: productTotal ? (row.revenue / productTotal) * 100 : 0 }));

  const dailyConfig: ChartConfig = { amount: { label: t("الإيراد", "Revenue"), color: "var(--coral)" } };
  const monthlyConfig: ChartConfig = { amount: { label: t("مبيعات الشهر", "Monthly sales"), color: "var(--purple)" } };

  const columns: Column<DailySalesPoint>[] = [
    { key: "date", header: t("اليوم", "Day"), sortable: true, cell: (row) => formatDateTime(row.date) },
    { key: "orders", header: t("الطلبات", "Orders"), align: "end", sortable: true, sortValue: (row) => row.numberOfOrders, cell: (row) => <span className="ma-num">{formatNumber(row.numberOfOrders)}</span> },
    { key: "amount", header: t("الإيراد", "Revenue"), align: "end", sortable: true, sortValue: (row) => row.amount, cell: (row) => formatAmount(row.amount) },
  ];

  return (
    <>
      <PageHead title={t("تقرير المبيعات", "Sales report")} sub={t("ملخّص المبيعات اليومية لآخر 90 يومًا.", "Daily sales summary for the last 90 days.")} />

      <div className="ma-cols ma-cols--3">
        <Kpi label={t("إجمالي الإيراد", "Total sales")} value={formatAmount(totalSales)} icon="chart" field="var(--coral)" />
        <Kpi label={t("إجمالي الطلبات", "Total orders")} value={formatNumber(totalOrders)} icon="cart" field="var(--yellow)" />
        <Kpi label={t("متوسط قيمة الطلب", "Average order value")} value={formatAmount(aov)} icon="receipt" field="var(--purple)" />
      </div>

      <div className="ma-cols ma-cols--2 ma-section-gap">
        <Card
          title={
            <span className="ma-chart-title">
              {t("الإيراد اليومي", "Daily revenue")}
              <InfoHint label={t("ما معنى هذا الرسم؟", "What does this chart show?")} title={t("الإيراد اليومي", "Daily revenue")}>
                {t("النقاط هي إيراد كل يوم في الفترة المحددة (آخر 90 يومًا)، بالعملة الأساسية. مجموعها يساوي إجمالي الإيراد.", "Each point is one day's revenue in the selected window (last 90 days). The sum equals total sales.")}
              </InfoHint>
            </span>
          }
        >
          <PageState error={report.error}>
            {days.length ? (
              <ChartContainer config={dailyConfig} className="h-[260px] w-full" dir="ltr">
                <LineChart data={days} margin={{ top: 8, right: 12, bottom: 4, left: 4 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} minTickGap={16} tickFormatter={(value: string) => formatShortDay(value)} />
                  <YAxis width={52} domain={[0, "auto"]} tickLine={false} axisLine={false} tickFormatter={(value: number) => formatCompact(value)} />
                  <ChartTooltip
                    cursor={{ stroke: "var(--line)" }}
                    offset={8}
                    content={<ChartTooltipContent labelFormatter={(label) => formatDate(String(label))} valueFormatter={(value) => formatAmount(Number(value))} />}
                  />
                  <Line type="monotone" dataKey="amount" stroke="var(--color-amount)" strokeWidth={3} dot={false} activeDot={{ r: 4 }} />
                </LineChart>
              </ChartContainer>
            ) : (
              <p className="ma-muted">{t("لا بيانات في هذه الفترة.", "No data in this period.")}</p>
            )}
          </PageState>
        </Card>

        <Card
          title={
            <span className="ma-chart-title">
              {t("مبيعات الشهر", "Monthly sales")}
              <InfoHint label={t("ما معنى هذا الرسم؟", "What does this chart show?")} title={t("مبيعات الشهر", "Monthly sales")}>
                {t("كل عمود هو إجمالي الإيراد في شهر ميلادي (نجمع أيام الشهر). الطلبات مكتوبة في التلميح عند المرور على العمود.", "Each bar is the total revenue for one calendar month (its days summed). Hover a bar to see the order count.")}
              </InfoHint>
            </span>
          }
        >
          <PageState error={report.error}>
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
                  <Bar dataKey="amount" fill="var(--color-amount)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ChartContainer>
            ) : (
              <p className="ma-muted">{t("لا بيانات في هذه الفترة.", "No data in this period.")}</p>
            )}
          </PageState>
        </Card>
      </div>

      <div className="ma-section-gap">
        <Card
          title={
            <span className="ma-chart-title">
              {t("نسبة إيراد كل دورة", "Revenue share by course")}
              <InfoHint label={t("ما معنى هذه الأشرطة؟", "What do these bars show?")} title={t("نسبة إيراد كل دورة", "Revenue share by course")}>
                {t("كل شريط = مساهمة الدورة في إجمالي الإيراد خلال الفترة. النسبة تُحسب من إيراد الدورة ÷ إجمالي الإيراد.", "Each bar is the course's share of total revenue in the window: course revenue ÷ total revenue.")}
              </InfoHint>
            </span>
          }
        >
          <PageState error={products.error}>
            {share.length ? (
              <div className="ma-share">
                {share.map((row, index) => (
                  <div className="ma-share__row" key={`${row.product_kind}-${row.legacy_product_id}`}>
                    <span className="ma-share__label">{row.title}</span>
                    <span className="ma-share__pct">
                      {row.pct.toFixed(1)}% · {formatAmount(row.revenue)}
                    </span>
                    <span className="ma-share__track">
                      <span className="ma-share__fill" style={{ width: `${Math.max(2, row.pct)}%`, "--c": PALETTE[index % PALETTE.length] } as React.CSSProperties} />
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="ma-muted">{t("لا مبيعات في هذه الفترة.", "No sales in this period.")}</p>
            )}
          </PageState>
        </Card>
      </div>

      <div className="ma-section-gap">
        <Card flush title={t("التفصيل اليومي", "Daily breakdown")}>
          <PageState error={report.error}>
            <DataTable columns={columns} rows={days} empty={t("لا بيانات.", "No data.")} />
          </PageState>
        </Card>
      </div>
    </>
  );
}

export function ProductsReportPage() {
  const t = useT();
  const range = currentRange();
  const result = useQuery({ queryKey: ["analytics", "products", range], queryFn: () => productsReport({ start: `${range.date1}T00:00:00`, end: `${range.date2}T23:59:59` }) });

  const columns: Column<ProductSalesRow>[] = [
    { key: "title", header: t("المنتج", "Product"), sortable: true, cell: (row) => row.title },
    { key: "kind", header: t("النوع", "Kind"), sortable: true, cell: (row) => row.product_kind },
    { key: "orders", header: t("الطلبات", "Orders"), align: "end", sortable: true, sortValue: (row) => row.orders, cell: (row) => <span className="ma-num">{formatNumber(row.orders)}</span> },
    { key: "revenue", header: t("الإيراد", "Revenue"), align: "end", sortable: true, sortValue: (row) => row.revenue, cell: (row) => formatAmount(row.revenue) },
    { key: "promos", header: t("الكوبونات", "Promotions"), align: "end", sortable: true, sortValue: (row) => row.promotion_uses, cell: (row) => <span className="ma-num">{formatNumber(row.promotion_uses)}</span> },
  ];

  return (
    <>
      <PageHead title={t("تقرير المنتجات", "Products report")} sub={t("مبيعات المنتجات لآخر 90 يومًا.", "Product sales for the last 90 days.")} />
      <Card flush>
        <PageState error={result.error}>
          <DataTable columns={columns} rows={result.data ?? []} initialSort={{ key: "revenue", dir: "desc" }} empty={t("لا مبيعات.", "No sales.")} />
        </PageState>
      </Card>
    </>
  );
}

export function CouponsReportPage() {
  const t = useT();
  const range = currentRange();
  const result = useQuery({ queryKey: reportKeys.coupons(range), queryFn: () => couponsReport(range) });
  return <LegacyReportPage title={t("تقرير الكوبونات", "Coupons report")} sub={t("أداء الكوبونات.", "Coupon performance.")} result={result} />;
}

export function CustomersReportPage() {
  const t = useT();
  const range = currentRange();
  const result = useQuery({ queryKey: reportKeys.customers(range), queryFn: () => customersReport(range) });
  return <LegacyReportPage title={t("تقرير العملاء", "Customers report")} sub={t("أفضل العملاء.", "Top customers.")} result={result} />;
}

export function CategoriesReportPage() {
  const t = useT();
  const range = currentRange();
  const result = useQuery({ queryKey: reportKeys.categories(range), queryFn: () => categoriesReport(range) });
  return <LegacyReportPage title={t("تقرير التصنيفات", "Categories report")} sub={t("مبيعات التصنيفات.", "Category sales.")} result={result} />;
}

export function LegacyProductsReportPage() {
  const t = useT();
  const range = currentRange();
  const result = useQuery({ queryKey: reportKeys.products(range), queryFn: () => legacyProductsReport(range) });
  return <LegacyReportPage title={t("تقرير المنتجات (قديم)", "Products report (legacy)")} sub={t("مبيعات المنتجات من النظام القديم.", "Product sales from the legacy system.")} result={result} />;
}

type LegacyResult = { data?: unknown; error: unknown; isLoading: boolean };

function LegacyReportPage({ title, sub, result }: { title: string; sub: string; result: LegacyResult }) {
  const t = useT();
  const rows = toRows(result.data);
  return (
    <>
      <PageHead title={title} sub={sub} />
      <Card flush={rows.length > 0}>
        <PageState error={result.error}>
          {result.isLoading ? (
            <p className="ma-muted" style={{ padding: "var(--space-6)" }}>{t("جارٍ التحميل…", "Loading…")}</p>
          ) : rows.length > 0 ? (
            <DataTable columns={autoColumns(rows)} rows={rows} empty={t("لا بيانات.", "No data.")} />
          ) : (
            <div style={{ padding: "var(--space-4)" }}>
              <Dl rows={Object.entries((result.data ?? {}) as LegacyRow).map(([key, value]) => [key, renderCell(value)])} />
            </div>
          )}
        </PageState>
      </Card>
    </>
  );
}

function toRows(data: unknown): LegacyRow[] {
  if (Array.isArray(data)) return data as LegacyRow[];
  return [];
}

/** Builds columns from the union of keys in the first rows; legacy report shapes vary per report. */
function autoColumns(rows: LegacyRow[]): Column<LegacyRow>[] {
  const keys = Array.from(new Set(rows.slice(0, 20).flatMap((row) => Object.keys(row)))).slice(0, 6);
  if (keys.length === 0) return [];
  return keys.map((key) => ({
    key,
    header: key,
    sortable: true,
    cell: (row) => renderCell(row[key]),
  }));
}

function renderCell(value: unknown) {
  if (value == null) return "—";
  if (typeof value === "number") {
    return <span className="ma-num">{formatNumber(value)}</span>;
  }
  if (typeof value === "boolean") return value ? "yes" : "no";
  const text = String(value);
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) return formatDateTime(text);
  return text;
}
