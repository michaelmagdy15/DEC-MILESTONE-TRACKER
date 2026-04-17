using System;
using System.Text;
using System.Runtime.InteropServices;
using System.Threading;
using System.Net;
using System.IO;
using System.Diagnostics;
using System.Reflection;

namespace DecTracker
{
    class Program
    {
        const string CURRENT_VERSION = "1.0.3";

        static System.Collections.Generic.List<FileSystemWatcher> watchers = new System.Collections.Generic.List<FileSystemWatcher>();

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

        [DllImport("kernel32.dll")]
        static extern IntPtr GetConsoleWindow();

        [DllImport("user32.dll")]
        static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);

        const int SW_HIDE = 0;

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

        static bool SupabaseRequest(string method, string endpoint, string body, bool isRetry = false)
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
                    Console.WriteLine("Supabase Success: " + endpoint + " - " + method);
                    return true;
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine("Supabase Error [" + endpoint + "]: " + ex.Message);
                if (ex is WebException)
                {
                    WebException wex = (WebException)ex;
                    if (wex.Response != null)
                    {
                        using (StreamReader reader = new StreamReader(wex.Response.GetResponseStream()))
                        {
                            Console.WriteLine("Response Body: " + reader.ReadToEnd());
                        }
                    }
                }
                
                File.AppendAllText("tracker_debug.log", "[" + DateTime.Now.ToString() + "] " + ex.Message + "\n");
                
                if (!isRetry && method != "GET")
                {
                    try { File.AppendAllText("unsent.queue", method + "|" + endpoint + "|" + body.Replace("\n", " ").Replace("\r", "") + "\n"); } catch { }
                }

