# 05 — Analiza: AI / CYWILIZACJE / DANE

*Wygenerowano autonomicznie: 2026-06-26 | Źródła: AI-DO-MASTERA.md, CYWILIZACJE-DO-MASTERA.md, DANE-DO-MASTERA.md, DZIENNIK-MASTERA.md*

---

## 1. Zakres lane'ów

Trzy powiązane lane'y (CYWILIZACJE przejęło zakres DANE po zamknięciu sesji DANE 2026-06-24):

**AI** — przeciwnicy sterowani komputerem:
- `gra/src/game/{ai,victory,barbarians}.ts`, `gra/data/ai-params.json`
- `gra/tools/export-ai-params.py`, `barbarians-test.cjs`
- Dokumentacja: `Civ-AI/` (Spec-AI.md, Spec-AI-architektura.md, AI-parametry.xlsx, README.md)

**CYWILIZACJE** — roster nacji, religie, drzewko technologii, bonusy:
- `gra/data/civs.json`/Cywilizacje.xlsx, `gra/data/tech.json`/Technologie-drzewko.xlsx
- `gra/src/game/tech-tempo.ts` (applyTempoKoszt)
- `gra/tools/export-civs.py`, `export-tech.py`
- Dokumentacja: `Civ-CYWILIZACJE/` (DOKUMENTACJA-DEV-CYWILIZACJE.md, PROPOZYCJA-dyplomacja-AI-v0.1.md)

**DANE** (zamknięte, przekazane CYWILIZACJE):
- `gra/data/civs.json`, `Cywilizacje.xlsx`, `Spoleczenstwo-parametry.xlsx` ("Religie cywilizacji")
- Dokumentacja: `Civ-DANE/` (DOKUMENTACJA-DANE-cywilizacje.md, INDEX.md, PACZKA-DLA-UNITS-od-DANE.md, Jednostki-specjalne-przeglad.xlsx)

## 2. Stan obecny (~75% AI, ~70% CYWILIZACJE, ~85% DANE)

### AI (WPIĘTE do kanonu)
- `ai.ts` (610 linii) wpięty: `decideAITurn(...)`→AICommand[]; czyta `data.aiParams` + mapuje typ cyw→archetyp
- `victory.ts` (223 linii) wpięty: `checkVictory(input)` — dominacja typu + statek + eliminacja
- `barbarians.ts` (561 linii) wpięty: `spawnCamps/tickCamps/decideBarbarianMoves/loadBarbParams/barbariansActive` — czyta `ai-params.json` (FALLBACK)
- `chooseAIResearch` (czysta funkcja, silnik woła w kroku §9.3)
- `loadDifficultyParams` (poziomTrudnosci 1/2/3) + AITurnOpts.poziomTrudnosci
- **Archetypy 7→9** (Celtowie/Germanie dodani); panel AI-parametry.xlsx 36 archetypów (9 nacji ×4) sterowalny
- **AI civType** = stub 'Grecy' dla wszystkich; realne typy po wpieciu rostera per-właściciel (czeka na format startowego rozmieszczenia: CYWILIZACJE ← MAPA)
- `aiOwnerCivMap` (różne nacje AI) + archetyp + `ARCHETYPE_AGGRESSION` (Zulusi 0.9..Chinczycy 0.2)
- **Fallback ruchu 3b**: jednostki bez celu nie stoją przy krawędzi (ku miastu/środkowi)
- `decideAIReaction` (fight/flee, decyzja 2) + `decideAIReinforcements` (posiłki ≤1 heks) + `decideAIDiplomacy` (T2=A: pełna dyplomacja AI +sojusz +handel)
- `chooseCityProduction` (pkt5 budżet: canAfford + itemCost) — pkt5 ODBLOKOWANY (kontrakt EKONOMIA-do-CYWILIZACJE_budzet-AI)
- **Ekspansja klastrowa** (pkt3): `decideAITurn(...,{clusterCenter, clusterRadius})` wg ClusterPlacement (MAPA) — pkt3 ODBLOKOWANY + ZROBIONY
- **T4=B spryt od trudności**: agresjaMnoznik/dyplomacjaAktywnosc/celObranie

