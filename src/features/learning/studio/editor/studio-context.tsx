import { createContext, useContext } from "react";

import type { StudioAsset, StudioMeta } from "@/lib/api";

/** What custom blocks need from the studio page: the asset picker and the page's instructors. */
export type StudioEditorContext = {
  productRef: string;
  /** Opens the asset library in pick mode; resolves with the chosen asset (null when cancelled). */
  pickAsset: (kind?: "image" | "video" | "file") => Promise<StudioAsset | null>;
  instructors: NonNullable<StudioMeta["instructors"]>;
};

export const StudioContext = createContext<StudioEditorContext | null>(null);

export function useStudioContext(): StudioEditorContext {
  const value = useContext(StudioContext);
  if (!value) throw new Error("useStudioContext must be used inside the course studio");
  return value;
}
