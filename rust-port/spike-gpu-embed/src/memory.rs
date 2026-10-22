//! Process memory (resident set) of the spike and of its webview processes.
//!
//! Spike process itself:
//! - Linux: `/proc/self/status`, line `VmRSS:` (kB).
//! - macOS: `ps -o rss= -p <pid>` (KiB).
//! - Windows, feature `app` (what the owner runs): `GetProcessMemoryInfo`
//!   (`PROCESS_MEMORY_COUNTERS_EX`: `WorkingSetSize`, `PrivateUsage`) — an
//!   in-process call, NO child process, NO console window (round 2: the
//!   round-1 PowerShell call opened a console window over the GUI-subsystem
//!   release build and could steal focus/clicks during checks (2)/(3)/(6)).
//! - Windows without `app` (unit tests only): PowerShell started with
//!   `CREATE_NO_WINDOW`.
//!
//! Webview processes (round 2): the webview engines render in SEPARATE
//! processes (WebView2: `msedgewebview2.exe`; WebKitGTK: `WebKitWebProcess`,
//! `WebKitNetworkProcess`), which the RSS of the spike process does not
//! contain. The spike sums the RSS of all DESCENDANT processes of its own pid:
//! - Linux: `/proc/<pid>/stat` (ppid) + `/proc/<pid>/status` (`VmRSS`).
//! - Windows (`app`): `CreateToolhelp32Snapshot` (ppid) + `OpenProcess` +
//!   `GetProcessMemoryInfo`.
//! - macOS: NOT measured — WKWebView content processes are XPC services
//!   started by launchd, not descendants of the app, and cannot be attributed
//!   to it without extra APIs; reported as NIE_ZMIERZONO with this reason.
//!
//! What this does NOT measure: GPU-only memory held by the driver outside the
//! process address space (VRAM). The report states it next to the numbers.
//! A sum of RSS over several processes counts shared pages more than once
//! (upper bound); the report states it as well.

use serde::{Deserialize, Serialize};

/// One memory sample.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct MemorySample {
    /// Seconds since the first rendered frame.
    pub t_s: f64,
    /// Resident set / working set of the spike process, bytes.
    pub rss_bytes: u64,
    /// Windows only: private bytes (commit), when available.
    pub private_bytes: Option<u64>,
    /// How the value was read.
    pub source: String,
    /// Webview (descendant) processes, measured separately.
    #[serde(default)]
    pub webview: WebviewMemory,
    /// GPU memory counter of wgpu (`Device::generate_allocator_report`).
    #[serde(default)]
    pub gpu_alloc: GpuAllocSample,
}

/// GPU memory as seen by the wgpu allocator (P4-3 §9 pkt 13). Filled by the
/// `app` layer; `available = false` when the backend returns no report.
/// Not the whole VRAM: swapchain images and driver-internal memory are not
/// part of the allocator report.
#[derive(Debug, Clone, PartialEq, Eq, Default, Serialize, Deserialize)]
pub struct GpuAllocSample {
    pub available: bool,
    pub allocated_bytes: Option<u64>,
    pub reserved_bytes: Option<u64>,
    pub blocks: Option<u64>,
    pub note: String,
}

/// One descendant process of the spike.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct ChildProcess {
    pub pid: u32,
    pub ppid: u32,
    pub name: String,
    pub rss_bytes: Option<u64>,
    pub private_bytes: Option<u64>,
    /// Why the memory of this process could not be read.
    pub error: Option<String>,
}

/// Memory of the webview processes (all descendants of the spike process).
#[derive(Debug, Clone, PartialEq, Eq, Default, Serialize, Deserialize)]
pub struct WebviewMemory {
    /// `true` only when at least one descendant process was read.
    pub measured: bool,
    /// Sum of RSS / working set over the descendants that could be read.
    pub rss_bytes: Option<u64>,
    /// Sum of private bytes (Windows), when available for every process read.
    pub private_bytes: Option<u64>,
    pub processes: Vec<ChildProcess>,
    pub source: String,
    /// Reason for NIE_ZMIERZONO or caveats.
    pub note: String,
}

