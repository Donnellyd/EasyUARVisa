#!/usr/bin/env python3
import http.server
import socketserver
import os

PORT = 5000
Handler = http.server.SimpleHTTPRequestHandler

class CustomHandler(Handler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def guess_type(self, path):
        path_str = str(path)
        if path_str.endswith('.js'):
            return 'application/javascript'
        if path_str.endswith('.css'):
            return 'text/css'
        return super().guess_type(path)

os.chdir(os.path.dirname(os.path.abspath(__file__)))

with socketserver.TCPServer(("0.0.0.0", PORT), CustomHandler) as httpd:
    print(f"Serving static files at http://0.0.0.0:{PORT}")
    httpd.serve_forever()