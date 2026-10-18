import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { productKeys, setProductPrice, updateProduct, type ProductView } from "@/lib/api";
import { useT } from "@/lib/i18n";
import { toast } from "@/components/ui/toast";
import { Button, Card, ErrorAlert, Field, FormActions } from "@/components/ui/kit";
import {
  generalInfoPayload,
  GeneralInfoCard,
  isGeneralInfoValid,
  isPriceRequiredValid,
  optional,
  parsePrice,
  PRICE_CURRENCY,
  PriceField,
  type GeneralInfo,
} from "@/features/learning/product-form";

/**
 * Edit the details a product is created without: short description, general info (hours, level,
 * language, access, CPD) and its USD price. Details go through `PATCH /admin/catalog/products/{ref}`,
 * the price through `PUT /admin/pricing/products/{id}` (the old price is kept as history).
 */
export function ProductDetailsEditor({ productRef, data }: { productRef: string; data: ProductView }) {
  const t = useT();
  const queryClient = useQueryClient();
  const b2c = data.b2c;
  const productId = data.links.b2c_product_id;

  const activePrice = b2c?.prices.find((price) => !price.valid_to && !price.country_code);
  const [shortDescription, setShortDescription] = useState(b2c?.short_description ?? "");
  const [price, setPrice] = useState(activePrice ? String(activePrice.amount) : "");
  const [general, setGeneral] = useState<GeneralInfo>({
    durationHours: b2c?.duration_hours != null ? String(b2c.duration_hours) : "",
    level: (b2c?.level as GeneralInfo["level"] | null | undefined) ?? "",
    language: b2c?.language ?? "ar",
    lifetimeAccess: b2c?.access_duration_days == null,
    accessDurationDays: String(b2c?.access_duration_days ?? 365),
    cpdEligible: Boolean(b2c?.cpd_eligible),
  });

  const priceChanged = activePrice == null || parsePrice(price) !== activePrice.amount;

  const save = useMutation({
    mutationFn: async () => {
      await updateProduct(productRef, {
        short_description: optional(shortDescription),
        ...generalInfoPayload(general),
      });
      const amount = parsePrice(price);
      if (productId && amount !== null && priceChanged) {
        await setProductPrice(productId, { amount, currency_code: PRICE_CURRENCY });
      }
    },
    onSuccess: () => {
      toast.success(t("تم حفظ التفاصيل", "Details saved"));
      queryClient.invalidateQueries({ queryKey: productKeys.detail(productRef) });
      queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
  });

  if (!b2c || !productId) return null;
  const invalid = !isGeneralInfoValid(general) || !isPriceRequiredValid(price);

  return (
    <form
      className="ma-form"
      onSubmit={(event) => {
        event.preventDefault();
        if (!invalid) save.mutate();
      }}
    >
      <Card title={t("الوصف والسعر", "Summary & price")}>
        <div className="ma-form">
          <Field
            id="details-short"
            label={t("وصف مختصر", "Short description")}
            value={shortDescription}
            onChange={setShortDescription}
          />
          <PriceField
            id="details-price"
            value={price}
            onChange={setPrice}
            invalid={price.trim() !== "" && !isPriceRequiredValid(price)}
          />
        </div>
      </Card>
      <GeneralInfoCard
        idPrefix="details"
        info={general}
        onChange={(patch) => setGeneral((prev) => ({ ...prev, ...patch }))}
      />
      <ErrorAlert error={save.error} title={t("تعذّر حفظ التفاصيل", "Couldn't save the details")} />
      <FormActions>
        <Button
          type="submit"
          kind="primary"
          icon="check"
          label={save.isPending ? t("جارٍ الحفظ…", "Saving…") : t("حفظ التفاصيل", "Save details")}
          disabled={save.isPending || invalid}
        />
      </FormActions>
    </form>
  );
}
