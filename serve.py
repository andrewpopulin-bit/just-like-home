#!/usr/bin/env python3
"""Tiny static server for previewing the mock with caching disabled."""
import http.server
import socketserver

PORT = 4610


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()


if __name__ == "__main__":
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("127.0.0.1", PORT), NoCacheHandler) as httpd:
        print(f"Serving mock on http://localhost:{PORT} (no-cache)")
        httpd.serve_forever()
