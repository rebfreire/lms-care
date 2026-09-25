"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, Loader2 } from "lucide-react";
import { iniciarUploadVideo, confirmarUploadVideo } from "../actions";

interface VideoUploaderProps {
  aulaId: string;
  cursoId: string;
  /** "pill" é o selo compacto da lista de aulas; "botao" é o botão da tela de editar aula. */
  variante?: "pill" | "botao";
  rotulo?: string;
}

// XHR em vez de fetch só pra ter o evento de progresso do upload.
function enviarComProgresso(url: string, file: File, onProgresso: (pct: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgresso(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error()));
    xhr.onerror = () => reject(new Error());
    const formData = new FormData();
    formData.append("file", file);
    xhr.send(formData);
  });
}

export default function VideoUploader({
  aulaId,
  cursoId,
  variante = "pill",
  rotulo = "enviar vídeo",
}: VideoUploaderProps) {
  const [status, setStatus] = useState<"idle" | "enviando" | "erro">("idle");
  const [progresso, setProgresso] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatus("enviando");
    setProgresso(0);
    try {
      const { uid, uploadURL } = await iniciarUploadVideo();
      await enviarComProgresso(uploadURL, file, setProgresso);
      await confirmarUploadVideo(aulaId, cursoId, uid);
      router.refresh();
    } catch {
      setStatus("erro");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    setStatus("idle");
    if (inputRef.current) inputRef.current.value = "";
  }

  const texto =
    status === "enviando"
      ? `enviando ${progresso}%`
      : status === "erro"
        ? "falhou, tentar de novo"
        : rotulo;

  const classes =
    variante === "pill"
      ? "text-[10px] font-bold uppercase tracking-widest text-primary bg-primary-container px-2 py-1 rounded-pill gap-1"
      : "text-sm font-semibold text-primary bg-surface border border-primary/30 hover:bg-primary-container/40 px-4 py-2 rounded-pill gap-2";

  return (
    <label
      className={`${classes} inline-flex items-center flex-shrink-0 ${
        status === "enviando" ? "cursor-wait" : "cursor-pointer hover:opacity-80"
      }`}
    >
      {status === "enviando" ? (
        <Loader2 size={variante === "pill" ? 12 : 16} className="animate-spin" />
      ) : (
        <Upload size={variante === "pill" ? 12 : 16} />
      )}
      {texto}
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
