import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import PageHeader from "@/design-system/organisms/PageHeader";
import { listarStatusAcesso } from "../actions";
import StatusAcessoTable from "./StatusAcessoTable";

export default async function StatusAcessoPage() {
  const usuarios = await listarStatusAcesso();

  return (
    <div>
      <PageHeader
        title="Status de acesso"
        description="Quem recebeu o e-mail de acesso, quem já logou e quem já trocou a senha."
        actions={
          <Link
            href="/admin/usuarios"
            className="inline-flex items-center gap-2 text-sm font-semibold text-on-surface-variant hover:text-primary"
          >
            <ArrowLeft size={16} /> Voltar
          </Link>
        }
      />

      <StatusAcessoTable usuarios={usuarios} />
    </div>
  );
}
