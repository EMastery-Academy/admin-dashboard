import { useState } from "react";

import { listBackofficeCustomers, listCustomers, type BackofficeCustomer } from "@/lib/api";
import { formatDateTime, formatNumber } from "@/lib/format";
import { useT } from "@/lib/i18n";
import { customerStatusBadge, initialsOf } from "@/lib/status";
import { type Column } from "@/components/ui/data-table";
import { Avatar, Badge, PageHead } from "@/components/ui/kit";
import { PagedList, type ListFilter } from "@/components/ui/paged-list";

type Source = "legacy" | "b2c";
type B2CCustomer = Awaited<ReturnType<typeof listCustomers>>["items"][number];

export default function CustomersPage() {
  const t = useT();
  const [source, setSource] = useState<Source>("legacy");

  return (
    <>
      <PageHead title={t("العملاء", "Customers")} sub={t("دليل العملاء من B2C والمصدر القديم.", "The customer directory from B2C and the legacy source.")} />
      {source === "legacy" ? (
        <LegacyDirectory toggle={<SourceToggle source={source} onChange={setSource} />} />
      ) : (
        <B2CDirectory toggle={<SourceToggle source={source} onChange={setSource} />} />
      )}
    </>
  );
}

function SourceToggle({ source, onChange }: { source: Source; onChange: (value: Source) => void }) {
  const t = useT();
  return (
    <label className="ma-field">
      <span className="ma-sr">{t("المصدر", "Source")}</span>
      <select className="ma-select" value={source} onChange={(event) => onChange(event.target.value as Source)}>
        <option value="legacy">{t("الدليل القديم", "Legacy directory")}</option>
        <option value="b2c">{t("عملاء B2C", "B2C customers")}</option>
      </select>
    </label>
  );
}

function LegacyDirectory({ toggle }: { toggle: React.ReactNode }) {
  const t = useT();
  const columns: Column<BackofficeCustomer>[] = [
    {
      key: "customer",
      header: t("العميل", "Customer"),
      sortable: true,
      sortValue: (row) => row.full_name || row.email,
      cell: (row) => (
        <span className="ma-cell-flex">
          <Avatar initials={initialsOf(row.full_name || row.email)} color="var(--purple)" />
          <span>
            <span className="ma-cell-main">{row.full_name || "—"}</span>
            <span className="ma-cell-sub"><bdi>{row.email}</bdi></span>
          </span>
        </span>
      ),
    },
    { key: "legacy", header: t("رقم قديم", "Legacy id"), align: "end", sortable: true, sortValue: (row) => row.legacy_user_id ?? 0, cell: (row) => <span className="ma-num">{row.legacy_user_id ?? "—"}</span> },
    { key: "status", header: t("الحالة", "Status"), sortable: true, cell: (row) => <Badge def={customerStatusBadge(row.status)} /> },
    { key: "confirmed", header: t("مؤكد", "Confirmed"), cell: (row) => (row.email_confirmed ? t("نعم", "yes") : t("لا", "no")) },
    { key: "last", header: t("آخر دخول", "Last sign-in"), sortable: true, sortValue: (row) => row.last_signin ?? "", cell: (row) => formatDateTime(row.last_signin) },
  ];

  return (
    <PagedList
      queryKeyBase={["customers", "legacy"]}
      fetchPage={({ query, offset, limit }) => listBackofficeCustomers({ query, limit, offset })}
      columns={columns}
      searchPlaceholder={t("ابحث بالبريد أو الاسم…", "Search email or name…")}
      toolbar={toggle}
      empty={t("لا عملاء.", "No customers.")}
    />
  );
}

function B2CDirectory({ toggle }: { toggle: React.ReactNode }) {
  const t = useT();
  const columns: Column<B2CCustomer>[] = [
    {
      key: "customer",
      header: t("العميل", "Customer"),
      sortable: true,
      sortValue: (row) => row.full_name || row.email,
      cell: (row) => (
        <span className="ma-cell-flex">
          <Avatar initials={initialsOf(row.full_name || row.email)} color="var(--teal)" />
          <span>
            <span className="ma-cell-main">{row.full_name || "—"}</span>
            <span className="ma-cell-sub"><bdi>{row.email}</bdi></span>
          </span>
        </span>
      ),
    },
    { key: "status", header: t("الحالة", "Status"), sortable: true, cell: (row) => <Badge def={customerStatusBadge(row.status)} /> },
    { key: "orders", header: t("الطلبات", "Orders"), align: "end", sortable: true, sortValue: (row) => row.orders_count, cell: (row) => <span className="ma-num">{formatNumber(row.orders_count)}</span> },
    { key: "created", header: t("التسجيل", "Created"), sortable: true, sortValue: (row) => row.created_at, cell: (row) => formatDateTime(row.created_at) },
  ];

  const filters: ListFilter[] = [
    {
      key: "status",
      label: t("كل الحالات", "All states"),
      options: [
        { value: "active", label: t("نشط", "Active") },
        { value: "suspended", label: t("موقوف", "Suspended") },
        { value: "blocked", label: t("محظور", "Blocked") },
      ],
    },
  ];

  return (
    <PagedList
      queryKeyBase={["customers", "b2c"]}
      fetchPage={({ query, offset, limit, filters: selected }) =>
        listCustomers({ query, status: selected.status || undefined, limit, offset })
      }
      columns={columns}
      searchPlaceholder={t("ابحث بالبريد أو الاسم…", "Search email or name…")}
      filters={filters}
      toolbar={toggle}
      empty={t("لا عملاء.", "No customers.")}
    />
  );
}
