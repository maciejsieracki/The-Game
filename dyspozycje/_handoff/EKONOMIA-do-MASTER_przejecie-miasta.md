# HANDOFF: EKONOMIA przejmuje MIASTO (scalenie lane'ów)

**Data:** 2026-06-25 · **Autor:** sesja Grupa B · **Status:** przejęcie wykonane; plan niżej.
**Podstawa:** decyzja Maciej (czat) + Twój znacznik w `MIASTO.md` „SCALONE → EKONOMIA".

> **AKTUALIZACJA 2026-06-25 (decyzja Maciela, czat):** zakres EKONOMIA poszerzony — **wszystko, co akumuluje się do użytku całej cywilizacji** (skarbiec, pula nauki, zapasy/dostęp surowców) **+ produkcja w miastach = EKONOMIA**. `playerState.ts` przechodzi do mnie. To **zamyka** decyzję „magazyn nauki" (opcja A): pula NAUKI jest MOJA. Wcześniejszy zapis „`playerState` = Twój" (pkt 3) = NIEAKTUALNY.

---

## 1. Dlaczego scalenie (diagnoza)
Mechanika podziału outputu miasta jest fizycznie rozcięta na 3 pliki w 3 lane'ach:
`economy.ts` (EKONOMIA, podziałHandlu→Nauka/Pieniądz/Luksus), `production.ts` (MIASTO,
podziałPracy→budynki/pula), `playerState.ts` (master, dubel split Nauka/Pieniądz + pula techów).
„4 kubełki" Maciela = suma tych suwaków; nikt nie miał całości → stąd kolizje i rozjazd wizji.
Jeden właściciel rury *output → podział → plony → agregacja* usuwa to u źródła.

## 2. Pliki przejęte (nowy zakres EKONOMIA = miasto + gospodarka)
**KOD `game/*.ts`:**
- moje dotychczas: `economy.ts`, `turn-economy.ts`, `economy-upkeep.ts`, `wealth.ts`, `converters.ts` (parked)
- z MIASTA: `cities.ts`, `production.ts`, `order.ts`, `culture-religion.ts`, `okolica.ts`, `auto-manage.ts`
- z mastera (decyzja Maciej 2026-06-25): `playerState.ts` — civ-level bank: **skarbiec** + **pula nauki** (akumulacja + wydawanie na tech: `researchStep`, `techCost`, `availableTechs`, `cheapestAvailable`). `research.ts` (orphan) → kasujemy.

**DANE / PANELE:**
- moje: `econ-params.json` (+ Ekonomia-parametry.xlsx, Surowce.xlsx)
- z MIASTA: `buildings.json` (+ Budynki.xlsx), `society-params.json` (+ Społeczeństwo-parametry.xlsx), `terrain-improvements.json`

Handoffy `MIASTO-do-*` w `_handoff/` = referencja.

## 3. Czego NIE przejmuję (granica — proszę o potwierdzenie)
- `main.ts` instancjonuje żywy obiekt `PlayerState` i woła moduły w pętli tury (kanon) = master. Ja jestem właścicielem **MODUŁU** `playerState.ts` (logika banku/nauki); master tylko wpina + czyta do HUD.
- `render/*`, `battle/*`, `units.ts` = MAPA/UNITS.
- Drzewko techów: **KOSZTY** (`tech.json` „Koszt nauki") + **polityka wyboru techu przez AI** (`chooseAIResearch`, `ai.ts`) = **CYWILIZACJE**. Ja owner: **pula nauki + mechanika wydania** (`researchStep`: odejmij naukę, oznacz zbadane, awans epoki). SEAM: dzisiejszy auto-pick `cheapestAvailable` w `playerState` docelowo deleguje do `chooseAIResearch` (CYWILIZACJE) — uzgodnić. `civs.json` = DANE; `diplomacy.ts` = CYWILIZACJE/DYPLOMACJA.
- Stan heksów / placement / granice na mapie = MAPA (ja daję dane zasięgu + bonusy, nie trzymam stanu pola).

## 4. Czym się teraz zajmuję + plan (z aspektem miasta)

**4a. Najpierw: wspólny dokument modelu — BLOKADA: 3 decyzje Maciela (czekam w czacie):**
- Zdrowie miasta: `economy.ts` ma `zdrowieModyfikatorWspolczynnik`, model miasta go nie dostarcza → w v0.1 czy wycinamy.
- „Rozwój" (4. kubełek): Praca→skarbiec (podziałPracy→doPuli) czy Luksus→Wealth?
- ~~Magazyn nauki~~ → **ROZSTRZYGNIĘTE 2026-06-25 (Maciej): pula NAUKI jest moja** (`playerState`), `research.ts` orphan kasujemy. Zostają **2** decyzje: zdrowie, „rozwój".

**4b. Konsolidacja suwaka podziału** (po dokumencie): jedno źródło zamiast trzech; kasacja dubla Nauka/Pieniądz (`economy.ts` vs `playerState.ts`).

**4c. Migracja compound +10%** — teraz mam OBA pliki: `economy.ts.buildingValue` (liniowy) → użyję helpera `production.buildingEffectAtLevel` (compound, MIASTO już ma). Domyka stary handoff bez przepychanki.

**4d. Hook `growthMult`** w `turn-economy` (z `order.ts`) — oba pliki teraz moje.

**4e. `taxIncome`** — BLOKADA: baza podatku (Maciej). Po decyzji dorabiam (dziś stawka 0 = neutralny).

**4f. Odziedziczone z MIASTA (otwarte):**
- Wioska→miasto (konwersja) — DECYZJA Maciela (robimy w v0.1?). Mam `canFoundCity`/`foundCityAt`.
- Model terytorium: zasięg-z-populacji + pierścienie-kultury (addytywnie) → potwierdzić i przekazać MAPIE.
- `terrain-improvements.json`: bonusy ulepszeń — BLOKADA: lista ulepszeń od Maciela.
- Etap 2 religii: `spreadReligion` + `tradeMult` per-city — do dokończenia, zgłoszę handoff.
- Regen Exceli (Budynki/Społeczeństwo) przy hydracji.

## 5. Rola mastera (integrator + router) — co od Ciebie
Master = **WYŁĄCZNIE** spinanie w całość (silnik / `main.ts` / kanon) + ewentualny rozdział pracy.
Nie jest właścicielem żadnej domeny ani decydentem merytorycznym — to Maciej. Stąd:
1. **Informacyjnie (do routingu), nie do akceptacji:** zakres EKONOMIA = miasto + cała gospodarka + akumulacje civ-level (skarbiec, pula nauki, surowce) + `playerState.ts`. Granicy nie zatwierdzasz — decyzja Maciela już zapadła.
2. **Integracja:** wepnij moje moduły do pętli tury (Wealth, upkeep, `autoManageCity` 9A, `maMur` 4A) + przebuduj kanon. Część już czeka w moich wcześniejszych handoffach.
3. **Po wspólnym dokumencie modelu:** wepnij skonsolidowany suwak; `research.ts` (orphan) usuwam po swojej stronie — Ty tylko rebuild kanonu.

**Tryb:** ciężką robotę (kod) realizuję przez Sonnet-subagentów (backup + testy, build do /tmp, bez kanonu). Pytania projektowe → Maciej. Wpięcia → Ty.
