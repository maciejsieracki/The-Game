# 00 — DISPATCH

STATUS: DISPATCHOWANE
DOMAIN: GAME
TEMAT: `R-AI-JEDNOSTKI-TYLKO-ZAKUP-Q1`
GOAL: AI nie buduje jednostek w kolejce produkcji miasta za Pracę — jednostki AI powstają
**wyłącznie przez zakup za Skarbiec** (pieniądze z podatków), wspólną ścieżką z graczem.
Ustalić, czy dzisiejszy stan jest regresem wobec decyzji FALI 299, i przywrócić kontrakt.

## Wyzwalacz — ECHO właściciela (2026-08-25, główny czat orkiestratora)

> „miało już nie być budowania jednostek w miastach AI tylko zakup za pieniądze z podatków
> i co znowu to samo czyli regres"

Właściciel załączył zrzut panelu PRODUKCJA z pozycją „Wojownik · Koszt: 40 · Zebrana Praca: 2/40",
czyli jednostka stoi w kolejce produkcji i jest opłacana Pracą.

## Kontekst historyczny (do zweryfikowania, NIE do przyjęcia na wiarę)

- `R-AI-KUP-JEDN` (FALA 5, `c676b681`): `purchaseRecruitmentUnit`/`cancelRecruitmentPurchase`
  uogólnione na dowolnego ownera; czysty predykat `shouldAIRushBuyUnit` w `ai.ts`. AI kupuje
  za złoto gdy: wojna + Manpower + złoto ≥ rezerwa(100)+koszt + <1 zakup w turze.
- **FALA 299** (`dyspozycje/WERSJE.md`): „korekta parytetu rekrutacji AI — **AI kupuje jednostki
  za Skarbiec, wspólną ścieżką z graczem, bez kosztu Pracy i niezależnie od produkcji budynków**".
  To jest zdanie, które właściciel uważa za złamane.

**Operator MA ustalić u źródła**, czy FALA 299 oznaczała „AI kupuje ZAMIAST budować" (zakaz
kolejkowania jednostek), czy „AI kupuje OPRÓCZ budowania" (dodatkowa ścieżka). Od tego zależy,
czy to regres, czy stan zamierzony. Dowód: `WERSJE.md`, `REJESTR-PROSB-I-ZADAN.md`, decyzje
w `docs/decyzje/`, commity FALI 299. Jeśli źródła są sprzeczne — `DECISION_REQUIRED`, nie zgadywanie.

## Punkt zaczepienia (recon orkiestratora, do potwierdzenia)

`gra/src/game/ai.ts:1216` `chooseCityProduction()` zwraca `string | null` — id pozycji do kolejki
produkcji miasta. W jej ciele (ok. `ai.ts:1315`) jest komentarz: „Maciej: NAJPIERW jedna jednostka
obronna (garnizon) — jednostka bazowa, zawsze budowalna". Czyli ta funkcja **może** zwracać
jednostki, nie tylko budynki. To główny kandydat na źródło regresu — ale Operator ma to
POTWIERDZIĆ POMIAREM (symulacja tury AI: co faktycznie ląduje w kolejce), nie odczytem komentarza.

Drugi tor do sprawdzenia: `decideDefensiveCopyTurn` (ok. `ai.ts:2964` — komentarz mówi „pełna
produkcja (jak zwykłe miasto AI, via chooseCityProduction)") oraz miasta-państwa
(`ai.ts:1568` wg rejestru) — czy one też kolejkują jednostki.

## Izolacja

Gałąź `autobot/R-AI-JEDNOSTKI-TYLKO-ZAKUP-Q1` od `origin/main`, osobny worktree per rola.

**UWAGA — TEMAT RÓWNOLEGŁY:** jednocześnie biegnie `R-PRACA-JEDEN-PODZIAL-Q1`, który ma w swojej
allowliście `ai.ts`, `production.ts` i `main.ts`. Nie zakładaj, że tamten jest zintegrowany.
Trzymaj zmiany maksymalnie wąsko (tylko ścieżka wyboru produkcji jednostek przez AI), żeby merge
obu tematów był rozstrzygalny. Jeśli musisz dotknąć wspólnej linii — opisz to jawnie w raporcie.

## Allowlista

- `gra/src/game/ai.ts` — WYŁĄCZNIE ścieżka wyboru produkcji jednostek przez AI
  (`chooseCityProduction` i jej wywołania, `shouldAIRushBuyUnit`, `decideDefensiveCopyTurn`).
  NIE ruszać dyplomacji, handlu, ruchu jednostek, suwaków AI.
- `gra/src/main.ts` — WYŁĄCZNIE miejsca wołające powyższe / ścieżkę zakupu
  (`purchaseRecruitmentUnit`, ok. `main.ts:3391`/`3509` `tryDeductUnitSpawnCostsEmpire`), jeśli audyt tego wymaga.
- `gra/tools/*` — nowy test kontraktu + aktualizacja istniejących bramek AI.

NIE ruszać: `gra/data/**`, `dyspozycje/WERSJE.md`, mechanizmu produkcji jednostek GRACZA
(parytet ma być zachowany w drugą stronę — gracz nadal buduje i kupuje jak dziś).

## Kryteria sukcesu

1. **Pomiar stanu ZASTANEGO przed zmianą:** symulacja N tur AI — ile jednostek powstało przez
   kolejkę produkcji (Praca), a ile przez zakup (Skarbiec). Liczby w raporcie.
2. Kontrakt FALI 299 ustalony u źródła i zacytowany dosłownie.
3. Po naprawie: **żadna jednostka AI nie powstaje przez kolejkę produkcji miasta** (jeśli
   recon potwierdzi, że taki był kontrakt) — udowodnione tym samym pomiarem co pkt 1.
4. AI nadal realnie rekrutuje (nie może wyjść tak, że AI przestaje mieć wojsko) — pomiar
   liczby jednostek AI po N turach przed/po, z jawnym komentarzem, czy zmiana jest akceptowalna.
   Jeśli naprawa zagłodziłaby AI z wojska — `BLOCK` z liczbami, nie ciche przepchnięcie.
5. **Parytet (`R-PROC-AUTOBOT-EVAL-STRICT-PARITY`, rule_108):** zmiana dotyczy AI; ścieżka
   GRACZA nie może się zmienić. Miasta-państwa (MP) rozstrzygnięte jawnie: czy obowiązuje
   ich ten sam zakaz.
6. Zero regresji: bramki AI (`ai-test`, `ai-unit-rush`, `ai-praca-split-parity` i pozostałe
   `ai-*` w `gra/tools/`) + 5 bramek referencyjnych — zielone. Każda zaktualizowana asercja
   uzasadniona jawnie (co pilnowała, dlaczego stary warunek przestał być prawdą).
7. `tsc --noEmit` i `vite build` (C-001) czyste.

## Pętla

Operator → Evaluator → Final Control → integracja orkiestratora, jedno ID, jedna gałąź.
Limit 5 rund. Model/effort: Opus 5 High dla Operatora i Evaluatora, Final Control Sonnet 5 High.
`opts.model` jawnie na KAŻDYM wywołaniu `agent()` (C-062).

## Raport terminalny dispatchu

ZMIANY/COMMIT: jeszcze brak — dispatch.
TESTY: kryteria sukcesu 1–7 wyżej.
BLOKADY: brak (pkt. 2 i 4 to jawne miejsca na DECISION_REQUIRED / BLOCK).
RUNDY: 0/5 (dispatch).
NASTĘPNY KROK: Operator, runda 1.
DEPLOY/PUSH: NIE WYKONANO.
