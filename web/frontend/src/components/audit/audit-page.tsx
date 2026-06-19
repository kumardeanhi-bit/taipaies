import { IconClipboardCheck, IconRefresh } from "@tabler/icons-react"
import { useCallback, useEffect, useState } from "react"

import type { AuditEntry } from "@/api/database"
import { getAuditLog } from "@/api/database"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"

export function AuditPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getAuditLog()
      setEntries(res.entries)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetch()
  }, [fetch])

  return (
    <div className="flex h-full flex-col">
      <PageHeader title="AI Audit Log" />

      <div className="flex flex-1 flex-col p-4">
        <div className="mb-3 flex shrink-0 items-center gap-3">
          <IconClipboardCheck className="size-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            {entries.length} action{entries.length !== 1 ? "s" : ""} logged
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={fetch}
            disabled={loading}
            className="border-border/40 size-7"
          >
            <IconRefresh className="size-3.5" />
          </Button>
        </div>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded" />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-1 items-center justify-center">
            <Card className="border-border/40">
              <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
                <IconClipboardCheck className="size-12 text-muted-foreground/40" />
                <p className="text-muted-foreground text-sm">No audit entries yet</p>
              </CardContent>
            </Card>
          </div>
        ) : (
          <ScrollArea className="min-h-0 flex-1">
            <div className="space-y-2">
              {entries.map((e) => (
                <Card key={e.id} className="border-border/40">
                  <CardContent className="flex items-start gap-3 p-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold uppercase text-muted-foreground">
                      {e.performed_by.slice(0, 2)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-medium">{e.performed_by}</span>
                        <span className="text-muted-foreground/50">·</span>
                        <span className={e.action === "create" ? "text-green-500" : "text-amber-500"}>
                          {e.action === "create" ? "CREATED" : "UPDATED"}
                        </span>
                        <span className="text-muted-foreground/50">·</span>
                        <span className="text-muted-foreground">{e.table_name}</span>
                        {e.row_id && (
                          <>
                            <span className="text-muted-foreground/50">·</span>
                            <span className="text-muted-foreground">#{e.row_id}</span>
                          </>
                        )}
                      </div>
                      {e.summary && (
                        <p className="mt-0.5 text-xs text-muted-foreground/70">{e.summary}</p>
                      )}
                      <p className="mt-1 text-[10px] text-muted-foreground/40">
                        {formatTime(e.created_at)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  )
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleString()
  } catch {
    return iso
  }
}
