# AUDYT DOKUMENTACJI — FALA 291–294

**Data audytu:** 2026-08-18
**Baza audytu:** ROBOCZA FALA 294, md5 skrócone `a0f804d7`, pełne
`a0f804d7593333e34c989dc3565cb0c6`
**Drzewo dokumentów:** branch `cursor/integrate-unit-card-3d-0f9b`, HEAD
`e39c07c8`
**Zakres:** wyłącznie audyt i korekta dokumentacji; bez zmian w `gra/src`,
`gra/data`, bundlach i deployu.

## 1. Werdykty zbiorcze

| Obszar | Stan na 2026-08-18 | Dowód |
|---|---|---|
| FALA 291 | wdrożona, tematy zamknięte po PASS lub PASS-WITH-NOTES | `WERSJE.md`, md5 `13b771f4`, VERIFY OK |
| FALA 292 | zastąpiona korektą FALI 293 | `WERSJE.md`, md5 `90b6508d` → `8fa80b7c` |
| FALA 293 | wdrożona, domyka split Pracy | `WERSJE.md`, md5 `8fa80b7c`, VERIFY OK |
| FALA 294 | wdrożona, dwa niezależne popupy | `WERSJE.md`, md5 `a0f804d7`, VERIFY OK |
| Design/Civpedia/Wikipedia | poza tym audytem i poza implementacją FALI 291–294 | wpisy FALI 292/294, brief Designera |
| Zmiany kodowe w toku | karta jednostki 3D; osobny branch, bez deployu | `P-JEDNOSTKI-KARTA-3D-INFO-Q1` |

FALA 292 nie jest osobnym stanem do dalszej integracji: jej niepełny split
został skorygowany i opublikowany w FALI 293. Nie należy ponownie otwierać
tematu tylko dlatego, że starszy wpis rejestru opisywał stan FALI 292.

## 2. ABC i ECHO — decyzje oraz odpowiedzi

### Potwierdzone decyzje

| ID | ECHO / odpowiedź | Skutek i stan |
|---|---|---|
| `R-CYWILIZACJE-EPOKA-PULA-Q1` | **A** — pula per epoka jest twardym sufitem; mapy już na suficie bez zmian; dodatkowo +1 miasto-państwo na każdym rozmiarze mapy | FALA 291, PASS, test `map-scale-menu` 97/97 |
| `P-EPOKA-BRAZU-ODKRYCIE-KOMUNIKAT-Q1` | **C** — po odkryciu technologii awansu pełna karta technologii; bez anulowania badań/tury i bez związku z triumfem miast-państw | FALA 294, logiczne bramki PASS; nota środowiskowa Chromium |
| `P-PODBOJ-MIAST-PANSTW-TRIUMF-POPUP-Q1` | **A** — ceremonialny popup po ostatnim aktywnym mieście-państwie tego samego klucza kultury; bez zmiany mechaniki Brązu | FALA 294, testy 13/13 i 16/16 |
| `P-PRACA-SPLIT-FALA292-NIEPEŁNY-Q1` | ECHO/kontrakt właściciela: cała pula Pracy = 100%; ulepszenia maks. 50%, reszta budynki; gracz/AI/MP, kolejki, overflow, save i override | korekta FALI 293, PASS, `doBudynkow` faktycznie konsumowane |
| `R-PRACA-LIMIT-50-PROC-WSPOLNY-WOREK-Q1` | bez osobnej litery ABC; bezpośrednia reguła limitu 50% | FALA 291; pełny routing domknięty w FALI 293 |
| `R-NAUKA-LIMIT-60-PROC-BUDZETU-Q1` | bez osobnej litery ABC; bezpośrednia reguła maks. 60% całego budżetu Pracy, także dla AI | FALA 291, PASS, 46/46 nowych testów |
| `P-JEDNOSTKI-KARTA-3D-INFO-Q1` | ECHO 2026-08-18: generyczna karta z Hastati jako wzorcem, prawdziwe dane i slot modelu 3D | w toku, bez decyzji o balansie/modelach/linkach |

### Decyzje unieważnione lub rozdzielone

