import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download, CheckCircle2, Circle, PlayCircle } from "lucide-react";
import PageHeader from "@/design-system/organisms/PageHeader";
import ProgressBar from "@/design-system/atoms/ProgressBar";
import { getRelatorioCursoDetalhado, getNomeCurso } from "@/lib/relatorios";

const STATUS_ESTILO = {
  "concluído": "bg-success-container text-success",
  "em andamento": "bg-warning-container text-warning",
  "não iniciado": "bg-surface-container-high text-on-surface-variant",
};

const STATUS_ICONE = {
  "concluído": CheckCircle2,
  "em andamento": PlayCircle,
  "não iniciado": Circle,
};

export default async function RelatorioCursoPage({
  params,
}: {
  params: Promise<{ cursoId: string }>;
}) {
  const { cursoId } = await params;
  const nomeCurso = await getNomeCurso(cursoId);
  if (!nomeCurso) notFound();

  const alunos = await getRelatorioCursoDetalhado(cursoId);
  const concluidos = alunos.filter((a) => a.status === "concluído").length;

  return (
    <div>
      <Link
        href="/admin/relatorios"
        className="inline-flex items-center gap-2 text-sm text-on-surface-variant hover:text-primary mb-4"
      >
        <ArrowLeft size={16} /> Voltar aos relatórios
      </Link>

      <PageHeader
        title={nomeCurso}
        description={`${concluidos} de ${alunos.length} concluíram este curso — lista completa pra auditoria/conferência.`}
        actions={
          <a href={`/admin/relatorios/cursos/${cursoId}/export`}>
            <span className="inline-flex items-center gap-2 rounded-pill bg-primary text-on-primary px-5 py-2.5 text-sm font-semibold hover:opacity-90 cursor-pointer">
              <Download size={16} /> Exportar CSV
            </span>
          </a>
        }
      />

      <div className="bg-surface rounded-card-lg shadow-soft overflow-hidden overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] font-bold uppercase tracking-widest text-on-surface-variant border-b border-outline-variant">
              <th className="px-6 py-3">Nome</th>
              <th className="px-6 py-3">Turma</th>
              <th className="px-6 py-3">Progresso</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Concluído em</th>
            </tr>
          </thead>
          <tbody>
            {alunos
              .sort((a, b) => a.nome.localeCompare(b.nome))
              .map((a) => {
                const Icone = STATUS_ICONE[a.status];
                return (
                  <tr key={a.id} className="border-b border-outline-variant last:border-0">
                    <td className="px-6 py-3">
                      <p className="text-on-surface font-medium">{a.nome}</p>
                      <p className="text-xs text-on-surface-variant">{a.email}</p>
                    </td>
                    <td className="px-6 py-3 text-on-surface-variant">{a.turma ?? "—"}</td>
                    <td className="px-6 py-3 w-40">
                      <ProgressBar value={a.percentual} />
                    </td>
                    <td className="px-6 py-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-pill px-3 py-1 text-xs font-bold uppercase tracking-widest ${STATUS_ESTILO[a.status]}`}
                      >
                        <Icone size={12} /> {a.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-on-surface-variant">
                      {a.concluidoEm ? new Date(a.concluidoEm).toLocaleDateString("pt-BR") : "—"}
                    </td>
                  </tr>
                );
              })}
            {alunos.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-on-surface-variant">
                  Nenhum aluno com acesso a este curso.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
