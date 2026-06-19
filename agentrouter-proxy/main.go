package main

import (
	"log"
	"net/http"
	"net/http/httputil"
	"net/url"
)

func main() {
	targetURL := "https://agentrouter.org"
	target, err := url.Parse(targetURL)
	if err != nil {
		log.Fatal("Failed to parse target URL:", err)
	}

	proxy := httputil.NewSingleHostReverseProxy(target)
	originalDirector := proxy.Director
	proxy.Director = func(req *http.Request) {
		originalDirector(req)
		req.Host = target.Host
		req.Header.Set("Originator", "codex_cli_rs")
		req.Header.Set("User-Agent", "codex_cli_rs/0.101.0 (Mac OS 26.0.1; arm64) Apple_Terminal/464")
		req.Header.Set("Version", "0.101.0")
		req.Header.Set("x-stainless-lang", "js")
		req.Header.Set("x-stainless-package-version", "0.55.1")
		req.Header.Set("x-stainless-os", "Windows")
		req.Header.Set("x-stainless-arch", "x64")
		req.Header.Set("x-stainless-runtime", "node")
		req.Header.Set("x-stainless-runtime-version", "v22.0.0")
		req.Header.Set("anthropic-version", "2023-06-01")
		req.Header.Set("anthropic-beta", "claude-code-20250219,oauth-2025-04-20")
		req.Header.Set("anthropic-dangerous-direct-browser-access", "true")
		req.Header.Set("x-app", "cli")
	}

	port := ":8318"
	log.Printf("AgentRouter proxy running on http://localhost%s", port)
	log.Printf("Point your provider base URL to http://localhost%s/v1", port)

	if err := http.ListenAndServe(port, proxy); err != nil {
		log.Fatal("Server error:", err)
	}
}
