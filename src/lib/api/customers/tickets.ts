import { queryOptions } from "@tanstack/react-query";

import { apiGet, apiPost } from "@/lib/api/client";
import type { PathParams, QueryParams, RequestBody } from "@/lib/api/operation-types";
import type { Page, SupportTicket } from "@/lib/api/contract";

type ListTicketsOp = "list_support_tickets_api_v1_admin_backoffice_support_tickets_get";
type GetTicketOp = "get_support_ticket_api_v1_admin_backoffice_support_tickets__legacy_ticket_id__get";
type SetTicketStatusOp = "set_support_ticket_status_api_v1_admin_backoffice_support_tickets__legacy_ticket_id__status_post";
type ReplyTicketOp = "reply_support_ticket_api_v1_admin_backoffice_support_tickets__legacy_ticket_id__replies_post";

export type SupportTicketsParams = QueryParams<ListTicketsOp>;
export type SupportTicketPage = Page<SupportTicket>;
export type SupportTicketDetail = SupportTicket;
export type TicketStatusRequest = RequestBody<SetTicketStatusOp>;
export type TicketReplyRequest = RequestBody<ReplyTicketOp>;

export const ticketsPaths = {
  tickets: "admin/backoffice/support/tickets",
  ticket: "admin/backoffice/support/tickets/{legacy_ticket_id}",
  ticketStatus: "admin/backoffice/support/tickets/{legacy_ticket_id}/status",
  ticketReplies: "admin/backoffice/support/tickets/{legacy_ticket_id}/replies",
} as const;

export const ticketsKeys = {
  all: ["support", "tickets"] as const,
  list: (params?: SupportTicketsParams) => [...ticketsKeys.all, "list", params ?? {}] as const,
  detail: (legacyTicketId: number) => [...ticketsKeys.all, "detail", legacyTicketId] as const,
};

export function listSupportTickets(params: SupportTicketsParams = {}): Promise<SupportTicketPage> {
  return apiGet<SupportTicketPage>(ticketsPaths.tickets, { query: params });
}

export function getSupportTicket(
  legacy_ticket_id: PathParams<GetTicketOp>["legacy_ticket_id"],
): Promise<SupportTicketDetail> {
  return apiGet(ticketsPaths.ticket, { path: { legacy_ticket_id } });
}

/** `POST .../tickets/{id}/status` — legacy ticket status (1 open, 3 closed, …). Audited. */
export function setSupportTicketStatus(
  legacy_ticket_id: PathParams<SetTicketStatusOp>["legacy_ticket_id"],
  body: TicketStatusRequest,
): Promise<SupportTicketDetail> {
  return apiPost(ticketsPaths.ticketStatus, { path: { legacy_ticket_id }, body });
}

/** `POST .../tickets/{id}/replies` — posts a reply as the signed-in admin. Audited. */
export function replySupportTicket(
  legacy_ticket_id: PathParams<ReplyTicketOp>["legacy_ticket_id"],
  body: TicketReplyRequest,
): Promise<SupportTicketDetail> {
  return apiPost(ticketsPaths.ticketReplies, { path: { legacy_ticket_id }, body });
}

export const ticketsQueries = {
  list: (params?: SupportTicketsParams) =>
    queryOptions({ queryKey: ticketsKeys.list(params), queryFn: () => listSupportTickets(params) }),
  detail: (legacyTicketId: number) =>
    queryOptions({ queryKey: ticketsKeys.detail(legacyTicketId), queryFn: () => getSupportTicket(legacyTicketId) }),
};
