//! `assets` — registry of shared GPU resources (buffers, textures,
//! pipelines) with a single owner, content keys, generational handles and
//! reference counts; per-category budgets and CPU-side counters for the
//! "N turns does not grow memory" regression test (P4.3 §7.3).
//!
//! Topic: **RR-T6**. The registry bookkeeping is CPU-only by design so it can
//! be tested without a GPU. Empty until RR-T6 lands.
