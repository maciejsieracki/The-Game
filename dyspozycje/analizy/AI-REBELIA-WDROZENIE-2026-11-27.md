# AI-REBELIA — wdrożenie decyzji 39B (R-WEB-AI-CULT-REL-REBEL-IMPL-Q1, tag AIREBEL)

Data: 2026-11-27. Baza: `origin/main` = 44649038c. Operator: runda 1/5 (HAIKU 5.5).
Źródło decyzji: pytanie 39 (R-WEB-AI-CULT-REL-REBEL-Q1), właściciel: miasta komputera w buncie skrajnym po wyczerpaniu łaski mają buntować się jak miasta gracza.
Diagnoza wyjściowa: `dyspozycje/analizy/AI-KULTURA-RELIGIA-REBELIA-2026-11-26.md` (rebelii AI = 0 przy 49–60 miastach AI w buncie skrajnym).

## Co zmieniono (gra/src)

1. `gra/src/game/society-breakdown.ts`: nowa czysta bramka `aiCityRebellionEnabled(level, isAiOwnerCity)` = `isAiOwnerCity && level !== null`.
   Poziom `null` (tryb zgodności, stare zapisy) → AI nie buntuje się, jak dziś.
2. `gra/src/main.ts`, pętla Porządku miasta: warunek `shouldTriggerRebellion && isHuman(city.ownerId)` zastąpiony przez
   `shouldTriggerRebellion && !city.rebelState && (rebelByPlayer || aiCityRebellionEnabled(getCulturaReligiaLevel(), isAiOwner(humanSeats, rebelOwnerPrev)))`.
   Ścieżka buntu jest WSPÓLNA (bez duplikacji): `markCityRebellionStarted`, `stampCityFounderOnCapture`, `transferCityToRebelFactionWithLedger` (księga zasobów), `settleWonderTransfer`, `seedCityOwnerDefaults`.
3. Komunikat: gracz nadal dostaje toast (`showHintMessage`) bez zmian. Dla miasta AI bez modala — nowa funkcja `recordAiCityRebellionNews`
   dopisuje jednozdaniowy wpis do dziennika „Wydarzenia” (`warEventLog`), tylko gdy gracz zna właściciela (`getDiplomaticContacts()`).
   Tekst: „Bunt miasta: <miasto>” / „Miasto <cywilizacja> zbuntowało się i ogłosiło niepodległość”.
   Decyzja inżynierska: wpis idzie do dziennika Wydarzeń, a nie do trwałej listy „Wydarzenia na świecie” w oknie dyplomacji, bo tamta lista jest typowana pod wojny/pokoje par AI (`newsKind`), a dispatch zabrania nowych okien; zmiana typu wymagałaby poszerzenia zapisu i UI.
4. Immunitet osiedla (`isOsiedleRevoltImmune`) i łaska (`updateRevoltGrace`) — bez zmian; są przed bramką i zerują `shouldTriggerRebellion`.
5. Progi, łaska 2 tury na trudnym, próg 14%, parametry kultury/Porządku i wartość Prawa jednostki — bez zmian.

Zakres: reguła aktywna tylko przy poziomie „Kultura i religia” ≠ null (nowe gry). Nie trzeba było rozdzielać zgodności, więc nie ma DECISION_REQUIRED.

## Testy

- Nowy test: `gra/tools/ai-city-rebellion-gate-test.cjs` — 18/0.
  Sprawdza: bramkę dla łatwy/normalny/trudny (AI = tak, nie-AI = nie), null = nie; bunt skrajny po łasce na trudnym; immunitet osiedla pop 1–4; okablowanie w main.ts (ciąg bramki, brak starego warunku, wpis bez modala, wspólna ścieżka).
- Mutacje czerwone (wykonane, przywrócone, plik sprawdzony ponownie):
  - M1: bramka w main.ts z powrotem do samego `rebelByPlayer` → test FAIL (2 asercje: wiring + ścieżka).
  - M2: helper zwraca `isAiOwnerCity` (ignoruje poziom) → test FAIL (asercja „AI + null => BRAK buntu AI”).
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
PRZED = wartości z `AI-KULTURA-RELIGIA-REBELIA-2026-11-26.md` / AICULTREBEL (tego samego runnera na main); NIE PONOWIONO w tej rundzie.

| Ziarno | Stan | Miasta AI (civ) t60 | AI krytyczne t60 | Miasta w buncie (frakcja rebeliantów, −99) t60 | Jednostki wojskowe AI t60 |
|---|---|---|---|---|---|
| 4242 | PRZED | 149 | 57 | 0 | NIE ZMIERZONO (brak w dokumencie) |
| 4242 | PO | 148 | 59 | 10 | 148 |
| 7 | PRZED | 149 | 75 | 0 | NIE ZMIERZONO (brak w dokumencie) |
| 7 | PO | 138 | 56 | 16 | 134 |

Przebieg PO (miasta rebeliantów, suma wierszy `cityState` owner −99):
- seed 4242: t10 0, t20 0, t30 0, t40 1, t50 6, t60 10.
- seed 7: t10 0, t20 0, t30 0, t40 0, t50 11, t60 16.

Wnioski ostrożne:
- Bunt AI zaczyna działać: PRZED 0 buntów, PO 10 i 16 miast w t60. Gracz nie ma miast w buncie (wiersz właściciela 0: miasta 1, bunt 0), więc miasta w −99 pochodzą z buntu AI.
- Liczba miast AI w buntach nie jest bezpośrednio mierzona (brak haka „poprzedni właściciel”); przypisanie do AI jest wnioskiem z powyższego, NIE ZMIERZONO bezpośrednio.
- Suma miast AI + miast w buncie wynosi 158 (s4242) i 154 (s7), czyli więcej niż PRZED (149). Symulacja rozchodzi się po pierwszym buncie, więc porównanie PRZED/PO jest przybliżone; NIE ZMIERZONO, czy różnica to skutek dodatkowych miast po stronie PRZED, czy zmiana gry.
- Krytyczne miasta AI w s4242 nie spadły (59 vs 57); w s7 spadły (56 vs 75). Przy jednym ziarnie to może być szum rozchodzenia się symulacji; nie wyciągam wniosku o efekcie buntu na porządek AI.
- Na mapie sytuacja „garnizon/bunt” nie była rozpatrywana osobno; to zostaje do oceny właściciela.

Uwaga o runnerze: wznowienie z zapisu slotu (`--stop-at` w kilku wywołaniach) padało przy ładowaniu w Chromium (zrzut SIGSEGV / „Target page … has been closed”) dwa razy z rzędu. Pełne przebiegi jednym wywołaniem (60 tur ≈ 3–4 min) przeszły bez błędu, więc wyniki pochodzą z przebiegów bez wznowienia. Surowe pliki: `scratchpad` operatora (`airebel/out-post-s4242g`, `airebel/out-post-s7g`).

## Nie zrobione / do decyzji

- Bunt AI nie zmienia ekonomii AI ani wyglądu wpisu w panelu w przeglądarce (NIE ZMIERZONO).
- Wpis „Wydarzenia na świecie” w oknie dyplomacji — świadomie tylko dziennik Wydarzeń (patrz pkt 3 wyżej); ewentualne przeniesienie do trwałej listy to osobna decyzja.
- Nie zmieniano progów ani łaski; dalsze pytanie o balans buntów AI (ile miast AI powinno się buntować) zostaje dla właściciela po obejrzeniu wyników.
