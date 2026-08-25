# 01 — OPERATOR (runda 1)

STATUS: DECISION_REQUIRED
DOMAIN: GAME
TEMAT: `R-AI-JEDNOSTKI-TYLKO-ZAKUP-Q1`
GOAL: AI nie buduje jednostek w kolejce produkcji miasta za Pracę — jednostki AI powstają
wyłącznie przez zakup za Skarbiec, wspólną ścieżką z graczem. Ustalić, czy dzisiejszy stan
jest regresem wobec FALI 299, i przywrócić kontrakt.

## 1. Kontrakt FALI 299 — ustalony u źródła, bez sprzeczności

`docs/decyzje/P-REKRUTACJA-JEDNOSTEK-TYLKO-SKARBIEC-Q1.md`, ECHO właściciela 2026-08-17:

> „Gracz, AI i miasta-państwa mają pozyskiwać jednostki wyłącznie przez zakup za
> Skarbiec/Pieniądze. Jednostki nie mają być produkowane w tej samej kolejce Pracy co budynki."

Doprecyzowanie 2026-08-19: AI „zawsze zachowuje się tak jak gracz… nie dostaje osobnej furtki
»tylko w czasie wojny«". Rejestr i `WERSJE.md` (FALA 299) mówią to samo. **Rozstrzygnięcie:
„kupuje ZAMIAST budować" — zakaz kolejkowania. Obejmuje też miasta-państwa (kryt. 5).**

## 2. Pomiar stanu zastanego (`origin/main`, przed zmianą)

Realny `decideAITurn` + realny egzekutor (`buildCandidateIds`/`pickExecutableCandidate`), 40 tur:

| Scenariusz | zaproponowane jednostki | **do kolejki Pracy** | kupione za Skarbiec | armia | budynki |
|---|---|---|---|---|---|
| major AI, 3 miasta, skarbiec zasilany | 24 | **0** | 24 (480 ¤) | 24 | 21 |
| major AI ubogi (skarbiec 0, +2/turę) | 24 | **0** | 3 (60 ¤) | 3 | 21 |
| miasto-państwo (defensiveCopy) | 1 | **0** | 1 | 1 | 8 |

**Recon dispatchu potwierdzony częściowo:** `chooseCityProduction` faktycznie zwraca jednostki.
**Obalony w drugiej połowie:** do kolejki Pracy nie trafia żadna — egzekutor kieruje je do
`purchaseRecruitmentUnit`, a `enqueue()` i `insertAtFront()` twardo odrzucają `kind!=='budynek'`.
Migracja save/capture/surrender też czyści. Bramka jest w źródle FALI 322 (`2465e5cc`, deploy
`ab887731`) — sprawdzone `git merge-base --is-ancestor`. **Zrzutu właściciela nie da się
odtworzyć z bieżącego źródła.** Kwota „Koszt: 40" = cena Wojownika w **Pieniądzu** (pace `niski`,
poziom `trudny`) pokazana z ikoną Pracy — czyli pozycja z czasów sprzed bramki.

## 3. Zmiana (obrona w punkcie zużycia, nie w punkcie wejścia)

Sześć bramek chroni WEJŚCIE do kolejki, ale `advanceProduction` leje Pracę we front bez
sprawdzania `kind` (zmierzone, asercja A2). Dodano jedną barierę tam, gdzie Praca jest
naliczana: legacy jednostka znika z kolejki przed tickiem, postęp wraca do puli właściciela
kanoniczną `sanitizeBuildQueue`. Owner-agnostyczne — parytet gracz/AI/MP.

ZMIANY/COMMIT: `gra/src/main.ts` (+22, jeden hunk, tick per-miasto),
`gra/tools/ai-jednostki-tylko-zakup-test.cjs` (nowy). SHA w gałęzi
`autobot/R-AI-JEDNOSTKI-TYLKO-ZAKUP-Q1`. Zero zmian w `gra/data/**`, `WERSJE.md`, ścieżce gracza.
**Żadna istniejąca asercja nie została zmieniona ani rozluźniona** (`promote-to-front-test`
wraca do wartości bazowej 121/4).

TESTY: `ai-jednostki-tylko-zakup-test` **23/23**; 5 bramek referencyjnych zielonych
(213/213, 19/19, ALL GREEN, 13/13, OK); 33 z 37 bramek AI/produkcji zielone. `tsc --noEmit` 0
błędów; `vite build` (C-001, outDir poza repo) 848 modułów, OK. Nietautologiczność: 3 mutacje
źródła (usunięcie guardu, otwarcie `enqueue`, cofnięcie bramki) czerwienią test, przywrócenie
zieleni. Cztery bramki czerwone **pre-istniejąco, zweryfikowane na czystym `origin/main`**:
`ai-test` 285/8, `ai-recruit-upkeep-gate` 18/9, `ai-balans-step3` 7/1, `promote-to-front` 121/4.

BLOKADY: kryteria 1–7 dispatchu spełnione, ale **premisa dispatchu („to jest regres w kodzie")
nie potwierdziła się pomiarem** — konflikt dispatch/kod/testy, C-054. Pytanie do właściciela
(bez nazw plików, §10a): **czy Wojownik zbierający Pracę był widziany w świeżo rozpoczętej grze
z najnowszej wersji roboczej, czy w partii wczytanej/otwartej ze starszego pliku gry?** Od tego
zależy, czy szukamy dalej w kodzie, czy zamykamy temat jako ślad starszej wersji.

RYZYKO ZAGŁODZENIA AI (kryt. 4): zmiana nie dotyka liczebności armii — wynik identyczny przed
i po (24 jednostki, 21 budynków). Ubogie AI ma 3 zamiast 24 jednostek, ale to skutek samego
kontraktu FALI 299 (jednostki kosztują złoto), nie tej zmiany. Bez `BLOCK`.

TEMAT RÓWNOLEGŁY: hunk leży w `main.ts` ~26676 (tick per-miasto), tuż nad blokiem auto-zarządcy;
`R-PRACA-JEDEN-PODZIAL-Q1` pracuje na podziale Pracy — kolizja możliwa w tym samym rejonie,
merge rozstrzygalny (dopisanie bloku, zero zmian istniejących linii).

POZA ZAKRESEM — do rejestru: (a) cena jednostki dla `kosztJednostekPace='sredni'` wychodzi `NaN`;
(b) komunikat `[Rush] … jednostka w kolejce` opisuje zachowanie sprzed FALI 299; (c) trzy
czerwone asercje `promote-to-front` zakładają jednostkę w kolejce Pracy, czyli kontrakt
sprzed FALI 299.

RUNDY: 1/5.
NASTĘPNY KROK: decyzja właściciela o premisie; po niej Evaluator.
DEPLOY/PUSH: NIE WYKONANO (push wyłącznie gałęzi roboczej, bez `main`).
