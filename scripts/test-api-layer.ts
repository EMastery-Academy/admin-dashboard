import {
  ApiError,
  adminLogin,
  adminLogout,
  adminMe,
  adminRefresh,
  apiRequest,
  assignAdminRole,
  categoriesReport,
  couponsReport,
  createAdminUser,
  createBundle,
  createRole,
  customersReport,
  dashboardSales,
  dashboardSummary,
  getBackofficeCustomer,
  getBundle,
  getCatalogProduct,
  getConsultationService,
  getCustomer,
  getCustomer360,
  getDatabaseHealth,
  getHealth,
  getLegacyResource,
  getOrder,
  getPaymentIntent,
  getPromotion,
  getRefundPreview,
  getSupportTicket,
  importCustomers,
  legacyProductsReport,
  legacyResources,
  listAdminUserRoles,
  listAdminUsers,
  listAnnouncementBars,
  listAuditLogs,
  listBackofficeCustomers,
  listBanners,
  listCatalog,
  listConsultationServices,
  listCountries,
  listCustomers,
  listImportIssues,
  listLegacyPanelUsers,
  listLegacyResource,
  listLegacyTickets,
  listModules,
  listNotificationEmails,
  listOffers,
  listOrders,
  listPaymentFailures,
  listPriceLists,
  listPromotions,
  listReferralPartners,
  listReferralPayouts,
  listRefunds,
  listRoles,
  listSliders,
  listSocialLinks,
  listSupportTickets,
  listTags,
  createLegacyResource,
  deleteLegacyResource,
  updateLegacyResource,
  monthlyCharts,
  productsReport,
  publishProduct,
  reconcilePaymentIntent,
  removeAdminRole,
  replySupportTicket,
  reportCounters,
  salesReport,
  setAdminUserStatus,
  setCustomerStatus,
  setPromotionActive,
  setReferralPartnerStatus,
  setSupportTicketStatus,
  updateBundle,
  updateCustomer,
} from "../src/lib/api";

// --------------------------------------------------------------------------- harness

const args = new Set(process.argv.slice(2));
const includeMutations = args.has("--include-mutations");
const failOnSkip = args.has("--fail-on-skip");
const apiOrigin = process.env.API_BASE_URL ?? "http://localhost:8000";
const adminEmail = process.env.API_TEST_ADMIN_EMAIL ?? "admin@masteryacademy.site";
const adminPassword = process.env.API_TEST_ADMIN_PASSWORD ?? "Admin@12345";
/** Milliseconds to wait between requests; raise it if the backend rate-limits (default 120ms). */
const requestDelayMs = Number(process.env.API_TEST_DELAY_MS ?? 120);
/** How many times to retry a 429/503 before failing. */
const maxRetries = Number(process.env.API_TEST_MAX_RETRIES ?? 6);

type TestStatus = "pass" | "fail" | "skip";

type TestResult = {
  name: string;
  status: TestStatus;
  ms: number;
  detail?: string;
};

type LiveTest = {
  name: string;
  /** Requires `--include-mutations`. */
  mutates?: boolean;
  run: (ctx: TestContext) => Promise<void>;
};

type TestContext = {
  adminUserId?: string;
  roleId?: string;
  roleCode?: string;
  orderId?: string;
  customerId?: string;
  legacyUserId?: number;
  intentId?: string;
  courseKind?: "course" | "package";
  courseLegacyId?: number;
  coursePublished?: boolean;
  promotionId?: number;
  promotionActive?: boolean;
  partnerId?: number;
  partnerStatus?: string;
  ticketId?: number;
  ticketStatus?: number;
  consultationId?: number;
  bundleId?: string;
  createdAdminId?: string;
  createdRoleId?: string;
  resourceRecordId?: number;
};

class SkipTest extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SkipTest";
  }
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const LEGACY_WRITES_DISABLED = "Local legacy writes are disabled";

/** Back-office writes go to the legacy mirror; when the backend disables them (globally or per
 * resource) the test skips rather than failing. */
function isLegacyWritesDisabled(error: unknown): boolean {
  if (!(error instanceof ApiError)) return false;
  const message = String(error.message);
  return message.includes(LEGACY_WRITES_DISABLED) || message.includes("read-only");
}

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: { "Content-Type": "application/json", ...(init.headers ?? {}) },
  });
}

