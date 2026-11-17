//! P6 SIEGE-TAKTYKA K5DOC-T1 MODEL-UI (dispatch R-RUSTPORT-P6-K5DOC-T1-MODEL-UI): model konfiguracji doktryny grupy po
//! stronie domeny, BEZ UI. Port trzech elementow pina `07d2fbd72` (`gra/src/battle/battleScene.ts`):
//!
//! - typ `GroupDoctrine` (`:1938`) -- reuzywany z [`siege_tactics_doctrine_state`], bez drugiej kopii enumu;
//! - `_ensureGroupMeta(gid)` (`:17586-17593`) -- tworzy brakujaca mete z domyslna doktryna `steady` (`:17589`)
//!   i `autoPlay: true`; istniejaca meta NIE jest nadpisywana;
//! - `_setGroupDoctrine(gid, doctrine)` (`:17864-17929`) -- zapis doktryny i `autoPlay` (`manual` -> `false`,
//!   pozostale -> `true`, `:17866-17878`).
//!
//! Poza zakresem (ukryte w pinie za `_setGroupDoctrine`): formacja, cele marszu (`rallyCol/rallyRow`), flagi
//! strzelca i kolejka rozkazow. Wykonanie kroku doktryny (`_executeGroupDoctrineStep`) to temat K5DOC-T8 (#264).
//!
//! Wektory: `tests/p6_k5doc_t1_vectors/vectors.json`, generowane przez `tests/p6_k5doc_t1_gen.mjs`, ktory WYKONUJE tekst pina.

use std::collections::HashMap;

pub use crate::domain::siege_tactics_doctrine_state::GroupDoctrine;

/// Domyślna doktryna nowo tworzonej grupy. Pin `battleScene.ts:17589` (`m = { doctrine: 'steady', autoPlay: true }`).
pub const DEFAULT_GROUP_DOCTRINE: GroupDoctrine = GroupDoctrine::Steady;

/// Napis doktryny z pina (`battleScene.ts:1938`); odwrotność [`GroupDoctrine::parse`].
pub fn doctrine_str(d: GroupDoctrine) -> &'static str {
    match d {
        GroupDoctrine::Defensive => "defensive",
        GroupDoctrine::Steady => "steady",
        GroupDoctrine::Aggressive => "aggressive",
        GroupDoctrine::Skirmish => "skirmish",
        GroupDoctrine::Manual => "manual",
    }
}

/// Meta grupy zawężona do pól doktryny (pin `GroupMeta.doctrine` i `GroupMeta.autoPlay`, `battleScene.ts:2058`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct GroupDoctrineMeta {
    pub doctrine: GroupDoctrine,
    pub auto_play: bool,
}

impl Default for GroupDoctrineMeta {
    /// `_ensureGroupMeta` (`battleScene.ts:17589`): `{ doctrine: 'steady', autoPlay: true }`.
    fn default() -> Self {
        Self {
            doctrine: DEFAULT_GROUP_DOCTRINE,
            auto_play: true,
        }
    }
}

/// Nieznana wartość doktryny (napis spoza pięciu wariantów pina `battleScene.ts:1938`).
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct UnknownDoctrine(pub String);

/// Tablica met grupy (pin `this._groupMeta: Map<string, GroupMeta>`, `battleScene.ts:2321`).
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct GroupDoctrineTable {
    metas: HashMap<String, GroupDoctrineMeta>,
}

impl GroupDoctrineTable {
    pub fn new() -> Self {
        Self::default()
    }

    /// Odczyt bez tworzenia mety (pin `this._groupMeta.get(gid)`).
    pub fn get(&self, gid: &str) -> Option<&GroupDoctrineMeta> {
        self.metas.get(gid)
    }

    /// `_ensureGroupMeta(gid)` (pin `battleScene.ts:17586-17593`): przy pierwszym dostępie tworzy mete z
    /// [`GroupDoctrineMeta::default`]; przy kolejnym zwraca istniejącą bez nadpisywania (idempotentnie).
    pub fn ensure_group_meta(&mut self, gid: &str) -> &mut GroupDoctrineMeta {
        self.metas.entry(gid.to_string()).or_default()
    }

    /// `_setGroupDoctrine(gid, doctrine)` (pin `battleScene.ts:17864-17929`), część modelu: walidacja napisu
    /// (pin dostaje już typ `GroupDoctrine`; po stronie Rust napis wejściowy musi być jednym z pięciu wariantów),
    /// zapis `doctrine` oraz `autoPlay = doctrine != manual` (pin `:17866-17878`).
    ///
    /// Przy błędzie walidacji tablica pozostaje bez zmian (nie powstaje meta dla `gid`).
    pub fn set_group_doctrine(&mut self, gid: &str, value: &str) -> Result<(), UnknownDoctrine> {
        let doctrine =
            GroupDoctrine::parse(value).ok_or_else(|| UnknownDoctrine(value.to_string()))?;
        let meta = self.ensure_group_meta(gid);
        meta.doctrine = doctrine;
        meta.auto_play = doctrine != GroupDoctrine::Manual;
        Ok(())
    }

    /// Liczba grup z metą.
    pub fn len(&self) -> usize {
        self.metas.len()
    }

    pub fn is_empty(&self) -> bool {
        self.metas.is_empty()
    }
}
