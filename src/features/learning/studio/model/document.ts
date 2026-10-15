import { z } from "zod";

import type { StudioDocument, StudioMeta } from "@/lib/api";

/*
 * The studio page document (schema version 1): `meta` plus BlockNote `blocks`. The backend validates the same
 * whitelist (`app/modules/catalog/domain/content_document.py`); this mirror catches mistakes before a save.
 */

export const SCHEMA_VERSION = 1;
export const STUDIO_BLOCK_TYPES = [
  "heading", "paragraph", "bulletListItem", "numberedListItem", "checkListItem", "quote",
  "image", "video", "file", "divider", "table",
  "banner", "instructorCard", "callout", "faq", "assetGallery",
] as const;

export type StudioBlock = StudioDocument["blocks"] extends (infer B)[] | undefined ? B : never;

/** `https:` or a site-relative path (no `javascript:`, `data:` or protocol-relative URLs). */
export function isSafeUrl(value: string): boolean {
  const url = value.trim();
  return url === "" || url.startsWith("https://") || url.startsWith("http://") || (url.startsWith("/") && !url.startsWith("//"));
}

const safeUrl = z.string().max(2000).refine((value) => value.trim() !== "" && isSafeUrl(value), "https URL");
const image = z.object({ asset_id: z.string().nullish(), url: safeUrl, alt: z.string().max(500).default("") });

export const metaSchema = z.object({
  title: z.string().max(500).default(""),
  summary: z.string().max(5000).default(""),
  cover: image.nullish(),
  banner: image.extend({ headline: z.string().max(300).default("") }).nullish(),
  intro_video_id: z.string().max(100).nullish(),
  instructors: z
    .array(z.object({ ref: z.string().max(100), display_name: z.string().max(300), avatar_url: z.string().nullish() }))
    .max(50)
    .default([]),
});

const blockSchema: z.ZodType<unknown> = z.lazy(() =>
  z.object({
    id: z.string().optional(),
    type: z.enum(STUDIO_BLOCK_TYPES),
    props: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])).optional(),
    content: z.unknown().optional(),
    children: z.array(blockSchema).optional(),
  }),
);

export const documentSchema = z.object({
  schema_version: z.literal(SCHEMA_VERSION),
  meta: metaSchema,
  blocks: z.array(blockSchema),
});

export function emptyMeta(): StudioMeta {
  return { title: "", summary: "", cover: null, banner: null, intro_video_id: null, instructors: [] };
}

export function toDocument(meta: StudioMeta, blocks: unknown[]): StudioDocument {
  return { schema_version: SCHEMA_VERSION, meta, blocks: blocks as StudioDocument["blocks"] };
}

/** First validation problem of a document, or null. */
export function documentProblem(document: StudioDocument): string | null {
  const result = documentSchema.safeParse(document);
  if (result.success) return null;
  const issue = result.error.issues[0];
  return `${issue.path.join(".") || "document"}: ${issue.message}`;
}

type InlineItem = { type?: string; text?: string; content?: unknown };

/** Plain text of BlockNote inline content. */
export function plainText(content: unknown): string {
  if (!Array.isArray(content)) return "";
  return (content as InlineItem[])
    .map((item) => (item.type === "link" ? plainText(item.content) : (item.text ?? "")))
    .join("");
}

export type OutlineItem = { id: string; title: string; level: number };

/** Headings of the page, in order: level 2 headings start the page sections. */
export function outlineOf(blocks: unknown[]): OutlineItem[] {
  const out: OutlineItem[] = [];
  for (const raw of blocks as { id?: string; type?: string; props?: { level?: number }; content?: unknown }[]) {
    if (raw.type !== "heading" || !raw.id) continue;
    out.push({ id: raw.id, title: plainText(raw.content).trim(), level: Number(raw.props?.level ?? 1) });
  }
  return out;
}

export type GalleryItem = { url: string; alt: string };

export function parseGallery(value: unknown): GalleryItem[] {
  if (typeof value !== "string" || !value) return [];
  try {
    const items = JSON.parse(value) as unknown;
    return Array.isArray(items)
      ? items.filter((item): item is GalleryItem => typeof item?.url === "string" && isSafeUrl(item.url) && item.url !== "")
      : [];
  } catch {
    return [];
  }
}
