# @flownamix/react-data-grid-kit

Enterprise React data table components for dense product workflows.

This package is the product artifact. The repo's VitePress and Storybook apps
are development workspaces used to document, test, and review the package while
it is being built. Important guide pages:

- Quick Start: basic install and first table.
- Core Concepts: state ownership, local/manual modes, and rendering ownership.
- Toolbar and Slots: quick search, column controls, actions, summaries, and pagination slots.
- Columns and Saved Views: visibility, ordering, resizing, pinning, and saved-view state.
- Server Data: manual sorting/filtering, pagination metadata, loading, stale, and error states.
- Inline Editing: editor lifecycle, async validation, and controlled editing.
- Responsive Rendering: built-in mobile fields and custom mobile cards.
- API Reference: complete prop and type reference.

```tsx
import { DataTable, type DataTableColumn } from "@flownamix/react-data-grid-kit";
import "@flownamix/react-data-grid-kit/styles.css";

type Account = { id: string; name: string; owner: string };

const columns: Array<DataTableColumn<Account>> = [
  {
    id: "name",
    header: "Account",
    sortable: true,
    sortAccessor: (row) => row.name,
    renderCell: (row) => <strong>{row.name}</strong>
  },
  {
    id: "owner",
    header: "Owner",
    renderCell: (row) => row.owner
  }
];

<DataTable
  rows={rows}
  columns={columns}
  getRowId={(row) => row.id}
  ariaLabel="Accounts"
  toolbar
  defaultSort={{ columnId: "name", direction: "ascending" }}
/>;
```

The high-level API is generic and package-safe while preserving practical
integration hooks for dense application screens. The base row and sorting model
is powered by TanStack Table; the package layer focuses on styling,
accessibility, enterprise grouping states, responsive cards, and integration
contracts. Row selection is adapted onto TanStack's row-selection state while
preserving the package-level `selectedIds` API. Column `filterFn` hooks opt into
TanStack local filtering; server-owned filters can stay as plain filter state
with `manualFiltering`. The first-class `toolbar` prop can render package-owned
quick search and column controls while still accepting host-owned action and
summary content. Quick search is controlled through `quickSearch`,
`defaultQuickSearch`, and `onQuickSearchChange`; in local mode it uses TanStack
global filtering, and with `manualFiltering` it remains server query state.
Local sorting uses column `sortAccessor`; server-owned
sorting can keep the supplied row order with `manualSorting`. Column visibility
can be controlled by saved views, URL state, or package-owned toolbar controls
through `columnVisibility`, `defaultColumnVisibility`, and render context.
Column order supports the same controlled/uncontrolled saved-view contract and
can expose desktop header drag handles with `enableColumnReordering`.
Server-paged screens keep fetching and pagination controls in the host
application, while `totalRowCount` and `rowIndexOffset` let render slots and
desktop ARIA metadata describe the full result set instead of only the loaded
page.

## Exports

```ts
import { DataTable } from "@flownamix/react-data-grid-kit";
import type { DataTableColumn, DataTableProps } from "@flownamix/react-data-grid-kit";
import "@flownamix/react-data-grid-kit/styles.css";
```

Use `@flownamix/react-data-grid-kit/headless` for model helpers and public types in saved-view stores, adapters, or tests:

```ts
import { nextSort, rowMatchesQuickSearch } from "@flownamix/react-data-grid-kit/headless";
```

The package also exports `tokens.css` for token-only theme integration.

## License Status

This package is currently `UNLICENSED` and prepared for private/internal
evaluation only. Do not publish publicly or grant production redistribution
rights until legal selects the final license.
