import { APP_NAME } from "@/lib/config";

// Text wordmark used across the app. Renders APP_NAME in the display font, tinted
// with the brand color — no image asset required. Swap this for an <Image> if you
// have a logo file (drop it in /public and point src at it).
export function Logo({
  height = 28,
  className,
}: {
  height?: number;
  className?: string;
  /** Accepted for call-site compatibility; unused by the text wordmark. */
  priority?: boolean;
}) {
  return (
    <span
      className={`font-display font-bold tracking-tight text-brand ${className ?? ""}`}
      style={{ fontSize: Math.round(height * 0.72), lineHeight: 1 }}
    >
      {APP_NAME}
    </span>
  );
}
