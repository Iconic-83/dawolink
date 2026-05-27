import { Badge } from "@/components/ui/Badge";

export function expiryDaysLeft(date: string | Date) {
  return Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export function ExpiryBadge({ expiryDate }: { expiryDate: string }) {
  const days = expiryDaysLeft(expiryDate);
  if (days < 0) return <Badge variant="danger">Expired {Math.abs(days)}d ago</Badge>;
  if (days <= 30) return <Badge variant="danger">Expires in {days}d</Badge>;
  if (days <= 60) return <Badge variant="warning">Expires in {days}d</Badge>;
  if (days <= 90) return <Badge variant="info">Expires in {days}d</Badge>;
  return <Badge variant="success">{days}d left</Badge>;
}
