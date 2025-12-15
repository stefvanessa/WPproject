// src/api/removeBg.ts
export type RemoveBgOptions = {
  /** Your backend base URL. Example: "http://localhost:4000" */
  baseUrl?: string;
  /** Called with upload progress [0..100] when available */
  onProgress?: (percent: number) => void;
  /** Abort support */
  signal?: AbortSignal;
  /** Override the API path if needed */
  path?: string; // default: "/api/remove-bg"
};

export async function removeClothingBackground(
  file: File,
  opts: RemoveBgOptions = {}
): Promise<Blob> {
  const baseUrl = (opts.baseUrl ?? "").replace(/\/+$/, "");
  const path = opts.path ?? "/api/remove-bg";
  const url = `${baseUrl}${path}`;

  // If you want upload progress, use XHR.
  // (Fetch doesn't reliably expose upload progress.)
  return await uploadWithProgress(url, file, opts);
}

function uploadWithProgress(
  url: string,
  file: File,
  opts: RemoveBgOptions
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url, true);
    xhr.responseType = "blob";

    xhr.onload = () => {
      const ok = xhr.status >= 200 && xhr.status < 300;
      if (!ok) {
        // Try to read server error message if it returned JSON/text
        const msg = `remove-bg failed (${xhr.status})`;
        reject(new Error(msg));
        return;
      }

      const ct = xhr.getResponseHeader("Content-Type") ?? "";
      // Expect image/png (transparent)
      if (!ct.includes("image/")) {
        reject(new Error(`Unexpected response content-type: ${ct}`));
        return;
      }

      resolve(xhr.response);
    };

    xhr.onerror = () => reject(new Error("Network error while uploading"));
    xhr.onabort = () => reject(new Error("Upload aborted"));

    // Upload progress
    if (opts.onProgress) {
      xhr.upload.onprogress = (e) => {
        if (!e.lengthComputable) return;
        const percent = Math.round((e.loaded / e.total) * 100);
        opts.onProgress?.(percent);
      };
    }

    // Abort support
    if (opts.signal) {
      if (opts.signal.aborted) {
        xhr.abort();
        return;
      }
      opts.signal.addEventListener("abort", () => xhr.abort(), { once: true });
    }

    const form = new FormData();
    form.append("image", file); // backend should use field name "image"
    xhr.send(form);
  });
}
