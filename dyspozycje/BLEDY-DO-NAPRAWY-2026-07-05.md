# DYSPOZYCJA: Lista błędów do naprawy — gra-robocza (audyt 2026-07-05)

Audyt zewnętrzny (Claude/Cowork): kompilacja `tsc`, profil CPU generatora, testy empiryczne generatora (uruchomiony kod na seedach 42/123/777/7/2026/555, typy: kontynenty/pangea/wyspy/ziemia), przegląd logiki.
Wszystko dotyczy `gra-robocza/`. Kolejność = priorytet.

---

## STATUS WYKONANIA (Integrator F · 2026-07-05)

| Faza | Stan | md5 robocza | Notatka |
|------|------|-------------|---------|
| **P0 MAPA** | ✅ **GOTOWE** | `b468cade…` → zastąpione P1 | B0.1–B0.3 · standard 4,36 s · 0/877 rzek bez ujścia |
| **P1 TSC + rebuild** | ✅ **W KANONIE** | **`0fd96b6f5fb021fb3294dde29c5692ce`** | promocja 2026-07-05 ~09:50 · playtest OK |
| **P2 logika** | ⏸ **BLOCKED ABC** | — | 6 punktów — bez zmian kodu (patrz § PRIORYTET 2) |
| **MAPA strefy A wąski** | 🟢 **ACTIVE** | — | handoff `MASTER-do-MAPA_strefy-klimat-A-waski-2026-07-05.md` |

**Start:** `gra-robocza/START.html` · **Ctrl+F5** po publish  
**Kanon:** bez promocji — czeka Master review + playtest MAPA Macieja  
**Handoff:** `dyspozycje/_handoff/F-do-MASTER_BLEDY-2026-07-05.md`

### P1 — co naprawiono (skrót)

| # | Fix |
|---|-----|
| 1 | `main.ts` — import `getEmpireFoodSplit` |
| 2 | `main.ts:5451` — `u.typeId` |
| 3 | `gen-helpers.ts:1865` — Morse→Morze (P0) |
| 4 | `ai.ts:720` — `def.Health` |
| 5 | `cityPanel.ts` — pola UnitDef PL (Atak, Obrona, …) |
| 6 | `hexContextTooltip.ts` — `ulepszenie` |
| 7 | `City.kulturaSkumulowana?` + main/playtest |
| 8 | `robloxImprovements.ts` — builder `stadnina` |
| 9+ | `BattleResult` remis · GroupMeta rally · `vite-env.d.ts` · ImprovementKey · ikony · JSON casts — **35 plików** |

**Rebuild:** `victoryScreen.ts` (E-15 cinematic) w `Gra-podglad.html` — marker `vsc-overlay` w bundle.

---

## PRIORYTET 0 — GENERATOR MAPY (zgłoszenia Macieja: woda na pustyni, rzeki bez ujścia, wolna generacja)

### B0.1 Rzeki kończą się w polu — woda pod ujściem jest kasowana PO wytyczeniu rzek ✅ POTWIERDZONE TESTEM
**Plik:** `src/map/generator.ts:362-365` + `src/map/gen-helpers.ts`
**Dowód:** na typie `ziemia` (mapa mała) 7–8 z ~28 głównych rzek (~28%) na KAŻDYM seedzie kończy się na heksie `laka` otoczonym w 100% łąką. Rzeka była poprawnie dociągnięta do wody, ale po `generateRivers()` wykonują się jeszcze:
```
stripRiverMarksFromOpenSea(hexes);
stripDepositsFromWater(hexes);
purgeInlandWaterForMultiLandTyp(hexes, width, height);   // ← zamienia wodę na ląd
purgeDesertEnclaveWater(hexes, width, height);           // ← zamienia wodę na ląd
```
które wypełniają zbiorniki wody lądem — rzeka zostaje z ujściem w trawie.
**Naprawa:** żadna funkcja zamieniająca wodę→ląd nie może działać po `generateRivers()`. Przenieść `purgeInlandWaterForMultiLandTyp` + `purgeDesertEnclaveWater` PRZED `clearRiverMarks/generateRivers` (i tak są wołane wielokrotnie wcześniej). Alternatywnie: po purge zwalidować każdą główną rzekę `pathEndsAtSea()` i usunąć/przetrasować uszkodzone.
**Kryterium akceptacji:** 0 głównych rzek bez ujścia na 5 seedach × 4 typy świata (test: ostatni hex ścieżki `main` sąsiaduje z wodą połączoną z krawędzią mapy).

