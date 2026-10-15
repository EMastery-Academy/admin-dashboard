import { useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import {
  expertsQueries,
  type ExpertCategory,
  type ExpertCourse,
  type ExpertPackage,
  type ExpertConsultation,
} from "@/lib/api";
import { formatNumber } from "@/lib/format";
import { useT } from "@/lib/i18n";
import { initialsOf } from "@/lib/status";
import { AppLink } from "@/components/ui/app-link";
import { Avatar, Badge, Button, Card, Dl, Empty, Kpi, Loading, PageHead } from "@/components/ui/kit";
import { DataTable, type Column } from "@/components/ui/data-table";
import { PageState } from "@/components/ui/primitives";
import { SearchBox } from "@/components/ui/paged-list";
import { SelectField } from "@/components/ui/select";

export default function InstructorDetailPage() {
  const t = useT();
  const { trainerId = "" } = useParams<{ trainerId: string }>();
  const query = useQuery(expertsQueries.detail(trainerId));
  const expert = query.data;

  const profile = expert?.expert;
  const name = profile?.name ?? `${t("المدرب", "Trainer")} #${trainerId}`;

  return (
    <>
      <PageHead
        back={{ href: "/learning/instructors", label: t("المدربون", "Instructors") }}
        title={name}
        sub={profile?.key ? `#${profile.key}` : `#${trainerId}`}
        actions={
          profile?.key ? (
            <Button
              kind="ghost"
              icon="openInNew"
              label={t("الملف العام", "Public profile")}
              href={`/learning/experts/${profile.key}`}
            />
          ) : undefined
        }
      />

      <PageState error={query.error}>
        {expert ? (
          <>
            <div className="ma-cols ma-cols--3">
              <Kpi
                label={t("الدورات", "Courses")}
                value={formatNumber(expert.courses?.length ?? 0)}
                icon="book"
              />
              <Kpi
                label={t("الدبلومات", "Diplomas")}
                value={formatNumber(expert.diplomas?.length ?? 0)}
                icon="award"
              />
              <Kpi
                label={t("الاستشارات", "Consultations")}
                value={formatNumber(expert.consultations?.length ?? 0)}
                icon="calendar"
              />
            </div>

            <div className="ma-cols ma-cols--2 ma-section-gap">
              <Card title={t("الملف الشخصي", "Profile")}>
                <div className="ma-cell-flex" style={{ marginBlockEnd: "var(--space-4)" }}>
                  <Avatar
                    initials={initialsOf(profile?.name ?? "")}
                    src={profile?.profile_image ?? (profile as unknown as { square_image?: string | null })?.square_image}
                    color="var(--sky)"
                    alt={profile?.name ?? ""}
                    lg
                  />
                  <div>
                    <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 700 }}>{profile?.name}</h3>
                    <p className="ma-muted">{profile?.key ? `#${profile.key}` : "—"}</p>
                  </div>
                </div>

                <Dl
                  rows={[
                    [t("المعرف", "Key"), profile?.key ?? "—"],
                    [t("رقم المدرب", "Trainer id"), profile?.trainer_id != null ? <span key="t" className="ma-num">{profile.trainer_id}</span> : "—"],
                    [t("أرقام المستشار", "Consultant ids"), profile?.consultant_ids?.length ? profile.consultant_ids.join(", ") : "—"],
                    [t("المصدر", "Source"), expert.highlights?.source ?? "—"],
                  ]}
                />
              </Card>

              <Card title={t("التصنيفات", "Categories")}>
                <CategoryList rows={expert.categories ?? []} />
              </Card>
            </div>

            {expert.courses?.length ? (
              <CourseTable title={t("الدورات", "Courses")} rows={expert.courses} />
            ) : null}

            {expert.diplomas?.length ? (
              <CourseTable title={t("الدبلومات", "Diplomas")} rows={expert.diplomas} />
            ) : null}

            {expert.packages?.length ? (
              <PackageTable rows={expert.packages} />
            ) : null}

            {expert.consultations?.length ? (
              <ConsultationTable rows={expert.consultations} />
            ) : null}
          </>
        ) : (
          <Loading />
        )}
      </PageState>
    </>
  );
}

function CategoryList({ rows }: { rows: ExpertCategory[] }) {
  const t = useT();
  if (!rows.length) return <Empty text={t("لا تصنيفات.", "No categories.")} />;
  return (
    <ul className="ma-list">
      {rows.map((cat) => (
        <li key={cat.id} className="ma-list__item">
          <span>{cat.name}</span>
          {cat.description ? <span className="ma-muted">{cat.description}</span> : null}
        </li>
      ))}
    </ul>
  );
}

