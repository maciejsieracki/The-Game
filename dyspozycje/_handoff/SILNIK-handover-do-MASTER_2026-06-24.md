# PRZEKAZANIE SILNIK → MASTER (handover)

> Data: 2026-06-24. Dział SILNIK (silnik / integracja / pętla tury / kanon) zostaje przejęty przez Master.
> Pełna architektura: `SILNIK/SILNIK-ARCHITEKTURA-DEWELOPER.md`. Parametry: `SILNIK/SILNIK-parametry.xlsx`. Historia kanału: `dyspozycje/SILNIK*.md`.

---

## TL;DR — 5 rzeczy, które musisz wiedzieć

1. **Kanon = `gra/Gra-podglad.html`** (md5 `2b29cec…`, 753 KB, build z 22.06 19:56). **Jest nieaktualny** — nie zawiera zmian Units (units.json atak dyst. ×2, pociski, speed-button) ani nocnych prac innych działów. **Czeka REBUILD.**
2. **Jedyna blokada rebuildu:** ostatni nie-zhydratowany plik to `gra/data/diplomacy.json` (re-dehydratacja OneDrive; w chmurze KOMPLETNY). Gdy się zsynchronizuje (touch / „Always keep on this device" / czas) → rebuild przejdzie. Scheduled task to pilnuje (sekcja 6).
3. **BUDUJ TYLKO `vite` bezpośrednio do `/tmp`** — NIGDY `npm run build` (prebuild kasuje cudze JSON-y). Dokładna procedura: sekcja 3.
4. **Główna robota = wpinać moduły z `gra/src/game/*` w pętlę tury** (`main.ts`, handler „N"). Kolejka KROK 2–8: sekcja 4.
5. **`order.ts` „bug" 162/163 = JUŻ NIE ISTNIEJE** (stara migawka; kod+dane poprawne). Nic do roboty.

---

## 1. Stan: co jest wpięte, czego brak

**Żywa pętla tury (klawisz „N") robi dziś tylko:** reset ruchu → `turn++` → `advanceCityEconomy` (ekonomia wszystkich miast) → bankowanie skarbca+nauki gracza → `researchStep` (auto-badania) → HUD + mgła.

**Wpięte moduły:** turn-economy, playerState, cities, visibility, combat, battleScene, cityPanel, preBattle, render/*, units/setup, map/generator, loader.

**NIE wpięte (gotowe, czekają):** `production` (osiągalny tylko przez panel UI, nie przez turę), `ai`, `victory`, `siege`, `diplomacy`, `culture-religion`, `order`, `save`. To jest mapa luk.

---

## 2. Pierwsza akcja po przejęciu

Dokończyć **KROK 1 (konsolidacja)** = rebuild + publikacja świeżego kanonu (wciągnie zmiany Units + nocne prace działów). Warunek: `data/diplomacy.json` zhydratowany. Sprawdź:
```bash
cd gra && wc -l src/game/turn-economy.ts && python3 -c "import json;json.load(open('data/diplomacy.json'));print('diplomacy.json OK')"
```
Jeśli `diplomacy.json` się parsuje → buduj (sekcja 3). Jeśli pada „ucięty" → to mount, nie korupcja: otwórz go narzędziem Read + odczekaj + retry (albo Maciej: „Always keep on this device" na całym `gra/`).

---

## 3. PROCEDURA BUILD + PUBLIKACJA (krytyczna — zapamiętaj dokładnie)

```bash
cd gra
# BUILD (NIGDY npm run build — prebuild=export-data.py nadpisuje JSON-y, m.in. civs.json):
./node_modules/.bin/vite build --outDir /tmp/civ-dist --emptyOutDir
# (--outDir /tmp bo OneDrive blokuje unlink gra/dist/ = EPERM)

# BRAMKA (wszystko zielone przed publikacją):
node tools/smoke.cjs /tmp/civ-dist/index.html
node tools/battle-smoke.cjs /tmp/civ-dist/index.html
node tools/logic-test.cjs        # znany pre-existing? NIE — order już 163/163; każdy fail to realny regres
node tools/combat-test.cjs       # 6/6

# PUBLIKACJA (dopiero po zielonej bramce):
cp /tmp/civ-dist/index.html ../Gra-podglad.html
md5sum ../Gra-podglad.html       # potwierdź zmianę md5
```

**Gdy build pada na „Unexpected end of file" / „Unterminated string literal":** to re-dehydratacja OneDrive (plik kompletny w chmurze, mount ucięty), NIE korupcja. Otwórz wskazany plik narzędziem Read (hydracja) + odczekaj kilkanaście s + retry. **NIE sklejać/nadpisywać plików.** Jeśli plik jest aktywnie edytowany przez inny dział (np. `cityPanel.ts`=UI, `render/units.ts`=Units) — poczekać aż skończy/zapisze; kanon kompiluje się tylko, gdy CAŁY graf jest świeży.

---

## 4. KOLEJKA — co wpinać dalej (po kolei; każdy = edycja main.ts + build + bramka + kanon)

| KROK | Co | Punkt wejścia (woła się w handlerze „N") |
|---|---|---|
| **2** | `production.ts` — postęp produkcji + ukończenie dodaje budynek/jednostkę | `advanceProduction(prod, pracaPerTurn)` (UI kolejki = `cityPanel.ts`, dział UI) |
| **3** | `ai.ts` (tury rywali) + `victory.ts` (zwycięstwo) | `decideAITurn(...)`→wykonać `AICommand[]`; `checkVictory(...)` |
| **4** | walka z mapy (atak→preBattle→wynik na mapę) + `siege.ts` | `resolveSiegeAttack(...)` |
| **5** | `diplomacy.ts` + `culture-religion.ts` + `order.ts` | `aiDiplomacyStance`, `accumulateCulture`/`spreadReligion`, `evaluateOrder` |
| **6** | `save.ts` (zapis/odczyt + sloty) | `serializeGame`/`saveToLocal`/`loadFromLocal` (zdarzeniowo) |
| **7** | nowa gra (flow startu — UI dostarcza ekrany) | — |
| **8** | higiena: usuń orphany `research.ts` + `player-economy.ts` (nikt nie importuje); napraw hook `prebuild` | — |

Wzorzec wpięcia i sygnatury wszystkich modułów: w `SILNIK-ARCHITEKTURA-DEWELOPER.md` sekcje 4 i 6.

---

## 5. Pułapki, fakty, dług techniczny

- **`order.ts`** — test „loadOrderParams scales by difficulty" przechodzi (dane `porzadek_prog_t1={easy:-1,normal:0,hard:1}` + kod rozpakowuje `society.porzadek`). „162/163" było ze starej migawki. **Zamknięte.**
- **Orphany** `research.ts`, `player-economy.ts` — duplikaty `playerState` + inline-bankowania; importowane przez nikogo; do usunięcia (KROK 8). `upkeep.ts`/`barbarians.ts`/`converters.ts` też martwe.
- **Parametry zaszyte w kodzie** (nie w JSON): cała walka §5l (`combat.ts`), duplikat `terrain-yields` w `economy.ts`, baza progu wzrostu „10", `DEFAULT_SIGHT=3`, `RIVER_MOVE_BONUS=4` itd. Pełna lista: arkusz **`ZASZYTE-w-kodzie`** w `SILNIK-parametry.xlsx`.
- **Footgun buildu:** `npm run build` → `prebuild` → `export-data.py` nadpisuje WSZYSTKIE JSON. Stąd zawsze `vite` bezpośrednio.
- **Koordynacja (pliki w grafie kanonu, nie edytować równolegle):** `render/units.ts` (Units), `cityPanel.ts` (UI), `turn-economy.ts` (klej do `economy.ts`=EKONOMIA). Ich mid-edit blokuje build SILNIKA.
- **Różnicowanie jednostek na mapie** (`typeId`→`buildUnitModel`) = 1 linia w `render/units.ts` po stronie **Units**; SILNIK potem tylko przebudowuje kanon.

---

## 6. Scheduled task `civ-silnik-self-check` — DECYZJA Master

Działa co 10 min, czyta `dyspozycje/SILNIK.md`, wdraża nowe dyspozycje, pilnuje rebuildu kanonu. Skoro SILNIK → Master, do decyzji:
- **Zostawić** (jako auto-watcher rebuildu kanonu) — przydatny, sam dokończy rebuild po hydracji `diplomacy.json`.
- **Przejąć/zmienić** — zmienić prompt/ścieżki (`update_scheduled_task`).
- **Wyłączyć** — jeśli Master prowadzi silnik ręcznie.

Mogę go wyłączyć/zmienić na Twój sygnał.

---

## 7. Reguły lane (skrót, gdyby Master delegował dalej)

- `main.ts` + publikacja `Gra-podglad.html` = jeden właściciel (teraz Master). Inni nie dotykają `main.ts`.
- Edytować tylko: `main.ts`, cienkie wpięcia `game/*`, `playerState.ts`. NIE: `render/*`, `battle/*` (wnętrze), `ui/*`, Excele/JSON danych.
- Po każdej zmianie: build + bramka; po fali — jeden świeży kanon.

---

## 8. Dokumenty (gdzie co jest)
- `SILNIK/SILNIK-ARCHITEKTURA-DEWELOPER.md` — pełna architektura (pętla tury, moduły, API, pipeline, interakcje, typy).
- `SILNIK/SILNIK-parametry.xlsx` — wszystkie parametry silnika + arkusz zaszytych-w-kodzie.
- `dyspozycje/SILNIK.md` + `dyspozycje/SILNIK-DO-MASTERA.md` — historia dyspozycji i raportów (cały wątek z masterem, w tym log blokad re-dehydratacji).