`P-EPOKA-BRAZU-KOMUNIKAT-PODBOJ-MIAST-Q1` pozostaje historycznie zachowane,
ale jest zastąpione dwoma osobnymi ID. Nie wolno zadawać ponownie pytania
o połączenie tych zdarzeń ani traktować jednego jako warunku drugiego.

`P-TECHNOLOGIA-POPUP-KARTA-ODKRYCIA-Q1` jest nadal propozycją ogólnego
wzorca i czeka na akceptację prototypu oraz rozstrzygnięcie rozbieżności
źródeł danych (12 vs 20 jednostek, „Popalnia brązu”). Nie jest to sprzeczne
z wdrożeniem konkretnego, zatwierdzonego wycinka Brązownictwa w osobnym
ID `P-EPOKA-BRAZU-ODKRYCIE-KOMUNIKAT-Q1`.

## 3. Tematy wdrożone w FALACH 291–294

### FALA 291 — osiem tematów

1. `R-PRACA-LIMIT-50-PROC-WSPOLNY-WOREK-Q1` — limit ulepszeń 50% budżetu.
2. `R-NAUKA-LIMIT-60-PROC-BUDZETU-Q1` — limit Nauki 60%, gracz i AI.
3. `R-MIASTA-LIMIT-PER-EPOKA-Q1` — baza w Kamieniu, +5 w Brązie,
   +10 w Żelazie, z widocznym ustawieniem.
4. `P-CHATKI-NAGRODY-TOGGLE-USTAWIENIA-Q1` — toggle w kreatorze,
   wyłączenie oznacza brak generowania chatek.
5. `R-CYWILIZACJE-EPOKA-PULA-Q1` wraz z `R-CYWILIZACJE-DOSTEPNE-PER-MAPA-PLUS-JEDEN`
   i `R-CYWILIZACJE-SUPER-HUGE-KAMIEN-Q1` — twardy sufit epoki, +1 tam,
   gdzie jest zapas, oraz +1 miasto-państwo.
6. `R-NOWE-MIASTO-AUTOWYZYWIENIE-DOMYSLNIE` i
   `R-NOWE-MIASTO-AUTOBUDOWA-ZROWNOWAZONA-DOMYSLNIE` — nowe miasto ma
   automatyczne wyżywienie oraz tryb zrównoważony.
7. `P-CYNA-BRAK-WIZUALIZACJI-3D-NA-MAPIE` — dedykowany model 3D kopalni
   cyny i wizualizacja surowego złoża.
8. `R-WYRAB-KOSZT-PRACA-5P-Q1` — baza 2,5 jednostki Pracy przy mnożniku ×2,
   czyli widoczny koszt 5 P.

Werdykt: wszystkie osiem tematów zamknięte; `R-WYRAB...` ma
PASS-WITH-NOTES z notą o doborze właściwego testu przez Operatora, pozostałe
tematy mają PASS zapisany w handoffach/rejestrach.

### FALA 292 — integracja paczek

Zintegrowano zatwierdzone paczki: split Pracy (jeszcze niepełny), blacklist
obozów, mgłę i pamięć AI, rekrutację za Skarbiec, bazowe plony, bramkę
widoczności miasta, bilans dyplomacji, stale highlight cudu, mixed stack,
podsumowanie bitwy i rejestrację sceny. FALA 292 ma status historyczny
**ZASTĄPIONA**; pełny split opisuje i dowozi FALA 293.
Włączona w tę falę mgła AI jest jednak wdrożona i nadal obecna w aktualnej
ROBOCZA: własna widoczność per owner, pamięć celów, blokada akcji bez
ponownego wykrycia oraz save/load. Dowód: `ai-fog-test.cjs` 8/8,
`bitwa-mapa-kamera-blokada-test.cjs` 24/24, `npx tsc --noEmit` PASS,
Evaluator **PASS-WITH-NOTES**, a manifest aktualnej ROBOCZA FALI 294
(`a0f804d7593333e34c989dc3565cb0c6`) przechodzi `VERIFY OK`.

### FALA 293 — korekta splitu Pracy

