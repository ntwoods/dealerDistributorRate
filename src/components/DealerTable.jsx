import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowUpDown, Search, FileText, RotateCcw } from "lucide-react";
import { useMemo, useRef, useState, useEffect } from "react";

function AnimatedCount({ value }) {
  const [displayValue, setDisplayValue] = useState(value);
  const previous = useRef(value);

  useEffect(() => {
    const start = previous.current;
    const end = value;
    if (start === end) {
      return;
    }

    const duration = 260;
    const startedAt = performance.now();
    let frame;

    const tick = (now) => {
      const progress = Math.min((now - startedAt) / duration, 1);
      const next = Math.round(start + (end - start) * progress);
      setDisplayValue(next);
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        previous.current = end;
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return <span>{displayValue.toLocaleString()}</span>;
}

export default function DealerTable({ data, onViewDocs }) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);

  const stationValues = useMemo(
    () => Array.from(new Set(data.map((item) => item.station).filter(Boolean))).sort(),
    [data]
  );

  const marketingValues = useMemo(
    () => Array.from(new Set(data.map((item) => item.marketingPerson).filter(Boolean))).sort(),
    [data]
  );

  const columns = useMemo(
    () => [
      {
        accessorKey: "dealerName",
        header: "Dealer Name",
        cell: ({ row }) => <span className="font-medium text-slate-900">{row.original.dealerName || "-"}</span>,
      },
      {
        accessorKey: "station",
        header: "Station",
        cell: ({ row }) => row.original.station || "-",
      },
      {
        accessorKey: "marketingPerson",
        header: "Marketing Person",
        cell: ({ row }) => row.original.marketingPerson || "-",
      },
      {
        id: "rateDoc",
        header: "Rate_Doc",
        cell: ({ row }) => {
          const count = row.original.fileIds?.length || 0;
          return (
            <button
              onClick={() => onViewDocs(row.original)}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-brand-200 bg-brand-50 px-3 text-xs font-semibold text-brand-700 transition hover:bg-brand-100"
            >
              <FileText className="h-3.5 w-3.5" />
              View Docs ({count})
            </button>
          );
        },
      },
    ],
    [onViewDocs]
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      globalFilter,
      sorting,
      columnFilters,
    },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    globalFilterFn: (row, _columnId, filterValue) => {
      const query = String(filterValue || "").trim().toLowerCase();
      if (!query) {
        return true;
      }
      const haystack = [row.original.dealerName, row.original.station, row.original.marketingPerson]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const filteredRows = table.getRowModel().rows;

  const stationFilter = table.getColumn("station")?.getFilterValue() || "";
  const marketingFilter = table.getColumn("marketingPerson")?.getFilterValue() || "";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand-100 bg-brand-50/60 p-4">
        <div className="inline-flex items-center gap-2 text-sm text-brand-800">
          Showing <AnimatedCount value={filteredRows.length} /> records
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
            <input
              value={globalFilter}
              onChange={(event) => setGlobalFilter(event.target.value)}
              placeholder="Search dealer, station, marketing person"
              className="h-9 w-[250px] rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none ring-brand-200 transition focus:ring"
            />
          </label>

          <select
            value={stationFilter}
            onChange={(event) =>
              table.getColumn("station")?.setFilterValue(event.target.value || undefined)
            }
            className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none ring-brand-200 focus:ring"
          >
            <option value="">All Stations</option>
            {stationValues.map((station) => (
              <option key={station} value={station}>
                {station}
              </option>
            ))}
          </select>

          <select
            value={marketingFilter}
            onChange={(event) =>
              table.getColumn("marketingPerson")?.setFilterValue(event.target.value || undefined)
            }
            className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none ring-brand-200 focus:ring"
          >
            <option value="">All Marketing Persons</option>
            {marketingValues.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>

          <button
            onClick={() => {
              setGlobalFilter("");
              setColumnFilters([]);
              setSorting([]);
            }}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <RotateCcw className="h-4 w-4" />
            Clear filters
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="max-h-[65vh] overflow-auto scrollbar-thin">
          <table className="min-w-full text-left text-sm">
            <thead className="sticky top-0 z-10 bg-slate-100/95 backdrop-blur">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} className="px-4 py-3 font-semibold text-slate-700">
                      {header.isPlaceholder ? null : (
                        <button
                          onClick={header.column.getToggleSortingHandler()}
                          className="inline-flex items-center gap-1"
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {header.column.getCanSort() && <ArrowUpDown className="h-3.5 w-3.5 text-slate-500" />}
                        </button>
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {filteredRows.length > 0 ? (
                filteredRows.map((row) => (
                  <tr key={row.id} className="border-t border-slate-100 hover:bg-brand-50/35">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3 text-slate-700">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-8 text-center text-slate-500">
                    No records matched your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

