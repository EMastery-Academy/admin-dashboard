import { useEffect, useRef, useState } from "react";

import type { PreviewKind, StudioDocument } from "@/lib/api";
import { useT } from "@/lib/i18n";

/*
 * Live preview: the storefront's real product page (mastery-front `/preview/product`) in an iframe. The frame
 * says `ready`, then the studio posts the draft (and the product's storefront data) on every change. Messages are
 * only sent to, and accepted from, the storefront origin.
 */

const STOREFRONT_ORIGIN: string = (import.meta.env.VITE_STOREFRONT_ORIGIN as string | undefined) ?? "http://localhost:3000";
const PREVIEW_URL = `${STOREFRONT_ORIGIN.replace(/\/$/, "")}/preview/product`;
const THROTTLE_MS = 150;

export type PreviewDevice = "desktop" | "mobile";

type FromPreview = { source: "mastery-preview"; type: "ready" | "rendered" };

export function PreviewFrame({
  base,
  document,
  kind,
  device,
  focusBlockId,
  readme,
}: {
  base: unknown;
  document: StudioDocument;
  kind: PreviewKind;
  device: PreviewDevice;
  /** Scrolls the preview to this block (outline clicks). */
  focusBlockId?: { id: string; at: number } | null;
  /** The product README (markdown) being edited; the storefront renders it live in place of the about sections. */
  readme?: string | null;
}) {
  const t = useT();
  const frame = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const readyRef = useRef(false);
  const last = useRef(0);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const onMessage = (event: MessageEvent<FromPreview>) => {
      if (event.origin !== new URL(PREVIEW_URL).origin || event.data?.source !== "mastery-preview") return;
      if (event.data.type === "ready") {
        readyRef.current = true;
        setReady(true);
      }
    };
    window.addEventListener("message", onMessage);
    // A storefront that never says `ready` is down or does not allow framing.
    const watchdog = window.setTimeout(() => setBlocked(!readyRef.current), 8000);
    return () => {
      window.removeEventListener("message", onMessage);
      window.clearTimeout(watchdog);
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    const send = () => {
      last.current = Date.now();
      frame.current?.contentWindow?.postMessage(
        { source: "mastery-studio", type: "render", kind, base, document, readme: readme ?? null },
        new URL(PREVIEW_URL).origin,
      );
    };
    window.clearTimeout(timer.current);
    const wait = THROTTLE_MS - (Date.now() - last.current);
    if (wait <= 0) send();
    else timer.current = window.setTimeout(send, wait);
    return () => window.clearTimeout(timer.current);
  }, [ready, base, document, kind, readme]);

  useEffect(() => {
    if (!ready || !focusBlockId) return;
    frame.current?.contentWindow?.postMessage(
      { source: "mastery-studio", type: "scroll", blockId: focusBlockId.id },
      new URL(PREVIEW_URL).origin,
    );
  }, [ready, focusBlockId]);

  return (
    <div className={`ma-studio-preview is-${device}`}>
      <div className="ma-studio-preview__viewport">
        <iframe
          ref={frame}
          src={PREVIEW_URL}
          title={t("معاينة صفحة الدورة", "Course page preview")}
          className="ma-studio-preview__frame"
          sandbox="allow-scripts allow-same-origin"
        />
        {!ready ? (
          <div className="ma-studio-preview__state" role="status">
            {blocked
              ? t(`تعذّر تحميل المعاينة من ${STOREFRONT_ORIGIN}`, `Couldn't load the preview from ${STOREFRONT_ORIGIN}`)
              : t("جارٍ تحميل المعاينة…", "Loading preview…")}
          </div>
        ) : null}
      </div>
    </div>
  );
}
