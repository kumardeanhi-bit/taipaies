package api

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"sync"
)

type DatabaseTablesResponse struct {
	Tables []struct {
		Name  string `json:"name"`
		Count int    `json:"count"`
	} `json:"tables"`
}

type DatabaseQueryResponse struct {
	Columns []string                 `json:"columns"`
	Rows    []map[string]interface{} `json:"rows"`
	Count   int                      `json:"count"`
}

var chiefTableMap = map[string][]string{
	"coo": {
		"Fulfillment", "OrderEvent", "AuditLog",
		"ai_agents", "ai_tasks", "ai_meeting_sessions", "ai_meeting_responses",
	},
	"cto": {
		"User", "Session", "CmsPage", "Navigation",
		"PermissionGroup", "PermissionGroupMembership",
		"ai_usage_logs", "ai_audit_log", "ai_action_log", "ai_conversations",
	},
	"cpo": {
		"Product", "ProductVariant", "ProductAttribute", "ProductAttributeAssignment", "ProductCategory",
		"products", "categories", "category_types", "inventory",
		"bespoke_products", "material_products", "bespoke_drafts",
	},
	"cmo": {
		"banners", "home_config",
		"Customer",
	},
	"cqo": {
		"Ticket", "TicketMessage", "tickets", "ticket_messages",
		"CustomerGroupMember",
	},
	"cro": {
		"Order", "OrderItem", "orders", "order_items", "cart_items",
	},
	"cso": {
		"tailors", "tailor_config", "primary_tailor_tests", "primary_approval_requests",
		"delivery_addresses", "ShippingZone", "order_tracking",
		"CustomerAddress", "CustomerGroup",
		"user_measurements", "wishlists",
	},
}

type refreshTarget struct {
	name  string
	path  string
	names []string
}

