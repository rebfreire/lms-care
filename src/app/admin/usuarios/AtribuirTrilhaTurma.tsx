import Button from "@/design-system/atoms/Button";
import { atribuirTrilhaATurma } from "./actions";

interface AtribuirTrilhaTurmaProps {
  turmas: { id: string; nome: string }[];
  trilhas: { id: string; nome: string }[];
}

export default function AtribuirTrilhaTurma({ turmas, trilhas }: AtribuirTrilhaTurmaProps) {
  if (turmas.length === 0 || trilhas.length === 0) {
    return (
      <p className="text-sm text-on-surface-variant">
        Crie ao menos uma turma e uma trilha para atribuir.
      </p>
    );
  }

  return (
    <form action={atribuirTrilhaATurma} className="space-y-2">
      <select
        name="turma_id"
        required
        className="w-full rounded-2xl border border-outline-variant bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
      >
        <option value="">Turma...</option>
        {turmas.map((t) => (
          <option key={t.id} value={t.id}>
            {t.nome}
          </option>
        ))}
      </select>
      <select
        name="trilha_id"
        required
        className="w-full rounded-2xl border border-outline-variant bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
      >
        <option value="">Trilha...</option>
        {trilhas.map((t) => (
          <option key={t.id} value={t.id}>
            {t.nome}
          </option>
        ))}
      </select>
      <Button type="submit" size="sm" className="w-full">
        Atribuir
      </Button>
    </form>
  );
}
