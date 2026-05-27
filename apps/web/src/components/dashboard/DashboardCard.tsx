type Color = "blue" | "green" | "orange" | "red";

const colorMap: Record<Color, string> = {
  blue: "bg-blue-50 border-blue-100 text-blue-700",
  green: "bg-green-50 border-green-100 text-green-700",
  orange: "bg-orange-50 border-orange-100 text-orange-700",
  red: "bg-red-50 border-red-100 text-red-700",
};

interface Props {
  title: string;
  value: string | number;
  sub: string;
  color: Color;
  icon: string;
}

export function DashboardCard({ title, value, sub, color, icon }: Props) {
  return (
    <div className={`rounded-xl border p-5 ${colorMap[color]}`}>
      <div className="flex items-start justify-between mb-3">
        <span className="text-sm font-medium opacity-80">{title}</span>
        <span className="text-2xl">{icon}</span>
      </div>
      <div className="text-3xl font-bold mb-1">{value}</div>
      <div className="text-xs opacity-70">{sub}</div>
    </div>
  );
}
