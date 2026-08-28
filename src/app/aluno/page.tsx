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

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
        {trilha.cursos.map((curso) => {
          const aulasDoCurso = curso.modulos.flatMap((m) => m.aulas);
          const concluidasDoCurso = aulasDoCurso.filter((a) => a.concluida).length;
          const progressoCurso =
            aulasDoCurso.length > 0 ? Math.round((concluidasDoCurso / aulasDoCurso.length) * 100) : 0;

          const conteudo = (
            <div className="h-full flex flex-col">
              <div className="relative aspect-[2/3] rounded-card-lg overflow-hidden shadow-soft bg-surface-container-high">
                {curso.capaVerticalUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={curso.capaVerticalUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <PlayCircle className="text-outline" size={40} />
                  </div>
                )}

                {curso.bloqueado && (
                  <div className="absolute inset-0 bg-on-background/60 flex items-center justify-center">
                    <Lock className="text-white" size={28} />
                  </div>
                )}

                {curso.concluido && (
                  <div className="absolute top-2 right-2 bg-success text-on-primary rounded-full p-1">
                    <CheckCircle2 size={16} />
                  </div>
                )}

                {!curso.bloqueado && !curso.concluido && progressoCurso > 0 && (
                  <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/30">
                    <div className="h-full bg-primary" style={{ width: `${progressoCurso}%` }} />
                  </div>
                )}
              </div>

              <h3 className="text-sm font-headline font-bold text-on-surface mt-3 leading-snug">
                {curso.nome}
              </h3>
              <p className="text-xs text-on-surface-variant mt-1">
                {curso.bloqueado
                  ? "Bloqueado"
                  : `${concluidasDoCurso}/${aulasDoCurso.length} aulas`}
              </p>
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
