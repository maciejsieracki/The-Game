STATUS: DISPATCH
DOMAIN: INFORMATIONAL
TEMAT: R-HOTSEAT-ETAP6F-PART2-RECON-Q1
GOAL: Recon (bez implementacji) części (ii) pod-etapu 6f planu hot-seat — NOWEJ
funkcjonalności potrzebnej do faktycznego uruchomienia dwóch foteli ludzkich: drugi heks
startowy i wybór drugiej cywilizacji w menu startowym. Część (i) — prosta migracja
AI-roster — jest już zamknięta (`R-HOTSEAT-ETAP6F-START-MIGRACJA-Q1`, commit `0a1b6b7e`).
Ten temat ma dać właścicielowi gotowe do decyzji opcje projektowe, NIE wdrażać żadnej z nich.

KONTEKST — PRZECZYTAJ W CAŁOŚCI PRZED PIERWSZĄ NOTATKĄ:
- `docs/decyzje/PLAN-HOT-SEAT-2-GRACZY.md` — pełny plan, w tym opis Etapu 6f i miejsce tej
  części (ii) w całości (przygotowanie GRY do dwóch foteli — Etap 8, faktyczne włączenie
  hot-seatu, jest jawnie POZA zakresem całego tego planu, więc ten recon też nie projektuje
  Etapu 8, tylko brakującą infrastrukturę startu).
- `dyspozycje/autobot/runs/R-HOTSEAT-ETAP6F-RECON-START-Q1/01-operator-runda1.md` — recon
  część (i), zawiera wzmiankę o części (ii) i dlaczego została odłożona (nowa funkcjonalność,
  nie migracja literałów).
- `dyspozycje/autobot/runs/R-HOTSEAT-ETAP6F-START-MIGRACJA-Q1/01-operator-runda1.md` —
  zamknięta implementacja część (i), pokazuje jak `aiStartHexes`/`humanOwnerIds` działają
  dziś (jeden human, owner 0).
- main.ts zmienia się codziennie — wszystkie numery linii muszą być zweryfikowane świeżym
  grepem, nie kopiowane z pamięci.

ZADANIE:
1. Zweryfikuj świeżo, jak dziś działa wybór heksu startowego i cywilizacji w menu (main.ts +
   ewentualnie `game/cluster-start.ts` i pliki menu startowego) — dokładne funkcje, struktury
   danych (`aiStartHexes`, `humanSeats`, cokolwiek przechowuje wybór cywilizacji gracza).
2. Zidentyfikuj DOKŁADNIE, czego brakuje żeby wybrać DRUGI heks startowy i DRUGĄ cywilizację
   dla drugiego człowieka — nowe pola danych, nowe kroki UI w menu, walidacje (np. czy drugi
   heks musi spełniać te same reguły odległości/terenu co pierwszy, czy druga cywilizacja
   może być taka sama jak pierwsza).
3. Zaproponuj **2-3 warianty projektowe** (np. „sekwencyjny wybór: najpierw fotel 1 kompletnie,
   potem fotel 2" vs „naprzemienny: heks1→heks2→cywilizacja1→cywilizacja2" vs inny) z
   krótkimi za/przeciw każdego — bez wdrażania żadnego.
4. Jawnie wypisz WSZYSTKIE pytania wymagające decyzji właściciela zanim cokolwiek z tego
   można zaimplementować (to jest z definicji temat projektowy/UX, nie migracja literałów —
   nie zgaduj rozstrzygnięć, tylko je nazwij, wzorem ABC).

BINARNE KRYTERIUM SUKCESU: dokument zawiera (a) dokładny opis dzisiejszego stanu z cytatami
kodu i numerami linii, (b) listę brakujących elementów danych/UI, (c) 2-3 warianty projektowe
z za/przeciw, (d) jawną listę pytań ABC do właściciela. Zero propozycji kodu do wdrożenia
bez uprzedniej decyzji.

ALLOWLISTA:
- `dyspozycje/autobot/runs/R-HOTSEAT-ETAP6F-PART2-RECON-Q1/*` (WYŁĄCZNIE ten katalog)
Zakaz jakichkolwiek zmian w `gra/src/**`, `gra/tools/**`, `gra/data/**`. To jest dokument,
nie implementacja. Zakaz `git add -A`.

REGUŁA PRZECIW SAMOOSZUKIWANIU: zakaz przedstawienia jednego wariantu jako oczywistego
"najlepszego" bez wypisania realnych wad — to jest temat UX/projektowy, właściciel decyduje,
nie Operator. Zakaz cytowania numerów linii bez świeżej weryfikacji w dzisiejszym main.ts.

IZOLACJA: worktree `/home/user/wt-hotseat-etap6f-part2-recon`, gałąź
`autobot/R-HOTSEAT-ETAP6F-PART2-RECON-Q1`, baza `origin/main` @ `3070c777`.
C-001: zakaz `npm run build`/`dev` w `gra/` (i tak niepotrzebne — dokument).

PROCEDURA NAPRAWCZA PRZY FAIL: Evaluator wskazuje jeden konkretny defekt; runda N+1 na
TYM SAMYM ID i TEJ SAMEJ gałęzi. Po 5 rundach: LIMIT-5-EXCEEDED.

NASTĘPNY KROK: Operator → Evaluator → (Obrona jeśli zarzuty). Final Control NIE dotyczy
(dokument, docs-only). Po zamknięciu: orkiestrator przedstawia właścicielowi warianty +
pytania ABC do decyzji — implementacja część (ii) startuje dopiero po odpowiedzi.
DEPLOY/PUSH: NIE WYKONANO
