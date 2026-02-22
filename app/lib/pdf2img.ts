export interface PdfConversionResult {
  imageUrl: string;
  file: File | null;
  error?: string;
}

let pdfjsLib: typeof import("pdfjs-dist/build/pdf.mjs") | null = null;
let loadPromise: Promise<typeof import("pdfjs-dist/build/pdf.mjs")> | null =
  null;

async function loadPdfJs() {
  if (pdfjsLib) return pdfjsLib;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    const lib = await import("pdfjs-dist/build/pdf.mjs");

    const worker = await import(
      "pdfjs-dist/build/pdf.worker.min.mjs?url"
    );

    lib.GlobalWorkerOptions.workerSrc = worker.default;

    pdfjsLib = lib;
    return lib;
  })();

  return loadPromise;
}

export async function convertPdfToImage(
  file: File
): Promise<PdfConversionResult> {
  try {
    const lib = await loadPdfJs();

    const arrayBuffer = await file.arrayBuffer();

    const pdf = await lib.getDocument({
      data: arrayBuffer,
    }).promise;

    const page = await pdf.getPage(1);

    const viewport = page.getViewport({ scale: 4 });

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) {
      return {
        imageUrl: "",
        file: null,
        error: "Failed to get canvas context",
      };
    }

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";

    await page.render({
      canvasContext: context,
      viewport,
      canvas,
    }).promise;

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/png", 1.0)
    );

    if (!blob) {
      return {
        imageUrl: "",
        file: null,
        error: "Failed to create image blob",
      };
    }

    const originalName = file.name.replace(/\.pdf$/i, "");
    const imageFile = new File([blob], `${originalName}.png`, {
      type: "image/png",
    });

    return {
      imageUrl: URL.createObjectURL(blob),
      file: imageFile,
    };
  } catch (err) {
    return {
      imageUrl: "",
      file: null,
      error:
        "Failed to convert PDF: " +
        (err instanceof Error ? err.message : String(err)),
    };
  }
}
