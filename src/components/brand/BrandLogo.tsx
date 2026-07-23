import Image from "next/image";

const SIZE = {
  sm: { width: 40, height: 48 },
  md: { width: 56, height: 68 },
  lg: { width: 88, height: 108 },
  hero: { width: 140, height: 170 },
} as const;

type BrandLogoProps = {
  size?: keyof typeof SIZE;
  priority?: boolean;
  className?: string;
};

/** Official Moai's Crafts mark (circular badge + wordmark in the asset). */
export function BrandLogo({
  size = "md",
  priority = false,
  className = "",
}: BrandLogoProps) {
  const dim = SIZE[size];
  return (
    <Image
      src="/brand/moais-crafts-logo.png"
      alt="Moai's Crafts"
      width={dim.width}
      height={dim.height}
      priority={priority}
      className={`h-auto w-auto object-contain ${className}`}
      style={{ width: dim.width, height: "auto", maxHeight: dim.height }}
    />
  );
}
