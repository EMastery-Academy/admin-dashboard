import { BlockNoteSchema, createHeadingBlockSpec, defaultBlockSpecs, insertOrUpdateBlockForSlashMenu } from "@blocknote/core";
import type { DefaultReactSuggestionItem } from "@blocknote/react";
import { FileCode, Images, Info, LayoutPanelTop, MessageCircleQuestion, UserRound } from "lucide-react";

import {
  assetGalleryBlock,
  bannerBlock,
  calloutBlock,
  faqBlock,
  instructorCardBlock,
} from "@/features/learning/studio/editor/custom-blocks";

/*
 * The studio's block set: BlockNote built-ins the storefront renders (no audio, code or toggle blocks; headings
 * 1–3 only) plus the studio blocks. Keep in sync with the backend whitelist and `model/document.ts`.
 */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const { audio: _audio, codeBlock: _code, toggleListItem: _toggle, heading: _heading, ...builtIns } = defaultBlockSpecs;

export const studioSchema = BlockNoteSchema.create({
  blockSpecs: {
    ...builtIns,
    heading: createHeadingBlockSpec({ levels: [1, 2, 3], allowToggleHeadings: false }),
    banner: bannerBlock(),
    callout: calloutBlock(),
    faq: faqBlock(),
    instructorCard: instructorCardBlock(),
    assetGallery: assetGalleryBlock(),
  },
});

export type StudioEditor = typeof studioSchema.BlockNoteEditor;
export type StudioEditorBlock = typeof studioSchema.Block;
export type StudioPartialBlock = typeof studioSchema.PartialBlock;

type T = (ar: string, en?: string) => string;

/** Slash-menu entries of the studio blocks, in a "Course page" group. */
export function studioSlashItems(
  editor: StudioEditor,
  t: T,
  onOpenReadme?: () => void,
): DefaultReactSuggestionItem[] {
  const group = t("صفحة الدورة", "Course page");
  const items: DefaultReactSuggestionItem[] = [
    {
      title: t("كود README / بناء سريع", "README Code / Quick Build"),
      subtext: t("بناء أقسام ومحتوى الدورة سريعاً من كود Markdown أو README", "Fast build course sections and body from Markdown/README code"),
      group,
      aliases: ["readme", "markdown", "md", "كود", "ريدمي", "بناء", "سريع"],
      icon: <FileCode size={18} />,
      onItemClick: () => {
        if (onOpenReadme) {
          onOpenReadme();
        }
      },
    },
    {
      title: t("بانر", "Banner"), subtext: t("صورة عريضة مع عنوان", "Wide image with a headline"), group,
      aliases: ["banner", "hero", "cover", "بانر"], icon: <LayoutPanelTop size={18} />,
      onItemClick: () => insertOrUpdateBlockForSlashMenu(editor, { type: "banner" }),
    },
    {
      title: t("تنبيه", "Callout"), subtext: t("ملاحظة بارزة", "Highlighted note"), group,
      aliases: ["callout", "note", "tip", "تنبيه"], icon: <Info size={18} />,
      onItemClick: () => insertOrUpdateBlockForSlashMenu(editor, { type: "callout" }),
    },
    {
      title: t("سؤال شائع", "FAQ"), subtext: t("سؤال وجوابه", "A question and its answer"), group,
      aliases: ["faq", "question", "سؤال"], icon: <MessageCircleQuestion size={18} />,
      onItemClick: () => insertOrUpdateBlockForSlashMenu(editor, { type: "faq" }),
    },
    {
      title: t("بطاقة مدرب", "Instructor card"), subtext: t("أحد مدربي الدورة", "One of the course's instructors"), group,
      aliases: ["instructor", "trainer", "مدرب"], icon: <UserRound size={18} />,
      onItemClick: () => insertOrUpdateBlockForSlashMenu(editor, { type: "instructorCard" }),
    },
    {
      title: t("معرض صور", "Gallery"), subtext: t("شبكة صور من مكتبة الملفات", "Image grid from the asset library"), group,
      aliases: ["gallery", "images", "assets", "معرض"], icon: <Images size={18} />,
      onItemClick: () => insertOrUpdateBlockForSlashMenu(editor, { type: "assetGallery" }),
    },
  ];

  return items;
}
