import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createAdminUser,
  iamKeys,
  listAdminUsers,
  listRoles,
  setAdminUserStatus,
  type AdminRole,
  type AdminUser,
} from "@/lib/api";
import { useT } from "@/lib/i18n";
import { Badge, Button, Card, Kpi, PageHead } from "@/components/ui/kit";
import { DataTable, type Column } from "@/components/ui/data-table";
import { PageState, Pagination } from "@/components/ui/primitives";
import { useState } from "react";

export default function TeamPage() {
  const t = useT();
  const [offset, setOffset] = useState(0);
  const limit = 25;

  const users = useQuery({ queryKey: iamKeys.adminUsers({ limit, offset }), queryFn: () => listAdminUsers({ limit, offset }) });
  const roles = useQuery({ queryKey: iamKeys.roles(), queryFn: listRoles });
  const queryClient = useQueryClient();

  const toggle = useMutation({
    mutationFn: (user: AdminUser) =>
      setAdminUserStatus(user.admin_user_id, { status: user.status === "active" ? "suspended" : "active" }).then(() => user),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: iamKeys.adminUsers() }),
  });

  const columns: Column<AdminUser>[] = [
    {
      key: "admin",
      header: t("المشرف", "Admin"),
      cell: (row) => (
        <span>
          <span className="ma-cell-main">{row.full_name || row.email}</span>
          <span className="ma-cell-sub"><bdi>{row.email}</bdi></span>
        </span>
      ),
    },
    {
      key: "scopes",
      header: t("الصلاحيات", "Scopes"),
      cell: (row) => <span className="ma-num">{row.scopes.includes("*") ? t("كل الصلاحيات", "All (*)") : row.scopes.length}</span>,
    },
    { key: "status", header: t("الحالة", "Status"), cell: (row) => <Badge def={{ label: { ar: row.status, en: row.status }, tone: row.status === "active" ? "success" : "warning" }} /> },
    {
      key: "actions",
      header: "",
      align: "end",
      cell: (row) => (
        <Button
          sm
          label={row.status === "active" ? t("إيقاف", "Suspend") : t("تفعيل", "Activate")}
          disabled={toggle.isPending}
          onClick={() => toggle.mutate(row)}
        />
      ),
    },
  ];

  const roleColumns: Column<AdminRole>[] = [
    { key: "code", header: t("الرمز", "Code"), cell: (row) => <span className="ma-num">{row.code}</span> },
    { key: "name", header: t("الاسم", "Name"), cell: (row) => row.name },
    { key: "scopes", header: t("الصلاحيات", "Scopes"), align: "end", cell: (row) => <span className="ma-num">{row.scopes.length}</span> },
  ];

  return (
    <>
      <PageHead title={t("الفريق والأدوار", "Team & roles")} sub={t("حسابات المشرفين والأدوار المتاحة.", "Admin accounts and the roles available.")} />

      <div className="ma-cols ma-cols--3 ma-section-gap">
        <Kpi label={t("حسابات المشرفين", "Admin accounts")} value={users.data?.total ?? 0} icon="users" field="var(--purple)" />
        <Kpi label={t("الأدوار", "Roles")} value={roles.data?.length ?? 0} icon="shield" field="var(--teal)" />
      </div>

      <div className="ma-cols ma-cols--2 ma-section-gap">
        <CreateAdminCard onCreated={() => queryClient.invalidateQueries({ queryKey: iamKeys.adminUsers() })} />
        <Card title={t("الأدوار", "Roles")}>
          <PageState error={roles.error}>
            <DataTable columns={roleColumns} rows={roles.data ?? []} empty={t("لا أدوار.", "No roles.")} />
          </PageState>
        </Card>
      </div>

      <div className="ma-section-gap">
        <Card flush title={t("حسابات المشرفين", "Admin accounts")}>
          <PageState error={users.error}>
            {users.isLoading ? (
              <p className="ma-muted" style={{ padding: "var(--space-6)" }}>{t("جارٍ التحميل…", "Loading…")}</p>
            ) : users.data ? (
              <>
                <DataTable columns={columns} rows={users.data.items} empty={t("لا حسابات.", "No accounts.")} />
                <Pagination total={users.data.total} limit={users.data.limit} offset={users.data.offset} onPage={setOffset} />
              </>
            ) : null}
          </PageState>
        </Card>
      </div>
    </>
  );
}

function CreateAdminCard({ onCreated }: { onCreated: () => void }) {
  const t = useT();
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");

  const create = useMutation({
    mutationFn: () => createAdminUser({ email, full_name: fullName || undefined, password }),
    onSuccess: () => {
      setEmail("");
      setFullName("");
      setPassword("");
      onCreated();
    },
  });

  const valid = email.includes("@") && password.length >= 10;

  return (
    <Card title={t("إنشاء مشرف", "Create admin")}>
      <form
        className="ma-form"
        onSubmit={(event) => {
          event.preventDefault();
          if (valid) create.mutate();
        }}
      >
        <label className="ma-field">
          <span className="ma-label">{t("البريد الإلكتروني", "Email")}</span>
          <input className="ma-input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </label>
        <label className="ma-field">
          <span className="ma-label">{t("الاسم الكامل", "Full name")}</span>
          <input className="ma-input" value={fullName} onChange={(event) => setFullName(event.target.value)} />
        </label>
        <label className="ma-field">
          <span className="ma-label">{t("كلمة المرور", "Password")}</span>
          <input className="ma-input" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={10} />
        </label>
        {create.error ? <p className="ma-alert ma-alert--danger">{(create.error as Error).message}</p> : null}
        <Button type="submit" kind="primary" label={create.isPending ? t("جارٍ الإنشاء…", "Creating…") : t("إنشاء", "Create")} disabled={!valid || create.isPending} />
      </form>
    </Card>
  );
}
