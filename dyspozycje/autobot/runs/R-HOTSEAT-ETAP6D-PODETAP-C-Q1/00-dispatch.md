STATUS: DISPATCH
DOMAIN: GAME
TEMAT: R-HOTSEAT-ETAP6D-PODETAP-C-Q1
GOAL: Migracja klastra "silnik: inicjalizacja i save/load" (5 funkcji, ok. 7-9 miejsc
literału `0`) na `isMe()`/`isHuman()` wg aliasu wskazanego w recon, kontynuacja Etapu 6d.

KONTEKST — PRZECZYTAJ W CAŁOŚCI PRZED PIERWSZĄ ZMIANĄ:
1. README.md, docs/decyzje/R-PROC-AUTOBOT.md
2. `dyspozycje/autobot/runs/R-HOTSEAT-ETAP6D-RECON-REMAINDER-Q1/01-operator-runda1.md` —
   §3 (tabela funkcji, cytaty, uzasadnienie aliasu) i §6 "Podetap C". ŹRÓDŁO PRAWDY —
   nie zgaduj z nazwy, przeczytaj cytat i pełne ciało każdej funkcji świeżym `Read`.

DECYZJE ORKIESTRATORA na 2 nierozstrzygnięte aliasy z recon (§3, BLOKADY):
1. `finalizeAllianceObligationRefusals` (main.ts ok. 18733, `syncRelationFromDeals(0, allyId)`
   po odmowie obowiązku sojuszniczego) → **isMe/ME()**. Uzasadnienie: ten sam wzorzec co
   siostrzane, już zmigrowane `joinAllyToWar`/`applyAllianceObligationsOnWar` (oba isMe w
   ENGINE, commit `6ce48d7d`) — spójność rodziny funkcji obsługi sojuszy przy wojnie ważniejsza
   niż formalna reguła "stan pary" cytowana w recon jako alternatywa.
2. `resolvePendingDiplomacy` (main.ts ok. 16788, 16825, pętla po zaległych ofertach trybutu)
   → **isMe/ME()**, POD WARUNKIEM że Twój własny, pełny `Read` całego ciała (recon jawnie
   zaznaczył "ciało NIE odczytane w pełni, budżet rundy") potwierdzi że pętla operuje
   WYŁĄCZNIE na ofertach DO/OD aktywnego fotela (jak sugerują nazwa i literał). Jeśli pełny
   odczyt pokaże że funkcja iteruje po DOWOLNYCH parach (nie tylko gracz), STOP — zgłoś
   DECISION_REQUIRED zamiast wymuszać tę decyzję na kodzie, którego nie potwierdza.

ZADANIE: zmigruj na `isMe()`/`isHuman()` wg tabeli w recon §3:
- `applyClusterStartPlan` (8526-8530) — isHuman (inicjalizacja startowych relacji WSZYSTKICH
  par przy tworzeniu świata, nie ekran aktywnego fotela)
- `spawnPendingSameTypeRivals` (8653) — isHuman (wiarygodność DLA PARY nowego rywala)
- `finalizeAllianceObligationRefusals` (18733) — isMe (decyzja orkiestratora powyżej)
- `resolvePendingDiplomacy` (16788, 16825) — isMe (decyzja orkiestratora powyżej, warunkowo)
- `restoreGameFromSave` (36533 + ok. 36600, DWA hardkody w tej samej funkcji — recon rundy 2
  poprawił to z jednego na dwa, przeczytaj oba cytaty) — (a) 36533 negotiationTable restore →
  isMe (spójne z całą rodziną Podetapu E, ten sam typ danych); (b) 36600
  `diplomaticContactEstablished` pętla → isMe (kontakty odkryte przez aktywny fotel)

RYZYKO WYSOKIE — `applyClusterStartPlan` (tworzenie świata) i `restoreGameFromSave`
(wczytywanie zapisu) to funkcje wysokiego ryzyka regresji. Bramka referencyjna MUSI
obejmować pełny cykl: nowa gra → zapis → wczytanie → kontynuacja tury, dla trybu jednego
gracza (no-op dowód), NIE tylko `tsc --noEmit`.

REGUŁA PRZECIW SAMOOSZUKIWANIU: identyczna jak inne podetapy Etapu 6 — bramka no-op
PRZED/PO musi czerwienieć na wstrzykniętej mutacji (np. `isMe()`→zawsze `false` albo `ME()`→
literał różny od 0), inaczej to tautologia. Zakaz uznania save/load za "działające" bez
żywego testu Chromium z realnym `localStorage`/plikiem zapisu, nie symulacji struktury danych.

BINARNE KRYTERIUM SUKCESU: (1) wszystkie 5 funkcji zmigrowane zgodnie z aliasami wyżej;
(2) żywa bramka: nowa gra (jeden gracz) → kilka tur → zapis → wczytanie → kolejne tury,
identyczne zachowanie PRZED/PO; (3) bramka czerwienieje na mutacji; (4) istniejące bramki
save/load (`iron-era-enter-turn-save-load-test.cjs` i podobne) nadal zielone.

ALLOWLISTA:
- `gra/src/main.ts` — WYŁĄCZNIE ciała 5 wymienionych funkcji (świeży `grep -n` przed edycją,
  main.ts mógł się przesunąć od recon)
- `gra/tools/*-test.cjs` — nowa/rozszerzona bramka save/load no-op
- `dyspozycje/autobot/runs/R-HOTSEAT-ETAP6D-PODETAP-C-Q1/*`
Zakaz `git add -A`.

IZOLACJA: worktree `/home/user/wt-6d-PODETAP-C`, gałąź `autobot/R-HOTSEAT-ETAP6D-PODETAP-C-Q1`,
baza `origin/main`. C-001: zakaz `npm run build`/`dev`; `tsc --noEmit` jedyna dozwolona
kompilacja; `node ./node_modules/vite/bin/vite.js build --outDir <poza repo> --emptyOutDir`
jedyny dozwolony build do bramki Chromium.

PROCEDURA NAPRAWCZA PRZY FAIL: Evaluator wskazuje jeden konkretny defekt; runda N+1 na TYM
SAMYM ID i TEJ SAMEJ gałęzi. Po 5 rundach: LIMIT-5-EXCEEDED.

NASTĘPNY KROK: Operator → Evaluator → (Obrona jeśli zarzuty) → Final Control (Workflow, Sonnet
5 effort high) → integracja orkiestratora.
DEPLOY/PUSH: NIE WYKONANO
