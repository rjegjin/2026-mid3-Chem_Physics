import http.server
import socketserver
import json
import os
import re

PORT = 8000
ROOT_DIR = "/home/rjegj/projects/2026-mid3-Chem_Physics"

class AssetHandler(http.server.SimpleHTTPRequestHandler):
    def do_POST(self):
        if self.path == '/update-asset':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            target_file = os.path.join(ROOT_DIR, data['filename'])
            old_src = data['old_src']
            new_src = data['new_src']
            
            try:
                with open(target_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # 정밀한 교체를 위해 문자열 치환 실행
                # 따옴표 종류(single/double)에 상관없이 매칭되도록 시도하지만, 
                # 대시보드에서 받은 정확한 문자열을 우선 교체합니다.
                new_content = content.replace(old_src, new_src)
                
                with open(target_file, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"status": "success"}).encode())
                print(f"[Success] Updated {old_src} -> {new_src} in {data['filename']}")
                
            except Exception as e:
                self.send_response(500)
                self.end_headers()
                self.wfile.write(str(e).encode())
        else:
            self.send_response(404)
            self.end_headers()

    # CORS 및 캐시 방지 설정
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        super().end_headers()

os.chdir(ROOT_DIR)
with socketserver.TCPServer(("", PORT), AssetHandler) as httpd:
    print(f"🚀 Asset Management Server running at http://localhost:{PORT}")
    print("이미지 대시보드(asset_dashboard.html)를 열어 수정을 시작하세요.")
    httpd.serve_forever()