`doBudynkow` jest konsumowane przez kolejki gracza, AI i miast-państw;
limit 50% obejmuje całą pulę Pracy, a UI pokazuje zakres 0–50%.

### FALA 294 — dwa niezależne popupy

- `P-EPOKA-BRAZU-ODKRYCIE-KOMUNIKAT-Q1=C` — pełna karta Brązownictwa
  po odkryciu, Escape/zamknięcie, brak anulowania badań i tury.
- `P-PODBOJ-MIAST-PANSTW-TRIUMF-POPUP-Q1=A` — ceremonialny popup po
  ostatnim aktywnym mieście-państwie właściwej kultury, z ochroną przed
  duplikacją.

## 4. Werdykty Evaluatorów

### PASS / PASS-WITH-NOTES

- FALA 291: tematy zamknięte po PASS; kopalnia cyny zweryfikowana renderem
  headless; limity, miasta, chatki i pula cywilizacji mają bramki tematyczne.
- `R-WYRAB-KOSZT-PRACA-5P-Q1`: PASS-WITH-NOTES — Operator wybrał test
  bookkeepingu, a właściwą bramkę `grupa-b-lane-test.cjs` znalazł dopiero
  Evaluator; zmiana jest poprawna.
- FALA 292: paczki zintegrowane, bramki tematyczne zielone; brak zmiany
  algorytmu generatora mapy.
- FALA 293: tsc, logic, split Pracy, overflow, auto, AI, percent, wiring
  oraz VERIFY OK.
- FALA 294: tsc, tech-tree 19/19, research 33/33, era toast 7/7 +
  mutacje 8/8, triumph 13/13, notice 16/16, VERIFY OK.

### FAIL / NEEDS_FIX / ograniczenia

- Nie ma potwierdzonego funkcjonalnego FAIL dla wdrożonych tematów FALI
  291–294. FALA 294 ma **niezrealizowany test środowiskowy Chromium**
  (brak executable), więc zapisujemy `PASS-WITH-NOTES`, a nie udajemy
  pełnego PASS live.
- `map-gen-regression-test.cjs` był pomijany w FALACH 291–293 z powodu
  znanego limitu wydajności sandboksa; przy zmianach tych fal nie ruszano
  algorytmu generatora terenu.
- Znaleziska Evaluatorów pozostawione jako osobne NEEDS_FIX/OTWARTE nie
  są częścią FALI 294 i nie powinny być dopisywane do jej zakresu.

## 5. Gotowe do integracji / osobna kolejka

| Temat | Stan | Co dalej |
|---|---|---|
| `P-JEDNOSTKI-KARTA-3D-INFO-Q1` | implementacja na branchu integracyjnym, testy zapisane w kontrakcie, bez deployu | niezależny Evaluator i dopiero potem integracja/publikacja |
| `P-BARBARZYNCY-USUWANIE-SEMANTYKA-Q1` | gotowe lokalnie, bez deployu | niezależny Evaluator, potem integracja |
| `P-TECHNOLOGIA-POPUP-KARTA-ODKRYCIA-Q1` | dokumentacyjny prototyp, nie gotowy do kodowania ogólnego | decyzja o źródle danych; później Design i kontrakt |

Nie oznaczam tematów „gotowe do integracji” jako zdeployowanych: gotowość
branchu/worktree i obecność bundla to dwa różne statusy.

## 6. Błędy naprawione i oczekujące

### Naprawione / zamknięte

- limit Pracy 50% i pełny routing budynki↔ulepszenia;
- limit Nauki 60% bez ujemnych wartości i z parytetem AI;
- limity miast per epoka oraz widoczność ustawień;
- toggle chatek i domyślne ustawienia nowego miasta;
- pula cywilizacji per mapa z twardym sufitem epoki;
- brak modelu/wizualizacji cyny;
- koszt Wyrębu 5 P;
- mgła AI per owner, pamięć celów i ponowne wykrycie;
- karta Brązownictwa po odkryciu;
- ceremonialny popup triumfu miast-państw.

### Oczekujące, zarejestrowane

