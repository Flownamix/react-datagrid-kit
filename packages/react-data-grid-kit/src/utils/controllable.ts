import * as React from "react";

export function useControllableState<T>({
  value,
  defaultValue,
  controlled: controlledProp,
  onChange
}: {
  value: T | undefined;
  defaultValue: T;
  controlled?: boolean;
  onChange?: (value: T) => void;
}): [T, (next: T | ((current: T) => T)) => void] {
  const [internalValue, setInternalValue] = React.useState(defaultValue);
  const controlled = controlledProp ?? value !== undefined;
  const currentValue = (controlled ? value : internalValue) as T;

  const setValue = React.useCallback(
    (next: T | ((current: T) => T)) => {
      const resolved = typeof next === "function" ? (next as (current: T) => T)(currentValue) : next;
      if (!controlled) {
        setInternalValue(resolved);
      }
      onChange?.(resolved);
    },
    [controlled, currentValue, onChange]
  );

  return [currentValue, setValue];
}

export function useControllableArrayState<T>({
  value,
  defaultValue,
  onChange
}: {
  value: T[] | undefined;
  defaultValue: T[];
  onChange?: (value: T[]) => void;
}): [T[], (next: T[] | ((current: T[]) => T[])) => void] {
  const [internalValue, setInternalValue] = React.useState(defaultValue);
  const controlled = value !== undefined;
  const currentValue = controlled ? value : internalValue;

  const setValue = React.useCallback(
    (next: T[] | ((current: T[]) => T[])) => {
      const resolved = typeof next === "function" ? (next as (current: T[]) => T[])(currentValue) : next;
      if (!controlled) {
        setInternalValue(resolved);
      }
      onChange?.(resolved);
    },
    [controlled, currentValue, onChange]
  );

  return [currentValue, setValue];
}
