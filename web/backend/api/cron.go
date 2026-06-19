package api

import (
	"encoding/json"
	"fmt"
	"net/http"
	"path/filepath"

	"github.com/sipeed/picoclaw/pkg/config"
	"github.com/sipeed/picoclaw/pkg/cron"
)

func (h *Handler) registerCronRoutes(mux *http.ServeMux) {
	mux.HandleFunc("GET /api/cron/jobs", h.handleListCronJobs)
	mux.HandleFunc("DELETE /api/cron/jobs/{id}", h.handleDeleteCronJob)
	mux.HandleFunc("POST /api/cron/jobs/{id}/toggle", h.handleToggleCronJob)
}

func (h *Handler) cronStorePath() (string, error) {
	cfg, err := config.LoadConfig(h.configPath)
	if err != nil {
		return "", fmt.Errorf("failed to load config: %v", err)
	}
	return filepath.Join(cfg.WorkspacePath(), "cron", "jobs.json"), nil
}

func (h *Handler) handleListCronJobs(w http.ResponseWriter, r *http.Request) {
	storePath, err := h.cronStorePath()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	cs := cron.NewCronService(storePath, nil)
	jobs := cs.ListJobs(true)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{
		"jobs": jobs,
	})
}

func (h *Handler) handleDeleteCronJob(w http.ResponseWriter, r *http.Request) {
	jobID := r.PathValue("id")
	storePath, err := h.cronStorePath()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	cs := cron.NewCronService(storePath, nil)
	if cs.RemoveJob(jobID) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
	} else {
		http.Error(w, "Job not found", http.StatusNotFound)
	}
}

func (h *Handler) handleToggleCronJob(w http.ResponseWriter, r *http.Request) {
	jobID := r.PathValue("id")
	storePath, err := h.cronStorePath()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	cs := cron.NewCronService(storePath, nil)
	job, found := cs.GetJob(jobID)
	if !found {
		http.Error(w, "Job not found", http.StatusNotFound)
		return
	}

	updated := cs.EnableJob(jobID, !job.Enabled)
	if updated == nil {
		http.Error(w, "Failed to toggle job", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(updated)
}
