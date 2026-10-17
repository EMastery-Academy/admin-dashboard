import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { Eye, EyeOff, FileCode, ListTree, Monitor, Smartphone } from "lucide-react";

import { Alert, Button, Card, ErrorAlert, Loading } from "@/components/ui/kit";
import { SourceBadge } from "@/components/ui/source-badge";
import {
  createCurriculumLesson,
  createCurriculumUnit,
  curriculumKeys,
  curriculumQueries,
  getStudio,
  productKeys,
  publishStudio,
  studioKeys,
  studioQueries,
  type PreviewKind,
  type StudioAsset,
  type StudioContent,
  type StudioMeta,
  type StudioPreviewCourseBase,
  type StudioPublishResult,
} from "@/lib/api";
import { can } from "@/lib/permissions";
import { productHref, refParam } from "@/lib/refs";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/cn";
import { StudioEditor } from "@/features/learning/studio/editor/studio-editor";
import { StudioContext } from "@/features/learning/studio/editor/studio-context";
import { ReadmeBuilderDialog } from "@/features/learning/studio/editor/readme-builder-dialog";
import type { StudioEditor as Editor, StudioPartialBlock } from "@/features/learning/studio/editor/schema";
import { useDraftSaver, type SaveState } from "@/features/learning/studio/hooks/use-draft-saver";
import { documentProblem, emptyMeta, outlineOf, toDocument } from "@/features/learning/studio/model/document";
import { AssetLibrary, AssetPickerDialog } from "@/features/learning/studio/panels/asset-library";
import { MetaPanel } from "@/features/learning/studio/panels/meta-panel";
import { VersionsPanel } from "@/features/learning/studio/panels/versions-panel";
import { PackageCoursesCard } from "@/features/learning/components/package-courses-card";
import { ReadmePanel } from "@/features/learning/studio/panels/readme-panel";
import { PreviewFrame, type PreviewDevice } from "@/features/learning/studio/preview/preview-frame";
import { CurriculumTab } from "@/features/learning/curriculum";

/** `/learning/catalog/:productId/studio`: the Course Studio of one product. */
export default function CourseStudioPage() {
  const t = useT();
  const productRef = refParam(useParams().productId);
  const page = useQuery(studioQueries.page(productRef));

  if (page.isLoading) return <Loading label={t("جارٍ فتح الاستوديو…", "Opening the studio…")} />;
  if (page.error || !page.data) return <ErrorAlert error={page.error} title={t("تعذّر فتح الاستوديو", "Couldn't open the studio")} />;
  return <StudioWorkspace key={productRef} productRef={productRef} initial={page.data} />;
}

type StudioSubPage = "editor" | "readme" | "package" | "curriculum" | "details" | "assets" | "history";
type Picker = { kind?: "image" | "video" | "file"; resolve: (asset: StudioAsset | null) => void };

const SAVE_LABEL: Record<SaveState, [string, string]> = {
  saved: ["تم الحفظ", "Saved"],
  dirty: ["تغييرات غير محفوظة", "Unsaved changes"],
  saving: ["جارٍ الحفظ…", "Saving…"],
  error: ["فشل الحفظ", "Save failed"],
  conflict: ["تعارض في التعديل", "Edit conflict"],
};

const LEGACY_SYNC: Record<string, [string, string]> = {
  synced: ["وكُتبت الصفحة في النظام القديم.", "The page was also written to the legacy platform."],
  disabled: ["الكتابة للنظام القديم معطلة؛ الصفحة منشورة على المتجر فقط.", "Legacy writes are off; the page is live on the storefront only."],
  skipped_no_legacy: ["", ""],
  failed: ["تعذّرت كتابة الصفحة في النظام القديم (راجع السجل).", "Writing the page to the legacy platform failed (see the logs)."],
  pending: ["", ""],
};

