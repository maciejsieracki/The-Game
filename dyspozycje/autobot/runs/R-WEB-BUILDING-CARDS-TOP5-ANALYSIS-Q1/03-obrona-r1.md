STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB) — analiza, bez zmian w `gra/**`
TEMAT: R-WEB-BUILDING-CARDS-TOP5-ANALYSIS-Q1
ROLA: Operator (Obrona), runda 1/5
BAZA: commit Operatora 1902ab85b (gałąź `worktree-wf_9d690c14-e3b-1`); werdykt Evaluatora 415339a41 (PASS-WITH-NOTES, 4 zarzuty)

## Odpowiedzi na zarzuty

### Zarzut 1 — Spichlerz Królewski „zachowuje 70% zapasu żywności”: ODRZUCAM (efekt martwy) + PRZYJMUJĘ lukę kompletności

Dowód, że efekt nie działa w grze:
- Stała 0,7 jest tylko w `populationGrowth` (`gra/src/game/economy.ts:1107-1159`, linie 1150-1155).
- Grep `populationGrowth(` w `gra/src` znajduje wyłącznie definicję. Pozostałe trafienia to komentarze (`turn-economy.ts:1310,1314,2770`, `economy-upkeep.ts:173,190,209`). Funkcję woła tylko test `gra/tools/popcap-spichlerz2-akwedukt20-test.cjs:59-63`, opisany tam jako „legacy”.
- Żywy wzrost ludności to `applyFractionalGrowthV85` (`population-growth-v85.ts:306-342`). Woła ją `applyPostCentralPopulationGrowth` (`:567`), a tę tura w `main.ts:38297`. Ta ścieżka liczy ułamek wzrostu bez bufora żywności, więc nie ma czego zerować ani zachowywać.

Skutek, szerszy niż zarzut:
- Efekt Spichlerza I „zachowuje 50% zapasu”, który Operator miał w swoim Top3, też jest martwy. Evaluator w ślepym TOP również miał go jako `bufor_wzrostu`.
- Oba efekty przeniesiono do listy „ukryć do czasu naprawy” (`DEAD['spichlerz']`, `DEAD['spichlerz_ii']`).

Luka kompletności jest jednak realna. Dodano żywe premie Spichlerzy (`resolveSpichlerzCityBonusState`, `building-resource-gate.ts:451-470`):

| Premia | Spichlerz I | Spichlerz Królewski | Dowód |
|---|---|---|---|
| koszt racji | ×0,75 (−25%) | ×0,5 (−50%) | `building-resource-gate.ts:486-491`; `population-growth-v85.ts:206-223`; wołane w `turn-economy.ts:1671` |
| zdrowie | +5 | +10 | `building-resource-gate.ts:472-477`; `turn-economy.ts:2023` |
| wzrost ludności | +1% | +2% | `building-resource-gate.ts:479-484`; `population-growth-v85.ts:262-277` |

Wynik turnieju:
- Spichlerz: Top3 = −25% kosztu racji (40 pkt) w miejsce martwego bufora 50%.
- Spichlerz Królewski: Top2 = −50% kosztu racji, Top5 = +10 zdrowia. Ma teraz 5 pozycji zamiast 3.
- Top1 obu budynków bez zmian: limit ludności. Premia −50% racji dla Spichlerza Królewskiego ma SKALA 3, bo przyrost względem Spichlerza I to tylko 0,75 → 0,5.

### Zarzut 2 — Świątynia „+1 do szerzenia religii na sąsiednie miasta”: PRZYJMUJĘ

Dowody, że efekt działa:
- Wartość: `society-params.json:504-510`, `religia_swiatynia_bonus_szerzenia` = 2 / 1 / 0 (łatwy / normalny / trudny).
- Liczenie slotów: `culture-religion.ts:1064`, slots = baza + bonus Świątyni.
- Wywołanie w turze: `main.ts:37700` (`hasSwiatynia`) i `main.ts:37708-37712` (`spreadReligion`).
- Warunek: miasto musi mieć dominującą religię (`culture-religion.ts:1050-1053`). Zasięg to 3 heksy na poziomie normalnym (`religia_szerzenie_max_dystans`).

Nowa pozycja: „Religia sięga 2 sąsiednich miast na turę (zamiast 1)”, 37 pkt, Top2.
- Pewność ŚREDNIA: wartość jest pewna, ale efekt zależy od dominacji religii w mieście i na poziomie trudnym wynosi 0.

### Zarzut 3 — Targowisko, Top1 „+50% dochodu z tras” daje 0 bez trasy: PRZYJMUJĘ

Pomiar:
- Premia +50% (`econ-params.json:278-284`, `main.ts:4194-4198`) mnoży tylko dochód z tras.
- Dochód trasy lądowej to 1–8 pieniądza w zależności od dystansu (`econ-params.json`, `handel_szlaki.dochody_ladowe`). Miasto z Targowiskiem ma 2 sloty: bazowy i z budynku (`trade-routes.ts:944-949`).
- Typowa korzyść to więc +1 do +4 na trasę i tylko przy aktywnej trasie. Stałe +5 / 8 / 11 pieniądza (`buildings.json:303`, `production.ts:252-271`) działa od ręki.

