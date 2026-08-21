# R-PRACA-SUWAKI-DUPLIKAT-I-CAP-MIASTO-Q1 — decyzja właściciela, Wątek C i E

**Data:** 2026-08-21
**Pełny opis tematu, wątków A-E i wstępnego recon:**
`dyspozycje/autobot/runs/R-PRACA-SUWAKI-DUPLIKAT-I-CAP-MIASTO-Q1/00-dispatch.md`

## Sytuacja (Wątek C)

Miasto w trybie „Indywidualne" (override automatu) może dziś ustawić lokalny podział
Budynki/Ulepszenia na dowolną proporcję (0–100% ulepszeń), niezależnie od globalnego capu
cywilizacji `MAX_PRACA_WSPOLNY_WOREK_PROCENT = 50`. To udokumentowana, świadoma decyzja
historyczna — `gra/tools/praca-limit-50-test.cjs`, scenariusz 5, wprost testuje że override
miasta **nie dziedziczy** capu nadrzędnego. Zrzuty ekranu właściciela pokazały miasto ustawione
na 70% ulepszeń / 30% budynki oraz odwrotnie 30%/70% — obie strony przekraczające 50%.

## Cel pytania

Ustalić, czy ta historyczna decyzja ma zostać cofnięta: czy miasto w trybie „Indywidualne" ma
teraz respektować ten sam cap 50%, który obowiązuje na poziomie cywilizacji.

## Warianty (zadane właścicielowi przez AskUserQuestion, 2026-08-21)

**A — Wymuś cap 50% też w mieście.** Miasto nie może ustawić ulepszeń terenu powyżej
globalnego capu cywilizacji (dziś 50%). Wymaga zmiany `gra/src/game/cities.ts` (lub miejsca,
gdzie override miasta jest klampowany) oraz aktualizacji `praca-limit-50-test.cjs`, który dziś
wprost testuje odwrotne zachowanie (scenariusz 5).

- Za: spójność — jeden cap obowiązuje wszędzie, brak możliwości obejścia limitu cywilizacji
  przez przełączenie miasta w tryb „Indywidualne".
- Za: zgodne z oczekiwaniem właściciela wyrażonym wprost przy okazji tego zgłoszenia.
- Przeciw: cofa świadomą, wcześniej podjętą i przetestowaną decyzję — wymaga jawnej zmiany
  testu referencyjnego, nie tylko kodu.
- Przeciw: może zmienić balans/zachowanie dla istniejących zapisów gry z miastami już
  ustawionymi powyżej 50% (wymaga sprawdzenia migracji/save-load).

**B — Zostaw jak jest, popraw tylko UI.** Miasto zachowuje niezależny zakres 0–100%; UI ma
jaśniej komunikować że to świadomy, historyczny wyjątek automatu, nie błąd.

**C — Inny próg dla miasta.** Miasto może przekroczyć cap cywilizacji, ale o ograniczoną
wartość (np. +20 p.p. ponad ustawienie globalne), nie do pełnych 100%.

## ECHO właściciela (2026-08-21, AskUserQuestion, główny czat orkiestratora)

**`R-PRACA-SUWAKI-DUPLIKAT-I-CAP-MIASTO-Q1 (Wątek C) = A`** — wymusić cap 50% (globalny, dziś
`MAX_PRACA_WSPOLNY_WOREK_PROCENT`) również dla override miasta w trybie „Indywidualne".
Wymaga: zmiany klampowania w `gra/src/game/cities.ts` (albo właściwego miejsca ustalonego przez
recon Operatora), aktualizacji `gra/tools/praca-limit-50-test.cjs` (scenariusz 5 musi się
zmienić — dziś asercja `eq(effective.pracaAutoPercent, 80, ...)` musi zostać zastąpiona
oczekiwaniem cap=50), oraz sprawdzenia migracji/save-load dla istniejących zapisów z miastami
ustawionymi powyżej 50%.

## Sytuacja i ECHO (Wątek E)

Suwak „Automatyzacja ulepszeń terenu" w panelu miasta ma dziś zakres 0–50%; właściciel chciał
0–100%. Pytanie zależne od reconu Operatora: czy ten suwak czyta TEN SAM stan co cap z Wątku C.

**ECHO właściciela:** **„Ta sama decyzja co Cap miasta 50%"** — czyli:
- Jeśli recon Operatora potwierdzi, że ten suwak czyta/zapisuje TEN SAM stan co globalny cap
  (Wątek A/C) → stosuje się decyzja A powyżej: cap zostaje 50%, suwak NIE rozszerza się do
  100% (rozszerzenie pozwoliłoby obejść dopiero co wymuszony cap przez tę samą furtkę).
- Jeśli recon potwierdzi, że to NIEZALEŻNY, osobny parametr lokalny (nie tied do globalnego
  capu cywilizacji) → oryginalne żądanie właściciela stoi: rozszerzyć zakres suwaka z 0–50%
  na 0–100% w tym jednym miejscu, to nie narusza żadnej polityki cywilizacji.

Operator MUSI w raporcie jawnie stwierdzić, którą z tych dwóch gałęzi zastosował i dlaczego
(dowód ze wspólnego pola stanu albo dowód niezależności), zanim zaimplementuje którykolwiek
wariant.

## Następny krok

Operator (Sonnet 5, Medium) dokańcza recon Kroku 1 (już w toku), następnie implementuje Wątek
C zgodnie z ECHO=A i Wątek E zgodnie z powyższą logiką zależną, w RAMACH TEGO SAMEGO tematu
(nie nowy ID). Pełna pętla Evaluator (High, z naciskiem na test save/load dla zmiany capu) →
Final Control (osobny subagent, High) → integracja orkiestratora.
