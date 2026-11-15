# R-RUSTPORT-P4-1F-OVERLAYS-ROZP-Q1 — Operator, runda 1

```text
STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1F-OVERLAYS-ROZP-Q1
GOAL: Rozpoznanie producenta OverlaysViewDto (#215): dla nakładek terytorium, zasięgi, szlaki,
      oblężenia, cuda (oraz okolica, pola robotników, podświetlenia, zaznaczenie, trasa z §3.7)
      źródło w pinie 07d2fbd72, wejścia z modelu, odpowiednik w Rust i luki; propozycja wdrożeń.
ZMIANY/COMMIT: dyspozycje/rust-port/p4/P4-1F-OVERLAYS-ROZPOZNANIE.md (NOWY) + ten raport;
      zero zmian kodu; SHA commitu w odpowiedzi Operatora (gałąź wip/R-RUSTPORT-P4-1F-OVERLAYS-ROZP-Q1)
TESTY: brak cargo (temat tylko do odczytu, zero kodu); git diff --check EXIT 0
BLOKADY: brak; NIE_ZMIERZONO: 9 pozycji w §6 dokumentu
RUNDY: 1/5
NASTĘPNY KROK: Evaluator r1
DEPLOY/PUSH: NIE WYKONANO
```

## Baza i izolacja

- Dispatch: `git show origin/claude/rust-sivvrn:dyspozycje/autobot/runs/R-RUSTPORT-P4-1F-OVERLAYS-ROZP-Q1/00-dispatch.md`.
- Baza: `origin/rust-port/parity-v2` = `c3e3617b2aaaede5f708d2c425b0222c4af78549` w chwili startu; gałąź robocza `wip/R-RUSTPORT-P4-1F-OVERLAYS-ROZP-Q1` utworzona z tego SHA.
- Pin `07d2fbd72` czytany wyłącznie przez `git show`/`git grep`. `gra/`, `rust-port/**`, `origin/main`, `rust-port/parity-v2` — nietknięte. Commit jawnym `git add` dwóch plików z allowlisty.

## Kryteria końca

1. Tabela nakładka → pin (plik:linia) → wejścia → Rust (plik:linia) | BRAK | ROZBIEŻNE — §1 dokumentu (11 wierszy: terytorium, kultura, religia, szlaki, okolica, robotnicy, zasięg ruchu, podświetlenie budowy, zaznaczenie, trasa, oblężenia, cuda).
2. Lista pól `OverlaysViewDto` (+ `territory`, `sieges`, `wonders` z korzenia) z wejściami — §2; brakujący stan w `PlayableState` — §3.
3. Podział na wdrożenia 1F-1 … 1F-6 z allowlistami, wektorami i zależnościami — §4. Nic nie wdrożono.
4. Niepewne — §6 (`NIE_ZMIERZONO`).

## Najważniejsze ustalenia

- **Kształt DTO rozbieżny z pinem w 4 miejscach** (do tematu typów 1F-1): `pathRoute` bez `turnStops` (web rysuje numery tur, `render/units.ts:6608-6680`); `BuildHighlightKind::Generic` nie rozróżnia cudu od ulepszenia (różne krycie, `main.ts:16363-16367` vs `:16392-16395`); `cultureRange`/`religionRange` jako lista per właściciel, a web liczy jeden zbiór dla właściciela `0` (`main.ts:15632`, `:15640-15642`); `SiegeViewDto` bez właściciela obozu, który web liczy z pełnej (niefiltrowanej mgłą) listy jednostek (`main.ts:17514`, `siegeCampSync.ts:43`).
- **Kolejność**: `collect_territory_hex_keys_by_owner`, `collect_culture_range_hex_keys`, `collect_religion_range_hex_keys` (`territory.rs:469-570`) i `collect_worked_hex_owner_map` (`okolica/sasiedztwo.rs:129`) zwracają `BTree*` — zbiory równe, kolejność różna od webu (D-DTO-5 = A). `collect_worked_hex_owner_map` nie ma też epoki per właściciel (`eraForOwner`, `okolica.ts:822`).
- **Stan BRAK w `PlayableState`**: `oblegane`, rodzaje gotowych maszyn, `placedWorldWonders` (z `q,r`), `tradeRoutes`; jednostki tylko `Warrior`.
- **Reguła obozu oblężniczego JEST** (`enemy_units_adjacent_to_city`, `diplomacy_siege_war_gate.rs:140`), z powtórzeniami per jednostka jak web.
- **Ruina cudu**: liczyć `era > absolut` wprost; `!wonder_bonus_active` różni się dla `NaN`.
- **Literał `0`** w zasięgach i szlakach webu (nie `viewer`) — parytet przy hot-seat (§5 pkt 3 dokumentu).

## Uwagi

- Komenda `grep` z dispatchu w pinie trafia głównie w muzykę, scenę bitwy i dekoracje terenu; właściwe nakładki mapy mają inne nazwy (§0 dokumentu).
- Komentarze Rust w `territory.rs:492`, `:520` cytują numery linii z pinu `edb8fb56` (`range-hexes.ts:53`, `:75`), w `07d2fbd72` to `:79`, `:101` — do poprawy w 1F-2.
