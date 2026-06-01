import sys
import os

# 🌟 路径定位逻辑
if getattr(sys, 'frozen', False):
    BASE_DIR = sys._MEIPASS
    EXE_DIR = os.path.dirname(sys.executable)
else:
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    EXE_DIR = BASE_DIR

import webview
import threading
import uvicorn
import time
import socket
import json
import subprocess
import traceback
from cms_core.main import app

frontend_process = None
WINDOW_CONFIG_FILE = os.path.join(EXE_DIR, 'window_config.json')

def release_port(port):
    try:
        command = f'netstat -ano | findstr :{port}'
        result = subprocess.check_output(command, shell=True).decode()
        lines = result.strip().split('\n')
        for line in lines:
            parts = line.strip().split()
            if len(parts) >= 5 and parts[3] == 'LISTENING':
                pid = parts[-1]
                subprocess.run(f'taskkill /PID {pid} /F /T', shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                time.sleep(0.5)
    except:
        pass

def load_window_size():
    try:
        if os.path.exists(WINDOW_CONFIG_FILE):
            with open(WINDOW_CONFIG_FILE, 'r') as f:
                return json.load(f)
    except:
        pass
    return {"width": 1440, "height": 900}

def save_window_size(width, height):
    try:
        with open(WINDOW_CONFIG_FILE, 'w') as f:
            json.dump({"width": int(width), "height": int(height)}, f)
    except:
        pass

def get_free_port():
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(('', 0))
        return s.getsockname()[1]

def write_port_config(port):
    # 写入解压目录供前端读取
    public_dir = os.path.join(BASE_DIR, 'public')
    os.makedirs(public_dir, exist_ok=True)
    with open(os.path.join(public_dir, 'backend_config.json'), 'w', encoding='utf-8') as f:
        json.dump({"api_port": port}, f)

    standalone_public = os.path.join(BASE_DIR, '.next', 'standalone', 'public')
    if os.path.exists(os.path.join(BASE_DIR, '.next', 'standalone')):
        os.makedirs(standalone_public, exist_ok=True)
        with open(os.path.join(standalone_public, 'backend_config.json'), 'w', encoding='utf-8') as f:
            json.dump({"api_port": port}, f)

def wait_for_port(port, timeout=60):
    start_time = time.time()
    while time.time() - start_time < timeout:
        try:
            with socket.create_connection(('127.0.0.1', port), timeout=1):
                return True
        except (ConnectionRefusedError, socket.timeout, OSError):
            time.sleep(1)
    return False

class WindowAPI:
    def resize_window(self, width, height):
        save_window_size(width, height)
        webview.windows[0].resize(int(width), int(height))
        return True
    def minimize_window(self): webview.windows[0].minimize()
    def maximize_window(self): webview.windows[0].toggle_fullscreen()
    def close_window(self): on_closed()

def run_api(port):
    # 🌟 强制后端在 EXE 所在的真实目录工作，确保能读取到旁边的 data/ 等数据
    os.chdir(EXE_DIR)
    print(f"🟢 [后端] 工作路径已锁定: {EXE_DIR}")
    try:
        uvicorn.run(app, host="127.0.0.1", port=port, log_level="info")
    except Exception as e:
        print("❌ [后端] 崩溃报错：")
        traceback.print_exc()

def on_closed():
    if frontend_process:
        subprocess.run(f"taskkill /F /T /PID {frontend_process.pid}", shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    release_port(frontend_port)
    release_port(backend_port)
    os._exit(0)

def on_shown():
    win_size = load_window_size()
    webview.windows[0].resize(int(win_size["width"]), int(win_size["height"]))

if __name__ == "__main__":
    frontend_port = get_free_port()
    backend_port = get_free_port()

    env_vars = os.environ.copy()
    env_vars["PORT"] = str(frontend_port)

    standalone_dir = os.path.join(BASE_DIR, '.next', 'standalone')
    server_js = os.path.join(standalone_dir, 'server.js')

    # 🌟 核心自适应逻辑：判断是“打包运行”还是“开发运行”
    if os.path.exists(server_js):
        print("🚀 [生产模式] 使用 127.0.0.1 强制同步...")
        env_vars["HOSTNAME"] = "127.0.0.1"
        frontend_process = subprocess.Popen(["node", "server.js"], cwd=standalone_dir, env=env_vars, shell=True)
        window_url = f"http://127.0.0.1:{frontend_port}"
    else:
        print("🛠️ [开发模式] 使用 localhost 保持兼容...")
        frontend_process = subprocess.Popen("npm run dev", shell=True, cwd=BASE_DIR, env=env_vars)
        window_url = f"http://localhost:{frontend_port}"

    write_port_config(backend_port)
    threading.Thread(target=run_api, args=(backend_port,), daemon=True).start()

    if not wait_for_port(backend_port) or not wait_for_port(frontend_port):
        print(">>> ❌ 前后端启动失败！")
        on_closed()
        sys.exit(1)

    time.sleep(1.5)

    api = WindowAPI()
    window = webview.create_window(
        title='星辉云端·控制台',
        url=window_url,
        width=1440, height=900, min_size=(1024, 768),
        background_color='#0f172a', resizable=True, frameless=True, easy_drag=False, js_api=api
    )

    window.events.shown += on_shown
    window.events.closed += on_closed

    try:
        webview.start(debug=True)
    except KeyboardInterrupt:
        on_closed()