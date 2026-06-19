import { IconDownload, IconExternalLink } from "@tabler/icons-react"
import { useCallback, useEffect, useState } from "react"

import { launcherFetch } from "@/api/http"
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

interface DownloadItem {
  filename?: string
  label: string
  size: number
  os: string
  arch: string
  type: string
  external_url?: string
}

interface DownloadsResponse {
  downloads: DownloadItem[]
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function osIcon(os: string): string {
  switch (os) {
    case "windows": return "🪟"
    case "darwin": return "🍎"
    case "android": return "📱"
    default: return "💻"
  }
}

export function DownloadPage() {
  const [downloads, setDownloads] = useState<DownloadItem[]>([])
  const [loading, setLoading] = useState(true)

  const fetchDownloads = useCallback(async () => {
    try {
      const res = await launcherFetch("/api/downloads")
      if (res.ok) {
        const data = (await res.json()) as DownloadsResponse
        setDownloads(data.downloads)
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDownloads()
  }, [fetchDownloads])

  const handleDownload = useCallback(async (item: DownloadItem) => {
    if (item.external_url) {
      window.open(item.external_url, "_blank")
      return
    }
    const filename = item.filename!
    const url = `/api/downloads/${encodeURIComponent(filename)}`
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }, [])

  return (
    <div className="flex h-full flex-col">
      <PageHeader title="Download Taipaies" />

      <div className="flex flex-1 flex-col gap-4 overflow-hidden p-4 sm:p-8">
        <p className="text-muted-foreground mb-4 text-sm">
          Download the latest Taipaies launcher for your platform.
        </p>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {downloads.map((item) => (
              <Card key={item.filename ?? item.os + item.arch}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <span>{osIcon(item.os)}</span>
                    {item.label}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {item.type === "apk" && "Android APK (core bundled)"}
                    {item.type === "launcher" && "Web UI Launcher"}
                    {item.size > 0 ? ` · ${formatSize(item.size)}` : ""}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    className="w-full"
                    variant="default"
                    onClick={() => handleDownload(item)}
                  >
                    {item.external_url ? (
                      <><IconExternalLink className="size-4" /> Download</>
                    ) : (
                      <><IconDownload className="size-4" /> Download</>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="mt-6 rounded-lg border p-4">
          <h3 className="mb-2 text-sm font-medium">Installation Notes</h3>
          <ul className="text-muted-foreground list-disc space-y-1 pl-4 text-xs">
            <li>
              <strong>Windows:</strong> Run the exe file, then open{" "}
              <code className="bg-muted rounded px-1">http://localhost:18800</code> in your browser
            </li>
            <li>
              <strong>macOS:</strong> Open Terminal, run{" "}
              <code className="bg-muted rounded px-1">chmod +x taipaies-launcher-darwin-* &amp;&amp; ./taipaies-launcher-darwin-*</code>
            </li>
            <li>
              <strong>Android:</strong> Download the APK and install it on your device
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
