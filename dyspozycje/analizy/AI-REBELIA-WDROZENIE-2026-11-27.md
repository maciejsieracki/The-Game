# AI-REBELIA — wdrożenie decyzji 39B (R-WEB-AI-CULT-REL-REBEL-IMPL-Q1, tag AIREBEL)

Data: 2026-11-27. Baza: `origin/main` = 44649038c. Operator: runda 1/5 (HAIKU 5.5).
Źródło decyzji: pytanie 39 (R-WEB-AI-CULT-REL-REBEL-Q1), właściciel: miasta komputera w buncie skrajnym po wyczerpaniu łaski mają buntować się jak miasta gracza.
Diagnoza wyjściowa: `dyspozycje/analizy/AI-KULTURA-RELIGIA-REBELIA-2026-11-26.md` (rebelii AI = 0 przy 49–60 miastach AI w buncie skrajnym).

## Co zmieniono (gra/src)

1. `gra/src/game/society-breakdown.ts`: nowa czysta bramka `aiCityRebellionEnabled(level, isAiOwnerCity)` = `isAiOwnerCity && level !== null`.
   Poziom `null` (tryb zgodności, stare zapisy) → AI nie buntuje się, jak dziś.
2. `gra/src/game/society-breakdown.ts`: czysta bramka startu `shouldStartCityRebellion(shouldTrigger, hasRebelState, ownerIsHuman, ownerIsAi, level)` = `shouldTrigger && !hasRebelState && (ownerIsHuman || aiCityRebellionEnabled(level, ownerIsAi))`.
   `gra/src/main.ts`, pętla Porządku miasta: warunek `shouldTriggerRebellion && isHuman(city.ownerId)` zastąpiony wywołaniem `shouldStartCityRebellion(...)` (ta sama logika, testowana zachowaniem w obronie).
   Ścieżka buntu jest WSPÓLNA (bez duplikacji): `markCityRebellionStarted`, `stampCityFounderOnCapture`, `transferCityToRebelFactionWithLedger` (księga zasobów), `settleWonderTransfer`, `seedCityOwnerDefaults`.
3. Komunikat: gracz nadal dostaje toast (`showHintMessage`) bez zmian. Dla miasta AI bez modala — nowa funkcja `recordAiCityRebellionNews`
   dopisuje jednozdaniowy wpis do dziennika „Wydarzenia” (`warEventLog`), tylko gdy gracz zna właściciela (`getDiplomaticContacts()`).
   Tekst: „Bunt miasta: <miasto>” / „Miasto <cywilizacja> zbuntowało się i ogłosiło niepodległość”.
   Decyzja inżynierska: wpis idzie do dziennika Wydarzeń, a nie do trwałej listy „Wydarzenia na świecie” w oknie dyplomacji, bo tamta lista jest typowana pod wojny/pokoje par AI (`newsKind`), a dispatch zabrania nowych okien; zmiana typu wymagałaby poszerzenia zapisu i UI.
4. Immunitet osiedla (`isOsiedleRevoltImmune`) i łaska (`updateRevoltGrace`) — bez zmian; są przed bramką i zerują `shouldTriggerRebellion`.
5. Progi, łaska 2 tury na trudnym, próg 14%, parametry kultury/Porządku i wartość Prawa jednostki — bez zmian.

Zakres: reguła aktywna tylko przy poziomie „Kultura i religia” ≠ null (nowe gry). Nie trzeba było rozdzielać zgodności, więc nie ma DECISION_REQUIRED.

## Testy

- Nowy test: `gra/tools/ai-city-rebellion-gate-test.cjs` — 31/0 (w obronie: bramka startu testowana zachowaniem na wejściach, nie tekstem main.ts).
  Sprawdza: bramkę dla łatwy/normalny/trudny (AI = tak, nie-AI = nie), null = nie; bunt skrajny po łasce na trudnym; immunitet osiedla pop 1–4; okablowanie w main.ts (ciąg bramki, brak starego warunku, wpis bez modala, wspólna ścieżka).
- Mutacje czerwone (wykonane w obronie, przywrócone, test 31/0 po przywróceniu):
  - M-a: `aiCityRebellionEnabled` ignoruje poziom → FAIL (2 asercje).
  - M-b: `shouldStartCityRebellion` bez warunku `!hasRebelState` → FAIL (2 asercje).
  - M-c: AI bez warunku poziomu w bramce startu → FAIL (1 asercja).
  - M-d (z pierwszej rundy): bramka w main.ts z powrotem do samego `rebelByPlayer` → FAIL (asercja wiring).
