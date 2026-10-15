import { useEffect, useState, useMemo } from "react";
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
import { Badge, Button, Card, Empty, ErrorAlert, Field, FormActions, IconButton, Loading, PageHead } from "@/components/ui/kit";
import { SelectField } from "@/components/ui/select";
import { DataTable, type Column } from "@/components/ui/data-table";
import { PageState, Pagination } from "@/components/ui/primitives";
import { SearchBox } from "@/components/ui/paged-list";

const PAGE_SIZE = 25;

const ticketStatus = (status: number | null) =>
  status === 1
    ? { label: { ar: "مفتوحة", en: "Open" }, tone: "warning" as const }
    : { label: { ar: "مغلقة", en: "Closed" }, tone: "success" as const };

export default function TicketsPage() {
  const t = useT();
  const [offset, setOffset] = useState(0);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<number | null>(null);

  const tickets = useQuery({
    queryKey: ticketsKeys.list({ limit: PAGE_SIZE, offset, status: status ? Number(status) : undefined }),
    queryFn: () => listSupportTickets({ limit: PAGE_SIZE, offset, status: status ? Number(status) : undefined }),
  });

  const rawRows = tickets.data?.items ?? [];

  const filteredRows = useMemo(() => {
    if (!search) return rawRows;
    const q = search.toLowerCase();
    return rawRows.filter(
      (row) =>
        String(row.legacy_ticket_id).includes(q) ||
        row.subject?.toLowerCase().includes(q) ||
        row.body?.toLowerCase().includes(q),
    );
  }, [rawRows, search]);

  const columns: Column<SupportTicket>[] = [
    {
      key: "id",
      header: t("التذكرة", "Ticket"),
      sortable: true,
      sortValue: (row) => row.legacy_ticket_id,
      cell: (row) => <span className="ma-num">#{row.legacy_ticket_id}</span>,
    },
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
    {
      key: "messages",
      header: t("الرسائل", "Messages"),
      align: "end",
      sortable: true,
      sortValue: (row) => row.messages?.length ?? 0,
      cell: (row) => <span className="ma-num">{row.messages?.length ?? 0}</span>,
    },
    {
      key: "status",
      header: t("الحالة", "Status"),
      sortable: true,
      cell: (row) => <Badge def={ticketStatus(row.status)} />,
    },
    {
      key: "opened",
      header: t("فُتحت", "Opened"),
      sortable: true,
      sortValue: (row) => row.opened_at,
      cell: (row) => formatDateTime(row.opened_at),
    },
  ];

  const toolbar = (
    <>
      <SearchBox placeholder={t("ابحث برقم التذكرة أو الموضوع…", "Search ticket id or subject…")} value={search} onChange={setSearch} />
      <SelectField
        label={t("حالة التذكرة", "Ticket state")}
        value={status || "all"}
        onChange={(value) => {
          setStatus(value === "all" ? "" : value);
          setOffset(0);
        }}
        options={[
          { value: "all", label: t("كل الحالات", "All states") },
          { value: "1", label: t("مفتوحة", "Open") },
          { value: "3", label: t("مغلقة", "Closed") },
        ]}
      />
    </>
  );

  return (
    <>
      <PageHead
        title={t("التذاكر", "Support tickets")}
        sub={t("تذاكر دعم العملاء والمحادثات مع فريق خدمة المستفيدين.", "Customer support tickets and customer service messages.")}
      />

      <Card flush>
        <DataTable
          columns={columns}
          rows={filteredRows}
          toolbar={toolbar}
          loading={tickets.isLoading}
          error={tickets.error}
          empty={t("لا تذاكر مطابقة.", "No matching tickets.")}
          footer={tickets.data ? <Pagination total={tickets.data.total} limit={tickets.data.limit} offset={tickets.data.offset} onPage={setOffset} /> : null}
        />
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
  const data = ticket.data;

  useEffect(() => {
    document.getElementById("ticket-detail")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [ticketId]);

  return (
    <Card
      id="ticket-detail"
      title={
        <span className="ma-chart-title">
          {t("تذكرة", "Ticket")} <bdi className="ma-num">#{ticketId}</bdi>
          {data ? <Badge def={ticketStatus(data.status)} /> : null}
        </span>
      }
      actions={
        <>
          {data ? (
            <Button
              sm
              icon={data.status === 1 ? "check" : "refresh"}
              label={data.status === 1 ? t("إغلاق التذكرة", "Close ticket") : t("إعادة الفتح", "Reopen")}
              disabled={statusMutation.isPending}
              onClick={() => statusMutation.mutate(data.status === 1 ? 3 : 1)}
            />
          ) : null}
          <IconButton icon="x" label={t("إخفاء التذكرة", "Hide ticket")} onClick={onClose} />
        </>
      }
    >
      <PageState error={ticket.error}>
        {data ? (
          <>
            {(data.messages ?? []).length ? (
              <ul className="ma-list">
                {(data.messages ?? []).map((message) => (
                  <li key={message.legacy_message_id}>
                    <div className="ma-list__main">
                      <span className="ma-list__title">{message.author}</span>
                      <span className="ma-list__sub">{message.body}</span>
                    </div>
                    <span className="ma-list__sub ma-num">{formatDateTime(message.sent_at)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <Empty icon="message" text={t("لا رسائل في هذه التذكرة بعد.", "No messages in this ticket yet.")} />
            )}

            <form
              className="ma-form ma-section-gap"
              onSubmit={(event) => {
                event.preventDefault();
                if (reply.trim()) replyMutation.mutate();
              }}
            >
              <Field id="ticket-reply" type="textarea" rows={3} label={t("ردّك", "Your reply")} value={reply} onChange={setReply} />
              <ErrorAlert error={error} />
              <FormActions>
                <Button
                  type="submit"
                  kind="primary"
                  icon="send"
                  iconDir
                  label={replyMutation.isPending ? t("جارٍ الإرسال…", "Sending…") : t("إرسال الرد", "Send reply")}
                  disabled={!reply.trim() || replyMutation.isPending}
                />
              </FormActions>
            </form>
          </>
        ) : (
          <Loading />
        )}
      </PageState>
    </Card>
  );
}
