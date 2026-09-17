import Link from "next/link";
import { ArrowLeft } from "lucide-react";
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
        actions={
          <Link
            href="/admin/usuarios"
            className="inline-flex items-center gap-2 text-sm font-semibold text-on-surface-variant hover:text-primary"
          >
            <ArrowLeft size={16} /> Voltar
          </Link>
        }
      />

      <LogsEnvioTable logs={logs} />
    </div>
  );
}
