import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, GripVertical, ImageIcon, Upload, UserRound, X } from "lucide-react";

import { ErrorAlert, Field } from "@/components/ui/kit";
import { ReactPhotoEditor } from "react-photo-editor";
import { listAdminInstructors, studioKeys, uploadStudioAsset, type StudioAsset, type StudioMeta } from "@/lib/api";
import { useT } from "@/lib/i18n";

type Instructor = NonNullable<StudioMeta["instructors"]>[number];

/**
 * Page details shown above the content: title, summary, cover, banner, intro video and instructors. Empty
 * fields keep what the storefront shows today (the legacy course's own values).
 */
export function MetaPanel({
  meta,
  productRef,
  onChange,
  pickAsset,
}: {
  meta: StudioMeta;
  productRef?: string;
  onChange: (meta: StudioMeta) => void;
  pickAsset: (kind?: "image") => Promise<StudioAsset | null>;
}) {
  const t = useT();
  const set = (patch: Partial<StudioMeta>) => onChange({ ...meta, ...patch });
  const instructors = meta.instructors ?? [];

  return (
    <div className="ma-studio-meta">
      <Field id="studio-title" label={t("العنوان", "Title")} value={meta.title ?? ""} onChange={(title) => set({ title })} />
      <Field
        id="studio-summary"
        type="textarea"
        rows={4}
        label={t("الملخص", "Summary")}
        hint={t("يظهر تحت العنوان في رأس الصفحة.", "Shown under the title in the page header.")}
        value={meta.summary ?? ""}
        onChange={(summary) => set({ summary })}
      />

      <ImagePicker
        label={t("صورة الغلاف", "Cover image")}
        value={meta.cover ?? null}
        productRef={productRef}
        onPick={async () => {
          const asset = await pickAsset("image");
          if (asset) set({ cover: { asset_id: asset.asset_id, url: asset.url, alt: asset.alt_text ?? meta.title ?? "" } });
        }}
        onUploaded={(asset) => {
          set({ cover: { asset_id: asset.asset_id, url: asset.url, alt: asset.alt_text ?? meta.title ?? "" } });
        }}
        onClear={() => set({ cover: null })}
        onAlt={(alt) => meta.cover && set({ cover: { ...meta.cover, alt } })}
      />

      <ImagePicker
        label={t("بانر الصفحة", "Page banner")}
        value={meta.banner ?? null}
        productRef={productRef}
        onPick={async () => {
          const asset = await pickAsset("image");
          if (asset) {
            set({ banner: { asset_id: asset.asset_id, url: asset.url, alt: asset.alt_text ?? "", headline: meta.banner?.headline ?? "" } });
          }
        }}
        onUploaded={(asset) => {
          set({ banner: { asset_id: asset.asset_id, url: asset.url, alt: asset.alt_text ?? "", headline: meta.banner?.headline ?? "" } });
        }}
        onClear={() => set({ banner: null })}
        onAlt={(alt) => meta.banner && set({ banner: { ...meta.banner, alt } })}
      >
        {meta.banner ? (
          <input
            className="ma-input"
            placeholder={t("عنوان البانر", "Banner headline")}
            value={meta.banner.headline ?? ""}
            onChange={(event) => meta.banner && set({ banner: { ...meta.banner, headline: event.target.value } })}
          />
        ) : null}
      </ImagePicker>

      <Field
        id="studio-video"
        label={t("فيديو تعريفي (Bunny)", "Intro video (Bunny)")}
        hint={t("معرّف الفيديو في مكتبة Bunny Stream.", "The video's Bunny Stream GUID.")}
        value={meta.intro_video_id ?? ""}
        onChange={(value) => set({ intro_video_id: value.trim() || null })}
      />

      <InstructorsEditor value={instructors} onChange={(next) => set({ instructors: next })} />
    </div>
  );
}

