# P-REKRUTACJA-JEDNOSTEK-TYLKO-SKARBIEC-Q1

## ECHO — decyzja właściciela (2026-08-17)

**Cytat Macieja:**

> `P-REKRUTACJA-JEDNOSTEK-TYLKO-SKARBIEC-Q1 = B`
> Gracz, AI i miasta-państwa mają pozyskiwać jednostki wyłącznie przez zakup za
> Skarbiec/Pieniądze. Jednostki nie mają być produkowane w tej samej kolejce Pracy
> co budynki.

**Decyzja:** **B** — jednostka jest pozyskiwana wyłącznie przez zakup za Skarbiec/Pieniądze;
nie może być frontem ani wpisem w kolejce budynków finansowanej Pracą. Zasada obowiązuje
gracza, AI i miasta-państwa.

## Doprecyzowanie właściciela — 2026-08-19

Właściciel potwierdził, że AI ma **zawsze** zachowywać się tak jak gracz: kupować jednostki
za pieniądze, nie produkować ich w miejscu, gdzie wykorzystuje Pracę na budynki, i nie dostawać
osobnej furtki „tylko w czasie wojny”. Zakup jednostki i produkcja budynku są niezależne w tym
samym mieście. To doprecyzowanie nie zmienia litery `B`; usuwa tylko wcześniejsze, niekanoniczne
limity/rush-only po stronie AI.

## Zakres wdrożenia

- odłączenie jednostek od kolejki budynków przy zachowaniu produkcji budynków;
- zachowanie legalnych zakupów/rush za Skarbiec i ich istniejących kosztów;
- parytet gracz–AI–miasta-państwa, w tym limity i bramka środków;
- migracja starych kolejek/save bez crasha i bez martwych wpisów jednostek;
- testy realnych ścieżek: gracz, AI, miasto-państwo, MP, odrzucenie kolejki,
  zakup, brak środków, stary save, minimum dwa edge case’y i test mutacyjny.

## Zachowany wcześniejszy recon

Przed implementacją potwierdzić w aktualnym kodzie:

- `gra/src/game/production.ts` rozróżnia `ProductionKind = 'budynek' | 'jednostka'`,
  ma `availableProduction`, koszt jednostki oraz osobną sekcję zakupu/rush;
- ścieżki UI rekrutacji są w `gra/src/ui/unitRecruitCard.ts` i `gra/src/ui/cityPanel.ts`;
- ścieżki AI i końca tury trzeba prześledzić w `gra/src/game/ai.ts`,
  `gra/src/game/cities.ts`, `gra/src/game/turn-economy.ts` i `gra/src/main.ts`;
- save/load i migracja są w `gra/src/game/save.ts` oraz powiązanych typach produkcji;
- MP/miasta-państwa nie mogą dostać nowego darmowego fallbacku. Jeżeli dla któregoś
  ownera nie istnieje legalny zakup za Skarbiec, implementacja ma się zatrzymać z
  konkretnym ABC, zamiast tworzyć nową zasadę.

Ten recon jest punktem wyjścia; kod i testy mają go zweryfikować, nie zastępować
nieudokumentowanym założeniem.

## Status

**Status końcowy: GOTOWE/ZAMKNIĘTE — zaakceptowane przez Evaluatora jako
PASS-WITH-NOTES i potwierdzone w aktualnej ROBOCZEJ FALI 299.** ECHO pozostaje
zachowane historycznie (`bc200aee`); najnowsze doprecyzowanie i korekta AI są w
commicie `4f099cb1`, a deploy w `90e607c0`.

Dowód:

- implementacja: `914ce8da` (`fix: wymus jednostki tylko przez zakup ze skarbca`);
- testy kontraktów/migracji: `f30e13d7`, `c2a72a98`;
- test dedykowany: `rekrutacja-skarbiec-only-test.cjs` — **13/13 PASS**;
- parytet AI: `ai-unit-rush-test.cjs` **7/7** i `ai-rekrutacja-parytet-test.cjs` **7/7**;
- ROBOCZA: FALA 293 `8fa80b7c` → FALA 294 `a0f804d7`, `VERIFY OK`;
- aktualna ROBOCZA FALA 299: md5 `5dba37a12900d8f9a03a2da592d2cd8c`, `VERIFY OK`;
- zakres potwierdzony w `gra/src/game/production.ts`, `gra/src/main.ts` i
  `gra/src/ui/cityPanel.ts`.

**Pre-existing dług testowy — poza tą zmianą, nie przypisywać implementacji:**

- `unit-stock-cost-test.cjs` — **41/58 PASS**;
- `ai-recruit-upkeep-gate-test.cjs` — **18/27 PASS**.

Oba czerwone wyniki dotyczą istniejących rozbieżności kosztów magazynowych,
nie mechanizmu rekrutacji wyłącznie za Skarbiec.

Historyczne zdanie „Deploy, merge i push pozostają poza zakresem” dotyczyło
ówczesnej paczki i nie opisuje aktualnego snapshotu; FALA 299 została już
zdeployowana do ROBOCZEJ i wypchnięta jako `90e607c0`.
