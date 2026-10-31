//! P6.8I: port `gra/src/game/auto-improvements.ts` (wspolny picker auto-ulepszen).
//!
//! Partia 8I-P1 (ten plik + `auto_improvements/relief_preserving.rs`): predykat reliefu
//! (`preservesHillReliefKey` / `preservesHillRelief`, zamyka C5 w LEDGER).
//! `pickAutoImprovements` (8I-P2) i stale (8I-P1 AI_IMPROVEMENT_PRIORITY itd.) - NASTEPNA-PARTIA,
//! patrz `dyspozycje/rust-port/p6/P6-8I-AUTO-ULEPSZENIA.md`.

pub mod relief_preserving;
