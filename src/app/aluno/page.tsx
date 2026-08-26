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
    .find((a) => !a.concluida);

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

      <div className="space-y-4">
        {trilha.cursos.map((curso) => (
          <div key={curso.id} className="bg-surface rounded-card-lg p-6 shadow-soft">
            <div className="flex items-center gap-3 mb-3">
              {curso.concluido ? (
                <CheckCircle2 className="text-success flex-shrink-0" size={20} />
              ) : curso.bloqueado ? (
                <Lock className="text-outline flex-shrink-0" size={20} />
              ) : (
                <PlayCircle className="text-primary flex-shrink-0" size={20} />
              )}
              <h3 className="text-lg font-headline font-bold text-on-surface flex-1">
                {curso.nome}
              </h3>
            </div>

            {curso.bloqueado ? (
              <p className="text-sm text-on-surface-variant pl-8">
                Conclua o curso anterior para desbloquear.
              </p>
            ) : (
              <ul className="pl-8 space-y-1">
                {curso.modulos.flatMap((m) => m.aulas).map((aula) => (
                  <li key={aula.id}>
                    <Link
                      href={`/aluno/aulas/${aula.id}`}
                      className="flex items-center gap-2 text-sm py-1.5 text-on-surface-variant hover:text-primary"
                    >
                      {aula.concluida ? (
                        <CheckCircle2 size={14} className="text-success flex-shrink-0" />
                      ) : (
                        <PlayCircle size={14} className="flex-shrink-0" />
                      )}
                      {aula.titulo}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
