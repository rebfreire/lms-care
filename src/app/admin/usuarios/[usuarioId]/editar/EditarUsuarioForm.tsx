"use client";

import { useActionState } from "react";
import Link from "next/link";
import { KeyRound, Trash2 } from "lucide-react";
import Button from "@/design-system/atoms/Button";
import FormField from "@/design-system/molecules/FormField";
import { editarUsuario, resetarSenha, removerUsuario } from "../../actions";

interface EditarUsuarioFormProps {
  usuarioId: string;
  nomeAtual: string;
  emailAtual: string;
  papelAtual: string;
  turmaIdAtual: string;
  turmas: { id: string; nome: string }[];
}

export default function EditarUsuarioForm({
  usuarioId,
  nomeAtual,
  emailAtual,
  papelAtual,
  turmaIdAtual,
  turmas,
}: EditarUsuarioFormProps) {
  const [error, formAction, isPending] = useActionState(editarUsuario.bind(null, usuarioId), null);
  const [novaSenha, resetAction, isResetting] = useActionState(resetarSenha.bind(null, usuarioId), null);

  return (
    <div className="space-y-6">
      <form action={formAction} className="space-y-5">
        <FormField id="nome" name="nome" label="Nome" defaultValue={nomeAtual} required autoFocus />
        <FormField id="email" name="email" type="email" label="E-mail" defaultValue={emailAtual} required />

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">
            Papel
          </label>
          <select
            name="papel"
            defaultValue={papelAtual}
            className="w-full rounded-2xl border border-outline-variant bg-surface px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
          >
            <option value="aluno">Aluno</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">
            Turma
          </label>
          <select
            name="turma_id"
            defaultValue={turmaIdAtual}
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

        {error && (
          <p className="text-sm text-error bg-error-container/40 rounded-xl px-4 py-2">{error}</p>
        )}

        <div className="flex gap-2">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Salvando..." : "Salvar"}
          </Button>
          <Link href="/admin/usuarios">
            <Button type="button" variant="ghost">
              Cancelar
            </Button>
          </Link>
        </div>
      </form>

      <div className="border-t border-outline-variant pt-5 space-y-3">
        <form action={resetAction}>
          <Button
            type="submit"
            variant="secondary"
            size="sm"
            disabled={isResetting}
            className="inline-flex items-center gap-2"
          >
            <KeyRound size={14} /> {isResetting ? "Gerando..." : "Resetar senha"}
          </Button>
        </form>
        {novaSenha && (
          <p className="text-sm bg-surface-container-low rounded-xl px-4 py-2">
            Nova senha temporária: <span className="font-mono font-bold">{novaSenha}</span>
          </p>
        )}

        <form action={removerUsuario.bind(null, usuarioId)}>
          <button
            type="submit"
            className="inline-flex items-center gap-2 text-sm text-error hover:underline"
          >
            <Trash2 size={14} /> Remover usuário
          </button>
        </form>
      </div>
    </div>
  );
}
