"use client";
import { useState } from "react";
import { toast } from "sonner";
import { checkUploadFile } from "@/lib/admin/labels";
import { prepareImage } from "@/lib/admin/prepare-image";
import type { ActionResultWith } from "@/lib/admin/action";

type Uploader = (fd: FormData) => Promise<ActionResultWith<{ url: string }>>;

/**
 * Uploads files one by one through a server action and reports errors as toasts.
 * Big photos are shrunk in the browser first (Vercel request limit is 4.5 MB).
 * Returns the URLs that were uploaded successfully, in the order of the selected files.
 */
export function useUpload(action: Uploader, extra?: Record<string, string>) {
  const [pending, setPending] = useState(0);

  async function upload(files: FileList | File[]): Promise<string[]> {
    const list = Array.from(files);
    const valid: File[] = [];
    for (const f of list) {
      const err = checkUploadFile(f);
      if (err) toast.error(err);
      else valid.push(f);
    }
    if (!valid.length) return [];

    setPending((n) => n + valid.length);
    const urls: string[] = [];
    for (const file of valid) {
      const fd = new FormData();
      fd.append("file", await prepareImage(file));
      for (const [k, v] of Object.entries(extra ?? {})) fd.append(k, v);
      try {
        const res = await action(fd);
        if (res.ok) urls.push(res.url);
        else toast.error(`«${file.name}»: ${res.error}`);
      } catch {
        toast.error(`«${file.name}»: не удалось загрузить — файл слишком большой для сервера или нет связи`);
      } finally {
        setPending((n) => n - 1);
      }
    }
    return urls;
  }

  return { upload, pending };
}
