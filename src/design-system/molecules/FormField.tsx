import type { InputHTMLAttributes } from "react";

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export default function FormField({ label, id, className = "", ...props }: FormFieldProps) {
  return (
    <div className={className}>
      <label
        htmlFor={id}
        className="block text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-2"
      >
        {label}
      </label>
      <input
        id={id}
        className="w-full rounded-2xl border border-outline-variant bg-surface px-4 py-3 text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors"
        {...props}
      />
    </div>
  );
}
