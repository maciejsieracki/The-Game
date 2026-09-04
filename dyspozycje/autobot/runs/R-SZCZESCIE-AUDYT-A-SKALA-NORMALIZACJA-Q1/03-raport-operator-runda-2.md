# R-SZCZESCIE-AUDYT-A-SKALA-NORMALIZACJA-Q1 — raport Operatora, runda 2/5

STATUS: PASS
DOMAIN: GAME
TEMAT: R-SZCZESCIE-AUDYT-A-SKALA-NORMALIZACJA-Q1 (węzeł A z pięciu)
MODEL+EFFORT: Opus 5, effort high
ROLA: Operator
DATA: 2026-09-04

GOAL (bez zmian wobec `00-dispatch.md`): maksimum szczęścia i prawa (mianownik
procentu) skaluje się z rozwojem miasta, nie wyłącznie z epoką; parametry strojone
z pliku danych. Runda 2 realizuje wyłącznie jedną poprawkę TESTU po `FAIL`
Final Control (zarzut 6) — bez zmiany modelu.

## ZMIANY/COMMIT

Jeden plik z allowlisty: `gra/tools/szczescie-skala-normalizacja-test.cjs` (sekcja 9)
plus artefakty runu. `gra/data/society-params.json`, `society-breakdown.ts` i `order.ts`
**nietknięte** — `git diff d37396f5 -- gra/data/society-params.json` pusty.

## CO BYŁO WADLIWE

Asercja sekcji 9 ustawiała naraz `hasDworZarzadcy: true` i `hasPretorium: true` —
dwa poziomy tego samego łańcucha zastępowania. Przegląd całego bloku wykazał, że były
tam **trzy** niemożliwe kombinacje naraz, nie jedna:

1. Dwór Zarządcy + Pretorium — ten sam łańcuch (`buildings.json`: `pretorium.upgradeFrom = dwor_zarzadcy`);
2. Pałac III + Pretorium — `palac*.lokalizacja = "stolica"` vs `pretorium.lokalizacja = "region"`, rozłączne twardo w `production.ts:489-490`;
3. Pałac III / Pretorium / Sąd (`epokaWejscia: 3`) postawione w epokach 1 i 2.

Asercja przechodziła tylko dlatego, że sumowała Prawo z trzech wykluczających się źródeł.

## CO ZROBIONO

Sekcja 9 zastąpiona dwoma **rozłącznymi** wariantami miasta, w każdym administracja
faktycznie dostępna w danej epoce, plus 5 kotwic w `buildings.json`, które uzasadniają
ten podział i zaczerwienią bramkę, gdyby dane przestały być rozłączne.

## REALNE WARTOŚCI PRAWA — pop 12, garnizon 5, administracja epoki

`netto / prawMax = PrawPct`:

| wariant | trudność | epoka 1 | epoka 2 | epoka 3 |
|---|---|---|---|---|
| stolica (Pałac I / II+Trybunał / III+Trybunał+Sąd) | easy | 170/69 = 100% | 205/103,5 = 100% | 243/138 = 100% |
| stolica | normal | 135/74,5 = 100% | 162/111,75 = 100% | 191/149 = 100% |
| stolica | hard | 88/80,5 = 100% | 109/120,75 = **90,3%** | 133/161 = **82,6%** |
| region (Dom Starszyzny / Dwór+Trybunał / Pretorium+Trybunał+Sąd) | easy | 161/69 = 100% | 190/103,5 = 100% | 222/138 = 100% |
| region | normal | 128/74,5 = 100% | 150/111,75 = 100% | 174/149 = 100% |
| region | hard | 82/80,5 = 100% | 99/120,75 = **82%** | 120/161 = **74,5%** |

Wniosek zastępujący obalone „domyka do 100% zawsze": próg **wymaga** administracji,
ale jej nie odcina — easy i normal domykają Prawo do 100% w obu wariantach i wszystkich
epokach; hard już nie (min 74,5%), co jest zamierzoną różnicą trudności.

