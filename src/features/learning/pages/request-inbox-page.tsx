import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { apiGet } from "@/lib/api/client";
import { useT } from "@/lib/i18n";
import { Card, ErrorAlert, PageHead } from "@/components/ui/kit";

type Kind = "company-training" | "trainer-applications";
type RequestRecord = {
  request_id: string;
  name: string;
  email: string;
  mobile: string;
  company_name: string | null;
  specialization: string | null;
  status: string;
  submitted_at: string;
  payload: Record<string, unknown>;
};
type RequestPage = { items: RequestRecord[]; total: number; limit: number; offset: number };

export function RequestInboxPage({ kind }: { kind: Kind }) {
  const t = useT();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const isCompany = kind === "company-training";
  const list = useQuery({
    queryKey: ["public-requests", kind, offset],
    queryFn: (): Promise<RequestPage> => apiGet(`admin/requests/${kind}`, { query: { limit: 50, offset } }),
  });
  const detail = useQuery({
    queryKey: ["public-requests", "detail", selectedId],
    queryFn: (): Promise<RequestRecord> => apiGet(`admin/requests/${selectedId}`),
    enabled: selectedId !== null,
  });

  return (
    <>
      <PageHead
        title={isCompany ? t("طلبات الشركات", "Company training requests") : t("طلبات المدربين", "Instructor applications")}
        sub={t("الطلبات المحفوظة في منصة B2C، الأحدث أولاً.", "Requests stored in B2C, newest first.")}
      />
      {list.error ? <ErrorAlert error={list.error} /> : null}
      <Card>
        {list.isLoading ? <p>{t("جار التحميل…", "Loading…")}</p> : null}
        {list.data?.items.length === 0 ? <p>{t("لا توجد طلبات.", "No requests yet.")}</p> : null}
        <div className="ma-stack">
          {list.data?.items.map((item) => (
            <button key={item.request_id} type="button" className="ma-link ma-link--plain"
              onClick={() => setSelectedId(item.request_id)}>
              {isCompany ? item.company_name : item.name} · {item.email} · {new Date(item.submitted_at).toLocaleDateString()}
            </button>
          ))}
        </div>
        <div className="ma-form-actions">
          <button type="button" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - 50))}>
            {t("السابق", "Previous")}
          </button>
          <span>{offset + 1}–{Math.min(offset + 50, list.data?.total ?? 0)} / {list.data?.total ?? 0}</span>
          <button type="button" disabled={offset + 50 >= (list.data?.total ?? 0)} onClick={() => setOffset(offset + 50)}>
            {t("التالي", "Next")}
          </button>
        </div>
      </Card>
      {selectedId ? (
        <Card>
          <h2>{t("تفاصيل الطلب", "Request details")}</h2>
          {detail.error ? <ErrorAlert error={detail.error} /> : null}
          {detail.data ? (
            <dl>
              {Object.entries(detail.data.payload).map(([key, value]) => (
                <div key={key} className="ma-field">
                  <dt className="ma-label">{key}</dt>
                  <dd>{value == null ? "—" : typeof value === "object" ? JSON.stringify(value) : String(value)}</dd>
                </div>
              ))}
            </dl>
          ) : null}
        </Card>
      ) : null}
    </>
  );
}
