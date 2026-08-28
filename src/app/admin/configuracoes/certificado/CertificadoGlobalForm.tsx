"use client";

import { useActionState, useState } from "react";
import { Eye } from "lucide-react";
import Button from "@/design-system/atoms/Button";
import FormField from "@/design-system/molecules/FormField";
import { atualizarCertificadoGlobal } from "../actions";

interface CertificadoGlobalFormProps {
  ativoAtual: boolean;
  tituloAtual: string;
  textoAtual: string;
}

const TEXTO_PADRAO =
  'Certificamos que {{nome}} concluiu com êxito o curso "{{curso}}", promovido por {{empresa}} em {{data}}.';

export default function CertificadoGlobalForm({ ativoAtual, tituloAtual, textoAtual }: CertificadoGlobalFormProps) {
  const [error, formAction, isPending] = useActionState(atualizarCertificadoGlobal, null);
  const [ativo, setAtivo] = useState(ativoAtual);

  return (
    <form action={formAction} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-on-surface">Publicação</p>
          <p className="text-xs text-on-surface-variant">Ativar certificado para alunos?</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={ativo}
          onClick={() => setAtivo((v) => !v)}
          className={`relative h-7 w-12 rounded-pill transition-colors flex-shrink-0 ${
            ativo ? "bg-primary" : "bg-surface-container-high"
          }`}
        >
          <span
            className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-soft transition-transform ${
              ativo ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
        <input type="hidden" name="certificado_ativo" value={ativo ? "on" : "off"} />
      </div>

      <div className="border-t border-outline-variant pt-6 space-y-4">
        <div>
          <p className="text-sm font-semibold text-on-surface">Personalizar certificado</p>
          <p className="text-xs text-on-surface-variant mt-1">
            O logo da empresa (configurado em Personalização) aparece automaticamente no topo. Use as
            tags <code className="bg-surface-container-low px-1 rounded">{"{{nome}}"}</code>,{" "}
            <code className="bg-surface-container-low px-1 rounded">{"{{curso}}"}</code>,{" "}
            <code className="bg-surface-container-low px-1 rounded">{"{{empresa}}"}</code> e{" "}
            <code className="bg-surface-container-low px-1 rounded">{"{{data}}"}</code> no texto — cada
            uma é trocada automaticamente pelo valor real na hora de gerar o certificado do aluno. Quem
            valida cada curso é configurado na edição do próprio curso.
          </p>
        </div>

        <FormField
          id="titulo"
          name="titulo"
          label="Título"
          defaultValue={tituloAtual}
          placeholder="Certificado de Conclusão"
        />

        <div>
          <label
            htmlFor="texto"
            className="block text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-2"
          >
            Texto do certificado
          </label>
          <textarea
            id="texto"
            name="texto"
            rows={4}
            defaultValue={textoAtual}
            placeholder={TEXTO_PADRAO}
            className="w-full rounded-2xl border border-outline-variant bg-surface px-4 py-3 text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors"
          />
        </div>
      </div>

      {error && <p className="text-sm text-error bg-error-container/40 rounded-xl px-4 py-2">{error}</p>}

      <div className="flex gap-2 items-center">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Salvando..." : "Salvar"}
        </Button>
        <span className="text-xs text-on-surface-variant">Salve antes de visualizar as mudanças.</span>
        <a
          href="/admin/configuracoes/certificado/preview"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-pill bg-surface text-primary border border-primary/30 hover:bg-primary-container/40 px-5 py-2.5 text-sm font-semibold"
        >
          <Eye size={16} /> Visualizar certificado
        </a>
      </div>
    </form>
  );
}
