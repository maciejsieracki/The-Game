STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P5-8-CITYPANEL-SCAL-K01K02-Q1
GOAL: Scalenie duplikatow K02 z K01 w `src-tauri/frontend-v2/src/ui/cityPanel/k02-*.ts` (importy zamiast lokalnych kopii, bez zmiany zachowania); dokumentacja Z10a jako punktu wejscia K09; harnessy K01A/K01B/K02 i mutacje zielone bez oslabiania.
ZMIANY/COMMIT: baza `rust-port/parity-v2` @ d123d988 (detached).
- d99a8b10 refactor: k02-units/k02-breakdown/k02-styles importuja statChip, LIST_ROW_HEIGHT_EM, 8 stalych ukladu, BUILDING_REQ_SECTION_LABELS, typy z `k01a-fundament.ts`; `el` i `applyBuildButtonVisualState` z `k01b-dom.ts`; usuniety `types.ts`.
- 3db45708 test/docs: harnessy `run-k02-{units,styles,breakdown}.mjs` bundluja katalog statyczny z pina (wzorzec run-k01a); mutacje `mutate-k02-{units,styles}.mjs` trafiaja w plik K01, gdy tam lezy wzorzec; `P5-8-SCAL.md` (nowy); wpis w `PORTING-QUEUE.md`.
- Allowlista: wszystkie zmiany w `src/ui/cityPanel/**`, `tools/dom-harness/**`, `PORTING-QUEUE.md`, `dyspozycje/rust-port/p5/P5-8-SCAL.md`, ten katalog. `gra/**`, `WERSJE.md`, rust-port: 0 zmian. Pliki K01 nietkniete.
TESTY:
- `npm run typecheck`: EXIT 0.
- `npm run check`: EXIT 0 (self-test 33/15; 156 plikow, 0 trafien; verify-pin-copies 435/0).
- `run-k02-units --pin-dir`: asercji 50, roznic 0, jsdomErrors 0.
- `mutate-k02-units`: 34/34 wykryte, przywrocenie bajtowe OK.
- `run-k02-styles`: asercji 14, roznic 0, CSS 103530 = 103530.
- `mutate-k02-styles`: 8/8, przywrocenie OK.
- `run-k02-breakdown`: asercji 12, roznic 0.
- `mutate-k02-breakdown`: 9/9, przywrocenie OK.
- `run-k01a`: ZIELONE (A,B,C,D,S,T,I,V,E,F); `mutate-k01a`: 9/9.
- `run-k01b`: ZIELONE (X,E,F,P,N,J); `mutate-k01b`: 9/10 wykryte, linia behawioralna zielona (jak w r2 K01B; pliki K01 nietkniete).
- `git diff --check`: czysto.
BLOKADY:
- Z10a: integracja musi raz wywolac `bindTechHintLinkDelegation(openPreview)` przy starcie UI (K09). Nieadresowane w tym temacie.
- Nowa zaleznosc czasu ladowania: import K02 wymaga wczesniejszego `installStaticCatalog` (jak K01). `main.ts` instaluje katalog przed panelami.
- NIE_ZMIERZONO: przegladarka i wizualna rownowaznosc; pelna macierz wejsc; dryf po pinie dla calego cityPanel.ts (P5-8 §7) w tej rundzie; dynamiczna sciezka emoji `cpInlineIcons`.
RUNDY: 1/5
NASTEPNY KROK: Evaluator r1 (zgodnosc z allowlista, weryfikacja, ze mutacje trafiaja w kod, ze DOM nie zmienil sie poza przypadkami harnessu) -> Final Control -> integracja (scalenie do `rust-port/parity-v2` i podpiecie Z10a w K09).
DEPLOY/PUSH: NIE WYKONANO
