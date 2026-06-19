import { createFileRoute } from "@tanstack/react-router"

import { DatabasePage } from "@/components/database/database-page"

export const Route = createFileRoute("/database")({
  component: DatabasePage,
})
