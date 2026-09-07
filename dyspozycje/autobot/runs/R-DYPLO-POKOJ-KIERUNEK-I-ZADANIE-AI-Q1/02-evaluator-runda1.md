STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-DYPLO-POKOJ-KIERUNEK-I-ZADANIE-AI-Q1
GOAL: Część A — bramka bilansu PW dla pokoju KIERUNKOWA (pominięta gdy partner autorem
aktualnych warunków, stosowana gdy gracz autorem). Część B — AI proponujące goły pokój
ma żądać surowców/złota, żeby wyrównać własny bilans do bliskiego zera.

ZMIANY/COMMIT: worktree `/home/user/wt-dyplo-pokoj-kierunek-zadanie`, commit `a87dae62`
(HEAD, potwierdzone `git rev-parse`), working tree czysty. `git diff --stat` względem
merge-base `3f7c68e3` dotyka WYŁĄCZNIE: `diplomacy-proposals.ts` (+39/-0),
`diplomacy-ai-offer-balance.ts` (+98/-3... właśc. +95/-3), `main.ts` (+52/-4),
`gra/tools/dyplo-pokoj-kierunek-runda1-test.cjs` (nowy, 313 linii),
`01-operator-runda1.md` (nowy) — zero plików poza allowlistą. `git diff --check` czysty
(brak whitespace errors).

TESTY (wszystkie uruchomione SAMODZIELNIE, nie na podstawie raportu):
- `node ./node_modules/typescript/bin/tsc --noEmit` → exit 0, czysto.
- `node tools/dyplo-pokoj-kierunek-runda1-test.cjs` → 18 PASS / 0 FAIL, potwierdzone.
  Ręczne przeliczenie TEST 3 (kontroferta): relacja zła (zaufanie=5,respekt=5) →
  relTotal=10 → relSigned=-90 (clamp ±90, bez zmian) → modPct=-90 →
  effectiveTreatyPnRequired(500,10)=round(500×0,10)=50; partnerTreatyPnRequired(500)=500;
  proposerIsPlayer (statyczne, proposerOwnerId=1≠0)=false → gałąź `else` woła
  treatyBaseFairnessGap z surowym relationTotal (tu bit-identyczne z clamped, bo 10<29) →
  gap=partnerRequired−playerRequired=500−50=450 → pokojPwBalance=−450. Zgodne z wynikiem
  testu. Bramka kierunkowa poprawnie użyła DYNAMICZNEGO `ctx.authorOwnerId` (=0, gracz po
  kontroferturze) zamiast statycznego `proposerOwnerId` (=1, partner) → accepted=false.
  Mutacja kontrolna (fallback wyłącznie na proposerOwnerId) daje accepted=true dla TEJ
  SAMEJ propozycji — test nietautologiczny, potwierdzone.
- Regresja historyczna P-DYPLO-BILANS-GATE, uruchomiona samodzielnie:
  `dyplo-bilans-gate-n-e1-reprodukcja-runda2-test.cjs` → 21 PASS/3 FAIL (zgodne z
  raportem), `-runda3-test.cjs` → 22 PASS/5 FAIL (zgodne), `-test.cjs` (bez numeru rundy)
  → 22 PASS/0 FAIL (zgodne). `dyplo-karta-decyzji-bilans-skrot-test.cjs` → 13/13 PASS
  (zgodne).
- Dodatkowa weryfikacja WŁASNA (nie w raporcie Operatora): empirycznie zbudowany
  minimalny fixture i wywołanie `balancePanelDataFromRows` (diplomacyAcceptanceBalance.ts,
  plik zadeklarowany jako NIETKNIĘTY) z dwoma scenariuszami: (i) direction='own',
  `responderPreview={accepted:false,pwBalance:-450,...}` → wynik `canAccept:false`
  (blokuje poprawnie); (ii) direction='incoming', `responderPreview={accepted:true,
  pwBalance:-450,...}` → wynik `canAccept:true` (nie blokuje, jak w rundzie 4). Potwierdza
  EMPIRYCZNIE (nie tylko przez czytanie kodu) twierdzenie Operatora, że ten plik faktycznie
  nie wymaga zmian — mechanizm generycznego `blockReason` poprawnie przejmuje nowe
  `accepted:false` z `evaluateProposal`, a wyjątek `uiActionId!=='10'` pozostaje martwy dla
  tego przypadku i nadal chroni `incoming`.

