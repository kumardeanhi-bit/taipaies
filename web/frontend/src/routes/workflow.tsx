import { createFileRoute } from "@tanstack/react-router"

import { WorkflowPage } from "@/components/workflow/workflow-page"

export const Route = createFileRoute("/workflow")({
  component: WorkflowPage,
})
