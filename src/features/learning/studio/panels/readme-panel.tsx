import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { Alert } from "@/components/ui/kit";
import { putProductReadme, studioKeys, studioQueries } from "@/lib/api";
import { useT } from "@/lib/i18n";

const TEMPLATE = `## المقدمة

نص تعريفي عن المنتج.

## المحاور الرئيسية

- المحور الأول
- المحور الثاني

## الأهداف

- الهدف الأول
- الهدف الثاني

## الفئة المستهدفة

- الفئة الأولى
`;

/**
 * Markdown README of the product (replaces the HTML "about" sections). Text edits stream to the live
 * preview through `onChange`; "Save" writes `b2c.product_readme`, which the storefront reads.
 */
export function ReadmePanel({
  productRef,
  editable,
  onChange,
}: {
  productRef: string;
  editable: boolean;
  onChange: (markdown: string) => void;
}) {
  const t = useT();
  const queryClient = useQueryClient();
  const query = useQuery(studioQueries.readme(productRef));
  const [text, setText] = useState<string | null>(null);
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const saved = query.data?.markdown ?? "";
  const value = text ?? saved;

  useEffect(() => {
    if (query.data) onChange(text ?? query.data.markdown);
  }, [query.data, text, onChange]);

  const save = async () => {
    setState("saving");
    setError(null);
    try {
      const result = await putProductReadme(productRef, value);
      queryClient.setQueryData(studioKeys.readme(productRef), result);
      setText(null);
      setState("saved");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setState("error");
    }
  };

  if (query.isLoading) return <p role="status">{t("جارٍ التحميل…", "Loading…")}</p>;
  if (query.isError) return <Alert kind="warning" title={t("تعذّر تحميل README", "Couldn't load the README")}>{String(query.error)}</Alert>;

  const dirty = value !== saved;
  return (
    <div style={{ display: "grid", gap: "var(--space-3)" }}>
      {query.data?.source === "sections" ? (
        <Alert kind="info" title={t("مُولَّد من الأقسام القديمة", "Generated from the legacy sections")}>
          {t("لم يُحفظ README بعد؛ احفظه ليصبح مصدر محتوى الصفحة.", "No README is saved yet; save it to make it the page's content source.")}
        </Alert>
      ) : null}
      {state === "error" ? <Alert kind="warning" title={t("تعذّر الحفظ", "Couldn't save")}>{error}</Alert> : null}
      <textarea
        id="product-readme-editor"
        value={value}
        readOnly={!editable}
        dir="auto"
        rows={26}
        spellCheck={false}
        aria-label="README (Markdown)"
        placeholder={TEMPLATE}
        onChange={(e) => {
          setText(e.target.value);
          setState("idle");
        }}
        style={{ width: "100%", fontFamily: "var(--font-mono, monospace)", fontSize: "13px", lineHeight: 1.7, padding: "var(--space-3)" }}
      />
      <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
        {editable ? (
          <>
            <button type="button" className="ma-btn ma-btn--primary" disabled={!dirty || state === "saving"} onClick={save}>
              {state === "saving" ? t("جارٍ الحفظ…", "Saving…") : t("حفظ README", "Save README")}
            </button>
            {!value ? (
              <button type="button" className="ma-btn" onClick={() => setText(TEMPLATE)}>
                {t("ابدأ بقالب", "Start from a template")}
              </button>
            ) : null}
          </>
        ) : null}
        {state === "saved" ? <span role="status">{t("تم الحفظ", "Saved")}</span> : null}
        <span className="ma-studio__hint" style={{ margin: 0 }}>
          {t("Markdown فقط: # عناوين، - قوائم، **غامق**، [رابط](https://…). يُزال أي HTML.", "Markdown only: # headings, - lists, **bold**, [link](https://…). Any HTML is stripped.")}
        </span>
      </div>
    </div>
  );
}
