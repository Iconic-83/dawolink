import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn("h-5 w-5 animate-spin text-blue-500", className)} />;
}

export function PageSpinner() {
  return (
    <div className="flex items-center justify-center py-24">
      <Spinner className="h-8 w-8" />
    </div>
  );
}