- `P-BITWA-PODSUMOWANIE-NIGDY-NIE-WIDOCZNE`;
- `P-BITWA-SCENA-REJESTRACJA-PRZED-WYJATKIEM`;
- `P-BITWA-ATAK-MIASTO-MGLA-BRAK-SPRAWDZENIA`;
- `P-AI-PANSTWA-MIASTA-REKRUTACJA-JAKO-BUDYNKI`;
- `P-AI-BRAK-SCIEZKI-ZDOBYCIA-MIASTA-ADIACENCJA`;
- `P-DYPLO-BILANS-GATE-NIESPOJNY-N-E1-REPRODUKCJA`;
- `P-TOOLTIP-CIV-UNIT-PANEL-SCOPE-MARTWY-W-GRZE`;
- `P-CUD-WONDER-EARLY-RETURN-STALE-HIGHLIGHT`;
- `P-KOPALNIA-PODSWIETLENIE-KOSMETYKA` (N2/N3/N5/N6);
- `P-SANDBOX-MAPGEN-WYDAJNOSC-LIMITY`;
- `P-BITWA-ATAK-DYSTANSOWY-TELEPORT-Q1`;
- `P-PERF-SPOWALNIANIE-SESJA-DLUGA-Q1`.

Każdy z powyższych pozostaje osobnym wpisem; audyt nie tworzy nowych pytań
ABC i nie zmienia ich zakresu.

## 7. Świadomie odłożone

- `R-USTROJE-RODZAJE-PRZYSZLOSC` — osobny przyszły system ustrojów.
- `R-SUROWCE-12-PROPOZYCJA-WZGORZA-GORY-Q1` — wznowić po odnowieniu
  limitu i kontrpropozycji właściciela.
- `R-PLATFORMA-DESKTOP-ROADMAP-Q1` — osobna sesja strategiczna.
- `P-PERF-SPOWALNIANIE-SESJA-DLUGA-Q1` — osobna kolejka wydajności.
- `P-BITWA-ATAK-DYSTANSOWY-TELEPORT-Q1` — pytanie zachowane, ale bez
  ponownego zadawania w tym audycie.
- Design makiety oraz linkowanie do Civpedii/Wikipedii — etap późniejszy,
  poza FALAMI 291–294 i poza bieżącą integracją karty.

## 8. Workery / operatory — snapshot worktree

Obecność worktree oznacza ślad pracy lub rezerwację brancha, nie dowód, że
proces Operatora nadal działa. Na podstawie `git worktree list` aktywne
ślady na dzień audytu:

- karta jednostki: `unit-card-3d-info`, `unit-card-integrator-968c`,
  bieżący branch integracyjny;
- karta technologii: `tech-card-integrator`, `tech-card-evaluator`;
- Brąz i popupy: `p-epoka-brazu`, `p-epoka-brazu-q1`;
- split Pracy: `p-praca-budynki-ulepszenia-split-50-q1-d3c2`;
- AI/mgła i AI capture: `p-ai-brak-pojecia-mgly`, `fix-ai-city-capture-isolated-4edc`;
- bitwa: `fix-bitwa-miasto-mgla`, `fix-bitwa-scene-registration`,
  `fix-bitwa-podsumowanie-niewidoczne`, benchmark podsumowania;
- dyplomacja: `fix-dyplo-bilans-n-e1-staleness-9873`;
- integracja/deploy: worktree FALI 292 i 294 oraz detached `civ-main-merge`.

Worktree z tematami już wdrożonymi (np. split Pracy po FALI 293) wymaga
oznaczenia jako historyczny/stale przy następnym porządkowaniu; nie jest
automatycznie dowodem, że temat nadal jest otwarty.

## 9. Kontrola zakresu i statusu

- Zmiany w tym audycie dotyczą wyłącznie dokumentacji.
- Nie usunięto historii, nie odtworzono pytań już rozstrzygniętych.
- Nie połączono ponownie komunikatu Brązu z triumfem miast-państw.
- Design/Civpedia/Wikipedia pozostają osobnym etapem.
- Obce, niezacommitowane zmiany `CLAUDE.md` i `.cursor/rules/model-routing.mdc`
  oraz nieśledzone katalogi worktree nie należą do tego docs-only audytu i
  nie mogą wejść do jego commita.
