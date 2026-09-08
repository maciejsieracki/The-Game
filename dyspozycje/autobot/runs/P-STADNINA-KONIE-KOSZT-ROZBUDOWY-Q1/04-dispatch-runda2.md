STATUS: DISPATCH (RUNDA 2 — DECISION_REQUIRED rundy 1 rozstrzygnięty przez orkiestratora: rozszerzenie allowlisty)
DOMAIN: GAME
TEMAT: P-STADNINA-KONIE-KOSZT-ROZBUDOWY-Q1
GOAL RUNDY 2: Dokończ implementację z rundy 1 — wpięcie realnego magazynu 'kon' do bramki
`qualifies()` (`improvement-build.ts`) i odjęcie 50 'kon' przy faktycznym potwierdzeniu
budowy stadniny poza złożem, w `main.ts`.

DECYZJA ORKIESTRATORA (2026-09-08, odpowiedź na DECISION_REQUIRED rundy 1):
Allowlista tego tematu zostaje rozszerzona o `gra/src/main.ts`, WYŁĄCZNIE w zakresie
wskazanym przez Obronę rundy 1:
1. Budowa `ImprovementBuildState` (~linia 12538-12539) — dowiezienie aktualnego stanu
   magazynu 'kon' (empire-wide) do bramki `qualifies()` w `improvement-build.ts`.
2. `commitBuildRequest()` (~linia 12921-12969) — odjęcie dokładnie 50 'kon' z magazynu
   imperium przy potwierdzeniu budowy stadniny POZA złożem konia (na złożu — bez zmian,
   zero odjęcia).
3. Dwa miejsca odczytu `computeEmpireLivestockUnlocks`/`hasTradeRouteResourceAccess`
   (~linia 4619, ~6860-6862) — WYŁĄCZNIE jeśli zmiana semantyki w `livestock-unlock.ts`
   (runda 1 Obrony) tego wymaga dla spójności; jeśli te dwa miejsca używają wyniku do INNYCH,
   niepowiązanych celów (jak sugerował Evaluator rundy 1), NIE dotykaj ich — potwierdź to
   świeżo przed zmianą.
To jest DOKŁADNIE ten sam wzorzec precedensowy co poprzednie, już zaakceptowane w tej sesji
rozszerzenia allowlisty main.ts dla innych tematów (np. `AI_FIXED_PROCENT_NAUKA` w
`P-AI-BADANIA-ZACOFANIE-Q1`, `mapFieldBattle.ts` w `P-BITWA-PORTRET-GRACZA-ZNIKNIETY-Q1`) —
wąska, punktowa, uzasadniona koniecznością inżynieryjną, nie produktową. Handel 'kon' (punkt 3
oryginalnego ZADANIA) jest już ZAMKNIĘTY przez żywy dowód Obrony rundy 1 (10/10 OK,
end-to-end, bez zmian kodu) — NIE wracaj do niego, chyba że runda 2 znajdzie w nim realny
problem.

KONTEKST — PRZECZYTAJ RUNDĘ 1 W CAŁOŚCI (01-operator-runda1.md, 02-evaluator-runda1.md,
03-obrona-runda1.md) PRZED PIERWSZĄ ZMIANĄ KODU. W szczególności: Obrona rundy 1 już
potwierdziła że `cena_kon` istnieje w `econ-params.json` (zero zmian tam potrzebnych) i że
handel 'kon' działa end-to-end bez zmian kodu.

ZADANIE:
1. `gra/src/map/improvement-build.ts::qualifies()` (case `'stadnina'`, już w allowlist rundy 1)
   — zamień dzisiejszy warunek `hex.nakladka === Nakladka.ZlozeKonia ||
   isLivestockUnlockedForPlacement(key, hex, empireUnlocks)` na wersję z realnym kosztem: na
   złożu — bez zmian (zawsze dozwolone); poza złożem — dozwolone TYLKO gdy magazyn imperium ma
   >= 50 'kon' W CHWILI SPRAWDZENIA (nie tylko boolean "odblokowane").
2. `gra/src/game/livestock-unlock.ts::isLivestockUnlockedForPlacement` — zmień sygnaturę/
   semantykę tak, żeby przyjmowała (lub sąsiednia nowa funkcja przyjmowała) aktualny stan
   magazynu 'kon' zamiast samego zbioru `empireUnlocks` (boolean), zgodnie z ustaleniem rundy 1
   Obrony. Zachowaj `computeEmpireLivestockUnlocks` bez zmian jeśli inne miejsca (main.ts
   ~4619, ~6860-6862) go faktycznie potrzebują w dotychczasowej postaci — zweryfikuj świeżo.
