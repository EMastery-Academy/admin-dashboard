import type { BadgeDef } from "@/components/ui/kit";

/** Status labels always carry a word (kit rule 10); tone adds the coloured square. */
export function orderStatusBadge(status: string | null | undefined): BadgeDef | null {
  switch (status) {
    case "created":
      return { label: { ar: "جديد", en: "Created" }, tone: "info" };
    case "pending_payment":
      return { label: { ar: "بانتظار الدفع", en: "Pending payment" }, tone: "warning" };
    case "paid":
      return { label: { ar: "مدفوع", en: "Paid" }, tone: "success" };
    case "fulfilled":
      return { label: { ar: "مكتمل", en: "Fulfilled" }, tone: "success" };
    case "cancelled":
      return { label: { ar: "ملغى", en: "Cancelled" }, tone: "danger" };
    default:
      return status ? { label: { ar: status, en: status } } : null;
  }
}

export function paymentStatusBadge(status: string | null | undefined): BadgeDef | null {
  switch (status) {
    case "pending":
      return { label: { ar: "بانتظار", en: "Pending" }, tone: "warning" };
    case "succeeded":
      return { label: { ar: "ناجح", en: "Succeeded" }, tone: "success" };
    case "failed":
      return { label: { ar: "فاشل", en: "Failed" }, tone: "danger" };
    case "refunded":
      return { label: { ar: "مُسترد", en: "Refunded" }, tone: "info" };
    default:
      return status ? { label: { ar: status, en: status } } : null;
  }
}

export function customerStatusBadge(status: string | null | undefined): BadgeDef | null {
  switch (status) {
    case "active":
      return { label: { ar: "نشط", en: "Active" }, tone: "success" };
    case "suspended":
      return { label: { ar: "موقوف", en: "Suspended" }, tone: "warning" };
    case "blocked":
      return { label: { ar: "محظور", en: "Blocked" }, tone: "danger" };
    default:
      return status ? { label: { ar: status, en: status } } : null;
  }
}

export function productStatusBadge(status: string | null | undefined): BadgeDef | null {
  switch (status) {
    case "published":
      return { label: { ar: "منشور", en: "Published" }, tone: "success" };
    case "draft":
      return { label: { ar: "غير منشور", en: "Draft" }, tone: "warning" };
    default:
      return status ? { label: { ar: status, en: status } } : null;
  }
}

export function affiliateStatusBadge(status: string | null | undefined): BadgeDef | null {
  switch (status) {
    case "pending":
      return { label: { ar: "قيد المراجعة", en: "Pending" }, tone: "warning" };
    case "approved":
      return { label: { ar: "معتمد", en: "Approved" }, tone: "success" };
    case "refused":
      return { label: { ar: "مرفوض", en: "Refused" }, tone: "danger" };
    default:
      return status ? { label: { ar: status, en: status } } : null;
  }
}

/** Colour per course track, kept consistent across media, tags and chart marks. */
export const PALETTE = ["var(--coral)", "var(--yellow)", "var(--purple)", "var(--sky)", "var(--pink)", "var(--teal)", "var(--lilac)", "var(--green)"];

/** Initials for an avatar from a name or email (emails use their local part). */
export function initialsOf(name: string | null | undefined, fallback = "MA"): string {
  if (!name) return fallback;
  const value = name.includes("@") ? (name.split("@")[0] ?? name) : name;
  const parts = value.trim().split(/[\s._-]+/).filter(Boolean);
  if (parts.length === 0) return fallback;
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase() || fallback;
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase() || fallback;
}
