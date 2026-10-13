import { useT } from "@/lib/i18n";
import { PageHead } from "@/components/ui/kit";
import { LegacyPanel } from "@/pages/legacy-panel";

export default function BannersPage() {
  const t = useT();
  return (
    <>
      <PageHead title={t("البانرات والسلايدر", "Banners & sliders")} sub={t("محتوى الواجهة الأمامية من النظام القديم.", "Storefront media from the legacy system.")} />
      <div className="ma-section-gap">
        <LegacyPanel
          hideHead
          panelTitle={t("البانرات", "Banners")}
          titleAr="البانرات"
          titleEn="Banners"
          subAr=""
          subEn=""
          path="v2/banners"
        />
      </div>
      <div className="ma-section-gap">
        <LegacyPanel
          hideHead
          panelTitle={t("السلايدر", "Sliders")}
          titleAr="السلايدر"
          titleEn="Sliders"
          subAr=""
          subEn=""
          path="v2/sliders"
        />
      </div>
    </>
  );
}
