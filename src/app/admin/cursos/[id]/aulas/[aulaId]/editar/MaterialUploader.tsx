"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/design-system/atoms/Button";
import ProgressBar from "@/design-system/atoms/ProgressBar";
import { enviarArquivoDireto } from "@/lib/storage/upload-direto-client";
import { validarArquivo } from "@/lib/storage/buckets";
import { confirmarMaterialArquivo } from "../../../../actions";

export default function MaterialUploader({ cursoId, aulaId }: { cursoId: string; aulaId: string }) {
  const [enviando, setEnviando] = useState(false);
  const [progresso, setProgresso] = useState(0);
  const [erro, setErro] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const arquivo = inputRef.current?.files?.[0];
    if (!arquivo) return;

    const invalido = validarArquivo("materiais", arquivo);
    if (invalido) {
      setErro(invalido);
      return;
    }

    setErro(null);
    setProgresso(0);
    setEnviando(true);
    try {
      const caminho = await enviarArquivoDireto("materiais", aulaId, arquivo, setProgresso);
      const falha = await confirmarMaterialArquivo(aulaId, cursoId, caminho, arquivo.name);
      if (falha) throw new Error(falha);
      if (inputRef.current) inputRef.current.value = "";
      router.refresh();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao enviar o arquivo.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          required
          disabled={enviando}
          onChange={() => setErro(null)}
          className="flex-1 min-w-[200px] text-sm text-on-surface-variant file:mr-3 file:rounded-pill file:border-0 file:bg-surface-container-high file:px-3 file:py-1.5 file:text-xs file:font-semibold"
        />
        <Button type="submit" size="sm" variant="secondary" disabled={enviando}>
          {enviando ? `Enviando ${progresso}%` : "Anexar arquivo"}
        </Button>
      </div>
      {enviando && <ProgressBar value={progresso} />}
      {erro && (
        <p role="alert" className="text-sm text-error bg-error-container/40 rounded-xl px-4 py-2">
          {erro}
        </p>
      )}
    </form>
  );
}
