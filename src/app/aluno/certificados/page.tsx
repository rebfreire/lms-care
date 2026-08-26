import PageHeader from "@/design-system/organisms/PageHeader";

export default function CertificadosPage() {
  return (
    <div>
      <PageHeader title="Certificados" description="Disponível ao concluir a trilha." />
      <div className="bg-surface rounded-card-lg p-10 shadow-soft text-center text-on-surface-variant">
        Geração automática de certificado entra na Fase 8.
      </div>
    </div>
  );
}
