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
        breadcrumb={[{ label: "Usuários e turmas", href: "/admin/usuarios" }, { label: "Status de acesso" }]}
      />

      <StatusAcessoTable usuarios={usuarios} />
    </div>
  );
}
