# Responsive Rendering

`DataTable` renders a desktop grid and a mobile list from the same modeled data. Desktop uses grid roles, sticky headers, virtualization, pinned columns, resize handles, and keyboard cell navigation. Mobile uses list semantics with either built-in fields or app-owned cards.

## Built-In Mobile Fields

If you do not pass `renderCard`, the mobile view renders visible columns as labelled fields.

```tsx
<DataTable
  rows={rows}
  columns={columns}
  getRowId={(row) => row.id}
  ariaLabel="Accounts"
/>
```

Built-in mobile fields honor:

- Column visibility.
- Column order.
- Column pinning order.
- `hideOnMobile`.
- Selection state.
- Group headers and collapse state.
- Inline editing for editable columns.
- Loading, empty, and error states.

Use `hideOnMobile` for supporting columns that should exist on desktop but not in the built-in mobile field list.

## Custom Mobile Cards

Use `renderCard` when the mobile reading order needs a domain-specific layout:

```tsx
<DataTable
  rows={rows}
  columns={columns}
  getRowId={(row) => row.id}
  rowAriaLabel={(row) => `${row.name}, ${row.status}`}
  renderCard={(row) => (
    <article>
      <strong>{row.name}</strong>
      <span>{row.owner}</span>
      <StatusPill status={row.status} />
    </article>
  )}
/>
```

When `renderCard` is supplied, mobile card content is fully app-owned. It does not automatically hide fields based on `columnVisibility`; read controlled saved-view state in the host if custom cards should mirror desktop column controls.

## Row Activation and Interactive Content

`onRowClick` makes desktop rows and mobile cards keyboard reachable. Native interactive descendants do not trigger row activation:

```tsx
<DataTable
  rows={rows}
  columns={columns}
  getRowId={(row) => row.id}
  onRowClick={(row) => openAccount(row.id)}
  renderCard={(row) => (
    <div>
      <strong>{row.name}</strong>
      <button type="button" onClick={() => assign(row.id)}>
        Assign
      </button>
    </div>
  )}
/>
```

Use `data-rdtg-stop-row-click` on custom focusable widgets that are not native controls but should own pointer and keyboard events.

## Layout Sizing

Use `height` for the desktop scroll frame and `mobileHeight` for the mobile list frame:

```tsx
<DataTable
  rows={rows}
  columns={columns}
  getRowId={(row) => row.id}
  height={640}
  mobileHeight={560}
/>
```

Use `rowHeight` and `groupHeight` when custom row templates or group headers need more or less vertical space. For dense work queues, pair `density="compact"` with a tested `rowHeight` so content does not clip.

Use `minWidth` to control when the desktop grid becomes horizontally scrollable. This is especially important when using pinned columns or many fixed-width columns.

## Grouped Mobile Data

Grouped tables keep group headers on mobile. Collapse state, group state, progress labels, counts, actions, and selected rows stay in the mobile representation instead of flattening the data.

Use `renderMobileGroupHeader` when a grouped mobile workflow needs a different header layout from desktop. The callback receives the same group summary and toggle context as `renderGroupHeader`.