function StudioWorkspace({ productRef, initial }: { productRef: string; initial: StudioContent }) {
  const t = useT();
  const queryClient = useQueryClient();
  const editable = can("studio.edit");

  const [meta, setMeta] = useState<StudioMeta>(initial.draft.meta ?? emptyMeta());
  const [blocks, setBlocks] = useState<unknown[]>((initial.draft.blocks as unknown[]) ?? []);
  const [seed, setSeed] = useState({ key: `${initial.draft_revision}-0`, blocks: (initial.draft.blocks as unknown[]) ?? [] });
  const [status, setStatus] = useState({
    version: initial.published_version_no ?? null, changed: initial.has_unpublished_changes, seeded: initial.seeded,
  });
  const [subPage, setSubPage] = useState<StudioSubPage>("editor");
  const [showOutline, setShowOutline] = useState(false);
  const [device, setDevice] = useState<PreviewDevice>("desktop");
  const [showPreview, setShowPreview] = useState(true);
  const [picker, setPicker] = useState<Picker | null>(null);
  const [publishOpen, setPublishOpen] = useState(false);
  const [readmeOpen, setReadmeOpen] = useState(false);
  const [readmeText, setReadmeText] = useState<string | null>(null);
  const [published, setPublished] = useState<StudioPublishResult | null>(null);
  const [focus, setFocus] = useState<{ id: string; at: number } | null>(null);
  const editorRef = useRef<Editor | null>(null);

  const handleApplyReadmeBlocks = (newBlocks: StudioPartialBlock[], mode: "replace" | "append") => {
    if (!editorRef.current) return;
    if (mode === "replace") {
      editorRef.current.replaceBlocks(editorRef.current.document, newBlocks);
      onBlocks(newBlocks);
    } else {
      const doc = editorRef.current.document;
      const lastBlock = doc[doc.length - 1];
      editorRef.current.insertBlocks(newBlocks, lastBlock, "after");
      onBlocks(editorRef.current.document);
    }
  };

  const handleSyncCurriculum = async (syllabus: { unitName: string; lessons: string[] }[]) => {
    for (let i = 0; i < syllabus.length; i++) {
      const item = syllabus[i];
      const unit = await createCurriculumUnit(productRef, {
        name: item.unitName,
        order: (unitsQuery.data?.length ?? 0) + i + 1,
      });
      for (let j = 0; j < item.lessons.length; j++) {
        await createCurriculumLesson(productRef, unit.id, {
          name: item.lessons[j],
          order: j + 1,
        });
      }
    }
    queryClient.invalidateQueries({ queryKey: curriculumKeys.units(productRef) });
    queryClient.invalidateQueries({ queryKey: studioKeys.previewBase(productRef) });
  };

  const saver = useDraftSaver(
    productRef,
    initial.draft_revision,
    (content) => {
      setStatus((s) => ({ ...s, changed: content.has_unpublished_changes, seeded: false }));
      queryClient.setQueryData(studioQueries.page(productRef).queryKey, content);
    },
  );
  const { reset } = saver;
  useEffect(() => reset(initial.draft_revision), [reset, initial.draft_revision]);

  const document = useMemo(() => toDocument(meta, blocks), [meta, blocks]);
  const problem = useMemo(() => documentProblem(document), [document]);
  const outline = useMemo(() => outlineOf(blocks), [blocks]);

  const hasLegacyContent = initial.links.legacy_kind === "course" || initial.links.legacy_kind === "package";
  const base = useQuery(studioQueries.previewBase(productRef));
  const unitsQuery = useQuery({ ...curriculumQueries.units(productRef), enabled: hasLegacyContent });

  const kind: PreviewKind = (base.data?.kind as PreviewKind | undefined) ?? (initial.product_type as PreviewKind) ?? "course";

  const liveBase = useMemo(() => {
    const payload = base.data;
    if (!payload) return null;
    if ((payload.kind === "course" || payload.kind === "diploma") && payload.base) {
      const courseBase = payload.base as StudioPreviewCourseBase;
      if (!unitsQuery.data || !unitsQuery.data.length) return courseBase;

      const mappedUnits: StudioPreviewCourseBase["units"] = unitsQuery.data.map((u, uIdx) => {
        const computedDur = (u.lessons ?? []).reduce((acc, l) => acc + (l.duration || 0), 0);
        return {
          id: u.id,
          name: u.name,
          order: u.order ?? uIdx + 1,
          duration: u.duration ?? (computedDur > 0 ? computedDur : null),
          description: u.description ?? null,
          materials: (u.lessons ?? []).map((l, lIdx) => ({
            id: l.id,
            name: l.name,
            order: l.order ?? lIdx + 1,
            duration: l.duration ?? null,
            body: l.body ?? null,
            is_free: l.is_free,
            file_id: l.file_id ?? null,
            file_name: l.file_name ?? null,
            file_type: null,
            video_id: null,
            clip_id: null,
            playback_url: l.asset_url ?? null,
            thumbnail_url: null,
            iframe_url: null,
            link: l.link ?? null,
            link2: l.link2 ?? null,
          })),
        };
      });

      return {
        ...courseBase,
        units: mappedUnits,
      };
    }
    return payload.base ?? null;
  }, [base.data, unitsQuery.data]);

  const edit = (nextMeta: StudioMeta, nextBlocks: unknown[]) => {
    if (!editable) return;
    setStatus((s) => ({ ...s, changed: true }));
    saver.schedule(toDocument(nextMeta, nextBlocks));
  };
  const onMeta = (next: StudioMeta) => {
    setMeta(next);
    edit(next, blocks);
  };
  const onBlocks = useCallback(
    (next: unknown[]) => {
      setBlocks(next);
      edit(meta, next);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [meta, editable],
  );

  /** Replaces the editor with a draft loaded from the server (restore, reload after a conflict). */
  const load = (content: StudioContent) => {
    const nextBlocks = (content.draft.blocks as unknown[]) ?? [];
    setMeta(content.draft.meta ?? emptyMeta());
    setBlocks(nextBlocks);
    setSeed({ key: `${content.draft_revision}-${Date.now()}`, blocks: nextBlocks });
    setStatus({ version: content.published_version_no ?? null, changed: content.has_unpublished_changes, seeded: content.seeded });
    saver.reset(content.draft_revision);
  };

  const pickAsset = useCallback(
    (assetKind?: "image" | "video" | "file") => new Promise<StudioAsset | null>((resolve) => setPicker({ kind: assetKind, resolve })),
    [],
  );

  const publish = useMutation({
    mutationFn: async (note: string) => {
      if (problem) throw new Error(problem);
      if (saver.revision.current === 0) saver.schedule(document);
      await saver.flush();
      return publishStudio(productRef, { note: note.trim() || null, base_revision: saver.revision.current });
    },
    onSuccess: (result) => {
      setPublished(result);
      setPublishOpen(false);
      setStatus({ version: result.version.version_no, changed: result.content.has_unpublished_changes, seeded: false });
      queryClient.invalidateQueries({ queryKey: studioKeys.versions(productRef) });
      queryClient.invalidateQueries({ queryKey: productKeys.detail(productRef) });
    },
  });

  const reload = useMutation({ mutationFn: () => getStudio(productRef), onSuccess: load });
  const overwrite = useMutation({ mutationFn: () => saver.overwrite() });

  // ⌘/Ctrl S saves now; ⌘/Ctrl ⇧ P opens publish.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey)) return;
      const key = event.key.toLowerCase();
      if (key === "s") {
        event.preventDefault();
        void saver.flush().catch(() => {});
      } else if (key === "p" && event.shiftKey && editable) {
        event.preventDefault();
        setPublishOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [saver, editable]);

  const goTo = (blockId: string) => {
    const element = window.document.querySelector(`.ma-studio-editor [data-id="${CSS.escape(blockId)}"]`);
    element?.scrollIntoView({ behavior: "smooth", block: "center" });
    try {
      editorRef.current?.setTextCursorPosition(blockId, "end");
    } catch {
      /* the block may have been removed */
    }
    setFocus({ id: blockId, at: Date.now() });
  };

  const [saveAr, saveEn] = SAVE_LABEL[saver.state];
  const context = useMemo(
    () => ({ productRef, pickAsset, instructors: meta.instructors ?? [] }),
    [productRef, pickAsset, meta.instructors],
  );

  return (
    <StudioContext.Provider value={context}>
      <header className="ma-studio-head">
        <Button kind="ghost" icon="chevronStart" iconDir href={productHref(productRef)} label={t("المنتج", "Product")} sm />
        <div className="ma-studio-head__title">
          <h1>{meta.title || initial.product_title || productRef}</h1>
          <div className="ma-studio-head__meta">
            <SourceBadge source={initial.source} />
            <span className={cn("ma-studio-save", `is-${saver.state}`)} role="status">{t(saveAr, saveEn)}</span>
            <span className="ma-studio-head__pub">
              {status.version
                ? t(`منشورة: النسخة ${status.version}`, `Published: version ${status.version}`)
                : t("لم تُنشر بعد", "Not published yet")}
              {status.version && status.changed ? t(" · تعديلات غير منشورة", " · unpublished changes") : ""}
            </span>
          </div>
        </div>
        <div className="ma-studio-head__actions">
          <div className="ma-seg" role="group" aria-label={t("جهاز المعاينة", "Preview device")}>
            <button type="button" aria-pressed={device === "desktop"} onClick={() => setDevice("desktop")} title={t("سطح المكتب", "Desktop")}>
              <Monitor size={16} aria-hidden />
            </button>
            <button type="button" aria-pressed={device === "mobile"} onClick={() => setDevice("mobile")} title={t("الجوال", "Mobile")}>
              <Smartphone size={16} aria-hidden />
            </button>
          </div>
          <button
            type="button"
            className="ma-sblock__btn"
            aria-pressed={showPreview}
            onClick={() => setShowPreview((value) => !value)}
          >
            {showPreview ? <EyeOff size={16} aria-hidden /> : <Eye size={16} aria-hidden />}
            {showPreview ? t("إخفاء المعاينة", "Hide preview") : t("إظهار المعاينة", "Show preview")}
          </button>
          <Button
            kind="primary"
            icon="check"
            label={t("نشر", "Publish")}
            disabled={!editable || publish.isPending || saver.state === "conflict"}
            onClick={() => setPublishOpen(true)}
          />
        </div>
      </header>

      {!editable ? (
        <Alert kind="info" title={t("وضع القراءة فقط", "Read-only")}>
          {t("تحتاج صلاحية admin:catalog:write لتعديل الصفحة.", "You need admin:catalog:write to edit this page.")}
        </Alert>
      ) : null}
      {status.seeded ? (
        <Alert kind="info" title={t("مسودة جديدة", "New draft")}>
          {t(
            "بُنيت هذه المسودة من صفحة الدورة الحالية. لن يتغير شيء على المتجر قبل النشر.",
            "This draft was built from the course's current page. Nothing changes on the storefront until you publish.",
          )}
        </Alert>
      ) : null}
      {saver.state === "conflict" ? (
        <Alert kind="warning" title={t("عُدّلت المسودة في مكان آخر", "The draft was changed elsewhere")}>
          {t("حمّل أحدث نسخة (تُفقد تعديلاتك هنا) أو احفظ نسختك فوقها.", "Load the latest draft (your edits here are lost) or save yours over it.")}
          <div className="ma-studio-actions">
            <Button sm label={t("تحميل الأحدث", "Load latest")} disabled={reload.isPending} onClick={() => reload.mutate()} />
            <Button sm kind="secondary" label={t("حفظ نسختي", "Keep mine")} disabled={overwrite.isPending} onClick={() => overwrite.mutate()} />
          </div>
        </Alert>
      ) : null}
      {saver.state === "error" ? <ErrorAlert error={saver.error} title={t("تعذّر حفظ المسودة", "Couldn't save the draft")} /> : null}
      {problem && saver.state !== "saved" ? (
        <Alert kind="warning" title={t("الصفحة تحتاج تصحيحًا قبل الحفظ", "The page needs a fix before it can be saved")}>{problem}</Alert>
      ) : null}
      {published ? (
        <Alert kind={published.legacy_sync === "failed" ? "warning" : "success"} title={t(`نُشرت النسخة ${published.version.version_no}`, `Published version ${published.version.version_no}`)}>
          {t(...(LEGACY_SYNC[published.legacy_sync] ?? LEGACY_SYNC.pending))}
          {published.revalidated ? ` ${t("وحُدّثت صفحة المتجر.", "The storefront page was refreshed.")}` : ""}
        </Alert>
      ) : null}

      <div className="ma-pagetabs" role="tablist" aria-label={t("أقسام الاستوديو", "Studio sub-pages")} style={{ marginBlock: "var(--space-3)" }}>
        {(
          [
            ["editor", "المحرر والمعاينة", "Editor & Preview"],
            ["readme", "README (المحتوى)", "README (content)"],
            ...(kind === "package" ? [["package", "دورات الباقة", "Package courses"]] : []),
            ...(hasLegacyContent ? [["curriculum", "محتوى الدورة", "Curriculum"]] : []),
            ["details", "بيانات الصفحة", "Page Details"],
            ["assets", "مكتبة الملفات", "Asset Library"],
            ["history", "سجل النسخ", "Version History"],
          ] as [StudioSubPage, string, string][]
        ).map(([id, ar, en]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={subPage === id}
            className={cn("ma-pagetab", subPage === id && "is-active")}
            onClick={() => setSubPage(id)}
          >
            {t(ar, en)}
          </button>
        ))}
      </div>

      {subPage === "editor" ? (
        <div className={cn("ma-studio", "ma-studio--workspace", !showPreview && "is-no-preview")}>
          <section className="ma-studio__canvas" aria-label={t("محرر الصفحة", "Page editor")}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "0 var(--space-6) var(--space-3)", flexWrap: "wrap", gap: "8px" }}>
              <p className="ma-studio__hint" style={{ margin: 0 }}>
                {t("اكتب / لإضافة عنوان أو قائمة أو صورة أو بانر… واسحب المقبض ⋮⋮ لإعادة الترتيب.", "Type / to add a heading, list, image, banner… Drag the ⋮⋮ handle to reorder.")}
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <button
                  type="button"
                  className="ma-sblock__btn"
                  onClick={() => setReadmeOpen(true)}
                  style={{ fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "4px" }}
                >
                  <FileCode size={14} aria-hidden />
                  {t("كود README / بناء سريع", "README Code / Quick Build")}
                </button>
                {outline.length > 0 ? (
                  <button
                    type="button"
                    className="ma-sblock__btn"
                    onClick={() => setShowOutline((v) => !v)}
                    style={{ fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "4px" }}
                  >
                    <ListTree size={14} aria-hidden />
                    {showOutline ? t("إخفاء المخطط", "Hide outline") : t(`المخطط (${outline.length})`, `Outline (${outline.length})`)}
                  </button>
                ) : null}
              </div>
            </div>

            {showOutline && outline.length > 0 ? (
              <div style={{ margin: "0 var(--space-6) var(--space-3)", padding: "var(--space-3)", background: "var(--surface-alt)", borderRadius: "var(--radius-soft)", border: "1px solid var(--line)" }}>
                <ol className="ma-studio-outline" style={{ margin: 0, padding: 0 }}>
                  {outline.map((item) => (
                    <li key={item.id} className={`is-h${item.level}`}>
                      <button type="button" onClick={() => goTo(item.id)}>{item.title || t("(عنوان فارغ)", "(empty heading)")}</button>
                    </li>
                  ))}
                </ol>
              </div>
            ) : null}

            <StudioEditor
              productRef={productRef}
              editorKey={seed.key}
              initialBlocks={seed.blocks}
              dir={initial.locale_code.startsWith("ar") ? "rtl" : "ltr"}
              onChange={onBlocks}
              onReady={(editor) => {
                editorRef.current = editor;
              }}
              onOpenReadmeModal={() => setReadmeOpen(true)}
            />
          </section>

          {showPreview ? (
            <section className="ma-studio__preview" aria-label={t("المعاينة", "Preview")}>
              {base.isError ? <ErrorAlert error={base.error} title={t("تعذّر تحميل بيانات المعاينة", "Couldn't load preview data")} /> : null}
              <PreviewFrame base={liveBase} document={document} kind={kind} device={device} focusBlockId={focus} />
            </section>
          ) : null}
        </div>
      ) : null}

      {subPage === "readme" ? (
        <div className={cn("ma-studio", "ma-studio--workspace", !showPreview && "is-no-preview")}>
          <section className="ma-studio__canvas" style={{ overflowY: "auto", maxHeight: "calc(100vh - 170px)", padding: "var(--space-2) var(--space-3)" }}>
            <Card title={t("README المنتج (Markdown)", "Product README (Markdown)")}>
              <ReadmePanel productRef={productRef} editable={editable} onChange={setReadmeText} />
            </Card>
          </section>
          {showPreview ? (
            <section className="ma-studio__preview" aria-label={t("المعاينة", "Preview")}>
              {base.isError ? <ErrorAlert error={base.error} title={t("تعذّر تحميل بيانات المعاينة", "Couldn't load preview data")} /> : null}
              <PreviewFrame base={liveBase} document={document} kind={kind} device={device} readme={readmeText} focusBlockId={{ id: "about", at: 0 }} />
            </section>
          ) : null}
        </div>
      ) : null}

      {subPage === "package" && kind === "package" ? (
        <div className={cn("ma-studio", "ma-studio--workspace", !showPreview && "is-no-preview")}>
          <section className="ma-studio__canvas" style={{ overflowY: "auto", maxHeight: "calc(100vh - 170px)", padding: "var(--space-2) var(--space-3)" }}>
            <PackageCoursesCard productRef={productRef} editable={editable} />
          </section>
          {showPreview ? (
            <section className="ma-studio__preview" aria-label={t("المعاينة", "Preview")}>
              {base.isError ? <ErrorAlert error={base.error} title={t("تعذّر تحميل بيانات المعاينة", "Couldn't load preview data")} /> : null}
              <PreviewFrame base={liveBase} document={document} kind={kind} device={device} readme={readmeText} focusBlockId={{ id: "contents", at: 0 }} />
            </section>
          ) : null}
        </div>
      ) : null}

      {subPage === "curriculum" ? (
        <div className={cn("ma-studio", "ma-studio--workspace", !showPreview && "is-no-preview")}>
          <section
            className="ma-studio__canvas"
            style={{
              overflowY: "auto",
              maxHeight: "calc(100vh - 170px)",
              padding: "var(--space-2) var(--space-3)",
            }}
          >
            <CurriculumTab productRef={productRef} />
          </section>

          {showPreview ? (
            <section className="ma-studio__preview" aria-label={t("المعاينة", "Preview")}>
              {base.isError ? (
                <ErrorAlert error={base.error} title={t("تعذّر تحميل بيانات المعاينة", "Couldn't load preview data")} />
              ) : null}
              <PreviewFrame
                base={liveBase}
                document={document}
                kind={kind}
                device={device}
                focusBlockId={{ id: "curriculum", at: Date.now() }}
              />
            </section>
          ) : null}
        </div>
      ) : null}

      {subPage === "details" ? (
        <div className={cn("ma-studio", "ma-studio--workspace", !showPreview && "is-no-preview")}>
          <section
            className="ma-studio__canvas"
            style={{
              overflowY: "auto",
              maxHeight: "calc(100vh - 170px)",
              padding: "var(--space-2) var(--space-3)",
            }}
          >
            <Card title={t("بيانات وتفاصيل الصفحة", "Page Details")}>
              <MetaPanel meta={meta} productRef={productRef} onChange={onMeta} pickAsset={pickAsset} />
            </Card>
          </section>

          {showPreview ? (
            <section className="ma-studio__preview" aria-label={t("المعاينة", "Preview")}>
              {base.isError ? (
                <ErrorAlert error={base.error} title={t("تعذّر تحميل بيانات المعاينة", "Couldn't load preview data")} />
              ) : null}
              <PreviewFrame
                base={liveBase}
                document={document}
                kind={kind}
                device={device}
              />
            </section>
          ) : null}
        </div>
      ) : null}

      {subPage === "assets" ? (
        <div style={{ marginTop: "var(--space-3)", width: "100%" }}>
          <Card title={t("مكتبة الملفات والوسائط", "Asset Library")}>
            <AssetLibrary productRef={productRef} />
          </Card>
        </div>
      ) : null}

      {subPage === "history" ? (
        <div style={{ marginTop: "var(--space-3)", width: "100%" }}>
          <Card title={t("سجل النسخ المنشورة", "Version History")}>
            <VersionsPanel productRef={productRef} onRestored={load} />
          </Card>
        </div>
      ) : null}

      {picker ? (
        <AssetPickerDialog
          productRef={productRef}
          kind={picker.kind}
          onClose={(asset) => {
            picker.resolve(asset);
            setPicker(null);
          }}
        />
      ) : null}
      {publishOpen ? (
        <PublishDialog
          pending={publish.isPending}
          error={publish.error}
          onCancel={() => setPublishOpen(false)}
          onPublish={(note) => publish.mutate(note)}
        />
      ) : null}
      {readmeOpen ? (
        <ReadmeBuilderDialog
          isOpen={readmeOpen}
          onClose={() => setReadmeOpen(false)}
          editor={editorRef.current}
          meta={meta}
          onUpdateMeta={onMeta}
          onApplyBlocks={handleApplyReadmeBlocks}
          onSyncCurriculum={handleSyncCurriculum}
        />
      ) : null}
    </StudioContext.Provider>
  );
}

