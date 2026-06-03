# Icons

The table includes default icons and accepts partial overrides through `DataTableIcons`.

```tsx
<DataTable
  rows={rows}
  columns={columns}
  getRowId={(row) => row.id}
  icons={{
    Filter: CustomFilterIcon,
    Loading: CustomSpinner
  }}
/>;
```

Icons receive `DataTableIconProps`: class names, size, optional title, and optional `aria-hidden`. Some icon slots receive additional state, such as sort direction, filter active state, or expand state. Keep custom icons visually balanced in a 16px control slot unless you also override the related CSS tokens.

The package exports `defaultIcons` for composition and these default icon components for direct reuse:

- `SortIcon`
- `FilterIcon`
- `ExpandIcon`
- `EditIcon`
- `CheckIcon`
- `CloseIcon`
- `LoadingIcon`
- `MoreIcon`

Use `defaultIcons` when replacing one slot while preserving the rest:

```tsx
import { defaultIcons } from "@flownamix/react-data-grid-kit";

<DataTable
  rows={rows}
  columns={columns}
  getRowId={(row) => row.id}
  icons={{
    ...defaultIcons,
    More: AppMoreIcon
  }}
/>;
```
