type Color = "blue" | "green" | "orange" | "red";

const colorMap: Record<Color, { gradient: string; icon: string; text: string; sub: string }> = {
  blue: {
    gradient: "linear-gradient(135deg, #2D1B8E, #4A35C8)",
    icon: "#E8E4FF",
    text: "#FFFFFF",
    sub: "rgba(255,255,255,0.65)",
  },
  green: {
    gradient: "linear-gradient(135deg, #00C897, #009E78)",
    icon: "#F0FDF9",
    text: "#FFFFFF",
    sub: "rgba(255,255,255,0.65)",
  },
  orange: {
    gradient: "linear-gradient(135deg, #F59E0B, #D97706)",
    icon: "#FEF3C7",
    text: "#FFFFFF",
    sub: "rgba(255,255,255,0.65)",
  },
  red: {
    gradient: "linear-gradient(135deg, #EF4444, #DC2626)",
    icon: "#FEE2E2",
    text: "#FFFFFF",
    sub: "rgba(255,255,255,0.65)",
  },
};

interface Props {
  title: string;
  value: string | number;
  sub: string;
  color: Color;
  icon: string;
}

export function DashboardCard({ title, value, sub, color, icon }: Props) {
  const c = colorMap[color];
  return (
    <div
      className="rounded-2xl p-5 shadow-md"
      style={{ background: c.gradient }}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-sm font-medium" style={{ color: c.sub }}>{title}</span>
        <span
          className="w-9 h-9 rounded-xl flex items-center justify-center text-xl shadow-sm"
          style={{ background: "rgba(255,255,255,0.15)" }}
        >
          {icon}
        </span>
      </div>
      <div className="text-3xl font-bold mb-1" style={{ color: c.text }}>{value}</div>
      <div className="text-xs" style={{ color: c.sub }}>{sub}</div>
    </div>
  );
}