function PublishDialog({
  pending,
  error,
  onCancel,
  onPublish,
}: {
  pending: boolean;
  error: unknown;
  onCancel: () => void;
  onPublish: (note: string) => void;
}) {
  const t = useT();
  const [note, setNote] = useState("");
  return (
    <div className="ma-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onCancel()}>
      <div className="ma-studio-dialog ma-studio-dialog--sm" role="dialog" aria-modal="true" aria-label={t("نشر الصفحة", "Publish the page")}
        onKeyDown={(event) => event.key === "Escape" && onCancel()}>
        <div className="ma-studio-dialog__head">
          <strong>{t("نشر الصفحة", "Publish the page")}</strong>
        </div>
        <p className="ma-studio-dialog__text">
          {t("ستظهر المسودة الحالية للزوار على صفحة المنتج.", "The current draft goes live on the product page.")}
        </p>
        <label className="ma-label" htmlFor="studio-publish-note">{t("ما الذي تغيّر؟ (اختياري)", "What changed? (optional)")}</label>
        <textarea id="studio-publish-note" className="ma-input ma-textarea" rows={3} value={note} onChange={(event) => setNote(event.target.value)} autoFocus />
        <ErrorAlert error={error} title={t("تعذّر النشر", "Couldn't publish")} />
        <div className="ma-studio-actions">
          <Button kind="primary" label={pending ? t("جارٍ النشر…", "Publishing…") : t("نشر", "Publish")} disabled={pending} onClick={() => onPublish(note)} />
          <Button kind="ghost" label={t("إلغاء", "Cancel")} onClick={onCancel} />
        </div>
      </div>
    </div>
  );
}
