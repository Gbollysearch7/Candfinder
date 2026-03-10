"use client";

import { hashToColor, getInitials } from "@/lib/name-hash";

interface AvatarInitialsProps {
  name: string;
  size?: "sm" | "md" | "lg";
}

const sizeMap = {
  sm: "h-7 w-7 text-[10px]",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
};

export function AvatarInitials({ name, size = "md" }: AvatarInitialsProps) {
  const { bg, text } = hashToColor(name);
  const initials = getInitials(name);

  return (
    <div
      className={`${sizeMap[size]} rounded-full flex items-center justify-center font-semibold shrink-0`}
      style={{ backgroundColor: bg, color: text }}
    >
      {initials}
    </div>
  );
}
