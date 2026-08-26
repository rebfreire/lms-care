import { notFound } from "next/navigation";
import { CheckCircle2, Circle } from "lucide-react";
import PageHeader from "@/design-system/organisms/PageHeader";
import { createClient } from "@/lib/supabase/server";
import { getTrilhaDoAluno } from "@/lib/trilha";

export default async function FichaAlunoPage({
  params,
}: {
  params: Promise<{ usuarioId: string }>;
}) {
  const { usuarioId } = await params;
  const supabase = await createClient();

  const { data: aluno } = await supabase
    .from("usuarios")
    .select("id, nome, email")
    .eq("id", usuarioId)
    .single();

  if (!aluno) notFound();

  const [trilha, { data: progressos }, { data: tentativas }] = await Promise.all([
    getTrilhaDoAluno(usuarioId),
    supabase
      .from("progresso")
      .select("aula_id, concluida, concluida_em, ultimo_acesso_em, percentual_assistido")
      .eq("usuario_id", usuarioId),
    supabase
      .from("tentativas_quiz")
      .select("id, nota, aprovado, respondida_em, quizzes(nome, aulas(titulo))")
      .eq("usuario_id", usuarioId)
      .order("respondida_em", { ascending: false }),
  ]);

  const progressoPorAula = new Map((progressos ?? []).map((p) => [p.aula_id, p]));

  return (
    <div>
      <PageHeader title={aluno.nome} description={aluno.email} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-3">
            Progresso por aula
          </h3>
          {!trilha ? (
            <p className="text-on-surface-variant">Sem trilha atribuída.</p>
          ) : (
            <div className="space-y-4">
              {trilha.cursos.map((curso) => (
                <div key={curso.id} className="bg-surface rounded-card-lg p-5 shadow-soft">
                  <p className="text-sm font-headline font-bold text-on-surface mb-2">{curso.nome}</p>
                  <ul className="space-y-1">
                    {curso.modulos.flatMap((m) => m.aulas).map((aula) => {
                      const p = progressoPorAula.get(aula.id);
                      return (
                        <li key={aula.id} className="flex items-center gap-2 text-sm py-1">
                          {p?.concluida ? (
                            <CheckCircle2 size={14} className="text-success flex-shrink-0" />
                          ) : (
                            <Circle size={14} className="text-outline flex-shrink-0" />
                          )}
                          <span className="flex-1 text-on-surface-variant">{aula.titulo}</span>
                          <span className="text-xs text-outline">
                            {p?.concluida_em
                              ? new Date(p.concluida_em).toLocaleDateString("pt-BR")
                              : p?.ultimo_acesso_em
                              ? `visto ${new Date(p.ultimo_acesso_em).toLocaleDateString("pt-BR")}`
                              : "não iniciado"}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-3">
            Resultados de quiz
          </h3>
          <div className="bg-surface rounded-card-lg shadow-soft overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] font-bold uppercase tracking-widest text-on-surface-variant border-b border-outline-variant">
                  <th className="px-4 py-3">Quiz</th>
                  <th className="px-4 py-3">Nota</th>
                  <th className="px-4 py-3">Data</th>
                </tr>
              </thead>
              <tbody>
                {tentativas?.map((t) => {
                  const quizInfo = t.quizzes as unknown as { nome: string; aulas: { titulo: string } };
                  return (
                    <tr key={t.id} className="border-b border-outline-variant last:border-0">
                      <td className="px-4 py-3">
                        <p className="text-on-surface">{quizInfo?.nome}</p>
                        <p className="text-xs text-on-surface-variant">{quizInfo?.aulas?.titulo}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={t.aprovado ? "text-success font-semibold" : "text-error font-semibold"}>
                          {t.nota}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-on-surface-variant">
                        {new Date(t.respondida_em).toLocaleDateString("pt-BR")}
                      </td>
                    </tr>
                  );
                })}
                {(!tentativas || tentativas.length === 0) && (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-on-surface-variant">
                      Nenhuma tentativa de quiz ainda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
