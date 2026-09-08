STATUS: DISPATCH
DOMAIN: INFORMATIONAL
TEMAT: R-HOTSEAT-ETAP6D-RECON-REMAINDER-Q1
GOAL: Dokończyć pełną inwentaryzację pod-etapu 6d (dyplomacja) planu hot-seat POZA już
zmigrowanym podzbiorem 20 funkcji (`R-HOTSEAT-ETAP6D-DIPLOMACY-ENGINE-Q1`, zintegrowany,
commit `6ce48d7d`), i zaproponować konkretny podział pozostałej pracy na kilka niezależnych,
w pełni bramkowalnych podetapów implementacyjnych — dokument, ZERO zmian w `gra/src`.

KONTEKST — PRZECZYTAJ W CAŁOŚCI PRZED PIERWSZĄ NOTATKĄ:
- `dyspozycje/autobot/runs/R-HOTSEAT-ETAP6D-RECON-DIPLOMACY-Q1/01-operator-runda1.md` —
  pierwszy recon, floor ≥136 miejsc, z których tylko 20 (nazwanych funkcji, tabela §4) zostało
  dotąd w pełni zinwentaryzowanych i zmigrowanych.
- `dyspozycje/autobot/runs/R-HOTSEAT-ETAP6D-DIPLOMACY-ENGINE-Q1/00-dispatch.md` i
  `01-operator-runda1.md` — lista dokładnie 20 już zmigrowanych funkcji + zasada
  kategoryzacji aliasu (isHuman = liczy/zapisuje stan DOWOLNEJ pary ownerów, w tym AI-AI;
  isMe/ME() = perspektywa AKTYWNEGO fotela — HUD/komunikat/akcja inicjowana przez gracza).
- Pierwotny recon jawnie zostawił otwarte pytanie właściciela: „kontynuacja pełnej
  inwentaryzacji vs. podział na pod-kategorie". TEN temat ma dostarczyć materiał do obu:
  pełną listę pozostałych miejsc ORAZ konkretną propozycję podziału na podetapy — właściciel
  dostanie gotową do zatwierdzenia strukturę zamiast abstrakcyjnego pytania.
- main.ts zmienia się codziennie — wszystkie numery linii z poprzednich reconów muszą być
  zweryfikowane świeżym grepem, nie kopiowane wprost.

ZADANIE:
1. Świeżym grepem znajdź WSZYSTKIE pozostałe miejsca w `gra/src/main.ts` związane z klastrem
   dyplomacji (relacje, wojny, sojusze, traktaty, audiencja, kontakt dyplomatyczny) zawierające
   hardkod `ownerId===0`/`!==0`/literał `0` jako argument do funkcji dyplomacji — Z WYŁĄCZENIEM
   ciał 20 już zmigrowanych funkcji (wymień je jawnie na starcie raportu, żeby nie dublować).
2. Dla KAŻDEGO znalezionego miejsca: nazwa funkcji/bloku, numer linii, cytat kodu, proponowany
   alias (`isHuman`/`isMe`/`ME()`) z uzasadnieniem wg zasady z kontekstu (przeczytaj ciało,
   nie zgaduj z nazwy).
3. Osobno zinwentaryzuj (bez migrowania): `game/forced-war-bronze.ts`, `game/forced-war-stone.ts`,
   `game/diplomacy-border-march.ts` oraz dev/playtest harness (`forceBronzeForcedWarDominoOnPlayer`,
   wywołania `setDiploRelation(0, ...)` w `playtestWalkaMapy`-owych narzędziach) — te zostają
   POZA zakresem migracji tego i następnych podetapów bez osobnej, jawnej decyzji właściciela
   (ryzyko: dev-harness może celowo testować z literałem 0, migracja mogłaby zepsuć testy).
4. Na podstawie pełnej listy z pkt 1-2 zaproponuj podział na **2-4 niezależne podetapy**
   implementacyjne (wzorem już zamkniętego podzbioru 20 funkcji) — każdy z: nazwą,
   przybliżoną liczbą miejsc, listą funkcji, uzasadnieniem dlaczego akurat taki podział
   (np. wg mechaniki: "traktaty/sojusze" vs "wojny/napięcie" vs "UI audiencji/panel").
   Podział ma być na tyle mały per-podetap, żeby dało się go zamknąć w 1-2 rundach
   Operator→Evaluator, wzorem dotychczasowych 20-funkcyjnych tematów.

BINARNE KRYTERIUM SUKCESU: pełna lista pozostałych miejsc dyplomacji w main.ts (poza już
zmigrowanymi 20 funkcjami) z proponowanym aliasem i uzasadnieniem dla każdego; jawna,
osobna sekcja dla dev-harness/border-march.ts (bez migracji); konkretna propozycja podziału
na 2-4 podetapy gotowa do zatwierdzenia przez właściciela lub bezpośredniego dispatchu.

ALLOWLISTA:
- `dyspozycje/autobot/runs/R-HOTSEAT-ETAP6D-RECON-REMAINDER-Q1/*` (WYŁĄCZNIE ten katalog)
Zakaz jakichkolwiek zmian w `gra/src/**`, `gra/tools/**`, `gra/data/**`. To jest dokument,
nie implementacja. Zakaz `git add -A`.

REGUŁA PRZECIW SAMOOSZUKIWANIU: zakaz przyjęcia że "floor ≥136 z pierwszego recon" jest
nadal aktualną liczbą — main.ts się zmienił, policz świeżo. Zakaz pominięcia uzasadnienia
aliasu z cytatem ciała funkcji (sama nazwa funkcji nie wystarcza, wzorem poprzedniego tematu
gdzie 9/19 funkcji nienazwanych wprost wymagało przeczytania ciała).

IZOLACJA: worktree `/home/user/wt-hotseat-etap6d-recon-remainder`, gałąź
`autobot/R-HOTSEAT-ETAP6D-RECON-REMAINDER-Q1`, baza `origin/main` @ `3070c777`.
C-001: zakaz `npm run build`/`dev` w `gra/` (i tak niepotrzebne — dokument).

PROCEDURA NAPRAWCZA PRZY FAIL: Evaluator wskazuje jeden konkretny defekt; runda N+1 na
TYM SAMYM ID i TEJ SAMEJ gałęzi. Po 5 rundach: LIMIT-5-EXCEEDED.

NASTĘPNY KROK: Operator → Evaluator → (Obrona jeśli zarzuty). Final Control NIE dotyczy
(dokument, docs-only, wzorem poprzednich reconów Etapu 6). Po zamknięciu: orkiestrator
albo dispatchuje zaproponowane podetapy bezpośrednio (jeśli podział jest technicznie
bezsporny), albo przedstawia właścicielowi do wyboru, jeśli podział niesie realne
konsekwencje projektowe.
DEPLOY/PUSH: NIE WYKONANO
