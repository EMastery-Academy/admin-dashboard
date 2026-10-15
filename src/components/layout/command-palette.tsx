/* oxlint-disable react/only-export-components, react/set-state-in-effect, react-hooks/exhaustive-deps */
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { create } from "zustand";

import { flatItems, navigation } from "@/config/navigation";
import { search, searchKeys, searchOptions } from "@/lib/api";
import { translate, useLang } from "@/lib/i18n";
import { can } from "@/lib/permissions";
import { Icon } from "@/components/ui/icon";
import { SearchIcon, type AnimatedIconHandle } from "@/components/icons/animated";

type PaletteState = { open: boolean; setOpen: (open: boolean) => void };

export const usePaletteStore = create<PaletteState>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
}));

export function useCommandPalette() {
  const open = usePaletteStore((state) => state.open);
  const setOpen = usePaletteStore((state) => state.setOpen);
  return { open, show: () => setOpen(true), close: () => setOpen(false) };
}

type Result = { label: string; path: string; href: string; icon: string };

const ACTIONS: { ar: string; en: string; href: string; permission: string; icon: string; hint?: { ar: string; en: string } }[] = [
  { ar: "إنشاء دورة", en: "Create course", href: "/learning/courses/new", permission: "courses.create", icon: "plus" },
  { ar: "إنشاء كوبون", en: "Create coupon", href: "/sales/coupons/new", permission: "coupons.create", icon: "plus" },
  { ar: "إصدار استرداد لطلب", en: "Issue a refund", href: "/sales/orders", permission: "refunds.create", icon: "refund", hint: { ar: "اختر الطلب ثم «استرداد»", en: "Pick the order, then Refund" } },
  { ar: "الرد على أسئلة المتدربين", en: "Answer trainee questions", href: "/learning/qa", permission: "qa.read", icon: "message" },
  { ar: "مراجعة طلبات الصرف", en: "Review payout requests", href: "/marketing/payouts", permission: "affiliates.read", icon: "card" },
  { ar: "دعوة عضو فريق", en: "Invite a team member", href: "/settings/team", permission: "settings.read", icon: "users" },
];

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const lang = useLang();
  const [query, setQuery] = useState("");
  const [sel, setSel] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchIcon = useRef<AnimatedIconHandle>(null);
  const t = (ar: string, en: string) => translate(lang, ar, en);

  const term = query.trim();
  const catalogSearch = useQuery({
    queryKey: searchKeys.results({ q: term, limit: 6 }),
    queryFn: () => search({ q: term, limit: 6 }),
    enabled: open && term.length >= 2,
  });
  const instructorOptions = useQuery({
    queryKey: searchKeys.options(),
    queryFn: () => searchOptions(),
    enabled: open && term.length >= 2,
  });

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const match = (...texts: string[]) => !q || texts.some((value) => value.toLowerCase().includes(q));
    const pages = flatItems(navigation)
      .filter((item) => match(item.title.ar, item.title.en, item.module.title.ar, item.module.title.en))
      .slice(0, q ? 8 : 6)
      .map<Result>((item) => ({
        label: translate(lang, item.title.ar, item.title.en),
        path: `${translate(lang, item.module.title.ar, item.module.title.en)} / ${translate(lang, item.section.title.ar, item.section.title.en)}`,
        href: item.href,
        icon: item.module.icon,
      }));
    const actions = ACTIONS.filter((a) => can(a.permission) && match(a.ar, a.en)).map<Result>((a) => ({
      label: translate(lang, a.ar, a.en),
      path: a.hint ? translate(lang, a.hint.ar, a.hint.en) : "",
      href: a.href,
      icon: a.icon,
    }));
    const products = (catalogSearch.data?.items ?? []).map<Result>((item) => ({
      label: item.title ?? item.slug ?? item.id.slice(0, 8),
      path: [item.product_type, item.status].filter(Boolean).join(" · "),
      href: `/learning/catalog/${item.id}`,
      icon: "book",
    }));
    const instructors = (instructorOptions.data?.instructors ?? [])
      .filter((row) => q.length >= 2 && row.display_name.toLowerCase().includes(q))
      .slice(0, 4)
      .map<Result>((row) => ({
        label: row.display_name,
        path: row.specialized ?? translate(lang, "مدرّب", "Instructor"),
        href: `/learning/instructors/${row.legacy_trainer_id}`,
        icon: "user",
      }));
    const out: [string, Result[]][] = [];
    if (products.length) out.push([t("المنتجات", "Products"), products]);
    if (instructors.length) out.push([t("المدرّبون", "Instructors"), instructors]);
    if (pages.length) out.push([t("الصفحات", "Pages"), pages]);
    if (actions.length) out.push([t("إجراءات", "Actions"), actions]);
    return out;
  }, [query, lang, catalogSearch.data, instructorOptions.data]);

  const flat = useMemo(() => groups.flatMap(([, items]) => items), [groups]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setSel(0);
      // Focus after paint.
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => {
    setSel((value) => Math.min(value, Math.max(0, flat.length - 1)));
  }, [flat.length]);

  if (!open) return null;

  const go = (href: string) => {
    onClose();
    navigate(href);
  };

  return (
    <div className="ma-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="ma-palette" role="dialog" aria-modal="true" aria-label={t("البحث الشامل", "Command search")}>
        <div className="ma-palette__search">
          <SearchIcon ref={searchIcon} size={20} className="ma-palette__icon" />
          <input
            ref={inputRef}
            className="ma-palette__input"
            type="text"
            role="combobox"
            aria-expanded="true"
            aria-controls="pal-list"
            aria-autocomplete="list"
            aria-label={t("البحث الشامل", "Command search")}
            onFocus={() => searchIcon.current?.startAnimation()}
            onBlur={() => searchIcon.current?.stopAnimation()}
            placeholder={t("اكتب صفحة أو إجراء أو رقم طلب أو اسم عميل…", "Type a page, action, order number or customer…")}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setSel(0);
            }}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown") {
                setSel((v) => (v + 1) % Math.max(flat.length, 1));
                event.preventDefault();
              } else if (event.key === "ArrowUp") {
                setSel((v) => (v - 1 + flat.length) % Math.max(flat.length, 1));
                event.preventDefault();
              } else if (event.key === "Enter" && flat[sel]) {
                go(flat[sel].href);
              } else if (event.key === "Escape") {
                onClose();
              } else if (event.key === "Tab") {
                event.preventDefault();
              }
            }}
          />
          <span className="ma-kbd" aria-hidden="true">Esc</span>
        </div>
        <ul className="ma-palette__list" id="pal-list" role="listbox">
          {flat.length ? (
            groups.map(([group, items]) => (
              <li key={group} role="presentation" className="ma-palette__group">
                {group}
                <ul style={{ listStyle: "none", margin: 0, padding: 0 }} role="presentation">
                  {items.map((item) => {
                    const index = flat.indexOf(item);
                    return (
                      <li
                        key={`${item.href}-${item.label}`}
                        role="option"
                        id={`pal-${index}`}
                        className="ma-palette__item"
                        aria-selected={index === sel}
                        onMouseEnter={() => setSel(index)}
                        onClick={() => go(item.href)}
                      >
                        <Icon name={item.icon} />
                        <span>{item.label}</span>
                        <span className="ma-palette__path">{item.path}</span>
                      </li>
                    );
                  })}
                </ul>
              </li>
            ))
          ) : (
            <li className="ma-palette__group" role="presentation">
              {t("لا نتائج", "No results")}
            </li>
          )}
        </ul>
        <div className="ma-palette__foot">
          <span>
            <span className="ma-kbd">↑↓</span> {t("تنقل", "move")}
          </span>
          <span>
            <span className="ma-kbd">Enter</span> {t("فتح", "open")}
          </span>
          <span>
            <span className="ma-kbd">Esc</span> {t("إغلاق", "close")}
          </span>
        </div>
      </div>
    </div>
  );
}