function ImagePicker({
  label,
  value,
  productRef,
  onPick,
  onUploaded,
  onClear,
  onAlt,
  children,
}: {
  label: string;
  value: { url: string; alt?: string } | null;
  productRef?: string;
  onPick: () => void;
  onUploaded?: (asset: StudioAsset) => void;
  onClear: () => void;
  onAlt: (alt: string) => void;
  children?: React.ReactNode;
}) {
  const t = useT();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<unknown>(null);
  const [editingFile, setEditingFile] = useState<File | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !productRef) return;
    setUploadError(null);
    setEditingFile(file);
    setIsEditorOpen(true);
  };

  const handleSaveEditedImage = async (editedFile: File) => {
    setIsEditorOpen(false);
    setEditingFile(null);
    if (!productRef) return;
    setUploading(true);
    setUploadError(null);
    try {
      const asset = await uploadStudioAsset(productRef, editedFile);
      queryClient.invalidateQueries({ queryKey: studioKeys.assets(productRef) });
      onUploaded?.(asset);
    } catch (err) {
      setUploadError(err);
    } finally {
      setUploading(false);
    }
  };

  const handleCloseEditor = () => {
    setIsEditorOpen(false);
    setEditingFile(null);
  };

  const editorLabels = {
    close: t("إلغاء", "Cancel"),
    save: t("حفظ", "Save"),
    rotate: t("تدوير", "Rotate"),
    brightness: t("السطوع", "Brightness"),
    contrast: t("التباين", "Contrast"),
    saturate: t("التشبع", "Saturation"),
    grayscale: t("تدرج رمادي", "Grayscale"),
    reset: t("إعادة ضبط", "Reset"),
    flipHorizontal: t("قلب أفقي", "Flip horizontal"),
    flipVertical: t("قلب رأسي", "Flip vertical"),
    zoomIn: t("تكبير", "Zoom in"),
    zoomOut: t("تصغير", "Zoom out"),
    draw: t("رسم", "Draw"),
    brushColor: t("لون الفرشاة", "Brush color"),
    brushWidth: t("حجم الفرشاة", "Brush width"),
  };

  return (
    <div className="ma-field">
      <span className="ma-label">{label}</span>
      <div className="ma-studio-image">
        <button type="button" className="ma-studio-image__thumb" onClick={onPick} aria-label={label}>
          {value ? <img src={value.url} alt={value.alt ?? ""} /> : <ImageIcon size={22} aria-hidden />}
        </button>
        <div className="ma-studio-image__side">
          {productRef ? (
            <>
              <button
                type="button"
                className="ma-sblock__btn"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={14} aria-hidden />
                {uploading ? t("جارٍ الرفع…", "Uploading…") : t("رفع صورة", "Upload image")}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={handleFileChange}
              />
            </>
          ) : null}
          <button type="button" className="ma-sblock__btn" onClick={onPick}>
            {value ? t("من المكتبة", "From library") : t("اختر من المكتبة", "Choose from library")}
          </button>
          {value ? (
            <button type="button" className="ma-sblock__btn" onClick={onClear}>
              {t("إزالة", "Remove")}
            </button>
          ) : null}
        </div>
      </div>
      {uploadError ? <ErrorAlert error={uploadError} /> : null}
      {value ? (
        <input className="ma-input" placeholder={t("نص بديل", "Alt text")} value={value.alt ?? ""} onChange={(event) => onAlt(event.target.value)} />
      ) : null}
      {children}

      {isEditorOpen && editingFile ? (
        <ReactPhotoEditor
          open={isEditorOpen}
          onClose={handleCloseEditor}
          file={editingFile}
          onSaveImage={handleSaveEditedImage}
          downloadOnSave={false}
          allowColorEditing={true}
          allowRotate={true}
          allowFlip={true}
          allowZoom={true}
          allowDrawing={false}
          labels={editorLabels}
        />
      ) : null}
    </div>
  );
}


function InstructorsEditor({ value, onChange }: { value: Instructor[]; onChange: (value: Instructor[]) => void }) {
  const t = useT();
  const [query, setQuery] = useState("");
  const [dragging, setDragging] = useState<number | null>(null);
  const search = useQuery({
    queryKey: ["learning", "studio", "instructor-search", query],
    queryFn: () => listAdminInstructors({ query: query || undefined, limit: 8 }),
    enabled: query.trim().length >= 2,
  });

  const move = (from: number, to: number) => {
    if (to < 0 || to >= value.length || from === to) return;
    const next = [...value];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  };

  return (
    <div className="ma-field">
      <span className="ma-label">{t("المدربون", "Instructors")}</span>
      <ol className="ma-studio-list">
        {value.map((item, index) => (
          <li
            key={item.ref}
            className={dragging === index ? "is-dragging" : undefined}
            draggable
            onDragStart={() => setDragging(index)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => {
              if (dragging !== null) move(dragging, index);
              setDragging(null);
            }}
            onDragEnd={() => setDragging(null)}
          >
            <GripVertical size={14} aria-hidden className="ma-studio-list__grip" />
            <span className="ma-sblock__avatar ma-sblock__avatar--sm">
              {item.avatar_url ? <img src={item.avatar_url} alt="" /> : <UserRound size={14} aria-hidden />}
            </span>
            <span className="ma-studio-list__name">{item.display_name}</span>
            <button type="button" aria-label={t("لأعلى", "Move up")} onClick={() => move(index, index - 1)}>
              <ArrowUp size={14} aria-hidden />
            </button>
            <button type="button" aria-label={t("لأسفل", "Move down")} onClick={() => move(index, index + 1)}>
              <ArrowDown size={14} aria-hidden />
            </button>
            <button type="button" aria-label={t("إزالة", "Remove")} onClick={() => onChange(value.filter((_, i) => i !== index))}>
              <X size={14} aria-hidden />
            </button>
          </li>
        ))}
      </ol>
      <input
        className="ma-input"
        placeholder={t("ابحث عن مدرب لإضافته…", "Search an instructor to add…")}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      {search.data?.items.length ? (
        <ul className="ma-studio-suggest">
          {search.data.items
            .filter((item) => !value.some((current) => current.ref === `legacy:trainer:${item.legacy_trainer_id}`))
            .map((item) => (
              <li key={item.legacy_trainer_id}>
                <button
                  type="button"
                  onClick={() => {
                    onChange([
                      ...value,
                      {
                        ref: `legacy:trainer:${item.legacy_trainer_id}`,
                        display_name: item.name ?? "",
                        avatar_url: item.avatar?.startsWith("https://") ? item.avatar : null,
                      },
                    ]);
                    setQuery("");
                  }}
                >
                  {item.name}
                </button>
              </li>
            ))}
        </ul>
      ) : null}
    </div>
  );
}
