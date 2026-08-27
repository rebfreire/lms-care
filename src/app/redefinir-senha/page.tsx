import { redirect } from "next/navigation";
import { getUsuarioAtual } from "@/lib/supabase/auth";
import { getEmpresaBrandingPublica } from "@/lib/empresa";
import RedefinirSenhaForm from "./RedefinirSenhaForm";

export default async function RedefinirSenhaPage() {
  const usuario = await getUsuarioAtual();
  if (!usuario) redirect("/recuperar-senha");

  const empresa = await getEmpresaBrandingPublica();
  const nome = empresa?.nome ?? "Care";

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-6">
      {empresa?.corPrimaria && (
        <style>{`:root { --primary: ${empresa.corPrimaria}; }`}</style>
      )}
      <div className="w-full max-w-sm">
        <div className="mb-8">
          {empresa?.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={empresa.logoUrl} alt={nome} className="h-12 w-auto max-w-[200px] object-contain mb-4" />
          ) : (
            <div className="h-12 w-12 rounded-xl bg-primary text-on-primary font-headline font-bold flex items-center justify-center mb-4">
              {nome.charAt(0).toUpperCase()}
            </div>
          )}
          <h1 className="text-2xl font-headline font-bold text-on-surface">Nova senha</h1>
          <p className="text-on-surface-variant text-sm mt-1">Escolha uma senha nova pra sua conta.</p>
        </div>

        <RedefinirSenhaForm />
      </div>
    </main>
  );
}
