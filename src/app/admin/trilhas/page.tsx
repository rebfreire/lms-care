import Link from "next/link";
import { Plus, Map } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/design-system/organisms/PageHeader";
import Button from "@/design-system/atoms/Button";

export default async function TrilhasPage() {
  const supabase = await createClient();
  const { data: trilhas } = await supabase
    .from("trilhas")
    .select("id, nome, descricao, trilhas_cursos(count)")
    .order("nome");

  return (
    <div>
      <PageHeader
        title="Trilhas"
        description="Sequencie cursos em uma trilha, com ou sem bloqueio entre eles."
        actions={
          <Link href="/admin/trilhas/novo">
            <Button className="inline-flex items-center gap-2">
              <Plus size={18} /> Nova trilha
            </Button>
          </Link>
        }
      />

      {!trilhas || trilhas.length === 0 ? (
        <div className="bg-surface rounded-card-lg p-10 shadow-soft text-center">
          <Map className="mx-auto text-outline mb-3" size={32} />
          <p className="text-on-surface-variant">Nenhuma trilha criada ainda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {trilhas.map((trilha) => (
            <Link
              key={trilha.id}
              href={`/admin/trilhas/${trilha.id}`}
              className="bg-surface rounded-card p-6 shadow-soft hover:shadow-soft-lg transition-shadow block"
            >
              <h3 className="text-lg font-headline font-bold text-on-surface">
                {trilha.nome}
              </h3>
              {trilha.descricao && (
                <p className="text-on-surface-variant text-sm mt-1 line-clamp-2">
                  {trilha.descricao}
                </p>
              )}
              <p className="text-xs text-outline uppercase tracking-widest font-bold mt-4">
                {trilha.trilhas_cursos?.[0]?.count ?? 0} curso(s)
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
