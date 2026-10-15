import jsPDF from "jspdf";
import html2canvas from "html2canvas";

/**
 * Exports data rows to a clean UTF-8 encoded CSV file with BOM so Excel (Windows & Mac)
 * opens Arabic and numbers properly without character corruption.
 */
export function exportToCsv(
  filename: string,
  headers: string[],
  rows: (string | number | null | undefined)[][]
): void {
  const escapeCell = (val: string | number | null | undefined): string => {
    if (val === null || val === undefined) return '""';
    const str = String(val);
    if (str.includes('"') || str.includes(",") || str.includes("\n") || str.includes("\r")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return `"${str}"`;
  };

  const lines = [
    headers.map(escapeCell).join(","),
    ...rows.map((row) => row.map(escapeCell).join(",")),
  ];

  const csvContent = lines.join("\r\n");
  // \uFEFF is the UTF-8 Byte Order Mark
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export type PdfExportOptions = {
  title?: string;
  filename?: string;
  margin?: number;
};

/**
 * Captures a report element into a multi-page high-resolution PDF document.
 * Inlines SVG styles and handles RTL/Arabic text rendering flawlessly.
 */
export async function exportElementToPdf(
  target: HTMLElement | string,
  filename: string,
  options?: PdfExportOptions
): Promise<void> {
  const el = typeof target === "string" ? document.getElementById(target) : target;
  if (!el) {
    throw new Error(`Target element "${target}" not found for PDF export`);
  }

  // Capture with 2x retina scale for crisp typography and charts
  const canvas = await html2canvas(el, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: window.getComputedStyle(document.body).backgroundColor || "#ffffff",
    onclone: (_clonedDoc, clonedEl) => {
      // 1. Resolve computed styles for all SVG elements (Recharts charts) so CSS variables are preserved
      const svgs = clonedEl.querySelectorAll("svg");
      svgs.forEach((svg) => {
        const svgChildren = svg.querySelectorAll("*");
        svgChildren.forEach((child) => {
          if (child instanceof SVGElement) {
            const computed = window.getComputedStyle(child);
            const fill = computed.fill;
            const stroke = computed.stroke;
            if (fill && fill !== "none" && fill !== "rgba(0, 0, 0, 0)") {
              child.setAttribute("fill", fill);
            }
            if (stroke && stroke !== "none" && stroke !== "rgba(0, 0, 0, 0)") {
              child.setAttribute("stroke", stroke);
            }
          }
        });
      });

      // 2. Hide any interactive toolbar elements marked with data-no-print
      const noPrintElements = clonedEl.querySelectorAll("[data-no-print]");
      noPrintElements.forEach((node) => {
        (node as HTMLElement).style.display = "none";
      });

      // 3. Show any print-only headers
      const printOnlyElements = clonedEl.querySelectorAll("[data-print-only]");
      printOnlyElements.forEach((node) => {
        (node as HTMLElement).style.display = "block";
      });
    },
  });

  const imgData = canvas.toDataURL("image/png");

  // A4 dimensions in mm
  const pdfWidth = 210;
  const pdfHeight = 297;
  const margin = options?.margin ?? 10;
  const contentWidth = pdfWidth - 2 * margin; // 190mm
  const scale = contentWidth / canvas.width;
  const contentHeight = canvas.height * scale;

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  let heightLeft = contentHeight;
  let position = margin;
  const pageUsableHeight = pdfHeight - 2 * margin;

  // First page
  pdf.addImage(imgData, "PNG", margin, position, contentWidth, contentHeight);
  heightLeft -= pageUsableHeight;

  // Next pages if the content extends beyond a single page
  while (heightLeft > 0) {
    position -= pageUsableHeight;
    pdf.addPage();
    pdf.addImage(imgData, "PNG", margin, position, contentWidth, contentHeight);
    heightLeft -= pageUsableHeight;
  }

  pdf.save(filename.endsWith(".pdf") ? filename : `${filename}.pdf`);
}
