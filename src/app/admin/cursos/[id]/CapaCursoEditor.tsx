"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import Button from "@/design-system/atoms/Button";
import { BUCKETS, validarArquivo } from "@/lib/storage/buckets";
import { enviarArquivoDireto } from "@/lib/storage/upload-direto-client";
import { definirCapaCurso, removerCapaCurso } from "../actions";

interface CapaCursoEditorProps {
  cursoId: string;
  tipo: "horizontal" | "vertical";
  urlAtual: string | null;
}

const CONFIG = {
  horizontal: { rotulo: "Capa horizontal (banner)", aspecto: "aspect-video" },
  vertical: { rotulo: "Capa vertical (pôster)", aspecto: "aspect-[2/3]" },
} as const;

// Troca/remove a capa na hora (upload direto ao Storage), sem depender do botão
// "Salvar" do formulário em volta — por isso todos os botões aqui são type="button".
export default function CapaCursoEditor({ cursoId, tipo, urlAtual }: CapaCursoEditorProps) {
  const { rotulo, aspecto } = CONFIG[tipo];
  const [url, setUrl] = useState(urlAtual);
  const [progresso, setProgresso] = useState<number | null>(null);
  const [confirmandoRemocao, setConfirmandoRemocao] = useState(false);
  const [removendo, setRemovendo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const ocupado = progresso !== null || removendo;

  async function handleArquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (inputRef.current) inputRef.current.value = "";
    if (!file) return;

    setErro(null);
    const invalido = validarArquivo("capas", file);
    if (invalido) return setErro(invalido);

    setProgresso(0);
    try {
      const caminho = await enviarArquivoDireto("capas", cursoId, file, setProgresso);
      const res = await definirCapaCurso(cursoId, tipo, caminho);
      if ("erro" in res) throw new Error(res.erro);
      setUrl(res.url);
      router.refresh();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Falha ao enviar a imagem.");
    } finally {
      setProgresso(null);
    }
  }

  async function handleRemover() {
    setErro(null);
    setRemovendo(true);
    try {
      const res = await removerCapaCurso(cursoId, tipo);
      if ("erro" in res) throw new Error(res.erro);
      setUrl(null);
      router.refresh();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Falha ao remover a imagem.");
    } finally {
      setRemovendo(false);
      setConfirmandoRemocao(false);
    }
  }

  return (
    <div>
      <p className="block text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">
        {rotulo}
      </p>

      <div
        className={`relative w-full ${aspecto} rounded-2xl overflow-hidden bg-surface-container-high mb-2`}
      >
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-on-surface-variant">
            Sem imagem
          </div>
        )}
        {progresso !== null && (
          <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-2 text-white text-sm font-semibold">
            <Loader2 size={20} className="animate-spin" />
            Enviando {progresso}%
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={() => inputRef.current?.click()}
          disabled={ocupado}
          className="inline-flex items-center gap-1.5"
        >
          <ImagePlus size={14} /> {url ? "Trocar imagem" : "Enviar imagem"}
        </Button>

        {url && !confirmandoRemocao && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setConfirmandoRemocao(true)}
            disabled={ocupado}
            className="inline-flex items-center gap-1.5"
          >
            <Trash2 size={14} /> Remover imagem
          </Button>
        )}

        {url && confirmandoRemocao && (
          <span className="inline-flex flex-wrap items-center gap-2 text-sm text-on-surface">
            Remover esta imagem?
            <Button type="button" size="sm" variant="danger" onClick={handleRemover} disabled={removendo}>
              {removendo ? "Removendo..." : "Sim, remover"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setConfirmandoRemocao(false)}
              disabled={removendo}
            >
              Cancelar
            </Button>
          </span>
        )}

        <input
          ref={inputRef}
          type="file"
          accept={BUCKETS.capas.tiposAceitos.join(",")}
          className="hidden"
          onChange={handleArquivo}
        />
      </div>

      <p className="text-xs text-on-surface-variant mt-2">Imagem de até {BUCKETS.capas.maxBytes / 1024 / 1024} MB.</p>
      {erro && (
        <p className="text-sm text-error bg-error-container/40 rounded-xl px-4 py-2 mt-2">{erro}</p>
      )}
    </div>
  );
}
