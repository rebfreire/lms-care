import Link from "next/link";
import { Upload, UserPlus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/design-system/organisms/PageHeader";
import Button from "@/design-system/atoms/Button";
import CriarTurmaForm from "./CriarTurmaForm";
import TurmaItem from "./TurmaItem";
import AtribuirTrilhaTurma from "./AtribuirTrilhaTurma";
import UsuariosTable from "./UsuariosTable";
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
          <UsuariosTable
            usuarios={(usuarios ?? []).map((u) => ({
              id: u.id,
              nome: u.nome,
              email: u.email,
              papel: u.papel,
              turma: (u.usuarios_turmas as unknown as { turmas: { nome: string } }[])
                ?.map((ut) => ut.turmas?.nome)
                .filter(Boolean)
                .join(", "),
            }))}
          />
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