/// Process table row used to find descendants.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ProcEntry {
    pub pid: u32,
    pub ppid: u32,
    pub name: String,
}

/// All descendants of `root` (children, grandchildren, ...), breadth-first,
/// `root` itself excluded; robust against cycles in a racy snapshot.
pub fn descendants_of(entries: &[ProcEntry], root: u32) -> Vec<ProcEntry> {
    let mut seen = std::collections::HashSet::new();
    seen.insert(root);
    let mut frontier = vec![root];
    let mut out = Vec::new();
    while let Some(parent) = frontier.pop() {
        for e in entries
            .iter()
            .filter(|e| e.ppid == parent && e.pid != parent)
        {
            if seen.insert(e.pid) {
                out.push(e.clone());
                frontier.push(e.pid);
            }
        }
    }
    out.sort_by_key(|e| e.pid);
    out
}

/// Sum the readable processes into a [`WebviewMemory`].
pub fn summarize_children(children: Vec<ChildProcess>, source: &str) -> WebviewMemory {
    let read: Vec<&ChildProcess> = children.iter().filter(|c| c.rss_bytes.is_some()).collect();
    let failed = children.len() - read.len();
    if children.is_empty() {
        return WebviewMemory {
            measured: false,
            rss_bytes: None,
            private_bytes: None,
            processes: children,
            source: source.into(),
            note: "brak procesow potomnych w chwili probki (webview jeszcze nie wystartowal albo dziala w procesie spoza drzewa)".into(),
        };
    }
    if read.is_empty() {
        return WebviewMemory {
            measured: false,
            rss_bytes: None,
            private_bytes: None,
            note: format!(
                "{} procesow potomnych, zadnego nie udalo sie odczytac",
                children.len()
            ),
            processes: children,
            source: source.into(),
        };
    }
    let rss: u64 = read.iter().filter_map(|c| c.rss_bytes).sum();
    let private = if read.iter().all(|c| c.private_bytes.is_some()) {
        Some(read.iter().filter_map(|c| c.private_bytes).sum())
    } else {
        None
    };
    let mut note = format!(
        "{} procesow potomnych odczytanych; suma RSS liczy wspoldzielone strony wielokrotnie (gorne oszacowanie)",
        read.len()
    );
    if failed > 0 {
        note.push_str(&format!("; {failed} nieodczytanych (pominiete w sumie)"));
    }
    WebviewMemory {
        measured: true,
        rss_bytes: Some(rss),
        private_bytes: private,
        processes: children,
        source: source.into(),
        note,
    }
}

/// Parse `/proc/<pid>/stat`: returns `(comm, ppid)`. `comm` may contain
/// spaces and parentheses, so it is taken between the first `(` and the LAST
/// `)`; after it come `state` and `ppid`.
pub fn parse_proc_stat(stat: &str) -> Option<(String, u32)> {
    let open = stat.find('(')?;
    let close = stat.rfind(')')?;
    if close < open {
        return None;
    }
    let name = stat[open + 1..close].to_string();
    let mut rest = stat[close + 1..].split_whitespace();
    let _state = rest.next()?;
    let ppid = rest.next()?.parse().ok()?;
    Some((name, ppid))
}

/// Parse `VmRSS:` from `/proc/<pid>/status` content; kB -> bytes.
pub fn parse_proc_status_vmrss(status: &str) -> Option<u64> {
    status.lines().find_map(|line| {
        let rest = line.strip_prefix("VmRSS:")?;
        let mut it = rest.split_whitespace();
        let value: u64 = it.next()?.parse().ok()?;
        match it.next() {
            Some("kB") | Some("KB") | Some("kb") => Some(value * 1024),
            _ => None,
        }
    })
}

