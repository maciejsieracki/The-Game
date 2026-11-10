# P1.4 — Ekran wyboru epoki (żywy Chromium)

**Temat:** R-RUSTPORT-P1-4-EPOCH-SELECTION-Q1
**Pin:** `main` = `edb8fb56` (świeży checkout w scratchpadzie sesji, `gra/` z `npm ci`)
**Metoda:** wzorzec zwalidowany w P1.3 — dev server wyłącznie przez `node ./node_modules/vite/bin/vite.js --port 5180 --strictPort` (bez `predev`/`export-data`), Playwright na `/opt/pw-browsers/chromium`, viewport 1600×900.
**Zrzut:** `dyspozycje/rust-port/p1/screenshots/P1-4-epoch-selection.png` — 1600×900 px, 1 127 718 B, realny ekran (nie pusty ani czarny).

## Ścieżka do ekranu

1. Menu główne: przycisk „▶ Rozpocznij grę" (`src/ui/mainMenu.ts:424`, `id=menu-play`; w DOM klikany tekstowo, bo id nie trafia do elementu w overlayu `.civ-menu`) → `onNewGame`.
2. Krok 1 Intro: CTA „Rozpocznij konfigurację →" (`src/ui/newGameFlow.ts` ~l. 2243, `curStep = 2`).
3. Krok 2 „Epoka Startowa" — `renderEpochStep` (`newGameFlow.ts` ~l. 1534). Pasek kroków: `STEP_LABELS` (`newGameFlow.ts:1138`) = Intro / Epoka / Cywilizacja / Ustawienia / Start; na zrzucie „KROK 2 Z 5".

## Epoki na ekranie (zgodne z kodem)

Lista jest zakodowana w stałej `EPOCHS` (`src/ui/newGameFlow.ts:637–639`), **nie** w pliku JSON. Plik `gra/data/epochs.json` **nie istnieje** (w `gra/data/` jest 30 plików; epoki nie mają osobnego pliku). Liczby cywilizacji pochodzą z `gra/data/civs.json` (klucz `cywilizacje`, pole `epokaWejscia`) przez `civsForEpoch` → `civAvailableAtEpoch` (`newGameFlow.ts:580–586`): cywilizacja jest dostępna, gdy `startEpochIndex(wybrana) >= min(epokiStartowe)`, czyli kumulacyjnie.

| # | Nazwa (UI) | Badge (zrzut) | Odblokowana | Opis (flavor) | Info pod kafelkami |
|---|---|---|---|---|---|
| 1 | EPOKA KAMIENIA | 8 cyw. | tak (`epochHasCivs` = true) | Pierwsze osady, kamienne narzędzia. Fundamenty imperium. | „Brak wcześniejszych epok — badasz technologie Kamienia od zera." |
| 2 | EPOKA BRAZU | 14 cyw. | tak (`epochHasCivs` = true) | Metalurgia i pierwsze armie. Rydwany, mury, wczesna dyplomacja. | „Masz już wszystkie technologie epoki Kamienia…" |
| 3 | EPOKA ZELAZA | 15 cyw. | tak (`epochHasCivs` = true) | Hartowane ostrza, potężne legiony, szlaki handlowe. Start: cały Kamień + cały Brąz już zbadane. | „Masz już wszystkie technologie Kamienia i Brązu…" |

Liczby zweryfikowane niezależnie z `civs.json`: `kamien` 8, `braz` 6 (kumulacyjnie 14), `zelazo` 1 (kumulacyjnie 15) — zgodne z badge'ami. **Mechanizm blokady (poprawiony, zarzut Evaluatora 1):** o stanie „zablokowana" decyduje wyłącznie `epochHasCivs(e.id)` (`newGameFlow.ts:~587–589`, = `civsForEpoch(id).length > 0`). Gdy `false`, kafelek dostaje klasę `ec lock` i badge „Brak cywilizacji", a klik nie jest podpięty (`renderEpochStep`, `newGameFlow.ts:~1533–1540`). Pole `avail` z `EPOCHS` (`newGameFlow.ts:635–639`) **nie jest czytane** w żadnym miejscu renderu (`grep` po `src/ui/` — tylko definicje), więc nie jest kryterium odblokowania i nie była nim w tym pinie. Dla `kamien`, `braz`, `zelazo` `epochHasCivs` = true, stąd żaden kafelek nie jest zablokowany — potwierdzone w DOM (klasy `ec`/`ec sel` bez `lock`, dump w `runs/R-RUSTPORT-P1-4-EPOCH-SELECTION-Q1/probe-epoch-selection-dom.json`).

