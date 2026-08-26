import { NextResponse } from "next/server";
import { getUsuarioAtual } from "@/lib/supabase/auth";
import { getRelatorioAlunos } from "@/lib/relatorios";

export async function GET() {
  const usuario = await getUsuarioAtual();
  if (!usuario || usuario.papel !== "admin") {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  const alunos = await getRelatorioAlunos();

  const linhas = [
    "nome,email,turma,trilha,aulas_concluidas,total_aulas,percentual,ultimo_acesso,engajamento",
    ...alunos.map((a) =>
      [
        a.nome,
        a.email,
        a.turma ?? "",
        a.trilhaNome ?? "",
        a.aulasConcluidas,
        a.totalAulas,
        a.percentual,
        a.ultimoAcesso ?? "",
        a.engajamento,
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(","),
    ),
  ];

  return new NextResponse(linhas.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="relatorio-alunos.csv"`,
    },
  });
}