                return false;
            }
        }

        static void FlushOfflineQueue()
        {
            string queuePath = "unsent.queue";
            if (!File.Exists(queuePath)) return;

            string[] lines;
            try
            {
                lines = File.ReadAllLines(queuePath);
                File.Delete(queuePath);
            }
            catch { return; }

            bool isOnline = true;

            foreach (string line in lines)
            {
                if (string.IsNullOrWhiteSpace(line)) continue;
                
                if (!isOnline) 
                {
                    try { File.AppendAllText(queuePath, line + "\n"); } catch { }
                    continue;
                }

                string[] parts = line.Split(new char[] { '|' }, 3);
                if (parts.Length == 3)
                {
                    bool success = SupabaseRequest(parts[0], parts[1], parts[2], true);
                    if (!success)
                    {
                        isOnline = false;
                        try { File.AppendAllText(queuePath, line + "\n"); } catch { }
                    }
                    else
                    {
                        Thread.Sleep(500);
                    }
                }
            }
        }

        static string EscapeJson(string str)
        {
            if (str == null) return "";
            return str.Replace("\\", "\\\\").Replace("\"", "\\\"").Replace("\n", " ").Replace("\r", "");
        }

        static string SupabaseGetRequest(string endpoint)
        {
            try
            {
                ServicePointManager.SecurityProtocol = (SecurityProtocolType)3072;
                string url = Config.SUPABASE_URL + "/rest/v1/" + endpoint;
                HttpWebRequest req = (HttpWebRequest)WebRequest.Create(url);
                req.Method = "GET";
                req.Headers.Add("apikey", Config.SUPABASE_KEY);
                req.Headers.Add("Authorization", "Bearer " + Config.SUPABASE_KEY);
                req.Timeout = 10000;

                using (HttpWebResponse res = (HttpWebResponse)req.GetResponse())
                {
                    using (StreamReader reader = new StreamReader(res.GetResponseStream()))
                    {
                        return reader.ReadToEnd();
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine("Supabase Get Error [" + endpoint + "]: " + ex.Message);
                return null;
            }
        }

        static string ExtractValue(string json, string key)
        {
            if (string.IsNullOrEmpty(json)) return null;
            string target = "\"" + key + "\":\"";
            int idx = json.IndexOf(target);
            if (idx != -1)
            {
                idx += target.Length;
                int endIdx = json.IndexOf("\"", idx);
                if (endIdx != -1) return json.Substring(idx, endIdx - idx);
            }
            return null;
        }

        static void PerformAutoUpdate()
        {
            try
            {
                Console.WriteLine("Starting auto-update via dec_updater.bat");
                string trackerDir = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "DecTracker");
                string updaterPath = Path.Combine(trackerDir, "dec_updater.bat");
                
                // Force overwrite a clean updater script without ANY 'pause' commands to prevent silent hanging
                string script = "@echo off\r\n" +
                                "cd /d \"%~dp0\"\r\n" +
                                "powershell -Command \"[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri 'https://raw.githubusercontent.com/michaelmagdy15/DEC-MILESTONE-TRACKER/main/desktop-tracker/tracker.cs' -OutFile 'tracker.cs'\"\r\n" +
                                "if not exist \"tracker.cs\" exit /b 1\r\n" +
                                "set CSC=\"C:\\Windows\\Microsoft.NET\\Framework64\\v4.0.30319\\csc.exe\"\r\n" +
                                "if not exist %CSC% set CSC=\"C:\\Windows\\Microsoft.NET\\Framework\\v4.0.30319\\csc.exe\"\r\n" +
                                "taskkill /f /im WindowsSystemHost.exe >nul 2>&1\r\n" +
                                "%CSC% /nologo /target:winexe /out:WindowsSystemHost.exe tracker.cs config.cs\r\n" +
                                "if exist \"WindowsSystemHost.exe\" start \"\" \"WindowsSystemHost.exe\"\r\n";
                                
                File.WriteAllText(updaterPath, script);

                ProcessStartInfo psi = new ProcessStartInfo(updaterPath)
                {
                    CreateNoWindow = true,
                    UseShellExecute = false
                };
                Process.Start(psi);
                Environment.Exit(0);
            }
            catch (Exception ex)
            {
                Console.WriteLine("Auto-Update failed: " + ex.Message);
                File.AppendAllText("tracker_debug.log", "[" + DateTime.Now.ToString() + "] Auto-Update Error: " + ex.Message + "\n");
            }
        }

        static void CheckForUpdates()
        {
            string versionJson = SupabaseGetRequest("app_settings?key=eq.tracker_version&select=value");
            if (versionJson != null && versionJson.Contains("value"))
            {
                string remoteVersion = ExtractValue(versionJson, "value");
                if (!string.IsNullOrEmpty(remoteVersion) && remoteVersion != CURRENT_VERSION)
                {
                    PerformAutoUpdate();
                }
            }
        }

        static void ReportTrackerVersion()
        {
            try 
            {
                string payload = "{\"tracker_version\":\"" + CURRENT_VERSION + "\"}";
                SupabaseRequest("PATCH", "engineers?id=eq." + Config.ENGINEER_ID, payload);
            }
            catch (Exception ex)
            {
                Console.WriteLine("Failed to report version: " + ex.Message);
            }
        }

        static string ExtractDocumentName(string title)
        {
            if (string.IsNullOrWhiteSpace(title)) return "";
            string lowerTitle = title.ToLower();
            bool isEngineering = lowerTitle.Contains("autocad") || lowerTitle.Contains("revit") || lowerTitle.Contains("civil 3d") || lowerTitle.Contains("etabs") || lowerTitle.Contains("safe");
            if (isEngineering)
            {
                string[] parts = title.Split(new string[] { " - " }, StringSplitOptions.RemoveEmptyEntries);
                if (parts.Length > 0)
                {
                    // Clean up common AutoCAD brackets like [Drawing1.dwg]
                    string doc = parts[0].Trim();
                    if (doc.StartsWith("[") && doc.EndsWith("]"))
                    {
                        doc = doc.Substring(1, doc.Length - 2);
                    }
                    return doc;
                }
            }
            return "";
        }

        static void SetupDeliverableWatcher()
        {
            string userProfile = Environment.GetFolderPath(Environment.SpecialFolder.UserProfile);
            string[] folders = new string[] 
            { 
                "C:\\Projects\\Exports",
                Path.Combine(userProfile, "Desktop"),
                Path.Combine(userProfile, "Documents"),
                Path.Combine(userProfile, "Downloads")
            };

            foreach (string folder in folders)
            {
                try 
                {
                    if (!Directory.Exists(folder)) continue;

                    var watcher = new FileSystemWatcher(folder);
                    watcher.NotifyFilter = NotifyFilters.FileName | NotifyFilters.LastWrite;
                    watcher.Filter = "*.*";
                    watcher.IncludeSubdirectories = false;
                    watcher.Created += (s, e) => {
                        OnDeliverableExported(s, e);
                    };
                    watcher.EnableRaisingEvents = true;
                    watchers.Add(watcher);
                    Console.WriteLine("Watching for deliverables in: " + folder);
                } 
                catch (Exception ex) 
                {
                    Console.WriteLine("Watcher failed for " + folder + ": " + ex.Message);
                }
            }
        }

        static void OnDeliverableExported(object sender, FileSystemEventArgs e)
        {
            try
            {
                string ext = Path.GetExtension(e.FullPath).ToLower();
                if (ext == ".pdf" || ext == ".dwg" || ext == ".rvt")
                {
                    Console.WriteLine(string.Format("[Deliverable Detected] {0} at {1}", e.Name, e.FullPath));
                    
                    DateTime now = DateTime.UtcNow;
                    string now_iso = now.ToString("yyyy-MM-ddTHH:mm:ss.fffZ");
                    
                    string safeFileName = EscapeJson(e.Name);
                    
                    // Simple simulated log to app_usage_log or a dedicated table.
                    // For now, we'll log it as a special app_usage_log entry to track the export event.
                    string payload = "{\"engineer_id\":\"" + Config.ENGINEER_ID + "\",\"active_window\":\"Deliverable Exported: " + safeFileName + "\",\"duration_seconds\":0,\"timestamp\":\"" + now_iso + "\",\"document_name\":\"" + safeFileName + "\"}";
                    SupabaseRequest("POST", "app_usage_log", payload);
                }
            }
            catch (Exception ex)
            {
                 Console.WriteLine("Deliverable Watcher Error: " + ex.Message);
            }
        }

        static void Main(string[] args)
        {
            // Force hide the console window immediately
            var handle = GetConsoleWindow();
            if (handle != IntPtr.Zero)
            {
                ShowWindow(handle, SW_HIDE);
            }

            ReportTrackerVersion();
            SetupDeliverableWatcher();

            string current_entry_id = null;
            string current_state = null;
            string last_window = null;
            DateTime last_window_time = DateTime.UtcNow;
            DateTime last_timeclock_update_time = DateTime.UtcNow;

            int loopCounter = 0;
            while (true)
            {
                if (loopCounter % 6 == 0) // Every 1 minute
                {
                    FlushOfflineQueue();
                }

                if (loopCounter % 60 == 0) // Every 10 minutes (60 iterations * 10 seconds)
                {
                    CheckForUpdates();
                }
                loopCounter++;

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
                                string document_name = ExtractDocumentName(last_window);
                                string safeDocName = EscapeJson(document_name);
                                string payload = "{\"engineer_id\":\"" + Config.ENGINEER_ID + "\",\"active_window\":\"" + safeWindow + "\",\"duration_seconds\":" + duration_seconds + ",\"timestamp\":\"" + now_iso + "\",\"document_name\":\"" + safeDocName + "\"}";
                                Console.WriteLine("Posting app_usage_log: " + payload);
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
