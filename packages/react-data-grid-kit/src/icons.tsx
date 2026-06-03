import * as React from "react";
import type { DataTableIconProps, DataTableIcons, DataTableSortDirection } from "./types";

function Svg({
  children,
  className,
  size = 16,
  title,
  ...props
}: DataTableIconProps & React.SVGProps<SVGSVGElement> & { children: React.ReactNode }) {
  return (
    <svg
      aria-hidden={title ? undefined : true}
      className={className}
      fill="none"
      height={size}
      role={title ? "img" : undefined}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
      width={size}
      {...props}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}

export function SortIcon({ direction, ...props }: DataTableIconProps & { direction: DataTableSortDirection | "none" }) {
  return (
    <span className="rdtg-sortIconFrame" data-state={direction}>
      <Svg {...props} className="rdtg-sortIcon rdtg-sortIconNeutral">
        <path d="m8 7 4-4 4 4" />
        <path d="M12 3v18" />
        <path d="m16 17-4 4-4-4" />
      </Svg>
      <Svg {...props} className="rdtg-sortIcon rdtg-sortIconDirectional">
        <path d="m7 10 5-5 5 5" />
        <path d="M12 5v14" />
      </Svg>
    </span>
  );
}

export function FilterIcon({ active, ...props }: DataTableIconProps & { active?: boolean }) {
  return (
    <Svg {...props} className="rdtg-filterIcon" data-active={active || undefined}>
      <path d="M4 6h16" />
      <path d="M7 12h10" />
      <path d="M10 18h4" />
      <circle className="rdtg-filterIconDot" cx="18" cy="6" fill="currentColor" r="2.2" stroke="none" />
    </Svg>
  );
}

export function ExpandIcon({ expanded, ...props }: DataTableIconProps & { expanded?: boolean }) {
  return (
    <Svg {...props} className="rdtg-expandIcon" data-expanded={expanded ? "true" : "false"}>
      <path d="m9 6 6 6-6 6" />
    </Svg>
  );
}

export function EditIcon(props: DataTableIconProps) {
  return (
    <Svg {...props} className="rdtg-editIcon">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </Svg>
  );
}

export function CheckIcon(props: DataTableIconProps) {
  return (
    <Svg {...props}>
      <path d="m5 12 5 5L20 7" />
    </Svg>
  );
}

export function CloseIcon(props: DataTableIconProps) {
  return (
    <Svg {...props}>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </Svg>
  );
}

export function LoadingIcon(props: DataTableIconProps) {
  return (
    <Svg {...props} className="rdtg-loadingIcon">
      <path d="M21 12a9 9 0 1 1-5.3-8.2" />
    </Svg>
  );
}

export function MoreIcon(props: DataTableIconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="5" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="19" cy="12" r="1" fill="currentColor" stroke="none" />
    </Svg>
  );
}

export const defaultIcons: DataTableIcons = {
  Sort: SortIcon,
  Filter: FilterIcon,
  Expand: ExpandIcon,
  Edit: EditIcon,
  Loading: LoadingIcon,
  More: MoreIcon
};