- Bramki (wyniki z surowego wyjścia):
  - tsc --noEmit: exit 0
  - logic-test: LOGIC OK (213/213)
  - tech-tree-test: 20 pass, 0 fail
  - research-test: 33/0 ALL GREEN
  - unit-replace-test: exit 0
  - combat-test: All sanity checks passed (exit 0)
  - ai-test: 297 passed, 0 failed
  - society-breakdown-test: 56 OK, 0 FAIL
  - culture-religion-level-test: 59 pass / 0 fail
  - culture-religion-test: 65 passed, 0 failed
  - ai-city-order-need-wiring-test: 231 passed, 0 failed

NIE ZMIERZONO: round-trip zapisu/wczytania miasta w buncie AI (pola `rebelState`/`rebelPreviousOwnerId` idą przez istniejący zapis miast — nie testowane osobno); tryb hotseat; wygląd wpisu w panelu w przeglądarce; ochrona 20 tur dla miasta AI po buncie (działa przez istniejący `tickRebelProtectionEndOfTurn`, nie sprawdzane live); ledger AI po buncie (ścieżka wspólna, brak dedykowanego pomiaru).

## Pomiar (runner `gra/tools/ai-cult-rel-measure-run.cjs --city-state 1 --pace wysoki`)

Ustawienia maksymalne: gra Trudny, „Kultura i religia” trudny (domyślnie w runnerze), „Koszty jednostek” Wysoki ×4 (`--pace wysoki`), 60 tur, bundle live zbudowany poza repo (vite, bez `npm run build`).
Oba stany mierzone TYM SAMYM runnerem w tej rundzie (obrona, runda 2):
- PRZED = baza 44649038c (origin/main), bundle `dist-base` zbudowany z `git archive` tej bazy.
- PO = kandydat 88b933e0 z poprawką obrony (wyodrębniona czysta bramka `shouldStartCityRebellion`, zachowanie identyczne), bundle `dist-po`.
Odczyt t60 z `seedN.jsonl`: AI = właściciele > 0 bez gracza (`czlowiek` = 0); bunt = wiersze `cityState` z owner −99.

| Ziarno | Stan | Miasta AI t60 | AI krytyczne t60 | Miasta w buncie (−99) t60 | Jednostki wojskowe AI t60 |
|---|---|---|---|---|---|
| 4242 | PRZED | 149 | 59 | 0 | 144 |
| 4242 | PO | 148 | 59 | 10 | 148 |
| 7 | PRZED | 149 | 75 | 0 | 138 |
| 7 | PO | 137 | 55 | 16 | 134 |

Uwagi do tabeli:
- Poprzednia runda Operatora podała dla PO s7: 138 / 56 / 16 / 134 oraz PRZED s4242 57 krytycznych (z dokumentu AICULTREBEL). Ponowny pomiar daje 59 krytycznych PRZED s4242 i 137/55 PO s7. Różnice rzędu 1–2 miast wskazują na szum rozchodzenia się symulacji (niedeterminizm runnera między przebiegami), NIE na efekt zmiany. Jeden przebieg na ziarno; NIE ZMIERZONO rozkładu wielu przebiegów.
- PRZED s7 w tym pomiarze: 75 krytycznych, zgodnie z dokumentem AICULTREBEL.
- Miasta w buncie to frakcja −99; przypisanie do AI jest wnioskiem (brak haka „poprzedni właściciel”), NIE ZMIERZONO bezpośrednio.
- Suma „miasta AI + miasta w buncie”: PO s4242 158, PO s7 153, PRZED 149. Symulacja rozchodzi się po pierwszym buncie; porównanie sum jest przybliżone.
- Przebieg PO (miasta w −99, suma wierszy `cityState`): s4242 t40 1, t50 6, t60 10; s7 t50 11, t60 16 (wcześniej t10–t30 = 0).

Wnioski ostrożne:
- Bunt AI działa: PRZED 0 buntów, PO 10 i 16 miast w t60.
- Krytyczne miasta AI: s4242 bez zmiany (59 vs 59); s7 spadek 75 → 55. Jeden ziarno, z szumem; nie wyciągam wniosku o efekcie buntu na porządek AI.
- Jednostki AI: s4242 144 → 148 (wzrost w szumie), s7 138 → 134.
- Wpis w dzienniku „Wydarzenia” dla buntu AI: NIE ZMIERZONO w przeglądarce (tylko kod).

Uwaga o runnerze: wznowienie z zapisu slotu w Chromium padło raz (SIGSEGV / „Target page … has been closed”) w przebiegu PRZED s7 i zadziałało przy ponowieniu z tym samym `--out` i `--profile`. Surowe pliki tej rundy: `scratchpad/prz/` (PRZED) i `scratchpad/po/` (PO) w katalogu sesji obrony.

## Nie zrobione / do decyzji

