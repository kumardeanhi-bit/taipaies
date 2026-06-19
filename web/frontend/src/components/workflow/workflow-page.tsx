import { IconBuildingStore, IconGripHorizontal, IconRefresh, IconZoomIn, IconZoomOut } from "@tabler/icons-react"
import { useCallback, useEffect, useRef, useState } from "react"

import type { WorkflowChief } from "@/api/workflow"
import { getChiefs } from "@/api/workflow"
import { PageHeader } from "@/components/page-header"

import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

const BOX_W = 200
const BOX_H = 90
const OFFICER_W = 220
const OFFICER_H = 110
const GAP = 28
const LEVEL_GAP = 70
const MIN_ZOOM = 0.2
const MAX_ZOOM = 2
const ZOOM_STEP = 0.05

export function WorkflowPage() {
  const [chiefs, setChiefs] = useState<WorkflowChief[]>([])
  const [loading, setLoading] = useState(true)
  const [zoom, setZoom] = useState(0.75)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef({ dragging: false, startX: 0, startY: 0, panX: 0, panY: 0 })

  const fetchChiefs = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getChiefs()
      setChiefs(res.chiefs)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchChiefs()
  }, [fetchChiefs])

  const cw = containerRef.current?.clientWidth || 1200
  const ceoX = Math.max(20, (cw - BOX_W) / 2)
  const cooX = Math.max(20, (cw - OFFICER_W) / 2)
  const team = chiefs.filter((c) => c.id !== "coo")
  const teamW = team.length * OFFICER_W + (team.length - 1) * GAP
  const teamStartX = Math.max(20, (cw - teamW) / 2)
  const ceoCenterX = ceoX + BOX_W / 2
  const cooCenterX = cooX + OFFICER_W / 2

  const cooTopY = 40 + BOX_H + LEVEL_GAP
  const teamTopY = cooTopY + OFFICER_H + LEVEL_GAP

  const teamCenters = team.map((_, i) => ({
    x: teamStartX + i * (OFFICER_W + GAP) + OFFICER_W / 2,
    y: teamTopY,
  }))

  const cooBottom = cooTopY + OFFICER_H
  const branchY = cooBottom + 30

  // Drag to pan
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button, .card")) return
    dragRef.current = { dragging: true, startX: e.clientX, startY: e.clientY, panX: pan.x, panY: pan.y }
  }, [pan])

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragRef.current.dragging) return
      setPan({
        x: dragRef.current.panX + (e.clientX - dragRef.current.startX),
        y: dragRef.current.panY + (e.clientY - dragRef.current.startY),
      })
    }
    const onUp = () => { dragRef.current.dragging = false }
    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)
    return () => {
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseup", onUp)
    }
  }, [])

  // Wheel zoom
  const handleWheel = useCallback((e: WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP
      setZoom((z) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z + delta)))
    }
  }, [])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    el.addEventListener("wheel", handleWheel, { passive: false })
    return () => el.removeEventListener("wheel", handleWheel)
  }, [handleWheel])

  const zoomIn = () => setZoom((z) => Math.min(MAX_ZOOM, z + ZOOM_STEP))
  const zoomOut = () => setZoom((z) => Math.max(MIN_ZOOM, z - ZOOM_STEP))
  const zoomReset = () => { setZoom(0.75); setPan({ x: 0, y: 0 }) }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <PageHeader
        title="Workflow"
        titleExtra={
          <span className="text-muted-foreground ml-2 text-sm font-normal">
            AI Company Org Chart
          </span>
        }
        children={
          <div className="flex items-center gap-2">
            <div className="bg-muted flex items-center gap-1 rounded-md border p-0.5 text-xs">
              <button
                className="hover:text-foreground inline-flex size-7 items-center justify-center rounded text-muted-foreground transition-colors disabled:opacity-30"
                onClick={zoomOut}
                disabled={zoom <= MIN_ZOOM}
              >
                <IconZoomOut className="size-3.5" />
              </button>
              <button
                className="hover:text-foreground inline-flex size-7 items-center justify-center rounded text-muted-foreground transition-colors"
                onClick={zoomReset}
              >
                {Math.round(zoom * 100)}%
              </button>
              <button
                className="hover:text-foreground inline-flex size-7 items-center justify-center rounded text-muted-foreground transition-colors disabled:opacity-30"
                onClick={zoomIn}
                disabled={zoom >= MAX_ZOOM}
              >
                <IconZoomIn className="size-3.5" />
              </button>
            </div>
            <span className="text-muted-foreground flex items-center gap-1 text-[11px]">
              <IconGripHorizontal className="size-3" /> Drag to pan
            </span>
            <button
              className="bg-muted hover:text-foreground inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors"
              onClick={fetchChiefs}
              disabled={loading}
            >
              <IconRefresh className="size-4" />
            </button>
          </div>
        }
      />

      <div
        ref={containerRef}
        className="relative flex-1 cursor-grab overflow-hidden active:cursor-grabbing"
        style={{ minHeight: 500 }}
        onMouseDown={onMouseDown}
      >
        <div
          ref={null}
          className="absolute"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "0 0",
          }}
        >
          {/* spacer to make room for absolutely positioned elements */}
          <div style={{ width: Math.max(cw, teamStartX + teamW + 40), height: teamTopY + OFFICER_H + 80 }} />

          {/* SVG Connector Lines */}
          <svg className="pointer-events-none absolute inset-0 size-full">
            {/* CEO → COO */}
            <line
              x1={ceoCenterX}
              y1={40 + BOX_H}
              x2={cooCenterX}
              y2={cooTopY}
              className="stroke-primary/30"
              strokeWidth={2}
            />
            {/* COO → branch */}
            <line
              x1={cooCenterX}
              y1={cooBottom}
              x2={cooCenterX}
              y2={branchY}
              className="stroke-primary/30"
              strokeWidth={2}
            />
            {/* Horizontal branch */}
            {teamCenters.length > 0 && (
              <line
                x1={teamCenters[0].x}
                y1={branchY}
                x2={teamCenters[teamCenters.length - 1].x}
                y2={branchY}
                className="stroke-primary/30"
                strokeWidth={2}
              />
            )}
            {/* Vertical drops */}
            {teamCenters.map((c, i) => (
              <line
                key={i}
                x1={c.x}
                y1={branchY}
                x2={c.x}
                y2={c.y}
                className="stroke-primary/30"
                strokeWidth={2}
              />
            ))}
          </svg>

          {/* CEO */}
          <div className="absolute" style={{ left: ceoX, top: 40, width: BOX_W, height: BOX_H }}>
            <Card className="border-primary/20 h-full shadow-lg">
              <CardContent className="flex h-full items-center justify-center gap-3 p-4">
                <div className="bg-primary/15 flex size-12 shrink-0 items-center justify-center rounded-full">
                  <IconBuildingStore className="size-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">CEO</CardTitle>
                  <CardDescription className="text-xs">Chief Executive Officer</CardDescription>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* COO */}
          {chiefs.find((c) => c.id === "coo") && (() => {
            const coo = chiefs.find((c) => c.id === "coo")!
            return (
              <div className="absolute" style={{ left: cooX, top: cooTopY, width: OFFICER_W, height: OFFICER_H }}>
                <Card className="border-primary/40 h-full shadow-lg">
                  <CardContent className="flex h-full flex-col justify-center p-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 flex size-10 shrink-0 items-center justify-center rounded-full text-lg">
                        {coo.emoji}
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="truncate text-sm">{coo.name}</CardTitle>
                        <CardDescription className="truncate text-[10px]">{coo.title}</CardDescription>
                      </div>
                    </div>
                    <p className="text-muted-foreground mt-2 line-clamp-2 text-[11px] leading-tight">{coo.role}</p>
                  </CardContent>
                </Card>
              </div>
            )
          })()}

          {/* Team chiefs */}
          {loading ? (
            <div className="absolute" style={{ left: teamStartX, top: teamTopY }}>
              <Skeleton className="h-28 w-48 rounded-lg" />
            </div>
          ) : (
            team.map((chief, i) => (
              <div
                key={chief.id}
                className="absolute"
                style={{
                  left: teamStartX + i * (OFFICER_W + GAP),
                  top: teamTopY,
                  width: OFFICER_W,
                  height: OFFICER_H,
                }}
              >
                <Card className="hover:border-primary/30 h-full transition-colors shadow-md">
                  <CardContent className="flex h-full flex-col justify-center p-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 flex size-10 shrink-0 items-center justify-center rounded-full text-lg">
                        {chief.emoji}
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="truncate text-sm">{chief.name}</CardTitle>
                        <CardDescription className="truncate text-[10px]">{chief.title}</CardDescription>
                      </div>
                    </div>
                    <p className="text-muted-foreground mt-2 line-clamp-2 text-[11px] leading-tight">{chief.role}</p>
                  </CardContent>
                </Card>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
