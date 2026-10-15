import { useEffect, useState } from "react";
import { useT } from "@/lib/i18n";

export type DetailTab =
  | "overview"
  | "content"
  | "resources"
  | "instructors"
  | "orders"
  | "consultation"
  | "related"
  | "legacy";

export type DetailTabId = DetailTab;

export interface DetailTabbarProps {
  activeTab: DetailTab;
  onTabChange?: (tab: DetailTab) => void;
  onSelectTab?: (tab: DetailTab) => void;
  title?: string;
  productTitle?: string;
  published?: boolean;
  isPublished?: boolean;
  onPublishClick?: () => void;
  onTogglePublish?: () => void;
  counts: {
    content?: number;
    instructors?: number;
    orders?: number;
    related?: number;
    legacy?: number;
  };
  hasConsultation?: boolean;
  hasLegacy?: boolean;
}

export function DetailTabbar({
  activeTab,
  onTabChange,
  onSelectTab,
  title,
  productTitle,
  published,
  isPublished,
  onPublishClick,
  onTogglePublish,
  counts,
  hasConsultation,
  hasLegacy,
}: DetailTabbarProps) {
  const t = useT();
  const [isStuck, setIsStuck] = useState(false);

  const displayTitle = title || productTitle || "";
  const pub = isPublished ?? published ?? false;
  const handlePublish = onTogglePublish || onPublishClick || (() => {});
  const handleSelect = onSelectTab || onTabChange || (() => {});

  useEffect(() => {
    const handleScroll = () => {
      setIsStuck(window.scrollY > 220);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const tabs: { id: DetailTab; labelAr: string; labelEn: string; count?: number }[] = [
    { id: "overview", labelAr: "نظرة عامة", labelEn: "Overview" },
    { id: "content", labelAr: "محتوى الدورة", labelEn: "Course content", count: counts.content },
    { id: "resources", labelAr: "المصادر والمحتوى", labelEn: "Resources" },
    { id: "instructors", labelAr: "المدربون", labelEn: "Instructors", count: counts.instructors },
    { id: "orders", labelAr: "الطلبات والمبيعات", labelEn: "Orders & Sales", count: counts.orders },
    ...(hasConsultation ? [{ id: "consultation" as DetailTab, labelAr: "الاستشارة", labelEn: "Consultation" }] : []),
    { id: "related", labelAr: "ذات صلة", labelEn: "Related", count: counts.related },
    ...(hasLegacy ? [{ id: "legacy" as DetailTab, labelAr: "محتوى النظام القديم", labelEn: "Legacy content", count: counts.legacy }] : []),
  ];

  return (
    <div className={`cd-tabbar ${isStuck ? "is-stuck" : ""}`}>
      <div className="cd-tabs" role="tablist" aria-label={displayTitle}>
        {tabs.map((tab) => {
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              className="cd-tab"
              aria-selected={isSelected}
              onClick={() => handleSelect(tab.id)}
            >
              <span>{t(tab.labelAr, tab.labelEn)}</span>
              {tab.count != null && tab.count > 0 && <span className="cd-tab__n">{tab.count}</span>}
            </button>
          );
        })}
      </div>

      <div className="cd-mini">
        <span className="cd-mini__t">{displayTitle}</span>
        <button
          type="button"
          className="ma-btn ma-btn--sm ma-btn--soft"
          onClick={handlePublish}
        >
          {pub ? t("إلغاء النشر", "Unpublish") : t("نشر", "Publish")}
        </button>
      </div>
    </div>
  );
}

export { DetailTabbar as DetailTabBar };
