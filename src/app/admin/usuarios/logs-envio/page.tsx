import Link from "next/link";
import { ArrowLeft, CheckCircle2, XCircle } from "lucide-react";
import PageHeader from "@/design-system/organisms/PageHeader";
import { listarLogsEnvioEmail } from "../actions";

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

      <div className="bg-surface rounded-card-lg shadow-soft overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] font-bold uppercase tracking-widest text-on-surface-variant border-b border-outline-variant">
              <th className="px-6 py-3 w-8" />
              <th className="px-6 py-3">Nome</th>
              <th className="px-6 py-3">E-mail</th>
              <th className="px-6 py-3">Quando</th>
              <th className="px-6 py-3">Erro</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id} className="border-b border-outline-variant last:border-0">
                <td className="px-6 py-3">
                  {l.ok ? (
                    <CheckCircle2 size={14} className="text-success" />
                  ) : (
                    <XCircle size={14} className="text-error" />
                  )}
                </td>
                <td className="px-6 py-3 text-on-surface">{l.nome}</td>
                <td className="px-6 py-3 text-on-surface-variant">{l.email}</td>
                <td className="px-6 py-3 text-on-surface-variant">
                  {new Date(l.criadoEm).toLocaleString("pt-BR")}
                </td>
                <td className="px-6 py-3 text-error text-xs">{l.erro ?? ""}</td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-on-surface-variant">
                  Nenhum envio registrado ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
