import { queryOptions } from "@tanstack/react-query";

import { apiGet, apiPost } from "@/lib/api/client";
import type { PathParams, QueryParams, RequestBody } from "@/lib/api/operation-types";
import type { Page, ReferralPartner, ReferralPayout } from "@/lib/api/contract";

type ListPartnersOp = "list_referral_partners_api_v1_admin_backoffice_referrals_partners_get";
type SetPartnerStatusOp = "set_referral_partner_status_api_v1_admin_backoffice_referrals_partners__legacy_affiliate_id__status_post";
type ListPayoutsOp = "list_payout_requests_api_v1_admin_backoffice_referrals_payouts_get";

export type ReferralPartnersParams = QueryParams<ListPartnersOp>;
export type ReferralPartnerPage = Page<ReferralPartner>;
export type PartnerStatusRequest = RequestBody<SetPartnerStatusOp>;
export type ReferralPayoutsParams = QueryParams<ListPayoutsOp>;
export type ReferralPayoutPage = Page<ReferralPayout>;

export const referralsPaths = {
  partners: "admin/backoffice/referrals/partners",
  partnerStatus: "admin/backoffice/referrals/partners/{legacy_affiliate_id}/status",
  payouts: "admin/backoffice/referrals/payouts",
} as const;

export const referralsKeys = {
  all: ["marketing", "referrals"] as const,
  partners: (params?: ReferralPartnersParams) => [...referralsKeys.all, "partners", params ?? {}] as const,
  payouts: (params?: ReferralPayoutsParams) => [...referralsKeys.all, "payouts", params ?? {}] as const,
};

export function listReferralPartners(params: ReferralPartnersParams = {}): Promise<ReferralPartnerPage> {
  return apiGet<ReferralPartnerPage>(referralsPaths.partners, { query: params });
}

/** `POST .../referrals/partners/{id}/status` — approve a referral partner. Audited. */
export function setReferralPartnerStatus(
  legacy_affiliate_id: PathParams<SetPartnerStatusOp>["legacy_affiliate_id"],
  body: PartnerStatusRequest,
): Promise<ReferralPartner> {
  return apiPost(referralsPaths.partnerStatus, { path: { legacy_affiliate_id }, body });
}

export function listReferralPayouts(params: ReferralPayoutsParams = {}): Promise<ReferralPayoutPage> {
  return apiGet<ReferralPayoutPage>(referralsPaths.payouts, { query: params });
}

export const referralsQueries = {
  partners: (params?: ReferralPartnersParams) =>
    queryOptions({ queryKey: referralsKeys.partners(params), queryFn: () => listReferralPartners(params) }),
  payouts: (params?: ReferralPayoutsParams) =>
    queryOptions({ queryKey: referralsKeys.payouts(params), queryFn: () => listReferralPayouts(params) }),
};
