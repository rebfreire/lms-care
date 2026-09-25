"use client";

import { useActionState, useState } from "react";
import { FileText, Link2, Pencil, Trash2 } from "lucide-react";
import Button from "@/design-system/atoms/Button";
import { editarMaterial, removerMaterial } from "../../../../actions";

export interface Material {
  id: string;
  tipo: "arquivo" | "link";
  nome: string;
  url: string;
}

const INPUT =
  "w-full rounded-2xl border border-outline-variant bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary";

export default function MaterialItem({
  material,
  cursoId,
  aulaId,
}: {
  material: Material;
  cursoId: string;
  aulaId: string;
}) {
  const [modo, setModo] = useState<"ver" | "editar" | "excluir">("ver");
  const [erro, formAction, isPending] = useActionState(
    async (prev: string | null, formData: FormData) => {
      const resultado = await editarMaterial(material.id, cursoId, aulaId, prev, formData);
      // Sem erro: fecha o formulário (a lista já vem atualizada pelo revalidatePath).
      if (!resultado) setModo("ver");
      return resultado;
    },
    null,
  );

  const Icone = material.tipo === "arquivo" ? FileText : Link2;

  if (modo === "editar") {
    return (
      <li className="px-4 py-3 rounded-2xl bg-surface-container-low">
        <form action={formAction} className="space-y-3">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">
              Nome exibido
            </label>
            <input name="nome" defaultValue={material.nome} required autoFocus className={INPUT} />
          </div>

          {material.tipo === "link" ? (
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">
                URL
              </label>
              <input name="url" type="url" defaultValue={material.url} required className={INPUT} />
            </div>
          ) : (
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">
                Substituir arquivo (opcional)
              </label>
              <input
                type="file"
                name="arquivo"
                className="w-full text-sm text-on-surface-variant file:mr-3 file:rounded-pill file:border-0 file:bg-surface-container-high file:px-3 file:py-1.5 file:text-xs file:font-semibold"
              />
            </div>
          )}

          {erro && (
            <p className="text-sm text-error bg-error-container/40 rounded-xl px-4 py-2">{erro}</p>
          )}

          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending ? "Salvando..." : "Salvar"}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setModo("ver")}>
              Cancelar
            </Button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className="flex flex-wrap items-center gap-3 px-4 py-2.5 rounded-2xl bg-surface-container-low">
      <Icone size={16} className="text-on-surface-variant flex-shrink-0" />
      <a
        href={material.url}
        target="_blank"
        rel="noreferrer"
        className="text-sm text-on-surface flex-1 min-w-0 hover:text-primary truncate"
      >
        {material.nome}
      </a>

      {modo === "excluir" ? (
        <div className="flex items-center gap-2">
          <span className="text-xs text-on-surface">Excluir?</span>
          <form action={removerMaterial.bind(null, material.id, cursoId, aulaId)}>
            <button
              type="submit"
              className="rounded-pill bg-error text-on-error px-3 py-1 text-xs font-semibold hover:opacity-90"
            >
              Confirmar
            </button>
          </form>
          <button
            type="button"
            onClick={() => setModo("ver")}
            className="text-xs font-semibold text-on-surface-variant hover:underline"
          >
            Cancelar
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            type="button"
            onClick={() => setModo("editar")}
            className="inline-flex items-center gap-1 text-xs font-semibold text-on-surface-variant hover:text-primary px-2 py-1 rounded-pill hover:bg-surface-container-high"
          >
            <Pencil size={14} /> Editar
          </button>
          <button
            type="button"
            onClick={() => setModo("excluir")}
            className="inline-flex items-center gap-1 text-xs font-semibold text-on-surface-variant hover:text-error px-2 py-1 rounded-pill hover:bg-surface-container-high"
          >
            <Trash2 size={14} /> Excluir
          </button>
        </div>
      )}
    </li>
  );
}
