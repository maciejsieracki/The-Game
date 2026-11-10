# Notatki czytelnika: evidence/ — katalog P1 (audyt webowy archiwalny)

Temat: R-RUSTPORT-P0-ARCHIWUM-OPENCLAW-AUDYT-Q1, runda 1/5. Zwrócone inline przez subagenta (zasada
subagenta zabraniała mu zapisu własnego pliku raportu) — zapisane przez orkiestratora z treści
odpowiedzi.

## Pokrycie P1.1–P1.18 w archiwum (katalog `evidence/TG-A-P1-*.md`, `TG-B-P1-*.md`)

- **P1.1** (katalog plików): częściowo, `TG-B-P1-14-GAMEPLAY-CATALOG-20260922-001.md` — manifest SHA
  §6 urwany, blok kodu pusty. NIEZWERYFIKOWANE.
- **P1.2** (toolchain): częściowo, `TG-B-P1-2-RUNTIME-TOOLCHAIN-20260922-001.md` (PARTIAL: brak wersji
  Node, brak zatwierdzonego zamiennika `npm run dev`). Operator P1.2 nigdy nie wystartował
  (`TG-B-P1-02-*` INFRA, retry zablokowany).
- **P1.3–P1.7, P1.10–P1.11**: PASS w przeglądarce. Aktualne dla main — pliki kreatora nie zmieniły
  hashy od `54fc0af8`.
- **P1.8** (world generation): Standardowy nie kończy generacji w 170s, Malenki 13-20s. Generator
  niezmieniony (`gra/src/map/generator.ts` hash identyczny na `54fc0af8` i main) — stall jest na main,
  nieprzeliczony runtime.
- **P1.9**: PASS z zastrzeżeniem (dwa zrzuty to ten sam modal dyplomacji).
- **P1.12, P1.13**: PASS na `54fc0af8`, ale część danych już nieaktualna (patrz niżej).
- **P1.14, P1.16**: PARTIAL (stdout testów utracony dla P1.16).
- **P1.15**: indeks 79 zrzutów, istnienie PNG nie sprawdzone.
- **P1.17 (klasyfikacja REUSE/ADAPT/REPLACE modułów Rust): NIEPOKRYTY.** Archiwalny
  `TG-B-P1-17-ARCHIVE-COMPARISON...md` klasyfikuje `archiwum/`/`docs/archiwum*`, NIE moduły
  `rust-port/engine`. **Trzeba zrobić od zera w naszym P1.17.**
- **P1.18** (behavior-rust matrix, hot-seat): PARTIAL, 45 wierszy, opisuje gałąź `78d494c7`, nie main.

## Piny webowe — sprawdzone względem ancestry main (shallow clone, widoczne do `47981902`, 66 commitów)

Wszystkie archiwalne piny są przodkami obecnego main (edb8fb56), więc **ZMERGOWANE** (main je zawiera):
- `54fc0af8` (pin B): main o 43 commity dalej.
- `93f5ed43` (pin A-P1): main o 9 commitów dalej.
- `69ccb145` (zatwierdzony pin OpenClaw): main o 7 commitów dalej (NIE 52/59 jak wcześniej liczone —
  liczba commitów do odtworzenia osobno, niepotwierdzona w tej rundzie).
- `a8c9cf6c` (pin B-18-P2): main o 37 commitów dalej.

Gałęzie Rust `78d494c7`, `a317fb7a`, `5dc5fddc`: **NIEZMERGOWANE względem main** — ich wierzchołki NIE
są osiągalne z main (inna linia historii, nie prosta kontynuacja).

## Nieaktualność danych archiwalnego audytu (bez zmian hash 54fc0af8→main)

Bez zmian: `newGameFlow.ts`, `newGameMapDefaults.ts`, `gen-helpers.ts`, `aiCivPicker.ts`,
`civ-entry-epoch.ts`, `buildings.json`, `terrain-yields.json`, `cityPanel.ts`, `hoverDetailDock.ts`,
`gra/package.json`.

Zmienione (archiwalne numery linii/wartości NIEAKTUALNE): `gra/src/main.ts` (f8c47d51→65a13794),
`gra/data/civ-matrix.json` (paramDefs 113→93), `gra/data/civs.json`, `units.json` (hashe nieaktualne,
same liczby bez zmian: 8/6/1 epoka wejścia, 75 jednostek).

## Weryfikacja wybranych twierdzeń archiwum (anty-samooszukiwanie)

- Watchdog end-turn: `gra/src/main.ts:31024` — **ZMERGOWANE**, kod istnieje. Teza o przedwczesnym
  zwolnieniu to hipoteza archiwum (analiza statyczna), do oceny syntezy.
- Blank po Back: wzmacnia ustalenie B-16, ale build źródłowy A jest spoza repo (nieweryfikowalny).
- Odniesienia do linii w TG-A-P1-03…09: **NIEWERYFIKOWALNE w repo** — build A nie odpowiada żadnemu
  blobowi git (rozmiary plików różnią się 2-20x od repo).
- Orphan modules (combat.rs, unit_epoch.rs nie zadeklarowane w mod.rs): **ZMERGOWANE** (stan main,
  potwierdzone, problem istnieje też w 78d494c7).
- Hot-seat `advanceSeat`: `gra/src/main.ts:36047` — **ZMERGOWANE** (web). Seat 2 bez startowych
  jednostek w Rust (`playable.rs` 431-468): **NIEZMERGOWANE**.

## Adaptowalność dla naszego P1 (odpowiedź na pytanie z dispatchu)

Częściowo, NIE od zera: P1.3–P1.7, P1.10, P1.11, P1.13 nadają się bez ponownego zbierania, ale
wymagają przeliczenia hashy i numerów linii. NIE nadaje się jako dowód: P1.8 (tylko zrzuty), P1.16
(stdout utracony), end-turn diagnoza (nierozstrzygnięta). **P1.17 i P1.18 trzeba zrobić praktycznie od
zera** na obecnym pinie main, nie tylko zaktualizować.

## Pokrycie
Przeczytane w całości: 19× TG-A-P1-*.md, 18× TG-B-P1-*.md. Nieprzeczytane: `.run.json`, `.mjs`, `.png`,
`.sha256` (hashy zrzutów nie weryfikowano). Shallow clone — ancestry tylko w widocznym zakresie.

DEPLOY/PUSH: NIE WYKONANO
