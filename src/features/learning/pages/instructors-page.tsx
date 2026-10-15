import { useMemo } from "react";
import { instructorsKeys, listAdminInstructors, type AdminInstructor } from "@/lib/api";
import { useT } from "@/lib/i18n";
import { initialsOf } from "@/lib/status";
import { AppLink } from "@/components/ui/app-link";
import { Avatar, Badge, PageHead } from "@/components/ui/kit";
import { type Column } from "@/components/ui/data-table";
import { PagedList, type ListFilter } from "@/components/ui/paged-list";

type Trainer = AdminInstructor;

export default function InstructorsPage() {
  const t = useT();

  const columns: Column<Trainer>[] = [
    {
      key: "name",
      header: t("المدرب", "Instructor"),
      sortable: true,
      sortValue: (row) => row.name ?? "",
      cell: (row) => (
        <AppLink className="ma-cell-flex ma-link ma-link--plain" to={`/learning/instructors/${row.legacy_trainer_id}`}>
          <Avatar
            initials={initialsOf(row.name || row.email || "")}
            src={row.avatar}
            color="var(--sky)"
            alt={row.name ?? ""}
          />
          <span>
            <span className="ma-cell-main">{row.name || "—"}</span>
            <span className="ma-cell-sub"><bdi>{row.email || row.phone || "—"}</bdi></span>
          </span>
        </AppLink>
      ),
    },
    {
      key: "specialized",
      header: t("التخصص", "Specialization"),
      sortable: true,
      cell: (row) => row.specialization || "—",
    },
    {
      key: "city",
      header: t("المدينة / الجنسية", "City / Nationality"),
      sortable: true,
      cell: (row) => row.city || row.nationality || "—",
    },
    {
      key: "years",
      header: t("سنوات الخبرة", "Experience (Years)"),
      align: "end",
      sortable: true,
      sortValue: (row) => Number(row.years_of_experience ?? 0),
      cell: (row) => <span className="ma-num">{row.years_of_experience != null ? String(row.years_of_experience) : "—"}</span>,
    },
    {
      key: "active",
      header: t("الحالة", "Status"),
      sortable: true,
      sortValue: (row) => (row.active ? 1 : 0),
      cell: (row) => (
        <Badge
          def={{
            label: row.active ? { ar: "نشط", en: "Active" } : { ar: "موقوف", en: "Inactive" },
            tone: row.active ? "success" : "warning",
          }}
        />
      ),
    },
    {
      key: "id",
      header: t("المعرّف", "Id"),
      align: "end",
      sortable: true,
      sortValue: (row) => row.legacy_trainer_id,
      cell: (row) => <span className="ma-num">{row.legacy_trainer_id}</span>,
    },
  ];

  const filters: ListFilter[] = useMemo(
    () => [
      {
        key: "active",
        label: t("كل الحالات", "All states"),
        options: [
          { value: "true", label: t("نشط", "Active") },
          { value: "false", label: t("موقوف", "Inactive") },
        ],
      },
    ],
    [t],
  );

  return (
    <>
      <PageHead
        title={t("المدربون", "Instructors")}
        sub={t("قائمة المدربين والخبراء المعتمدين وسنوات الخبرة.", "Certified instructors and experts with their experience.")}
      />
      <PagedList
        queryKeyBase={instructorsKeys.adminList()}
        fetchPage={({ query, offset, limit, filters: selected }) =>
          listAdminInstructors({
            query,
            active: selected.active ? selected.active === "true" : undefined,
            limit,
            offset,
          })
        }
        columns={columns}
        searchPlaceholder={t("ابحث بالاسم أو البريد أو التخصص…", "Search name, email, or specialty…")}
        filters={filters}
        empty={t("لا مدربين.", "No instructors.")}
      />
    </>
  );
}
