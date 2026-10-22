//! Spike log: every line goes to stderr AND to the log file (when opened),
//! prefixed with Rust ms since the spike start (the same clock as `t_rust` in
//! the IPC measurements).

use std::fs::File;
use std::io::Write as _;
use std::path::Path;
use std::sync::{Mutex, OnceLock};
use std::time::Instant;

static START: OnceLock<Instant> = OnceLock::new();
static FILE: Mutex<Option<File>> = Mutex::new(None);

/// Ms since the first call of any function of this module (monotonic).
pub fn now_ms() -> f64 {
    START.get_or_init(Instant::now).elapsed().as_secs_f64() * 1000.0
}

/// Open (create/truncate) the log file. Lines logged before stay on stderr only.
pub fn open(path: &Path) -> std::io::Result<()> {
    let f = File::create(path)?;
    *FILE.lock().unwrap_or_else(|p| p.into_inner()) = Some(f);
    Ok(())
}

/// Format one log line (pure; used by [`line`] and tests).
pub fn format_line(t_ms: f64, msg: &str) -> String {
    format!("[{t_ms:>10.3} ms] {msg}")
}

/// Log one line.
pub fn line(msg: impl AsRef<str>) {
    let l = format_line(now_ms(), msg.as_ref());
    let _ = writeln!(std::io::stderr(), "{l}");
    if let Some(f) = FILE.lock().unwrap_or_else(|p| p.into_inner()).as_mut() {
        let _ = writeln!(f, "{l}");
        let _ = f.flush();
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn clock_is_monotonic() {
        let a = now_ms();
        let b = now_ms();
        assert!(b >= a);
    }

    #[test]
    fn format_is_stable() {
        assert_eq!(format_line(1.5, "x"), "[     1.500 ms] x");
    }

    #[test]
    fn line_without_file_does_not_panic() {
        line("test line (stderr only)");
    }
}