Nowa reguła E1-B2:
- Efekt własny, który jest wart 0 bez stanu gry niezapewnianego przez sam budynek (flaga `war=True`), nie może być Top1, jeśli budynek ma efekt własny bez warunku.
- Reguła obejmuje też zamianę Pracy na podatek. Jest warta 0 bez nadwyżki Pracy i decyzji gracza, a AI z niej nie korzysta (`work-tax.ts:20`).
- Reguła działa w `gen.py` (`top1_eligible`, `order_top`). Plik turnieju zapisuje przesunięcie jawnie.

Skutki dla Top1:

| Budynek | Top1 przed | Top1 po | Zgodność z Evaluatorem |
|---|---|---|---|
| Targowisko | +50% z tras | +5 pieniądza (8 / 11) | zgodne |
| Port handlowy | +1 trasa | +5 pieniądza i +1 Pracy | zgodne |
| Emporion | slot trasy | +8 pieniądza | NOWA rozbieżność |

Uwagi do tabeli:
- Emporion: Evaluator miał tu `trasa_slot`. Zmiana wynika z konsekwentnego zastosowania tej samej reguły, którą Evaluator sam przyjął dla Targowiska i Portu. Ten Top1 rozstrzyga Final Control.
- Pretorium: ODRZUCAM zmianę Top1. −30% korupcji (`economy.ts:1225-1253`, wołane w `turn-economy.ts:2072,2668`) działa od ręki w każdym mieście poza stolicą, bo korupcja rośnie z dystansem i liczbą miast (`economy.ts:1219-1222`). Prawo 33 → 38 to tylko +5 pkt. Zostaje Top1 = −30% korupcji.

+2 zdrowia Targowiska (`turn-economy.ts:420,485`) zostaje na 6. miejscu. Przegrywa z „Warunkiem Mennicy” 27:29, który już jest przycięty regułą R-B1 (NOWA MECHANIKA = 0, ODCZUWALNOŚĆ ≤ 1).
- Jeśli właściciel w Q2 wybierze B (warunki poza TOP 5), +2 zdrowia wejdzie automatycznie. Opisuje to `NOTES['targowisko']`.

### Zarzut 4 — 22, a nie 23 ulepszenia terenu: PRZYJMUJĘ

- `gra/data/terrain-improvements.json` ma 24 klucze główne, w tym `_meta` i `_miasto_zasieg_ref`. Ulepszeń jest więc 22 (python `json.load`, policzone w tej rundzie).
- Poprawione w §11 `ANALIZA-KART-BUDYNKOW.md`: 22 pozycje, ~22 turnieje.

## Zmiany

Allowlista: `dyspozycje/analizy/karty-budynkow/**` oraz ten plik.
- `narzedzia/bldata.py`:
  - nowy parametr `war`;
  - flagi `war=True` dla Targowiska a/b/c, Portu a/c i Emporionu a;
  - Spichlerz: kandydaci c/f/g i DEAD dla bufora 50%;
  - Spichlerz Królewski: kandydaci d/e/f i DEAD dla bufora 70%;
  - Świątynia: kandydat c;
  - NOTES.
- `narzedzia/gen.py`:
  - alias `PG` (`population-growth-v85.ts`);
  - reguła E1-B2;
  - status „PROPOZYCJA OPERATORA r1 + OBRONA r1 — do Final Control”.
- Wygenerowane ponownie: `budynki-top5.csv`, `turnieje/*.md` (43 + README) oraz tabele §5–§8 w `ANALIZA-KART-BUDYNKOW.md`.
- Ręcznie w `ANALIZA-KART-BUDYNKOW.md`:
  - §1: E1-B2 i nowe liczby;
  - §5: nagłówek;
  - §11: 22 ulepszenia;
  - §12: rozstrzygnięcie Spichlerzy.

Statystyki generatora:

| Wskaźnik | Operator r1 | Po Obronie r1 |
|---|---|---|
| kandydaci | 121 | 127 |
| pojedynki | 149 | 174 |
| pozycje TOP | 120 | 123 |
| budynki z pełnymi 5 pozycjami | 5 | 6 |
| efekty martwe | 15 | 17 |

Bez zmian: 43/43 budynki, w tym 3 × NIE_USTALONO. Pomiar starego top3 też bez zmian (129 / 47 / 71 / 12 / 46).

## Testy

Wyniki z tej rundy, dla commita podanego w raporcie końcowym:
- `python3 -I dyspozycje/analizy/karty-budynkow/narzedzia/gen.py <worktree>`: przechodzi, asercje `check_ev` i 43/43 OK.
- `git diff --check`: czysto.
- CSV: BOM, 0 × CR, 43 wiersze, 16 kolumn.
- `gra/**`: brak zmian.
