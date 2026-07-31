import type * as React from "react";

const INTERACTIVE_SELECTOR = [
  "button",
  "a[href]",
  "input",
  "select",
  "textarea",
  "summary",
  "[role='button']",
  "[role='link']",
  "[role='checkbox']",
  "[role='menuitem']",
  "[tabindex]:not([tabindex='-1'])",
  "[data-rdtg-stop-row-click]"
].join(",");

export function eventStartedInInteractiveElement(event: React.MouseEvent<HTMLElement>): boolean {
  return targetIsInteractive(event.target, event.currentTarget);
}

export function keyboardEventStartedInChild(event: React.KeyboardEvent<HTMLElement>): boolean {
  return event.currentTarget !== event.target;
}

function targetIsInteractive(target: EventTarget, currentTarget: HTMLElement): boolean {
  if (!(target instanceof Element)) {
    return false;
  }

  const interactiveElement = target.closest(INTERACTIVE_SELECTOR);
  return Boolean(interactiveElement && interactiveElement !== currentTarget && currentTarget.contains(interactiveElement));
}
