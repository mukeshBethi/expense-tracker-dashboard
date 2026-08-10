import { useState, useMemo, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const CARD_KEYS = ["date", "category", "amount", "note", "actions"];

export default function DataTable({ columns, rows, selectable = false, rowsPerPage = 10, resultLabel, selectionBar }) {
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState(new Set());

  useEffect(() => {
    if (page > 0 && page * rowsPerPage >= rows.length) setPage(0);
  }, [rows.length, page, rowsPerPage]);

  const totalPages = Math.max(1, Math.ceil(rows.length / rowsPerPage));
  const pageRows = useMemo(() => rows.slice(page * rowsPerPage, (page + 1) * rowsPerPage), [rows, page, rowsPerPage]);

  function toggleRow(id) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAllOnPage() {
    setSelected(prev => {
      const next = new Set(prev);
      const allSelected = pageRows.every(r => next.has(r.id));
      pageRows.forEach(r => { if (allSelected) next.delete(r.id); else next.add(r.id); });
      return next;
    });
  }

  function clearSelection() {
    setSelected(new Set());
  }

  function renderCell(col, row) {
    return col.render ? col.render(row) : row[col.key];
  }

  // Mobile card layout is built from the same `columns` config the desktop
  // table uses -- no page has to define a separate mobile shape. Date/
  // category/amount form the card's header line, note is a secondary line,
  // actions become a trailing row, and anything else (Budget/Remaining on
  // the Expenses page) becomes a small muted stat chip -- present but not
  // competing with the primary info, instead of forcing horizontal scroll
  // on a table that doesn't fit a phone width.
  const dateCol = columns.find(c => c.key === "date");
  const categoryCol = columns.find(c => c.key === "category");
  const amountCol = columns.find(c => c.key === "amount");
  const noteCol = columns.find(c => c.key === "note");
  const actionsCol = columns.find(c => c.key === "actions");
  const extraCols = columns.filter(c => !CARD_KEYS.includes(c.key));

  return (
    <div className="flex flex-col gap-3">
      {selected.size > 0 && selectionBar ? (
        selectionBar(Array.from(selected), clearSelection)
      ) : (
        resultLabel && <p className="text-xs text-pr-secondary px-1">{resultLabel}</p>
      )}

      {/* Desktop/tablet: table, unchanged */}
      <div className="overflow-x-auto hidden md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-pr-border-subtle">
              {selectable && (
                <th className="w-10 px-2 py-2.5">
                  <input type="checkbox" checked={pageRows.length > 0 && pageRows.every(r => selected.has(r.id))} onChange={toggleAllOnPage} className="cursor-pointer" />
                </th>
              )}
              {columns.map(col => (
                <th key={col.key} style={col.width ? { width: col.width } : undefined} className={`px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-pr-tertiary ${col.align === "right" ? "text-right" : "text-left"}`}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row, i) => (
              <tr key={row.id ?? i} className={`${i % 2 === 1 ? "bg-pr-subtle/40" : ""} hover:bg-pr-subtle transition-colors`}>
                {selectable && (
                  <td className="w-10 px-2 py-2.5">
                    <input type="checkbox" checked={selected.has(row.id)} onChange={() => toggleRow(row.id)} className="cursor-pointer" />
                  </td>
                )}
                {columns.map(col => (
                  <td key={col.key} className={`px-3 py-2.5 ${col.align === "right" ? "text-right font-mono tabular-nums" : ""} ${col.strong ? "font-medium text-pr-primary" : "text-pr-secondary"}`}>
                    {renderCell(col, row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: card list, same data/columns, phone-native shape */}
      <div className="flex flex-col gap-2 md:hidden">
        {pageRows.map((row, i) => (
          <div key={row.id ?? i} className="rounded-pr-default border border-pr-border-subtle bg-pr-subtle/40 p-3 flex flex-col gap-2">
            <div className="flex items-start gap-3">
              {selectable && (
                <input type="checkbox" checked={selected.has(row.id)} onChange={() => toggleRow(row.id)} className="cursor-pointer mt-1 flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  {dateCol && <p className="text-xs text-pr-tertiary">{renderCell(dateCol, row)}</p>}
                  {categoryCol && <p className="text-sm font-medium text-pr-primary truncate">{renderCell(categoryCol, row)}</p>}
                </div>
                {amountCol && <p className="text-sm font-mono tabular-nums font-medium text-pr-primary flex-shrink-0">{renderCell(amountCol, row)}</p>}
              </div>
            </div>
            {noteCol && renderCell(noteCol, row) !== "—" && (
              <p className="text-xs text-pr-secondary truncate">{renderCell(noteCol, row)}</p>
            )}
            {extraCols.length > 0 && (
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {extraCols.map(col => (
                  <span key={col.key} className="text-xs text-pr-tertiary font-mono tabular-nums">
                    {col.label}: {renderCell(col, row)}
                  </span>
                ))}
              </div>
            )}
            {actionsCol && (
              <div className="flex justify-end -mr-1 -mb-1">{renderCell(actionsCol, row)}</div>
            )}
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-1">
          <span className="text-xs text-pr-tertiary">Page {page + 1} of {totalPages}</span>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="inline-flex items-center gap-1 h-10 px-3 rounded-pr-default text-xs font-medium text-pr-primary bg-pr-subtle hover:bg-pr-border-default disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer">
              <ChevronLeft size={14} /> Previous
            </button>
            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="inline-flex items-center gap-1 h-10 px-3 rounded-pr-default text-xs font-medium text-pr-primary bg-pr-subtle hover:bg-pr-border-default disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer">
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