### B0.2 Generacja koszmarnie wolna — 47% czasu to jeden pełnomapowy flood-fill liczony w kółko ✅ POTWIERDZONE PROFILEM CPU
**Pomiar:** mapa mała (108×74) ~2,5 s; standardowa (168×120) **26,4 s** — skalowanie ~kwadratowe. Duża/ogromna → minuty.
**Profil CPU:** `oceanConnectedWaterKeys` **47,1%**, `sanitizeCoastHexes` **12,5%**, `findInlandWaterHexes` 5,6%, `pathEndsAtSea` 4,0%.
**Przyczyny (konkretnie):**
1. `pathEndsAtSea()` (`gen-helpers.ts:3321`) wywołuje `oceanConnectedWaterKeys()` — pełny flood-fill CAŁEJ mapy — przy KAŻDYM wywołaniu. A wywoływana jest per PRÓBA źródła rzeki: w `tryPlaceGridRiver` (`gen-helpers.ts:4575`) i drugi raz na końcu `traceRiver` (`gen-helpers.ts:3895`), mimo że `traceRiver` dostaje gotowy `oceanConnected` w `traceOpts` i go tam nie używa. `ensureMassRiverGridCoverage` (4429) potrafi przy nieudanej komórce przetestować dziesiątki źródeł — każde = 2 pełne flood-fille. Do tego pętla `for (pass=0; pass<6)` w `generateRivers` (4581).
   **Naprawa:** dodać do `pathEndsAtSea` opcjonalny parametr `oceanConnected: Set<string>` i przekazywać wszędzie wyliczony raz zestaw (unieważniać tylko gdy teren się zmienił). Sam ten fix powinien ściąć ~50% czasu.
2. `sanitizeCoastHexes` (`gen-helpers.ts:2253`) — propagacja `while(propagated)` skanuje CAŁĄ mapę w każdej rundzie (O(n²)). Zamienić na BFS z kolejką od zwalidowanych heksów.
3. Pipeline w `generator.ts` woła `finalizeCoastAndInlandWater` ~8×, `purgeInlandWaterForMultiLandTyp` ~7×, `enforceMapBorderOcean` 5× — każde to kilka pełnych przebiegów mapy (a finalize robi do 3 pasów × 4 podfunkcje). Odchudzić: po stabilizacji wybrzeża większość powtórzeń nic nie zmienia — dodać wczesne wyjścia (licznik zmian == 0 → skip) albo zredukować liczbę faz.
**Kryterium akceptacji:** mapa standardowa < 5 s, duża < 15 s; wynik identyczny dla tego samego seeda (determinizm zachowany).

### B0.3 Literówka `TerenBazowy.Morse` → wybrzeże tylko eroduje, nigdy się nie odbudowuje ✅ POTWIERDZONE (to też jeden z winowajców „wody na pustyni")
**Plik:** `src/map/gen-helpers.ts:1865` (`isCoastalMorseHex`)
```ts
if (h?.terenBazowy !== TerenBazowy.Morse) return false;  // Morse nie istnieje → undefined
```
`teren !== undefined` jest zawsze prawdziwe → funkcja ZAWSZE zwraca `false`. Skutki:
- `applyJaggedCoastNoise` (2538): gałąź „wypełnij morze lądem" martwa → szum brzegowy tylko ZJADA ląd (2536-2537), nigdy nie oddaje. Wybrzeża (w tym pustynne) są jednostronnie wgryzane przez morze — stąd „woda z morza wchodzi na pustynię".
- `rebalanceLandSeaRatio` (2107): gdy lądu za mało, `toFill` zawsze puste → `break` — generator NIE UMIE dosypać lądu do docelowego udziału.
**Naprawa:** `Morse` → `Morze` (1 znak). Potem obejrzeć mapy — erozja pustynnych wybrzeży powinna zelżeć.

