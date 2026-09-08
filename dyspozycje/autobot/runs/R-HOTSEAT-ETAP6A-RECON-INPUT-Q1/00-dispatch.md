STATUS: DISPATCH
DOMAIN: INFORMATIONAL
TEMAT: R-HOTSEAT-ETAP6A-RECON-INPUT-Q1
GOAL: Recon-only (ZERO zmian kodu) dla pierwszego pod-etapu Etapu 6 planu hot-seat
(`docs/decyzje/PLAN-HOT-SEAT-2-GRACZY.md` §C, wiersz "6": "Migracja ~272 `ownerId === 0` wg
tabeli B2, w 6 podetapach: (a) input ~25, (b) UI ~75, (c) ekonomia ~50, (d) dyplomacja ~55,
(e) render ~15, (f) start ~15"). Ten temat obejmuje WYŁĄCZNIE podetap (a) — kategoria
"input" z tabeli B2 (§B2, wiersz 2): "Klik, zaznaczenie, ruch, atak, marsz, cykl jednostek,
koniec tury" → `isMe(id)` ("tylko aktywny wydaje rozkazy"). Kryterium gotowości z §C: "po
każdym podetapie: typecheck + bramki + 20 tur" (behawioralny no-op przy `humanOwnerIds=[0]`,
dokładnie wzorzec Etapów 1/3/4a).

**UWAGA: "koniec tury" z definicji kategorii (a) JEST JUŻ POKRYTY** przez świeżo zintegrowany
Etap 4 (`R-HOTSEAT-ETAP4A-WORLD-CODE-REALOKACJA-Q1` + `R-HOTSEAT-ETAP4B-SPLIT-Q1`,
`endActiveHumanTurn(humanOwnerId)`/`advanceSeat()`) — NIE dubluj tej pracy. Zakres tego
tematu: klik, zaznaczenie, ruch, atak, marsz, cykl jednostek — WSZYSTKO OPRÓCZ końca tury.

KONTEKST — PRZECZYTAJ W CAŁOŚCI PRZED DISPATCHEM RUND KOLEJNYCH:
- `docs/decyzje/PLAN-HOT-SEAT-2-GRACZY.md` §A2 ("Input / zaznaczanie / kliknięcia — ~25
  miejsc, semantyka «AKTYWNY człowiek»") i §B2 (tabela decyzyjna migracji, wiersz 2 i
  reguła kciuka: "Funkcja rysuje/reaguje na input/pokazuje komunikat → `isMe`").