- Bunt AI nie zmienia ekonomii AI ani wyglądu wpisu w panelu w przeglądarce (NIE ZMIERZONO).
- Round-trip zapisu miasta w buncie AI, hotseat i skutki buntu ostatniego/stołecznego miasta AI dla eliminacji cywilizacji: NIE ZMIERZONO. Kod (ścieżka `transferCityToRebelFactionWithLedger`, main.ts) tylko przepisuje `ownerId` na frakcję −99 i nie wywołuje `eliminateOwner`; czy cywilizacja AI bez miast jest dalej traktowana jako żywa, nie zbadano.
- Wpis „Wydarzenia na świecie” w oknie dyplomacji — świadomie tylko dziennik Wydarzeń (patrz pkt 3 wyżej); ewentualne przeniesienie do trwałej listy to osobna decyzja.
- Nie zmieniano progów ani łaski; dalsze pytanie o balans buntów AI (ile miast AI powinno się buntować) zostaje dla właściciela po obejrzeniu wyników.

## Ostatnie miasto AI (AIREBEL-R3)

Problem: `transferCityToRebelFactionWithLedger` zmienia tylko `ownerId` na −99 i nie wywołuje `eliminateOwner`. Gdyby AI traciła w buncie OSTATNIE miasto, zostawałaby „cywilizacja bez miast” z jednostkami (zombie). Sprawdzenie kodu: w `gra/src/main.ts` jedyne wywołania `eliminateOwner` (ok. linii 40383 — aneksja państwa-miasta, ok. 9410 — zdobycie stolicy) NIE wykrywają „AI bez miast”; nie istnieje ścieżka „AI bez miast → eliminateOwner”. Wybrano wariant OCHRONNY.

Wariant (zrobiony): miasto AI będące OSTATNIM miastem swojego właściciela NIE buntuje się (zostaje w niepokoju). Gracz bez zmian. Eliminacja AI nadal wyłącznie przez podbój/przejęcie stolicy.
- Gdzie: `shouldStartCityRebellion` (gra/src/game/society-breakdown.ts) dostaje szósty argument `ownerOtherCities` (liczba POZOSTAŁYCH miast właściciela); main.ts liczy go na żywo z `cities` tuż przed bramką (bez miasta rozpatrywanego), więc drugie miasto staje się ostatnim po buncie pierwszego.
- Test: gra/tools/ai-city-rebellion-gate-test.cjs, sekcja R3 (AI 0 innych miast → brak startu na trudnym i latwym; AI 1 inne → start; gracz 0 innych → start; null → brak startu bez zmian). Mutacja czerwona: zdjęcie warunku `!aiKeepsLastCity` → FAIL 2/2 (przywrócone, PASS=37/0).

Pomiar (maksimum: Trudny, Kultura i religia trudny, Koszty jednostek Wysoki ×4 = `--pace wysoki`, 60 tur, `--city-state 1`, runner z gra/tools, bundle live zbudowany poza repo):
- PRZED = a3ffe64a7 (poprzednia runda, bramka rebelii bez ochrony ostatniego miasta), bundle `dist-pre`.
- PO = ten commit (ochrona ostatniego miasta), bundle `dist-aicult`.

| Ziarno | Stan | Miasta AI t60 | AI krytyczne t60 | Miasta w buncie (−99) t60 | Jednostki wojskowe AI t60 | AI z 0 miast (żadna tura) |
|---|---|---|---|---|---|---|
| 4242 | PRZED | 148 | 59 | 10 | 148 | 0 |
| 4242 | PO | 148 | 59 | 10 | 148 | 0 |
| 7 | PRZED | 137 | 55 | 16 | 134 | 0 |
| 7 | PO | 137 | 55 | 16 | 134 | 0 |

Wniosek ostrożny: w obu ziarnach (60 tur, maksimum) żadna cywilizacja AI nie straciła wszystkich miast, więc ochrona nie zmieniła żadnego wyniku; zombie-AI w t60 = 0 zarówno PRZED, jak i PO. Ochrona jest zabezpieczeniem na przypadki, których pomiar nie wywołał (np. AI z jednym miastem na początku buntu). NIE ZMIERZONO: dłuższe biegi (>60 tur), ziarna inne niż 4242 i 7, scenariusz wymuszony (AI z 1 miastem w buncie skrajnym) — zachowanie ochrony potwierdza tylko test zachowaniem na wejściach bramki. Liczby PRZED/PO są identyczne co do miasta i jednostki; to ta sama symulacja, więc nie jest to szum runnera.

Decyzja o wpisie „Wydarzenia na świecie” dla buntu AI: poza zakresem tej rundy (zostaje warEventLog). Informacja dla właściciela: do decyzji, czy bunt AI ma trafiać do trwałej listy Wydarzeń.
