import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, FileText, ListChecks } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/design-system/organisms/PageHeader";
import Button from "@/design-system/atoms/Button";
import { criarModulo, criarAula } from "../actions";
import VideoUploader from "./VideoUploader";

export default async function CursoDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: curso } = await supabase
    .from("cursos")
    .select("id, nome, descricao")
    .eq("id", id)
    .single();

  if (!curso) notFound();

  const { data: modulos } = await supabase
    .from("modulos")
    .select("id, nome, ordem, aulas(id, titulo, ordem, video_id_cloudflare)")
    .eq("curso_id", id)
    .order("ordem");

  return (
    <div>
      <PageHeader title={curso.nome} description={curso.descricao ?? undefined} />

      <div className="space-y-6">
        {modulos?.map((modulo) => (
          <div key={modulo.id} className="bg-surface rounded-card-lg p-6 shadow-soft">
            <h3 className="text-lg font-headline font-bold text-on-surface mb-4">
              {modulo.nome}
            </h3>

            <ul className="space-y-2 mb-5">
              {modulo.aulas
                ?.sort((a, b) => a.ordem - b.ordem)
                .map((aula) => (
                  <li
                    key={aula.id}
                    className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-surface-container-low"
                  >
                    <FileText size={16} className="text-on-surface-variant flex-shrink-0" />
                    <span className="text-sm text-on-surface flex-1">{aula.titulo}</span>
                    {aula.video_id_cloudflare ? (
                      <span className="text-[10px] font-bold uppercase tracking-widest text-success bg-success-container px-2 py-1 rounded-pill flex items-center gap-1 flex-shrink-0">
                        <CheckCircle2 size={12} /> vídeo enviado
                      </span>
                    ) : (
                      <VideoUploader aulaId={aula.id} cursoId={curso.id} />
                    )}
                    <Link
                      href={`/admin/cursos/${curso.id}/aulas/${aula.id}/quiz`}
                      className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant bg-surface-container-high px-2 py-1 rounded-pill flex items-center gap-1 flex-shrink-0 hover:text-primary"
                    >
                      <ListChecks size={12} /> quiz
                    </Link>
                  </li>
                ))}
              {modulo.aulas?.length === 0 && (
                <p className="text-sm text-on-surface-variant px-1">Nenhuma aula ainda.</p>
              )}
            </ul>

            <form
              action={criarAula.bind(null, curso.id, modulo.id)}
              className="flex flex-wrap gap-2 items-start border-t border-outline-variant pt-4"
            >
              <input
                name="titulo"
                placeholder="Título da aula"
                required
                className="flex-1 min-w-[180px] rounded-2xl border border-outline-variant bg-surface px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
              />
              <Button type="submit" size="sm" variant="secondary">
                Adicionar aula
              </Button>
            </form>
          </div>
        ))}

        {modulos?.length === 0 && (
          <p className="text-on-surface-variant">Nenhum módulo ainda — crie o primeiro abaixo.</p>
        )}

        <form
          action={criarModulo.bind(null, curso.id)}
          className="bg-surface-container-low rounded-card-lg p-6 flex flex-wrap gap-2 items-start"
        >
          <input
            name="nome"
            placeholder="Nome do módulo"
            required
            className="flex-1 min-w-[180px] rounded-2xl border border-outline-variant bg-surface px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
          />
          <Button type="submit" variant="primary" size="sm">
            Adicionar módulo
          </Button>
        </form>
      </div>
    </div>
  );
}
