# 03 — Final Control, R-RUSTPORT-P4-1C-FOG-ROZP-Q1 (runda 1)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (rozpoznanie, tylko dokumentacja)
TEMAT: R-RUSTPORT-P4-1C-FOG-ROZP-Q1
GOAL: rozpoznanie producenta `FogViewDto` (#212): tabela pin → Rust, pola DTO, podział na wdrożenia, NIE_ZMIERZONO.
ZMIANY/COMMIT: oceniany `da0f8d0c1aae61f3cb31b95fb81a87663e01a3a4` (Obrona r1, rodzic `4c86f5d80` Operator r1, rodzic bazy `83f5fd6548c1d2e3d84795ea15fa9bb1ff044e01`). FC dopisuje tylko ten plik (commit na lokalnej gałęzi `fc/R-RUSTPORT-P4-1C-FOG-ROZP-Q1`).
TESTY: patrz §Bramki.
BLOKADY: brak dla tematu. Dla wdrożeń: pytanie ABC fotela ≠ 0 (§1.5 dokumentu) — zadaje orkiestrator przed W2/W3.
RUNDY: 1/5
NASTĘPNY KROK: integracja dokumentacji przez orkiestratora; pytanie ABC §1.5 do właściciela (zasada 10).
DEPLOY/PUSH: NIE WYKONANO

## Ancestry i allowlista (sprawdzone samodzielnie)

- Baza z dispatchu: `origin/rust-port/parity-v2` przy starcie = `83f5fd654…` (parity przesunęło się od tego czasu na `c3e3617b2`; dokument jest bazowo niezależny — zmienia tylko dokumentację).
- `git merge-base --is-ancestor 83f5fd654 da0f8d0c1` → 0 (przodek). Łańcuch: `83f5fd654 → 4c86f5d80 → da0f8d0c1`.
- `git diff --stat 83f5fd654 da0f8d0c1`: 3 pliki, wszystkie z allowlisty:
  `dyspozycje/rust-port/p4/P4-1C-FOG-ROZPOZNANIE.md` (nowy), `dyspozycje/autobot/runs/R-RUSTPORT-P4-1C-FOG-ROZP-Q1/{01-operator-r1.md,02a-obrona.md}`.
- Drzewa `rust-port` i `gra` identyczne z bazą (`31d1f116b…`, `5602dbbad…`); brak `Cargo.lock`.
- `git diff --check 83f5fd654 da0f8d0c1` → czysto.

## Bramki

Kod Rust bez zmian (drzewo `rust-port` bit w bit = baza), więc bramki cargo z 02-evaluator na `4c86f5d80`
(fmt, clippy -D warnings engine/view-model, `cargo test --lib` engine 118 passed, view-model 0) pozostają
ważne dla `da0f8d0c1`; ponowne uruchomienie cargo nie zmieniłoby wyniku. Dispatch nie definiuje własnego testu.

## Orzeczenia zarzutów Evaluatora (weryfikacja w pinie `07d2fbd72`)

1. [KRYTYCZNY] fotel ≠ 0, `E_r`/niezmiennik — **ODDAL (naprawione przez Obronę)**. Zweryfikowane: `main.ts:12799` `const explored`, `:13759` alias `exploredByHuman=[[HUMAN_OWNER_PRIMARY, explored]]`, `:12864-12866` render czyta `explored`, `:13483` zapis do `exploredByHuman.get(ME())`, `:10895`/`:13902` osobne Sety, `:12833-12835` `hotSeatEnabled` martwy kod, `:13893-13897`+`:29965` przełączenie tylko z haka testowego. Dokument: §0 p.5, nowy §1.5 (ROZBIEŻNE + szkic ABC z rekomendacją), §2 (reguła wierna tylko dla `viewer = 0`), W3 (h) wstrzymany. Zgodne z zasadami 9/11.
2. [KRYTYCZNY] migracja v2 — **ODDAL (naprawione)**. `save.ts:109-116`, `:380-387`, `:695-706` (`if (ver < 3) throw IncompatibleSaveFormatError`) potwierdzone; W1 wymaga odrzucenia v2, §1.3 ma wiersz.
3. [ISTOTNY] `updateDiplomaticDiscovery` — **ODDAL (naprawione)**. `main.ts:13479` (wywołanie), `:22528-22533` (def., pomija `eliminatedOwners`) potwierdzone; dopisane w §0 p.4, §1.1, §1.3, W2.
4. [ŚREDNI] zapisy ścieżki/traktatu do fotela 0 — **ODDAL (naprawione)**. `:13461`, `:31636`, `:43637`, `:44137` `addExplored(explored, …)`; `:24573-24584` 5 rodzajów z `PaktNieagresji`, `proposerId === 0 || responderId === 0` na sztywno — potwierdzone.
5. [DROBNY] literały `applyFogVisibility` — **ODDAL (naprawione)**. `(vis, true, ME())` i `(ALL_KEYS, false, ME())` zgodne z `:13503-13504`, `:13512-13513`.
6. [DROBNY] `:24903`, `:29718` — **ODDAL (naprawione)**. Oba wiersze w §1.3 jako „Nie dotyczy (hak testowy)”.

NAPRAW: 0. DO DECYZJI CZŁOWIEKA: 0 jako zarzut FC; pytanie ABC §1.5 (fotel ≠ 0) jest wynikiem merytorycznym rozpoznania, nie wadą dokumentu — orkiestrator zadaje je przed W2/W3.

## Uwagi (nie blokują)

- N1: drobne przesunięcia linii Rust (np. `merged_river_visible_in_fog` jest w `river_lod.rs:316`, dokument podaje `:315`; `FogViewDto` `struct` w `map.rs:210`, dokument `:207-213` z komentarzem). Bez wpływu na wnioski.
- N2: `02-evaluator.md` leży na gałęzi `eval/…` (`605ff986d`), nie w łańcuchu `da0f8d0c1`; przy integracji dołączyć raport Evaluatora osobno.
- N3: kryteria końca dispatchu 1–4 spełnione (tabele §1, pola §2, W1–W4 §3, NIE_ZMIERZONO §4).

SHA końcowy (commit FC): patrz wynik StructuredOutput; rodzic = `da0f8d0c1`, przodek bazy `83f5fd654`.
