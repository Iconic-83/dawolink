import { cn } from "@/lib/utils";

type Variant = "default" | "success" | "warning" | "danger" | "info" | "muted";

const variants: Record<Variant, string> = {
  default: "bg-brand-purple-100 text-brand-purple",
  success: "bg-brand-teal-100 text-brand-teal-dark",
  warning: "bg-amber-100 text-amber-700",
  danger: "bg-red-100 text-red-700",
  info: "bg-blue-100 text-blue-700",
  muted: "bg-gray-50 text-gray-400 border border-gray-200",
};

export function Badge({ children, variant = "default", className }: {
  children: React.ReactNode;
  variant?: Variant;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium", variants[variant], className)}>
      {children}
    </span>
  );
}
