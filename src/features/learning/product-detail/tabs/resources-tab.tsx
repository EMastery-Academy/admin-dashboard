import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { studioQueries, type ProductView, type SearchProductDetail } from "@/lib/api";
import { useT } from "@/lib/i18n";
import { studioHref } from "@/lib/refs";
import { AppLink } from "@/components/ui/app-link";
import { RichHtml } from "@/components/ui/rich-html";
import { formatNumber } from "@/lib/format";
import { Icon } from "@/components/ui/icon";
import { cleanHtmlText } from "../model";

interface ResourcesTabProps {
  productRef: string;
  data: ProductView;
  searchDetail?: SearchProductDetail | null;
}

export function ResourcesTab({ productRef, data, searchDetail }: ResourcesTabProps) {
  const t = useT();
  const [descDismissed, setDescDismissed] = useState(false);

  const assetsQuery = useQuery(studioQueries.assets(productRef));
  const assets = assetsQuery.data?.items ?? [];

  const item = data.product;
  const rawDesc =
    data.legacy?.description ||
    (searchDetail as { description?: string })?.description ||
    data.b2c?.short_description ||
    "";
  const cleanedDesc = cleanHtmlText(rawDesc);
  const hasRawHtml = Boolean(rawDesc && rawDesc !== cleanedDesc && /<[a-z][\s\S]*>/i.test(rawDesc));

  const mediaItems: Array<{ kind: string; name: string; url?: string | null; meta?: string }> = [];
  if (item.image) {
    mediaItems.push({ kind: "cover", name: t("غلاف الدورة الأساسي", "Main cover image"), url: item.image, meta: "Banner" });
  }
  const detailObj = searchDetail as Record<string, unknown> | undefined;
  if (detailObj?.square_image || detailObj?.squareImage) {
    mediaItems.push({
      kind: "square",
      name: t("الصورة المربعة", "Square cover"),
      url: (detailObj.square_image ?? detailObj.squareImage) as string,
      meta: "1:1",
    });
  }

  const formatFileSize = (bytes?: number | null) => {
    if (!bytes) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="cd-bento">
      {/* Description */}
      <section className="cd-card cd-s7">
        <div className="cd-card__h">
          <h2>
            <Icon name="file" />
            {t("الوصف التعريفي", "Description")}
          </h2>
          <AppLink className="ma-btn ma-btn--sm ma-btn--soft" to={studioHref(productRef)}>
            <Icon name="edit" className="cd-ic--sm" />
            {t("تعديل في الاستوديو", "Edit in Studio")}
          </AppLink>
        </div>
        <div className="cd-card__b">
          {rawDesc ? (
            <div className="cd-richtext">
              <RichHtml html={rawDesc} />
            </div>
          ) : (
            <span className="cd-unset">{t("لم يتم تحديد وصف للدورة", "No description provided")}</span>
          )}

          {hasRawHtml && !descDismissed && (
            <div className="ma-alert ma-alert--warning" style={{ marginBlockStart: 16 }}>
              <Icon name="alert" />
              <div style={{ flex: 1 }}>
                <p className="ma-alert__title">
                  {t(
                    "يحتوي الوصف على وسوم HTML من النظام القديم",
                    "Description contains raw legacy HTML tags"
                  )}
                </p>
                <div
                  className="cd-code"
                  style={{
                    marginBlockStart: 8,
                    maxHeight: 120,
                    overflow: "auto",
                    background: "rgba(0,0,0,0.06)",
                    fontSize: 12,
                  }}
                >
                  {rawDesc}
                </div>
                <div style={{ marginBlockStart: 8 }}>
                  <button
                    type="button"
                    className="ma-btn ma-btn--sm ma-btn--soft"
                    onClick={() => setDescDismissed(true)}
                  >
                    {t("إخفاء التنبيه", "Dismiss")}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Legacy System Mapping */}
      <section className="cd-card cd-s5">
        <div className="cd-card__h">
          <h2>
            <Icon name="link" />
            {t("ربط النظام القديم", "Legacy System")}
          </h2>
        </div>
        <div className="cd-card__b">
          <dl className="cd-dl">
            <div>
              <dt>{t("المعرف في النظام القديم", "Legacy ID")}</dt>
              <dd className="cd-ltr">{data.links.legacy_id ?? "—"}</dd>
            </div>
            <div>
              <dt>{t("نوع العنصر القديم", "Legacy kind")}</dt>
              <dd className="cd-ltr">{data.links.legacy_kind ?? "—"}</dd>
            </div>
            <div>
              <dt>{t("المرجع الموحد", "Unified ref")}</dt>
              <dd className="cd-ltr">{data.product.ref}</dd>
            </div>
            <div>
              <dt>{t("المصدر الحالي", "Primary source")}</dt>
              <dd className="cd-ltr">{data.product.source}</dd>
            </div>
          </dl>
          {data.links.legacy_id && (
            <div style={{ marginBlockStart: 12 }}>
              <span className="cd-chip cd-chip--plain cd-chip--b2c">
                {t("مرتبط مع منصة Legacy", "Linked with Legacy Platform")}
              </span>
            </div>
          )}
        </div>
      </section>

      {/* Media Gallery */}
      <section className="cd-card cd-s7">
        <div className="cd-card__h">
          <h2>
            <Icon name="image" />
            {t("الوسائط والصور", "Media")}
          </h2>
          <span className="cd-chip cd-chip--plain cd-num">{mediaItems.length}</span>
        </div>
        <div className="cd-card__b">
          {mediaItems.length === 0 ? (
            <div className="cd-empty">
              <Icon name="image" />
              <strong>{t("لا توجد صور مرفوعة بعد", "No media files uploaded yet")}</strong>
            </div>
          ) : (
            <div className="cd-gallery">
              {mediaItems.map((m, idx) => (
                <div key={idx} className="cd-tile">
                  <div className="cd-tile__m" style={{ overflow: "hidden" }}>
                    {m.url ? (
                      <img
                        src={m.url}
                        alt={m.name}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      <Icon name="image" />
                    )}
                    {m.kind === "cover" && (
                      <span className="ma-tag ma-tag--ink" style={{ position: "absolute", top: 8, right: 8 }}>
                        {t("غلاف", "Cover")}
                      </span>
                    )}
                  </div>
                  <div className="cd-tile__f">
                    <span>{m.name}</span>
                    <span className="cd-muted cd-ltr">{m.meta || ""}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div style={{ marginBlockStart: 12 }}>
            <AppLink className="cd-drop" to={studioHref(productRef)}>
              <Icon name="upload" />
              {t("إدارة الوسائط في الاستوديو", "Manage media in Studio")}
            </AppLink>
          </div>
        </div>
      </section>

      {/* Attachments / Studio Assets */}
      <section className="cd-card cd-s5">
        <div className="cd-card__h">
          <h2>
            <Icon name="file" />
            {t("الملفات والمرفقات", "Attachments")}
          </h2>
          <span className="cd-chip cd-chip--plain cd-num">{assets.length}</span>
        </div>
        <div className="cd-card__b">
          {assets.length === 0 ? (
            <div className="cd-empty" style={{ padding: "16px 0" }}>
              <Icon name="file" />
              <strong style={{ fontSize: 13 }}>{t("لا توجد ملفات مرفقة", "No attachments")}</strong>
            </div>
          ) : (
            <div className="cd-files">
              {assets.map((asset) => (
                <div key={asset.asset_id} className="cd-file">
                  <Icon name="file" />
                  <span className="cd-file__t">{asset.filename || asset.asset_id}</span>
                  <span className="cd-muted cd-ltr" style={{ fontSize: 12 }}>
                    {formatFileSize(asset.size_bytes)}
                  </span>
                </div>
              ))}
            </div>
          )}
          <div style={{ marginBlockStart: 12 }}>
            <AppLink className="cd-drop" to={studioHref(productRef)}>
              <Icon name="upload" />
              {t("رفع ملفات عبر الاستوديو", "Upload files via Studio")}
            </AppLink>
          </div>
        </div>
      </section>
    </div>
  );
}
