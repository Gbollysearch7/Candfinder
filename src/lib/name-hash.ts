// Dark-mode optimized pastel palette
const PALETTE = [
  { bg: "hsl(340, 40%, 22%)", text: "hsl(340, 60%, 72%)" },
  { bg: "hsl(210, 40%, 22%)", text: "hsl(210, 60%, 72%)" },
  { bg: "hsl(140, 35%, 20%)", text: "hsl(140, 55%, 68%)" },
  { bg: "hsl(30, 45%, 22%)",  text: "hsl(30, 60%, 72%)" },
  { bg: "hsl(270, 40%, 22%)", text: "hsl(270, 55%, 72%)" },
  { bg: "hsl(180, 35%, 20%)", text: "hsl(180, 50%, 68%)" },
  { bg: "hsl(50, 40%, 20%)",  text: "hsl(50, 55%, 72%)" },
  { bg: "hsl(0, 40%, 22%)",   text: "hsl(0, 55%, 72%)" },
];

export function hashToColor(name: string): { bg: string; text: string } {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % PALETTE.length;
  return PALETTE[index];
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "?";
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
