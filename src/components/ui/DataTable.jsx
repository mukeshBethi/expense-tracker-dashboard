import { useState, useMemo, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

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

  return (
    <div className="flex flex-col gap-3">
      {selected.size > 0 && selectionBar ? (
        selectionBar(Array.from(selected), clearSelection)
      ) : (
        resultLabel && <p className="text-xs text-pr-secondary px-1">{resultLabel}</p>
      )}
      <div className="overflow-x-auto">
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
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-1">
          <span className="text-xs text-pr-tertiary">Page {page + 1} of {totalPages}</span>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-pr-default text-xs font-medium text-pr-primary bg-pr-subtle hover:bg-pr-border-default disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer">
              <ChevronLeft size={14} /> Previous
            </button>
            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-pr-default text-xs font-medium text-pr-primary bg-pr-subtle hover:bg-pr-border-default disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer">
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
