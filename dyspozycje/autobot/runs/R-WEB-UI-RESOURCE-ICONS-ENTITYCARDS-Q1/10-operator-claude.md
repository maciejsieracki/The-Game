STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-UI-RESOURCE-ICONS-ENTITYCARDS-Q1
GOAL: wiersze kart encji (budynki, ulepszenia terenu, jednostki, technologie, cuda) pokazujące koszt/utrzymanie/wymagania surowców renderują ikonę + liczbę (resourceAmountChipHtml) zamiast nazw; nazwa surowca w title/aria-label; kontrakt wiersza rozszerzony typowanymi danymi, bez surowego HTML w textContent.
ZMIANY/COMMIT: baza origin/main cbfb12dc5 (detached). Kod i raport w jednym commicie (SHA w polu `sha` wyniku Operatora).

Allowlista (wyliczona przed edycją), wszystkie w worktree:
- gra/src/ui/entityCards/types.ts — nowy typ `EntityCardRowResource {id, amount?}`, pola wiersza `resources?` i `resourcesSuffix?`.
- gra/src/ui/entityCards/renderer.ts — `buildGridRowEl`: gdy `row.resources`, komórka wartości = text node (`value, `) + chipy z `resourceAmountChipHtml` (kwota przez `escapeHtmlText`) + sufiks jako text node; CSS `.entity-card-row-res` + `RESOURCE_CHIP_CSS` w `ENTITY_CARD_CSS`.
- gra/src/ui/resourceAmountChip.ts — eksport `escapeHtmlText`.
- gra/src/ui/entityCards/resourceRows.ts (NOWY) — `resourceIdFromName`, `resourcesFromList` (nazwa/odmiana/id z danych -> id; nie-surowce, np. „handel", zostają tekstem).
- gra/src/ui/entityCards/buildingAdapter.ts — „Surowce (jednorazowo)" i „Co turę" (utrzymanie) jako `resources` + sufiks; usunięty `formatUpkeepValue`/import `stockResourceLabel`.
- gra/src/ui/entityCards/unitAdapter.ts — „Koszt surowca", „Utrzymanie surowca/turę" (`unitResourceRow`).
- gra/src/ui/entityCards/improvementAdapter.ts — „Odblokowuje surowiec", „Produkcja surowca" (chip + „/ turę").
- gra/src/ui/entityCards/technologyAdapter.ts — „Dostęp do surowca" (Zmiany ekonomiczne), „Surowiec (wymóg badania)" (`resourceFields`).
- Testy: NOWE gra/tools/entity-cards-resource-icons-test.cjs (20), gra/tools/entity-cards-resource-icons-real-render-test.cjs (51, Chromium); ZMIENIONE (kontrakt wiersza się zmienił, intencja zachowana) gra/tools/improvement-adapter-resource-note-test.cjs, gra/tools/building-detail-card-entitycard-migration-test.cjs (asercja „Surowce (jednorazowo)").
- Dowody: dyspozycje/autobot/runs/R-WEB-UI-RESOURCE-ICONS-ENTITYCARDS-Q1/dowody/*.png (zrzuty realnych kart: stolarnia, Wojownik, tartak, Obróbka drewna).
Bez zmian mechaniki (zero zmian poza warstwą prezentacji kart). Zakazy §9 zachowane: bez `npm run build`/`dev`, bez `git add -A`, bez WERSJE.md. Efekt uboczny testów (przepisane PNG w cudzych runach) cofnięty `git checkout`.

TESTY (liczby z surowego wyjścia):
- `npx tsc --noEmit`: exit 0, brak błędów.
- Pięć bramek referencyjnych: logic-test 213 PASS / 0 FAIL; tech-tree-test 20 pass / 0 fail; research-test 33/33; unit-replace-test exit 0 (0 FAIL); combat-test exit 0 („All sanity checks passed").
- ids-leak-audit-test: 1648 ok, 0 FAIL. wonder-text-no-raw-ids-test: 132 ok, 0 FAIL.
- resource-icons-everywhere-test: 10 PASS. resource-icons-everywhere-render-test: 13 PASS. resource-amount-chip-icons-real-render-test: 29 PASS. improvement-adapter-resource-note-test: 77 pass (po aktualizacji asercji: 63/14 przed aktualizacją).
- NOWE: entity-cards-resource-icons-test: 20 pass / 0 fail (karty z danych: 75 jednostek, 41 budynków, 22 ulepszenia, 32 technologie, 19 cudów; 269 wierszy z chipami: unit 148, building 79, improvement 21, technology 21; zero gołych nazw surowców; 18 id surowców z realną ikoną SVG; escapowanie kwoty). entity-cards-resource-icons-real-render-test: 51 pass / 0 fail (Chromium; stolarnia, tartak, kopalnia_zelaza, Wojownik, Obróbka drewna + test XSS: `<img onerror>` w value/amount/suffix nie tworzy elementu ani nie wykonuje skryptu).
- Regresje sąsiednie: entity-card-contract-test 75/0; civpedia-caly-wiersz-przyciskiem-test 85/0; improvement-era-scaling-test 144/0; karta-technologia-uklad-real-render-test 11/0; building-card-overlap-real-render-test 21/0; entity-card-diorama-real-render-test 0 FAIL.
- Pre-existing (identyczne na czystym origin/main, zmierzone przed zmianą): building-detail-card-entitycard-migration-test 1 FAIL „dopełnia sekcję Uwagi (playerFacingNote)" (po zmianie 54 pass / 1 fail — ta sama asercja); building-cards-top5-test 1 FAIL (generator --check); wyrab-wycinka-nazwa-live-test 1 FAIL [11] (farm-assign-hint.ts:51); building-cost-resource-availability-test i citypanel-tech-tile-dead-effects-test exit 1 na czystym main. Niezmienione, nie naprawiane przy okazji.

BLOKADY: brak. Oryginalny `00-dispatch.md` nie istnieje w origin/main (git show -> brak ścieżki; na gałęzi claude/sprawdzenie-funkcjonalnosci-ek4ra0 jest tylko DODATEK) — przyjęto GOAL/KRYTERIA z DODATKU.

ZAŁOŻENIA / NOTATKI (do Evaluatora):
1. Zakres = wiersze kosztu, utrzymania, wymagań i „odblokowuje/dostęp do surowca". Wiersze PLONÓW/bonusów (np. „Żywność", „Kamień +2" w ulepszeniach i cudach, BONUS_LABEL) zostają tekstem — to osie plonów jak Praca/Nauka, nie pozycje magazynu; Żywność świadomie wyłączona z KNOWN w resourceRows.
2. Kontrakt: `value` pozostaje zwykłym tekstem (prefiks, np. „2 Pieniądze"), `resources` = dane, `resourcesSuffix` = tekst po chipach. Złoto (Pieniądz) w utrzymaniu budynku zostaje tekstem „N Pieniądze" (nie jest surowcem magazynu).
3. Zmieniono 2 istniejące testy (asercje o dawnym tekście „Drewno"/„50 / turę"/„— z magazynu państwa" w `value`) na asercje o danych `resources` z tą samą intencją; improvement-note nadal pilnuje braku notatek deweloperskich.
4. `legacyActionRows` w technologyAdapter (fallback „Sprawdź dostęp do surowca: …") to martwa ścieżka (0/32 wg komentarza) i proza — nietknięta. Proza z JSON (tech-cards-top5.json, opisy) poza zakresem.
5. „Produkcja surowca" w ulepszeniu: chip tylko gdy `surowiecOdblokowany` rozwiązuje się do dokładnie jednego surowca (wszystkie 21 przypadków z danych), inaczej tekst „N / turę".
6. Tryb „sama ikona" (bez liczby) dla „Odblokowuje surowiec" / „Dostęp do surowca" — nazwa w title/aria-label; jeśli właściciel woli liczbę lub nazwę obok, to osobna decyzja produktowa.
7. Panel miasta (cityPanel.ts) i panel imperium nie były w zakresie (zrobione w poprzednich tematach).

RUNDY: 1/5
NASTĘPNY KROK: Evaluator (Sonnet) — zarzuty numerowane; weryfikacja wizualna zrzutów w dowody/.
DEPLOY/PUSH: NIE WYKONANO
