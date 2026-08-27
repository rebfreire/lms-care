import Link from "next/link";
import { getEmpresaBrandingPublica } from "@/lib/empresa";
import LoginForm from "./LoginForm";

export default async function LoginPage() {
  const empresa = await getEmpresaBrandingPublica();
  const nome = empresa?.nome ?? "Care";

  return (
    <main className="min-h-screen bg-background flex">
      {empresa?.corPrimaria && (
        <style>{`:root { --primary: ${empresa.corPrimaria}; }`}</style>
      )}

      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-10">
            {empresa?.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={empresa.logoUrl} alt={nome} className="h-14 w-auto max-w-[220px] object-contain mb-4" />
            ) : (
              <div className="h-12 w-12 rounded-xl bg-primary text-on-primary font-headline font-bold flex items-center justify-center mb-4">
                {nome.charAt(0).toUpperCase()}
              </div>
            )}
            <h1 className="text-2xl font-headline font-bold text-on-surface">{nome}</h1>
            <p className="text-on-surface-variant text-sm mt-1">
              Entre com a conta criada pelo administrador.
            </p>
          </div>

          <LoginForm />

          <Link
            href="/recuperar-senha"
            className="block text-center text-sm text-on-surface-variant hover:text-primary mt-6"
          >
            Esqueci minha senha
          </Link>
        </div>
      </div>

      <div className="hidden lg:block lg:w-1/2 relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/login-bg.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-on-background/50 via-transparent to-transparent" />
      </div>
    </main>
  );
}
