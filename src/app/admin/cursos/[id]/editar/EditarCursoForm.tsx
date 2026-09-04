"use client";

import { useActionState } from "react";
import Link from "next/link";
import Button from "@/design-system/atoms/Button";
import FormField from "@/design-system/molecules/FormField";
import { editarCurso } from "../../actions";

interface EditarCursoFormProps {
  cursoId: string;
  nomeAtual: string;
  descricaoAtual: string;
  certificadoAtivoAtual: boolean;
  capaHorizontalAtual: string | null;
  capaVerticalAtual: string | null;
  assinanteNomeAtual: string | null;
  assinanteRegistroAtual: string | null;
  assinanteCargoAtual: string | null;
  assinaturaUrlAtual: string | null;
}

export default function EditarCursoForm({
  cursoId,
  nomeAtual,
  descricaoAtual,
  certificadoAtivoAtual,
  capaHorizontalAtual,
  capaVerticalAtual,
  assinanteNomeAtual,
  assinanteRegistroAtual,
  assinanteCargoAtual,
  assinaturaUrlAtual,
}: EditarCursoFormProps) {
  const [error, formAction, isPending] = useActionState(editarCurso.bind(null, cursoId), null);

  return (
    <form action={formAction} className="space-y-5">
      <FormField id="nome" name="nome" label="Nome do curso" defaultValue={nomeAtual} required autoFocus />

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
          defaultValue={descricaoAtual}
          className="w-full rounded-2xl border border-outline-variant bg-surface px-4 py-3 text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">
            Capa horizontal (banner)
          </label>
          {capaHorizontalAtual && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={capaHorizontalAtual}
              alt=""
              className="w-full aspect-video object-cover rounded-2xl mb-2 bg-surface-container-high"
            />
          )}
          <input
            type="file"
            name="capa_horizontal"
            accept="image/*"
            className="w-full text-sm text-on-surface-variant file:mr-3 file:rounded-full file:border-0 file:bg-primary-container file:text-on-primary-container file:px-4 file:py-2 file:text-xs file:font-bold file:uppercase file:tracking-widest"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">
            Capa vertical (pôster)
          </label>
          {capaVerticalAtual && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={capaVerticalAtual}
              alt=""
              className="w-full aspect-[2/3] object-cover rounded-2xl mb-2 bg-surface-container-high"
            />
          )}
          <input
            type="file"
            name="capa_vertical"
            accept="image/*"
            className="w-full text-sm text-on-surface-variant file:mr-3 file:rounded-full file:border-0 file:bg-primary-container file:text-on-primary-container file:px-4 file:py-2 file:text-xs file:font-bold file:uppercase file:tracking-widest"
          />
        </div>
      </div>

      <div className="border-t border-outline-variant pt-5 space-y-4">
        <label className="flex items-center gap-3 text-sm text-on-surface cursor-pointer">
          <input
            type="checkbox"
            name="certificado_ativo"
            defaultChecked={certificadoAtivoAtual}
            className="h-4 w-4 rounded border-outline-variant accent-primary"
          />
          Emitir certificado ao concluir este curso
        </label>
        <p className="text-xs text-on-surface-variant -mt-2">
          O modelo do certificado (logo, título, texto) é o mesmo pra todos os cursos — configurável
          em Configurações → Certificado. Aqui você define quem valida este curso específico.
        </p>

        <div className="grid grid-cols-3 gap-4">
          <FormField
            id="assinante_nome"
            name="assinante_nome"
            label="Nome de quem valida"
            defaultValue={assinanteNomeAtual ?? ""}
            placeholder="Dra. Fulana de Tal"
            className="col-span-2"
          />
          <FormField
            id="assinante_registro"
            name="assinante_registro"
            label="Registro (RQE, CRM...)"
            defaultValue={assinanteRegistroAtual ?? ""}
            placeholder="RQE: 30533"
          />
        </div>
        <FormField
          id="assinante_cargo"
          name="assinante_cargo"
          label="Cargo"
          defaultValue={assinanteCargoAtual ?? ""}
          placeholder="Coordenadora de T&D"
        />

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">
            Imagem da assinatura (opcional)
          </label>
          {assinaturaUrlAtual && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={assinaturaUrlAtual}
              alt=""
              className="h-16 object-contain mb-2 bg-surface-container-low rounded-lg px-3"
            />
          )}
          <input
            type="file"
            name="assinatura"
            accept="image/*"
            className="w-full text-sm text-on-surface-variant file:mr-3 file:rounded-full file:border-0 file:bg-primary-container file:text-on-primary-container file:px-4 file:py-2 file:text-xs file:font-bold file:uppercase file:tracking-widest"
          />
        </div>
      </div>

      {error && (
        <p className="text-sm text-error bg-error-container/40 rounded-xl px-4 py-2">{error}</p>
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Salvando..." : "Salvar"}
        </Button>
        <Link href={`/admin/cursos/${cursoId}`}>
          <Button type="button" variant="ghost">
            Cancelar
          </Button>
        </Link>
      </div>
    </form>
  );
}