### B0.4 Woda „na pustyni" — dodatkowe mechanizmy do obejrzenia po fixie B0.3
- `applyDoubleCoastRing` (`gen-helpers.ts:2210`) zamienia DWA pierścienie suchego lądu (także pustyni) na `Wybrzeze` (płytka woda) na każdym styku z morzem — na pustynnym wybrzeżu wygląda to jak morze wchodzące w głąb pustyni. Rozważyć: pojedynczy pierścień na pustyni albo osobny teren „plaża".
- `sanitizeCoastHexes` (2299-2309) i `purgeDesertEnclaveWater` (2440) konwertują wodę wg sąsiadów-pustyni — po fixach B0.1/B0.3 przetestować na typie `ziemia` i dużych mapach, czy enklawy wody w pustyni znikły.

### B0.5 Dopływy rzek z założenia NIE dochodzą do morza — sprawdzić render połączenia
**Dowód z testu:** 100% dopływów (`kind != 'main'`) nie kończy przy morzu — kończą przy rzece głównej (to zamierzone). Jeśli w renderze (`landRiverRenderPath` / rysowanie krawędzi) punkt włączenia dopływu do głównego nurtu nie jest domykany wizualnie, gracz widzi „urwane rzeki". Zweryfikować wizualnie po naprawie B0.1; jeśli nadal urwane — poprawić render styku dopływ↔główny nurt.

---

## PRIORYTET 1 — TWARDE BŁĘDY RUNTIME (crash / undefined w grze; wyłapane przez `tsc`, zweryfikowane w kodzie)

Kompilacja: **`npx tsc --noEmit` = 158 błędów w 31 plikach.** Vite/esbuild nie sprawdza typów, więc te błędy wchodzą do gry. Najgroźniejsze:

| # | Plik:linia | Błąd | Skutek w grze |
|---|-----------|------|---------------|
| 1 | `main.ts:3469` | `getEmpireFoodSplit` używane, ale NIE dodane do importu z `./game/empire-food` (import na linii ~327) | **ReferenceError = crash** gdy brak stanu żywności imperium (fallback `?? getEmpireFoodSplit(0)`) |
| 2 | `main.ts:5451` | `unit.typeId` — zmienna nazywa się `u` | **ReferenceError = crash** przy komunikacie o wejściu do garnizonu |
| 3 | `src/map/gen-helpers.ts:1865` | `TerenBazowy.Morse` | patrz B0.3 |
| 4 | `src/game/ai.ts:720` | `def.health` — pole nazywa się `Health` | AI liczy siłę z `undefined` → NaN w ocenie zagrożenia |
| 5 | `src/ui/cityPanel.ts:3838-3845` | `meleeAttack/meleeDefence/weaponDamage/armor/piercing/chargeBonus/missileAttack/health` — złe wielkości liter vs `UnitDef` | Panel miasta pokazuje puste/undefined statystyki jednostek |
| 6 | `src/ui/hexContextTooltip.ts:79-82` | `hex.ulepszenia` — pole nazywa się `ulepszenie` | Tooltip ulepszeń nie działa |
| 7 | `main.ts:9665` + `src/game/playtestMiastoEkonomia.ts:163` | `city.kulturaSkumulowana` nie istnieje na typie `City` | Kultura: odczyt `undefined` → NaN/0 w UI i playteście |
| 8 | `src/render/robloxImprovements.ts:376` | brak buildera `stadnina` w `Record<ImprovementKey, ...>` | Render ulepszenia „stadnina" — brak/wyjątek |
| 9 | `src/map/improvement-build.ts:148,200,462,517` | `popalnia_brazu` nie należy do `ImprovementKey` | Rozjazd definicji ulepszeń — uzgodnić klucz (dodać do typu albo usunąć resztki) |
| 10 | `main.ts:6723,7019,7092,7227` | wynik bitwy `'remis'` niekompatybilny z typem `'atakujacy'\|'obronca'` | Możliwa zła obsługa remisu w bitwach polowych — ujednolicić typ `BattleResult` o remis |
| 11 | `src/battle/battleScene.ts` (28 błędów, m.in. 12907-13572) | `rallyCol/rallyRow` przypisywane dynamicznie, brak w typie `GroupMeta`; porównanie z `'manual'` poza typem trybów (13061) | Dodać pola do typu; sprawdzić martwą gałąź trybu `manual` |
| 12 | `src/game/converters.ts:140-157,208` | `perCykl` possibly undefined, dzielenie | NaN w przeliczniku surowców |
| 13 | `src/game/economy-upkeep.ts:215` | `have`/`add` possibly undefined | NaN w utrzymaniu |
| 14 | `src/ui/minimapHud.ts:199` | porównanie z `'hidden'` — typ to `'visible'\|'explored'\|undefined` | Warunek FOW na minimapie martwy — sprawdzić czy `undefined` znaczy „hidden" i porównać jawnie |
| 15 | `src/map/newGameMapDefaults.ts:63,80,96,263` | klucz `'super'` poza `MapSizeLabel` | Rozjazd nazw rozmiaru mapy (`super` vs `superogromny`?) — kreator nowej gry może źle mapować rozmiar |

