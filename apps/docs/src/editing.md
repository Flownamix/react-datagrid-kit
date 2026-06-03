# Inline Editing

Inline editing is opt-in per column. The table owns the edit lifecycle, focus movement, pending state, validation display, and stale commit protection. The host application owns the editor markup and data mutation.

## Basic Editor

Add `editable`, `getEditValue`, and `renderEditCell` to a column:

```tsx
const columns: Array<DataTableColumn<Account>> = [
  {
    id: "owner",
    header: "Owner",
    editable: true,
    getEditValue: (row) => row.owner,
    renderCell: (row) => row.owner,
    renderEditCell: ({ value, setValue, commit, cancel }) => (
      <form aria-label="Edit owner">
        <input
          aria-label="Owner"
          value={String(value ?? "")}
          onChange={(event) => setValue(event.target.value)}
        />
        <button type="button" onClick={() => commit()}>Save</button>
        <button type="button" onClick={cancel}>Cancel</button>
      </form>
    )
  }
];
```

Persist changes in `onCellEditCommit`:

```tsx
<DataTable
  rows={rows}
  columns={columns}
  getRowId={(row) => row.id}
  onCellEditCommit={({ rowId, column, value }) => {
    if (column.id === "owner") {
      updateAccountOwner(rowId, String(value ?? ""));
    }
  }}
/>
```

The table does not mutate rows. Update your local store, server cache, or query result after validation succeeds.

The edit lifecycle types are exported for shared column factories and server adapters:

- `DataTableCellEdit` describes the currently edited `{ rowId, columnId }`.
- `DataTableEditCellContext<T>` is passed to `renderEditCell`.
- `DataTableCellEditCommit<T>` is passed to `onCellEditCommit`.
- `DataTableCellEditCommitResult` is the optional commit return value for validation and close control.

## Async Validation and Commit

Commit handlers can return a promise. While the promise is pending, `pending` is true, duplicate commits are ignored, and Escape cancel is blocked.

```tsx
<DataTable
  rows={rows}
  columns={columns}
  getRowId={(row) => row.id}
  onCellEditCommit={async ({ rowId, value }) => {
    const owner = String(value ?? "").trim();

    if (!owner) {
      return { close: false, error: "Owner is required" };
    }

    await saveOwner(rowId, owner);
  }}
/>
```

Inside `renderEditCell`, use `pending`, `error`, and `errorId`:

```tsx
renderEditCell: ({ value, setValue, commit, cancel, pending, error, errorId }) => (
  <form aria-label="Edit owner">
    <input
      aria-label="Owner"
      aria-describedby={error ? errorId : undefined}
      aria-invalid={error ? "true" : "false"}
      disabled={pending}
      value={String(value ?? "")}
      onChange={(event) => setValue(event.target.value)}
    />
    <button type="button" disabled={pending} onClick={() => commit()}>
      {pending ? "Saving" : "Save"}
    </button>
    <button type="button" disabled={pending} onClick={cancel}>
      Cancel
    </button>
  </form>
)
```

Thrown or rejected errors keep the editor open and render the message as a package alert. Returning `{ close: false, error }` does the same without throwing.

## Simple Select Editors

Editors do not need a popover when the value is compact. Use native controls for enum values:

```tsx
renderEditCell: ({ value, setValue, commit, cancel }) => (
  <form aria-label="Edit status">
    <select
      aria-label="Status"
      value={String(value ?? "active")}
      onChange={(event) => setValue(event.target.value)}
    >
      <option value="active">Active</option>
      <option value="review">In review</option>
      <option value="blocked">Blocked</option>
    </select>
    <button type="button" onClick={() => commit()}>Save</button>
    <button type="button" onClick={cancel}>Cancel</button>
  </form>
)
```

## Controlled Editing

Use `editingCell` with `onEditingCellChange` when the host controls which cell is open:

```tsx
const [editingCell, setEditingCell] = useState<DataTableCellEdit | undefined>();

<DataTable
  rows={rows}
  columns={columns}
  getRowId={(row) => row.id}
  editingCell={editingCell}
  onEditingCellChange={setEditingCell}
/>
```

Passing `editingCell={undefined}` keeps editing controlled in a closed state. Edit triggers call `onEditingCellChange`, but the editor does not open until the host supplies the requested cell.

## Stale Edit Protection

The table clears editing state when the edited row or column leaves the visible model because of column visibility, filtering, grouping collapse, or editability changes. Stale async commits from a removed or replaced editor are ignored.

While a controlled editor is open, refreshed `rows` can update the displayed value until the user changes the draft. Once the draft is dirty, later refreshes do not overwrite the user's in-progress edit.

## Keyboard Behavior

- Opening an editor focuses the first focusable control inside the editor.
- Escape cancels editing.
- Ctrl+Enter or Cmd+Enter commits the current value.
- `commit()` commits the current draft.
- `commit(value)` commits the provided value, including explicit `undefined`.

Custom editors may add their own field-specific shortcuts, but should keep labelled controls and clear save/cancel affordances.
