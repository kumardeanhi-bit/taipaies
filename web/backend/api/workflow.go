package api

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/sipeed/picoclaw/pkg/config"
)

type WorkflowStep struct {
	Order   int    `json:"order"`
	Action  string `json:"action"`
	Target  string `json:"target"`
	Message string `json:"message"`
}

type WorkflowSchedule struct {
	Kind    string `json:"kind"`
	EveryMS int64  `json:"everyMs,omitempty"`
	Expr    string `json:"expr,omitempty"`
}

type Workflow struct {
	ID          string           `json:"id"`
	Name        string           `json:"name"`
	Chief       string           `json:"chief"`
	Description string           `json:"description"`
	Enabled     bool             `json:"enabled"`
	Schedule    WorkflowSchedule `json:"schedule"`
	Steps       []WorkflowStep   `json:"steps"`
	LastRunAtMs int64            `json:"lastRunAtMs"`
	LastStatus  string           `json:"lastStatus"`
	CreatedAtMs int64            `json:"createdAtMs"`
}

type WorkflowChief struct {
	ID        string   `json:"id"`
	Name      string   `json:"name"`
	Title     string   `json:"title"`
	Role      string   `json:"role"`
	Members   []string `json:"members"`
	Emoji     string   `json:"emoji"`
	Workspace string   `json:"workspace"`
}

type WorkflowStore struct {
	Version   int              `json:"version"`
	Chiefs    []WorkflowChief  `json:"chiefs"`
	Workflows []Workflow       `json:"workflows"`
}

func generateID() string {
	b := make([]byte, 8)
	rand.Read(b)
	return hex.EncodeToString(b)
}

func defaultChiefs() []WorkflowChief {
	return []WorkflowChief{
		{ID: "coo", Name: "COO", Title: "Chief Operating Officer", Role: "Oversees all chiefs, daily operations, logistics", Members: []string{"ops-lead", "logistics"}, Emoji: "⚙️", Workspace: "workspaces/coo"},
		{ID: "cto", Name: "CTO", Title: "Chief Technology Officer", Role: "Tech stack, website, app, server monitoring", Members: []string{"frontend-dev", "backend-dev", "devops"}, Emoji: "💻", Workspace: "workspaces/cto"},
		{ID: "cpo", Name: "CPO", Title: "Chief Product Officer", Role: "Product catalog, listings, inventory", Members: []string{"inventory-specialist", "product-manager"}, Emoji: "📦", Workspace: "workspaces/cpo"},
		{ID: "cmo", Name: "CMO", Title: "Chief Marketing Officer", Role: "Ads, SEO, social media, campaigns", Members: []string{"content-writer", "social-media", "seo-specialist"}, Emoji: "📢", Workspace: "workspaces/cmo"},
		{ID: "cqo", Name: "CQO", Title: "Chief Quality Officer", Role: "Product quality, returns, bug tracking", Members: []string{"qa-tester", "review-analyst"}, Emoji: "✅", Workspace: "workspaces/cqo"},
		{ID: "cro", Name: "CRO", Title: "Chief Revenue Officer", Role: "Sales, conversion optimization, pricing", Members: []string{"sales-analyst", "pricing-specialist"}, Emoji: "📈", Workspace: "workspaces/cro"},
		{ID: "cso", Name: "CSO", Title: "Chief Supply Chain Officer", Role: "Supplier management, shipping, fulfillment", Members: []string{"shipping-coordinator", "supplier-manager"}, Emoji: "🚚", Workspace: "workspaces/cso"},
	}
}

