import Link from "next/link";
import { getEmpresaBrandingPublica } from "@/lib/empresa";
import RecuperarSenhaForm from "./RecuperarSenhaForm";

export default async function RecuperarSenhaPage() {
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
          <h1 className="text-2xl font-headline font-bold text-on-surface">Recuperar senha</h1>
          <p className="text-on-surface-variant text-sm mt-1">
            Digite o e-mail da sua conta pra receber o link de redefinição.
          </p>
        </div>

        <RecuperarSenhaForm />

        <Link
          href="/login"
          className="block text-center text-sm text-on-surface-variant hover:text-primary mt-6"
        >
          Voltar pro login
        </Link>
      </div>
    </main>
  );
}