/// Parse the output of `ps -o rss= -p <pid>` (KiB) -> bytes.
pub fn parse_ps_rss_kib(out: &str) -> Option<u64> {
    out.trim().parse::<u64>().ok().map(|k| k * 1024)
}

/// Parse one integer per line (PowerShell output), returns all of them.
pub fn parse_integer_lines(out: &str) -> Vec<u64> {
    out.lines()
        .filter_map(|l| l.trim().parse::<u64>().ok())
        .collect()
}

/// Read the current process memory. Error = human-readable reason.
pub fn current_process_memory() -> Result<(u64, Option<u64>, String), String> {
    #[cfg(target_os = "linux")]
    {
        let s = std::fs::read_to_string("/proc/self/status")
            .map_err(|e| format!("/proc/self/status: {e}"))?;
        let rss = parse_proc_status_vmrss(&s).ok_or("brak VmRSS w /proc/self/status")?;
        Ok((rss, None, "linux:/proc/self/status VmRSS".into()))
    }
    #[cfg(target_os = "macos")]
    {
        let pid = std::process::id().to_string();
        let out = std::process::Command::new("ps")
            .args(["-o", "rss=", "-p", &pid])
            .output()
            .map_err(|e| format!("ps: {e}"))?;
        let txt = String::from_utf8_lossy(&out.stdout);
        let rss =
            parse_ps_rss_kib(&txt).ok_or_else(|| format!("ps: nieczytelne wyjscie {txt:?}"))?;
        Ok((rss, None, "macos:ps -o rss=".into()))
    }
    #[cfg(all(windows, feature = "app"))]
    {
        win::self_memory()
    }
    #[cfg(all(windows, not(feature = "app")))]
    {
        use std::os::windows::process::CommandExt;
        /// `CREATE_NO_WINDOW` (winbase.h): no console window for the child.
        const CREATE_NO_WINDOW: u32 = 0x0800_0000;
        let pid = std::process::id();
        let cmd = format!("$p = Get-Process -Id {pid}; $p.WorkingSet64; $p.PrivateMemorySize64");
        let out = std::process::Command::new("powershell")
            .args(["-NoProfile", "-NonInteractive", "-Command", &cmd])
            .creation_flags(CREATE_NO_WINDOW)
            .output()
            .map_err(|e| format!("powershell: {e}"))?;
        let txt = String::from_utf8_lossy(&out.stdout);
        let nums = parse_integer_lines(&txt);
        match nums.as_slice() {
            [ws, private, ..] => Ok((
                *ws,
                Some(*private),
                "windows:Get-Process WorkingSet64/PrivateMemorySize64 (CREATE_NO_WINDOW)".into(),
            )),
            [ws] => Ok((*ws, None, "windows:Get-Process WorkingSet64".into())),
            [] => Err(format!("powershell: nieczytelne wyjscie {txt:?}")),
        }
    }
    #[cfg(not(any(target_os = "linux", target_os = "macos", windows)))]
    {
        Err("platforma bez implementacji odczytu pamieci".into())
    }
}

/// Memory of the webview processes (descendants of this process).
pub fn webview_memory() -> WebviewMemory {
    #[cfg(target_os = "linux")]
    {
        linux_webview_memory()
    }
    #[cfg(all(windows, feature = "app"))]
    {
        win::webview_memory()
    }
    #[cfg(all(windows, not(feature = "app")))]
    {
        not_measured(
            "windows:-",
            "bez cechy `app` nie ma webview; odczyt procesow potomnych tylko w buildzie `app`",
        )
    }
    #[cfg(target_os = "macos")]
    {
        not_measured(
            "macos:-",
            "WKWebView: procesy WebContent sa uslugami XPC uruchamianymi przez launchd, nie potomkami aplikacji - nie da sie ich przypisac bez dodatkowych API (NIE_ZMIERZONO)",
        )
    }
    #[cfg(not(any(target_os = "linux", target_os = "macos", windows)))]
    {
        not_measured("-", "platforma bez implementacji odczytu pamieci")
    }
}

