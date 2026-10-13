import { Navigate, createBrowserRouter } from "react-router-dom";

import { Shell } from "@/components/layout/shell";
import { RequireAdmin } from "@/routes/guard";
import DashboardPage from "@/pages/dashboard";
import InboxPage from "@/pages/inbox";
import SalesOverviewPage from "@/pages/sales-overview";
import OrdersPage from "@/pages/orders";
import PaymentsPage from "@/pages/payments";
import RefundsPage from "@/pages/refunds";
import CouponsPage from "@/pages/coupons";
import CustomersPage from "@/pages/customers";
import TicketsPage from "@/pages/tickets";
import TeamPage from "@/pages/team";
import AuditPage from "@/pages/audit";
import AffiliatesPage from "@/pages/affiliates";
import PayoutsPage from "@/pages/payouts";
import CoursesPage, { PackagesPage } from "@/pages/catalog";
import ConsultationsPage from "@/pages/consultations";
import AnalyticsSalesPage, {
  CouponsReportPage,
  CustomersReportPage,
  ProductsReportPage,
} from "@/pages/reports";
import BannersPage from "@/pages/banners";
import InvoicesPage from "@/pages/invoices";
import CouponNewPage from "@/pages/coupon-new";
import CourseNewPage from "@/pages/course-new";
import GeneralSettingsPage from "@/pages/general-settings";
import {
  AffiliatesReportPage,
  AnnouncementsPage,
  CategoriesPage,
  CertificatesPage,
  CommissionsPage,
  InstructorApplicationsPage,
  NotificationsPage,
  OffersPage,
  PriceListsPage,
  RatingsPage,
  SegmentsPage,
} from "@/pages/panels";
import InstructorsPage from "@/pages/instructors";
import PlaceholderPage from "@/pages/placeholder";
import LoginPage from "@/pages/login";

const ph = (ar: string, en: string) => <PlaceholderPage titleAr={ar} titleEn={en} />;

export const ROUTER = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  {
    path: "/",
    element: (
      <RequireAdmin>
        <Shell />
      </RequireAdmin>
    ),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },

      // Home
      { path: "dashboard", element: <DashboardPage /> },
      { path: "dashboard/inbox", element: <InboxPage /> },

      // Sales
      { path: "sales/overview", element: <SalesOverviewPage /> },
      { path: "sales/orders", element: <OrdersPage /> },
      { path: "sales/payments", element: <PaymentsPage /> },
      { path: "sales/refunds", element: <RefundsPage /> },
      { path: "sales/invoices", element: <InvoicesPage /> },
      { path: "sales/coupons", element: <CouponsPage /> },
      { path: "sales/coupons/new", element: <CouponNewPage /> },
      { path: "sales/price-lists", element: <PriceListsPage /> },
      { path: "sales/offers", element: <OffersPage /> },

      // Learning
      { path: "learning/courses", element: <CoursesPage /> },
      { path: "learning/courses/new", element: <CourseNewPage /> },
      { path: "learning/packages", element: <PackagesPage /> },
      { path: "learning/categories", element: <CategoriesPage /> },
      { path: "learning/consultations", element: <ConsultationsPage /> },
      { path: "learning/instructors", element: <InstructorsPage /> },
      { path: "learning/applications", element: <InstructorApplicationsPage /> },
      { path: "learning/certificates", element: <CertificatesPage /> },
      { path: "learning/qa", element: ph("أسئلة المتدربين", "Q&A inbox") },

      // Customers
      { path: "customers", element: <CustomersPage /> },
      { path: "customers/segments", element: <SegmentsPage /> },
      { path: "customers/tickets", element: <TicketsPage /> },

      // Marketing
      { path: "marketing/affiliates", element: <AffiliatesPage /> },
      { path: "marketing/commissions", element: <CommissionsPage /> },
      { path: "marketing/payouts", element: <PayoutsPage /> },
      { path: "marketing/announcements", element: <AnnouncementsPage /> },
      { path: "marketing/banners", element: <BannersPage /> },

      // Analytics
      { path: "analytics/sales", element: <AnalyticsSalesPage /> },
      { path: "analytics/products", element: <ProductsReportPage /> },
      { path: "analytics/coupons", element: <CouponsReportPage /> },
      { path: "analytics/customers", element: <CustomersReportPage /> },
      { path: "analytics/affiliates", element: <AffiliatesReportPage /> },
      { path: "analytics/ratings", element: <RatingsPage /> },
      { path: "analytics/certificates", element: <CertificatesPage /> },

      // Settings
      { path: "settings/general", element: <GeneralSettingsPage /> },
      { path: "settings/team", element: <TeamPage /> },
      { path: "settings/integrations", element: ph("التكاملات", "Integrations") },
      { path: "settings/notifications", element: <NotificationsPage /> },
      { path: "settings/audit", element: <AuditPage /> },

      { path: "*", element: <Navigate to="/dashboard" replace /> },
    ],
  },
]);
