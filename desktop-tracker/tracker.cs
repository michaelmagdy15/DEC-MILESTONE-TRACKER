using System;
using System.Text;
using System.Runtime.InteropServices;
using System.Threading;
using System.Net;
using System.IO;

namespace DecTracker
{
    class Program
    {
        [DllImport("user32.dll")]
        static extern IntPtr GetForegroundWindow();

        [DllImport("user32.dll", CharSet = CharSet.Unicode)]
        static extern int GetWindowText(IntPtr hWnd, StringBuilder text, int count);

        [StructLayout(LayoutKind.Sequential)]
        struct LASTINPUTINFO
        {
            public uint cbSize;
            public uint dwTime;
        }

        [DllImport("user32.dll")]
        static extern bool GetLastInputInfo(ref LASTINPUTINFO plii);

        [DllImport("kernel32.dll")]
        static extern uint GetTickCount();

        static string[] WORK_PROGRAMS = new string[] {
            "AutoCAD", "Revit", "ETABS", "SAFE", "Excel", "PowerPoint", "Word", 
            "SketchUp", "Lumion", "Twinmotion", "3ds Max", "Archicad",
            "Chrome", "Edge", "Brave"
        };
        
        static int IDLE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

        static uint GetIdleTimeMs()
        {
            LASTINPUTINFO lii = new LASTINPUTINFO();
            lii.cbSize = (uint)Marshal.SizeOf(typeof(LASTINPUTINFO));
            if (GetLastInputInfo(ref lii))
            {
                uint tick = unchecked(GetTickCount());
                uint dwTime = unchecked(lii.dwTime);
                return unchecked(tick - dwTime);
            }
            return 0;
        }

        static string GetActiveWindow()
        {
            IntPtr hwnd = GetForegroundWindow();
            StringBuilder sb = new StringBuilder(256);
            if (GetWindowText(hwnd, sb, sb.Capacity) > 0)
            {
                return sb.ToString();
            }
            return "";
        }

        static bool IsWorkProgramActive(string title)
        {
            if (string.IsNullOrWhiteSpace(title)) return false;
            string lowerTitle = title.ToLower();
            foreach (string wp in WORK_PROGRAMS)
            {
                if (lowerTitle.Contains(wp.ToLower())) return true;
            }
            return false;
        }

        static bool SupabaseRequest(string method, string endpoint, string body)
        {
            try
            {
                // Force TLS 1.2 (SecurityProtocolType.Tls12 is 3072)
                ServicePointManager.SecurityProtocol = (SecurityProtocolType)3072;

                string url = Config.SUPABASE_URL + "/rest/v1/" + endpoint;
                HttpWebRequest req = (HttpWebRequest)WebRequest.Create(url);
                req.Method = method;
                req.Headers.Add("apikey", Config.SUPABASE_KEY);
                req.Headers.Add("Authorization", "Bearer " + Config.SUPABASE_KEY);
                req.Headers.Add("Prefer", "return=minimal");
                req.ContentType = "application/json";
                req.Timeout = 10000;

                byte[] data = Encoding.UTF8.GetBytes(body);
                req.ContentLength = data.Length;

                using (Stream stream = req.GetRequestStream())
                {
                    stream.Write(data, 0, data.Length);
                }

                using (HttpWebResponse res = (HttpWebResponse)req.GetResponse())
                {
                    return true;
                }
            }
            catch (Exception ex)
            {
                File.AppendAllText("tracker_debug.log", "[" + DateTime.Now.ToString() + "] " + ex.Message + "\n");
                return false;
            }
        }

        static string EscapeJson(string str)
        {
            if (str == null) return "";
            return str.Replace("\\", "\\\\").Replace("\"", "\\\"").Replace("\n", " ").Replace("\r", "");
        }

        static void Main(string[] args)
        {
            // Optional: Hide console window immediately if it was accidentally launched with one
            // We'll compile with /target:winexe so it won't have a console window anyway.

            string current_entry_id = null;
            string current_state = null;
            string last_window = null;
            DateTime last_window_time = DateTime.UtcNow;
            DateTime last_timeclock_update_time = DateTime.UtcNow;

            while (true)
            {
                try
                {
                    uint idle_ms = GetIdleTimeMs();
                    bool is_idle = idle_ms > IDLE_THRESHOLD_MS;
                    string raw_window_title = GetActiveWindow();
                    bool is_work = IsWorkProgramActive(raw_window_title);

                    DateTime now = DateTime.UtcNow;
                    string now_iso = now.ToString("yyyy-MM-ddTHH:mm:ss.fffZ");

                    if (raw_window_title != last_window)
                    {
                        if (last_window != null)
                        {
                            int duration_seconds = (int)(now - last_window_time).TotalSeconds;
                            if (duration_seconds > 10 && !is_idle)
                            {
                                string safeWindow = EscapeJson(last_window);
                                string payload = "{\"engineer_id\":\"" + Config.ENGINEER_ID + "\",\"active_window\":\"" + safeWindow + "\",\"duration_seconds\":" + duration_seconds + ",\"timestamp\":\"" + now_iso + "\"}";
                                SupabaseRequest("POST", "app_usage_log", payload);
                            }
                        }
                        last_window = raw_window_title;
                        last_window_time = now;
                    }

                    string new_state = "break";
                    if (is_idle) new_state = "break";
                    else if (is_work) new_state = "work";

                    if (current_state != new_state)
                    {
                        string new_id = Guid.NewGuid().ToString();
                        string payload = "{\"id\":\"" + new_id + "\",\"engineer_id\":\"" + Config.ENGINEER_ID + "\",\"entry_type\":\"" + new_state + "\",\"start_time\":\"" + now_iso + "\",\"created_at\":\"" + now_iso + "\"}";
                        if (SupabaseRequest("POST", "time_entries", payload))
                        {
                            current_entry_id = new_id;
                            current_state = new_state;
                            last_timeclock_update_time = now;
                        }
                    }
                    else
                    {
                        if (current_entry_id != null && (now - last_timeclock_update_time).TotalSeconds > 60)
                        {
                            string payload = "{\"end_time\":\"" + now_iso + "\"}";
                            SupabaseRequest("PATCH", "time_entries?id=eq." + current_entry_id, payload);
                            last_timeclock_update_time = now;
                        }
                    }
                }
                catch (Exception ex) 
                {
                    File.AppendAllText("tracker_debug.log", "[" + DateTime.Now.ToString() + "] Main Loop Error: " + ex.Message + "\n");
                }

                Thread.Sleep(10000);
            }
        }
    }
}
