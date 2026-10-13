/**
 * Hand-written shapes that the generated OpenAPI types cannot express precisely:
 * the admin back-office read models serialise as `asdict()` / `dict` (`object` in the spec) and the
 * legacy-admin mirror keeps the legacy JSON shapes (camelCase). Everything that the spec models
 * exactly (orders, payments, IAM, bundles, health, customers) lives in `@/types/openapi` and is
 * surfaced through the service modules.
 */

export type Page<T> = {
  items: T[];
  total: number;
  limit: number;
  offset: number;
};

export type DateRange = { start: string; end: string };

// ---------------------------------------------------------------- dashboard & reports (back-office)

/** `GET /admin/backoffice/dashboard/summary`. */
export type DashboardSummary = {
  customers_total: number;
  customers_confirmed: number;
  customers_active_today: number;
  learners_total: number;
  certificates_issued: number;
  products_published: number;
  products_unpublished: number;
  paid_orders: number;
  revenue_total: number;
  free_enrollments: number;
  promotions_used: number;
  referral_partners_approved: number;
  instructor_applications?: number;
  video_count?: number;
  video_seconds?: number;
  top_product?: string | null;
  top_certified_product?: string | null;
};

/** `GET /admin/backoffice/dashboard/sales?start&end`. */
export type SalesPoint = {
  day: string;
  revenue: number;
  orders: number;
};

/** `GET /admin/backoffice/reports/products?start&end`. */
export type ProductSalesRow = {
  product_kind: string;
  legacy_product_id: number;
  title: string;
  orders: number;
  revenue: number;
  promotion_uses: number;
};

// ---------------------------------------------------------------- back-office directory & marketing

export type CatalogKind = "course" | "package";

export type CatalogProduct = {
  kind: CatalogKind;
  legacy_id: number;
  product_id: string;
  title: string;
  slug: string;
  status: "published" | "draft";
  is_diploma?: boolean;
  category: string | null;
  instructor: string | null;
  list_price: number | null;
  current_price: number | null;
  image: string | null;
  /** Square crop of the product art; preferred over `image` for avatars when present. */
  square_image?: string | null;
  updated_at: string | null;
};

export type Promotion = {
  legacy_coupon_id: number;
  code: string;
  name: string;
  discount_percent: number;
  max_discount: number | null;
  min_order_total: number | null;
  usage_limit: number | null;
  starts_at: string;
  ends_at: string;
  active: boolean;
  referral_partner_id: number | null;
  /** Legacy numeric reason label (1/2/3+). */
  reason: number;
  scopes: unknown[];
};

export type ReferralPartner = {
  legacy_affiliate_id: number;
  name: string;
  email: string;
  phone: string | null;
  referral_code: string | null;
  status: string;
  country: string | null;
  joined_at: string;
};

export type ReferralPayout = {
  legacy_payment_id: number;
  legacy_affiliate_id: number;
  partner_name: string;
  amount: number;
  /** Legacy numeric status (1 = requested, 3 = paid). */
  status: number;
  requested_at: string;
  updated_at: string;
  notes: string | null;
};

export type ConsultationService = {
  legacy_consultancy_id: number;
  title: string;
  consultant_name: string;
  consultant_email: string;
  legacy_consultant_id: number;
  price: number;
  sessions: number;
  session_minutes: number;
  active: boolean;
  booking_link: string | null;
};

export type TicketMessage = {
  legacy_message_id: number;
  author: string;
  body: string;
  attachment: string | null;
  sent_at: string;
};

export type SupportTicket = {
  legacy_ticket_id: number;
  subject: string;
  body: string;
  type: number;
  status: number;
  priority: number;
  opened_at: string;
  legacy_user_id: number;
  messages: TicketMessage[];
};

/** `GET /admin/backoffice/customers` — B2C + legacy directory with legacy ids. */
export type BackofficeCustomer = {
  source: "b2c" | "legacy";
  customer_id: string;
  legacy_aspnet_id: string | null;
  legacy_user_id: number | null;
  email: string;
  full_name: string;
  phone: string | null;
  country_code: string | null;
  status: string;
  email_confirmed: boolean;
  created_at: string;
  last_signin: string | null;
};

// ---------------------------------------------------------------- legacy admin (raw rows)

/** Rows from `/legacy-admin/*` list endpoints keep the legacy JSON shapes; discriminate loosely. */
export type LegacyRow = Record<string, unknown>;

export type LegacyPanelUser = {
  id: number;
  email: string;
  fullName: string;
  groupId: number;
  groupName?: string;
  status?: number | boolean;
  [key: string]: unknown;
};
