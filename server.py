import http.server
import socketserver

# Cấu hình server
PORT = 8020  # Bạn có thể thay đổi port nếu cần
Handler = http.server.SimpleHTTPRequestHandler

# Tạo server
with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"Serving at http://localhost:{PORT}")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")
        httpd.server_close()
