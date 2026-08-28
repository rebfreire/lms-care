import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CheckCircle2, Lock, PlayCircle, ArrowLeft } from "lucide-react";
import ProgressBar from "@/design-system/atoms/ProgressBar";
import Button from "@/design-system/atoms/Button";
import { getUsuarioAtual } from "@/lib/supabase/auth";
import { getTrilhaDoAluno } from "@/lib/trilha";
import { createClient } from "@/lib/supabase/server";

export default async function CursoAlunoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const usuario = await getUsuarioAtual();
  if (!usuario) redirect("/login");

  const trilha = await getTrilhaDoAluno(usuario.id);
  const curso = trilha?.cursos.find((c) => c.id === id);
  if (!curso) notFound();
  if (curso.bloqueado) redirect("/aluno");

  const supabase = await createClient();
  const { data: cursoInfo } = await supabase.from("cursos").select("descricao").eq("id", id).single();

  const aulas = curso.modulos.flatMap((m) => m.aulas);
  const concluidas = aulas.filter((a) => a.concluida).length;
  const progresso = aulas.length > 0 ? Math.round((concluidas / aulas.length) * 100) : 0;
  const proximaAula = aulas.find((a) => !a.concluida && a.disponivel);

  return (
    <div>
      <Link href="/aluno" className="inline-flex items-center gap-2 text-sm text-on-surface-variant hover:text-primary mb-4">
        <ArrowLeft size={16} /> Voltar pra trilha
      </Link>

      <div className="bg-surface rounded-card-lg p-8 shadow-soft mb-6">
        <h1 className="text-2xl font-headline font-bold text-on-surface mb-2">{curso.nome}</h1>
        {cursoInfo?.descricao && (
          <p className="text-sm text-on-surface-variant mb-5 max-w-2xl">{cursoInfo.descricao}</p>
        )}
        <ProgressBar value={progresso} label={`${concluidas}/${aulas.length} conteúdos`} className="max-w-md" />
        {proximaAula && (
          <Link href={`/aluno/aulas/${proximaAula.id}`} className="inline-block mt-5">
            <Button className="inline-flex items-center gap-2">
              <PlayCircle size={18} /> {concluidas > 0 ? "Continuar assistindo" : "Começar"}
            </Button>
          </Link>
        )}
      </div>

      <div className="space-y-6">
        {curso.modulos.map((modulo) => (
          <div key={modulo.id} className="bg-surface rounded-card-lg p-6 shadow-soft">
            <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-3">
              {modulo.nome}
            </h3>
            <ul className="space-y-1">
              {modulo.aulas.map((aula) =>
                aula.disponivel ? (
                  <li key={aula.id}>
                    <Link
                      href={`/aluno/aulas/${aula.id}`}
                      className="flex items-center gap-2 text-sm py-2 text-on-surface-variant hover:text-primary"
                    >
                      {aula.concluida ? (
                        <CheckCircle2 size={14} className="text-success flex-shrink-0" />
                      ) : (
                        <PlayCircle size={14} className="flex-shrink-0" />
                      )}
                      {aula.titulo}
                    </Link>
                  </li>
                ) : (
                  <li key={aula.id} className="flex items-center gap-2 text-sm py-2 text-outline">
                    <Lock size={14} className="flex-shrink-0" />
                    {aula.titulo}
                    {aula.liberacaoEm && (
                      <span className="text-xs">
                        — libera em {new Date(aula.liberacaoEm).toLocaleDateString("pt-BR")}
                      </span>
                    )}
                  </li>
                ),
              )}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