func (h *Handler) handleDatabaseTool(w http.ResponseWriter, r *http.Request) {
	action := r.URL.Query().Get("action")
	table := r.URL.Query().Get("table")

	dbURL := "http://localhost:3003/api"

	switch action {
	case "list_tables":
		resp, err := http.Get(dbURL + "/tables")
		if err != nil {
			http.Error(w, fmt.Sprintf("DB error: %v", err), 500)
			return
		}
		defer resp.Body.Close()
		body, _ := io.ReadAll(resp.Body)

		var tablesResp DatabaseTablesResponse
		if json.Unmarshal(body, &tablesResp) == nil {
			lines := []string{fmt.Sprintf("Database has %d tables:", len(tablesResp.Tables)), ""}
			for _, t := range tablesResp.Tables {
				lines = append(lines, fmt.Sprintf("  - %s (%d rows)", t.Name, t.Count))
			}
			w.Header().Set("Content-Type", "text/plain; charset=utf-8")
			w.Write([]byte(strings.Join(lines, "\n")))
		} else {
			w.Header().Set("Content-Type", "application/json")
			w.Write(body)
		}

	case "query_table":
		if table == "" {
			http.Error(w, "table parameter required", 400)
			return
		}
		resp, err := http.Get(dbURL + "/" + table)
		if err != nil {
			http.Error(w, fmt.Sprintf("DB error: %v", err), 500)
			return
		}
		defer resp.Body.Close()
		body, _ := io.ReadAll(resp.Body)

		var qResp DatabaseQueryResponse
		if json.Unmarshal(body, &qResp) == nil {
			lines := []string{fmt.Sprintf("Table: %s (%d rows)", table, qResp.Count)}
			if len(qResp.Columns) > 0 {
				lines = append(lines, "Columns: "+strings.Join(qResp.Columns, ", "))
			}
			if len(qResp.Rows) > 0 {
				lines = append(lines, "")
				for i, row := range qResp.Rows {
					line, _ := json.Marshal(row)
					lines = append(lines, fmt.Sprintf("%d: %s", i+1, string(line)))
					if i >= 50 {
						lines = append(lines, fmt.Sprintf("... and %d more rows", len(qResp.Rows)-i-1))
						break
					}
				}
			}
			w.Header().Set("Content-Type", "text/plain; charset=utf-8")
			w.Write([]byte(strings.Join(lines, "\n")))
		} else {
			w.Header().Set("Content-Type", "application/json")
			w.Write(body)
		}

	case "create":
		if table == "" {
			http.Error(w, "table parameter required", 400)
			return
		}
		data := r.URL.Query().Get("data")
		by := r.URL.Query().Get("by")
		if data == "" {
			http.Error(w, "data parameter required (JSON key=val, e.g. name=John,email=j@c.com)", 400)
			return
		}
		body := fmt.Sprintf(`{"action":"create","table_name":"%s","data":{%s},"performed_by":"%s"}`, table, data, by)
		resp, err := http.Post(dbURL+"/ai-write", "application/json", strings.NewReader(body))
		if err != nil {
			http.Error(w, fmt.Sprintf("DB error: %v", err), 500)
			return
		}
		defer resp.Body.Close()
		b, _ := io.ReadAll(resp.Body)
		w.Header().Set("Content-Type", "text/plain; charset=utf-8")
		w.Write(b)

	case "update":
		if table == "" {
			http.Error(w, "table parameter required", 400)
			return
		}
		data := r.URL.Query().Get("data")
		by := r.URL.Query().Get("by")
		if data == "" {
			http.Error(w, "data parameter required (JSON key=val, must include id=N)", 400)
			return
		}
		body := fmt.Sprintf(`{"action":"update","table_name":"%s","data":{%s},"performed_by":"%s"}`, table, data, by)
		resp, err := http.Post(dbURL+"/ai-write", "application/json", strings.NewReader(body))
		if err != nil {
			http.Error(w, fmt.Sprintf("DB error: %v", err), 500)
			return
		}
		defer resp.Body.Close()
		b, _ := io.ReadAll(resp.Body)
		w.Header().Set("Content-Type", "text/plain; charset=utf-8")
		w.Write(b)

	case "audit":
		resp, err := http.Get(dbURL + "/ai-audit")
		if err != nil {
			http.Error(w, fmt.Sprintf("DB error: %v", err), 500)
			return
		}
		defer resp.Body.Close()
		body, _ := io.ReadAll(resp.Body)

		var auditResp struct {
			Entries []map[string]any `json:"entries"`
		}
		if json.Unmarshal(body, &auditResp) == nil {
			lines := []string{fmt.Sprintf("Audit log (%d entries):", len(auditResp.Entries)), ""}
			for _, e := range auditResp.Entries {
				ts, _ := e["created_at"].(string)
				action, _ := e["action"].(string)
				summary, _ := e["summary"].(string)
				performedBy, _ := e["performed_by"].(string)
				if ts != "" {
					if len(ts) > 19 {
						ts = ts[:19]
					}
					ts = ts[11:19]
				}
				lines = append(lines, fmt.Sprintf("  [%s] %s | %s | %s", ts, performedBy, action, summary))
			}
			w.Header().Set("Content-Type", "text/plain; charset=utf-8")
			w.Write([]byte(strings.Join(lines, "\n")))
		} else {
			w.Header().Set("Content-Type", "application/json")
			w.Write(body)
		}

	case "refresh":
		// 1. Fetch list of all tables
		resp, err := http.Get(dbURL + "/tables")
		if err != nil {
			http.Error(w, fmt.Sprintf("DB error: %v", err), 500)
			return
		}
		var tablesResp DatabaseTablesResponse
		body, _ := io.ReadAll(resp.Body)
		resp.Body.Close()
		if err := json.Unmarshal(body, &tablesResp); err != nil {
			http.Error(w, fmt.Sprintf("parse tables error: %v", err), 500)
			return
		}

		// 2. Fetch all table data concurrently
		type tableResult struct {
			name  string
			data  DatabaseQueryResponse
			error string
		}
		resultCh := make(chan tableResult, len(tablesResp.Tables))
		var wg sync.WaitGroup
		for _, t := range tablesResp.Tables {
			wg.Add(1)
			go func(tname string) {
				defer wg.Done()
				r, e := http.Get(dbURL + "/" + tname)
				if e != nil {
					resultCh <- tableResult{name: tname, error: e.Error()}
					return
				}
				defer r.Body.Close()
				b, _ := io.ReadAll(r.Body)
				var q DatabaseQueryResponse
				if err := json.Unmarshal(b, &q); err != nil {
					resultCh <- tableResult{name: tname, error: err.Error()}
					return
				}
				resultCh <- tableResult{name: tname, data: q}
			}(t.Name)
		}
		wg.Wait()
		close(resultCh)

		allData := make(map[string]DatabaseQueryResponse)
		var errors []string
		for r := range resultCh {
			if r.error != "" {
				errors = append(errors, fmt.Sprintf("%s: %s", r.name, r.error))
			} else {
				allData[r.name] = r.data
			}
		}

		// 3. Read config.json for workspace paths
		configData, err := os.ReadFile(h.configPath)
		if err != nil {
			http.Error(w, fmt.Sprintf("read config error: %v", err), 500)
			return
		}
		var cfg struct {
			Agents struct {
				Defaults struct {
					Workspace string `json:"workspace"`
				} `json:"defaults"`
				List []struct {
					ID        string `json:"id"`
					Workspace string `json:"workspace"`
				} `json:"list"`
			} `json:"agents"`
		}
		if err := json.Unmarshal(configData, &cfg); err != nil {
			http.Error(w, fmt.Sprintf("parse config error: %v", err), 500)
			return
		}

		// Build list of targets: default workspace gets ALL tables
		var targets []refreshTarget
		targets = append(targets, refreshTarget{
			name:  "default",
			path:  cfg.Agents.Defaults.Workspace,
			names: nil,
		})

		for _, a := range cfg.Agents.List {
			tables, ok := chiefTableMap[a.ID]
			if !ok || len(tables) == 0 {
				continue
			}
			targets = append(targets, refreshTarget{
				name:  a.ID,
				path:  a.Workspace,
				names: tables,
			})
		}

		// 4. Write filtered database.json to each workspace
		written := 0
		for _, t := range targets {
			filtered := make(map[string]DatabaseQueryResponse)
			if t.names == nil {
				filtered = allData
			} else {
				for _, n := range t.names {
					if d, ok := allData[n]; ok {
						filtered[n] = d
					}
				}
			}
			outPath := filepath.Join(t.path, "database.json")
			out, err := json.MarshalIndent(filtered, "", "  ")
			if err != nil {
				errors = append(errors, fmt.Sprintf("marshal %s: %v", t.name, err))
				continue
			}
			if err := os.WriteFile(outPath, out, 0644); err != nil {
				errors = append(errors, fmt.Sprintf("write %s: %v", t.name, err))
				continue
			}
			written++
		}

		// 5. Response
		lines := []string{fmt.Sprintf("Refreshed %d workspaces (%d tables total).", written, len(tablesResp.Tables))}
		if len(errors) > 0 {
			lines = append(lines, "")
			lines = append(lines, "Errors:")
			for _, e := range errors {
				lines = append(lines, "  - "+e)
			}
		}
		lines = append(lines, "")
		for _, t := range targets {
			count := 0
			if t.names == nil {
				count = len(allData)
			} else {
				count = len(t.names)
			}
			lines = append(lines, fmt.Sprintf("  %s -> %d tables -> %s", t.name, count, t.path))
		}
		w.Header().Set("Content-Type", "text/plain; charset=utf-8")
		w.Write([]byte(strings.Join(lines, "\n")))

	default:
		http.Error(w, "unknown action. Use: list_tables, query_table?table=name, create?table=X&data=..., update?table=X&data=..., audit, or refresh", 400)
	}
}
