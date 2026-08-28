import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getTrilhaDoAluno } from "@/lib/trilha";

async function trilhaCumpreRequisitosDeQuiz(usuarioId: string, aulaIds: string[]) {
  if (aulaIds.length === 0) return true;
  const supabase = await createClient();

  const { data: quizzes } = await supabase
    .from("quizzes")
    .select("id")
    .in("aula_id", aulaIds);

  if (!quizzes || quizzes.length === 0) return true;

  const { data: aprovadas } = await supabase
    .from("tentativas_quiz")
    .select("quiz_id")
    .eq("usuario_id", usuarioId)
    .eq("aprovado", true)
    .in(
      "quiz_id",
      quizzes.map((q) => q.id),
    );

  const quizIdsAprovados = new Set((aprovadas ?? []).map((a) => a.quiz_id));
  return quizzes.every((q) => quizIdsAprovados.has(q.id));
}

async function gerarPdfCertificado(nomeAluno: string, nomeTrilha: string, nomeEmpresa: string) {
  const doc = await PDFDocument.create();
  const page = doc.addPage([842, 595]); // A4 paisagem
  const { width, height } = page.getSize();

  const fontTitulo = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontCorpo = await doc.embedFont(StandardFonts.Helvetica);

  const verde = rgb(0.29, 0.486, 0.349); // #4a7c59
  const creme = rgb(0.98, 0.965, 0.941); // #faf6f0

  page.drawRectangle({ x: 0, y: 0, width, height, color: creme });
  page.drawRectangle({ x: 24, y: 24, width: width - 48, height: height - 48, borderColor: verde, borderWidth: 3 });

  const centralizar = (texto: string, fonte: typeof fontTitulo, tamanho: number) =>
    (width - fonte.widthOfTextAtSize(texto, tamanho)) / 2;

  const titulo = "Certificado de Conclusão";
  page.drawText(titulo, {
    x: centralizar(titulo, fontTitulo, 32),
    y: height - 160,
    size: 32,
    font: fontTitulo,
    color: verde,
  });

  const linha1 = `Certificamos que`;
  page.drawText(linha1, {
    x: centralizar(linha1, fontCorpo, 16),
    y: height - 230,
    size: 16,
    font: fontCorpo,
    color: rgb(0.18, 0.18, 0.16),
  });

  page.drawText(nomeAluno, {
    x: centralizar(nomeAluno, fontTitulo, 26),
    y: height - 270,
    size: 26,
    font: fontTitulo,
    color: rgb(0.18, 0.18, 0.16),
  });

  const linha2 = `concluiu com êxito a trilha de treinamento`;
  page.drawText(linha2, {
    x: centralizar(linha2, fontCorpo, 16),
    y: height - 320,
    size: 16,
    font: fontCorpo,
    color: rgb(0.18, 0.18, 0.16),
  });

  page.drawText(`"${nomeTrilha}"`, {
    x: centralizar(`"${nomeTrilha}"`, fontTitulo, 20),
    y: height - 355,
    size: 20,
    font: fontTitulo,
    color: verde,
  });

  const dataFormatada = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const linha3 = `promovida por ${nomeEmpresa} em ${dataFormatada}.`;
  page.drawText(linha3, {
    x: centralizar(linha3, fontCorpo, 14),
    y: height - 400,
    size: 14,
    font: fontCorpo,
    color: rgb(0.35, 0.35, 0.3),
  });

  return doc.save();
}

export async function verificarEGerarCertificado(usuarioId: string) {
  const trilha = await getTrilhaDoAluno(usuarioId);
  if (!trilha) return null;

  // Curso sem nenhuma aula cadastrada ainda (conteúdo pendente de upload), ou
  // marcado como fora do certificado pelo admin, não trava a emissão.
  const cursosQueContam = trilha.cursos.filter(
    (c) => c.certificadoAtivo && c.modulos.flatMap((m) => m.aulas).length > 0,
  );
  const todosCursosConcluidos =
    cursosQueContam.length > 0 && cursosQueContam.every((c) => c.concluido);
  if (!todosCursosConcluidos) return null;

  const aulaIds = cursosQueContam.flatMap((c) => c.modulos.flatMap((m) => m.aulas.map((a) => a.id)));
  const cumpreQuizzes = await trilhaCumpreRequisitosDeQuiz(usuarioId, aulaIds);
  if (!cumpreQuizzes) return null;

  // Storage tem RLS própria (separada das tabelas) — usa admin pra não
  // depender de uma policy extra só pra essa escrita de sistema.
  const supabase = createAdminClient();

  const { data: existente } = await supabase
    .from("certificados")
    .select("id, url_pdf, emitido_em")
    .eq("usuario_id", usuarioId)
    .eq("trilha_id", trilha.id)
    .maybeSingle();

  if (existente) return existente;

  const { data: usuario } = await supabase
    .from("usuarios")
    .select("nome, empresas(nome)")
    .eq("id", usuarioId)
    .single();

  if (!usuario) return null;
  const nomeEmpresa = (usuario.empresas as unknown as { nome: string })?.nome ?? "Care";

  const pdfBytes = await gerarPdfCertificado(usuario.nome, trilha.nome, nomeEmpresa);
  const caminho = `${usuarioId}/${trilha.id}.pdf`;

  const { error: erroUpload } = await supabase.storage
    .from("certificados")
    .upload(caminho, pdfBytes, { contentType: "application/pdf", upsert: true });

  if (erroUpload) throw new Error(erroUpload.message);

  const { data: publicUrl } = supabase.storage.from("certificados").getPublicUrl(caminho);

  const { data: novoCertificado, error } = await supabase
    .from("certificados")
    .insert({ usuario_id: usuarioId, trilha_id: trilha.id, url_pdf: publicUrl.publicUrl })
    .select("id, url_pdf, emitido_em")
    .single();

  if (error) throw new Error(error.message);
  return novoCertificado;
}
