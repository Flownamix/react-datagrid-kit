import * as React from "react";

export interface DataTableSelectionCheckboxProps {
  checked: boolean;
  indeterminate?: boolean;
  ariaLabel: string;
  disabled?: boolean;
  onCheckedChange: (checked: boolean) => void;
}

export function DataTableSelectionCheckbox({
  checked,
  indeterminate,
  ariaLabel,
  disabled,
  onCheckedChange
}: DataTableSelectionCheckboxProps): React.ReactElement {
  const ref = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = Boolean(indeterminate);
    }
  }, [indeterminate]);

  return (
    <input
      ref={ref}
      className="rdtg-checkbox"
      type="checkbox"
      aria-label={ariaLabel}
      checked={checked}
      disabled={disabled}
      onChange={(event) => onCheckedChange(event.currentTarget.checked)}
    />
  );
}
