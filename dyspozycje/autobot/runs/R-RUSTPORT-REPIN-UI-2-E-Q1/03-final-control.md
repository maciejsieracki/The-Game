STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-REPIN-UI-2-E-Q1
GOAL: REPIN UI-2-E (#18–#22, dyplomacja) frontend-v2 na web `86d510c66` wg `P5-REPIN-UI-2.md` §1/§1a/§4.

ZMIANY/COMMIT: Final Control bez zmian kodu; tylko ten raport. Sprawdzony stan: kod `a025ee6dab70b656aeff73792812472b6a663732`, raport Obrony `af19e7dbba289bfd7a303b6c9f9cd7684fd70b6c` (baza `2198eaf7e`, przodek potwierdzony). Diff `2198eaf7e..af19e7dbb`: 18 plików, wszystkie w allowliście; zero zmian w `gra/**`, `rust-port/**`, `src-tauri/src/**`, `Cargo.*`, `WERSJE.md`.

ORZECZENIE ZARZUTÓW:
- Z1 (fałszywe WYKRYTA przy crashu / timeout jako PRZEŻYŁA) — ODDAL (naprawione w `a025ee6da`). Zweryfikowane: oba harnessy z nieistniejącym `--tmp-dir` → EXIT 2; `mutate-repin-ui2e.mjs:152-169` klasyfikuje WYKRYTA tylko przy EXIT 1 + dowodzie różnicy, osobne TIMEOUT/BŁĄD, EXIT 2 przy którymkolwiek; kontrola bez mutacji przed serią uruchomiona i zielona (`[chromium różnic=0] [jsdom różnic=0]`).
- Z2 (brak audiencji w Chromium) — ODDAL (naprawione). Sceny `audiencja`, `audiencja-wojna` × 1280×720 i 360×640: DOM równy, PNG równy; AU1/AU2 WYKRYTA w Chromium (różnic=5, 6) — uruchomione samodzielnie.
- Z3 (martwy alias `CivBonusLite`) — ODDAL (naprawione). Import usunięty; numstat `diplomacyAudience.ts` +4/−17 = web.
- Z4 (edycja istniejącej linii w nakładce) — ODDAL (naprawione). `repin-ui2-overlay.mjs` +16/−0 względem bazy, stara linia końcowa nietknięta.

TESTY (samodzielnie, na PRÓBNYM scaleniu `af19e7dbb` do `origin/rust-port/parity-v2` `881765593`, konflikty wspólnych plików rozwiązane sumą; próba odrzucona, nic nie zapisane):
- `tsc --noEmit`: EXIT 0.
- `npm run check`: EXIT 0 (226 plików/0 trafień; verify-pin-copies 431/0; verify-repin-ui2-copies niezgodnych=0, overlayPorts*=3, portDomRefs=2).
- `run-repin-ui2e` (Chromium 141, web z `git archive 86d510c66`): 183 wektory, 30 scen, błędów_strony=0, różnic=0, EXIT 0; `webFixtureSha256=fb54360d…9381`; `--out` sha256 `5d2c839b…be05` = fixtura w repo.
- `run-repin-ui2e-cycles`: 9335 przypadków, różnic=0, jsdomErrors=0, consoleErrors=0, EXIT 0.
- Mutacje 17–18 (AU1/AU2) z kontrolą: 2/2 WYKRYTA, EXIT 0. Pozostałe 65: nie powtarzane (wynik Obrony 67/67).
- `repin-ui2-overlay` na scaleniu: PD=4, niezgodnych=0, EXIT 0 (klucz `overlayPd` nie koliduje z pętlą `overlayPorts*` D).
- Starsze harnessy (L0, L1A, L2, C4, hud, newgame, cityux, ui2a, run-cycles): NIE_ZMIERZONO w FC (wynik r1 Operatora; r2 zmienia tylko linię logu nakładki i `import type`).
- GPU / natywne okno Tauri: NIE_ZMIERZONO.

INTEGRACJA: scalić `af19e7dbb` (z tym raportem: SHA commitu FC) na `origin/rust-port/parity-v2` PO już zintegrowanych UI-2-B/C/D/F/G (`881765593`). Oczekiwane konflikty wyłącznie „oba dopisały na końcu” w: `package.json` (dodać przecinek, oba zestawy skryptów), `tools/repin-ui2-manifest.json` (`overlayPortsUI2D`/`portDomRefs` + `overlayPdNote`/`overlayPd`), `tools/repin-ui2-overlay.mjs` (blok PD E przed końcową linią HEAD; zostawić linię końcową HEAD z `entries.length`/`portów`, usunąć starą linię E z `manifest.files.length`), `P5-REPIN-UI-2.md` (wiersze #18–22 + sekcja E po sekcjach B…G). `types.ts` scala się automatycznie; tsc po scaleniu EXIT 0.

BLOKADY: brak blokujących. Uwagi: N1 (26/31 starych różnic `run-cycles` nieinspekcjonowane — odniesieniem jest `run-repin-ui2e-cycles`, 0 różnic); pola DTO (`cityPn`, `miastoAkcjeDozwolone` …) wypełnia Rust w P6, do tego czasu oddanie miasta ukryte (fail-safe).
RUNDY: 2/5 (FC po Obronie r2).
NASTĘPNY KROK: integracja orkiestratora na `rust-port/parity-v2` → READY_FOR_DEPLOY (orkiestrator).
DEPLOY/PUSH: NIE WYKONANO
