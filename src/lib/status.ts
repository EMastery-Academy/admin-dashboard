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
    case "payment_failed":
      return { label: { ar: "فشل الدفع", en: "Payment failed" }, tone: "danger" };
    case "refunded":
      return { label: { ar: "مُسترد", en: "Refunded" }, tone: "info" };
    case "partially_refunded":
      return { label: { ar: "مُسترد جزئيًا", en: "Partially refunded" }, tone: "info" };
    case "expired":
      return { label: { ar: "منتهي", en: "Expired" }, tone: "neutral" };
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
    case "partially_refunded":
      return { label: { ar: "مُسترد جزئيًا", en: "Partially refunded" }, tone: "info" };
    case "cancelled":
      return { label: { ar: "ملغى", en: "Cancelled" }, tone: "neutral" };
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
      return { label: { ar: "مسودة", en: "Draft" }, tone: "warning" };
    case "unpublished":
      return { label: { ar: "غير منشور", en: "Unpublished" }, tone: "warning" };
    case "archived":
      return { label: { ar: "مؤرشف", en: "Archived" }, tone: "neutral" };
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

/** Booking lifecycle of a B2C consultation (labels match the student/expert apps). */
export function bookingStatusBadge(status: string | null | undefined): BadgeDef | null {
  switch (status) {
    case "pending_payment":
      return { label: { ar: "بانتظار الدفع", en: "Pending payment" }, tone: "warning" };
    case "expired":
      return { label: { ar: "منتهي", en: "Expired" }, tone: "neutral" };
    case "awaiting_approval":
      return { label: { ar: "بانتظار موافقة الخبير", en: "Awaiting expert" }, tone: "warning" };
    case "confirmed":
      return { label: { ar: "مؤكد", en: "Confirmed" }, tone: "info" };
    case "in_progress":
      return { label: { ar: "جارٍ", en: "In progress" }, tone: "info" };
    case "completed":
      return { label: { ar: "مكتمل", en: "Completed" }, tone: "success" };
    case "rejected":
      return { label: { ar: "مرفوض", en: "Rejected" }, tone: "danger" };
    case "refund_pending":
      return { label: { ar: "بانتظار الاسترداد", en: "Refund pending" }, tone: "danger" };
    case "no_show_customer":
      return { label: { ar: "غياب الطالب", en: "Student no-show" }, tone: "danger" };
    case "no_show_expert":
      return { label: { ar: "غياب الخبير", en: "Expert no-show" }, tone: "danger" };
    case "cancelled":
      return { label: { ar: "ملغى", en: "Cancelled" }, tone: "neutral" };
    default:
      return status ? { label: { ar: status, en: status } } : null;
  }
}

export function slotStateBadge(state: string | null | undefined): BadgeDef | null {
  switch (state) {
    case "free":
      return { label: { ar: "متاح", en: "Free" }, tone: "success" };
    case "held":
      return { label: { ar: "محجوز مؤقتًا", en: "Held" }, tone: "warning" };
    case "booked":
      return { label: { ar: "محجوز", en: "Booked" }, tone: "info" };
    default:
      return state ? { label: { ar: state, en: state } } : null;
  }
}