#[allow(dead_code)]
fn not_measured(source: &str, note: &str) -> WebviewMemory {
    WebviewMemory {
        measured: false,
        source: source.into(),
        note: note.into(),
        ..WebviewMemory::default()
    }
}

#[cfg(target_os = "linux")]
fn linux_webview_memory() -> WebviewMemory {
    const SOURCE: &str =
        "linux:/proc/*/stat (ppid) + /proc/<pid>/status VmRSS, potomkowie procesu spike'a";
    let dir = match std::fs::read_dir("/proc") {
        Ok(d) => d,
        Err(e) => return not_measured(SOURCE, &format!("/proc: {e}")),
    };
    let mut entries = Vec::new();
    for ent in dir.flatten() {
        let Some(pid) = ent.file_name().to_str().and_then(|s| s.parse::<u32>().ok()) else {
            continue;
        };
        // Processes may exit between listing and reading: skip silently.
        if let Ok(stat) = std::fs::read_to_string(format!("/proc/{pid}/stat")) {
            if let Some((name, ppid)) = parse_proc_stat(&stat) {
                entries.push(ProcEntry { pid, ppid, name });
            }
        }
    }
    let children = descendants_of(&entries, std::process::id())
        .into_iter()
        .map(|e| {
            let (rss, error) = match std::fs::read_to_string(format!("/proc/{}/status", e.pid)) {
                Ok(s) => match parse_proc_status_vmrss(&s) {
                    Some(v) => (Some(v), None),
                    None => (None, Some("brak VmRSS".to_string())),
                },
                Err(err) => (None, Some(format!("status: {err}"))),
            };
            ChildProcess {
                pid: e.pid,
                ppid: e.ppid,
                name: e.name,
                rss_bytes: rss,
                private_bytes: None,
                error,
            }
        })
        .collect();
    summarize_children(children, SOURCE)
}

#[cfg(all(windows, feature = "app"))]
mod win {
    use super::WebviewMemory;
    use super::{descendants_of, not_measured, summarize_children, ChildProcess, ProcEntry};
    use windows::Win32::Foundation::{CloseHandle, HANDLE};
    use windows::Win32::System::Diagnostics::ToolHelp::{
        CreateToolhelp32Snapshot, Process32FirstW, Process32NextW, PROCESSENTRY32W,
        TH32CS_SNAPPROCESS,
    };
    use windows::Win32::System::ProcessStatus::{
        GetProcessMemoryInfo, PROCESS_MEMORY_COUNTERS, PROCESS_MEMORY_COUNTERS_EX,
    };
    use windows::Win32::System::Threading::{
        GetCurrentProcess, OpenProcess, PROCESS_QUERY_LIMITED_INFORMATION, PROCESS_VM_READ,
    };

    fn counters(h: HANDLE) -> Result<(u64, u64), String> {
        let mut c = PROCESS_MEMORY_COUNTERS_EX {
            cb: std::mem::size_of::<PROCESS_MEMORY_COUNTERS_EX>() as u32,
            ..Default::default()
        };
        // SAFETY: `c` is a valid, correctly sized PROCESS_MEMORY_COUNTERS_EX;
        // the API accepts the _EX layout when `cb` says so.
        unsafe {
            GetProcessMemoryInfo(
                h,
                &mut c as *mut PROCESS_MEMORY_COUNTERS_EX as *mut PROCESS_MEMORY_COUNTERS,
                c.cb,
            )
        }
        .map_err(|e| format!("GetProcessMemoryInfo: {e}"))?;
        Ok((c.WorkingSetSize as u64, c.PrivateUsage as u64))
    }

    pub fn self_memory() -> Result<(u64, Option<u64>, String), String> {
        // SAFETY: pseudo-handle of the current process; no close needed.
        let h = unsafe { GetCurrentProcess() };
        let (ws, private) = counters(h)?;
        Ok((
            ws,
            Some(private),
            "windows:GetProcessMemoryInfo WorkingSetSize/PrivateUsage (w procesie, bez okna konsoli)"
                .into(),
        ))
    }

