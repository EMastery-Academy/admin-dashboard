export type Label = { ar: string; en: string };

export type NavItem = { title: Label; href: string; permission?: string; badge?: string };
export type NavSection = { title: Label; items: NavItem[] };
export type NavModule = {
  id: string;
  title: Label;
  icon: string;
  href?: string;
  disabled?: boolean;
  note?: Label;
  sections: NavSection[];
};

/**
 * Single source for the primary rail and the secondary sidebar. Port of the demo's
 * `config/navigation.js`; only stable destinations live here — details, studio and wizards are
 * contextual routes.
 */
export const navigation: NavModule[] = [
  {
    id: "dashboard",
    title: { ar: "الرئيسية", en: "Home" },
    icon: "home",
    sections: [
      {
        title: { ar: "نظرة عامة", en: "Overview" },
        items: [
          { title: { ar: "لوحة المؤشرات", en: "Dashboard" }, href: "/dashboard", permission: "dashboard.read" },
          { title: { ar: "صندوق المهام", en: "Ops inbox" }, href: "/dashboard/inbox", permission: "dashboard.read", badge: "inbox" },
          { title: { ar: "البحث", en: "Search" }, href: "/search", permission: "dashboard.read" },
        ],
      },
    ],
  },
  {
    id: "sales",
    title: { ar: "المبيعات", en: "Sales" },
    icon: "cart",
    sections: [
      {
        title: { ar: "التجارة", en: "Commerce" },
        items: [
          { title: { ar: "نظرة عامة", en: "Overview" }, href: "/sales/overview", permission: "orders.read" },
          { title: { ar: "الطلبات", en: "Orders" }, href: "/sales/orders", permission: "orders.read" },
          { title: { ar: "المدفوعات", en: "Payments" }, href: "/sales/payments", permission: "payments.read" },
          { title: { ar: "الاستردادات", en: "Refunds" }, href: "/sales/refunds", permission: "refunds.read", badge: "refunds" },
          { title: { ar: "الفواتير", en: "Invoices" }, href: "/sales/invoices", permission: "invoices.read" },
        ],
      },
      {
        title: { ar: "التسعير", en: "Pricing" },
        items: [
          { title: { ar: "الكوبونات", en: "Coupons" }, href: "/sales/coupons", permission: "coupons.read" },
          { title: { ar: "قوائم الأسعار", en: "Price lists" }, href: "/sales/price-lists", permission: "pricing.read" },
          { title: { ar: "العروض", en: "Offers" }, href: "/sales/offers", permission: "pricing.read" },
        ],
      },
    ],
  },
  {
    id: "learning",
    title: { ar: "التعلم", en: "Learning" },
    icon: "book",
    sections: [
      {
        title: { ar: "الكتالوج", en: "Catalog" },
        items: [
          { title: { ar: "الدورات", en: "Courses" }, href: "/learning/courses", permission: "courses.read" },
          { title: { ar: "الحزم والدبلومات", en: "Packages & diplomas" }, href: "/learning/packages", permission: "packages.read" },
          { title: { ar: "التصنيفات", en: "Categories" }, href: "/learning/categories", permission: "categories.read" },
          { title: { ar: "الاستشارات", en: "Consultations" }, href: "/learning/consultations", permission: "consultations.read" },
          { title: { ar: "المستشارون", en: "Consultants" }, href: "/learning/consultants", permission: "consultations.read" },
        ],
      },
      {
        title: { ar: "التقديم", en: "Delivery" },
        items: [
          { title: { ar: "المدربون", en: "Instructors" }, href: "/learning/instructors", permission: "instructors.read" },
          { title: { ar: "طلبات المدربين", en: "Instructor applications" }, href: "/learning/applications", permission: "instructors.read", badge: "applications" },
          { title: { ar: "الشهادات", en: "Certificates" }, href: "/learning/certificates", permission: "certificates.read" },
          { title: { ar: "أسئلة المتدربين", en: "Q&A inbox" }, href: "/learning/qa", permission: "qa.read", badge: "qa" },
        ],
      },
    ],
  },
  {
    id: "customers",
    title: { ar: "العملاء", en: "Customers" },
    icon: "users",
    sections: [
      {
        title: { ar: "الأشخاص", en: "People" },
        items: [
          { title: { ar: "العملاء", en: "Customers" }, href: "/customers", permission: "customers.read" },
          { title: { ar: "الاستعلام عن مشترك", en: "Account lookup" }, href: "/customers/accounts", permission: "customers.read" },
          { title: { ar: "الشرائح", en: "Segments" }, href: "/customers/segments", permission: "customers.read" },
        ],
      },
      {
        title: { ar: "الدعم", en: "Support" },
        items: [{ title: { ar: "التذاكر", en: "Tickets" }, href: "/customers/tickets", permission: "tickets.read", badge: "tickets" }],
      },
    ],
  },
  {
    id: "marketing",
    title: { ar: "التسويق", en: "Marketing" },
    icon: "megaphone",
    sections: [
      {
        title: { ar: "الاستقطاب", en: "Acquisition" },
        items: [
          { title: { ar: "المسوقون بالعمولة", en: "Affiliates" }, href: "/marketing/affiliates", permission: "affiliates.read" },
          { title: { ar: "العمولات", en: "Commissions" }, href: "/marketing/commissions", permission: "affiliates.read" },
          { title: { ar: "طلبات الصرف", en: "Payout requests" }, href: "/marketing/payouts", permission: "affiliates.read", badge: "payouts" },
          { title: { ar: "سياسة البرنامج", en: "Program policy" }, href: "/marketing/policies", permission: "affiliates.read" },
          { title: { ar: "أشرطة الإعلانات", en: "Announcement bars" }, href: "/marketing/announcements", permission: "marketing.read" },
        ],
      },
      {
        title: { ar: "الموقع", en: "Website" },
        items: [{ title: { ar: "البانرات والسلايدر", en: "Banners & sliders" }, href: "/marketing/banners", permission: "marketing.read" }],
      },
    ],
  },
  {
    id: "analytics",
    title: { ar: "التقارير", en: "Analytics" },
    icon: "chart",
    sections: [
      {
        title: { ar: "التقارير", en: "Reports" },
        items: [
          { title: { ar: "المبيعات", en: "Sales" }, href: "/analytics/sales", permission: "reports.sales" },
          { title: { ar: "المنتجات", en: "Products" }, href: "/analytics/products", permission: "reports.products" },
          { title: { ar: "الكوبونات", en: "Coupons" }, href: "/analytics/coupons", permission: "reports.coupons" },
          { title: { ar: "العملاء", en: "Customers" }, href: "/analytics/customers", permission: "reports.customers" },
          { title: { ar: "المسوقون", en: "Affiliates" }, href: "/analytics/affiliates", permission: "reports.affiliates" },
          { title: { ar: "التقييمات", en: "Ratings" }, href: "/analytics/ratings", permission: "reports.ratings" },
          { title: { ar: "الشهادات", en: "Certificates" }, href: "/analytics/certificates", permission: "reports.certificates" },
        ],
      },
      {
        title: { ar: "السلوك", en: "Behavior" },
        items: [
          { title: { ar: "سلوك المستخدمين", en: "User behavior" }, href: "/analytics/behavior", permission: "reports.sales" },
          { title: { ar: "المسار التحويلي", en: "Conversion funnel" }, href: "/analytics/funnels", permission: "reports.sales" },
          { title: { ar: "مخطط السلوك", en: "Behavior map" }, href: "/analytics/behavior-map", permission: "reports.sales" },
        ],
      },
    ],
  },
  {
    id: "settings",
    title: { ar: "الإعدادات", en: "Settings" },
    icon: "settings",
    sections: [
      {
        title: { ar: "مساحة العمل", en: "Workspace" },
        items: [
          { title: { ar: "عام", en: "General" }, href: "/settings/general", permission: "settings.read" },
          { title: { ar: "الفريق والأدوار", en: "Team & roles" }, href: "/settings/team", permission: "settings.read" },
          { title: { ar: "التكاملات", en: "Integrations" }, href: "/settings/integrations", permission: "settings.read" },
          { title: { ar: "الإشعارات", en: "Notifications" }, href: "/settings/notifications", permission: "settings.read" },
          { title: { ar: "سجل التدقيق", en: "Audit log" }, href: "/settings/audit", permission: "settings.read" },
        ],
      },
    ],
  },
  {
    id: "b2b",
    title: { ar: "الشركات", en: "B2B" },
    icon: "building",
    href: "/b2b",
    disabled: true,
    note: { ar: "تبقى في اللوحة القديمة", en: "Stays in the legacy panel" },
    sections: [],
  },
];

export type FlatNavItem = NavItem & { module: NavModule; section: NavSection };

/** Flat list of visible destinations for search and active matching. */
export function flatItems(nav: NavModule[] = navigation): FlatNavItem[] {
  return nav.flatMap((module) => module.sections.flatMap((section) => section.items.map((item) => ({ ...item, module, section }))));
}

/**
 * Most specific sidebar item for a path, matching on whole segments:
 * "/sales/orders/1042/refund" → "/sales/orders"; "/sales/orders-archive" does not match it.
 */
export function matchActive(path: string, items: FlatNavItem[] = flatItems()): FlatNavItem | null {
  let best: FlatNavItem | null = null;
  for (const item of items) {
    if (path === item.href || path.startsWith(`${item.href}/`)) {
      if (!best || item.href.length > best.href.length) best = item;
    }
  }
  return best;
}
