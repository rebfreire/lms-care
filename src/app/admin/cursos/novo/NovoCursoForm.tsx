"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Button from "@/design-system/atoms/Button";
import FormField from "@/design-system/molecules/FormField";
import { BUCKETS, validarArquivo } from "@/lib/storage/buckets";
import { enviarArquivoDireto } from "@/lib/storage/upload-direto-client";
import { criarCurso, definirCapaCurso } from "../actions";

type Tipo = "horizontal" | "vertical";

const CAMPOS: { tipo: Tipo; rotulo: string; aspecto: string }[] = [
  { tipo: "horizontal", rotulo: "Capa horizontal (banner)", aspecto: "aspect-video" },
  { tipo: "vertical", rotulo: "Capa vertical (pôster)", aspecto: "aspect-[2/3]" },
];

export default function NovoCursoForm() {
  const router = useRouter();
  const [arquivos, setArquivos] = useState<Partial<Record<Tipo, File>>>({});
  const [previews, setPreviews] = useState<Partial<Record<Tipo, string>>>({});
  const [errosArquivo, setErrosArquivo] = useState<Partial<Record<Tipo, string>>>({});
  const [erro, setErro] = useState<string | null>(null);
  const [cursoCriadoId, setCursoCriadoId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  function escolher(tipo: Tipo, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (previews[tipo]) URL.revokeObjectURL(previews[tipo]!);

    const limpar = (msg?: string) => {
      setArquivos((a) => ({ ...a, [tipo]: undefined }));
      setPreviews((p) => ({ ...p, [tipo]: undefined }));
      setErrosArquivo((x) => ({ ...x, [tipo]: msg }));
    };

    if (!file) return limpar();
    const invalido = validarArquivo("capas", file);
    if (invalido) {
      e.target.value = "";
      return limpar(invalido);
    }
    setArquivos((a) => ({ ...a, [tipo]: file }));
    setPreviews((p) => ({ ...p, [tipo]: URL.createObjectURL(file) }));
    setErrosArquivo((x) => ({ ...x, [tipo]: undefined }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status) return;
    const form = new FormData(e.currentTarget);
    setErro(null);

    // Curso já criado numa tentativa anterior: só reenvia o que faltou.
    let cursoId = cursoCriadoId;
    if (!cursoId) {
      setStatus("Criando curso...");
      const res = await criarCurso(String(form.get("nome") ?? ""), String(form.get("descricao") ?? ""));
      if ("erro" in res) {
        setStatus(null);
        return setErro(res.erro);
      }
      cursoId = res.id;
      setCursoCriadoId(cursoId);
    }

    for (const { tipo, rotulo } of CAMPOS) {
      const file = arquivos[tipo];
      if (!file) continue;
      setStatus(`Enviando ${rotulo.toLowerCase()}...`);
      try {
        const caminho = await enviarArquivoDireto("capas", cursoId, file, () => {});
        const res = await definirCapaCurso(cursoId, tipo, caminho);
        if ("erro" in res) throw new Error(res.erro);
        setArquivos((a) => ({ ...a, [tipo]: undefined }));
      } catch (err) {
        setStatus(null);
        return setErro(
          `O curso foi criado, mas a ${rotulo.toLowerCase()} não foi enviada: ${
            err instanceof Error ? err.message : "falha desconhecida"
          }. Tente de novo ou envie depois na edição do curso.`,
        );
      }
    }

    router.push(`/admin/cursos/${cursoId}`);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <FormField
        id="nome"
        name="nome"
        label="Nome do curso"
        required
        autoFocus
        disabled={!!cursoCriadoId}
      />

      <div>
        <label
          htmlFor="descricao"
          className="block text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-2"
        >
          Descrição
        </label>
        <textarea
          id="descricao"
          name="descricao"
          rows={4}
          disabled={!!cursoCriadoId}
          className="w-full rounded-2xl border border-outline-variant bg-surface px-4 py-3 text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors disabled:opacity-60"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {CAMPOS.map(({ tipo, rotulo, aspecto }) => (
          <div key={tipo}>
            <label
              htmlFor={`capa_${tipo}`}
              className="block text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-2"
            >
              {rotulo} (opcional)
            </label>
            {previews[tipo] && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previews[tipo]}
                alt=""
                className={`w-full ${aspecto} object-cover rounded-2xl mb-2 bg-surface-container-high`}
              />
            )}
            <input
              id={`capa_${tipo}`}
              type="file"
              accept={BUCKETS.capas.tiposAceitos.join(",")}
              onChange={(e) => escolher(tipo, e)}
              disabled={!!status}
              className="w-full text-sm text-on-surface-variant file:mr-3 file:rounded-full file:border-0 file:bg-primary-container file:text-on-primary-container file:px-4 file:py-2 file:text-xs file:font-bold file:uppercase file:tracking-widest"
            />
            {errosArquivo[tipo] ? (
              <p className="text-sm text-error mt-2">{errosArquivo[tipo]}</p>
            ) : (
              <p className="text-xs text-on-surface-variant mt-2">Imagem de até {BUCKETS.capas.maxBytes / 1024 / 1024} MB.</p>
            )}
          </div>
        ))}
      </div>

      {erro && (
        <p className="text-sm text-error bg-error-container/40 rounded-xl px-4 py-2">{erro}</p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={!!status}>
          {status ?? (cursoCriadoId ? "Tentar enviar de novo" : "Criar curso")}
        </Button>
        {cursoCriadoId && !status && (
          <Link
            href={`/admin/cursos/${cursoCriadoId}`}
            className="text-sm font-semibold text-on-surface-variant hover:text-primary"
          >
            Ir para o curso sem capa
          </Link>
        )}
      </div>
    </form>
  );
}
