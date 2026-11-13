# R-WEB-DIPLO-LIVE-VERIFY-STEPS-1-4-Q1 — raport obrony Operatora (runda 1, odpowiedź na zarzuty Evaluatora)

STATUS: PASS-WITH-NOTES (zarzuty 1–8 przyjęte lub odrzucone z dowodem; kryterium „≥ 4 z 6” spełnione tylko przy jawnej definicji, patrz zarzut 1)
DOMAIN: GAME (weryfikacja zachowania gry; zero zmian w `gra/src/`)
TEMAT: R-WEB-DIPLO-LIVE-VERIFY-STEPS-1-4-Q1
GOAL: wykonać na żywo (Chromium, `?playtest=mapa`, bundle w `/tmp/civ-live-verify`) scenariusze kroków 1–4b i odpowiedzieć na każdy zarzut Evaluatora.
BAZA: `70213043e1a2efdb85be673c83c57f895061b7c7` (kandydat Operatora, runda 1). Worktree wrócił do tego SHA (detached).
RUNDY: 2/5 (runda obrony 1; Evaluator r1 zakończony zarzutami 1–8)

## Odpowiedzi na zarzuty

**Zarzut 1 — kryterium „≥ 4 z 6 scenariuszy zmierzone” (PRZYJMUJĘ, częściowo)**
Po poprawkach scenariusze z pomiarem na żywo w zasadniczych punktach: S1 (5/5 PASS), S2 (a, b: rozejm 10 i pokój 20 — PASS), S4 (a, b, c — PASS), S5 (wartości 0/9/10/29/30 i nazwy nastawienia — PASS). S3 mierzony częściowo (próg Power i dwie tury: PASS d, f; progi charakteru i N tur NIE_ZMIERZONO). S6 NIE_ZMIERZONO.
Przy definicji „zasadnicze punkty zmierzone” wychodzi 4/6. Przy definicji „wszystkie punkty dispatchu bez NIE_ZMIERZONO” wychodzi 2/6 (S1, S5). Nie wybieram definicji za Evaluatora: obie liczby podaję; orkiestrator decyduje, czy kryterium uznać za spełnione.

**Zarzut 2 — S4: wiek wojny 5 zamiast ≥ 10 (PRZYJMUJĘ; ODRZUCAM część wniosku)**
- PRZYJMUJĘ: narzędzie ustawiało wiek 5 (`setPlayerWarWithAi(id, 5)`). Poprawka: `setPlayerWarWithAi(id, 12)`, a wiek odczytywany hakiem `getWarTurns` i zapisywany w `wiekWojnyPrzedOfertą` (`evidence/S4.json`: `turnsAtWar: 12`). Bramka 10 tur (`diplomacy-peace-proposal-timing.ts:2`) przestała blokować: `S4.a` nadal blokuje przy 1 turze, a oferta na wieku 12 jest oceniana przez silnik.
- ODRZUCAM: wniosek, że brakująca gałąź to „AI czuje się silniejsze”. Ten komunikat i bramka R5b dotyczą propozycji składanej PRZEZ AI (`src/game/ai.ts:7077`, `7121`). Oferta gracza jest oceniana przez bilans PW w `diplomacy-proposals.ts:1551` i silnik zwraca „Brakuje 428 PW do uczciwej oferty pokoju @ Relacji (baza 475 PW)”. Dowód: `evidence/S4.json` — `silniejszaAI_ocena.accepted: false`, toast w DOM z tym samym tekstem. Zamiast gałęzi R5b mierzę to, co faktycznie odrzuca ofertę bez miasta.

**Zarzut 3 — S1.d pusty dowód (PRZYJMUJĘ)**
Odczyt w UI (`objectiveRespektPctTowardEffective`) to wartość efektywna z mocy (100), nie zapisana. Dodano odczyt zapisanej wartości: w wojnie zaufanie = 0, więc `relationScore(rel) = zaufanie + respekt` (`getRelationTotal`) równa się zapisanemu respektowi. Wynik: zapisany respekt po wypowiedzeniu wojny = 60, po turze 1 = 60 (`evidence/S1.json`, `zapisanyRespektPoWypowiedzeniu` / `zapisanyRespektPoTurze1`; oczekiwane 60). Test sprawdza `> 29`, więc wróciłby FAIL, gdyby zapisany respekt był obcięty do 29. Nadal nie badam wprost kodu clampu (poza zakresem); pomiar jest na poziomie zapisanego stanu.

