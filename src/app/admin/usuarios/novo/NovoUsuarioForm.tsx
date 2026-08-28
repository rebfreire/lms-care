"use client";

import { useActionState } from "react";
import { CheckCircle2 } from "lucide-react";
import Button from "@/design-system/atoms/Button";
import FormField from "@/design-system/molecules/FormField";
import { criarUsuarioManual, type ResultadoCriacao } from "../actions";

interface NovoUsuarioFormProps {
  turmas: { id: string; nome: string }[];
}

export default function NovoUsuarioForm({ turmas }: NovoUsuarioFormProps) {
  const [resultado, formAction, isPending] = useActionState<string | ResultadoCriacao | null, FormData>(
    criarUsuarioManual,
    null,
  );

  if (resultado && typeof resultado !== "string") {
    return (
      <div className="bg-success-container text-success rounded-card-lg p-6 space-y-2">
        <p className="flex items-center gap-2 font-semibold">
          <CheckCircle2 size={18} /> Usuário criado com sucesso
        </p>
        <p className="text-sm">
          Enviamos um e-mail para <span className="font-semibold">{resultado.emailConvite}</span> com
          um link para definir a própria senha.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      <FormField id="nome" name="nome" label="Nome" required autoFocus />
      <FormField id="email" name="email" type="email" label="E-mail" required />

      <div>
        <label className="block text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">
          Papel
        </label>
        <select
          name="papel"
          defaultValue="aluno"
          className="w-full rounded-2xl border border-outline-variant bg-surface px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
        >
          <option value="aluno">Aluno</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      <div>
        <label className="block text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">
          Turma (opcional)
        </label>
        <select
          name="turma_id"
          defaultValue=""
          className="w-full rounded-2xl border border-outline-variant bg-surface px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
        >
          <option value="">Nenhuma</option>
          {turmas.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nome}
            </option>
          ))}
        </select>
      </div>

      {typeof resultado === "string" && (
        <p className="text-sm text-error bg-error-container/40 rounded-xl px-4 py-2">{resultado}</p>
      )}

      <Button type="submit" disabled={isPending}>
        {isPending ? "Criando..." : "Criar usuário"}
      </Button>
    </form>
  );
}
