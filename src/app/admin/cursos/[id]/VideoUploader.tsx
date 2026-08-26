"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, Loader2 } from "lucide-react";
import { iniciarUploadVideo } from "../actions";

interface VideoUploaderProps {
  aulaId: string;
  cursoId: string;
}

export default function VideoUploader({ aulaId, cursoId }: VideoUploaderProps) {
  const [status, setStatus] = useState<"idle" | "enviando" | "erro">("idle");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatus("enviando");
    try {
      const uploadURL = await iniciarUploadVideo(aulaId, cursoId);

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(uploadURL, { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload falhou");

      router.refresh();
    } catch {
      setStatus("erro");
      return;
    }
    setStatus("idle");
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <label className="text-[10px] font-bold uppercase tracking-widest text-primary bg-primary-container px-2 py-1 rounded-pill flex items-center gap-1 cursor-pointer hover:opacity-80 flex-shrink-0">
      {status === "enviando" ? (
        <Loader2 size={12} className="animate-spin" />
      ) : (
        <Upload size={12} />
      )}
      {status === "enviando" ? "enviando..." : status === "erro" ? "tentar de novo" : "upload"}
      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={handleChange}
        disabled={status === "enviando"}
      />
    </label>
  );
}
