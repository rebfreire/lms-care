import { NextResponse } from "next/server";
import { getUsuarioAtual } from "@/lib/supabase/auth";
import { gerarCertificadoAmostra } from "@/lib/certificado";

export async function GET() {
  const usuario = await getUsuarioAtual();
  if (!usuario || usuario.papel !== "admin") {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  const pdfBytes = await gerarCertificadoAmostra(usuario.empresaId);

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="certificado-exemplo.pdf"`,
    },
  });
}