BLOKADY: brak technicznych blokujących merge. Dwa zastrzeżenia poniżej (zarzuty 1-2) nie
blokują, ale wymagają odnotowania/decyzji.

RUNDY: 1/5
NASTĘPNY KROK: Final Control (po adresowaniu/przyjęciu do wiadomości zarzutów niżej;
żaden z nich nie wymaga nowej rundy Operatora — oba są proceduralne/dokumentacyjne, nie
funkcjonalne).

ZARZUTY:
1. [proceduralny, nieblokujący] Dispatch (00-dispatch.md, sekcja IZOLACJA) WPROST wymagał:
   "sprawdź `git fetch origin main` PRZED rozpoczęciem pracy i ZDECYDUJ czy
   rebase'ować na nowszy main (prawdopodobnie TAK...)" — ponieważ
   `R-DYPLO-RELACJA-ETYKIETA-BLEDNA-Q1` (dotyka tych samych plików:
   `diplomacy-acceptance-points.ts`/`diplomacyAcceptanceBalance.ts`) mógł zostać
   zintegrowany do main w międzyczasie. Zweryfikowałem: ten temat FAKTYCZNIE zintegrował
   się do `origin/main` (commit `22aea4fc`/`698a370d`, "napraw fałszywą etykietę
   'Relacja 100'..."), a gałąź Operatora POZOSTAJE oparta o starą bazę `3f7c68e3` (branch
   6 commitów za `origin/main`) — bez rebase i BEZ ŻADNEJ wzmianki w raporcie Operatora o
   tym, że `git fetch`/decyzja o rebase w ogóle zostały wykonane, mimo jawnego wymogu
   dispatchu. Sprawdziłem `git merge-tree` (merge-base→HEAD vs origin/main) — brak
   konfliktowych znaczników, więc integracja allowlist-only prawdopodobnie przejdzie
   czysto mimo braku rebase — ale wymóg dispatchu został pominięty bez odnotowania, nie
   ma dowodu, że ktokolwiek to sprawdził przed rundą.
2. [dokumentacyjny, nieblokujący] Raport Operatora (TESTY) twierdzi: "KAŻDY FAIL dotyczy
   wyłącznie tej jednej asercji (gracz-proponent, kierunek 'own') — brak innych,
   nieoczekiwanych regresji". Uruchomiłem samodzielnie `dyplo-bilans-gate-n-e1-
   reprodukcja-runda2-test.cjs` (3 FAIL) i sprawdziłem każdy z osobna: dwa z nich
   rzeczywiście dotyczą tej asercji, ale trzeci — "(0e) mutacja E faktycznie usunęła...
   (runda 4: już tylko 1)" — to NIE jest ta asercja: to kontrola nietautologiczna
   starego harnessu mutacyjnego, licząca wystąpienia literału `pwBalance:
   pokojPwBalance,` w źródle (oczekuje dokładnie 1, dostaje 2 — bo nowa gałąź reject tej
   rundy dopisała DRUGIE wystąpienie tego samego literału obok istniejącego). Efekt jest
   nieszkodliwy (test i tak FAILuje z tego samego, oczekiwanego, świadomie
   zaakceptowanego powodu co reszta pliku — decyzja właściciela rundy 4 częściowo
   odwrócona), ale twierdzenie raportu "KAŻDY FAIL... wyłącznie tej jednej asercji" jest
   ściśle niedokładne dla tego jednego przypadku — to osobny, choć powiązany, tryb
   niepowodzenia starego testu.
DEPLOY/PUSH: NIE WYKONANO