**Zarzut 4 — dowody S3 z innej wersji skryptu (PRZYJMUJĘ)**
Usunięto stare `S3-turns.json` i `S3-probe.json` (z 17:38 i 17:43) oraz S1/S2/S4/S5/S6 z poprzedniej wersji. Wszystkie pliki w `evidence/` zostały wygenerowane aktualnym narzędziem z tego commita. Raport 10-operator (stary) jest nieaktualny w liczbach — poniższa tabela go zastępuje.
Wynik przeskanowania progu (`evidence/S3-probe.json`, zaufanie 25, Power, nie siła wojskowa): `mayDeclare` przełącza się przy `ratio = 0` (AI Power = Power gracza: `ratio −0,10 → 0`, `0,00 → 2`). To NIE zgadza się z progami 14/20/28% i 25% z dispatchu. Nie rozstrzygam tego w tym temacie: hak nie wystawia siły wojskowej z kroku 2 ani charakteru AI. Rozbieżność zostaje otwarta (zob. UWAGI).

**Zarzut 5 — etykiety S5 nie odczytane (PRZYJMUJĘ)**
Poprzedni selektor (kontener `.da-rel-row`) nie obejmował nagłówka „Nastawienie”. Teraz etykiety czytane są z `document.body.innerText`. Wyniki (`evidence/S5.json`): zaufanie 0 → WROGI, 9 → WROGI, 10 → NIEUFNY, 29 → NIEUFNY, 30 → PRZYJAZNY. Oczekiwane wartości liczone z progów `diplomacy-display.ts:337–353` (`< 10` Wrogi, `< 30` Nieufny, potem suma Zaufania+Respektu). Dla 30 wynik zgodny z kodem, bo respekt w UI jest efektywny (100): `s = 30 + 100 = 130 ≥ 120` → Przyjazny. Zrzuty: `evidence/live-S5-zaufanie-29.png` i `-30.png` (tylko 29 i 30; narzędzie nie robi zrzutów dla 0/9/10 — przyjęte jako braki, zrzut był opcjonalny: „jeśli się da”).
Zrzut 30 pokazuje baner „BRAK KONTAKTU” (górny pasek audiencji), mimo `prepareContact`. Nie rozstrzygnięte: nie znalazłem źródła tego napisu w `src/ui/diplomacyAudience.ts` (tekst „brak kontaktu” jest w komentarzach i logice `trade-routes.ts`, `diplomacy-layers.ts`, `diplomacy-locks.ts`). Wiarygodność odczytów panelu traktuję jako NIE_ZMIERZONO w tym zakresie; liczby (zaufanie 30/100, Relacja 130/200, Przyjazny) są spójne z formułami.

**Zarzut 6 — brak dowodu nietautologiczności / mutacyjnego (PRZYJMUJĘ jako NIE WYKONANO)**
Nie przeprowadzono mutacji. Wymagałoby zmiany kodu gry w buildzie testowym, a dispatch zakazuje zmian kodu gry. Skutek: S1.b, S2.a, S2.b, S4.a, S4.b są pomiarami stanu po ustawieniu hakiem i nie są dowiedzione jako niezależne od reguły. Nie twierdzę inaczej w tabeli.

**Zarzut 7 — „brak hooka” bez przeszukania (PRZYJMUJĘ częściowo)**
Przyjęte: `getWarTurns` istnieje (`main.ts:29240`) i jest używany (S4). Nie przyjęte: `__peaceRulesTestDebug` nie wystawia lostCities ani siły wojskowej (kroku 2), więc S6 i S3.b nadal nie mają hooka do odczytu. Sformułowanie „brak hooka” zamieniam na „w tym temacie nie dodano hooka; nie przeszukiwałem wszystkich narzędzi”.

**Zarzut 8 — drobne (mieszane)**
- `?civTest=1` vs `?playtest=mapa` — ODRZUCAM: `diplo-war-peace-live-test.cjs:36` używa `?playtest=mapa` i tą drogą działają `__peaceRulesTestDebug` (`main.ts`); `civTest=1` bramkuje wyłącznie `window.__civTest` (`civ-test-hooks.ts:5`), którego ten skrypt nie używa.
- S3.d „2 tury” — PRZYJMUJĘ: nazwa poprawiona na „1 tura”; N tur w S3.c nie podany w dispatchu i nie zmierzone (NIE_ZMIERZONO).
- S3.e `ostrzezenieWLogu` po 0 turach — PRZYJMUJĘ: pole nie jest rozstrzygające, S3.e pozostaje NIE_ZMIERZONO.
- S3.d „status neutralni”: PRZYJMUJĘ, że przy `neutralni` przed pomiarem nie wykluczono losowania gotowości; oba przebiegi tury (c, d) dały `neutralni`, bez dalszej analizy.
- „S1 PASS 5/5 wbrew zarzutowi 3” — po poprawce S1.d jest mierzony na zapisanym respekcie (PASS 5/5 teraz z właściwym dowodem).

## Wyniki (surowe, z `evidence/*.json` tego commita)

