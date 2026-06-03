import * as React from "react";
import type {
  DataTableCellEdit,
  DataTableCellEditCommit,
  DataTableCellEditCommitResult,
  DataTableColumn,
  DataTableRowId
} from "../types";
import { useControllableState } from "../utils/controllable";

export interface UseDataTableEditingOptions<T> {
  editingCell?: DataTableCellEdit;
  editingCellControlled?: boolean;
  defaultEditingCell?: DataTableCellEdit;
  onEditingCellChange?: (cell: DataTableCellEdit | undefined) => void;
  onCellEditCommit?: (
    commit: DataTableCellEditCommit<T>
  ) => void | DataTableCellEditCommitResult | Promise<void | DataTableCellEditCommitResult>;
}

export interface DataTableEditingApi<T> {
  editingCell: DataTableCellEdit | undefined;
  editingSource: "desktop" | "mobile" | undefined;
  draftValue: unknown;
  draftInitialized: boolean;
  commitPending: boolean;
  commitError: React.ReactNode | undefined;
  startEditing: (
    row: T,
    rowId: DataTableRowId,
    column: DataTableColumn<T>,
    source?: "desktop" | "mobile"
  ) => void;
  setDraftValue: (value: unknown) => void;
  commitEditing: (row: T, rowId: DataTableRowId, column: DataTableColumn<T>, value: unknown) => Promise<void>;
  cancelEditing: () => void;
  resetEditing: () => void;
}

export function useDataTableEditing<T>({
  editingCell,
  editingCellControlled,
  defaultEditingCell,
  onEditingCellChange,
  onCellEditCommit
}: UseDataTableEditingOptions<T>): DataTableEditingApi<T> {
  const [currentEditingCell, setCurrentEditingCell] = useControllableState<DataTableCellEdit | undefined>({
    value: editingCell,
    defaultValue: defaultEditingCell,
    controlled: editingCellControlled,
    onChange: onEditingCellChange
  });
  const [editingSource, setEditingSource] = React.useState<"desktop" | "mobile" | undefined>();
  const [draftValue, setDraftValue] = React.useState<unknown>();
  const [draftInitialized, setDraftInitialized] = React.useState(false);
  const [commitPending, setCommitPending] = React.useState(false);
  const [commitError, setCommitError] = React.useState<React.ReactNode>();
  const commitRunIdRef = React.useRef(0);
  const expectedEditingCellKeyRef = React.useRef<string | undefined>(undefined);
  const editingCellKey = editingCellIdentity(currentEditingCell);
  const previousEditingCellKeyRef = React.useRef(editingCellKey);

  React.useEffect(() => {
    if (previousEditingCellKeyRef.current === editingCellKey) {
      return;
    }

    previousEditingCellKeyRef.current = editingCellKey;
    if (expectedEditingCellKeyRef.current === editingCellKey) {
      expectedEditingCellKeyRef.current = undefined;
      return;
    }

    expectedEditingCellKeyRef.current = undefined;
    commitRunIdRef.current += 1;
    setCommitPending(false);
    setCommitError(undefined);
    setDraftValue(undefined);
    setDraftInitialized(false);
    setEditingSource(undefined);
  }, [editingCellKey]);

  const startEditing = React.useCallback(
    (row: T, rowId: DataTableRowId, column: DataTableColumn<T>, source?: "desktop" | "mobile") => {
      setDraftValue(resolveEditValue(row, rowId, column));
      setDraftInitialized(true);
      setCommitPending(false);
      setCommitError(undefined);
      setEditingSource(source);
      expectedEditingCellKeyRef.current = editingCellIdentity({ rowId, columnId: column.id });
      setCurrentEditingCell({ rowId, columnId: column.id });
    },
    [setCurrentEditingCell]
  );
  const updateDraftValue = React.useCallback((value: unknown) => {
    setDraftValue(value);
    setDraftInitialized(true);
    setCommitError(undefined);
  }, []);

  const resetEditing = React.useCallback(() => {
    commitRunIdRef.current += 1;
    expectedEditingCellKeyRef.current = undefined;
    setCurrentEditingCell(undefined);
    setEditingSource(undefined);
    setDraftValue(undefined);
    setDraftInitialized(false);
    setCommitPending(false);
    setCommitError(undefined);
  }, [setCurrentEditingCell]);

  const cancelEditing = React.useCallback(() => {
    if (commitPending) {
      return;
    }
    resetEditing();
  }, [commitPending, resetEditing]);

  const commitEditing = React.useCallback(
    async (row: T, rowId: DataTableRowId, column: DataTableColumn<T>, value: unknown) => {
      if (commitPending) {
        return;
      }

      const commitRunId = commitRunIdRef.current + 1;
      commitRunIdRef.current = commitRunId;
      setCommitPending(true);
      setCommitError(undefined);

      try {
        const result = await onCellEditCommit?.({ row, rowId, column, value });
        if (commitRunIdRef.current !== commitRunId) {
          return;
        }

        const normalizedResult = result ?? {};
        const nextError = normalizedResult.error;
        if (nextError) {
          setCommitError(nextError);
          setCommitPending(false);
          return;
        }

        if (normalizedResult.close === false) {
          setCommitPending(false);
          return;
        }

        setCurrentEditingCell(undefined);
        setEditingSource(undefined);
        setDraftValue(undefined);
        setDraftInitialized(false);
        setCommitPending(false);
      } catch (error) {
        if (commitRunIdRef.current !== commitRunId) {
          return;
        }
        setCommitError(commitErrorFromUnknown(error));
        setCommitPending(false);
      }
    },
    [commitPending, onCellEditCommit, setCurrentEditingCell]
  );

  return {
    editingCell: currentEditingCell,
    editingSource,
    draftValue,
    draftInitialized,
    commitPending,
    commitError,
    startEditing,
    setDraftValue: updateDraftValue,
    commitEditing,
    cancelEditing,
    resetEditing
  };
}

function resolveEditValue<T>(row: T, rowId: DataTableRowId, column: DataTableColumn<T>): unknown {
  return column.getEditValue?.(row, { row, rowId, column });
}

function commitErrorFromUnknown(error: unknown): React.ReactNode {
  if (React.isValidElement(error)) {
    return error;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  if (typeof error === "string" && error.trim()) {
    return error;
  }
  return "The edit could not be saved.";
}

function editingCellIdentity(cell: DataTableCellEdit | undefined): string {
  return cell ? `${cell.rowId}:${cell.columnId}` : "none";
}
