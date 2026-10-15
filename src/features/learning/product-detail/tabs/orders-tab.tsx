import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ordersQueries,
  type AdminOrder,
  type OrderStatus,
} from "@/lib/api/sales/orders";
import { productQueries } from "@/lib/api/learning/catalog";
import { formatAmount, formatDateTime, formatNumber } from "@/lib/format";
import { useT } from "@/lib/i18n";
import { orderHref, customerHref, shortRef } from "@/lib/refs";
import { AppLink } from "@/components/ui/app-link";
import { SourceBadge } from "@/components/ui/source-badge";
import { Icon } from "@/components/ui/icon";
import { StudentsChart } from "../components/students-chart";

interface OrdersTabProps {
  productRef: string;
}

export function OrdersTab({ productRef }: OrdersTabProps) {
  const t = useT();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const limit = 20;

  // Fetch sales analytics series for the top summary
  const salesQuery = useQuery(productQueries.sales(productRef, { bucket: "month" }));
  const salesData = salesQuery.data;

  // Fetch orders filtered by product_ref!
  const ordersQuery = useQuery(
    ordersQueries.list({
      product_ref: productRef,
      status: statusFilter === "all" ? undefined : (statusFilter as OrderStatus),
      source: sourceFilter === "all" ? undefined : (sourceFilter as "b2c" | "legacy"),
      limit,
      offset: (page - 1) * limit,
    })
  );

  const orders = ordersQuery.data?.items ?? [];
  const totalCount = ordersQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / limit));

  const statusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
      case "succeeded":
      case "fulfilled":
        return "cd-chip--ok";
      case "pending":
      case "pending_payment":
      case "created":
        return "cd-chip--warn";
      case "cancelled":
      case "failed":
      case "refunded":
        return "cd-chip--off";
      default:
        return "cd-chip--plain";
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Sales & Students Chart */}
      <StudentsChart productRef={productRef} />

      {/* Orders List Card */}
      <section className="cd-card">
        <div className="cd-card__h" style={{ flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Icon name="cart" />
            <h2 style={{ margin: 0 }}>{t("طلبات الشراء لهذا المنتج", "Purchased Orders")}</h2>
            <span className="cd-chip cd-chip--plain cd-num">{formatNumber(totalCount)}</span>
          </div>

          {/* Filters */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginInlineStart: "auto" }}>
            {/* Status Filter */}
            <select
              className="cd-input"
              style={{ width: "auto", height: 32, padding: "0 10px", fontSize: 13 }}
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">{t("كل الحالات", "All statuses")}</option>
              <option value="paid">{t("مدفوع", "Paid")}</option>
              <option value="pending_payment">{t("قيد الدفع", "Pending payment")}</option>
              <option value="created">{t("تم الإنشاء", "Created")}</option>
              <option value="fulfilled">{t("مكتمل", "Fulfilled")}</option>
              <option value="cancelled">{t("ملغي", "Cancelled")}</option>
            </select>

            {/* Source Filter */}
            <select
              className="cd-input"
              style={{ width: "auto", height: 32, padding: "0 10px", fontSize: 13 }}
              value={sourceFilter}
              onChange={(e) => {
                setSourceFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">{t("كل المنصات", "All platforms")}</option>
              <option value="b2c">{t("B2C المنصة الجديدة", "B2C Modern")}</option>
              <option value="legacy">{t("Legacy القديم", "Legacy Platform")}</option>
            </select>
          </div>
        </div>

        <div className="cd-card__b cd-card__b--flush">
          {ordersQuery.isLoading ? (
            <div className="cd-empty" style={{ padding: 40 }}>
              <Icon name="clock" />
              <span>{t("جاري تحميل الطلبات...", "Loading orders...")}</span>
            </div>
          ) : orders.length === 0 ? (
            <div className="cd-empty" style={{ padding: 40 }}>
              <Icon name="cart" />
              <strong>{t("لا توجد طلبات مطابقة", "No orders found")}</strong>
              <span>
                {t(
                  "لم يتم العثور على طلبات شراء لهذا المنتج وفقاً للفلاتر الحالية",
                  "No purchase orders found for this product matching the selected filters"
                )}
              </span>
            </div>
          ) : (
            <div className="cd-tablewrap">
              <table className="cd-table">
                <thead>
                  <tr>
                    <th>{t("رقم الطلب", "Order")}</th>
                    <th>{t("العميل / الطالب", "Customer")}</th>
                    <th>{t("تاريخ الشراء", "Date")}</th>
                    <th>{t("المصدر", "Source")}</th>
                    <th>{t("الحالة", "Status")}</th>
                    <th style={{ textAlign: "end" }}>{t("المبلغ", "Amount")}</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => {
                    const amountMajor = (order.amount_minor || 0) / 100;
                    return (
                      <tr key={order.ref}>
                        <td>
                          <AppLink
                            to={orderHref(order.ref)}
                            className="cd-link cd-ltr cd-num"
                            style={{ fontWeight: 600 }}
                          >
                            {shortRef(order.ref)}
                          </AppLink>
                        </td>
                        <td>
                          {order.customer_ref ? (
                            <AppLink to={customerHref(order.customer_ref)} className="cd-link">
                              {order.customer_email || shortRef(order.customer_ref)}
                            </AppLink>
                          ) : (
                            <span className="cd-muted">{order.customer_email || "—"}</span>
                          )}
                        </td>
                        <td>
                          <span className="cd-muted" style={{ fontSize: 13 }}>
                            {order.placed_at || order.created_at
                              ? formatDateTime(order.placed_at || order.created_at)
                              : "—"}
                          </span>
                        </td>
                        <td>
                          <SourceBadge source={order.source} />
                        </td>
                        <td>
                          <span className={`cd-chip ${statusBadgeClass(order.status || "")}`}>
                            {order.status || "—"}
                          </span>
                        </td>
                        <td style={{ textAlign: "end", fontWeight: 600 }} className="cd-num">
                          {formatAmount(amountMajor, order.currency_code || "USD")}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 16px",
                borderTop: "1px solid var(--border)",
              }}
            >
              <span className="cd-muted" style={{ fontSize: 13 }}>
                {t(
                  `صفحة ${page} من ${totalPages}`,
                  `Page ${page} of ${totalPages}`
                )}
              </span>
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  type="button"
                  className="ma-btn ma-btn--sm ma-btn--soft"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  {t("السابق", "Previous")}
                </button>
                <button
                  type="button"
                  className="ma-btn ma-btn--sm ma-btn--soft"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  {t("التالي", "Next")}
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
