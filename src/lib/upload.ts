import { publicSupabaseConfig } from "./supabase/public";
import type { Flipbook } from "./types";

async function readError(response: Response, fallback: string): Promise<string> {
  const body = await response.json().catch(() => null);
  return typeof body?.error === "string" ? body.error : fallback;
}

async function postJson<T>(url: string, payload: unknown, fallback: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error("Network error. Check your connection and try again.");
  }
  if (!response.ok) throw new Error(await readError(response, fallback));
  return response.json() as Promise<T>;
}

/** PUTs a file to a Supabase signed upload URL, reporting progress (0–1). */
function uploadToSignedUrl(
  signedUrl: string,
  file: Blob,
  onProgress?: (fraction: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", signedUrl);
    xhr.setRequestHeader("x-upsert", "true");
    // Public (publishable) key only; the signed URL's token authorises the upload.
    const apiKey = publicSupabaseConfig.publishableKey;
    if (apiKey) xhr.setRequestHeader("apikey", apiKey);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress?.(event.loaded / event.total);
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) return resolve();
      let message = "The upload failed. Please try again.";
      try {
        const body = JSON.parse(xhr.responseText);
        if (xhr.status === 413 || /size/i.test(body?.message ?? "")) {
          message = "This file exceeds the storage upload limit.";
        } else if (/mime/i.test(body?.message ?? "")) {
          message = "This file type is not allowed.";
        }
      } catch {
        // keep the generic message
      }
      reject(new Error(message));
    };
    xhr.onerror = () => reject(new Error("Network error during upload. Check your connection and try again."));
    xhr.ontimeout = () => reject(new Error("The upload timed out. Please try again."));

    // Same shape supabase-js uses for signed uploads.
    const form = new FormData();
    form.append("cacheControl", "3600"); // short, so deleted brochures stop being served soon
    form.append("", file);
    xhr.send(form);
  });
}

export async function createFlipbookFromPdf(options: {
  file: File;
  cover: Blob | null;
  title: string;
  pageCount: number;
  onProgress: (fraction: number) => void;
}): Promise<Flipbook> {
  const { file, cover, title, pageCount, onProgress } = options;

  const prepared = await postJson<{ id: string; pdfUploadUrl: string; thumbnailUploadUrl: string }>(
    "/api/flipbooks/prepare",
    { fileSize: file.size },
    "Could not start the upload.",
  );

  onProgress(0);
  // Re-wrap so the MIME type is always correct (some systems report "" for PDFs).
  const pdf = new File([file], "document.pdf", { type: "application/pdf" });
  await uploadToSignedUrl(prepared.pdfUploadUrl, pdf, (f) => onProgress(f * 0.97));

  if (cover) {
    const thumbnail = new File([cover], "thumbnail.jpg", { type: "image/jpeg" });
    // A missing thumbnail shouldn't block the flipbook; the dashboard falls back gracefully.
    await uploadToSignedUrl(prepared.thumbnailUploadUrl, thumbnail).catch((error) =>
      console.warn("Thumbnail upload failed", error),
    );
  }
  onProgress(0.99);

  const { flipbook } = await postJson<{ flipbook: Flipbook }>(
    "/api/flipbooks",
    { id: prepared.id, title, pageCount },
    "Could not save the flipbook.",
  );
  onProgress(1);
  return flipbook;
}