function CourseTable({ title, rows }: { title: string; rows: ExpertCourse[] }) {
  const t = useT();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const matchSearch = !search || (r.name?.toLowerCase().includes(search.toLowerCase()) ?? false);
      const matchStatus = status === "all" || (status === "active" ? r.active : !r.active);
      return matchSearch && matchStatus;
    });
  }, [rows, search, status]);

  const columns: Column<ExpertCourse>[] = [
    {
      key: "name",
      header: t("الدورة", "Course"),
      cell: (row) => (
        <AppLink className="ma-cell-flex ma-link ma-link--plain" to={`/learning/backoffice/course/${row.id}`}>
          <Avatar
            initials={initialsOf(row.name)}
            src={row.image ?? (row as unknown as { square_image?: string | null }).square_image ?? (row as unknown as { squareImage?: string | null }).squareImage}
            color="var(--teal)"
            alt={row.name ?? undefined}
            square
          />
          <span>
            <span className="ma-cell-main">{row.name}</span>
            <span className="ma-cell-sub">{row.category_name || "—"}</span>
          </span>
        </AppLink>
      ),
    },
    {
      key: "price",
      header: t("السعر", "Price"),
      align: "end",
      cell: (row) => <span className="ma-num">{formatNumber(row.current_price?.price ?? row.price ?? 0)}</span>,
    },
    {
      key: "duration",
      header: t("المدة", "Duration"),
      align: "end",
      cell: (row) => <span className="ma-num">{row.duration ?? "—"}</span>,
    },
    {
      key: "active",
      header: t("الحالة", "Status"),
      cell: (row) => (
        <Badge
          def={{
            label: row.active ? { ar: "نشطة", en: "Active" } : { ar: "موقوفة", en: "Inactive" },
            tone: row.active ? "success" : "warning",
          }}
        />
      ),
    },
  ];

  const toolbar = (
    <>
      <SearchBox placeholder={t("ابحث في الدورات…", "Search courses…")} value={search} onChange={setSearch} />
      <SelectField
        label={t("الحالة", "Status")}
        value={status}
        onChange={setStatus}
        options={[
          { value: "all", label: t("كل الحالات", "All statuses") },
          { value: "active", label: t("نشطة", "Active") },
          { value: "inactive", label: t("موقوفة", "Inactive") },
        ]}
      />
    </>
  );

  return (
    <Card title={title} className="ma-section-gap">
      <DataTable rows={filtered} columns={columns} toolbar={toolbar} empty={t("لا عناصر مطابقة.", "No matching items.")} />
    </Card>
  );
}

function PackageTable({ rows }: { rows: ExpertPackage[] }) {
  const t = useT();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return rows.filter((r) => !search || (r.name?.toLowerCase().includes(search.toLowerCase()) ?? false));
  }, [rows, search]);

  const columns: Column<ExpertPackage>[] = [
    {
      key: "name",
      header: t("الحزمة / الدبلوم", "Package / Diploma"),
      cell: (row) => (
        <AppLink className="ma-cell-flex ma-link ma-link--plain" to={`/learning/backoffice/package/${row.id}`}>
          <Avatar
            initials={initialsOf(row.name)}
            src={row.image ?? (row as unknown as { square_image?: string | null }).square_image ?? (row as unknown as { squareImage?: string | null }).squareImage}
            color="var(--purple)"
            alt={row.name ?? undefined}
            square
          />
          <span>
            <span className="ma-cell-main">{row.name}</span>
            <span className="ma-cell-sub">{t(`${formatNumber(row.course_count)} دورة`, `${formatNumber(row.course_count)} courses`)}</span>
          </span>
        </AppLink>
      ),
    },
    {
      key: "price",
      header: t("السعر", "Price"),
      align: "end",
      cell: (row) => <span className="ma-num">{formatNumber(row.current_price?.price ?? row.price ?? 0)}</span>,
    },
    {
      key: "active",
      header: t("الحالة", "Status"),
      cell: (row) => (
        <Badge
          def={{
            label: row.active ? { ar: "نشطة", en: "Active" } : { ar: "موقوفة", en: "Inactive" },
            tone: row.active ? "success" : "warning",
          }}
        />
      ),
    },
  ];

  const toolbar = (
    <SearchBox placeholder={t("ابحث في الحزم…", "Search packages…")} value={search} onChange={setSearch} />
  );

  return (
    <Card title={t("الحزم والدبلومات", "Packages & Diplomas")} className="ma-section-gap">
      <DataTable rows={filtered} columns={columns} toolbar={toolbar} empty={t("لا حزم.", "No packages.")} />
    </Card>
  );
}

function ConsultationTable({ rows }: { rows: ExpertConsultation[] }) {
  const t = useT();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return rows.filter((r) => !search || (r.name?.toLowerCase().includes(search.toLowerCase()) ?? false));
  }, [rows, search]);

  const columns: Column<ExpertConsultation>[] = [
    {
      key: "name",
      header: t("الاستشارة", "Consultation"),
      cell: (row) => (
        <AppLink className="ma-cell-flex ma-link ma-link--plain" to={`/learning/consultations/${row.id}`}>
          <Avatar
            initials={initialsOf(row.name)}
            src={row.image ?? (row as unknown as { square_image?: string | null }).square_image ?? (row as unknown as { squareImage?: string | null }).squareImage}
            color="var(--coral)"
            alt={row.name ?? undefined}
            square
          />
          <span>
            <span className="ma-cell-main">{row.name}</span>
            <span className="ma-cell-sub">{t(`${formatNumber(row.number_of_sessions)} جلسة`, `${formatNumber(row.number_of_sessions)} sessions`)}</span>
          </span>
        </AppLink>
      ),
    },
    {
      key: "price",
      header: t("السعر", "Price"),
      align: "end",
      cell: (row) => <span className="ma-num">{formatNumber(row.price ?? 0)}</span>,
    },
    {
      key: "slots",
      header: t("الجلسات المتاحة", "Available slots"),
      align: "end",
      cell: (row) => <span className="ma-num">{formatNumber(row.available_slot_count)}</span>,
    },
    {
      key: "active",
      header: t("الحالة", "Status"),
      cell: (row) => (
        <Badge
          def={{
            label: row.active ? { ar: "نشطة", en: "Active" } : { ar: "موقوفة", en: "Inactive" },
            tone: row.active ? "success" : "warning",
          }}
        />
      ),
    },
  ];

  const toolbar = (
    <SearchBox placeholder={t("ابحث في الاستشارات…", "Search consultations…")} value={search} onChange={setSearch} />
  );

  return (
    <Card title={t("الاستشارات", "Consultations")} className="ma-section-gap">
      <DataTable rows={filtered} columns={columns} toolbar={toolbar} empty={t("لا استشارات.", "No consultations.")} />
    </Card>
  );
}
