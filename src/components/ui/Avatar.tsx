// ==================================================
// MailPilot — Avatar Component
// ==================================================

import Image from "next/image";

interface AvatarProps {
  src?: string | null;
  alt?: string;
  fallback?: string;
  size?: "sm" | "md" | "lg";
}

const sizeMap = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
};

const pxMap = {
  sm: 32,
  md: 40,
  lg: 48,
};

export function Avatar({ src, alt = "", fallback, size = "md" }: AvatarProps) {
  const initials =
    fallback ||
    alt
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ||
    "?";

  if (src) {
    return (
      <div
        className={`${sizeMap[size]} relative overflow-hidden rounded-full ring-2 ring-slate-800`}
      >
        <Image
          src={src}
          alt={alt}
          width={pxMap[size]}
          height={pxMap[size]}
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={`${sizeMap[size]} flex items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 font-medium text-white ring-2 ring-slate-800`}
    >
      {initials}
    </div>
  );
}
