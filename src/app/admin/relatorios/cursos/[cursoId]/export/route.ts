import { NextResponse } from "next/server";
import { getUsuarioAtual } from "@/lib/supabase/auth";
import { getRelatorioCursoDetalhado, getNomeCurso } from "@/lib/relatorios";

export async function GET(_request: Request, { params }: { params: Promise<{ cursoId: string }> }) {
  const usuario = await getUsuarioAtual();
  if (!usuario || usuario.papel !== "admin") {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  const { cursoId } = await params;
  const nomeCurso = await getNomeCurso(cursoId);
  if (!nomeCurso) return NextResponse.json({ error: "Curso não encontrado." }, { status: 404 });

  const alunos = await getRelatorioCursoDetalhado(cursoId);

  const linhas = [
    "nome,email,turma,percentual,status,concluido_em",
    ...alunos.map((a) =>
      [a.nome, a.email, a.turma ?? "", a.percentual, a.status, a.concluidoEm ?? ""]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(","),
    ),
  ];

  return new NextResponse(linhas.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="relatorio-${nomeCurso.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.csv"`,
    },
  });
}
