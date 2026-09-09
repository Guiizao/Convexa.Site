/**
 * Ícones em SVG.
 *
 * Antes o site usava glifos de fonte (⚡ ✦ ◉ ▶ ➤) como se fossem ícones. Eles
 * mudam de desenho conforme o sistema, não aceitam espessura de traço e são um
 * dos sinais mais óbvios de página montada às pressas.
 */

type IconProps = { size?: number; className?: string };

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  focusable: false,
});

export const ArrowRight = ({ size = 16, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M4 12h15M13 6l6 6-6 6" />
  </svg>
);

export const ArrowUpRight = ({ size = 16, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M7 17 17 7M8 7h9v9" />
  </svg>
);

export const Play = ({ size = 12, className }: IconProps) => (
  <svg {...base(size)} className={className} fill="currentColor" stroke="none">
    <path d="M8 5.5v13l11-6.5z" />
  </svg>
);

export const Check = ({ size = 14, className }: IconProps) => (
  <svg {...base(size)} className={className} strokeWidth={2.4}>
    <path d="M4 12.5 9 17.5 20 6.5" />
  </svg>
);

/** Dois tiques do WhatsApp — a marca de "lida". */
export const CheckDouble = ({ size = 12, className }: IconProps) => (
  <svg {...base(size)} className={className} strokeWidth={2} viewBox="0 0 28 24">
    <path d="M2 13l5 5L17 6" />
    <path d="M11 13l5 5L26 6" />
  </svg>
);

export const Bolt = ({ size = 16, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M13 2 4 14h7l-1 8 9-12h-7z" />
  </svg>
);

export const Send = ({ size = 14, className }: IconProps) => (
  <svg {...base(size)} className={className} strokeWidth={1.8}>
    <path d="M4 12 20 4l-4 16-4-7z" />
  </svg>
);

export const Plus = ({ size = 14, className }: IconProps) => (
  <svg {...base(size)} className={className} strokeWidth={2}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const Scissors = ({ size = 20, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <circle cx="6" cy="6" r="2.6" />
    <circle cx="6" cy="18" r="2.6" />
    <path d="M20 4 8.6 16.4M8.6 7.6 20 20" />
  </svg>
);

export const Sparkle = ({ size = 20, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M12 3.5 13.8 9 19.5 10.8 13.8 12.6 12 18.2 10.2 12.6 4.5 10.8 10.2 9z" />
  </svg>
);

export const Droplet = ({ size = 20, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M12 3.5c3.4 4 5.5 6.6 5.5 9.3a5.5 5.5 0 0 1-11 0c0-2.7 2.1-5.3 5.5-9.3z" />
  </svg>
);

export const Pen = ({ size = 20, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M4 20l1-4.5L15.5 5a2 2 0 0 1 2.8 0l.7.7a2 2 0 0 1 0 2.8L8.5 19 4 20z" />
  </svg>
);

export const Dumbbell = ({ size = 20, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M3 10v4M6.5 7.5v9M17.5 7.5v9M21 10v4M6.5 12h11" />
  </svg>
);

export const Stethoscope = ({ size = 20, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M6 3v5a4.5 4.5 0 0 0 9 0V3" />
    <path d="M4.5 3h3M13.5 3h3" />
    <path d="M10.5 12.5v2a5 5 0 0 0 5 5 4 4 0 0 0 4-4v-1.5" />
    <circle cx="19.5" cy="12.5" r="1.8" />
  </svg>
);

export const Chat = ({ size = 20, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M20.5 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.9A8 8 0 1 1 20.5 12z" />
  </svg>
);

export const Calendar = ({ size = 20, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
    <path d="M3.5 9.5h17M8 3v4M16 3v4" />
  </svg>
);

export const Cpu = ({ size = 20, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <rect x="6.5" y="6.5" width="11" height="11" rx="2.5" />
    <path d="M10 3v3.5M14 3v3.5M10 17.5V21M14 17.5V21M3 10h3.5M3 14h3.5M17.5 10H21M17.5 14H21" />
  </svg>
);
