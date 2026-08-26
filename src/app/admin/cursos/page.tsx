import Link from "next/link";
import { Plus, BookOpen } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/design-system/organisms/PageHeader";
import Button from "@/design-system/atoms/Button";

export default async function CursosPage() {
  const supabase = await createClient();
  const { data: cursos } = await supabase
    .from("cursos")
    .select("id, nome, descricao, modulos(count)")
    .order("nome");

  return (
    <div>
      <PageHeader
        title="Cursos e trilhas"
        description="Monte o conteúdo: curso → módulo → aula."
        actions={
          <Link href="/admin/cursos/novo">
            <Button className="inline-flex items-center gap-2">
              <Plus size={18} /> Novo curso
            </Button>
          </Link>
        }
      />

      {!cursos || cursos.length === 0 ? (
        <div className="bg-surface rounded-card-lg p-10 shadow-soft text-center">
          <BookOpen className="mx-auto text-outline mb-3" size={32} />
          <p className="text-on-surface-variant">Nenhum curso criado ainda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {cursos.map((curso) => (
            <Link
              key={curso.id}
              href={`/admin/cursos/${curso.id}`}
              className="bg-surface rounded-card p-6 shadow-soft hover:shadow-soft-lg transition-shadow block"
            >
              <h3 className="text-lg font-headline font-bold text-on-surface">
                {curso.nome}
              </h3>
              {curso.descricao && (
                <p className="text-on-surface-variant text-sm mt-1 line-clamp-2">
                  {curso.descricao}
                </p>
              )}
              <p className="text-xs text-outline uppercase tracking-widest font-bold mt-4">
                {curso.modulos?.[0]?.count ?? 0} módulo(s)
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
