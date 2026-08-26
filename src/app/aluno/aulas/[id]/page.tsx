import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  CheckCircle2,
  PlayCircle,
  ChevronLeft,
  ChevronRight,
  ListChecks,
  FileText,
  Link2,
  Download,
} from "lucide-react";
import { getUsuarioAtual } from "@/lib/supabase/auth";
import { getAulaComContexto } from "@/lib/trilha";
import { createClient } from "@/lib/supabase/server";
import AulaPlayer from "./AulaPlayer";

export default async function AulaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const usuario = await getUsuarioAtual();
  if (!usuario) redirect("/login");

  const contexto = await getAulaComContexto(usuario.id, id);
  if (!contexto) notFound();

  const { curso, aula, anterior, proxima } = contexto;
  if (curso.bloqueado) redirect("/aluno");

  const supabase = await createClient();
  const [{ data: quiz }, { data: materiais }] = await Promise.all([
    supabase.from("quizzes").select("id").eq("aula_id", aula.id).maybeSingle(),
    supabase.from("aula_materiais").select("id, tipo, nome, url").eq("aula_id", aula.id).order("nome"),
  ]);

  const todasAulasDoCurso = curso.modulos.flatMap((m) => m.aulas);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <Link href="/aluno" className="text-sm text-on-surface-variant hover:text-primary">
          ← Voltar pra trilha
        </Link>
        <div className="flex gap-2">
          {anterior && (
            <Link
              href={`/aluno/aulas/${anterior.id}`}
              className="p-2 rounded-full bg-surface shadow-soft text-on-surface-variant hover:text-primary"
            >
              <ChevronLeft size={18} />
            </Link>
          )}
          {proxima && (
            <Link
              href={`/aluno/aulas/${proxima.id}`}
              className="p-2 rounded-full bg-surface shadow-soft text-on-surface-variant hover:text-primary"
            >
              <ChevronRight size={18} />
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {aula.videoId ? (
            <AulaPlayer
              aulaId={aula.id}
              videoId={aula.videoId}
              posicaoInicialSegundos={aula.posicaoSegundos}
            />
          ) : (
            <div className="w-full aspect-video rounded-card-lg bg-surface-container-high flex items-center justify-center text-on-surface-variant">
              Vídeo ainda não disponível.
            </div>
          )}

          <h1 className="text-2xl font-headline font-bold text-on-surface mt-5">
            {aula.titulo}
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">{curso.nome}</p>

          {quiz && (
            <Link
              href={`/aluno/aulas/${aula.id}/quiz`}
              className="inline-flex items-center gap-2 mt-4 text-sm font-semibold text-primary hover:underline"
            >
              <ListChecks size={16} /> Fazer quiz desta aula
            </Link>
          )}

          {aula.textoApoio && (
            <div
              className="prose prose-sm max-w-none mt-6 bg-surface rounded-card-lg p-6 shadow-soft text-on-surface-variant"
              dangerouslySetInnerHTML={{ __html: aula.textoApoio }}
            />
          )}

          {materiais && materiais.length > 0 && (
            <div className="mt-6 bg-surface rounded-card-lg p-6 shadow-soft">
              <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-3">
                Materiais
              </h3>
              <ul className="space-y-2">
                {materiais.map((m) => (
                  <li
                    key={m.id}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-surface-container-low"
                  >
                    {m.tipo === "arquivo" ? (
                      <FileText size={16} className="text-on-surface-variant flex-shrink-0" />
                    ) : (
                      <Link2 size={16} className="text-on-surface-variant flex-shrink-0" />
                    )}
                    <span className="text-sm text-on-surface flex-1 truncate">{m.nome}</span>
                    <a
                      href={m.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-1 flex-shrink-0"
                    >
                      <Download size={12} /> {m.tipo === "arquivo" ? "Download" : "Abrir"}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="bg-surface rounded-card-lg p-5 shadow-soft h-fit">
          <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-3">
            Conteúdo do curso
          </h3>
          <ul className="space-y-1">
            {todasAulasDoCurso.map((a) => (
              <li key={a.id}>
                <Link
                  href={`/aluno/aulas/${a.id}`}
                  className={`flex items-center gap-2 text-sm py-2 px-2 rounded-lg ${
                    a.id === aula.id
                      ? "bg-primary-container text-on-primary-container font-semibold"
                      : "text-on-surface-variant hover:bg-surface-container-low"
                  }`}
                >
                  {a.concluida ? (
                    <CheckCircle2 size={14} className="text-success flex-shrink-0" />
                  ) : (
                    <PlayCircle size={14} className="flex-shrink-0" />
                  )}
                  {a.titulo}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
