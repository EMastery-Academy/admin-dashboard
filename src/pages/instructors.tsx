import { listLegacyResource, type LegacyRow } from "@/lib/api";
import { useT } from "@/lib/i18n";
import { initialsOf } from "@/lib/status";
import { Avatar, Badge, PageHead } from "@/components/ui/kit";
import { type Column } from "@/components/ui/data-table";
import { PagedList, type ListFilter } from "@/components/ui/paged-list";

type Trainer = LegacyRow & {
  id: number;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  profileImage?: string | null;
  squareImage?: string | null;
  specialized?: string | null;
  city?: string | null;
  nationality?: string | null;
  totalYearsOfExperience?: number | null;
  active?: boolean | number | null;
};

const isActive = (value: Trainer["active"]) => value === true || value === 1;

export default function InstructorsPage() {
  const t = useT();

  const columns: Column<Trainer>[] = [
    {
      key: "name",
      header: t("المدرب", "Instructor"),
      sortable: true,
      sortValue: (row) => row.name ?? "",
      cell: (row) => (
        <span className="ma-cell-flex">
          <Avatar
            initials={initialsOf(row.name || row.email)}
            src={row.squareImage ?? row.profileImage}
            color="var(--sky)"
            alt={row.name ?? ""}
          />
          <span>
            <span className="ma-cell-main">{row.name || "—"}</span>
            <span className="ma-cell-sub"><bdi>{row.email || row.phone || "—"}</bdi></span>
          </span>
        </span>
      ),
    },
    { key: "specialized", header: t("التخصص", "Specialization"), sortable: true, cell: (row) => row.specialized || "—" },
    { key: "city", header: t("المدينة", "City"), sortable: true, cell: (row) => row.city || row.nationality || "—" },
    {
      key: "years",
      header: t("سنوات الخبرة", "Years"),
      align: "end",
      sortable: true,
      sortValue: (row) => row.totalYearsOfExperience ?? 0,
      cell: (row) => <span className="ma-num">{row.totalYearsOfExperience ?? "—"}</span>,
    },
    {
      key: "active",
      header: t("الحالة", "Status"),
      sortable: true,
      sortValue: (row) => (isActive(row.active) ? 1 : 0),
      cell: (row) => (
        <Badge def={{ label: isActive(row.active) ? { ar: "نشط", en: "Active" } : { ar: "موقوف", en: "Inactive" }, tone: isActive(row.active) ? "success" : "warning" }} />
      ),
    },
    { key: "id", header: t("رقم", "Id"), align: "end", sortable: true, sortValue: (row) => row.id, cell: (row) => <span className="ma-num">{row.id}</span> },
  ];

  const filters: ListFilter[] = [
    {
      key: "active",
      label: t("كل الحالات", "All states"),
      options: [
        { value: "true", label: t("نشط", "Active") },
        { value: "false", label: t("موقوف", "Inactive") },
      ],
    },
  ];

  return (
    <>
      <PageHead title={t("المدربون", "Instructors")} sub={t("المدربون من النظام القديم.", "Instructors from the legacy system.")} />
      <PagedList
        queryKeyBase={["legacy", "resources", "trainers"]}
        fetchPage={({ query, offset, limit, filters: selected }) =>
          listLegacyResource("trainers", {
            search: query,
            filter: selected.active ? [`active:${selected.active}`] : undefined,
            limit,
            offset,
          }) as Promise<{ items: Trainer[]; total: number; limit: number; offset: number }>
        }
        columns={columns}
        searchPlaceholder={t("ابحث بالاسم أو البريد…", "Search name or email…")}
        filters={filters}
        empty={t("لا مدربين.", "No instructors.")}
      />
    </>
  );
}