    fn process_table() -> Result<Vec<ProcEntry>, String> {
        // SAFETY: plain Win32 snapshot; the handle is closed below.
        let snap = unsafe { CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0) }
            .map_err(|e| format!("CreateToolhelp32Snapshot: {e}"))?;
        let mut out = Vec::new();
        let mut pe = PROCESSENTRY32W {
            dwSize: std::mem::size_of::<PROCESSENTRY32W>() as u32,
            ..Default::default()
        };
        // SAFETY: `pe` is a valid PROCESSENTRY32W with dwSize set.
        let mut ok = unsafe { Process32FirstW(snap, &mut pe) }.is_ok();
        while ok {
            let len = pe
                .szExeFile
                .iter()
                .position(|&c| c == 0)
                .unwrap_or(pe.szExeFile.len());
            out.push(ProcEntry {
                pid: pe.th32ProcessID,
                ppid: pe.th32ParentProcessID,
                name: String::from_utf16_lossy(&pe.szExeFile[..len]),
            });
            // SAFETY: as above.
            ok = unsafe { Process32NextW(snap, &mut pe) }.is_ok();
        }
        // SAFETY: handle from CreateToolhelp32Snapshot.
        let _ = unsafe { CloseHandle(snap) };
        Ok(out)
    }

    fn child_memory(e: ProcEntry) -> ChildProcess {
        // Documented access: QUERY(_LIMITED)_INFORMATION + VM_READ; fall back
        // to QUERY_LIMITED alone (enough on current Windows versions).
        // SAFETY: plain Win32 calls; the handle is closed below.
        let h = unsafe {
            OpenProcess(
                PROCESS_QUERY_LIMITED_INFORMATION | PROCESS_VM_READ,
                false,
                e.pid,
            )
        }
        .or_else(|_| unsafe { OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, false, e.pid) });
        let (rss, private, error) = match h {
            Ok(h) => {
                let r = counters(h);
                // SAFETY: handle from OpenProcess.
                let _ = unsafe { CloseHandle(h) };
                match r {
                    Ok((ws, p)) => (Some(ws), Some(p), None),
                    Err(err) => (None, None, Some(err)),
                }
            }
            Err(err) => (None, None, Some(format!("OpenProcess: {err}"))),
        };
        ChildProcess {
            pid: e.pid,
            ppid: e.ppid,
            name: e.name,
            rss_bytes: rss,
            private_bytes: private,
            error,
        }
    }

    pub fn webview_memory() -> WebviewMemory {
        const SOURCE: &str = "windows:CreateToolhelp32Snapshot (ppid) + GetProcessMemoryInfo, potomkowie procesu spike'a (msedgewebview2.exe)";
        match process_table() {
            Ok(table) => summarize_children(
                descendants_of(&table, std::process::id())
                    .into_iter()
                    .map(child_memory)
                    .collect(),
                SOURCE,
            ),
            Err(e) => not_measured(SOURCE, &e),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn vmrss_parsed() {
        let s = "Name:\tspike\nVmPeak:\t  300000 kB\nVmRSS:\t  123456 kB\nThreads: 9\n";
        assert_eq!(parse_proc_status_vmrss(s), Some(123456 * 1024));
        assert_eq!(parse_proc_status_vmrss("VmRSS: 12 MB\n"), None);
        assert_eq!(parse_proc_status_vmrss("nothing"), None);
    }

    #[test]
    fn ps_and_powershell_parsed() {
        assert_eq!(parse_ps_rss_kib("  20480\n"), Some(20480 * 1024));
        assert_eq!(parse_ps_rss_kib("x"), None);
        assert_eq!(parse_integer_lines("123\r\n456\r\n"), vec![123, 456]);
        assert_eq!(parse_integer_lines("abc\n"), Vec::<u64>::new());
    }

    #[test]
    fn proc_stat_parsed_with_awkward_comm() {
        assert_eq!(
            parse_proc_stat("1234 (WebKitWebProcess) S 1000 1234 1234 0 -1"),
            Some(("WebKitWebProcess".into(), 1000))
        );
        // comm with spaces and a closing parenthesis
        assert_eq!(
            parse_proc_stat("77 (a b) c)) R 5 77 77"),
            Some(("a b) c)".into(), 5))
        );
        assert_eq!(parse_proc_stat("garbage"), None);
        assert_eq!(parse_proc_stat("1 (x) S notanumber"), None);
    }

    fn pe(pid: u32, ppid: u32) -> ProcEntry {
        ProcEntry {
            pid,
            ppid,
            name: format!("p{pid}"),
        }
    }

    #[test]
    fn descendants_found_recursively_and_cycle_safe() {
        // 10 = spike; 11, 12 children; 13 grandchild (via 11); 20 unrelated;
        // 14 <-> 15 cycle under 12 (racy snapshot / pid reuse).
        let t = vec![
            pe(1, 0),
            pe(10, 1),
            pe(11, 10),
            pe(12, 10),
            pe(13, 11),
            pe(20, 1),
            pe(14, 12),
            pe(15, 14),
            ProcEntry {
                pid: 14,
                ppid: 15,
                name: "dup".into(),
            },
        ];
        let d: Vec<u32> = descendants_of(&t, 10).iter().map(|e| e.pid).collect();
        assert_eq!(d, vec![11, 12, 13, 14, 15]);
        assert!(descendants_of(&t, 20).is_empty());
    }

    fn cp(pid: u32, rss: Option<u64>, private: Option<u64>) -> ChildProcess {
        ChildProcess {
            pid,
            ppid: 1,
            name: "w".into(),
            rss_bytes: rss,
            private_bytes: private,
            error: rss.is_none().then(|| "denied".into()),
        }
    }

    #[test]
    fn children_summarized() {
        let none = summarize_children(vec![], "s");
        assert!(!none.measured);
        assert_eq!(none.rss_bytes, None);
        assert!(none.note.contains("brak procesow potomnych"));

        let failed = summarize_children(vec![cp(1, None, None)], "s");
        assert!(!failed.measured);

        let some = summarize_children(
            vec![
                cp(1, Some(100), Some(10)),
                cp(2, Some(50), Some(5)),
                cp(3, None, None),
            ],
            "s",
        );
        assert!(some.measured);
        assert_eq!(some.rss_bytes, Some(150));
        assert_eq!(some.private_bytes, Some(15));
        assert!(some.note.contains("1 nieodczytanych"));
        assert_eq!(some.processes.len(), 3);

        let mixed = summarize_children(vec![cp(1, Some(100), None), cp(2, Some(1), Some(1))], "s");
        assert_eq!(mixed.private_bytes, None);
    }

    #[test]
    fn old_sample_json_without_webview_still_parses() {
        let s: MemorySample =
            serde_json::from_str(r#"{"t_s":1.0,"rss_bytes":5,"private_bytes":null,"source":"x"}"#)
                .unwrap();
        assert!(!s.webview.measured);
    }

    #[cfg(target_os = "linux")]
    #[test]
    fn reads_own_memory_on_linux() {
        let (rss, private, src) = current_process_memory().unwrap();
        assert!(rss > 0);
        assert!(private.is_none());
        assert!(src.contains("VmRSS"));
    }

    #[cfg(target_os = "linux")]
    #[test]
    fn reads_child_memory_on_linux() {
        // A real child process (`sleep`), so the /proc walk is exercised here.
        let mut child = std::process::Command::new("sleep")
            .arg("5")
            .spawn()
            .unwrap();
        let w = webview_memory();
        let _ = child.kill();
        let _ = child.wait();
        assert!(w.measured, "{w:?}");
        assert!(w.processes.iter().any(|p| p.pid == child.id()), "{w:?}");
        assert!(w.rss_bytes.unwrap() > 0);
    }
}
