//! Process memory (resident set) without extra dependencies.
//!
//! - Linux: `/proc/self/status`, line `VmRSS:` (kB).
//! - macOS: `ps -o rss= -p <pid>` (KiB).
//! - Windows: PowerShell `(Get-Process -Id <pid>).WorkingSet64` and
//!   `.PrivateMemorySize64` (bytes).
//!
//! What this does NOT measure: GPU-only memory held by the driver outside the
//! process address space (VRAM). The report states it next to the numbers.

use serde::{Deserialize, Serialize};

/// One memory sample.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct MemorySample {
    /// Seconds since the first rendered frame.
    pub t_s: f64,
    /// Resident set / working set, bytes.
    pub rss_bytes: u64,
    /// Windows only: private bytes (commit), when available.
    pub private_bytes: Option<u64>,
    /// How the value was read.
    pub source: String,
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
    #[cfg(windows)]
    {
        let pid = std::process::id();
        let cmd = format!("$p = Get-Process -Id {pid}; $p.WorkingSet64; $p.PrivateMemorySize64");
        let out = std::process::Command::new("powershell")
            .args(["-NoProfile", "-NonInteractive", "-Command", &cmd])
            .output()
            .map_err(|e| format!("powershell: {e}"))?;
        let txt = String::from_utf8_lossy(&out.stdout);
        let nums = parse_integer_lines(&txt);
        match nums.as_slice() {
            [ws, private, ..] => Ok((
                *ws,
                Some(*private),
                "windows:Get-Process WorkingSet64/PrivateMemorySize64".into(),
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

    #[cfg(target_os = "linux")]
    #[test]
    fn reads_own_memory_on_linux() {
        let (rss, private, src) = current_process_memory().unwrap();
        assert!(rss > 0);
        assert!(private.is_none());
        assert!(src.contains("VmRSS"));
    }
}
