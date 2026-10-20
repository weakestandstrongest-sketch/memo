/** Simple line icons. They inherit the text color (currentColor). */
import type { ReactNode } from 'react';

function Icon({ children, size = 20 }: { children: ReactNode; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

export const CloseIcon = () => (
  <Icon size={18}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Icon>
);
export const PlusIcon = () => (
  <Icon size={24}>
    <path d="M12 5v14M5 12h14" />
  </Icon>
);
export const SearchIcon = () => (
  <Icon size={18}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="M16 16l4 4" />
  </Icon>
);
export const FilterIcon = () => (
  <Icon>
    <path d="M4 6h16M7 12h10M10 18h4" />
  </Icon>
);
export const LinkIcon = () => (
  <Icon size={18}>
    <circle cx="6" cy="17" r="2.5" />
    <circle cx="18" cy="7" r="2.5" />
    <path d="M8 15.5l8-7" />
  </Icon>
);
export const UnlinkIcon = () => (
  <Icon size={16}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Icon>
);
export const EditIcon = () => (
  <Icon size={18}>
    <path d="M4 20h4L19 9l-4-4L4 16v4z" />
    <path d="M13.5 6.5l4 4" />
  </Icon>
);
export const TrashIcon = () => (
  <Icon size={18}>
    <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
  </Icon>
);
export const FitIcon = () => (
  <Icon>
    <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
    <circle cx="12" cy="12" r="2" />
  </Icon>
);
export const ZoomInIcon = () => (
  <Icon>
    <path d="M12 6v12M6 12h12" />
  </Icon>
);
export const ZoomOutIcon = () => (
  <Icon>
    <path d="M6 12h12" />
  </Icon>
);
export const MenuIcon = () => (
  <Icon>
    <circle cx="5" cy="12" r="1.2" fill="currentColor" />
    <circle cx="12" cy="12" r="1.2" fill="currentColor" />
    <circle cx="19" cy="12" r="1.2" fill="currentColor" />
  </Icon>
);
export const ChevronIcon = () => (
  <Icon size={16}>
    <path d="M9 6l6 6-6 6" />
  </Icon>
);
export const TargetIcon = () => (
  <Icon size={18}>
    <circle cx="12" cy="12" r="7" />
    <circle cx="12" cy="12" r="2" />
  </Icon>
);
export const HamburgerIcon = () => (
  <Icon>
    <path d="M4 7h16M4 12h16M4 17h10" />
  </Icon>
);
/** Push-pin. `filled` = currently pinned. */
export const PinIcon = ({ filled = false, size = 18 }: { filled?: boolean; size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={filled ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <path d="M9 3h6l-1 6 4 4H6l4-4-1-6z" />
    <path d="M12 13v8" fill="none" />
  </svg>
);
export const GalaxyIcon = () => (
  <Icon size={18}>
    <circle cx="12" cy="12" r="2.2" />
    <ellipse cx="12" cy="12" rx="9" ry="4.5" transform="rotate(-25 12 12)" strokeDasharray="2.5 2.5" />
  </Icon>
);
