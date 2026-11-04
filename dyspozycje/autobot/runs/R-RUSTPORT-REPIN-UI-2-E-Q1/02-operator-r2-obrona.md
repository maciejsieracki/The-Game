STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-REPIN-UI-2-E-Q1
GOAL: Repin partii UI-2-E (#18–#22, dyplomacja) frontend-v2 na web `origin/main` `86d510c66` wg `P5-REPIN-UI-2.md` §1/§1a/§4.

ZMIANY/COMMIT: odtworzone z `631413933` (kod r1 `9f552195e`), baza `2198eaf7e`; kod r2 `a025ee6dab70b656aeff73792812472b6a663732`.
Allowlista: 17 plików względem bazy, 0 w `gra/`, `rust-port/`, `src-tauri/src`, `Cargo`, `WERSJE.md`. Worktree sparse
(dysk `/` był pełny — 156 KB wolne), kopie weba/pinu i tmp w `/dev/shm/ui2e-*` (jawne ścieżki).

ZARZUTY:
- Z1 PRZYJMUJĘ. `run-repin-ui2e.mjs`, `run-repin-ui2e-cycles.mjs`: `uncaughtException`/`unhandledRejection` → EXIT 2,
  `mkdtemp` w `try`. `mutate-repin-ui2e.mjs`: WYKRYTA tylko przy EXIT 1 + dowód różnicy na stdout (`różnic=N≥1`/`STOP_ON_DIFF`);
  EXIT 2 / EXIT 1 bez dowodu / inny kod = BŁĄD; limit czasu = TIMEOUT; EXIT 2 przy BŁĄD/TIMEOUT; kontrola bez mutacji
  (Chromium + jsdom modułów zakresu = EXIT 0, `różnic=0`) przed serią, znacznik kontroli kluczowany sha256 treści wejść.
  Dowody: reprodukcja Evaluatora (`--tmp-dir` nieistniejący) → oba harnessy EXIT 2, mutator „KONTROLA NIEZALICZONA”,
  EXIT 2, 0 mutacji; `--timeout-jsdom-ms 3000` na TB47 → `TIMEOUT … signal=SIGTERM`, EXIT 2.
- Z2 PRZYJMUJĘ. `diplomacyAudience` w `UI_MODS`; sceny `audiencja`, `audiencja-wojna` × 1280×720, 360×640; stan → DTO
  „Rust” `audienceState`; `getCivBonusy` z niepustą listą; web DOM bez `.da-bonus`. Osobny przebieg po scenach r1 —
  26 scen r1 bajtowo równe fixturze r1. AU1/AU2 wykryte w Chromium (różnic=5/6).
- Z3 PRZYJMUJĘ. Usunięty alias `CivBonusLiteDto as CivBonusLite`; numstat portu +4/−17 = web; diff web↔port 197 → 195.
- Z4 PRZYJMUJĘ. `repin-ui2-overlay.mjs` względem bazy +16/−0 (stara linia logu nietknięta, PD w nowej linii).

TESTY (Chromium 141, node_modules = symlink do głównego checkoutu):
- `tsc --noEmit` EXIT 0; `npm run check` EXIT 0 (225/0, 433/0, 4/0); `git diff --check` czysto.
- `run-repin-ui2e`: 5 modułów, 183 wektory, 30 scen, 0 błędów strony, 0 różnic, EXIT 0;
  `webFixtureSha256=fb54360d…9381`, `webPngSha256=01e76bc7…872c`, plik fixtury sha256 `5d2c839b…be05` — identyczne
  z 2 osobnych `git archive 86d510c66`.
- `run-repin-ui2e-cycles`: 9335 przypadków, 0 różnic, jsdom/console 0, EXIT 0.
- Mutacje (wejścia sha256 `06266578e3b8b791…`): 67/67 WYKRYTA; 2 × BŁĄD infra (`page.goto` przy load ≈ 10) i 1 × TIMEOUT
  (TB37) ponowione pojedynczo → WYKRYTA (nowa klasyfikacja ujawniła je zamiast liczyć jako wynik).
- `repin-ui2-overlay`: EXIT 0, 4 pliki PD = web bajtowo.
- Starsze harnessy (L0, L1A, L2, C4, hud, newgame, cityux, ui2a, run-cycles) w r2: NIE_ZMIERZONO — r2 nie zmienia nakładki
  (tylko log) ani modułów poza `diplomacyAudience.ts` (1 linia `import type`, kasowana przy kompilacji); wyniki r1 bez zmian.

BLOKADY:
- N1 z r1 (26/31 różnic `run-cycles` dla koszyka niezbadane) — bez zmian; odniesieniem `run-repin-ui2e-cycles` (0 różnic).
- Obsługa SIGTERM mutatora działa dopiero po zakończeniu `spawnSync` (plik przywracany w `finally`) — sprawdzone: po
  przerwaniu `git status` bez mutacji.
- GPU / natywne okno Tauri: NIE_ZMIERZONO. Producent Rust nowych pól DTO = P6.

RUNDY: 2/5
NASTĘPNY KROK: Evaluator — weryfikacja `a025ee6da`.
DEPLOY/PUSH: NIE WYKONANO