async function runTest(name: string, run: () => Promise<void>): Promise<TestResult> {
  const started = performance.now();
  try {
    await run();
    return { name, status: "pass", ms: Math.round(performance.now() - started) };
  } catch (error) {
    if (error instanceof SkipTest) {
      return { name, status: "skip", ms: Math.round(performance.now() - started), detail: error.message };
    }
    const detail = error instanceof Error ? error.message : String(error);
    return { name, status: "fail", ms: Math.round(performance.now() - started), detail };
  }
}

// --------------------------------------------------------------------------- cookie jar

type Fetch = typeof fetch;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function installCookieFetch(origin: string): { restore: () => void } {
  const originalFetch: Fetch = globalThis.fetch;
  const cookies = new Map<string, string>();

  const cookieHeader = () => [...cookies.entries()].map(([key, value]) => `${key}=${value}`).join("; ");

  function storeSetCookies(response: Response): void {
    for (const raw of response.headers.getSetCookie?.() ?? []) {
      const pair = raw.split(";")[0] ?? "";
      const index = pair.indexOf("=");
      if (index > 0) cookies.set(pair.slice(0, index).trim(), pair.slice(index + 1).trim());
    }
  }

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? new URL(input, origin).toString() : input;
    const headers = new Headers(init?.headers);
    const cookie = cookieHeader();
    if (cookie && !headers.has("Cookie")) headers.set("Cookie", cookie);

    let attempt = 0;
    for (;;) {
      if (requestDelayMs > 0) await sleep(requestDelayMs);
      const response = await originalFetch(url, { ...init, headers });
      storeSetCookies(response);

      if ((response.status === 429 || response.status === 503) && attempt < maxRetries) {
        const retryAfter = Number(response.headers.get("Retry-After") ?? 0);
        const waitMs = retryAfter > 0 ? retryAfter * 1000 : Math.min(8_000, 500 * 2 ** attempt);
        await sleep(waitMs);
        attempt += 1;
        continue;
      }

      return response;
    }
  }) as Fetch;

  return { restore: () => { globalThis.fetch = originalFetch; } };
}

// --------------------------------------------------------------------------- offline

function clientBehaviorTests(): LiveTest[] {
  return [
    {
      name: "client builds same-origin URLs, query params, JSON body and request id",
      run: async () => {
        const originalFetch = globalThis.fetch;
        let capturedUrl = "";
        let capturedHeaders: Headers | undefined;
        let capturedBody = "";

        globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
          capturedUrl = String(input);
          capturedHeaders = new Headers(init?.headers);
          capturedBody = String(init?.body);
          return jsonResponse({ ok: true });
        }) as Fetch;

        try {
          await apiRequest("POST", "/api/v1/health", {
            body: { ping: true },
            query: { a: [1, 2], b: true, empty: null },
          });
        } finally {
          globalThis.fetch = originalFetch;
        }

        assert(capturedUrl.startsWith("/api/v1/health?"), `expected /api/v1/health URL, got ${capturedUrl}`);
        assert(!capturedUrl.includes("/api/v1/api/v1"), "URL must not double-prefix /api/v1");
        assert(capturedUrl.includes("a=1") && capturedUrl.includes("a=2"), "array query params missing");
        assert(capturedUrl.includes("b=true"), "boolean query param missing");
        assert(!capturedUrl.includes("empty="), "null query params should be omitted");
        assert(capturedHeaders?.get("Content-Type") === "application/json", "Content-Type should be JSON");
        assert(typeof capturedHeaders?.get("X-Request-ID") === "string", "a request id header should be sent");
        assert(capturedBody === JSON.stringify({ ping: true }), "JSON body was not serialized");
      },
    },
    {
      name: "client interpolates path params and encodes them",
      run: async () => {
        const originalFetch = globalThis.fetch;
        let capturedUrl = "";

        globalThis.fetch = (async (input: RequestInfo | URL) => {
          capturedUrl = String(input);
          return jsonResponse({}, { status: 200 });
        }) as Fetch;

        try {
          await apiRequest("GET", "/api/v1/admin/orders/{order_id}", { path: { order_id: "a b/c" } });
        } finally {
          globalThis.fetch = originalFetch;
        }

        assert(capturedUrl === "/api/v1/admin/orders/a%20b%2Fc", `path not interpolated: ${capturedUrl}`);
      },
    },
    {
      name: "client rejects a missing path param",
      run: async () => {
        let threw = false;
        try {
          await apiRequest("GET", "/api/v1/admin/orders/{order_id}", { path: {} });
        } catch (error) {
          threw = true;
          assert(error instanceof Error && error.message.includes("order_id"), "expected missing-param error");
        }
        assert(threw, "expected apiRequest to throw on missing path param");
      },
    },
    {
      name: "client maps backend errors to ApiError with status and request id",
      run: async () => {
        const originalFetch = globalThis.fetch;
        globalThis.fetch = (async () =>
          jsonResponse({ detail: "Not authenticated" }, { status: 401, headers: { "X-Request-ID": "req-401" } })) as Fetch;

        try {
          await apiRequest("GET", "/api/v1/admin/me");
          throw new Error("expected apiRequest to throw");
        } catch (error) {
          assert(error instanceof ApiError, "expected ApiError");
          assert(error.status === 401, "expected 401 status");
          assert(error.message === "Not authenticated", "expected backend detail message");
          assert(error.details.requestId === "req-401", "expected X-Request-ID metadata");
        } finally {
          globalThis.fetch = originalFetch;
        }
      },
    },
    {
      name: "client returns undefined for 204 and non-JSON responses",
      run: async () => {
        const originalFetch = globalThis.fetch;
        globalThis.fetch = (async () => new Response(null, { status: 204 })) as Fetch;
        try {
          const value = await apiRequest("POST", "/api/v1/admin/auth/logout", { body: {} });
          assert(value === undefined, "expected undefined for 204");
        } finally {
          globalThis.fetch = originalFetch;
        }
      },
    },
  ];
}

