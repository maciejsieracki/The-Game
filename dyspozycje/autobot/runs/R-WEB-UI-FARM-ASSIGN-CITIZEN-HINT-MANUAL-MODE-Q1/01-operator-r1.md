STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-UI-FARM-ASSIGN-CITIZEN-HINT-MANUAL-MODE-Q1
GOAL: W trybie RĘCZNYM (okolicaTryb === 'reczny') po powstaniu pola z ulepszeniem dającym plon w zasięgu miasta, gdy są wolni obywatele lub obsadzone pola są gorsze — gracz dostaje jedną podpowiedź „Przydziel obywatela?” na miasto na turę (panel Wydarzenia); znacznik „Tryb ręczny” w karcie miasta i na liście miast. Tryb autonomiczny, AI i przydział automatyczny bez zmian.
BAZA: origin/main = dcca72b78 (HEAD worktree = main).
ZMIANY/COMMIT: kod i test w commicie operatora r1 (SHA w raporcie końcowym).
Allowlista r1:
- gra/src/game/farm-assign-hint.ts (NOWY: czysta logika podpowiedzi, lista ulepszeń, etykiety PL, wpis panelu)
- gra/src/main.ts (import; pętla koniec tury po wpisie rationAutoEventLog: tylko właściciel HUMAN_OWNER_PRIMARY, jeden wpis na miasto na turę; manualTryb w buildPlayerCityListEntries)
- gra/src/ui/cityListHud.ts (pole manualTryb, plakietka „Tryb ręczny”)
- gra/src/ui/cityPanel.ts (znacznik „Tryb ręczny” w nagłówku „Zarządzanie polami”, tylko w trybie ręcznym)
- gra/tools/farm-assign-citizen-hint-manual-test.cjs (NOWY test)
- dyspozycje/autobot/runs/R-WEB-UI-FARM-ASSIGN-CITIZEN-HINT-MANUAL-MODE-Q1/01-operator-r1.md

ZAŁOŻENIA (luki rozstrzygnięte w dispatchu, bez pytań ABC):
1. „Nowe pole” = nieobsadzone pole z ulepszeniem z listy plonowej w zasięgu miasta (brak trwałego stanu „nowości” w zapisie; pola do save nie dodawano). Podpowiedź znika po przydziale albo gdy warunek przestaje być spełniony; wpis żyje jedną turę (istniejąca logika event-lifetime).
2. Lista ulepszeń: farma, bydlo (Trzoda), owce, lama, irygacja, tarasy, wyrab, tartak, lodzie_rybackie. Kopalnia nie ma klucza w auto-improvements, więc nie jest objęta.
3. Warunek: wolny obywatel (pop − obsadzeni > 0) LUB najlepsze nieobsadzone pole daje wyższy score (tileScore, wagi profilu) niż najgorsze obsadzone pole. Score jak w auto-przydziale (yieldOfMapHex z epoką właściciela).
4. Przycisk: wpis panelu jest tekstowy („Otwórz miasto → Zarządzanie polami”), bez przycisku akcji — SidePanelEvent nie ma pola akcji; dodanie przycisku poza allowlistą.
5. Kategoria zakładki: tytuł „Przydziel obywatela?” nie trafia w reguły sidePanelEventTabs → zakładka „Inne”. Reguł klasyfikacji nie zmieniano.
6. Właściciel pola: hex.wlasciciel null lub równy właścicielowi miasta.
7. Znacznik na liście miast: plakietka „Tryb ręczny” (wariant blue) obok „stolica”.

ZMIANY (kod):
- farm-assign-hint.ts: farmAssignHintFor(city, map, yieldOf, isWorkable?) → FarmAssignHint | null; buildFarmAssignHintSidePanelEvent(); farmAssignHintEventId(cityId, turn) (jeden wpis na miasto na turę); MANUAL_MODE_BADGE_TEXT.
- main.ts: po obsłudze auto-rationu (koniec tury) pętla po `cities` dla ownerId === HUMAN_OWNER_PRIMARY; pominięcie gdy wpis o tym id już jest w warEventLog; warEventLog.unshift(stampEventTurn(...)). manualTryb: c.okolicaTryb === 'reczny' w buildPlayerCityListEntries.
- cityListHud.ts: CityListEntry.manualTryb; badges.push({ text: 'Tryb ręczny', variant: 'blue' }).
- cityPanel.ts: w headEl („Zarządzanie polami”) span.okolica-manual-badge gdy tryb === 'reczny' (title z wyjaśnieniem braku auto-przydziału).
- Auto-przydział, AI, okolica.ts, zasady AI: NIE ZMIENIANE.

TESTY (gra/, bez build/dev; node_modules wypożyczone symlinkiem z sąsiedniego worktree na czas testu, usunięte przed commitem):
- tools/farm-assign-citizen-hint-manual-test.cjs: 16 passed, 0 failed.
- terrain-improve-farm-availability-test: 36 passed, 0 failed
- citizen-auto-assign-farm-river-test: 11 passed, 0 failed
- auto-improvements-test: 46 passed, 0 failed
- ai-citizen-hex-sibling-exclusion-test: 19 OK, 0 FAIL
- tsc --noEmit (gra/tsconfig.json): wynik przefiltrowany na dotknięte pliki — brak trafień; pełny wynik NIE_ZMIERZONO.
- Chromium / weryfikacja wizualna w przeglądarce: NIE_ZMIERZONO (test to logika + analiza źródeł, nie DOM).

BLOKADY: brak techniczny. Otwarte do decyzji właściciela (nie blokuje kodu): czy podpowiedź ma mieć przycisk akcji (wymaga rozszerzenia SidePanelEvent) i czy „Przydziel obywatela?” ma trafiać do „Ważne”.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (runda 1), potem Final Control. Integracja i deploy wyłącznie po READY_FOR_DEPLOY.
DEPLOY/PUSH: NIE WYKONANO
