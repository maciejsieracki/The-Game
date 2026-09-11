//! Foundational domain API for the staged Rust engine.

pub mod domain;

pub use domain::{EngineError, GameState, Player, PlayerId, Turn};
