import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Activity, Gauge, CheckCircle2, LogIn } from "lucide-react";
import ProgressBar from "@/design-system/atoms/ProgressBar";
import { createClient } from "@/lib/supabase/server";
import { getTrilhaDoAluno } from "@/lib/trilha";

const DIAS_PARA_INATIVO = 14;

const ENGAJAMENTO_ESTILO = {
  ativo: "text-success",
  inativo: "text-warning",
  "não iniciado": "text-on-surface-variant",
};

const STATUS_CURSO_ESTILO = {
  "concluído": "bg-success-container text-success",
  "em andamento": "bg-warning-container text-warning",
  "não iniciado": "bg-surface-container-high text-on-surface-variant",
};

function calcularEngajamento(ultimoAcesso: string | null): "não iniciado" | "ativo" | "inativo" {
  if (!ultimoAcesso) return "não iniciado";
  const diasDesde = (Date.now() - new Date(ultimoAcesso).getTime()) / (1000 * 60 * 60 * 24);
  return diasDesde <= DIAS_PARA_INATIVO ? "ativo" : "inativo";
}

function iniciais(nome: string) {
  const partes = nome.trim().split(/\s+/);
  const primeiras = partes[0]?.[0] ?? "";
  const ultimas = partes.length > 1 ? partes[partes.length - 1][0] : "";
  return (primeiras + ultimas).toUpperCase();
}

