import { LegacyPanel } from "@/pages/legacy-panel";
import { ResourceListPage } from "@/pages/resource-list";

export function AnnouncementsPage() {
  return (
    <LegacyPanel
      titleAr="أشرطة الإعلانات"
      titleEn="Announcement bars"
      subAr="أشرطة الإعلانات من النظام القديم."
      subEn="Announcement bars from the legacy system."
      path="marketing/ads"
    />
  );
}

export function InstructorApplicationsPage() {
  return (
    <LegacyPanel
      titleAr="طلبات المدربين"
      titleEn="Instructor applications"
      subAr="طلبات انضمام المدربين."
      subEn="Instructor onboarding applications."
      path="trainers/trainerapplications"
    />
  );
}

export function CommissionsPage() {
  return (
    <LegacyPanel
      titleAr="العمولات"
      titleEn="Commissions"
      subAr="عمولات المسوقين بالعمولة."
      subEn="Affiliate commissions."
      path="affiliates/commissions"
    />
  );
}

export function AffiliatesReportPage() {
  return (
    <LegacyPanel
      titleAr="تقرير المسوقين"
      titleEn="Affiliates report"
      subAr="أداء المسوقين بالعمولة."
      subEn="Affiliate performance."
      path="affiliates/all"
    />
  );
}

export function OffersPage() {
  return (
    <LegacyPanel
      titleAr="العروض"
      titleEn="Offers"
      subAr="عروض التسويق من النظام القديم."
      subEn="Marketing offers from the legacy system."
      path="marketing/offers"
    />
  );
}

export function PriceListsPage() {
  return (
    <LegacyPanel
      titleAr="قوائم الأسعار"
      titleEn="Price lists"
      subAr="قوائم الأسعار والحملات."
      subEn="Price lists and campaigns."
      path="courses/price_lists"
    />
  );
}

export function CategoriesPage() {
  return (
    <LegacyPanel
      titleAr="التصنيفات"
      titleEn="Categories"
      subAr="تصنيفات الدورات."
      subEn="Course categories."
      path="courses/categories"
    />
  );
}

export function NotificationsPage() {
  return (
    <LegacyPanel
      titleAr="الإشعارات"
      titleEn="Notifications"
      subAr="بُرد الإشعارات الإدارية."
      subEn="Admin notification emails."
      path="settings/emailnotified"
    />
  );
}

export function CertificatesPage() {
  return (
    <ResourceListPage
      resource="certificates"
      titleAr="الشهادات"
      titleEn="Certificates"
      subAr="الشهادات المعرّفة في النظام القديم."
      subEn="Certificates defined in the legacy system."
    />
  );
}

export function RatingsPage() {
  return (
    <ResourceListPage
      resource="course_ratings"
      titleAr="التقييمات"
      titleEn="Ratings"
      subAr="تقييمات الدورات ومراجعاتها."
      subEn="Course ratings and reviews."
    />
  );
}

export function SegmentsPage() {
  return (
    <ResourceListPage
      resource="groups"
      titleAr="الشرائح"
      titleEn="Segments"
      subAr="مجموعات المستخدمين من النظام القديم."
      subEn="User groups from the legacy system."
    />
  );
}
