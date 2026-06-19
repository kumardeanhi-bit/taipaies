package api

import (
	"io"
	"net/http"
	"strings"
)

const dbAPIBase = "http://localhost:3003"

func (h *Handler) registerDatabaseRoutes(mux *http.ServeMux) {
	mux.HandleFunc("GET /api/db/", h.handleDBProxy)
	mux.HandleFunc("POST /api/db/ai-write", h.handleDBProxy)
	mux.HandleFunc("GET /api/db/ai-audit", h.handleDBProxy)
	mux.HandleFunc("GET /api/tool/db", h.handleDatabaseTool)
}

func (h *Handler) handleDBProxy(w http.ResponseWriter, r *http.Request) {
	target := dbAPIBase + "/api/" + strings.TrimPrefix(r.URL.Path, "/api/db/")
	if r.URL.RawQuery != "" {
		target += "?" + r.URL.RawQuery
	}

	req, err := http.NewRequest(r.Method, target, r.Body)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	req.Header = r.Header.Clone()

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadGateway)
		return
	}
	defer resp.Body.Close()

	w.Header().Set("Content-Type", resp.Header.Get("Content-Type"))
	w.WriteHeader(resp.StatusCode)
	io.Copy(w, resp.Body)
}
