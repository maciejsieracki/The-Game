STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-REPIN-WEB-UI-3-D-Q1
GOAL: przepiąć do `src-tauri/frontend-v2/src/ui/` zmiany weba `86d510c66 → 9b019a7d8` w `minimapHud.ts` i `hud.ts` (bez zmian w tej rundzie); obrona Evaluator r1 Z1–Z3.

ZMIANY/COMMIT: gałąź `rp-ui3d-op-r1-obrona` od `825bbf054` (Operator r1, kod `fe7c77348`), worktree `wf_4c768c78-7fe-3`.
- `63731f3af` (narzędzia): `mutate-repin-ui2c.mjs` (tryby `wycofana`/`przeniesiona`, `--dry-run`), `mutate-repin-ui3d.mjs` (+H23, H24),
  `run-repin-ui3d.mjs` (+2 wektory `SHORT_CASES`), fixtura `repin_ui3d-web-vectors.json` (nowe sha256), NOWY `tools/selftest-verify-repin-ui3d.mjs`.
- Commit dokumentacyjny (następny po `63731f3af`): `P5-REPIN-UI-2.md` §11.6.1 + ten raport.
- `src/ui/**` bez zmian (hud/minimapHud = `fe7c77348`); zero zmian w `gra/**`, `rust-port/**`, `src-tauri/src/**`, `Cargo.*`, `WERSJE.md`, `package.json`.

ZARZUTY:
- Z1 PRZYJMUJĘ. H5/H6/H11 → tryb `wycofana` (wzorzec musi być 0×, gdy kod wróci → EXIT 2). Pełny przebieg ujawnił więcej, niż wskazał
  Evaluator: H4 i H12 mają wzorzec 1×, ale na kodzie 9b0 harness ui2c ich NIE wykrywa (zmierzone: EXIT=0, różnic=0) — moja nota r1
  „pozostałe wzorce 1×” liczyła tylko wzorce, nie wykrycie. H4/H12 → `przeniesiona` (ui3d H23/H24). H24 wykryta od razu; H23
  przeżyła także ui3d → dodane wektory `zywnoscLabel: 'abc'|'NaN'` + `zywnoscWplywMiast: 1250` (nota „Dokładnie:” rozróżnia `undefined`/0) → wykryta.
- Z2 PRZYJMUJĘ. `node tools/selftest-verify-repin-ui3d.mjs --web-dir "$WEB3"`: KONTROLA EXIT=0, potem 10 naruszeń (N1 blok adaptera,
  N2 bajt minimapy, N3 rewizja markera, N4 liczba markerów, N5 edycja 0× w webie, N6 webSha256, N7 DISJ `ui2c.json`, N8 DUP, N9 DEPS(ui3d),
  N10 SHA/rozmiar) — każde wymaga EXIT 1 + komunikatu właściwej reguły: 10/10 wykrytych. Repo niemodyfikowane (kopie w `--tmp-dir`).
- Z3 PRZYJMUJĘ jako informację (bez zmian — konflikty rozwiązuje orkiestrator wg dispatchu). Zmierzone teraz: `parity-v2` = `8bc2efcf8`
  (dalej niż `199ed5798`); `git merge-tree` z `63731f3af`: te same 5 konfliktów (`P5-REPIN-UI-2.md`, `package.json`, `ui2c.json`,
  `repin-ui2-overlay.mjs`, `repin-ui3-manifest.json`); pliki z tej rundy scalają się bez konfliktu. Po merge powtórzyć `npm run check`,
  ui3d, ui2c, hud.

TESTY (kod końcowy, `npm ci`; web `git archive 9b019a7d8` ×2, WEB86U3 = nakładka 86d+UI-3+UI-3-D):
- `tsc --noEmit` EXIT=0; `npm run check` EXIT=0 (ui3d 2/2, niezgodnych 0); `git diff --check` czysty.
- `run-repin-ui3d`: 10×2 scen, 282 kroki, 18 PNG, PIX różnych 0, pokrycie 40/40, błędów strony 0, różnic 0; fixtura sha256 `554c2aa1…`
  identyczna z dwóch osobnych archiwów; 18 PNG bajtowo = `runs/…/png` (bez zmian).
- `mutate-repin-ui2c` 1–45 na WEB86U3: aktywnych 40/40 wykrytych, wycofanych 3, przeniesionych 2; `--dry-run` EXIT=0.
- `mutate-repin-ui3d`: H23/H24 2/2; po zmianie wektorów powtórzone `vec` hud #14–20, #26–30: 12/12. Pozostałe 20 (mini/hud, M2/M3) nie
  powtórzone — wektory tylko dodane, wykrycie monotoniczne; z r1 32/32.
- `selftest-verify-repin-ui3d`: 10/10.
- INFRA: od ~14:15 Chromium bywał zamykany w trakcie przebiegu (także harness bez mutacji: 1 z 2 EXIT=2 „Target … closed”; równoległe
  testy innych agentów). EXIT=2 mutator liczy jako PRZEŻYŁA (zachowawczo); takie przypadki powtórzone pojedynczo do EXIT 0/1 — każdy dał EXIT=1.
- NIE_ZMIERZONO w tej rundzie: L0/L1A/L2/C4/hud/cityux/UI-2-A…G/UI-3-A (bez zmian w `src/`, zmiany tylko w narzędziach ui2c/ui3d); GPU/Tauri.
- Sprzątanie: `node_modules` i `scratchpad/ui3d-obr` usunięte jawnymi ścieżkami.

BLOKADY: brak.
RUNDY: 1/5 (obrona r1)
NASTĘPNY KROK: Evaluator r2 / Final Control R-RUSTPORT-REPIN-WEB-UI-3-D-Q1; integracja na `parity-v2` `8bc2efcf8` (5 konfliktów).
DEPLOY/PUSH: NIE WYKONANO