// --------------------------------------------------------------------------- date helper

function range(days: number): { start: string; end: string } {
  const end = new Date();
  const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);
  return { start: start.toISOString(), end: end.toISOString() };
}

function legacyRange(): { date1: string; date2: string } {
  const end = new Date();
  const start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
  return { date1: start.toISOString().slice(0, 10), date2: end.toISOString().slice(0, 10) };
}

// --------------------------------------------------------------------------- live endpoints

function liveEndpointTests(): LiveTest[] {
  return [
    // -- session (needed first)
    { name: "POST /admin/auth/login (establish session)", run: async () => { await adminLogin({ email: adminEmail, password: adminPassword }); } },
    { name: "GET /admin/me", run: async () => { const me = await adminMe(); assert(me.email, "expected admin email"); } },

    // -- health (public)
    { name: "GET /health", run: async () => { await getHealth(); } },
    { name: "GET /health/database", run: async () => { await getDatabaseHealth(); } },

    // -- IAM
    {
      name: "GET /admin/admin-users",
      run: async (ctx) => {
        const page = await listAdminUsers({ limit: 5 });
        assert(Array.isArray(page.items), "expected items array");
        const superAdmin = page.items.find((u) => u.scopes.includes("*"));
        ctx.adminUserId = (superAdmin ?? page.items[0])?.admin_user_id;
      },
    },
    { name: "GET /admin/roles", run: async (ctx) => { const roles = await listRoles(); assert(Array.isArray(roles), "expected roles array"); ctx.roleId = roles[0]?.role_id; ctx.roleCode = roles[0]?.code; } },
    {
      name: "GET /admin/admin-users/{id}/roles",
      run: async (ctx) => {
        if (!ctx.adminUserId) throw new SkipTest("no admin user id available");
        await listAdminUserRoles(ctx.adminUserId);
      },
    },
    { name: "GET /admin/audit-logs", run: async () => { await listAuditLogs({ limit: 5 }); } },

    // -- dashboard
    { name: "GET /admin/backoffice/dashboard/summary", run: async (ctx) => { const s = await dashboardSummary(); assert(typeof s.customers_total === "number", "expected numeric counters"); void ctx; } },
    { name: "GET /admin/backoffice/dashboard/sales", run: async () => { await dashboardSales(range(30)); } },
    { name: "GET /admin/backoffice/reports/products", run: async () => { await productsReport(range(30)); } },

    // -- sales: orders
    {
      name: "GET /admin/orders",
      run: async (ctx) => {
        const page = await listOrders({ limit: 5 });
        ctx.orderId = page.items[0]?.order_id;
        ctx.intentId = page.items[0]?.payment_intent_id ?? undefined;
      },
    },
    { name: "GET /admin/orders/{id}", run: async (ctx) => { if (!ctx.orderId) throw new SkipTest("no order id"); await getOrder(ctx.orderId); } },

    // -- sales: payments
    { name: "GET /admin/payments/failures", run: async () => { await listPaymentFailures({ limit: 5 }); } },
    { name: "GET /admin/payments/refunds", run: async () => { await listRefunds({ limit: 5 }); } },
    { name: "GET /admin/payments/orders/{id}/refund-preview", run: async (ctx) => { if (!ctx.orderId) throw new SkipTest("no order id"); await getRefundPreview(ctx.orderId); } },
    { name: "GET /admin/payments/intents/{id}", run: async (ctx) => { if (!ctx.intentId) throw new SkipTest("no payment intent id"); await getPaymentIntent(ctx.intentId); } },

    // -- customers
    {
      name: "GET /admin/customers",
      run: async (ctx) => {
        const page = await listCustomers({ limit: 5 });
        ctx.customerId = page.items[0]?.customer_id;
      },
    },
    { name: "GET /admin/customers/{id}", run: async (ctx) => { if (!ctx.customerId) throw new SkipTest("no customer id"); await getCustomer(ctx.customerId); } },
    { name: "GET /admin/customers/{id}/360", run: async (ctx) => { if (!ctx.customerId) throw new SkipTest("no customer id"); await getCustomer360(ctx.customerId); } },

    // -- back-office directory
    {
      name: "GET /admin/backoffice/customers",
      run: async (ctx) => {
        const page = await listBackofficeCustomers({ limit: 5 });
        const withLegacy = page.items.find((c) => c.legacy_user_id);
        ctx.legacyUserId = withLegacy?.legacy_user_id ?? undefined;
      },
    },
    { name: "GET /admin/backoffice/customers/{legacy_user_id}", run: async (ctx) => { if (!ctx.legacyUserId) throw new SkipTest("no legacy user id"); await getBackofficeCustomer(ctx.legacyUserId); } },
    { name: "GET /admin/backoffice/customers/import/issues", run: async () => { await listImportIssues({ limit: 5 }); } },

    // -- catalog
    {
      name: "GET /admin/backoffice/catalog/{kind} (course)",
      run: async (ctx) => {
        const page = await listCatalog("course", { limit: 5 });
        ctx.courseKind = "course";
        ctx.courseLegacyId = page.items[0]?.legacy_id;
        ctx.coursePublished = page.items[0]?.status === "published";
      },
    },
    { name: "GET /admin/backoffice/catalog/{kind} (package)", run: async () => { await listCatalog("package", { limit: 5 }); } },
    { name: "GET /admin/backoffice/catalog/{kind}/{legacy_id}", run: async (ctx) => { if (!ctx.courseLegacyId || !ctx.courseKind) throw new SkipTest("no course"); await getCatalogProduct(ctx.courseKind, ctx.courseLegacyId); } },

    // -- bundles
    { name: "GET /admin/bundles/{product_id}", run: async (ctx) => { if (!ctx.bundleId) throw new SkipTest("no bundle created in this run"); await getBundle(ctx.bundleId); } },

    // -- consultations
    {
      name: "GET /admin/backoffice/consultations/services",
      run: async (ctx) => {
        const page = await listConsultationServices({ limit: 5 });
        ctx.consultationId = page.items[0]?.legacy_consultancy_id;
      },
    },
    { name: "GET /admin/backoffice/consultations/services/{id}", run: async (ctx) => { if (!ctx.consultationId) throw new SkipTest("no consultation service"); await getConsultationService(ctx.consultationId); } },

    // -- promotions
    {
      name: "GET /admin/backoffice/promotions",
      run: async (ctx) => {
        const page = await listPromotions({ limit: 5 });
        ctx.promotionId = page.items[0]?.legacy_coupon_id;
        ctx.promotionActive = page.items[0]?.active;
      },
    },
    { name: "GET /admin/backoffice/promotions/{id}", run: async (ctx) => { if (!ctx.promotionId) throw new SkipTest("no promotion"); await getPromotion(ctx.promotionId); } },

    // -- referrals
    {
      name: "GET /admin/backoffice/referrals/partners",
      run: async (ctx) => {
        const page = await listReferralPartners({ limit: 5 });
        ctx.partnerId = page.items[0]?.legacy_affiliate_id;
        ctx.partnerStatus = page.items[0]?.status;
      },
    },
    { name: "GET /admin/backoffice/referrals/payouts", run: async () => { await listReferralPayouts({ limit: 5 }); } },

    // -- support
    {
      name: "GET /admin/backoffice/support/tickets",
      run: async (ctx) => {
        const page = await listSupportTickets({ limit: 5 });
        ctx.ticketId = page.items[0]?.legacy_ticket_id;
        ctx.ticketStatus = page.items[0]?.status;
      },
    },
    { name: "GET /admin/backoffice/support/tickets/{id}", run: async (ctx) => { if (!ctx.ticketId) throw new SkipTest("no ticket"); await getSupportTicket(ctx.ticketId); } },

    // -- analytics reports (read-only POSTs)
    { name: "POST /legacy-admin/report/monthlycharts", run: async () => { await monthlyCharts(legacyRange()); } },
    {
      name: "POST /legacy-admin/report/salesreport",
      run: async () => {
        const report = await salesReport(legacyRange());
        assert(typeof report.totalOrders === "number", "expected totalOrders number");
        assert(typeof report.totalSales === "number", "expected totalSales number");
        assert(Array.isArray(report.days), "expected days array");
      },
    },
    { name: "POST /legacy-admin/report/productsreport", run: async () => { await legacyProductsReport(legacyRange()); } },
    { name: "POST /legacy-admin/report/categoriessellingreport", run: async () => { await categoriesReport(legacyRange()); } },
    { name: "POST /legacy-admin/report/couponsellingreport", run: async () => { await couponsReport(legacyRange()); } },
    { name: "POST /legacy-admin/report/customersreport", run: async () => { await customersReport(legacyRange()); } },
    { name: "GET /legacy-admin/report/counters", run: async () => { await reportCounters(); } },

    // -- settings (legacy reads)
    { name: "GET /legacy-admin/settings/social", run: async () => { await listSocialLinks(); } },
    { name: "GET /legacy-admin/settings/emailnotified", run: async () => { await listNotificationEmails(); } },
    { name: "GET /legacy-admin/settings/alltags", run: async () => { await listTags(); } },
    { name: "GET /legacy-admin/settings/countries", run: async () => { await listCountries(); } },
    { name: "GET /legacy-admin/settings/allmodules", run: async () => { await listModules(); } },
    { name: "GET /legacy-admin/marketing/offers", run: async () => { await listOffers(); } },
    { name: "GET /legacy-admin/courses/price_lists", run: async () => { await listPriceLists(); } },

    // -- legacy panels
    { name: "GET /legacy-admin/v2/banners", run: async () => { await listBanners(); } },
    { name: "GET /legacy-admin/v2/sliders", run: async () => { await listSliders(); } },
    { name: "GET /legacy-admin/marketing/ads", run: async () => { await listAnnouncementBars(); } },
    { name: "GET /legacy-admin/users/panelusers", run: async () => { await listLegacyPanelUsers(); } },
    { name: "GET /legacy-admin/settings/tickets", run: async () => { await listLegacyTickets({ limit: 5 }); } },

    // -- generic legacy resources
    { name: "GET /legacy-admin/resources", run: async () => { await legacyResources(); } },
    {
      name: "GET /legacy-admin/resources/certificates",
      run: async (ctx) => {
        const page = await listLegacyResource("certificates", { limit: 5 });
        ctx.resourceRecordId = (page.items[0] as { id?: number } | undefined)?.id;
      },
    },
    {
      name: "GET /legacy-admin/resources/certificates/{id}",
      run: async (ctx) => {
        if (!ctx.resourceRecordId) throw new SkipTest("no certificate row");
        await getLegacyResource("certificates", ctx.resourceRecordId);
      },
    },
    {
      name: "GET /legacy-admin/resources/trainers?search&filter=active",
      run: async () => {
        const page = await listLegacyResource("trainers", { search: "محمد", filter: ["active:true"], limit: 5 });
        assert(Array.isArray(page.items), "expected items array");
      },
    },

    // ----------------------------------------------------------------- mutations
    { name: "POST /admin/auth/refresh", mutates: true, run: async () => { await adminRefresh({}); } },

    {
      name: "POST /admin/admin-users + PATCH status (create then suspend)",
      mutates: true,
      run: async (ctx) => {
        const email = `api-layer-${Date.now()}@example.com`;
        const created = await createAdminUser({ email, password: "ApiLayerTest123!", full_name: "API Layer Test" });
        ctx.createdAdminId = created.admin_user_id;
        const suspended = await setAdminUserStatus(created.admin_user_id, { status: "suspended" });
        assert(suspended.status === "suspended", "expected admin to be suspended");
      },
    },
    {
      name: "POST /admin/roles + assign/remove role",
      mutates: true,
      run: async (ctx) => {
        if (!ctx.adminUserId) throw new SkipTest("no admin user to assign a role to");
        const role = await createRole({ code: `api_layer_${Date.now()}`, name: "API Layer Test", scopes: [] });
        ctx.createdRoleId = role.role_id;
        const roles = await assignAdminRole(ctx.adminUserId, { role_id: role.role_id });
        assert(roles.some((r) => r.role_id === role.role_id), "role not assigned");
        await removeAdminRole(ctx.adminUserId, role.role_id);
      },
    },
    {
      name: "POST /admin/backoffice/customers/import (dry run)",
      mutates: true,
      run: async () => {
        await importCustomers({ batch_size: 50, dry_run: true, restart: false });
      },
    },
    {
      name: "POST /admin/backoffice/catalog/{kind}/{id}/publish (no-op toggle)",
      mutates: true,
      run: async (ctx) => {
        if (!ctx.courseLegacyId || !ctx.courseKind) throw new SkipTest("no course");
        try {
          await publishProduct(ctx.courseKind, ctx.courseLegacyId, { published: ctx.coursePublished ?? true });
        } catch (error) {
          if (isLegacyWritesDisabled(error)) throw new SkipTest("backend has legacy writes disabled");
          throw error;
        }
      },
    },
    {
      name: "POST /admin/backoffice/promotions/{id}/active (no-op toggle)",
      mutates: true,
      run: async (ctx) => {
        if (!ctx.promotionId) throw new SkipTest("no promotion");
        try {
          await setPromotionActive(ctx.promotionId, { active: ctx.promotionActive ?? true });
        } catch (error) {
          if (isLegacyWritesDisabled(error)) throw new SkipTest("backend has legacy writes disabled");
          throw error;
        }
      },
    },
    {
      name: "POST /admin/backoffice/referrals/partners/{id}/status (no-op toggle)",
      mutates: true,
      run: async (ctx) => {
        if (!ctx.partnerId || (ctx.partnerStatus !== "approved" && ctx.partnerStatus !== "pending")) {
          throw new SkipTest("no partner with a settable status");
        }
        try {
          await setReferralPartnerStatus(ctx.partnerId, { status: ctx.partnerStatus });
        } catch (error) {
          if (isLegacyWritesDisabled(error)) throw new SkipTest("backend has legacy writes disabled");
          throw error;
        }
      },
    },
    {
      name: "POST /admin/backoffice/support/tickets/{id}/status (no-op toggle)",
      mutates: true,
      run: async (ctx) => {
        if (!ctx.ticketId || ctx.ticketStatus === undefined) throw new SkipTest("no ticket");
        try {
          await setSupportTicketStatus(ctx.ticketId, { status: ctx.ticketStatus });
        } catch (error) {
          if (isLegacyWritesDisabled(error)) throw new SkipTest("backend has legacy writes disabled");
          throw error;
        }
      },
    },
    {
      name: "POST /admin/backoffice/support/tickets/{id}/replies",
      mutates: true,
      run: async (ctx) => {
        if (!ctx.ticketId) throw new SkipTest("no ticket");
        try {
          await replySupportTicket(ctx.ticketId, { message: `API layer smoke test ${new Date().toISOString()}` });
        } catch (error) {
          if (isLegacyWritesDisabled(error)) throw new SkipTest("backend has legacy writes disabled");
          throw error;
        }
      },
    },
    {
      name: "POST /admin/customers/{id}/status (no-op, keeps current status)",
      mutates: true,
      run: async (ctx) => {
        if (!ctx.customerId) throw new SkipTest("no customer");
        const detail = await getCustomer(ctx.customerId);
        await setCustomerStatus(ctx.customerId, { status: detail.status });
      },
    },
    {
      name: "PATCH /admin/customers/{id} (no-op, re-sends current name)",
      mutates: true,
      run: async (ctx) => {
        if (!ctx.customerId) throw new SkipTest("no customer");
        const detail = await getCustomer(ctx.customerId);
        await updateCustomer(ctx.customerId, { full_name: detail.full_name ?? undefined });
      },
    },
    {
      name: "POST /admin/bundles + PUT /admin/bundles/{id}",
      mutates: true,
      run: async (ctx) => {
        if (!ctx.courseLegacyId) throw new SkipTest("no catalog product to build a bundle from");
        const detail = await getCatalogProduct("course", ctx.courseLegacyId);
        const productId = typeof detail.product_id === "string" ? detail.product_id : undefined;
        if (!productId) throw new SkipTest("catalog detail has no b2c product_id");
        const slug = `api-layer-bundle-${Date.now()}`;
        const created = await createBundle({
          slug,
          title: "API Layer Test Bundle",
          status: "draft",
          currency_code: "USD",
          amount: "100.00",
          cpd_eligible: false,
          members: [{ product_id: productId, sort_order: 1, quantity: 1 }],
        });
        ctx.bundleId = created.product_id;
        await updateBundle(created.product_id, {
          slug,
          title: "API Layer Test Bundle (updated)",
          status: "draft",
          currency_code: "USD",
          amount: "120.00",
          cpd_eligible: false,
          members: [{ product_id: productId, sort_order: 1, quantity: 1 }],
        });
      },
    },
    {
      name: "POST /admin/payments/intents/{id}/reconcile",
      mutates: true,
      run: async (ctx) => {
        if (!ctx.intentId) throw new SkipTest("no payment intent id");
        await reconcilePaymentIntent(ctx.intentId);
      },
    },
    {
      name: "POST/PATCH/DELETE /legacy-admin/resources/{resource}",
      mutates: true,
      run: async () => {
        let created: unknown;
        try {
          created = await createLegacyResource("certificates", { name: `API Layer ${Date.now()}`, description: "smoke test" });
        } catch (error) {
          if (isLegacyWritesDisabled(error)) throw new SkipTest("backend has legacy writes disabled");
          throw error;
        }
        const id = (created as { id?: number }).id;
        if (id == null) throw new SkipTest("created row has no id");
        await updateLegacyResource("certificates", id, { name: "API Layer updated" });
        await deleteLegacyResource("certificates", id);
      },
    },
    { name: "POST /admin/auth/logout (ends session)", mutates: true, run: async () => { await adminLogout({}); } },
  ];
}

