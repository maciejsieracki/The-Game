# Fixtures of `civ-view-model`

## `pin_literals.json`

Generated, never edited by hand. Source: the web at the pin `07d2fbd72`, read with
`git show 07d2fbd72:gra/src/<file>` by

```text
dyspozycje/autobot/runs/R-RUSTPORT-P4-1A-VIEW-TYPES-Q1/02a-obrona/gen_pin_literals.py
```

Contents:

- `pin`, `pinCommit`: the pin and its full commit id;
- `sources`: SHA-256 of every pin source file read (16 files under `gra/src/`);
- `items`: 24 extracted declarations (`file`, `lines` = 1-based span in the pin file,
  `kind` = `enum` / `union` / `interface`, then `values` or `keys`): string enums and
  unions mirrored by the DTO enums, the numeric enums behind the validator ranges
  (`Dir`, `BTerrain`, `CityMapDefenseTier`) and the interface keys mirrored by the DTO
  structs (`StackVitals`, `StackDisplayInfo`, `CityMapBadgeInput`, `TileYield`,
  `HexCoords`, `RuntimeUnit`).

SHA-256 of the fixture file:
`5baee2880c3f915ef57d67f5b7f33bf8bee0859f335932c84c4fe348c042dc15`
(the same value is the constant `PIN_LITERALS_SHA256` in `tests/pin_vectors.rs`, which
checks it on every `cargo test`).

Commands (from anywhere inside the repository):

```text
python3 -I dyspozycje/autobot/runs/R-RUSTPORT-P4-1A-VIEW-TYPES-Q1/02a-obrona/gen_pin_literals.py --check
python3 -I dyspozycje/autobot/runs/R-RUSTPORT-P4-1A-VIEW-TYPES-Q1/02a-obrona/gen_pin_literals.py --pin <new pin>
```

`--check` regenerates in memory and exits 1 when the fixture bytes, a source SHA-256 or
the constant in `tests/pin_vectors.rs` differ. A pin move: regenerate with `--pin`, put the
printed SHA-256 into `PIN_LITERALS_SHA256` and here, and fix every enum that
`tests/pin_vectors.rs` then reports.
