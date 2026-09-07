STATUS: DISPATCH
DOMAIN: GAME
TEMAT: R-ULEPSZENIA-FARMA-IRYGACJA-BYDLO-STACK-Q1
GOAL: Na jednym heksie z dostępem do rzeki da się postawić JEDNOCZEŚNIE Farmę + Irygację
+ Bydło (Trzodę) — dziś `canAddFoodLayer()` (`gra/src/map/improvement-build.ts:783-807`)
dopuszcza WYŁĄCZNIE parę (Farma+Irygacja XOR Farma+Bydło), nigdy trójkę.

ECHO WŁAŚCICIELA (żywa rozmowa 2026-09-07, wiążąca decyzja, ŚWIADOMIE ODWRACA CZĘŚĆ
kanonu `docs/decyzje/KANON-ULEPSZENIA-ZYWNOSC-HODOWLA.md` z 2026-06-29, §2.7/§3/§6, który
explicite wypisuje jako niedozwolone "Farma + irygacja + bydło naraz" i stwierdza "Farma
łączy się wyłącznie z jednym dodatkiem: irygacją XOR bydłem"):
> "Chciałbym jeszcze jedną rzecz zmienić, mianowicie możliwość robienia irygacji razem
> z farmą. W tej chwili grafika na to pozwala i myślę, że mechanika też powinna
> pozwalać, czyli teoretycznie moglibyśmy w jednym miejscu, tam gdzie jest rzeka,
> postawić farmę, irygację oraz trzodę. To byłaby ogromna przewaga miejsc z dostępem
> do wody."
Właściciel SAM nazwał to "ogromną przewagą" — recon potwierdził liczbowo: suma bonusów
trzech warstw to **+10 żywności / +9 pracy / +8 handlu** na jednym polu (ponad to, co
pole rzeczne już dziś dostaje niezależnie od ulepszeń). To jest ŚWIADOMA, potwierdzona
decyzja balansu, nie nieporozumienie — NIE zatrzymywać się na kolejne pytanie o zgodę,
chyba że w trakcie pracy wyjdzie na jaw coś, czego właściciel nie widział (np. drugi,
niezależny efekt uboczny poza tym, co już opisano niżej).

WAŻNE — recon (Explore agent) już ustalił, że architektura NIE wymaga przebudowy:
- Model danych pola JEST już wielowarstwowy (`hex.ulepszenia?: readonly string[]`, nie
  pojedynczy enum) — precedens stackowania już istnieje i działa produkcyjnie (Droga+
  Farma, Kamieniołom+Kopalnia rudy, Glinianka+Tartak, Farma+Irygacja, Farma+Bydło).
- Renderer (`gra/src/render/improvements.ts:517-601`, `buildImprovementStack()`) JUŻ MA
  gałąź obsługującą trójkę `farma && bydlo && owce` (linia 537) i po modelu
  `pole_irygowane` (Farma+Irygacja) dorysowuje KAŻDĄ pozostałą warstwę osobno (pętla
  `for (const k of normalized.filter(...))`) — nie wymaga zmiany dla obsługi
  Farma+Irygacja+Bydło jednocześnie, ale ZWERYFIKUJ to wizualnie (żywy zrzut), nie
  zakładaj na podstawie samego kodu.
- Jedyna bramka egzekwująca limit to `canAddFoodLayer()`
  (`gra/src/map/improvement-build.ts:783-807`), wołana z `qualifies()`
  (linie 942-1130, konkretnie przez `computeImprovementBuildImpact` linia 592-634).

ZADANIE:
1. Zmień `canAddFoodLayer()` tak, żeby dopuszczała `farma+irygacja+bydlo` razem (na
   polu spełniającym WSZYSTKIE dotychczasowe warunki każdej z trzech warstw z osobna —
   Irygacja nadal wymaga sąsiedztwa rzeki, Bydło nadal wymaga złoża na pierwsze
   postawienie). Zdecyduj i uzasadnij w raporcie: czy dopuszczasz też `irygacja+bydlo`
   BEZ farmy (dziś niemożliwe wprost, bo obie wymagają obecności Farmy) — właściciel nie
   prosił o to wprost, więc DOMYŚLNIE zostaw ten podprzypadek bez zmian (nadal
   niedozwolony), chyba że logika naturalnie by to dopuszczała bez dodatkowego kodu —
   wtedy zdecyduj świadomie i opisz decyzję.
2. Zaktualizuj `docs/decyzje/KANON-ULEPSZENIA-ZYWNOSC-HODOWLA.md` §2.7/§3/§6 — zmień
   opis reguły zgodnie z nową decyzją (nie usuwaj historii dokumentu, dopisz datowaną
   notatkę o zmianie z odesłaniem do tego tematu, wzorem innych aktualizacji kanonów w
   tym repo).
3. Zweryfikuj ŻYWYM zrzutem (Chromium/Playwright), że po postawieniu wszystkich trzech
   warstw na polu przy rzece: (a) build faktycznie się udaje (UI pozwala postawić
   trzecią warstwę bez błędu), (b) suma bonusów jest widoczna/poprawnie zliczana w
   ekonomii miasta (nie tylko w UI budowania), (c) renderer POKAZUJE wizualnie
   wszystkie trzy elementy na heksie (nie tylko dwa) — zrób zrzut ekranu jako dowód.
4. Zaktualizuj/rozszerz istniejące testy dotyczące `canAddFoodLayer`/limitu warstw
   żywnościowych (poszukaj `gra/tools/*.cjs` po nazwach związanych z "food-layer"/
   "farma"/"irygacja"/"bydlo"/"ulepszenia-zywnosc") tak, żeby dowodziły NOWEGO
   zachowania (trójka dozwolona) zamiast starego zakazu — to jest "test podążający za
   już wdrożoną zmianą" (SEDNO testu zachowane: nadal dowodzi które kombinacje są
   legalne, tylko zestaw legalnych się zmienił).