3. `gra/src/main.ts` — dowieź aktualny stan magazynu 'kon' (empire-wide, ten sam odczyt co
   `citySurowceSumForOwner`/panel Surowców) do wywołania `qualifies()`/budowy
   `ImprovementBuildState` (~12538-12539). W `commitBuildRequest()` (~12921-12969) — po
   potwierdzeniu budowy stadniny POZA złożem, odejmij dokładnie 50 'kon' z magazynu imperium
   (analogicznie do istniejącego odejmowania Pracy w tej samej funkcji — ten sam wzorzec
   mutacji magazynu co reszta funkcji, nie osobna, równoległa ścieżka).
4. UI: `gra/src/ui/hexContextTooltip.ts` (już w allowlist rundy 1) — pokaż koszt "50 koni" i
   aktualny stan magazynu (np. "23/50 koni — brakuje 27") przy próbie budowy stadniny poza
   złożem z niewystarczającym zapasem.
5. Żywy dowód PRZED/PO (kontynuacja ZADANIA z `00-dispatch.md`, punkt 5): (a) stadnina na
   złożu — bez zmian, bez warunku magazynu, bez odjęcia; (b) poza złożem z magazynem < 50 —
   zablokowana z czytelnym komunikatem; (c) z magazynem >= 50 — budowa się udaje, magazyn
   spada dokładnie o 50; (d) cywilizacja bez naturalnego dostępu do koni gromadzi 50 sztuk
   drogą handlu (już potwierdzone że działa, Obrona rundy 1) i buduje stadninę poza złożem.

BINARNE KRYTERIUM SUKCESU: wszystkie 4 punkty żywego dowodu z ZADANIA pkt 5 potwierdzone.
Bydło/owce/lama bez żadnej zmiany zachowania (regresja potwierdzona żywym dowodem). `tsc
--noEmit` czysty, 5 bramek referencyjnych zielone, istniejące testy stadniny/hodowli nadal
zielone lub świadomie rozszerzone o nowy mechanizm kosztu.

ALLOWLISTA (rozszerzona wg decyzji orkiestratora powyżej):
- `gra/src/game/livestock-unlock.ts`
- `gra/src/map/improvement-build.ts`
- `gra/src/main.ts` (WYŁĄCZNIE: budowa `ImprovementBuildState` ~12538-12539,
  `commitBuildRequest()` ~12921-12969, i — TYLKO jeśli konieczne dla spójności —
  dwa miejsca odczytu ~4619/~6860-6862)
- `gra/src/game/empire-diplo-resource-flow.ts` (bez zmian oczekiwanych, zostaje na
  allowliście z rundy 1 na wszelki wypadek)
- `gra/src/ui/diplomacyTradeBasket.ts` i bezpośrednio powiązane (bez zmian oczekiwanych,
  handel już działa — zostaje na allowliście z rundy 1 na wszelki wypadek)
- `gra/src/ui/hexContextTooltip.ts`
- `gra/tools/*-test.cjs`
- `dyspozycje/autobot/runs/P-STADNINA-KONIE-KOSZT-ROZBUDOWY-Q1/*`
Zakaz `git add -A`. Zakaz zmiany bydła/owiec/lamy. Zakaz zmiany wartości 50 (liczba jawna
właściciela). Zakaz dotykania `gra/data/econ-params.json` (potwierdzone przez Obronę rundy 1
że `cena_kon` już istnieje, nic do zmiany).

REGUŁA PRZECIW SAMOOSZUKIWANIU: jak w `00-dispatch.md` — zakaz deklaracji "zaimplementowano"
bez żywego dowodu faktycznego odjęcia 50 z magazynu przy potwierdzeniu budowy.

IZOLACJA: kontynuuj w istniejącym worktree `/home/user/wt-stadnina-koszt`, ta sama gałąź
`autobot/P-STADNINA-KONIE-KOSZT-ROZBUDOWY-Q1`.
C-001: zakaz `npm run build`/`dev` w `gra/`; jedyna dozwolona kompilacja to
`node ./node_modules/typescript/bin/tsc --noEmit`.

PROCEDURA NAPRAWCZA PRZY FAIL: Evaluator wskazuje jeden konkretny defekt; runda N+1 na
TYM SAMYM ID i TEJ SAMEJ gałęzi. Liczy się jako RUNDA 2.

NASTĘPNY KROK: Operator → Evaluator → (Obrona jeśli zarzuty) → Final Control (Ścieżka A,
Workflow) — zmiana logiki gry + ekonomii + UI, wymaga Final Control.
DEPLOY/PUSH: NIE WYKONANO
