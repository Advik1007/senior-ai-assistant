export function UnkLogo({ className = "size-12" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      role="img"
      aria-label="UNK AI"
    >
      <rect width="64" height="64" rx="16" fill="#0B4F8A" />
      <text
        x="32"
        y="41"
        textAnchor="middle"
        fontSize="18"
        fontWeight="800"
        fill="#F4B400"
        fontFamily="system-ui, sans-serif"
        letterSpacing="1.5"
      >
        UNK
      </text>
    </svg>
  );
}
