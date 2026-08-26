"use client";

import { useActionState } from "react";
import Button from "@/design-system/atoms/Button";
import FormField from "@/design-system/molecules/FormField";
import { atualizarConfiguracoes } from "./actions";

interface ConfiguracoesFormProps {
  nomeAtual: string;
  corAtual: string;
  logoAtual: string | null;
}

export default function ConfiguracoesForm({ nomeAtual, corAtual, logoAtual }: ConfiguracoesFormProps) {
  const [error, formAction, isPending] = useActionState(atualizarConfiguracoes, null);

  return (
    <form action={formAction} className="space-y-6">
      <FormField id="nome" name="nome" label="Nome do sistema/empresa" defaultValue={nomeAtual} required />

      <div>
        <label
          htmlFor="cor_primaria"
          className="block text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-2"
        >
          Cor primária
        </label>
        <input
          id="cor_primaria"
          name="cor_primaria"
          type="color"
          defaultValue={corAtual}
          className="h-11 w-20 rounded-xl border border-outline-variant cursor-pointer"
        />
      </div>

      <div>
        <label
          htmlFor="logo"
          className="block text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-2"
        >
          Logo
        </label>
        {logoAtual && (
          <img src={logoAtual} alt="Logo atual" className="h-12 mb-3 rounded-lg" />
        )}
        <input
          id="logo"
          name="logo"
          type="file"
          accept="image/*"
          className="text-sm text-on-surface-variant"
        />
      </div>

      {error && (
        <p className="text-sm text-error bg-error-container/40 rounded-xl px-4 py-2">{error}</p>
      )}

      <Button type="submit" disabled={isPending}>
        {isPending ? "Salvando..." : "Salvar"}
      </Button>
    </form>
  );
}