### CYWILIZACJE
- **Roster 9 typów** w `civs.json`: Grecy, Rzymianie, Chińczycy, Inkowie, Zulusi, Egipt, Sumerowie, Celtowie, Germanie — każdy z: styl, jednostka specjalna, bonus/minus (konkretne), religia, `Typ główny=true`, `mnoznikHandelPieniadz` (1.7–2.4), `ikonaId` (lowercase nazwa), `nazwyKlastra` (10 stringów, [0]=stolica), `bonusy[]` (27 efektów z polem "realizuje" → walka/miasto/ekonomia)
- **enum TypCywilizacji** wyrównany do 9 (+Celtowie/Germanie) + `ARCHETYPE_*`; usunięty "Typ główny" martwy
- **Drzewko technologii** (`tech.json`):
  - Koszty nARASTAJĄ progresywnie w każdej epoce (monotonicznie), bramki na szczycie (Brązownictwo 45/Waluta 100/Sztuka wojenna 200)
  - Jezdziectwo(56) > Pismo/Religia (3b)
  - +9 techów Żelaza (Epoka Żelaza wchodzi — 1A)
  - `tech-tempo.ts` `applyTempoKoszt` (test 9/9): tempo_gry mnożnik kosztu badań (szybka ×0.2 / standard ×1 / długa ×5)
- **Dyplomacja** (`diplomacy.ts` — wpięta):
  - Model Relacja = Zaufanie + Respekt (0..200, start 50)
  - `computeRespekt` (T1=A, ratio-share: 50=parytet; słaby ulega nie atakuje) — ZATWIERDZONY przez Macieja (wagi 28/20/18/14/12/8)
  - `computePotegaNacji` (komponenty z UNITS/MIASTO/EKONOMIA)
  - `tickDiplomacy` (tura dyplomacji) + event `zerwanie_handlu`
  - `relationTier(rel)`→0..4 + `TIER_NAMES` (5-tier: Wojna/Wrogi/Neutralny/Przyjazny/Sojusz; progi <15/<30/<60/<120/>=120)
  - Panel v0.1 = PODGLĄD (akcje wojna/pakt PO wpieciu applyDiplomaticEvent)
- **Religie 9** w Spoleczenstwo-parametry.xlsx → "Religie cywilizacji" (źródło)
  - ⚠ `society-params.json` wciąż ma **7** → re-eksport = master/silnik
  - Celtowie (druidyzm: +10 Morale szarży, +2 Kultura ze świątyni/gaju, +1 Zadowolony na święta)
  - Germanie (Wotan/Odyn: +15% Atak w lesie, +2 jedność drużyny, +5 relacji z pokrewnymi)

### DANE (ZAMKNIĘTE)
- 9 typów, każdy: religia + bonus/minus + jednostka specjalna (Inkowie: Chaska + Królewska Gwardia — 8C naprawione z Jaguar)
- Paczka dla UNITS gotowa (`PACZKA-DLA-UNITS-od-DANE.md`): kierunek jednostek Celtów/Germanów + luka "zamiennik w Żelazie" u 6 typów + propozycja 9 wyjątkowych 1/cyw. + 6 opcjonalnych 2.

### TESTY
- ai-test 88/0 → 132/0 → 175/0 → 188/0 (rośnie z archetypami)
- diplomacy-test 78/0 → 90/0 → 98/0 → 119/0 → 133/0
- research-test 33/0
- barbarians-test 53/0
- tech-tempo-test 9/9
- `loader.ts` tsc EXIT=0 (izolowany)

## 3. Otwarte wątki

| # | Wątek | Status | Czeka na |
|---|-------|--------|----------|
| 10 | AI: archetypy 7→9 + harness + heurystyka nauki | ROBI — ZROBIONE | (pkt3, pkt5 ODBLOKOWANE) |
| #Wpiecie AI | Wpiecie ai/victory/barbarians do pętli tury | ZROBIONE (kanon) | — |
| #Realizacja civBonusy | Realizacja bonusy[] w systemach (27 efektów) | DEFERRED | Wszystkie lane'y (cross-lane) |
| #society re-eksport | society-params.json religie_cywilizacji 7→9 | CZEKA | master/silnik |
| #T3 bonusy mechanizacja | Mechanizacja efektów bonusy[] per dział | CZEKA | cross-lane handoff `CYWILIZACJE-do-MASTER_bonusy-mechanizacja.md` |

