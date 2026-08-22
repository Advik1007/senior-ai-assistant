export function UnkLogo({ className = "size-14" }: { className?: string }) {
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
        y="42"
        textAnchor="middle"
        fontSize="22"
        fontWeight="800"
        fill="white"
        fontFamily="system-ui, sans-serif"
      >
        UNK
      </text>
    </svg>
  );
}