**Zadanie:** naprawić WSZYSTKIE 158 błędów do `tsc --noEmit` = 0 (pełna lista: uruchomić `npx tsc --noEmit` w `gra-robocza/`). Pozycje 1-8 najpierw — to realne crashe/zepsute funkcje. Do CI/obiegu: build ma failować przy błędach tsc.

---

## PRIORYTET 2 — LOGIKA (przegląd kodu; POTWIERDZIĆ z designem przed zmianą)

1. **`src/game/combat.ts` ~776-790:** bonus szarży (`roundAtkCharge`) wchodzi i do szansy trafienia (`chargeHitBonus` → `hitChanceTw`), i do obrażeń (`damageTw(..., roundAtkCharge, isCharge)`). Jeśli Macierz-walki przewiduje szarżę tylko w jednym miejscu — jest liczona podwójnie.
2. **`src/game/diplomacy-proposals.ts` ~455-470 (wasalizacja):** bramka wymaga `ctx.responderRespekt ≥ próg`, a płatnikiem trybutu jest `responderOwnerId` (wasal = respondent). Niespójność: jeśli propozycja znaczy „zostań moim wasalem" → bramka powinna być na respekt PROPONENTA; jeśli „zostanę twoim wasalem" → płatnik powinien być proponentem. Jedno z dwóch jest odwrócone.
3. **`makeDealId` (diplomacy-proposals.ts ~163):** możliwe zduplikowane ID traktatów zawartych w tej samej turze między tymi samymi stronami — sprawdzić unikalność.
4. **`src/game/barbarians.ts` ~328:** limit obozów nie jest egzekwowany dla obozów wczytanych z save (legacy) — po wczytaniu może być ich ponad limit.
5. **Tura/ekonomia:** `empire-food.ts:113-121` — bez Spichlerza nadwyżka armii przepada (`zapasyPo>0→0`), ale deficyt (ujemny) zostaje zapisany w `st.zapasyPanstwa` — potwierdzić, że ujemne zapasy państwa są zamierzone (głód armii), a nie przenoszą się błędnie na kolejną turę.
6. **Niedeterministyczny seed:** `generator.ts:462` — gdy seed=0/undefined, losuje z `Date.now()`; upewnić się, że wylosowany seed jest ZAPISYWANY do save i odtwarzany przy wczytaniu (inaczej „ta sama gra" wygeneruje inną mapę).

---

## WERYFIKACJA PO NAPRAWACH (Definition of Done)

1. `npx tsc --noEmit` → **0 błędów**.
2. Test generatora (5 seedów × typy kontynenty/pangea/wyspy/ziemia, rozmiar mały + standardowy):
   - 0 głównych rzek, których ostatni hex nie sąsiaduje z oceanem połączonym z krawędzią mapy;
   - 0 heksów wody otoczonych w 100% suchym lądem;
   - czas: standardowa < 5 s, duża < 15 s;
   - ten sam seed → identyczna mapa (hash heksów).
3. Wizualnie (Gra-podglad PLAYTEST-MAPA): wybrzeża pustyni bez „zatoczek" wgryzających się w głąb; dopływy łączą się z głównym nurtem.
4. Smoke test bitwy polowej: rozstrzygnięcie remisowe nie crashuje i jest komunikowane.
