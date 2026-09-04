"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function SetSessionInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const next = searchParams.get("next") ?? "/";

    // Link de convite/definição de senha enviado pelo admin pra outra pessoa:
    // o cookie de verificação PKCE fica salvo no navegador de quem disparou
    // o e-mail (o admin), não no de quem vai clicar o link — então o Supabase
    // entrega os tokens direto no #hash da URL em vez de um "?code=" trocável
    // no servidor. Essa página lê esse hash e cria a sessão no navegador.
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const accessToken = hash.get("access_token");
    const refreshToken = hash.get("refresh_token");

    if (!accessToken || !refreshToken) {
      router.replace("/login?erro=link_invalido");
      return;
    }

    const supabase = createClient();
    supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken }).then(({ error }) => {
      router.replace(error ? "/login?erro=link_invalido" : next);
    });
  }, [router, searchParams]);

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-6">
      <p className="text-sm text-on-surface-variant">Entrando...</p>
    </main>
  );
}

export default function SetSessionPage() {
  return (
    <Suspense>
      <SetSessionInner />
    </Suspense>
  );
}
