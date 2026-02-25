import time
import ctypes
import requests
import uuid
import sys
from datetime import datetime

try:
    import config
except ImportError:
    print("config.py not found. Please run install.bat first.")
    sys.exit(1)

WORK_PROGRAMS = [
    "AutoCAD", "Revit", "ETABS", "SAFE", "Excel", "PowerPoint", "Word", 
    "SketchUp", "Lumion", "Twinmotion", "3ds Max", "Archicad",
    "Chrome", "Edge", "Brave"
]
IDLE_THRESHOLD_MS = 5 * 60 * 1000  # 5 minutes

class LASTINPUTINFO(ctypes.Structure):
    _fields_ = [("cbSize", ctypes.c_uint), ("dwTime", ctypes.c_uint)]

def get_idle_time_ms():
    lii = LASTINPUTINFO()
    lii.cbSize = ctypes.sizeof(LASTINPUTINFO)
    if ctypes.windll.user32.GetLastInputInfo(ctypes.byref(lii)):
        # Handle wraparound safely
        tick = ctypes.windll.kernel32.GetTickCount()
        # Ensure tick >= lii.dwTime (unsigned 32bit math in python needs masking)
        tick = tick & 0xffffffff
        dwTime = lii.dwTime & 0xffffffff
        millis = (tick - dwTime) & 0xffffffff
        return millis
    return 0

def get_active_window_title():
    try:
        hwnd = ctypes.windll.user32.GetForegroundWindow()
        length = ctypes.windll.user32.GetWindowTextLengthW(hwnd)
        buf = ctypes.create_unicode_buffer(length + 1)
        ctypes.windll.user32.GetWindowTextW(hwnd, buf, length + 1)
        return buf.value
    except Exception:
        pass
    return ""

def is_work_program_active():
    title = get_active_window_title()
    if not title:
        return False
    for wp in WORK_PROGRAMS:
        if wp.lower() in title.lower():
            return True
    return False

def supabase_request(method, endpoint, data=None):
    url = f"{config.SUPABASE_URL}/rest/v1/{endpoint}"
    headers = {
        "apikey": config.SUPABASE_KEY,
        "Authorization": f"Bearer {config.SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
    }
    
    try:
        if method == "POST":
            r = requests.post(url, headers=headers, json=data, timeout=10)
        elif method == "PATCH":
            r = requests.patch(url, headers=headers, json=data, timeout=10)
        return r
    except Exception as e:
        # Ignore network errors silently since it runs in the background
        pass
    return None

def main():
    current_entry_id = None
    current_state = None  # 'work' or 'break'
    
    # Variables for detailed window tracking
    last_window = None
    last_window_time = time.time()
    
    # Throttle timeclock updates to avoid excessive API calls
    last_timeclock_update_time = 0

    while True:
        try:
            idle_ms = get_idle_time_ms()
            is_idle = idle_ms > IDLE_THRESHOLD_MS
            is_work = is_work_program_active()
            raw_window_title = get_active_window_title()

            now_time = time.time()
            now_iso = datetime.utcnow().isoformat() + "Z"

            # --- DETAILED WINDOW TRACKING LOGIC ---
            if raw_window_title != last_window:
                if last_window is not None:
                    duration_seconds = int(now_time - last_window_time)
                    if duration_seconds > 10 and not is_idle:
                        # Log the previous window usage
                        usage_payload = {
                            "engineerId": config.ENGINEER_ID,
                            "activeWindow": last_window,
                            "durationSeconds": duration_seconds,
                            "timestamp": now_iso
                        }
                        supabase_request("POST", "app_usage_log", usage_payload)
                
                last_window = raw_window_title
                last_window_time = now_time


            # --- TIMECLOCK LOGIC ---
            if is_idle:
                new_state = 'break'
            elif is_work:
                new_state = 'work'
            else:
                new_state = 'break'  # Active but not in a work app

            if current_state != new_state:
                # Start new entry instead of bothering to close the old one
                # (since old one's endTime was just patched)
                new_id = str(uuid.uuid4())
                payload = {
                    "id": new_id,
                    "engineerId": config.ENGINEER_ID,
                    "entryType": new_state,
                    "startTime": now_iso,
                    "createdAt": now_iso
                }
                
                res = supabase_request("POST", "time_entries", payload)
                if res and res.status_code in (201, 200, 204):
                    current_entry_id = new_id
                    current_state = new_state
                    last_timeclock_update_time = now_time
            else:
                # Continuously push the endTime back further periodically 
                # (throttle to every 60 seconds to avoid spamming the database)
                if current_entry_id and (now_time - last_timeclock_update_time > 60):
                    payload = {"endTime": now_iso}
                    supabase_request("PATCH", f"time_entries?id=eq.{current_entry_id}", payload)
                    last_timeclock_update_time = now_time

        except Exception as e:
            pass
        
        # Wake up every 10 seconds to allow for responsive window tracking
        time.sleep(10)

if __name__ == "__main__":
    main()
