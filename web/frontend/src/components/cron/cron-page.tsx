import { IconPlayerPlay, IconPlayerStop, IconRefresh, IconTrash } from "@tabler/icons-react"
import { useCallback, useEffect, useState } from "react"


import type { CronJob } from "@/api/cron"
import { deleteCronJob, getCronJobs, toggleCronJob } from "@/api/cron"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

function formatTime(ms: number | undefined): string {
  if (!ms) return "-"
  return new Date(ms).toLocaleString()
}

function formatSchedule(job: CronJob): string {
  const s = job.schedule
  if (s.kind === "every" && s.everyMs) {
    const secs = Math.floor(s.everyMs / 1000)
    if (secs < 60) return `Every ${secs}s`
    if (secs < 3600) return `Every ${Math.floor(secs / 60)}m`
    return `Every ${Math.floor(secs / 3600)}h`
  }
  if (s.kind === "cron" && s.expr) return s.expr
  if (s.kind === "at") return "One-time"
  return s.kind
}

export function CronPage() {
  const [jobs, setJobs] = useState<CronJob[]>([])
  const [loading, setLoading] = useState(true)
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set())

  const fetchJobs = useCallback(async () => {
    try {
      const res = await getCronJobs()
      setJobs(res.jobs)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchJobs()
  }, [fetchJobs])

  const handleToggle = useCallback(async (id: string) => {
    setTogglingIds((prev) => new Set(prev).add(id))
    try {
      const updated = await toggleCronJob(id)
      setJobs((prev) =>
        prev.map((j) => (j.id === id ? updated : j)),
      )
    } catch {
      // ignore
    } finally {
      setTogglingIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }, [])

  const handleDelete = useCallback(async (id: string) => {
    setTogglingIds((prev) => new Set(prev).add(id))
    try {
      await deleteCronJob(id)
      setJobs((prev) => prev.filter((j) => j.id !== id))
    } catch {
      // ignore
    } finally {
      setTogglingIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }, [])

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Cron Tasks"
        children={
          <Button
            variant="outline"
            size="sm"
            onClick={fetchJobs}
            disabled={loading}
          >
            <IconRefresh className="size-4" />
            Refresh
          </Button>
        }
      />

      <div className="flex flex-1 flex-col gap-4 overflow-hidden p-4 sm:p-8">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full rounded-lg" />
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-muted-foreground text-sm">
              No cron jobs scheduled. Use the CLI or ask the agent to create one.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => (
              <Card key={job.id} className={job.enabled ? "" : "opacity-60"}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{job.name}</CardTitle>
                      <CardDescription className="mt-1">
                        ID: {job.id}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggle(job.id)}
                        disabled={togglingIds.has(job.id)}
                      >
                        {job.enabled ? (
                          <IconPlayerStop className="size-4 text-amber-500" />
                        ) : (
                          <IconPlayerPlay className="size-4 text-green-500" />
                        )}
                        {job.enabled ? "Disable" : "Enable"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(job.id)}
                        disabled={togglingIds.has(job.id)}
                      >
                        <IconTrash className="size-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-muted-foreground grid grid-cols-2 gap-x-6 gap-y-1 text-sm md:grid-cols-4">
                    <div>
                      <span className="font-medium">Schedule:</span>{" "}
                      {formatSchedule(job)}
                    </div>
                    <div>
                      <span className="font-medium">Status:</span>{" "}
                      {job.enabled ? "Enabled" : "Disabled"}
                    </div>
                    <div>
                      <span className="font-medium">Next run:</span>{" "}
                      {formatTime(job.state.nextRunAtMs)}
                    </div>
                    <div>
                      <span className="font-medium">Last run:</span>{" "}
                      {formatTime(job.state.lastRunAtMs)}
                    </div>
                    {job.state.lastStatus && (
                      <div>
                        <span className="font-medium">Last status:</span>{" "}
                        {job.state.lastStatus}
                      </div>
                    )}
                    {job.state.lastError && (
                      <div className="col-span-2">
                        <span className="font-medium text-red-500">Error:</span>{" "}
                        {job.state.lastError}
                      </div>
                    )}
                    {job.payload.message && (
                      <div className="col-span-2">
                        <span className="font-medium">Message:</span>{" "}
                        {job.payload.message}
                      </div>
                    )}
                    {job.payload.command && (
                      <div className="col-span-2">
                        <span className="font-medium">Command:</span>{" "}
                        <code className="bg-muted rounded px-1 text-xs">
                          {job.payload.command}
                        </code>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
