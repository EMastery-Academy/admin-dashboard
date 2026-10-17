import { useT } from "@/lib/i18n";
import { formatAmount } from "@/lib/format";
import { AppLink } from "@/components/ui/app-link";
import { Card, Dl } from "@/components/ui/kit";
import type { ProductView } from "@/lib/api";

/**
 * A consultation product in B2C (its price, currency prices and access). Booking sessions, availability and
 * revenue live on the legacy consultation service, reached from the Consultations section.
 */
export function ConsultationTab({ data }: { data: ProductView }) {
  const t = useT();
  const b2c = data.b2c;
  const item = data.product;
  const currency = item.price_currency ?? "USD";

  return (
    <div className="ma-stack" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Card title={t("الاستشارة", "Consultation")}>
        <Dl
          rows={[
            [t("الحالة", "Status"), item.status],
            [t("السعر", "Price"), <span key="p" className="ma-num">{item.price != null ? formatAmount(item.price, currency) : "—"}</span>],
            [t("الرابط", "Slug"), item.slug],
            [t("مدة الوصول (أيام)", "Access days"), b2c?.access_duration_days != null ? String(b2c.access_duration_days) : "—"],
          ]}
        />
        {b2c?.short_description ? <p className="ma-muted" style={{ marginTop: 12 }}>{b2c.short_description}</p> : null}
      </Card>

      {b2c?.prices?.length ? (
        <Card title={t("الأسعار حسب العملة", "Prices by currency")} className="ma-section-gap">
          <Dl
            rows={b2c.prices.map((price): [string, string] => [
              `${price.currency}${price.country_code ? ` · ${price.country_code}` : ""}`,
              formatAmount(price.amount, price.currency),
            ])}
          />
        </Card>
      ) : null}

      <Card title={t("جلسات الاستشارة والمواعيد", "Sessions & availability")} className="ma-section-gap">
        <p className="ma-muted">
          {t(
            "تُدار مواعيد الجلسات وتوفر الخبير والإيرادات في قسم الاستشارات (النظام القديم).",
            "Session bookings, expert availability and revenue are managed in the Consultations section (legacy).",
          )}
        </p>
        <div style={{ marginTop: 12 }}>
          <AppLink className="ma-btn ma-btn--soft" to="/learning/consultations">
            {t("فتح الاستشارات", "Open consultations")}
          </AppLink>
        </div>
      </Card>
    </div>
  );
}