func defaultWorkflows() []Workflow {
	now := time.Now().UnixMilli()
	return []Workflow{
		{ID: "wf-coo-daily", Name: "Daily Operations Report", Chief: "coo", Description: "Collect daily status from all chiefs and compile operations report", Enabled: true, Schedule: WorkflowSchedule{Kind: "cron", Expr: "0 8 * * *"}, Steps: []WorkflowStep{
			{Order: 1, Action: "agent_turn", Target: "coo", Message: "It's 8 AM. Contact each chief via delegate and compile a daily operations summary."},
		}, CreatedAtMs: now},
		{ID: "wf-coo-weekly", Name: "Weekly Operations Review", Chief: "coo", Description: "Weekly summary of all department metrics", Enabled: true, Schedule: WorkflowSchedule{Kind: "cron", Expr: "0 9 * * 1"}, Steps: []WorkflowStep{
			{Order: 1, Action: "agent_turn", Target: "coo", Message: "It's Monday morning. Compile a weekly operations review from all chiefs."},
		}, CreatedAtMs: now},
		{ID: "wf-cto-uptime", Name: "Server Uptime Check", Chief: "cto", Description: "Check server health and uptime every hour", Enabled: true, Schedule: WorkflowSchedule{Kind: "cron", Expr: "0 * * * *"}, Steps: []WorkflowStep{
			{Order: 1, Action: "agent_turn", Target: "cto", Message: "Check server uptime and health. Report any issues immediately."},
		}, CreatedAtMs: now},
		{ID: "wf-cto-bugs", Name: "Bug Report Scan", Chief: "cto", Description: "Daily scan for new bugs and issues", Enabled: true, Schedule: WorkflowSchedule{Kind: "cron", Expr: "0 7 * * *"}, Steps: []WorkflowStep{
			{Order: 1, Action: "agent_turn", Target: "cto", Message: "Scan for new bugs and technical issues. Prioritize and report."},
		}, CreatedAtMs: now},
		{ID: "wf-cto-deploy", Name: "Deploy Check", Chief: "cto", Description: "Verify latest deployment status", Enabled: true, Schedule: WorkflowSchedule{Kind: "cron", Expr: "30 6 * * *"}, Steps: []WorkflowStep{
			{Order: 1, Action: "agent_turn", Target: "cto", Message: "Check deployment status and verify all services are running correctly."},
		}, CreatedAtMs: now},
		{ID: "wf-cpo-inventory", Name: "Inventory Level Check", Chief: "cpo", Description: "Monitor inventory levels and flag low stock", Enabled: true, Schedule: WorkflowSchedule{Kind: "cron", Expr: "0 6 * * *"}, Steps: []WorkflowStep{
			{Order: 1, Action: "agent_turn", Target: "cpo", Message: "Check inventory levels. Flag any products below minimum stock."},
		}, CreatedAtMs: now},
		{ID: "wf-cpo-new-products", Name: "New Product Review", Chief: "cpo", Description: "Review and approve pending product listings", Enabled: true, Schedule: WorkflowSchedule{Kind: "cron", Expr: "0 10 * * *"}, Steps: []WorkflowStep{
			{Order: 1, Action: "agent_turn", Target: "cpo", Message: "Review pending product listings and approve or flag issues."},
		}, CreatedAtMs: now},
		{ID: "wf-cmo-social", Name: "Social Media Monitor", Chief: "cmo", Description: "Check social media engagement and mentions", Enabled: true, Schedule: WorkflowSchedule{Kind: "cron", Expr: "0 */2 * * *"}, Steps: []WorkflowStep{
			{Order: 1, Action: "agent_turn", Target: "cmo", Message: "Check social media engagement, mentions, and recent comments."},
		}, CreatedAtMs: now},
		{ID: "wf-cmo-ads", Name: "Ad Performance Report", Chief: "cmo", Description: "Monitor ad campaign performance and ROI", Enabled: true, Schedule: WorkflowSchedule{Kind: "cron", Expr: "0 9 * * *"}, Steps: []WorkflowStep{
			{Order: 1, Action: "agent_turn", Target: "cmo", Message: "Review ad campaign performance, ROI, and suggest optimizations."},
		}, CreatedAtMs: now},
		{ID: "wf-cqo-returns", Name: "Returns Analysis", Chief: "cqo", Description: "Analyze recent product returns and identify patterns", Enabled: true, Schedule: WorkflowSchedule{Kind: "cron", Expr: "0 7 * * *"}, Steps: []WorkflowStep{
			{Order: 1, Action: "agent_turn", Target: "cqo", Message: "Analyze recent returns. Identify patterns and quality issues."},
		}, CreatedAtMs: now},
		{ID: "wf-cqo-reviews", Name: "Customer Review Scan", Chief: "cqo", Description: "Scan new customer reviews for quality signals", Enabled: true, Schedule: WorkflowSchedule{Kind: "cron", Expr: "0 */3 * * *"}, Steps: []WorkflowStep{
			{Order: 1, Action: "agent_turn", Target: "cqo", Message: "Scan recent customer reviews. Flag negative trends or recurring complaints."},
		}, CreatedAtMs: now},
		{ID: "wf-cro-sales", Name: "Daily Sales Report", Chief: "cro", Description: "Track daily sales, conversion, and revenue", Enabled: true, Schedule: WorkflowSchedule{Kind: "cron", Expr: "0 8 * * *"}, Steps: []WorkflowStep{
			{Order: 1, Action: "agent_turn", Target: "cro", Message: "Compile daily sales report. Track conversion rates and revenue."},
		}, CreatedAtMs: now},
		{ID: "wf-cro-pricing", Name: "Pricing Review", Chief: "cro", Description: "Review pricing competitiveness", Enabled: true, Schedule: WorkflowSchedule{Kind: "cron", Expr: "0 12 * * 1"}, Steps: []WorkflowStep{
			{Order: 1, Action: "agent_turn", Target: "cro", Message: "Review current pricing strategy and competitiveness."},
		}, CreatedAtMs: now},
		{ID: "wf-cso-shipping", Name: "Shipping Monitor", Chief: "cso", Description: "Monitor pending shipments and delivery status", Enabled: true, Schedule: WorkflowSchedule{Kind: "cron", Expr: "0 */2 * * *"}, Steps: []WorkflowStep{
			{Order: 1, Action: "agent_turn", Target: "cso", Message: "Check pending shipments and delivery statuses. Flag any delays."},
		}, CreatedAtMs: now},
		{ID: "wf-cso-suppliers", Name: "Supplier Check", Chief: "cso", Description: "Monitor supplier performance and lead times", Enabled: true, Schedule: WorkflowSchedule{Kind: "cron", Expr: "0 11 * * 1"}, Steps: []WorkflowStep{
			{Order: 1, Action: "agent_turn", Target: "cso", Message: "Review supplier performance, lead times, and inventory fulfillment."},
		}, CreatedAtMs: now},
	}
}

