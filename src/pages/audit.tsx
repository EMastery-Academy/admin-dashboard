import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { iamKeys, listAuditLogs, type AuditLog } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { useT } from "@/lib/i18n";
import { Card, PageHead } from "@/components/ui/kit";
import { DataTable, type Column } from "@/components/ui/data-table";
import { PageState, Pagination } from "@/components/ui/primitives";

const PAGE_SIZE = 25;

export default function AuditPage() {
  const t = useT();
  const [offset, setOffset] = useState(0);
  const [entityType, setEntityType] = useState("");

  const logs = useQuery({
    queryKey: iamKeys.auditLogs({ limit: PAGE_SIZE, offset, entity_type: entityType || undefined }),
    queryFn: () => listAuditLogs({ limit: PAGE_SIZE, offset, entity_type: entityType || undefined }),
  });

  const columns: Column<AuditLog>[] = [
    { key: "when", header: t("التاريخ", "When"), cell: (row) => formatDateTime(row.created_at) },
    { key: "action", header: t("الإجراء", "Action"), cell: (row) => <span className="ma-num">{row.action}</span> },
    { key: "entity", header: t("الكيان", "Entity"), cell: (row) => <span className="ma-cell-sub">{row.entity_type}</span> },
    { key: "actor", header: t("المشرف", "Actor"), cell: (row) => <bdi className="ma-cell-sub">{row.actor_id ? row.actor_id.slice(0, 8) : row.actor_type}</bdi> },
  ];

  return (
    <>
      <PageHead title={t("سجل التدقيق", "Audit log")} sub={t("كل عمليات الكتابة في اللوحة، الأحدث أولًا.", "Every write in the back office, newest first.")} />

      <div className="ma-toolbar">
        <form className="ma-search" onSubmit={(event) => event.preventDefault()}>
          <input
            className="ma-input ma-input--search"
            placeholder={t("تصفية بنوع الكيان…", "Filter by entity type…")}
            value={entityType}
            onChange={(event) => {
              setEntityType(event.target.value);
              setOffset(0);
            }}
          />
        </form>
      </div>

      <Card flush>
        <PageState error={logs.error}>
          {logs.isLoading ? (
            <p className="ma-muted" style={{ padding: "var(--space-6)" }}>{t("جارٍ التحميل…", "Loading…")}</p>
          ) : logs.data ? (
            <>
              <DataTable columns={columns} rows={logs.data.items} empty={t("لا سجلات.", "No logs.")} />
              <Pagination total={logs.data.total} limit={logs.data.limit} offset={logs.data.offset} onPage={setOffset} />
            </>
          ) : null}
        </PageState>
      </Card>
    </>
  );
}