export default async function FichaAlunoPage({
  params,
}: {
  params: Promise<{ usuarioId: string }>;
}) {
  const { usuarioId } = await params;
  const supabase = await createClient();

  const { data: aluno } = await supabase
    .from("usuarios")
    .select("id, nome, email, criado_em")
    .eq("id", usuarioId)
    .single();

  if (!aluno) notFound();

  const [trilha, { data: progressos }, { data: tentativas }, { data: acessos }, { data: turmaLink }] =
    await Promise.all([
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
      supabase
        .from("eventos_acesso")
        .select("id, ocorrido_em")
        .eq("usuario_id", usuarioId)
        .order("ocorrido_em", { ascending: false }),
      supabase.from("usuarios_turmas").select("turmas(nome)").eq("usuario_id", usuarioId).maybeSingle(),
    ]);

  const turmaNome = (turmaLink?.turmas as unknown as { nome: string } | null)?.nome ?? null;

  const aulaTituloPorId = new Map(
    (trilha?.cursos ?? []).flatMap((c) => c.modulos.flatMap((m) => m.aulas.map((a) => [a.id, a.titulo] as const))),
  );

  type EventoHistorico = { data: string; texto: string };
  const historico: EventoHistorico[] = [
    ...(acessos ?? []).map((e) => ({ data: e.ocorrido_em, texto: "Sessão iniciada (login)" })),
    ...(progressos ?? [])
      .filter((p) => p.concluida_em)
      .map((p) => ({
        data: p.concluida_em as string,
        texto: `Concluiu a aula "${aulaTituloPorId.get(p.aula_id) ?? "—"}"`,
      })),
  ].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

  // Estatísticas gerais da trilha.
  const todasAulas = trilha?.cursos.flatMap((c) => c.modulos.flatMap((m) => m.aulas)) ?? [];
  const concluidasNaTrilha = todasAulas.filter((a) => a.concluida).length;
  const progressoMedio = todasAulas.length > 0 ? Math.round((concluidasNaTrilha / todasAulas.length) * 100) : 0;

  const primeiroAcesso = acessos && acessos.length > 0 ? acessos[acessos.length - 1].ocorrido_em : null;
  const ultimoAcesso = acessos && acessos.length > 0 ? acessos[0].ocorrido_em : null;

  const engajamento = calcularEngajamento(ultimoAcesso);

  return (
    <div>
      <Link
        href="/admin/relatorios"
        className="inline-flex items-center gap-2 text-sm text-on-surface-variant hover:text-primary mb-4"
      >
        <ArrowLeft size={16} /> Voltar aos relatórios
      </Link>

      <div className="flex items-center gap-4 mb-6">
        <div className="h-14 w-14 rounded-full bg-primary text-on-primary flex items-center justify-center font-headline font-bold text-lg flex-shrink-0">
          {iniciais(aluno.nome)}
        </div>
        <div>
          <h1 className="text-2xl font-headline font-bold text-on-surface">{aluno.nome}</h1>
          <p className="text-sm text-on-surface-variant">{aluno.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <div className="bg-surface rounded-card-lg p-6 shadow-soft">
          <p className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant flex items-center gap-2 mb-3">
            <Gauge size={14} /> Progresso médio
          </p>
          <p className="text-3xl font-headline font-bold text-on-surface mb-3">{progressoMedio}%</p>
          <ProgressBar value={progressoMedio} />
        </div>
        <div className="bg-surface rounded-card-lg p-6 shadow-soft">
          <p className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant flex items-center gap-2 mb-3">
            <Activity size={14} /> Engajamento
          </p>
          <p className={`text-3xl font-headline font-bold capitalize ${ENGAJAMENTO_ESTILO[engajamento]}`}>
            {engajamento}
          </p>
        </div>
      </div>

      <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-3">
        Informações e dados pessoais
      </h3>
      <div className="bg-surface rounded-card-lg shadow-soft p-6 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 mb-8 text-sm">
        <div className="flex justify-between border-b border-outline-variant pb-2">
          <span className="text-on-surface-variant">Nome completo</span>
          <span className="text-on-surface font-medium">{aluno.nome}</span>
        </div>
        <div className="flex justify-between border-b border-outline-variant pb-2">
          <span className="text-on-surface-variant">Conta criada em</span>
          <span className="text-on-surface font-medium">
            {new Date(aluno.criado_em).toLocaleDateString("pt-BR")}
          </span>
        </div>
        <div className="flex justify-between border-b border-outline-variant pb-2">
          <span className="text-on-surface-variant">E-mail</span>
          <span className="text-on-surface font-medium">{aluno.email}</span>
        </div>
        <div className="flex justify-between border-b border-outline-variant pb-2">
          <span className="text-on-surface-variant">Primeiro acesso</span>
          <span className="text-on-surface font-medium">
            {primeiroAcesso ? new Date(primeiroAcesso).toLocaleString("pt-BR") : "nunca"}
          </span>
        </div>
        <div className="flex justify-between border-b border-outline-variant pb-2">
          <span className="text-on-surface-variant">Turma</span>
          <span className="text-on-surface font-medium">{turmaNome ?? "—"}</span>
        </div>
        <div className="flex justify-between border-b border-outline-variant pb-2">
          <span className="text-on-surface-variant">Último acesso</span>
          <span className="text-on-surface font-medium">
            {ultimoAcesso ? new Date(ultimoAcesso).toLocaleString("pt-BR") : "nunca"}
          </span>
        </div>
        <div className="flex justify-between pb-2">
          <span className="text-on-surface-variant">Quantidade de acessos</span>
          <span className="text-on-surface font-medium">{acessos?.length ?? 0}</span>
        </div>
      </div>

      <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-3">Cursos</h3>
      <div className="bg-surface rounded-card-lg shadow-soft overflow-hidden overflow-x-auto mb-8">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] font-bold uppercase tracking-widest text-on-surface-variant border-b border-outline-variant">
              <th className="px-6 py-3">Curso</th>
              <th className="px-6 py-3">Progresso</th>
              <th className="px-6 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {trilha?.cursos.map((curso) => {
              const aulasDoCurso = curso.modulos.flatMap((m) => m.aulas);
              const concluidasDoCurso = aulasDoCurso.filter((a) => a.concluida).length;
              const percentual =
                aulasDoCurso.length > 0 ? Math.round((concluidasDoCurso / aulasDoCurso.length) * 100) : 0;
              const status =
                aulasDoCurso.length === 0
                  ? "não iniciado"
                  : concluidasDoCurso === aulasDoCurso.length
                  ? "concluído"
                  : concluidasDoCurso > 0
                  ? "em andamento"
                  : "não iniciado";

              return (
                <tr key={curso.id} className="border-b border-outline-variant last:border-0">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-secondary-container text-on-secondary-container flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {iniciais(curso.nome)}
                      </div>
                      <span className="text-on-surface font-medium">{curso.nome}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3 w-40">
                    <ProgressBar value={percentual} />
                  </td>
                  <td className="px-6 py-3">
                    <span
                      className={`inline-flex items-center rounded-pill px-3 py-1 text-xs font-bold uppercase tracking-widest ${STATUS_CURSO_ESTILO[status]}`}
                    >
                      {status}
                    </span>
                  </td>
                </tr>
              );
            })}
            {!trilha && (
              <tr>
                <td colSpan={3} className="px-6 py-10 text-center text-on-surface-variant">
                  Sem trilha atribuída.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-3">
            Histórico de acessos
          </h3>
          <div className="bg-surface rounded-card-lg shadow-soft p-5 max-h-80 overflow-y-auto">
            {historico.length === 0 ? (
              <p className="text-on-surface-variant text-sm">Nenhum acesso registrado ainda.</p>
            ) : (
              <ul className="space-y-3">
                {historico.map((e, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm">
                    {e.texto.startsWith("Sessão") ? (
                      <LogIn size={14} className="text-primary flex-shrink-0" />
                    ) : (
                      <CheckCircle2 size={14} className="text-success flex-shrink-0" />
                    )}
                    <span className="text-on-surface-variant flex-1">{e.texto}</span>
                    <span className="text-xs text-outline whitespace-nowrap">
                      {new Date(e.data).toLocaleString("pt-BR")}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
