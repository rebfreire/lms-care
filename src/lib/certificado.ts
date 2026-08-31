import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

function hexParaRgb(hex: string | null | undefined, fallback: [number, number, number]) {
  const match = hex?.match(/^#?([0-9a-fA-F]{6})$/);
  if (!match) return rgb(...fallback);
  const num = parseInt(match[1], 16);
  return rgb(((num >> 16) & 255) / 255, ((num >> 8) & 255) / 255, (num & 255) / 255);
}

function substituirTags(texto: string, valores: Record<string, string>) {
  return Object.entries(valores).reduce(
    (acc, [chave, valor]) => acc.replaceAll(`{{${chave}}}`, valor),
    texto,
  );
}

async function embedImagemDeUrl(doc: PDFDocument, url: string) {
  const resposta = await fetch(url);
  const bytes = await resposta.arrayBuffer();
  const contentType = resposta.headers.get("content-type") ?? "";
  return contentType.includes("png") ? doc.embedPng(bytes) : doc.embedJpg(bytes);
}

interface DadosCertificado {
  nomeAluno: string;
  nomeCurso: string;
  nomeEmpresa: string;
  corPrimaria: string | null;
  logoUrl: string | null;
  titulo: string | null;
  textoCorpo: string | null;
  assinante: {
    nome: string | null;
    cargo: string | null;
    assinaturaUrl: string | null;
  };
}

// Fontes padrão do pdf-lib só suportam WinAnsi, que não aceita marcas de
// acento "soltas" (ex.: "a" + til combinável) — nomes vindos de import/CSV
// às vezes chegam em NFD (decomposto) em vez de NFC, e quebram o encode.
function normalizarTexto<T extends string | null>(texto: T): T {
  return (texto?.normalize("NFC") ?? texto) as T;
}

async function gerarPdfCertificado(dadosBrutos: DadosCertificado) {
  const dados: DadosCertificado = {
    ...dadosBrutos,
    nomeAluno: normalizarTexto(dadosBrutos.nomeAluno),
    nomeCurso: normalizarTexto(dadosBrutos.nomeCurso),
    nomeEmpresa: normalizarTexto(dadosBrutos.nomeEmpresa),
    titulo: normalizarTexto(dadosBrutos.titulo),
    textoCorpo: normalizarTexto(dadosBrutos.textoCorpo),
    assinante: {
      nome: normalizarTexto(dadosBrutos.assinante.nome),
      cargo: normalizarTexto(dadosBrutos.assinante.cargo),
      assinaturaUrl: dadosBrutos.assinante.assinaturaUrl,
    },
  };

  const doc = await PDFDocument.create();
  const page = doc.addPage([842, 595]); // A4 paisagem
  const { width, height } = page.getSize();

  const fontTitulo = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontCorpo = await doc.embedFont(StandardFonts.Helvetica);

  const corDestaque = hexParaRgb(dados.corPrimaria, [0.29, 0.486, 0.349]);
  const creme = rgb(0.98, 0.965, 0.941);

  page.drawRectangle({ x: 0, y: 0, width, height, color: creme });
  page.drawRectangle({
    x: 24,
    y: 24,
    width: width - 48,
    height: height - 48,
    borderColor: corDestaque,
    borderWidth: 3,
  });

  const centralizar = (texto: string, fonte: typeof fontTitulo, tamanho: number) =>
    (width - fonte.widthOfTextAtSize(texto, tamanho)) / 2;

  let topoConteudo = height - 100;

  if (dados.logoUrl) {
    try {
      const logo = await embedImagemDeUrl(doc, dados.logoUrl);
      const alturaLogo = 48;
      const larguraLogo = (logo.width / logo.height) * alturaLogo;
      page.drawImage(logo, { x: (width - larguraLogo) / 2, y: height - 90, width: larguraLogo, height: alturaLogo });
      topoConteudo = height - 130;
    } catch {
      // Logo indisponível — segue sem ela.
    }
  }

  const titulo = dados.titulo || "Certificado de Conclusão";
  page.drawText(titulo, {
    x: centralizar(titulo, fontTitulo, 32),
    y: topoConteudo,
    size: 32,
    font: fontTitulo,
    color: corDestaque,
  });

  const dataFormatada = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const textoBase =
    dados.textoCorpo ||
    'Certificamos que {{nome}} concluiu com êxito o curso "{{curso}}", promovido por {{empresa}} em {{data}}.';

  const textoFinal = substituirTags(textoBase, {
    nome: dados.nomeAluno,
    curso: dados.nomeCurso,
    empresa: dados.nomeEmpresa,
    data: dataFormatada,
  });

  // Corpo do texto quebrado em linhas simples, respeitando a largura do certificado.
  const tamanhoCorpo = 15;
  const larguraMaxima = width - 160;
  const palavras = textoFinal.split(" ");
  const linhas: string[] = [];
  let linhaAtual = "";
  for (const palavra of palavras) {
    const tentativa = linhaAtual ? `${linhaAtual} ${palavra}` : palavra;
    if (fontCorpo.widthOfTextAtSize(tentativa, tamanhoCorpo) > larguraMaxima && linhaAtual) {
      linhas.push(linhaAtual);
      linhaAtual = palavra;
    } else {
      linhaAtual = tentativa;
    }
  }
  if (linhaAtual) linhas.push(linhaAtual);

  let yTexto = topoConteudo - 70;
  for (const linha of linhas) {
    page.drawText(linha, {
      x: centralizar(linha, fontCorpo, tamanhoCorpo),
      y: yTexto,
      size: tamanhoCorpo,
      font: fontCorpo,
      color: rgb(0.18, 0.18, 0.16),
    });
    yTexto -= 24;
  }

  // Bloco de assinatura — só aparece se o curso tiver um validador configurado.
  if (dados.assinante.nome) {
    const centroX = width / 2;
    const baseY = 110;

    if (dados.assinante.assinaturaUrl) {
      try {
        const imagem = await embedImagemDeUrl(doc, dados.assinante.assinaturaUrl);
        const alturaImg = 55;
        const larguraImg = (imagem.width / imagem.height) * alturaImg;
        page.drawImage(imagem, {
          x: centroX - larguraImg / 2,
          y: baseY + 8,
          width: larguraImg,
          height: alturaImg,
        });
      } catch {
        // Se a imagem falhar, segue só com o texto.
      }
    }

    page.drawLine({
      start: { x: centroX - 110, y: baseY },
      end: { x: centroX + 110, y: baseY },
      thickness: 1,
      color: rgb(0.35, 0.35, 0.3),
    });

    page.drawText(dados.assinante.nome, {
      x: centralizar(dados.assinante.nome, fontTitulo, 12),
      y: baseY - 18,
      size: 12,
      font: fontTitulo,
      color: rgb(0.18, 0.18, 0.16),
    });

    if (dados.assinante.cargo) {
      page.drawText(dados.assinante.cargo, {
        x: centralizar(dados.assinante.cargo, fontCorpo, 10),
        y: baseY - 34,
        size: 10,
        font: fontCorpo,
        color: rgb(0.35, 0.35, 0.3),
      });
    }
  }

  return doc.save();
}

async function trilhaCumpreRequisitosDeQuiz(usuarioId: string, aulaIds: string[]) {
  if (aulaIds.length === 0) return true;
  const supabase = await createClient();

  const { data: quizzes } = await supabase.from("quizzes").select("id").in("aula_id", aulaIds);
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

export async function gerarCertificadoAmostra(empresaId: string) {
  const supabase = createAdminClient();
  const { data: empresa } = await supabase
    .from("empresas")
    .select("nome, cor_primaria, logo_url, certificado_titulo, certificado_texto")
    .eq("id", empresaId)
    .single();

  if (!empresa) throw new Error("Empresa não encontrada.");

  return gerarPdfCertificado({
    nomeAluno: "Nome do Aluno",
    nomeCurso: "Nome do Curso",
    nomeEmpresa: empresa.nome,
    corPrimaria: empresa.cor_primaria,
    logoUrl: empresa.logo_url,
    titulo: empresa.certificado_titulo,
    textoCorpo: empresa.certificado_texto,
    assinante: {
      nome: "Nome de quem valida",
      cargo: "Cargo",
      assinaturaUrl: null,
    },
  });
}

export async function getCursoIdDaAula(aulaId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("aulas")
    .select("modulos(curso_id)")
    .eq("id", aulaId)
    .single();
  return (data?.modulos as unknown as { curso_id: string } | null)?.curso_id ?? null;
}

export async function verificarEGerarCertificadoDoCurso(usuarioId: string, cursoId: string) {
  const supabase = createAdminClient();

  const { data: curso } = await supabase
    .from("cursos")
    .select(
      "id, nome, empresa_id, certificado_ativo, certificado_assinante_nome, certificado_assinante_cargo, certificado_assinatura_url, modulos(aulas(id))",
    )
    .eq("id", cursoId)
    .single();

  if (!curso || !curso.certificado_ativo) return null;

  const { data: empresa } = await supabase
    .from("empresas")
    .select("nome, cor_primaria, logo_url, certificado_ativo, certificado_titulo, certificado_texto")
    .eq("id", curso.empresa_id)
    .single();

  if (!empresa || !empresa.certificado_ativo) return null;

  const aulaIds = (curso.modulos as unknown as { aulas: { id: string }[] }[]).flatMap((m) =>
    m.aulas.map((a) => a.id),
  );
  if (aulaIds.length === 0) return null;

  const { data: progressos } = await supabase
    .from("progresso")
    .select("aula_id, concluida")
    .eq("usuario_id", usuarioId)
    .in("aula_id", aulaIds);

  const todasConcluidas = aulaIds.every((id) => progressos?.find((p) => p.aula_id === id)?.concluida);
  if (!todasConcluidas) return null;

  const cumpreQuizzes = await trilhaCumpreRequisitosDeQuiz(usuarioId, aulaIds);
  if (!cumpreQuizzes) return null;

  const { data: existente } = await supabase
    .from("certificados")
    .select("id, url_pdf, emitido_em")
    .eq("usuario_id", usuarioId)
    .eq("curso_id", cursoId)
    .maybeSingle();

  if (existente) return existente;

  const { data: usuario } = await supabase.from("usuarios").select("nome").eq("id", usuarioId).single();
  if (!usuario) return null;

  const pdfBytes = await gerarPdfCertificado({
    nomeAluno: usuario.nome,
    nomeCurso: curso.nome,
    nomeEmpresa: empresa.nome,
    corPrimaria: empresa.cor_primaria,
    logoUrl: empresa.logo_url,
    titulo: empresa.certificado_titulo,
    textoCorpo: empresa.certificado_texto,
    assinante: {
      nome: curso.certificado_assinante_nome,
      cargo: curso.certificado_assinante_cargo,
      assinaturaUrl: curso.certificado_assinatura_url,
    },
  });

  const caminho = `${usuarioId}/${cursoId}.pdf`;
  const { error: erroUpload } = await supabase.storage
    .from("certificados")
    .upload(caminho, pdfBytes, { contentType: "application/pdf", upsert: true });

  if (erroUpload) throw new Error(erroUpload.message);

  const { data: publicUrl } = supabase.storage.from("certificados").getPublicUrl(caminho);

  const { data: novoCertificado, error } = await supabase
    .from("certificados")
    .insert({ usuario_id: usuarioId, curso_id: cursoId, url_pdf: publicUrl.publicUrl })
    .select("id, url_pdf, emitido_em")
    .single();

  if (error) throw new Error(error.message);
  return novoCertificado;
}
