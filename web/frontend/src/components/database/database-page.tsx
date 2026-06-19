import { IconCode, IconDatabase, IconRefresh, IconSearch, IconTable, IconX } from "@tabler/icons-react"
import type { ReactNode } from "react"
import { useCallback, useEffect, useMemo, useState } from "react"

import { getTableData, getTables } from "@/api/database"
import type { RowData, TableEntry } from "@/api/database"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

export function DatabasePage() {
  const [tables, setTables] = useState<TableEntry[]>([])
  const [selectedTable, setSelectedTable] = useState<string>("")
  const [columns, setColumns] = useState<string[]>([])
  const [rows, setRows] = useState<RowData[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingData, setLoadingData] = useState(false)
  const [search, setSearch] = useState("")
  const [detailRow, setDetailRow] = useState<RowData | null>(null)
  const [tableFilter, setTableFilter] = useState("")
  const [jsonView, setJsonView] = useState(false)

  const fetchTables = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getTables()
      setTables(res.tables)
      if (res.tables.length > 0 && !selectedTable) {
        setSelectedTable(res.tables[0].name)
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [selectedTable])

  const fetchData = useCallback(async (table: string) => {
    if (!table) return
    setLoadingData(true)
    setDetailRow(null)
    try {
      const res = await getTableData(table)
      setRows(res.rows)
      if (res.rows.length > 0) {
        setColumns(Object.keys(res.rows[0]))
      } else {
        setColumns([])
      }
    } catch {
      setColumns([])
      setRows([])
    } finally {
      setLoadingData(false)
    }
  }, [])

  useEffect(() => {
    fetchTables()
  }, [])

  useEffect(() => {
    if (selectedTable) {
      fetchData(selectedTable)
    }
  }, [selectedTable, fetchData])

  const filteredRows = useMemo(() => {
    if (!search) return rows
    const q = search.toLowerCase()
    return rows.filter((row) =>
      Object.values(row).some((v) =>
        String(v ?? "").toLowerCase().includes(q),
      ),
    )
  }, [rows, search])

  const filteredTables = useMemo(() => {
    if (!tableFilter) return tables
    const q = tableFilter.toLowerCase()
    return tables.filter((t) => t.name.toLowerCase().includes(q))
  }, [tables, tableFilter])

  const selectedEntry = useMemo(
    () => tables.find((t) => t.name === selectedTable),
    [tables, selectedTable],
  )

  return (
    <div className="flex h-full flex-col">
      <PageHeader title="Database" />

      <div className="flex flex-1 overflow-hidden">
        {/* Table sidebar */}
        <div className="border-border/40 flex w-64 shrink-0 flex-col border-r">
          <div className="border-border/20 flex items-center gap-2 border-b px-3 py-2.5">
            <IconTable className="size-4 text-[#c8a969]" />
            <span className="text-xs font-medium text-muted-foreground">
              Tables ({tables.length})
            </span>
          </div>
          <div className="border-border/20 border-b px-3 py-2">
            <Input
              placeholder="Filter tables..."
              value={tableFilter}
              onChange={(e) => setTableFilter(e.target.value)}
              className="h-7 border-border/30 text-xs"
            />
          </div>
          <div className="flex min-h-0 flex-1">
            <ScrollArea className="h-full w-full">
              {loading ? (
                <div className="space-y-1 p-2">
                  {Array.from({ length: 15 }).map((_, i) => (
                    <Skeleton key={i} className="h-7 w-full rounded" />
                  ))}
                </div>
              ) : (
                <div className="p-1.5">
                  {filteredTables.map((t) => (
                    <button
                      key={t.name}
                      onClick={() => {
                        setSelectedTable(t.name)
                        setDetailRow(null)
                      }}
                      className={cn(
                        "flex w-full items-center justify-between rounded-sm px-2.5 py-1.5 text-left text-xs transition-colors",
                        selectedTable === t.name
                          ? "bg-[#c8a969]/15 text-[#c8a969] font-medium"
                          : "text-muted-foreground hover:bg-muted/40 hover:text-foreground",
                      )}
                    >
                      <span className="truncate">{t.name}</span>
                      <span
                        className={cn(
                          "ml-2 shrink-0 rounded-sm px-1.5 py-0.5 text-[10px] tabular-nums",
                          selectedTable === t.name
                            ? "bg-[#c8a969]/20 text-[#c8a969]"
                            : "bg-muted/50 text-muted-foreground/60",
                        )}
                      >
                        {t.count}
                      </span>
                    </button>
                  ))}
                  {filteredTables.length === 0 && (
                    <p className="text-muted-foreground/50 px-2.5 py-4 text-center text-xs">
                      No tables match filter
                    </p>
                  )}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>

        {/* Main content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {!selectedTable ? (
            <div className="flex flex-1 items-center justify-center">
              <Card className="border-border/40">
                <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
                  <IconDatabase className="size-12 text-muted-foreground/40" />
                  <p className="text-muted-foreground text-sm">
                    Select a table from the sidebar
                  </p>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="flex h-full flex-col p-4">
              {/* Toolbar */}
              <div className="mb-3 flex shrink-0 items-center gap-3">
                <div className="flex items-center gap-2">
                  <IconDatabase className="size-4 text-[#c8a969]" />
                  <span className="text-sm font-medium">{selectedTable}</span>
                  {selectedEntry && (
                    <span className="text-muted-foreground/50 text-xs">
                      ({selectedEntry.count} row{selectedEntry.count !== 1 ? "s" : ""})
                    </span>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setJsonView(!jsonView)}
                  className={cn("border-border/40 size-7", jsonView && "bg-muted")}
                  title={jsonView ? "Table view" : "JSON view"}
                >
                  <IconCode className="size-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => fetchData(selectedTable)}
                  disabled={loadingData}
                  className="border-border/40 size-7"
                >
                  <IconRefresh className="size-3.5" />
                </Button>
                <div className="relative ml-auto">
                  <IconSearch className="text-muted-foreground absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2" />
                  <Input
                    placeholder="Search rows..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-8 w-56 border-border/40 pl-8 text-xs"
                  />
                </div>
              </div>

              {/* Data */}
              {loadingData ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-8 w-full rounded" />
                  ))}
                </div>
              ) : columns.length === 0 ? (
                <div className="flex flex-1 items-center justify-center">
                  <p className="text-muted-foreground/50 text-xs">
                    No data in this table
                  </p>
                </div>
              ) : (
                <div className="flex min-h-0 flex-1 flex-col">
                  <div className="mb-1.5 shrink-0">
                    <span className="text-muted-foreground/60 text-xs">
                      Showing {filteredRows.length} of {selectedEntry?.count ?? rows.length} row
                      {rows.length !== 1 ? "s" : ""}
                      {" · "}{columns.length} col{columns.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="min-h-0 flex-1 overflow-hidden rounded-md border border-border/40">
                    <div className="h-full overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="hover:bg-transparent">
                            {columns.map((col) => (
                              <TableHead
                                key={col}
                                className="border-border/20 whitespace-nowrap border-r text-xs last:border-r-0"
                              >
                                <span className="font-semibold">{col}</span>
                              </TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredRows.length === 0 ? (
                            <TableRow>
                              <TableCell
                                colSpan={columns.length}
                                className="text-muted-foreground py-12 text-center text-sm"
                              >
                                {search
                                  ? "No rows match search"
                                  : "No rows"}
                              </TableCell>
                            </TableRow>
                          ) : (
                            filteredRows.map((row, i) => (
                              <TableRow
                                key={i}
                                className={cn(
                                  "cursor-pointer transition-colors",
                                  detailRow === row
                                    ? "bg-[#c8a969]/10"
                                    : "hover:bg-muted/40",
                                )}
                                onClick={() =>
                                  setDetailRow(detailRow === row ? null : row)
                                }
                              >
                                {columns.map((col) => (
                                  <TableCell
                                    key={col}
                                    className="border-border/20 max-w-[200px] truncate border-r text-xs last:border-r-0"
                                  >
                                    {formatValue(row[col])}
                                  </TableCell>
                                ))}
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  {/* Detail panel */}
                  {detailRow && (
                    <div className="mt-3 shrink-0">
                      <div className="mb-1.5 flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">
                          Row Detail
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDetailRow(null)}
                          className="size-5"
                        >
                          <IconX className="size-3" />
                        </Button>
                      </div>
                      <Card className="border-border/40">
                        <CardContent className="grid grid-cols-2 gap-x-6 gap-y-1.5 p-3">
                          {columns.map((col) => (
                            <div
                              key={col}
                              className="flex items-baseline gap-1.5 text-xs"
                            >
                              <span className="text-muted-foreground shrink-0 font-medium">
                                {col}
                              </span>
                              <span className="text-muted-foreground/30">:</span>
                              <span className="truncate font-mono">
                                {formatValue(detailRow[col])}
                              </span>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function formatValue(v: unknown): ReactNode {
  if (v === null || v === undefined) return "null"
  if (typeof v === "object") {
    try {
      return JSON.stringify(v)
    } catch {
      return String(v)
    }
  }
  return String(v)
}
