import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getSupportTicket,
  listSupportTickets,
  replySupportTicket,
  setSupportTicketStatus,
  ticketsKeys,
  type SupportTicket,
} from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { useT } from "@/lib/i18n";
import { Badge, Button, Card, PageHead } from "@/components/ui/kit";
import { DataTable, type Column } from "@/components/ui/data-table";
import { PageState, Pagination } from "@/components/ui/primitives";

const PAGE_SIZE = 25;

const ticketStatus = (status: number) =>
  status === 1
    ? { label: { ar: "مفتوحة", en: "Open" }, tone: "warning" as const }
    : { label: { ar: "مغلقة", en: "Closed" }, tone: "success" as const };

export default function TicketsPage() {
  const t = useT();
  const [offset, setOffset] = useState(0);
  const [status, setStatus] = useState("");
  const [selected, setSelected] = useState<number | null>(null);

  const tickets = useQuery({
    queryKey: ticketsKeys.list({ limit: PAGE_SIZE, offset, status: status ? Number(status) : undefined }),
    queryFn: () => listSupportTickets({ limit: PAGE_SIZE, offset, status: status ? Number(status) : undefined }),
  });

  const columns: Column<SupportTicket>[] = [
    { key: "id", header: t("التذكرة", "Ticket"), sortable: true, sortValue: (row) => row.legacy_ticket_id, cell: (row) => <span className="ma-num">#{row.legacy_ticket_id}</span> },
    {
      key: "subject",
      header: t("الموضوع", "Subject"),
      sortable: true,
      cell: (row) => (
        <button type="button" className="ma-link" onClick={() => setSelected(row.legacy_ticket_id)}>
          {row.subject}
        </button>
      ),
    },
    { key: "messages", header: t("الرسائل", "Messages"), align: "end", sortable: true, sortValue: (row) => row.messages?.length ?? 0, cell: (row) => <span className="ma-num">{row.messages?.length ?? 0}</span> },
    { key: "status", header: t("الحالة", "Status"), sortable: true, cell: (row) => <Badge def={ticketStatus(row.status)} /> },
    { key: "opened", header: t("فُتحت", "Opened"), sortable: true, sortValue: (row) => row.opened_at, cell: (row) => formatDateTime(row.opened_at) },
  ];

  return (
    <>
      <PageHead title={t("التذاكر", "Support tickets")} sub={t("تذاكر دعم العملاء من النظام القديم.", "Customer support tickets from the legacy system.")} />

      <div className="ma-toolbar">
        <label className="ma-field">
          <span className="ma-sr">{t("كل الحالات", "All states")}</span>
          <select
            className="ma-select"
            aria-label={t("كل الحالات", "All states")}
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setOffset(0);
            }}
          >
            <option value="">{t("كل الحالات", "All states")}</option>
            <option value="1">{t("مفتوحة", "Open")}</option>
            <option value="3">{t("مغلقة", "Closed")}</option>
          </select>
        </label>
      </div>

      <Card flush>
        <PageState error={tickets.error}>
          {tickets.isLoading ? (
            <p className="ma-muted" style={{ padding: "var(--space-6)" }}>{t("جارٍ التحميل…", "Loading…")}</p>
          ) : tickets.data ? (
            <>
              <DataTable columns={columns} rows={tickets.data.items} empty={t("لا تذاكر.", "No tickets.")} />
              <Pagination total={tickets.data.total} limit={tickets.data.limit} offset={tickets.data.offset} onPage={setOffset} />
            </>
          ) : null}
        </PageState>
      </Card>

      {selected != null ? <TicketDetail ticketId={selected} onClose={() => setSelected(null)} /> : null}
    </>
  );
}

function TicketDetail({ ticketId, onClose }: { ticketId: number; onClose: () => void }) {
  const t = useT();
  const queryClient = useQueryClient();
  const [reply, setReply] = useState("");

  const ticket = useQuery({
    queryKey: ticketsKeys.detail(ticketId),
    queryFn: () => getSupportTicket(ticketId),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ticketsKeys.detail(ticketId) });
    queryClient.invalidateQueries({ queryKey: ticketsKeys.all });
  };

  const statusMutation = useMutation({
    mutationFn: (status: number) => setSupportTicketStatus(ticketId, { status }),
    onSuccess: invalidate,
  });

  const replyMutation = useMutation({
    mutationFn: () => replySupportTicket(ticketId, { message: reply }),
    onSuccess: () => {
      setReply("");
      invalidate();
    },
  });

  const error = statusMutation.error ?? replyMutation.error;

  return (
    <div className="ma-section-gap">
      <Card
        title={`${t("تذكرة", "Ticket")} #${ticketId}`}
        actions={<Button sm label={t("إغلاق", "Close")} onClick={onClose} />}
      >
        <PageState error={ticket.error}>
          {ticket.data ? (
            <>
              <div className="ma-toolbar">
                <Badge def={ticketStatus(ticket.data.status)} />
                <Button
                  sm
                  label={ticket.data.status === 1 ? t("إغلاق التذكرة", "Close ticket") : t("إعادة الفتح", "Reopen")}
                  disabled={statusMutation.isPending}
                  onClick={() => statusMutation.mutate(ticket.data.status === 1 ? 3 : 1)}
                />
              </div>

              <ul className="ma-list">
                {(ticket.data.messages ?? []).map((message) => (
                  <li key={message.legacy_message_id}>
                    <div className="ma-list__main">
                      <span className="ma-list__title">{message.author}</span>
                      <span className="ma-cell-sub">{message.body}</span>
                    </div>
                    <span className="ma-cell-sub">{formatDateTime(message.sent_at)}</span>
                  </li>
                ))}
              </ul>

              <form
                className="ma-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (reply.trim()) replyMutation.mutate();
                }}
              >
                <label className="ma-field">
                  <span className="ma-label">{t("رد", "Reply")}</span>
                  <textarea className="ma-input ma-textarea" rows={3} value={reply} onChange={(event) => setReply(event.target.value)} />
                </label>
                <Button type="submit" kind="primary" label={replyMutation.isPending ? t("جارٍ الإرسال…", "Sending…") : t("إرسال", "Send")} disabled={!reply.trim() || replyMutation.isPending} />
              </form>
            </>
          ) : null}
        </PageState>
        {error ? <p className="ma-alert ma-alert--danger">{(error as Error).message}</p> : null}
      </Card>
    </div>
  );
}
