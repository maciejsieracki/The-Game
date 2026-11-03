STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB) — DIAGNOZA, zero zmian `gra/src`
TEMAT: R-WEB-AUTO-IMPROVE-BUDGET-UNSPENT-DIAG-Q1
GOAL: ustalic na dowodach, czy istnieje ogranicznik liczby ulepszen na miasto/inny parametr, przez ktory automat nie wydaje budzetu Pracy i zostawia pola bez ulepszen.
ZMIANY/COMMIT: nowe pliki: `gra/tools/auto-improve-unspent-diag.cjs`, `dyspozycje/autobot/runs/R-WEB-AUTO-IMPROVE-BUDGET-UNSPENT-DIAG-Q1/**` (ten raport, `tabela-przyczyn.md`, `evidence/`). Baza `23dd158e9`. SHA: patrz koniec.
RUNDY: 1/5

## ODPOWIEDZ: czy istnieje ogranicznik liczby ulepszen na miasto? NIE
- `maxItemsPerCity` domyslnie `Infinity` (`auto-improvements.ts:1094`, uzycie `:1542/:1555/:1990`); zaden wolajacy go nie podaje (gracz `main.ts:36303`, AI `ai.ts:2705`; grep `maxItemsPerCity *:` poza plikiem pickera = 0). Na zywo: `maxItemsPerCity: null` w kazdym wywolaniu gracza i AI. `FOOD_STAGE_MAX_ITEMS_PER_CITY = Infinity` (`:516`).
- `terrain-improvements.json`: zadnego pola `max*/limit*/na_miasto` (grep). Brak limitu tur/heksow na ture.
- Pula „100%” = `pula - 30` (rezerwa `AUTO_ULEPSZENIA_PRACA_RESERVE`, `:202`; na zywo `pct:100, reserve:30`); picker w ogole nie rusza przy puli <= 30 (`main.ts:36294`, `:1130`). Domyslny % to 33 (`cities.ts:229`).

## PRZYCZYNA GLOWNA (zmierzona): filtr „Tylko pola z obywatelami” — DOMYSLNIE WLACZONY
`DEFAULT_ULEPSZENIA_ONLY_WORKED = true` (`cities.ts:217`; decyzja wlasciciela „ZASADA 2”). Kandydaci = heksy pracowane (liczba obywateli) + zloza (`auto-improvements.ts:1425-1448`). Pole z obywatelem to ~pop z ~200-350 heksow terytorium.
Pomiar na zywo (tabela: `tabela-przyczyn.md`):
- Filtr ON (S1, S3, S9, S5): **89,9-91,9% heksow w moim terytorium odrzuca filtr obywateli**; ulepszone tylko 4-9%. Brak tech: 4,1% (S5, tylko techy naturalne); teren bez zastosowania: 0-1,2% (gory).
- S9b (miasto pop 12, pula 3000 jako fixture): po wydaniu ~2300 w 3 turach pula **rosnie 724 → 1289 w 19 turach** (netto +20..+92/ture), 321 z 357 heksow zablokowanych. To jest odtworzony objaw wlasciciela (ogromna pula, wolne pola).
- Filtr OFF (S2, S4, S12): automat wydaje wszystko (S12: 5692 z 6000, 85 ulepszonych heksow w 13 turach), pula spada do 0. S4b: po wyczerpaniu puli upkeep Pracy 32-37/ture trzyma ja przy 0 przez 19 tur, 180 z 199 heksow zostaje kandydatami. Poluzowanie filtra zamienia wiec „nadmiar puli” w „pula 0 + stale utrzymanie” — to decyzja produktowa.
- Sygnal dla gracza istnieje tylko jako 4-sekundowy toast (`main.ts:36461`), gdy brak kandydatow i brak niedoboru.

## PRZYCZYNY DODATKOWE (zmierzone / z kodu)
1. **Jeden etap na ture**: `auto-improvements.ts:883` (`break` po pierwszym etapie z pickami). S12 (pula 6000, OFF): 13 tur kolejno farma→wycinka→farma→trzoda→…→irygacja; kazde wywolanie = 1 etap. Pula nie jest ograniczeniem, tempo tak.
2. **Profil zdefiniowany waskoo**: Zywnosc/Rown. bez niedoboru = tylko zywnosc (`:88-107`, `:1341-1349`); trzoda tylko przy rzece (`:1791`); bez „Wolno wycinac las” 34,9% moich heksow nie ma zastosowania (las, S11).
3. **Niedobor zjada pule**: w Rown. niedobor jest aktywny stale (zob. R-WEB-LIVE-MEASURE-CLEARING-DEFICIT-Q1); S4: 786 Pracy w turze 1 na warzelnie x10/tartak x4/kamieniolom/kopalnie.
4. Surowce/Infra OFF: 31 / 98 heksow bez zastosowania (morze), pula 0 po 2 turach (S6, S7).
5. AI: bez limitu, 100% puli (`pool=cap`), pula 10-80 — wydaje przychod, nie gromadzi (30 tur). Przyczyny odrzucen heksow AI: NIE_ZMIERZONO.

## PARAMETRY DO ZMIANY / REKOMENDACJA (osobny temat; DECYZJA_WYMAGANA — ABC zadaje orkiestrator)
Pytanie produktowe: co ma robic automat, gdy nie ma kandydatow „przy obywatelach”, a pula rosnie?
- A) zostawic (stan dzis) + wyrazniejszy sygnal niz toast;
- B) **rekomendowane**: gdy `surplusReport.surplus` (brak kandydatow przy obywatelach i brak niedoboru) automat dopuszcza heksy bez obywatela w terytorium (zmiana: `auto-improvements.ts:1425-1448` + warunek w `main.ts:36303-36332`, `getOnlyWorked`), z pulapem np. wydatku do `pula - N x upkeep`;
- C) domyslne `false` (`cities.ts:217`) — cofa decyzje wlasciciela, wyczerpuje pule (S4b).
Niezalezny, opcjonalny temat: kaskada etapow w jednym wywolaniu (`auto-improvements.ts:883`: zamiast `break` kontynuowac po zarejestrowaniu pickow, z zachowaniem kolejnosci E1-E6).

TESTY: pomiar zywy 12 scenariuszy x 14-30 tur, 0 bledow strony (`errors: []`); kod gry bez zmian (brak bramek `gra/src` do uruchomienia; `node --check` harnessu OK). Fixture: techy, polityka, pop 1. miasta, pula. Hak tylko w kopii `main.ts`/`ai.ts` w scratch.
BLOKADY: brak. NIE_ZMIERZONO: drugi seed/swiat; AI per-heks; wplyw tech przy duzej puli i OFF.
POSPRZATANE: `gra/node_modules`, `/dev/shm/aiu-*`.
NASTĘPNY KROK: Evaluator (ten sam ID), potem Final Control; ABC dla wlasciciela (A/B/C).
DEPLOY/PUSH: NIE WYKONANO