Liczba 91,9% z werdyktu Final Control nie odtwarza się z opisanej tam konfiguracji
(daje 100%, netto 164/161); wychodzi dla tego samego zestawu **bez Sądu**
(148/161 = 91,9%). Ta konfiguracja i tak łamie punkt 2 powyżej, więc nie użyto jej
jako wartości oczekiwanej.

## TESTY

- `node ./node_modules/typescript/bin/tsc --noEmit` — **zielone** (exit 0).
- `node tools/szczescie-skala-normalizacja-test.cjs` — **132 OK, 0 FAIL** (było 110; sekcja 9: 3 asercje → 25).
- Nietautologiczność: mutacja `prawo_pretorium.normal 38→10` i `prawo_palac_iii.hard 44→10` → **128 OK, 4 FAIL** (czerwienieją dokładnie nowe asercje); dane przywrócone, diff pusty.
- 16 bramek społeczeństwa/porządku: 15 zielonych — `border-march-scan` 15/15, `border-march-wygasanie` **22/4 FAIL**, `building-happiness` 8/8, `city-orderstate-restore-clear` 9/9, `diplomacy-border-march` 43/43, `happiness-breakdown` 38/38, `porzadek-panel-czytelnosc` 81/81, `prawo-palac-tier` 30/30, `prawo-siatka-v2` 55/55, `r-wzrost-szczescie-dubel` 52/52, `society-breakdown` 43/43, `szczescie-skala-normalizacja` 132/132, `szczescie-zamoznosc` 60/60, `territory-border-dense-settlement` 15/15, `territory-border` 9/9, `war-happiness-parity` 18/18.
  `border-march-wygasanie-test` daje **identycznie 22 pass / 4 fail na czystej bazie** (sprawdzone przez `git stash` mojego jedynego pliku) — wada zastana, nie regres tej rundy.
- 5 bramek referencyjnych bez regresu: logic **213/213**, tech-tree **19/19**, research **33/33**, unit-replace **13/13**, combat **6/6**.

## BLOKADY

Brak blokad technicznych. Dwie noty procesowe:

1. `00-dispatch.md` **nie zawiera** zapowiedzianej sekcji „RUNDA 2 — poprawka po Final Control"
   (potwierdzone `grep`, drzewo czyste, brak zmian niezacommitowanych). Pracowano
   z treści promptu; GOAL i ID zgodne z dispatchem. Zgłaszane jako rozjazd źródeł
   (`R-PROC-AUTOBOT.md` §16a pkt 9, §13a).
2. Sekcja 4 bramki zawiera tę samą klasę błędu (siatka miesza stolicę z regionem i stawia
   budynki przed ich epoką). **Świadomie nie ruszona**, bo to z tej siatki pochodzi liczba
   12,0 p.p. będąca treścią zarzutu 1 (`DECISION_REQUIRED` u właściciela) — zawężenie
   zmieniłoby liczbę, o której właściciel właśnie decyduje. Zmierzone na boku, bez
   dotykania bramki: po odsianiu niemożliwych profili (7680 → 4176) urwisko pop 4→5 daje
   **10,0 p.p. zamiast 12,0**, a własny wkład skalowania **5,0 zamiast 5,4 p.p.** (limit 8).
   **Urwisko jest realne, nie jest artefaktem** — przeżywa zawężenie. Zawężenie siatki
   proponuję jako osobną pozycję po rozstrzygnięciu zarzutu 1.

Pełny przegląd sekcja po sekcji: `dowody/przeglad-niemozliwych-konfiguracji.md`.

## RUNDY

2/5.

## NASTĘPNY KROK

Evaluator (Opus 5, effort high), następnie Final Control — weryfikacja zarzutu 6.
Zarzut 1 pozostaje `DECISION_REQUIRED` u właściciela, poza zakresem tej rundy.

DEPLOY/PUSH: NIE WYKONANO