### Balans (do decyzji Macieja)
- **CYW-T1–T4**: T1=A (Respekt ratio-share) ✅, T2=A (pełna dyplomacja AI) ✅, T3=A (bonusy strukturalne) ✅, T4=B (spryt od trudności) ✅ — ZAMKNIĘTE
- **mnoznikHandelPieniadz per-cyw** (1.7–2.4) — do strojenia Macieja
- **Koszty tech** (PROPOZYCJA Macieja zaakceptowana): nARASTAJĄ progresywnie, bramki na szczycie

## 4. Decyzje Macieja zamknięte

- **1A ŻELAZO GO** — 3 epoki w v0.1 (Kamień/Brąz/Żelazo); tech.json Żelazo zostaje
- **Roster 9 typów** + religie (1A akceptuję, 2B "Celtowie", 3A, 4C "Typ główny" później, 5A reguła 90/klaster 10)
- **8C** Inkowie "Wojownik Jaguar" → "Chaska + Królewska Gwardia"
- **6A** civs.json lean — 1 "Jednostka specjalna" (flagowa); reszta w Jednostki.xlsx
- **7B** propozycje per-epoka dla 7 typów (INPUT dla UNITS)
- **T1–T4** = A/A/A/B
- **Respekt** = ratio-share (wagi 28/20/18/14/12/8)
- **Tempo gry** = mnożnik kosztu badań (szybka ×0.2 / standard ×1 / długa ×5)
- **Q5 ikonaId** per cyw w civs.json (+ kolumna w Cywilizacje.xlsx + export-civs.py)
- **Decyzja 24.06** profil cywilizacji ZOSTAJE w panelu AI (ai-params.json, NIE w civs.json)

## 5. Właściciele

| Rola | Model |
|------|-------|
| Heurystyki, balans AI ( GLM ) | `glm-5.2-max` subagent |
| Implementacja ai.ts, civs.json, tech.json ( Composer ) | `composer-2.5-fast` subagent |
| Testy ai-test 113+, diplomacy-test ( Opus ) | Opus 4.8 Ask/Agent |
| Tier balance ABC, akceptacja | Maciej |

## 6. Quick wins / next

| # | Co | Effort | Impact |
|---|-----|--------|--------|
| QW5 | `<LANE>-STAN.md` × 10 (12 linii każdy) | S | 🟠 −80% koszt self-checków |
| EP6 | 50 cywilizacji (rozszerzenie rosteru) | L | DANE + CYWILIZACJE |
| #T3 | Mechanizacja bonusy[] per dział (cross-lane) | M | Realizacja civBonusy |

## 7. Ryzyka / flagi

- **AI civType = stub 'Grecy'** dla wszystkich — realne typy po wpieciu rostera per-właściciel (czeka na format startowego rozmieszczenia z MAPA)
- **society-params.json 7 vs 9 religii** — re-eksport = master/silnik (export-data.py zakazany)
- **Rozjazd "Jednostka specjalna"** (civs.json=ikoniczny zamiennik Falanga/Legion/Kusznik/Impi) vs super (units.json) — świadomie (8C); UI/SILNIK ma wiedzieć [POGŁĘBIONE 2026-07-23: Kusznik od 2026-07-10 nie istnieje w units.json w ŻADNEJ postaci (nie tylko jako super) — civs.json nadal go wymienia jako ikoniczny zamiennik Chińczyków; decyzja czym zastąpić — otwarta, `STAN-PRACY-HANDOFF.md` §8]
- **ai.ts** czyta STARY ai-params.json (panel AI), NIE civ-ai.json / civ-params.json (rozdźwięk zamknięty decyzją Macieja — profil ZOSTAJE w panelu AI)
- **civs.json generuje TYLKO export-data.py** (zakazany) — edycja bezpośrednia NIE w xlsx → ponowny eksport skasuje pole `nazwyKlastra`/`mnoznikHandelPieniadz`/`ikonaId`. Rekomendacja A: targeted `export-civs.py` + kolumna w Cywilizacje.xlsx (już zrobione)
