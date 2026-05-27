import { cn } from "@/lib/utils";

interface Props {
  title: string;
  value: string | number;
  sub?: string;
  trend?: { value: number; label: string };
  icon: string;
  color?: "blue" | "green" | "orange" | "purple";
}

const colors = {
  blue:   "from-blue-500 to-blue-600",
  green:  "from-emerald-500 to-emerald-600",
  orange: "from-orange-500 to-orange-600",
  purple: "from-violet-500 to-violet-600",
};

export function StatCard({ title, value, sub, trend, icon, color = "blue" }: Props) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-start gap-4">
      <div className={cn("w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center text-2xl flex-shrink-0", colors[color])}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        {trend && (
          <div className={cn("text-xs font-medium mt-1", trend.value >= 0 ? "text-emerald-600" : "text-red-500")}>
            {trend.value >= 0 ? "↑" : "↓"} {Math.abs(trend.value)}% {trend.label}
          </div>
        )}
      </div>
    </div>
  );
}
