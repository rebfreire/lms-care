"use client";

import { useActionState } from "react";
import Button from "@/design-system/atoms/Button";
import FormField from "@/design-system/molecules/FormField";
import { atualizarCertificadoConfig } from "../actions";

interface CertificadoConfigFormProps {
  trilhaId: string;
  assinanteNomeAtual: string | null;
  assinanteCargoAtual: string | null;
  assinaturaUrlAtual: string | null;
}

export default function CertificadoConfigForm({
  trilhaId,
  assinanteNomeAtual,
  assinanteCargoAtual,
  assinaturaUrlAtual,
}: CertificadoConfigFormProps) {
  const [error, formAction, isPending] = useActionState(
    atualizarCertificadoConfig.bind(null, trilhaId),
    null,
  );

  return (
    <form action={formAction} className="space-y-4">
      <p className="text-sm text-on-surface-variant">
        Preenchido, o nome e cargo aparecem impressos no certificado como validação de quem
        responde pelo treinamento — útil pra auditoria (ex.: normas ISO). Deixe em branco pra não
        incluir bloco de assinatura.
      </p>

      <div className="grid grid-cols-2 gap-4">
        <FormField
          id="assinante_nome"
          name="assinante_nome"
          label="Nome de quem valida"
          defaultValue={assinanteNomeAtual ?? ""}
          placeholder="Dra. Fulana de Tal"
        />
        <FormField
          id="assinante_cargo"
          name="assinante_cargo"
          label="Cargo"
          defaultValue={assinanteCargoAtual ?? ""}
          placeholder="Coordenadora de T&D"
        />
      </div>

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

      {error && <p className="text-sm text-error bg-error-container/40 rounded-xl px-4 py-2">{error}</p>}

      <Button type="submit" size="sm" disabled={isPending}>
        {isPending ? "Salvando..." : "Salvar certificado"}
      </Button>
    </form>
  );
}
