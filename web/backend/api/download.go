package api

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"
)

type downloadItem struct {
	Filename    string `json:"filename,omitempty"`
	Label       string `json:"label"`
	Size        int64  `json:"size,omitempty"`
	OS          string `json:"os"`
	Arch        string `json:"arch"`
	Type        string `json:"type"`
	ExternalURL string `json:"external_url,omitempty"`
}

var downloadFiles = []downloadItem{
	{Filename: "taipaies-launcher-windows-amd64.exe", Label: "Windows (x86_64)", OS: "windows", Arch: "amd64", Type: "launcher"},
	{Filename: "taipaies-launcher-darwin-arm64", Label: "macOS Apple Silicon (M1/M2/M3)", OS: "darwin", Arch: "arm64", Type: "launcher"},
	{Filename: "taipaies-launcher-darwin-amd64", Label: "macOS Intel", OS: "darwin", Arch: "amd64", Type: "launcher"},
	{Filename: "taipaies-android-universal.apk", Label: "Android APK", OS: "android", Arch: "universal", Type: "apk",
		ExternalURL: "https://github.com/kumardeanhi-bit/taipaies/releases/latest/download/taipaies-android-universal.apk"},
}

func (h *Handler) registerDownloadRoutes(mux *http.ServeMux) {
	mux.HandleFunc("GET /api/downloads", h.handleListDownloads)
	mux.HandleFunc("GET /api/downloads/{file}", h.handleDownloadFile)
	mux.HandleFunc("GET /api/downloads/apk/get", h.handleDownloadAPK)
}

func (h *Handler) handleDownloadAPK(w http.ResponseWriter, r *http.Request) {
	buildsDir := h.buildsDir()
	filePath := filepath.Join(buildsDir, "taipaies-android-universal.apk")
	info, err := os.Stat(filePath)
	if err != nil {
		http.Error(w, "File not found", http.StatusNotFound)
		return
	}
	w.Header().Set("Content-Disposition", `attachment; filename="taipaies.apk"`)
	w.Header().Set("Content-Type", "application/octet-stream")
	w.Header().Set("Content-Length", fmt.Sprintf("%d", info.Size()))
	http.ServeFile(w, r, filePath)
}

func (h *Handler) buildsDir() string {
	if dir := os.Getenv("PICOCLAW_BUILDS_DIR"); dir != "" {
		return dir
	}
	exe, err := os.Executable()
	if err == nil {
		dir := filepath.Dir(exe)
		candidate := filepath.Join(dir, "builds")
		if info, statErr := os.Stat(candidate); statErr == nil && info.IsDir() {
			return candidate
		}
	}
	cwd, err := os.Getwd()
	if err == nil {
		candidate := filepath.Join(cwd, "builds")
		if info, statErr := os.Stat(candidate); statErr == nil && info.IsDir() {
			return candidate
		}
	}
	return filepath.Join(h.configPath, "..", "..", "builds")
}

func (h *Handler) handleListDownloads(w http.ResponseWriter, r *http.Request) {
	buildsDir := h.buildsDir()
	items := make([]downloadItem, 0, len(downloadFiles))
	for _, d := range downloadFiles {
		if d.Filename != "" {
			path := filepath.Join(buildsDir, d.Filename)
			info, err := os.Stat(path)
			if err == nil {
				d.Size = info.Size()
			}
		}
		items = append(items, d)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{"downloads": items})
}

func (h *Handler) handleDownloadFile(w http.ResponseWriter, r *http.Request) {
	filename := r.PathValue("file")
	if filename == "" {
		http.Error(w, "No filename specified", http.StatusBadRequest)
		return
	}
	if strings.Contains(filename, "..") || strings.Contains(filename, "/") || strings.Contains(filename, "\\") {
		http.Error(w, "Invalid filename", http.StatusBadRequest)
		return
	}

	buildsDir := h.buildsDir()
	filePath := filepath.Join(buildsDir, filename)

	info, err := os.Stat(filePath)
	if err != nil {
		http.Error(w, "File not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Disposition", fmt.Sprintf(`attachment; filename="%s"`, filename))
	w.Header().Set("Content-Type", "application/octet-stream")
	w.Header().Set("Content-Length", fmt.Sprintf("%d", info.Size()))
	http.ServeFile(w, r, filePath)
}