| Scenariusz | Wynik | Dowód |
|---|---|---|
| S1 — wojna: zaufanie → 0; respekt zapisany bez obcięcia | PASS 5/5 (a–e) | `S1.json`: zaufanie 40→0→0→0; zapisany respekt 60 po wypowiedzeniu i po turze 1 |
| S2 — rozejm 10 / pokój 20 | PASS 3 / NZ 2 (c, d) | `S2.json`: „Rozejm zawarty”, zaufanie 10; pokój zaufanie 20; kara sąsiedztwa i religia NZ (brak hooka w tym temacie) |
| S3 — wypowiedzenie wojny przez AI | PASS 2 (d, f) / NZ 4 (a, b, c, e) | `S3-probe.json`: flip `mayDeclare` przy ratio 0 (Power); `S3-turns.json`: 1 tura, `neutralni` (c: NZ; d: PASS — silniejszy gracz nie wypowiada wojny w 1 turze) |
| S4 — rozejm/pokój: minimalny czas, silniejsza AI, słabsza AI | PASS 4 / NZ 2 (d, e) | `S4.json`: wiek 12 (`getWarTurns`); a: blokada 1 tura („po 10 pełnych turach”); b: silniejsza odrzuca bilansem PW (428 PW); c: słabsza AI akceptuje tę samą ofertę („Warunki pokoju spełnione”) |
| S5 — etykiety dla zaufania 0, 9, 10, 29, 30 | PASS 7 (wartości 5/5 + nazwy + błędy) | `S5.json`: 0/9 → WROGI, 10/29 → NIEUFNY, 30 → PRZYJAZNY (zgodnie z progami) |
| S6 — zmęczenie wojną | NIE_ZMIERZONO (2) | brak hooka (siła militarna, lostCities) w tym temacie |

Kontrola bez zmian gry: `git diff --name-only` obejmuje tylko `gra/tools/diplo-live-verify-steps-1-4.cjs` i `dyspozycje/autobot/runs/R-WEB-DIPLO-LIVE-VERIFY-STEPS-1-4-Q1/**`. `gra/src/` nie zmieniane. `node --check` narzędzia: OK. `git diff --check`: OK.

## Czego nie udało się zmierzyć i dlaczego

- S2.c (kara za sąsiedztwo, karencja) i S2.d (religia): brak fixtury granicy i hooka religii w tym temacie.
- S3.b (progi 25/19/27% i charakter AI): brak hooka charakteru i siły wojskowej.
- S3.c (wypowiedzenie przy zaufaniu 0): N tur nieokreślone w dispatchu; zmierzono 1 turę (bez wypowiedzenia). Koszt: ok. 100 s na turę w swiftshader.
- S3.e (ostrzeżenie raz na epizod): nie mierzone osobno.
- S4.d (pokój z miastem), S4.e (oferta ze złotem): brak hooka oferty z miastem/złotem po stronie gracza.
- S5 zrzuty 0/9/10: narzędzie ich nie robi.
- S6: brak hooka zmęczenia wojną.
- Mutacja (zarzut 6): nie wykonana.

## UWAGI-DLA-ORKIESTRATORA

1. Rozbieżność progów S3: `mayDeclare` przełącza się przy parytecie Power (ratio 0), a dispatch podaje progi 14/20/28% i 25% (siła wojskowa, charakter). Do rozstrzygnięcia: czy hak powinien czytać siłę wojskową z kroku 2 (osobny temat; wymaga zgody zakresu, nie zmieniam kodu gry w tym temacie).
2. Baner „BRAK KONTAKTU” na zrzucie S5 przy 30 mimo `prepareContact`: źródło napisu nieznalezione w `src/ui/diplomacyAudience.ts`. Warto sprawdzić przed uznaniem wiarygodności panelu.
3. Dispatch wspomina o „silniejsza AI odrzuca ofertę gracza”. Kod tego nie robi tą gałęzią (R5b to propozycja AI); oferta gracza jest oceniana bilansem PW. Orkiestrator decyduje, czy kryterium S4.b dotyczy bilansu, czy gałęzi AI-proponującej.
4. Definicja „≥ 4 z 6” wymaga decyzji orkiestratora (zob. zarzut 1).
5. Bramka `neutralni` w S3: hak ustawia status `neutralni` (`setRelationForBrake`), a komentarz hamulca mówi, że liczy tylko pary z miastami AI. Nie zbadane, czy to wpływa na S3.c.
6. Stan sprzątania: po commicie usunę `gra/node_modules` i `/tmp/civ-live-verify` (zob. sekcję sprzątania w odpowiedzi).

NASTĘPNY KROK: Evaluator (Sonnet) — weryfikacja poprawek S1.d, S4, S5 na podstawie `evidence/*.json` tego commita oraz decyzja orkiestratora w sprawie definicji kryterium „≥4/6” i rozbieżności progów S3 (UWAGI 1, 4).
DEPLOY/PUSH: NIE WYKONANO
