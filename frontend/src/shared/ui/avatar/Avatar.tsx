import "./Avatar.css";
import type { AvatarProps } from "./Avatar.types";

function AvatarFallbackIcon() {
  return (
    <svg
      className="avatar__fallback-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

export function Avatar({ src, alt = "", size = "md", className = "" }: AvatarProps) {
  const classNames = ["avatar", `avatar--${size}`, className].filter(Boolean).join(" ");

  return (
    <div className={classNames}>
      {src ? (
        <img className="avatar__image" src={src} alt={alt} />
      ) : (
        <div className="avatar__fallback">
          <AvatarFallbackIcon />
        </div>
      )}
    </div>
  );
}
