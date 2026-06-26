# EKONOMIA — indeks zasobów (jeden punkt wejścia)

> Folder zbiera materiały **nie-growe** lane'u EKONOMIA, żeby nie szukać po liście ~50 plików.
> Część plików **musi zostać w miejscu** (referencje innych sesji / pipeline) — są tu zlinkowane.
> Utworzył: sesja Civ-EKONOMIA. Aktualizacja: 2026-06-24.

## 📁 W TYM FOLDERZE (EKONOMIA/)

| Plik | Co to |
|---|---|
| `EKONOMIA-DOKUMENTACJA-DEWELOPERSKA.md` | Pełna dokumentacja architektury: moduły, reguły §1–§8, parametry, interakcje z działami, testy, TODO |
| `EKONOMIA-panel-parametrow.xlsx` | Panel WSZYSTKICH parametrów ekonomii + mapowanie/snippet do `econ-params.json` (4 arkusze) |
| `_INDEKS.md` | Ten plik |

## 📌 NIE-GROWE, ALE ZOSTAJĄ W MIEJSCU (referencje — NIE przenosić bez koordynacji)

| Plik | Lokalizacja | Dlaczego nie przeniesiony |
|---|---|---|
| `Spec-ekonomia.md` | `Civ/` (root) | Czyta go SILNIK (DYSPOZYCJE-SESJI §SILNIK, §LOGIKA) i katalog mastera `ARCHITEKTURA-PLIKI.md`; komentarze w `economy.ts/upkeep.ts` |
| `Ekonomia-parametry.xlsx` | `Civ/` (root) | **Współdzielony**: oprócz ekonomii ma zakładki SPOŁECZEŃSTWA (Zdrowie, Szczęście, Kultura, Religia, Religie cywilizacji); eksportowany przez `gra/tools/export-data.py` (`BASE_DIR/"Ekonomia-parametry.xlsx"` → `econ-params.json`) |
| `Surowce.xlsx` | `Civ/` (root) | Twardo w `export-data.py` (`BASE_DIR/"Surowce.xlsx"` → `resources.json`); referencje w SILNIK.md, PROJEKT-GRY-master.md |

> Przeniesienie tych 3 wymaga **koordynacji**: aktualizacji ścieżek w `gra/tools/export-data.py`
> (`BASE_DIR`) oraz odniesień w plikach mastera (`ARCHITEKTURA-PLIKI.md`, `DYSPOZYCJE-SESJI.md`,
> `PROJEKT-GRY-master.md`, `dyspozycje/SILNIK.md`). To pliki innych lane'ów — czekam na zgodę mastera.

## 🎮 PLIKI GROWE (kod/dane/testy — z definicji zostają w `gra/`)

| Plik | Rola |
|---|---|
| `gra/src/game/economy.ts` | Rdzeń: plony, podział Handlu/Pracy, wzrost, korupcja, produkcja |
| `gra/src/game/turn-economy.ts` | Adapter runtime + tick gospodarki na turę |
| `gra/src/game/upkeep.ts` | Magazyny + utrzymanie + bilans skarbca (gotowy, niewpięty) |
| `gra/src/game/converters.ts` | Przetwórstwo surowców §1.5 (gotowy, niewpięty) |
| `gra/data/econ-params.json` | Wszystkie liczby (4 grupy) ← z `Ekonomia-parametry.xlsx` |
| `gra/data/resources.json` | Lista surowców ← z `Surowce.xlsx` |
| `gra/tools/upkeep-test.cjs` | Test §6/§7 — 51/51 PASS |
| `gra/tools/converters-test.cjs` | Test §1.5 — 30/30 PASS |
| `gra/tools/logic-test.cjs` (Test 8) | Test ticku gospodarki (harness wspólny) |

## 📨 KANAŁ / DYSPOZYCJE (stałe ścieżki — NIE przenosić)

| Plik | Rola |
|---|---|
| `dyspozycje/EKONOMIA.md` | Moje dyspozycje (czyta self-check + master) |
| `dyspozycje/EKONOMIA-DO-MASTERA.md` | Mój kanał raportów do mastera |
| `dyspozycje/_handoff/EKONOMIA-do-SILNIK-economy-edits.md` | Handoff: zmiany economy.ts/turn-economy.ts |
| `dyspozycje/_handoff/EKONOMIA-do-SILNIK-upkeep.md` | Handoff: wpięcie upkeep.ts |
| `dyspozycje/_handoff/EKONOMIA-zalozenia-i-wiazania.md` | Handoff: przyjęte założenia + kontrakty wpięć |

## 🗄️ ARCHIWUM / HISTORYCZNE

Przegląd całego `Civ/` (też `archiwum/`, `_archiwum/`, `_backup/`) — **brak osieroconych nie-growych
plików ekonomii do archiwizacji**:
- `_backup/gra_*/game/economy.ts` (6 szt.) = pełne snapshoty projektu z buildów (nie moje, własność procesu backup/SILNIK) — zostawić.
- `gra/src/game/player-economy.ts` = orphan KODU (dubel utrzymania) — rekomendacja konsolidacji do `upkeep.ts`, ale to plik growy i decyzja SILNIK; nie archiwizuję z tego lane'u.

Gdyby w przyszłości pojawił się przestarzały dokument/panel ekonomii — trafi do `EKONOMIA/archiwum/`.
