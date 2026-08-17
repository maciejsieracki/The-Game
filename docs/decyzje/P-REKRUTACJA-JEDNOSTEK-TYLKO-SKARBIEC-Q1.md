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

**ECHO zapisane — 🟡 ZAPISANA.** Implementacja następuje po osobnym commicie ECHO.
Deploy, merge i push pozostają poza zakresem.