BINARNE KRYTERIUM SUKCESU: na heksie sąsiadującym z rzeką, spełniającym warunki
wszystkich trzech ulepszeń z osobna, UI pozwala zbudować Farmę + Irygację + Bydło
jednocześnie (potwierdzone żywym zrzutem), suma bonusów +10 żywności/+9 pracy/+8 handlu
faktycznie trafia do ekonomii miasta.

ALLOWLISTA:
- `gra/src/map/improvement-build.ts` (wyłącznie `canAddFoodLayer()` i bezpośrednio z nią
  związana logika — nie ruszać reszty pliku)
- `docs/decyzje/KANON-ULEPSZENIA-ZYWNOSC-HODOWLA.md` (aktualizacja opisu reguły, append,
  nie usuwanie historii)
- `gra/tools/*.cjs` (aktualizacja/rozszerzenie istniejących testów food-layer)
- `dyspozycje/autobot/runs/R-ULEPSZENIA-FARMA-IRYGACJA-BYDLO-STACK-Q1/*` (raporty własne)
Zakaz zmiany bonusów poszczególnych ulepszeń (`terrain-improvements.json` — te liczby
zostają, zmienia się WYŁĄCZNIE reguła łączenia). Zakaz zmiany renderera
(`gra/src/render/improvements.ts`) — recon wskazuje że już obsługuje trójkę, jeśli
weryfikacja pokaże inaczej, zgłoś DECISION_REQUIRED zamiast cichego rozszerzania
allowlisty. Zakaz `git add -A`.

REGUŁA PRZECIW SAMOOSZUKIWANIU: zakaz uznania zmiany za gotową bez żywego zrzutu
Chromium/Playwright pokazującego WSZYSTKIE TRZY warstwy jednocześnie postawione na
jednym heksie (wizualnie i w danych ekonomii) — sam zielony `tsc --noEmit` nie
wystarczy, to zmiana zachowania mechaniki budowania, nie tylko typów.

IZOLACJA: worktree `/home/user/wt-ulepszenia-farma-irygacja-bydlo`, gałąź
`autobot/R-ULEPSZENIA-FARMA-IRYGACJA-BYDLO-STACK-Q1`, baza `origin/main` @ `3f7c68e3`.
C-001: zakaz `npm run build`/`dev` w `gra/`; jedyna dozwolona kompilacja to
`node ./node_modules/typescript/bin/tsc --noEmit`.

PROCEDURA NAPRAWCZA PRZY FAIL: Evaluator wskazuje jeden konkretny defekt; runda N+1 na
TYM SAMYM ID i TEJ SAMEJ gałęzi. Po 5 rundach: LIMIT-5-EXCEEDED.

NASTĘPNY KROK: Operator → Evaluator (Ścieżka A, Workflow) → orkiestrator dispatchuje
Final Control osobno → integracja allowlist-only.
DEPLOY/PUSH: NIE WYKONANO
