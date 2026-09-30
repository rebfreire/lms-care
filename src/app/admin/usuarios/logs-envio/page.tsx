import PageHeader from "@/design-system/organisms/PageHeader";
import { listarLogsEnvioEmail } from "../actions";
import LogsEnvioTable from "./LogsEnvioTable";

export default async function LogsEnvioEmailPage() {
  const logs = await listarLogsEnvioEmail();

  return (
    <div>
      <PageHeader
        title="Histórico de envio de e-mail de acesso"
        description="Últimos 200 envios, mais recentes primeiro."
        breadcrumb={[{ label: "Usuários e turmas", href: "/admin/usuarios" }, { label: "Histórico de envio" }]}
      />

      <LogsEnvioTable logs={logs} />
    </div>
  );
}