// --------------------------------------------------------------------------- runner

async function main() {
  console.log(`API base URL:   ${apiOrigin}`);
  console.log(`Admin login:    ${adminEmail}`);
  console.log(`Mutations:      ${includeMutations ? "ENABLED" : "skipped (pass --include-mutations)"}`);
  console.log("");

  const results: TestResult[] = [];
  const ctx: TestContext = {};

  for (const test of clientBehaviorTests()) {
    results.push(await runTest(test.name, () => test.run(ctx)));
  }

  const { restore } = installCookieFetch(apiOrigin);
  try {
    for (const test of liveEndpointTests()) {
      if (test.mutates && !includeMutations) {
        results.push({ name: test.name, status: "skip", ms: 0, detail: "Run with --include-mutations" });
        continue;
      }
      results.push(await runTest(test.name, () => test.run(ctx)));
    }
  } finally {
    restore();
  }

  printSummary(results);

  const failed = results.some((r) => r.status === "fail");
  const skipped = results.some((r) => r.status === "skip");
  if (failed || (failOnSkip && skipped)) process.exitCode = 1;
}

function printSummary(results: TestResult[]): void {
  const width = Math.max(...results.map((r) => r.name.length), 12);
  for (const result of results) {
    const mark = result.status === "pass" ? "PASS" : result.status === "skip" ? "SKIP" : "FAIL";
    const detail = result.detail ? `  — ${result.detail}` : "";
    console.log(`${mark}  ${result.name.padEnd(width)}  ${String(result.ms).padStart(5)}ms${detail}`);
  }

  const passed = results.filter((r) => r.status === "pass").length;
  const failed = results.filter((r) => r.status === "fail").length;
  const skipped = results.filter((r) => r.status === "skip").length;
  console.log("");
  console.log(`${passed} passed, ${failed} failed, ${skipped} skipped (${results.length} total)`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
