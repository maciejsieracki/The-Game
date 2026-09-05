# P-AI-NIE-STAWIA-BUDYNKOW-Q1 — Operator, OBRONA do RUNDY 2

STATUS: PASS
DOMAIN: GAME
TEMAT: `P-AI-NIE-STAWIA-BUDYNKOW-Q1`
GOAL: odpowiedzieć na 3 zarzuty Evaluatora R2 dowodem z wytworu i naprawić przyjęte,
bez naruszenia Decyzji 1/2 ratyfikacji i bez naruszenia gwarancji barbarzyńskiej
ZMIANY/COMMIT: `9d44d235` (praca + raport) + ten commit korygujący pole SHA — `gra/src/main.ts`, `gra/tools/ai-buduje-budynki-test.cjs`,
`dyspozycje/autobot/runs/<ID>/**` (allowlista dispatchu; `empire-city-defaults.ts`,
`ai.ts`, `owner-utils.ts`, `cities.ts`, `auto-manage.ts` NIETKNIĘTE)
MODEL+EFFORT: Opus 5, effort high · BAZA `2c9cd69b` potwierdzona `git log -1` przed pracą
RUNDA: 2/5 (obrona nie zwiększa licznika)
TESTY: `tsc --noEmit` (5.9.3) **0 błędów** · `ai-buduje-budynki-test` **PASS=42 FAIL=0**
(było 39; 4 buildy, 4 przebiegi Chromium) · FIX 12/7/**0**/1 pokrycie **5/5**, MUT-B
12/7/**1**/1 — liczby CO DO JEDNEGO jak w R2, więc hak diagnostyczny nie perturbuje świata ·
roundtrip legacy FIX `gracz=["reczny"] duzeAI=["zrownowazone"] PM=["zrownowazone"]`,
MUT-C `gracz=["zrownowazone"]` (A10 dalej nietautologiczna) · referencyjne 213/213, 19/19,
33/33, 13/13, 6/6 · empire-city-defaults 53/0, auto-manage 45/45, barb-city-behavior 178/0,
barb-city-owner-contract 3/3, city-orderstate-restore-clear 9/0, budowa-lista-szablony 11/0,
ai-improvements 52/0, production-overflow 201/0 · barb-city-capture-cluster 92/1 —
czerwień parytetowa bez zmian (dług przed-istniejący)
BLOKADY: brak
NASTĘPNY KROK: Final Control na tym samym ID
DEPLOY/PUSH: NIE WYKONANO

## OBRONA

**Zarzut 1 — komentarz-nośnik w `initOwnerDefaultCityFields` → PRZYJMUJĘ.** Trafny co do
litery. `main.ts:4829-4830` (przed poprawką): „Gracz (0), barbarzyńcy (-1) i rebelianci
(-99) zostają na 'reczny'", a `main.ts:4803` woła
`freshOwnerDefaultBudowaProfilForOwner(0, isBarbarian)`, którego kod brzmi
`if (ownerId < 0 || isBarbarianOwner(ownerId)) return freshOwnerDefaultBudowaProfil();`
→ dla 0 zwraca `AI_DEFAULT_BUDOWA_TRYB`. Komentarz kłamał na ścieżce SEED, czyli tam, gdzie
ECHO „gracz też startowo auto" jest wiążące. Przeczesałem CAŁY obszar
(`grep "zostają na 'reczny'|Gracz (0)|gracz: bez zmian" gra/src/`): to był **jedyny**
pozostały nośnik — komentarz w samym `seedCityOwnerDefaults` (`:4855+`) i docstring
(`empire-city-defaults.ts:376-378`) mówią prawdę. Poprawione: komentarz nazywa teraz seed
(gracz 0 → AUTO), 'reczny' wyłącznie ownerom ujemnym, a wyjątek dla ownera 0 wskazuje
jako żyjący WYŁĄCZNIE w migracji wczytania (Decyzja 1). Zero zmian w logice.

**Zarzut 2 — regresja pokrycia ECHO „gracz też startowo auto" → PRZYJMUJĘ.** Zarzut jest
trafny w rdzeniu: po wycofaniu A4c i przeformułowaniu A4b żadna asercja nie mierzyła
globalnego defaultu ownera 0 w nowej partii, a mój komentarz w bramce (`:607-609`) opierał
się na złożeniu A4+A6 — to wnioskowanie, a temat sam zakazał dowodu z deklaracji.
Przyjmuję też diagnozę Evaluatora, że perturbacja świata jest tu niedopuszczalna (dodatkowe
przejęcie psuło A7 5/5 → 6/9). Naprawa dokładnie wg jego wskazania, ale mierzy o jedno
więcej: `dumpBuildings()` (`main.ts`) wystawia **read-only** `ownerDefaultBudowaTryb`
(`Array.from(ownerDefaultBudowaProfil.entries())`) — to ta sama wartość, którą
`seedCityOwnerDefaults` kopiuje do miasta i przy ZAŁOŻENIU, i przy PRZEJĘCIU, czyli
wspólne WEJŚCIE obu połówek ECHO. Trzy nowe asercje, wszystkie zielone, zero dodatkowych
przejęć (odczyt z istniejących snapshotów `t0` i `tLoad`):
- **A4d** — w turze 0 globalny default ownera 0 jest AUTOMATYCZNY (pomiar, nie wniosek);
- **A4d-b** — w turze 0 KAŻDY owner `>0` auto, KAŻDY owner ujemny `'reczny'`;
- **A4e** — po roundtripie legacy owner 0 to `'reczny'`, ownerzy `>0` auto, ownerzy ujemni
  `'reczny'` — dzięki temu A4b mierzy skutek Decyzji 1, a nie przypadkowy stan.
DOWÓD, że hak nic nie zmienił: FIX 12/7/0/1 i pokrycie 5/5 co do jednego jak w R2; MUT-B
12/7/**1**/1; MUT-C `gracz=["zrownowazone"]` wobec FIX `["reczny"]`. **Gwarancja
barbarzyńska: A4d-b i A4e dokładają pomiar OBU nośników na poziomie globalnego defaultu**
(seed w turze 0 oraz migracja po wczytaniu) — obok istniejących A3/A3b/A3c i M4/M5.

**Zarzut 3 — `git diff --check` → PRZYJMUJĘ.** Zweryfikowane samodzielnie:
`git diff --check origin/main...HEAD` zwracało
`01-operator-runda1-ZALACZNIK-bramki.md:81: new blank line at EOF` (exit 2). Usunąłem pustą
linię; po poprawce `git diff --check origin/main` → **exit 0, zero trafień** na całej gałęzi.

DO DECYZJI CZŁOWIEKA: brak — żaden z 3 zarzutów nie zależał od nierozstrzygniętej intencji.
Trzy rozstrzygnięcia właściciela (migracja pomija ownera 0; seed daje graczowi auto; praca
gracza nie wraca do puli ulepszeń) przyjąłem jako wiążące i żadnej z nich nie podważam.

## POZA OBRONĄ (nie naprawiam, zgłaszam)

Węższy zakres bramek AI/miast niż 117 z rundy 1 — zgodnie z notatką Evaluatora zostawiam
lukę widoczną dla Final Control. Uruchomiłem 8 bramek AI/miast pokrywających ścieżki
dotknięte tą pracą (seed, wczytanie, barbarzyńcy, budowa) plus 5 referencyjnych.
