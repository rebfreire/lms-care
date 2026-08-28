import Link from "next/link";
import { CheckCircle2, Lock, PlayCircle } from "lucide-react";
import PageHeader from "@/design-system/organisms/PageHeader";
import ProgressBar from "@/design-system/atoms/ProgressBar";
import Button from "@/design-system/atoms/Button";
import { getUsuarioAtual } from "@/lib/supabase/auth";
import { getTrilhaDoAluno } from "@/lib/trilha";

export default async function AlunoTrilha() {
  const usuario = await getUsuarioAtual();
  const trilha = usuario ? await getTrilhaDoAluno(usuario.id) : null;

  if (!trilha) {
    return (
      <div>
        <PageHeader title="Minha trilha" />
        <div className="bg-surface rounded-card-lg p-10 shadow-soft text-center text-on-surface-variant">
          Nenhuma trilha atribuída ainda. Fale com o administrador.
        </div>
      </div>
    );
  }

  const todasAulas = trilha.cursos.flatMap((c) => c.modulos.flatMap((m) => m.aulas));
  const concluidas = todasAulas.filter((a) => a.concluida).length;
  const progressoGeral = todasAulas.length > 0 ? Math.round((concluidas / todasAulas.length) * 100) : 0;

  const proximaAula = trilha.cursos
    .filter((c) => !c.bloqueado)
    .flatMap((c) => c.modulos.flatMap((m) => m.aulas))
    .find((a) => !a.concluida && a.disponivel);

  return (
    <div>
      <PageHeader title={trilha.nome} description={`${concluidas} de ${todasAulas.length} aulas concluídas`} />

      <div className="bg-surface rounded-card-lg p-6 shadow-soft mb-6">
        <ProgressBar value={progressoGeral} label="Progresso geral" />
        {proximaAula && (
          <Link href={`/aluno/aulas/${proximaAula.id}`} className="inline-block mt-4">
            <Button className="inline-flex items-center gap-2">
              <PlayCircle size={18} /> Continuar assistindo
            </Button>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {trilha.cursos.map((curso) => {
          const aulasDoCurso = curso.modulos.flatMap((m) => m.aulas);
          const concluidasDoCurso = aulasDoCurso.filter((a) => a.concluida).length;
          const progressoCurso =
            aulasDoCurso.length > 0 ? Math.round((concluidasDoCurso / aulasDoCurso.length) * 100) : 0;

          const conteudo = (
            <div className="bg-surface rounded-card-lg p-6 shadow-soft h-full flex flex-col">
              <div className="flex items-center gap-3 mb-3">
                {curso.concluido ? (
                  <CheckCircle2 className="text-success flex-shrink-0" size={20} />
                ) : curso.bloqueado ? (
                  <Lock className="text-outline flex-shrink-0" size={20} />
                ) : (
                  <PlayCircle className="text-primary flex-shrink-0" size={20} />
                )}
                <h3 className="text-lg font-headline font-bold text-on-surface flex-1">{curso.nome}</h3>
              </div>

              {curso.bloqueado ? (
                <p className="text-sm text-on-surface-variant">Conclua o curso anterior para desbloquear.</p>
              ) : (
                <div className="mt-auto pt-2">
                  <ProgressBar
                    value={progressoCurso}
                    label={`${concluidasDoCurso}/${aulasDoCurso.length} aulas`}
                  />
                </div>
              )}
            </div>
          );

          return curso.bloqueado ? (
            <div key={curso.id}>{conteudo}</div>
          ) : (
            <Link key={curso.id} href={`/aluno/cursos/${curso.id}`}>
              {conteudo}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
