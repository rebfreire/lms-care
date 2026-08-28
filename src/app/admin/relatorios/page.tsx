import Link from "next/link";
import { Download, Users, CheckCircle2, Activity, MoonStar, ChevronRight } from "lucide-react";
import PageHeader from "@/design-system/organisms/PageHeader";
import StatCard from "@/design-system/molecules/StatCard";
import { getRelatorioAlunos, getRelatorioCursos, type AlunoRelatorio } from "@/lib/relatorios";

const ENGAJAMENTO_ESTILO: Record<AlunoRelatorio["engajamento"], string> = {
  ativo: "bg-success-container text-success",
  inativo: "bg-warning-container text-warning",
  "não iniciado": "bg-surface-container-high text-on-surface-variant",
};

export default async function RelatoriosPage() {
  const [alunos, cursos] = await Promise.all([getRelatorioAlunos(), getRelatorioCursos()]);

  const total = alunos.length;
  const ativos = alunos.filter((a) => a.engajamento === "ativo").length;
  const inativos = alunos.filter((a) => a.engajamento === "inativo").length;
  const concluiramTudo = alunos.filter((a) => a.totalAulas > 0 && a.percentual === 100).length;

  return (
    <div>
      <PageHeader
        title="Relatórios"
        description="Progresso e engajamento por aluno."
        actions={
          <a href="/admin/relatorios/export">
            <span className="inline-flex items-center gap-2 rounded-pill bg-primary text-on-primary px-5 py-2.5 text-sm font-semibold hover:opacity-90 cursor-pointer">
              <Download size={16} /> Exportar CSV
            </span>
          </a>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <StatCard icon={<Users size={22} />} label="Total de alunos" value={total} />
        <StatCard icon={<Activity size={22} />} label="Ativos (14 dias)" value={ativos} variant="primary" />
        <StatCard icon={<MoonStar size={22} />} label="Inativos" value={inativos} />
        <StatCard icon={<CheckCircle2 size={22} />} label="Concluíram a trilha" value={concluiramTudo} variant="accent" />
      </div>

      <div className="bg-surface rounded-card-lg shadow-soft overflow-hidden overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] font-bold uppercase tracking-widest text-on-surface-variant border-b border-outline-variant">
              <th className="px-6 py-3">Nome</th>
              <th className="px-6 py-3">Turma</th>
              <th className="px-6 py-3">Progresso</th>
              <th className="px-6 py-3">Último acesso</th>
              <th className="px-6 py-3">Engajamento</th>
            </tr>
          </thead>
          <tbody>
            {alunos.map((a) => (
              <tr key={a.id} className="border-b border-outline-variant last:border-0">
                <td className="px-6 py-3">
                  <Link href={`/admin/relatorios/${a.id}`} className="text-on-surface hover:text-primary font-medium">
                    {a.nome}
                  </Link>
                  <p className="text-xs text-on-surface-variant">{a.email}</p>
                </td>
                <td className="px-6 py-3 text-on-surface-variant">{a.turma ?? "—"}</td>
                <td className="px-6 py-3 text-on-surface-variant">
                  {a.totalAulas > 0 ? `${a.aulasConcluidas}/${a.totalAulas} (${a.percentual}%)` : "sem trilha"}
                </td>
                <td className="px-6 py-3 text-on-surface-variant">
                  {a.ultimoAcesso ? new Date(a.ultimoAcesso).toLocaleDateString("pt-BR") : "nunca"}
                </td>
                <td className="px-6 py-3">
                  <span
                    className={`inline-flex items-center rounded-pill px-3 py-1 text-xs font-bold uppercase tracking-widest ${ENGAJAMENTO_ESTILO[a.engajamento]}`}
                  >
                    {a.engajamento}
                  </span>
                </td>
              </tr>
            ))}
            {alunos.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-on-surface-variant">
                  Nenhum aluno ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <h2 className="text-lg font-headline font-bold text-on-surface mt-10 mb-1">Progresso por curso</h2>
      <p className="text-sm text-on-surface-variant mb-4">
        Visão agregada por curso — clique em um curso para ver a lista nominal (útil pra
        auditoria/conferência de normas como ISO) com status e data de conclusão de cada pessoa.
      </p>
      <div className="bg-surface rounded-card-lg shadow-soft overflow-hidden overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] font-bold uppercase tracking-widest text-on-surface-variant border-b border-outline-variant">
              <th className="px-6 py-3">Curso</th>
              <th className="px-6 py-3">Inscritos</th>
              <th className="px-6 py-3">Não iniciaram</th>
              <th className="px-6 py-3">Em andamento</th>
              <th className="px-6 py-3">Concluíram</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {cursos.map((c) => (
              <tr key={c.id} className="border-b border-outline-variant last:border-0 hover:bg-surface-container-low">
                <td className="px-6 py-3">
                  <Link href={`/admin/relatorios/cursos/${c.id}`} className="text-on-surface hover:text-primary font-medium">
                    {c.nome}
                  </Link>
                </td>
                <td className="px-6 py-3 text-on-surface-variant">{c.totalAlunos}</td>
                <td className="px-6 py-3 text-on-surface-variant">{c.naoIniciaram}</td>
                <td className="px-6 py-3 text-on-surface-variant">{c.emAndamento}</td>
                <td className="px-6 py-3 text-on-surface-variant">{c.concluidos}</td>
                <td className="px-6 py-3">
                  <Link href={`/admin/relatorios/cursos/${c.id}`} className="text-on-surface-variant hover:text-primary">
                    <ChevronRight size={16} />
                  </Link>
                </td>
              </tr>
            ))}
            {cursos.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-on-surface-variant">
                  Nenhum curso com conteúdo ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