func (h *Handler) workflowStorePath() (string, error) {
	cfg, err := config.LoadConfig(h.configPath)
	if err != nil {
		return "", fmt.Errorf("failed to load config: %v", err)
	}
	dir := filepath.Join(cfg.WorkspacePath(), "workflow")
	if err := os.MkdirAll(dir, 0755); err != nil {
		return "", fmt.Errorf("failed to create workflow dir: %v", err)
	}
	return filepath.Join(dir, "workflows.json"), nil
}

func (h *Handler) loadWorkflow() WorkflowStore {
	storePath, err := h.workflowStorePath()
	if err != nil {
		return WorkflowStore{Version: 1, Chiefs: defaultChiefs(), Workflows: defaultWorkflows()}
	}
	data, err := os.ReadFile(storePath)
	if err != nil {
		store := WorkflowStore{Version: 1, Chiefs: defaultChiefs(), Workflows: defaultWorkflows()}
		h.saveWorkflow(store)
		return store
	}
	var store WorkflowStore
	if json.Unmarshal(data, &store) != nil || store.Version == 0 {
		store = WorkflowStore{Version: 1, Chiefs: defaultChiefs(), Workflows: defaultWorkflows()}
		h.saveWorkflow(store)
		return store
	}
	if len(store.Chiefs) == 0 {
		store.Chiefs = defaultChiefs()
	}
	return store
}

