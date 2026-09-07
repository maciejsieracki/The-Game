# R-HOTSEAT-ETAP4PREP-DEFERRED-OWNER-GUARDS-Q1 — dispatch

TEMAT: `R-HOTSEAT-ETAP4PREP-DEFERRED-OWNER-GUARDS-Q1`
RUNDA: 1/5
DOMAIN: INFRA (przygotowanie pod Etap 4 planu hot-seat, behawioralny no-op przy jednym
fotelu — mechaniczna podmiana `ownerId===0` → `isHuman(ownerId)`, ten sam wzorzec co
Etapy 1/3, ZERO próby rozcięcia funkcji `triggerPlayerEndTurn`)
ŚCIEŻKA: A (Workflow)
MODEL+EFFORT: Operator — Sonnet 5, effort medium; Evaluator — Sonnet 5, effort high;
Final Control — Sonnet 5, effort high (`R-PROC-AUTOBOT.md` §5a; nie wizualny).

## GENEZA

Recon Etapu 4 (`R-HOTSEAT-ETAP-4-RECON-END-TURN-Q1`, zamknięty, commit `72345570`,
dokument `dyspozycje/autobot/runs/R-HOTSEAT-ETAP-4-RECON-END-TURN-Q1/01-operator-runda1-analiza.md`)
znalazł kilka identyfikatorów odroczonych zdarzeń w `triggerPlayerEndTurn()` twardo
zawężonych do `ownerId===0`, mimo że mechanizm, który zasilają, faktycznie liczy się
dla KAŻDEGO ownera:

