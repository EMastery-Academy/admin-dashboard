import { useMemo, useState } from "react";
import { AppLink } from "@/components/ui/app-link";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Icon } from "@/components/ui/icon";
import { SelectField } from "@/components/ui/select";
import { formatAmount, formatDateTime, formatNumber } from "@/lib/format";
import { useT } from "@/lib/i18n";
import { studioHref } from "@/lib/refs";
import type { CurriculumUnit, ProductPrice, ProductView, SearchProductDetail } from "@/lib/api";
import { detectQualityIssues, longDur, flattenLessons } from "../model";
import { StudentsChart } from "../components/students-chart";

interface OverviewTabProps {
  productRef: string;
  data: ProductView;
  searchDetail?: SearchProductDetail | null;
  units: CurriculumUnit[];
  onGoToContent?: () => void;
  onSelectLesson?: (lessonId: number) => void;
}

export function OverviewTab({
  productRef,
  data,
  searchDetail: _searchDetail,
  units,
  onGoToContent,
  onSelectLesson,
}: OverviewTabProps) {
  const t = useT();
  const item = data.product;
  const b2c = data.b2c;
  const isAr = t("ar", "en") === "ar";

  const allLessons = useMemo(() => flattenLessons(units), [units]);
  const issues = useMemo(
    () => detectQualityIssues(data, units, allLessons, t),
    [data, units, allLessons, t]
  );

  // Maximum section duration for relative percentage bar fills
  const maxUnitDuration = useMemo(() => {
    if (!units.length) return 1;
    const durations = units.map((u) =>
      (u.lessons || []).reduce((acc, l) => acc + (l.duration || 0), 0)
    );
    return Math.max(...durations, 1);
  }, [units]);

  const prices = b2c?.prices || [];

  return (
    <div className="cd-bento">
      {/* Product details */}
      <section className="cd-card cd-s6">
        <div className="cd-card__h">
          <h2>
            <Icon name="info" className="cd-ic--sm" />
            {t("تفاصيل المنتج", "Product details")}
          </h2>
          <AppLink
            className="ma-btn ma-btn--sm ma-btn--soft"
            to={studioHref(productRef)}
          >
            <Icon name="edit" className="cd-ic--sm" />
            <span>{t("تعديل في الاستوديو", "Edit in studio")}</span>
          </AppLink>
        </div>
        <div className="cd-card__b">
          <dl className="cd-dl">
            <div>
              <dt>{t("النوع", "Type")}</dt>
              <dd>{item.product_type === "package" ? t("حزمة", "Package") : t("دورة", "Course")}</dd>
            </div>
            <div>
              <dt>{t("المُعرّف", "ID")}</dt>
              <dd className="cd-ltr">{item.slug || item.product_id || String(item.legacy_id || "")}</dd>
            </div>
            <div>
              <dt>{t("المدرّب", "Instructor")}</dt>
              <dd>{item.instructor || "—"}</dd>
            </div>
            <div>
              <dt>{t("السعر", "Price")}</dt>
              <dd>
                {item.price != null && item.price > 0 ? (
                  formatAmount(item.price, item.price_currency ?? "USD")
                ) : (
                  <span className="cd-chip cd-chip--warn cd-chip--plain" style={{ height: 22, fontSize: 12 }}>
                    {t("مجانية", "Free")}
                  </span>
                )}
              </dd>
            </div>
            <div>
              <dt>{t("سعر المقارنة", "Compare-at price")}</dt>
              <dd>
                {item.compare_at_price != null ? (
                  formatAmount(item.compare_at_price, item.price_currency ?? "USD")
                ) : (
                  <span className="cd-unset">{t("غير محدد", "Not set")}</span>
                )}
              </dd>
            </div>
            <div>
              <dt>{t("الطلبات المدفوعة", "Paid orders")}</dt>
              <dd>{formatNumber(item.paid_orders || 0)}</dd>
            </div>
            <div>
              <dt>{t("تاريخ الإنشاء", "Created at")}</dt>
              <dd>{item.created_at ? formatDateTime(item.created_at) : "—"}</dd>
            </div>
            <div>
              <dt>{t("آخر تحديث", "Last updated")}</dt>
              <dd>{item.updated_at ? formatDateTime(item.updated_at) : "—"}</dd>
            </div>
          </dl>
        </div>
      </section>

      {/* Access and Categories */}
      <section className="cd-card cd-s6">
        <div className="cd-card__h">
          <h2>
            <Icon name="settings" className="cd-ic--sm" />
            {t("الوصول والتصنيفات", "Access & categories")}
          </h2>
        </div>
        <div className="cd-card__b">
          <dl className="cd-dl">
            <div>
              <dt>{t("الوصف القصير", "Short description")}</dt>
              <dd>
                {b2c?.short_description ? (
                  b2c.short_description
                ) : (
                  <>
                    <span className="cd-unset">{t("غير محدد", "Not set")}</span>
                    <AppLink className="cd-link" to={studioHref(productRef)}>
                      {t("إضافة", "Add")}
                    </AppLink>
                  </>
                )}
              </dd>
            </div>
            <div>
              <dt>{t("أيام الوصول المتاحة", "Access days")}</dt>
              <dd>
                {b2c?.access_duration_days ? (
                  `${b2c.access_duration_days} ${t("يوم", "days")}`
                ) : (
                  <span className="cd-unset">{t("غير محدود", "Lifetime / Unlimited")}</span>
                )}
              </dd>
            </div>
            <div>
              <dt>{t("تمديد الوصول", "Access extension")}</dt>
              <dd>
                {b2c?.extension_enabled
                  ? t("متاح للمشتركين", "Enabled")
                  : t("غير مفعّل", "Disabled")}
              </dd>
            </div>
            <div>
              <dt>{t("التصنيف الأساسي", "Primary category")}</dt>
              <dd>
                <span className="ma-tag ma-tag--soft">
                  {item.category || b2c?.categories?.[0] || t("غير مصنف", "Uncategorized")}
                </span>
              </dd>
            </div>
          </dl>
        </div>
      </section>

      {/* Real Students Acquisition Chart */}
      <div className="cd-s12" style={{ gridColumn: "1 / -1" }}>
        <StudentsChart productRef={productRef} />
      </div>

      {/* Timeline */}
      <section className="cd-card cd-s5">
        <div className="cd-card__h">
          <h2>
            <Icon name="clock" className="cd-ic--sm" />
            {t("الجدول الزمني", "Timeline")}
          </h2>
        </div>
        <div className="cd-card__b">
          <ul className="cd-tl">
            <li>
              <span className="cd-tl__dot" style={{ "--c": "var(--sky)" } as React.CSSProperties} />
              <div>
                {t("تم إنشاء المنتج", "Product created")}
                <small>{item.updated_at ? formatDateTime(item.updated_at) : "—"}</small>
              </div>
            </li>
            <li>
              <span className="cd-tl__dot" style={{ "--c": "var(--yellow)" } as React.CSSProperties} />
              <div>
                {t("آخر تحديث لبيانات المنتج", "Last content update")}
                <small>{item.updated_at ? formatDateTime(item.updated_at) : "—"}</small>
              </div>
            </li>
            <li>
              <span
                className="cd-tl__dot"
                style={{
                  "--c": item.status === "published" ? "var(--green)" : "var(--pink)",
                } as React.CSSProperties}
              />
              <div>
                {item.status === "published"
                  ? t("منشور في الكتالوج العام", "Published in catalog")
                  : t("مسودة داخلية", "Saved as draft")}
                <small>B2C</small>
              </div>
            </li>
          </ul>
        </div>
      </section>

      {/* Curriculum summary bars */}
      <section className="cd-card cd-s7">
        <div className="cd-card__h">
          <h2>
            <Icon name="layers" className="cd-ic--sm" />
            {t("ملخص المنهج الدراسي", "Curriculum summary")}
          </h2>
          {onGoToContent && (
            <button
              type="button"
              className="cd-link"
              onClick={onGoToContent}
            >
              {t("عرض المحتوى الكامل", "View all content")}
            </button>
          )}
        </div>
        <div className="cd-card__b">
          {!units.length ? (
            <div className="cd-empty">
              <Icon name="layers" />
              <strong>{t("لا توجد وحدات أو دروس بعد", "No sections or lessons yet")}</strong>
              <span>{t("أضف وحدات ودروس عبر تبويب المحتوى أو الاستوديو", "Add sections and lessons via Content tab or Studio")}</span>
            </div>
          ) : (
            <div className="cd-bars">
              {units.map((unit) => {
                const uDur = (unit.lessons || []).reduce(
                  (sum, l) => sum + (l.duration || 0),
                  0
                );
                const pct = Math.round((uDur / maxUnitDuration) * 100);
                return (
                  <div key={unit.id} className="cd-bar">
                    <span className="cd-bar__t">{unit.name}</span>
                    <span className="cd-bar__track">
                      <span className="cd-bar__fill" style={{ width: `${pct}%` }} />
                    </span>
                    <span className="cd-bar__v">
                      {unit.lessons?.length || 0} {t("دروس", "lessons")} · {longDur(uDur, isAr)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Quality review */}
      <section className="cd-card cd-s5">
        <div className="cd-card__h">
          <h2>
            <Icon name="alert" className="cd-ic--sm" />
            {t("فحص الجودة", "Quality review")}
          </h2>
          <span
            className={`cd-chip cd-num ${
              issues.length ? "cd-chip--warn" : "cd-chip--ok"
            } cd-chip--plain`}
          >
            {issues.length}
          </span>
        </div>
        <div className="cd-card__b">
          {issues.length === 0 ? (
            <div className="cd-issue cd-issue--ok">
              <span className="cd-issue__ic">
                <Icon name="check" className="cd-ic--sm" />
              </span>
              <div className="cd-issue__t">
                {t("جميع المعايير ممتازة! لا توجد ملاحظات.", "All good! No quality issues detected.")}
              </div>
            </div>
          ) : (
            issues.slice(0, 5).map((iss, idx) => (
              <div
                key={idx}
                className={`cd-issue ${iss.severity === "bad" ? "cd-issue--bad" : ""}`}
              >
                <span className="cd-issue__ic">
                  <Icon name={iss.icon} className="cd-ic--sm" />
                </span>
                <div className="cd-issue__t">
                  {iss.title}
                  {iss.subtitle && <small>{iss.subtitle}</small>}
                </div>
                {iss.lessonId ? (
                  <button
                    type="button"
                    className="ma-btn ma-btn--sm ma-btn--soft"
                    onClick={() => {
                      if (onSelectLesson) onSelectLesson(iss.lessonId!);
                      if (onGoToContent) onGoToContent();
                    }}
                  >
                    {t("مراجعة", "Review")}
                  </button>
                ) : (
                  <AppLink
                    className="ma-btn ma-btn--sm ma-btn--soft"
                    to={studioHref(productRef)}
                  >
                    {t("مراجعة", "Review")}
                  </AppLink>
                )}
              </div>
            ))
          )}
        </div>
      </section>

      {/* Prices */}
      <section className="cd-card cd-s7">
        <div className="cd-card__h">
          <h2>
            <Icon name="tag" className="cd-ic--sm" />
            {t("الأسعار", "Prices")}
          </h2>
        </div>
        <div className="cd-card__b">
          <PricesList prices={prices} />
        </div>
      </section>
    </div>
  );
}

function PricesList({ prices }: { prices: ProductPrice[] }) {
  const t = useT();
  const [currencyFilter, setCurrencyFilter] = useState("all");

  const currencies = useMemo(
    () => Array.from(new Set(prices.map((p) => p.currency))).filter(Boolean),
    [prices]
  );

  const filtered = useMemo(() => {
    if (currencyFilter === "all") return prices;
    return prices.filter((p) => p.currency === currencyFilter);
  }, [prices, currencyFilter]);

  const columns: Column<ProductPrice>[] = [
    { key: "currency", header: t("العملة", "Currency"), cell: (r) => r.currency },
    { key: "country", header: t("الدولة", "Country"), cell: (r) => r.country_code || "—" },
    {
      key: "amount",
      header: t("السعر", "Amount"),
      align: "end",
      cell: (r) => <span className="cd-num">{formatAmount(r.amount, r.currency)}</span>,
    },
    {
      key: "compare",
      header: t("سعر المقارنة", "Compare at"),
      align: "end",
      cell: (r) =>
        r.compare_at_amount != null ? (
          <span className="cd-num">{formatAmount(r.compare_at_amount, r.currency)}</span>
        ) : (
          "—"
        ),
    },
    { key: "from", header: t("صالح من", "Valid from"), cell: (r) => formatDateTime(r.valid_from) },
  ];

  if (!prices.length) {
    return (
      <div className="cd-empty">
        <Icon name="tag" />
        <strong>{t("لا توجد خطط أسعار إضافية", "No additional price plans")}</strong>
        <span>{t("تعتمد الدورة على السعر الأساسي المعين أعلاه.", "Course relies on base price specified above.")}</span>
      </div>
    );
  }

  return (
    <div>
      {currencies.length > 1 && (
        <div style={{ marginBlockEnd: 12 }}>
          <SelectField
            label={t("العملة", "Currency")}
            value={currencyFilter}
            onChange={setCurrencyFilter}
            options={[
              { value: "all", label: t("كل العملات", "All currencies") },
              ...currencies.map((c) => ({ value: c, label: c })),
            ]}
          />
        </div>
      )}
      <DataTable rows={filtered} columns={columns} empty={t("لا أسعار مطابقة.", "No matching prices.")} />
    </div>
  );
}
