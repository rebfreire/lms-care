import { redirect } from "next/navigation";
import { Download, Award } from "lucide-react";
import PageHeader from "@/design-system/organisms/PageHeader";
import { getUsuarioAtual } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";

export default async function CertificadosPage() {
  const usuario = await getUsuarioAtual();
  if (!usuario) redirect("/login");

  const supabase = await createClient();
  const { data: certificados } = await supabase
    .from("certificados")
    .select("id, emitido_em, url_pdf, cursos(nome)")
    .eq("usuario_id", usuario.id)
    .order("emitido_em", { ascending: false });

  return (
    <div>
      <PageHeader title="Certificados" description="Emitidos automaticamente ao concluir uma trilha." />

      {!certificados || certificados.length === 0 ? (
        <div className="bg-surface rounded-card-lg p-10 shadow-soft text-center text-on-surface-variant">
          <Award className="mx-auto mb-3 text-outline" size={32} />
          Nenhum certificado ainda — conclua todas as aulas (e quizzes, se houver) da sua trilha.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {certificados.map((c) => (
            <a
              key={c.id}
              href={c.url_pdf ?? "#"}
              target="_blank"
              rel="noreferrer"
              className="bg-surface rounded-card-lg p-6 shadow-soft hover:shadow-soft-lg transition-shadow flex items-center gap-4"
            >
              <div className="h-12 w-12 rounded-2xl bg-primary-container text-on-primary-container flex items-center justify-center flex-shrink-0">
                <Award size={22} />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-on-surface">
                  {(c.cursos as unknown as { nome: string })?.nome}
                </p>
                <p className="text-xs text-on-surface-variant">
                  Emitido em {new Date(c.emitido_em).toLocaleDateString("pt-BR")}
                </p>
              </div>
              <Download size={18} className="text-on-surface-variant flex-shrink-0" />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
