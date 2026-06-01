"""Minimal static server for NutriCrew prototype (no npm required)."""
import http.server
import socketserver
import os

PORT = 5199
DIR = os.path.dirname(os.path.abspath(__file__))
os.chdir(DIR)

class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-cache")
        super().end_headers()

with socketserver.TCPServer(("0.0.0.0", PORT), Handler) as httpd:
    print(f"Serving NutriCrew prototype at http://localhost:{PORT}")
    print(f"Directory: {DIR}")
    httpd.serve_forever()