- **Ta sama uwaga co przy KAŻDYM poprzednim etapie tej nocy: main.ts zmienia się codziennie
  (~3.4 commity/dzień), plan A2 był pisany na starym stanie pliku — WSZYSTKIE numery linii
  muszą zostać zweryfikowane świeżym grepem, nie skopiowane z planu.** Dodatkowo: Etapy 0-5
  (w tym `human-owners.ts`, `isHuman`/`isAiOwner`, `ME()`, `humanSeats`) są już zintegrowane
  — sprawdź czy któreś z ~25 miejsc "input" JUŻ zostało przy okazji zamigrowane (np. przez
  Etap 4b, który dotykał call-site'ów końca tury) zanim założysz że wszystkie 25 wciąż czekają.

ZADANIE TEJ RUNDY (WYŁĄCZNIE recon, zero kodu produkcyjnego):
1. **Zainwentaryzuj WSZYSTKIE miejsca w `gra/src/main.ts` (i ewentualnie `gra/src/game/*.ts`/
   `gra/src/ui/*.ts` jeśli input tam też się rozgałęzia) dotyczące**: klik na jednostkę/hex,
   zaznaczenie (`selectedId`, powiązane funkcje `selectPlayerUnit`/`clearPlayerUnitSelection*`),
   ruch (`move` command / pathfinding aktywowany klikiem), atak (inicjacja walki klikiem
   gracza, NIE sama mechanika walki AI), marsz (`plannedMarches`, `runPlannedMarchesAt*`),
   cykl jednostek (klawisz Tab/Space "następna jednostka" czy jak jest nazwany dziś) —
   świeżym grepem, z dzisiejszymi numerami linii. Dla KAŻDEGO miejsca ustal: czy dziś jawnie
   sprawdza `ownerId === 0` (kandydat do `isMe(id)`/`ME()`), czy już korzysta z
   `isHuman`/`isAiOwner`/`ME()` (już zamigrowane, pomiń), czy operuje na globalnym stanie bez
   klucza ownera (inny rodzaj problemu, jak `selectedId`/`plannedMarches` z Etapu 5 recon —
   sprawdź czy Etap 5 (`switchActiveHuman()`, świeżo zintegrowany) już to pokrywa przy
   handoff, czy zostaje jako osobna luka).
2. **Potwierdź/skoryguj liczbę "~25"** z planu — policz realnie, jak zrobił to recon Etapu 5
   dla "19 cache'y `_last*`" (znalazł 18+2, nie 19) — jeśli liczba się różni, wyjaśnij
   dlaczego, nie milcz.
3. **Dla każdego znalezionego miejsca zaproponuj konkretną podmianę** (`ownerId === 0` →
   `isMe(ownerId)`, z cytatem dokładnej linii przed/po) — analogicznie do tabeli z recon
   Etapu 1 (31 miejsc `ownerId>0`→`isAiOwner`, już zamknięty temat, możesz go przejrzeć jako
   wzorzec formatu, `git log --oneline | grep -i etap.1` żeby znaleźć commit/dokument).
4. **Sprawdź nakładanie z Etapem 4/5** (oba świeżo zintegrowane) — czy którekolwiek z 25
   miejsc input jest w kodzie, który Etap 4b przepisał (`endActiveHumanTurn`/`advanceSeat`)
   albo które Etap 5 (`switchActiveHuman`) już zamyka/resetuje przy handoff — jeśli tak,
   odnotuj że migracja tego miejsca może być NO-OPEM albo już częściowo pokrytym przypadkiem,
   nie podwajaj pracy.
5. **Zaproponuj plan dowodu no-op** — behawioralny no-op przy `humanOwnerIds=[0]`
   (`isMe(0)===true` zawsze dziś), z konkretną, wykonywalną metodą (headless czy Chromium —
   rozstrzygnij i uzasadnij, wzorem recon Etapu 4 §4.1/Etapu 5 §4.1 — input dotyka DOM-u/kliku,
   więc prawdopodobnie Chromium, ale zweryfikuj to rozumowanie, nie zakładaj z automatu).

BINARNE KRYTERIUM SUKCESU TEJ RUNDY: kompletna, świeżo zweryfikowana lista miejsc kategorii
"input" z dzisiejszymi numerami linii i konkretną podmianą per miejsce, jawne rozliczenie z
liczbą "~25" z planu, jawne sprawdzenie nakładania z Etapami 4/5, konkretny plan dowodu no-op.

ALLOWLISTA:
- `dyspozycje/autobot/runs/R-HOTSEAT-ETAP6A-RECON-INPUT-Q1/*` (WYŁĄCZNIE dokument recon —
  zero zmian w `gra/`)
Zakaz `git add -A`. Zakaz jakiegokolwiek kodu w `gra/src/**`/`gra/tools/**` w tej rundzie.

REGUŁA PRZECIW SAMOOSZUKIWANIU: zakaz przepisywania listy z planu bez świeżej weryfikacji
KAŻDEGO numeru linii osobno — main.ts przeszedł przez ~15 integracji tej samej nocy (Etapy
0-5 hot-seat + ~11 innych tematów), stare numery linii z planu są z dużym prawdopodobieństwem
nieaktualne.

IZOLACJA: worktree `/home/user/wt-hotseat-etap6a-recon`, gałąź
`autobot/R-HOTSEAT-ETAP6A-RECON-INPUT-Q1`, baza `origin/main` @ `911b5fcc`.
C-001: zakaz `npm run build`/`dev` w `gra/`; jedyna dozwolona kompilacja to
`node ./node_modules/typescript/bin/tsc --noEmit` (nie powinno być nawet potrzebne — zero
zmian kodu).

PROCEDURA NAPRAWCZA PRZY FAIL: Evaluator wskazuje jeden konkretny defekt; runda N+1 na
TYM SAMYM ID i TEJ SAMEJ gałęzi. Po 5 rundach: LIMIT-5-EXCEEDED.

NASTĘPNY KROK: Operator → Evaluator (Ścieżka A, Workflow). Final Control NIE dispatchowany
(dokument, nie kod). Po zamknięciu: dispatch `R-HOTSEAT-ETAP6A-INPUT-Q1` (implementacja)
jako osobny temat.
DEPLOY/PUSH: NIE WYKONANO