- `pendingAutoRationForNextTurn` (Ryzyko #4b, ~main.ts:28908): `if (ownerId === 0) {
  pendingAutoRationForNextTurn = autoRationResult; }` — auto-wyrównanie racji
  żywnościowych liczy `adjusted` dla każdego ownera, ale notyfikacja HUD trafia
  wyłącznie do puli gracza.
- `deferredMergePrompts` via `promptMergeIfCoLocated` (Ryzyko #4c, ~main.ts:10908-10909):
  `if (!rep || rep.ownerId !== 0) return;` — twardy guard PRZED logiką odkładania
  promptu scalenia jednostek.

**To NIE jest próba rozcięcia `triggerPlayerEndTurn()`** (to osobny, dużo większy i
ryzykowniejszy temat, `R-HOTSEAT-ETAP-4-...` właściwy, jeszcze niedispatchowany do
implementacji). Ten temat to wyłącznie mechaniczna podmiana `ownerId===0` →
`isHuman(ownerId)` w konkretnych, wskazanych miejscach — dokładnie ten sam,
sprawdzony wzorzec co Etapy 1 i 3 (zintegrowane, `87b33da3`/`302ea837`).

## GOAL

1. Świeżym grepem (main.ts zmienia się codziennie, NIE ufaj numerom linii wyżej)
   zlokalizuj OBA miejsca opisane w GENEZIE.
2. Przeczytaj kontekst KAŻDEGO z osobna — potwierdź własnym czytaniem kodu, że
   podmiana `ownerId===0`/`rep.ownerId!==0` na `isHuman(ownerId)`/`!isHuman(rep.ownerId)`
   jest semantycznie poprawna (czy to naprawdę pytanie „czy to człowiek", nie coś
   innego przebrane pod tę samą literę).
3. Podmień. Zero zmiany logiki poza samym warunkiem.
4. Świeżym grepem sprawdź czy istnieją INNE, analogiczne miejsca tej samej klasy w
   `triggerPlayerEndTurn()` (odroczone zdarzenia/kolejki/pending-* zawężone do
   `ownerId===0`), które recon mógł przeoczyć — jeśli znajdziesz, dodaj do zakresu tej
   rundy (to jest dokładnie ten typ pracy, więc mieści się w GOAL, nie jest scope creep).

## REGULA PRZECIW SAMOOSZUKIWANIU (ANTY-HALUCYNACYJNA)

Zakaz zakładania że `isHuman` z Etapu 3 jest już zaimportowane/dostępne w miejscu
`promptMergeIfCoLocated` bez sprawdzenia — to inna funkcja niż akcesory ekonomiczne,
potwierdź że alias jest w zasięgu (ten sam plik `main.ts`, ale sprawdź czy nie jest
zdefiniowany w zamknięciu niedostępnym z tego miejsca). Zakaz twierdzenia „no-op" bez
dowodu: pokaż że dla `humanSeats=[HUMAN_OWNER_PRIMARY]`, `isHuman(0)===true` i
`isHuman(<dowolny dodatni>)===false` — identyczne z `ownerId===0`.

## BINARNE KRYTERIUM SUKCESU

- Oba miejsca z GENEZY podmienione, plus wszelkie dodatkowe analogiczne miejsca
  znalezione świeżym grepem (GOAL pkt 4), z listą w raporcie.
- Dowód no-op: `isHuman(ownerId)` zachowuje się identycznie jak `ownerId===0` dla
  całej realnej domeny ownerId (0, dodatnie, sentinel barbarzyńca/rebeliant).
- `wojna-wymuszona-*`/`forced-war-*` bramki NIE dotyczą tego tematu (inny rejon
  main.ts) — ale uruchom 5 bramek referencyjnych + `tsc --noEmit` + jeśli istnieje
  dedykowana bramka dla `pendingAutoRationForNextTurn`/racji żywności (grep
  `autoRation`/`racj`) i dla scalania jednostek (`merge`), uruchom i potwierdź zielone
  i identyczne przed/po.
- Nowa/rozszerzona bramka jednostkowa dowodząca `isHuman(ownerId)===(ownerId===0)` dla
  obu zmienionych miejsc (może być rozszerzeniem istniejącej bramki z Etapu 1/3, jeśli
  pasuje).

## ALLOWLISTA

- `gra/src/main.ts` — wyłącznie podmiana warunków opisanych w GOAL.
- Nowa/rozszerzona bramka testowa.
- `dyspozycje/autobot/runs/R-HOTSEAT-ETAP4PREP-DEFERRED-OWNER-GUARDS-Q1/**`

Zakazane bezwzględnie: jakakolwiek próba rozcięcia/refaktoryzacji STRUKTURY
`triggerPlayerEndTurn()` (to osobny temat) — WYŁĄCZNIE punktowa podmiana warunków.
`gra/data/**`, pliki z sekretami, `docs/decyzje/**`, `.git/**`, `dyspozycje/WERSJE.md`,
`gra-robocza/**`, `ROBOCZA-MANIFEST.json`, `playbook.json`. Zakaz `git add -A` i
`git add .`.

## IZOLACJA

Worktree `/home/user/wt-hotseat-etap4prep`, gałąź
`autobot/R-HOTSEAT-ETAP4PREP-DEFERRED-OWNER-GUARDS-Q1`, baza jawnie `origin/main`
(commit `0418ed7f` w chwili założenia, może być nowszy przy starcie pracy — potwierdź
`git log -1` PRZED pracą, SS2b). **UWAGA konkurencji plików:** może być aktywny inny
temat dotykający `main.ts` w NIEPOWIĄZANYM regionie (np.
`R-WOJNA-WYMUSZONA-PROG-TURY-GRACZ-Q1`, region wojny wymuszonej ~30638) — to nie
blokuje pracy w tym worktree, orkiestrator zsekwencjonuje integrację ręcznie.

C-001: zakaz `npm run build`/`dev` w `gra/`; jedyna dozwolona kompilacja `tsc --noEmit`;
bramki `node tools/*-test.cjs` nie są objęte zakazem.

## PROCEDURA NAPRAWCZA PRZY FAIL

Evaluator wskazuje konkretny defekt i poprawkę; runda N+1 na TYM SAMYM ID i TEJ SAMEJ
gałęzi. Po 5 rundach: `LIMIT-5-EXCEEDED`.

## GRANICE

- Zero zmian widocznego zachowania gry przy jednym fotelu człowieka.
- Nie integrujesz, nie deployujesz, nie pushujesz.
- Zakaz jakiejkolwiek próby przebudowy `triggerPlayerEndTurn()` — to nie jest zakres
  tego tematu.

## OBIEG

Operator → Evaluator (ponumerowane zarzuty) → Obrona (gdy lista niepusta) → koniec
skryptu. Final Control osobno (Workflow, Sonnet 5 effort high), integracja
allowlist-only ręką orkiestratora.
