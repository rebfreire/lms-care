import Button from "@/design-system/atoms/Button";
import { adicionarMaterialLink } from "../../../../actions";
import MaterialUploader from "./MaterialUploader";
import MaterialItem, { type Material } from "./MaterialItem";

interface MateriaisSectionProps {
  cursoId: string;
  aulaId: string;
  materiais: Material[];
}

export default function MateriaisSection({ cursoId, aulaId, materiais }: MateriaisSectionProps) {
  return (
    <div className="border-t border-outline-variant pt-6 mt-6 space-y-4">
      <h3 className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
        Materiais de apoio
      </h3>

      {materiais.length > 0 && (
        <ul className="space-y-2">
          {materiais.map((m) => (
            <MaterialItem key={m.id} material={m} cursoId={cursoId} aulaId={aulaId} />
          ))}
        </ul>
      )}

      <MaterialUploader cursoId={cursoId} aulaId={aulaId} />

      <form
        action={adicionarMaterialLink.bind(null, aulaId, cursoId)}
        className="flex flex-wrap items-center gap-2"
      >
        <input
          name="nome"
          placeholder="Nome do link"
          required
          className="flex-1 min-w-[140px] rounded-2xl border border-outline-variant bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
        />
        <input
          name="url"
          type="url"
          placeholder="https://..."
          required
          className="flex-1 min-w-[180px] rounded-2xl border border-outline-variant bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
        />
        <Button type="submit" size="sm" variant="secondary">
          Adicionar link
        </Button>
      </form>
    </div>
  );
}
