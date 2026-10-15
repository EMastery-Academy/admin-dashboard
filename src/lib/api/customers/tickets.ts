import { queryOptions } from "@tanstack/react-query";

import { apiGet, apiPost } from "@/lib/api/client";
import type { PathParams, QueryParams, RequestBody, SuccessResponse } from "@/lib/api/operation-types";

type ListTicketsOp = "list_tickets_api_v1_admin_support_tickets_get";
type GetTicketOp = "get_ticket_api_v1_admin_support_tickets__legacy_ticket_id__get";
type SetTicketStatusOp = "set_ticket_status_api_v1_admin_support_tickets__legacy_ticket_id__status_post";
type ReplyTicketOp = "reply_ticket_api_v1_admin_support_tickets__legacy_ticket_id__replies_post";

export type SupportTicketsParams = QueryParams<ListTicketsOp>;
export type SupportTicketPage = SuccessResponse<ListTicketsOp>;
export type SupportTicketDetail = SuccessResponse<GetTicketOp>;
export type TicketStatusRequest = RequestBody<SetTicketStatusOp>;
export type TicketReplyRequest = RequestBody<ReplyTicketOp>;

export const ticketsPaths = {
  tickets: "admin/support/tickets",
  ticket: "admin/support/tickets/{legacy_ticket_id}",
  ticketStatus: "admin/support/tickets/{legacy_ticket_id}/status",
  ticketReplies: "admin/support/tickets/{legacy_ticket_id}/replies",
} as const;

export const ticketsKeys = {
  all: ["support", "tickets"] as const,
  list: (params?: SupportTicketsParams) => [...ticketsKeys.all, "list", params ?? {}] as const,
  detail: (legacyTicketId: number) => [...ticketsKeys.all, "detail", legacyTicketId] as const,
};

export function listSupportTickets(params: SupportTicketsParams = {}): Promise<SupportTicketPage> {
  return apiGet(ticketsPaths.tickets, { query: params });
}

export function getSupportTicket(
  legacy_ticket_id: PathParams<GetTicketOp>["legacy_ticket_id"],
): Promise<SupportTicketDetail> {
  return apiGet(ticketsPaths.ticket, { path: { legacy_ticket_id } });
}

/** `POST /admin/support/tickets/{id}/status` — ticket status (1 open, 3 closed, …). Audited. */
export function setSupportTicketStatus(
  legacy_ticket_id: PathParams<SetTicketStatusOp>["legacy_ticket_id"],
  body: TicketStatusRequest,
): Promise<SupportTicketDetail> {
  return apiPost(ticketsPaths.ticketStatus, { path: { legacy_ticket_id }, body });
}

/** `POST /admin/support/tickets/{id}/replies` — posts a reply as the signed-in admin. Audited. */
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
