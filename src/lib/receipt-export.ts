import { toBlob } from "html-to-image";
import type { OrderNote } from "@/types";
import {
  buildOrderSummaryText,
  buildWhatsAppUrl,
  triggerDownloadBlob,
} from "./whatsapp";

async function waitForImages(element: HTMLElement): Promise<void> {
  const imgs = Array.from(element.querySelectorAll("img"));
  await Promise.all(
    imgs.map((img) => {
      if (img.complete && img.naturalWidth > 0) return Promise.resolve();
      return new Promise<void>((resolve) => {
        const done = () => {
          img.removeEventListener("load", done);
          img.removeEventListener("error", done);
          resolve();
        };
        img.addEventListener("load", done);
        img.addEventListener("error", done);
        setTimeout(done, 2500);
      });
    })
  );
}

export async function generateReceiptPngBlob(
  element: HTMLElement
): Promise<Blob> {
  if (typeof document !== "undefined" && "fonts" in document) {
    await document.fonts.ready;
  }

  await waitForImages(element);

  const blob = await toBlob(element, {
    pixelRatio: 2,
    cacheBust: true,
    backgroundColor: "#ffffff",
  });

  if (!blob) {
    throw new Error("Gagal mengonversi struk menjadi gambar PNG.");
  }

  return blob;
}

export interface ShareOrderResult {
  mode: "native-share" | "fallback";
  summaryText: string;
  copiedImage: boolean;
}

async function copyImageBlobToClipboard(blob: Blob): Promise<boolean> {
  if (
    typeof navigator === "undefined" ||
    !navigator.clipboard?.write ||
    typeof ClipboardItem === "undefined"
  ) {
    return false;
  }

  try {
    await navigator.clipboard.write([
      new ClipboardItem({
        "image/png": blob,
      }),
    ]);
    return true;
  } catch {
    return false;
  }
}

export async function shareOrDownloadOrderNote(
  order: OrderNote,
  receiptElement: HTMLElement,
  ownerPhone?: string
): Promise<ShareOrderResult> {
  const blob = await generateReceiptPngBlob(receiptElement);
  const filename = `Order-Notes-${order.orderId}.png`;
  const file = new File([blob], filename, { type: "image/png" });
  const summaryText = buildOrderSummaryText(order);

  // Mode 1: Mobile / Supported Browser Web Share API dengan File
  const canNativeShare =
    typeof navigator !== "undefined" &&
    typeof navigator.canShare === "function" &&
    typeof navigator.share === "function" &&
    navigator.canShare({ files: [file] });

  if (canNativeShare) {
    try {
      await navigator.share({
        files: [file],
        title: `Order Notes #${order.orderId}`,
        text: summaryText,
      });
      return { mode: "native-share", summaryText, copiedImage: false };
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        throw err;
      }
    }
  }

  // Mode 2: Desktop / Unsupported Browser Fallback
  // Salin GAMBAR PNG ke clipboard selagi tab masih fokus agar user tinggal Ctrl+V di WhatsApp!
  const copiedImage = await copyImageBlobToClipboard(blob);
  triggerDownloadBlob(blob, filename);

  const waUrl = buildWhatsAppUrl(summaryText, ownerPhone);
  if (typeof window !== "undefined") {
    window.open(waUrl, "_blank", "noopener,noreferrer");
  }

  return { mode: "fallback", summaryText, copiedImage };
}
