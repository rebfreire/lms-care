import Link from "next/link";
import { Upload, Users2, UserPlus, Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/design-system/organisms/PageHeader";
import Button from "@/design-system/atoms/Button";
import CriarTurmaForm from "./CriarTurmaForm";
import TurmaItem from "./TurmaItem";
import AtribuirTrilhaTurma from "./AtribuirTrilhaTurma";
import { removerAtribuicao } from "./actions";

export default async function UsuariosPage() {
  const supabase = await createClient();

  const [{ data: usuarios }, { data: turmas }, { data: trilhas }, { data: atribuicoes }] =
    await Promise.all([
      supabase
        .from("usuarios")
        .select("id, nome, email, papel, usuarios_turmas(turmas(nome))")
        .order("nome"),
      supabase.from("turmas").select("id, nome").order("nome"),
      supabase.from("trilhas").select("id, nome").order("nome"),
      supabase
        .from("atribuicoes_trilha")
        .select("id, trilha_id, turma_id, trilhas(nome), turmas(nome)"),
    ]);

  return (
    <div>
      <PageHeader
        title="Usuários e turmas"
        description="Cadastro manual — sem autoatendimento."
        actions={
          <div className="flex gap-2">
            <Link href="/admin/usuarios/novo">
              <Button variant="secondary" className="inline-flex items-center gap-2">
                <UserPlus size={18} /> Novo usuário
              </Button>
            </Link>
            <Link href="/admin/usuarios/importar">
              <Button className="inline-flex items-center gap-2">
                <Upload size={18} /> Importar CSV
              </Button>
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface rounded-card-lg shadow-soft overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] font-bold uppercase tracking-widest text-on-surface-variant border-b border-outline-variant">
                  <th className="px-6 py-3">Nome</th>
                  <th className="px-6 py-3">E-mail</th>
                  <th className="px-6 py-3">Turma</th>
                  <th className="px-6 py-3">Papel</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody>
                {usuarios?.map((u) => (
                  <tr key={u.id} className="border-b border-outline-variant last:border-0">
                    <td className="px-6 py-3 text-on-surface">{u.nome}</td>
                    <td className="px-6 py-3 text-on-surface-variant">{u.email}</td>
                    <td className="px-6 py-3 text-on-surface-variant">
                      {(u.usuarios_turmas as unknown as { turmas: { nome: string } }[])
                        ?.map((ut) => ut.turmas?.nome)
                        .filter(Boolean)
                        .join(", ") || "—"}
                    </td>
                    <td className="px-6 py-3 text-on-surface-variant capitalize">{u.papel}</td>
                    <td className="px-6 py-3">
                      <Link
                        href={`/admin/usuarios/${u.id}/editar`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-on-surface-variant hover:text-primary"
                      >
                        <Pencil size={12} /> editar
                      </Link>
                    </td>
                  </tr>
                ))}
                {(!usuarios || usuarios.length === 0) && (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-on-surface-variant">
                      <Users2 className="mx-auto mb-2 text-outline" size={24} />
                      Nenhum usuário ainda — importe um CSV.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-surface rounded-card-lg p-6 shadow-soft">
            <h3 className="text-sm font-bold uppercase tracking-widest text-on-surface-variant mb-4">
              Turmas
            </h3>
            <ul className="space-y-1 mb-4">
              {turmas?.map((t) => (
                <TurmaItem key={t.id} turmaId={t.id} nome={t.nome} />
              ))}
              {(!turmas || turmas.length === 0) && (
                <p className="text-sm text-on-surface-variant">Nenhuma turma ainda.</p>
              )}
            </ul>
            <CriarTurmaForm />
          </div>

          <div className="bg-surface rounded-card-lg p-6 shadow-soft">
            <h3 className="text-sm font-bold uppercase tracking-widest text-on-surface-variant mb-4">
              Atribuir trilha por turma
            </h3>
            <AtribuirTrilhaTurma turmas={turmas ?? []} trilhas={trilhas ?? []} />

            <ul className="space-y-1 mt-4">
              {atribuicoes
                ?.filter((a) => a.turma_id)
                .map((a) => (
                  <li
                    key={a.id}
                    className="flex items-center justify-between text-sm px-3 py-1.5 rounded-lg bg-surface-container-low"
                  >
                    <span>
                      {(a.turmas as unknown as { nome: string })?.nome} →{" "}
                      {(a.trilhas as unknown as { nome: string })?.nome}
                    </span>
                    <form action={removerAtribuicao.bind(null, a.id)}>
                      <button type="submit" className="text-xs text-error hover:underline">
                        remover
                      </button>
                    </form>
                  </li>
                ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
