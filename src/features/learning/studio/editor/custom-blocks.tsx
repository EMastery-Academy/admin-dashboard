import { createReactBlockSpec } from "@blocknote/react";
import { ImageIcon, Images, Info, MessageCircleQuestion, Plus, Trash2, UserRound } from "lucide-react";

import { useT } from "@/lib/i18n";
import { isSafeUrl, parseGallery } from "@/features/learning/studio/model/document";
import { useStudioContext } from "@/features/learning/studio/editor/studio-context";

/*
 * Studio blocks beyond BlockNote's built-ins. Props are scalars (a BlockNote rule), so the gallery keeps its
 * images as a JSON string. Every block edits its props in place; the storefront renders the same types.
 */

const stop = { onKeyDown: (event: React.KeyboardEvent) => event.stopPropagation() };

export const bannerBlock = createReactBlockSpec(
  {
    type: "banner",
    propSchema: { url: { default: "" }, alt: { default: "" }, headline: { default: "" }, subheadline: { default: "" } },
    content: "none",
  },
  {
    render: function Banner({ block, editor }) {
      const t = useT();
      const studio = useStudioContext();
      const { url, alt, headline, subheadline } = block.props;
      const set = (props: Partial<typeof block.props>) => editor.updateBlock(block, { props });
      return (
        <div className="ma-sblock ma-sblock--banner" contentEditable={false}>
          <div className="ma-sblock__media" style={url && isSafeUrl(url) ? { backgroundImage: `url("${url}")` } : undefined}>
            {!url ? <ImageIcon aria-hidden size={28} /> : null}
            <div className="ma-sblock__overlay">
              <input className="ma-sblock__headline" placeholder={t("عنوان البانر", "Banner headline")} value={headline}
                onChange={(event) => set({ headline: event.target.value })} {...stop} />
              <input className="ma-sblock__sub" placeholder={t("سطر فرعي (اختياري)", "Subheadline (optional)")}
                value={subheadline} onChange={(event) => set({ subheadline: event.target.value })} {...stop} />
            </div>
          </div>
          <div className="ma-sblock__bar">
            <button type="button" className="ma-sblock__btn" onClick={async () => {
              const asset = await studio.pickAsset("image");
              if (asset) set({ url: asset.url, alt: asset.alt_text ?? alt });
            }}>
              <ImageIcon size={14} aria-hidden /> {url ? t("تغيير الصورة", "Change image") : t("اختر صورة", "Choose image")}
            </button>
            <input className="ma-sblock__input" placeholder={t("نص بديل للصورة", "Image alt text")} value={alt}
              onChange={(event) => set({ alt: event.target.value })} {...stop} />
          </div>
        </div>
      );
    },
  },
);

const TONES = ["info", "success", "warning"] as const;

export const calloutBlock = createReactBlockSpec(
  {
    type: "callout",
    propSchema: { tone: { default: "info", values: TONES } },
    content: "inline",
  },
  {
    render: function Callout({ block, editor, contentRef }) {
      const t = useT();
      const next = TONES[(TONES.indexOf(block.props.tone) + 1) % TONES.length];
      return (
        <div className={`ma-sblock ma-sblock--callout is-${block.props.tone}`}>
          <button type="button" contentEditable={false} className="ma-sblock__tone" title={t("تغيير اللون", "Change tone")}
            onClick={() => editor.updateBlock(block, { props: { tone: next } })}>
            <Info size={16} aria-hidden />
          </button>
          <div className="ma-sblock__inline" ref={contentRef} />
        </div>
      );
    },
  },
);

export const faqBlock = createReactBlockSpec(
  {
    type: "faq",
    propSchema: { question: { default: "" } },
    content: "inline",
  },
  {
    render: function Faq({ block, editor, contentRef }) {
      const t = useT();
      return (
        <div className="ma-sblock ma-sblock--faq">
          <div className="ma-sblock__q" contentEditable={false}>
            <MessageCircleQuestion size={16} aria-hidden />
            <input className="ma-sblock__question" placeholder={t("السؤال", "Question")} value={block.props.question}
              onChange={(event) => editor.updateBlock(block, { props: { question: event.target.value } })} {...stop} />
          </div>
          <div className="ma-sblock__inline ma-sblock__answer" ref={contentRef} />
        </div>
      );
    },
  },
);

export const instructorCardBlock = createReactBlockSpec(
  {
    type: "instructorCard",
    propSchema: { ref: { default: "" }, name: { default: "" }, avatarUrl: { default: "" }, bio: { default: "" } },
    content: "none",
  },
  {
    render: function InstructorCard({ block, editor }) {
      const t = useT();
      const { instructors } = useStudioContext();
      const { ref, name, avatarUrl, bio } = block.props;
      return (
        <div className="ma-sblock ma-sblock--instructor" contentEditable={false}>
          <span className="ma-sblock__avatar">
            {avatarUrl && isSafeUrl(avatarUrl) ? <img src={avatarUrl} alt="" /> : <UserRound size={20} aria-hidden />}
          </span>
          <div className="ma-sblock__stack">
            <select className="ma-sblock__input" value={ref} aria-label={t("المدرب", "Instructor")}
              onChange={(event) => {
                const picked = instructors.find((item) => item.ref === event.target.value);
                editor.updateBlock(block, {
                  props: { ref: picked?.ref ?? "", name: picked?.display_name ?? "", avatarUrl: picked?.avatar_url ?? "" },
                });
              }}>
              <option value="">{t("اختر من مدربي الصفحة…", "Pick one of the page's instructors…")}</option>
              {instructors.map((item) => (
                <option key={item.ref} value={item.ref}>{item.display_name}</option>
              ))}
            </select>
            {name ? <strong>{name}</strong> : null}
            <textarea className="ma-sblock__input" rows={2} placeholder={t("نبذة قصيرة (اختياري)", "Short bio (optional)")}
              value={bio} onChange={(event) => editor.updateBlock(block, { props: { bio: event.target.value } })} {...stop} />
          </div>
        </div>
      );
    },
  },
);

export const assetGalleryBlock = createReactBlockSpec(
  {
    type: "assetGallery",
    propSchema: { items: { default: "[]" } },
    content: "none",
  },
  {
    render: function AssetGallery({ block, editor }) {
      const t = useT();
      const studio = useStudioContext();
      const items = parseGallery(block.props.items);
      const save = (next: typeof items) => editor.updateBlock(block, { props: { items: JSON.stringify(next) } });
      return (
        <div className="ma-sblock ma-sblock--gallery" contentEditable={false}>
          <div className="ma-sblock__grid">
            {items.map((item, index) => (
              <figure key={`${item.url}-${index}`} className="ma-sblock__tile">
                <img src={item.url} alt={item.alt} />
                <button type="button" className="ma-sblock__remove" aria-label={t("إزالة", "Remove")}
                  onClick={() => save(items.filter((_, i) => i !== index))}>
                  <Trash2 size={14} aria-hidden />
                </button>
              </figure>
            ))}
            <button type="button" className="ma-sblock__tile ma-sblock__add" onClick={async () => {
              const asset = await studio.pickAsset("image");
              if (asset) save([...items, { url: asset.url, alt: asset.alt_text ?? "" }]);
            }}>
              {items.length ? <Plus size={20} aria-hidden /> : <Images size={20} aria-hidden />}
              <span>{t("أضف صورة", "Add image")}</span>
            </button>
          </div>
        </div>
      );
    },
  },
);