func (h *Handler) saveWorkflow(store WorkflowStore) error {
	storePath, err := h.workflowStorePath()
	if err != nil {
		return err
	}
	data, err := json.MarshalIndent(store, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(storePath, data, 0644)
}

func (h *Handler) registerWorkflowRoutes(mux *http.ServeMux) {
	mux.HandleFunc("GET /api/workflow/chiefs", h.handleListChiefs)
	mux.HandleFunc("GET /api/workflow/chiefs/{id}", h.handleGetChief)
	mux.HandleFunc("GET /api/workflow/list", h.handleListWorkflows)
	mux.HandleFunc("POST /api/workflow/create", h.handleCreateWorkflow)
	mux.HandleFunc("PUT /api/workflow/{id}", h.handleUpdateWorkflow)
	mux.HandleFunc("DELETE /api/workflow/{id}", h.handleDeleteWorkflow)
	mux.HandleFunc("POST /api/workflow/{id}/toggle", h.handleToggleWorkflow)
}

func (h *Handler) handleListChiefs(w http.ResponseWriter, r *http.Request) {
	store := h.loadWorkflow()
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{"chiefs": store.Chiefs})
}

func (h *Handler) handleGetChief(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	store := h.loadWorkflow()
	for _, chief := range store.Chiefs {
		if chief.ID == id {
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(chief)
			return
		}
	}
	http.Error(w, "Chief not found", http.StatusNotFound)
}

func (h *Handler) handleListWorkflows(w http.ResponseWriter, r *http.Request) {
	store := h.loadWorkflow()
	chief := r.URL.Query().Get("chief")
	if chief != "" {
		var filtered []Workflow
		for _, wf := range store.Workflows {
			if wf.Chief == chief {
				filtered = append(filtered, wf)
			}
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]any{"workflows": filtered})
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{"workflows": store.Workflows})
}

func (h *Handler) handleCreateWorkflow(w http.ResponseWriter, r *http.Request) {
	var wf Workflow
	if err := json.NewDecoder(r.Body).Decode(&wf); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	wf.ID = generateID()
	wf.CreatedAtMs = time.Now().UnixMilli()
	wf.Enabled = true

	store := h.loadWorkflow()
	store.Workflows = append(store.Workflows, wf)
	if err := h.saveWorkflow(store); err != nil {
		http.Error(w, "Failed to save", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(wf)
}

func (h *Handler) handleUpdateWorkflow(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	var updated Workflow
	if err := json.NewDecoder(r.Body).Decode(&updated); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	store := h.loadWorkflow()
	for i, wf := range store.Workflows {
		if wf.ID == id {
			updated.ID = id
			updated.CreatedAtMs = wf.CreatedAtMs
			store.Workflows[i] = updated
			h.saveWorkflow(store)
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(updated)
			return
		}
	}
	http.Error(w, "Workflow not found", http.StatusNotFound)
}

func (h *Handler) handleDeleteWorkflow(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	store := h.loadWorkflow()
	for i, wf := range store.Workflows {
		if wf.ID == id {
			store.Workflows = append(store.Workflows[:i], store.Workflows[i+1:]...)
			h.saveWorkflow(store)
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
			return
		}
	}
	http.Error(w, "Workflow not found", http.StatusNotFound)
}

func (h *Handler) handleToggleWorkflow(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	store := h.loadWorkflow()
	for i, wf := range store.Workflows {
		if wf.ID == id {
			store.Workflows[i].Enabled = !store.Workflows[i].Enabled
			h.saveWorkflow(store)
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(store.Workflows[i])
			return
		}
	}
	http.Error(w, "Workflow not found", http.StatusNotFound)
}
