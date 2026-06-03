# Accessibility

The component uses grid roles, labelled controls, keyboard row activation, and native checkboxes. Consumers are responsible for semantic content inside custom renderers.

Checklist:

- Provide `ariaLabel` or `ariaLabelledBy` so the desktop grid and mobile list have an accessible name.
- Provide `rowAriaLabel` when the visible cells do not clearly identify the row.
- Label custom filter controls and keep every control keyboard reachable. Filter popovers open as labelled dialogs, move focus into the custom control, close on Escape/outside interaction, and return focus to the trigger.
- Desktop grids use a package-owned focus model: focusing the grid moves to the first visible cell, arrow keys move across visible cells, Home/End move within a row, Ctrl+Home/Ctrl+End move to the first or last visible cell, PageUp/PageDown move by the configured visible row viewport, Space toggles focused package-owned selection/group controls, and F2 or Enter opens an editable cell.
- Column visibility updates remove hidden fields from desktop grid navigation and built-in mobile fields. `aria-colcount` and `aria-colindex` describe only the currently visible desktop columns plus selection/action columns.
- Resizable desktop columns expose labelled vertical separator controls with current/min/max size metadata. Pointer dragging and keyboard resizing update the same column sizing state, and hidden columns remove their resize controls with the rest of the header cell.
- For ungrouped server-paged tables, pass `totalRowCount` and `rowIndexOffset` so `aria-rowcount` and `aria-rowindex` describe the full result set instead of resetting each loaded page to row 1.
- Label inline edit controls and provide obvious save/cancel actions inside custom editors. The table focuses the first editor control on open, Escape cancels, and Ctrl+Enter or Cmd+Enter commits.
- Use the `pending`, `error`, and `errorId` values in custom editors to disable duplicate save actions and expose validation state. Package-rendered commit errors use `role="alert"`; wire `errorId` to the focused control with `aria-describedby` when an error is present.
- If the edited row or column is removed from the visible model by saved-view column visibility, filtering, grouping collapse, or editability changes, the table clears the editor and ignores any stale async commit.
- Built-in mobile fields use the same edit focus and shortcut behavior. If you provide `renderCard`, include equivalent labelled edit controls in that custom mobile UI.
- Preserve visible focus indicators when overriding styles.
- Keep row actions as real buttons or links.
- Prefer `renderCard` on mobile when a tabular reading order becomes unclear.
- Interactive content inside `renderCell`, `renderRowActions`, and `renderCard` can use native controls or common ARIA interactive roles without triggering row activation.
- Use `data-rdtg-stop-row-click` on custom focusable widgets that should own click and keyboard events.
- Use `motion="system"` by default and `motion="reduced"` for sensitive product areas.