Każdy kafelek: medalion SVG (`epochMedallionHtml`), nazwa, badge, opis. Podgląd szczegółów ponad opis nie istnieje.

## Mechanizm wyboru i przejście dalej

- Klik w kafelek (tylko gdy `hasCivs`) → `selEpoch = id`, `ensureSelCivForEpoch()`, `syncCivTypesOptions()`, zapis preferencji (`markNewGamePrefsDirtyAndSave`), `render()` (`newGameFlow.ts` ~l. 1545–1551).
- Zaznaczona epoka dostaje klasę `ec sel`; domyślnie zaznaczona jest Epoka Kamienia.
- Przycisk „Dalej →" (`button.nb.next`, `newGameFlow.ts:2284`) przechodzi do kroku 3 „Wybór Cywilizacji"; „← Wstecz" wraca do kroku 1.

**Zweryfikowane kliknięciem (probe, zarzut Evaluatora 2 przyjęty — dowód z artefaktów):** Playwright w tej samej rundzie (skrypt poza repo, dump DOM zapisany w `dyspozycje/autobot/runs/R-RUSTPORT-P1-4-EPOCH-SELECTION-Q1/probe-epoch-selection-dom.json`):
- nagłówek kroku 2 (`h2:visible`) = „Epoka Startowa", pasek „Krok 2 z 5";
- przed kliknięciem: `ec sel` na „Epoka Kamienia" (8 cyw.), „Epoka Brazu" (14 cyw.) i „Epoka Zelaza" (15 cyw.) bez `lock`;
- klik w „Epoka Brazu" → `ec sel` przechodzi na „Epoka Brazu", „Epoka Kamienia" traci `sel`; `.epoch-info` = „Masz juz wszystkie technologie epoki Kamienia. Epoke Braz badasz od zera.";
- „Dalej →" (`button.nb.next`) aktywny po kliknięciu, po kliku nagłówek `h2:visible` = „Wybór Cywilizacji".

Zrzuty tej rundy (1600×900, PNG, niepuste): `runs/R-RUSTPORT-P1-4-EPOCH-SELECTION-Q1/probe-epoch-step2-before-click.png`, `probe-epoch-step2-braz-selected.png`, `probe-epoch-to-civ-step3.png`.

## Konsola / sieć

- Przy pierwszym załadowaniu konsola zgłosiła `Failed to load resource: 404`. Nie udało się przypisać URL (drugi przebieg z nasłuchem odpowiedzi HTTP ≥400 nie zarejestrował żadnej odpowiedzi błędnej, prawdopodobnie zasób poza nasłuchiwaniem strony, np. favicon). Nie blokuje ekranu; do odłożenia razem z 404 z P1.3 do P1.16.

## Procesy i repo

- Dev server tej rundy (`node ./node_modules/vite/bin/vite.js --port 5180 --strictPort`, PID 4571 z `$!` w sesji Operatora): po probie zakończony; `curl` na 5180 zwraca 000 (port zamknięty). Uwaga procesowa: podczas sprzątania ubito też inny proces `vite.js --port 5180` (PID 11733), którego rodzicem był shell innej sesji (`p1-7-iso`) — ownership nie został potwierdzony; ubicie było niezamierzone w zakresie tego tematu, zgłoszone do orkiestratora.
- `git status gra/data` przed i po: czyste.
- Oryginalne repo `gra/**` nietknięte. Zapisy: tylko allowlista tematu.
