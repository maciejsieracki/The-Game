# R-HOTSEAT-ETAP6E-RECON-RENDER-Q1 — Evaluator, runda 2

Niezależna weryfikacja świeżym `grep`/`Read`/`git` w `/home/user/wt-hotseat-etap6e-recon`
(guard: `git log -1` = `e71773c1`, `git status --short` puste) i
`/home/user/wt-hotseat-etap6a-input`.

## Cztery zarzuty rundy 1 — wszystkie POTWIERDZONE naprawione

1. §2 — świeże `grep -rnE "(ownerId|playerOwnerId)\s*(=|\?\?)\s*0\b" gra/src/render/*.ts`
   zwraca dokładnie 5 trafień identycznych z dokumentem (`cities.ts:656/784/803`,
   `cityOkolicaOverlay.ts:298`, `units.ts:6464`); `grep -n "playerOwnerId:" gra/src/main.ts`
   potwierdza 6 literałów `playerOwnerId: 0` na 15883/16025/19369/19416/24543/24599
   (plus 2487 już liczone osobno). Naprawione z dowodem.
2. `sed -n '5368,5375p' gra/src/main.ts` potwierdza `if (!city || city.ownerId !== 0)`
   na linii 5372, opisane w §3B. Naprawione.
3. `grep -rn "computePotegaComponents" gra/src/` → wyłącznie definicja (14952), zero
   wywołań. §4 poprawnie opisuje funkcję jako martwą. Naprawione.
4. `git status`/`git log --oneline -3` w `wt-hotseat-etap6a-input` → „working tree
   clean", `621f353a`; `git merge-base --is-ancestor 621f353a origin/main` = FAŁSZ
   (niezmergowane). §6 opisuje to poprawnie jako „zacommitowane lokalnie, niezmergowane".
   Naprawione.

## ZARZUT 5 (NOWY) — arytmetyka §3B nie sumuje się do deklarowanego „~22"

§3B twierdzi: „9+10+1+1+1+2 = 21" — realnie `9+10+1+1+1+2 = 24`, nie 21 (błąd o 3,
zweryfikowane `python3 -c "print(9+10+1+1+1+2)"` → 24). Dodatkowo cząstkowa suma „10"
dla tabeli B pomija 2 własne pozycje tej samej tabeli: `_cityRenderOpts().getCiv`
(2450-2456) i `_cityRenderOpts().getCivIconId` (2480-2483) — oba opisane w tabeli B
jako odrębne, żywe hardkody („inline duplikat logiki `civTypeForOwner`, NIE woła
współdzielonej funkcji"), ale żaden z dwóch nie występuje w żadnym składniku sumy
(„10" wymienia tylko playerOwnerId+syncWorkerFieldOverlay+refreshTerritoryBorderOverlay+
syncOkolicaOverlay+6×cityRenderer.sync = 5 pozycji, nie 7 z tabeli). Poprawne zsumowanie
WSZYSTKICH pozycji wymienionych w §3B (9 + 12[cała tabela B] + 1[units:5798] +
1[setSelectionHex] + 1[applyFogVisibility] + 2[cities.ts:784/803] +
1[cityOkolicaOverlay:298]) daje **27**, nie 22. Deklarowane „~22" jest więc niespójne
z własnymi, jawnie wymienionymi składnikami dokumentu — nie tylko literówka, bo błąd
idzie w stronę zaniżenia liczby w dokumencie, którego całym celem jest rozliczenie
faktycznej skali (dokładnie ten typ błędu co pierwotne „16"). Dodatkowo §4 używa innej
wersji tej liczby („16→21/22") niż §2/§3B/§6/§9 („~22") — sam dokument nie jest spójny
nawet co do NOTACJI wyniku, nie tylko co do jego poprawności.

STATUS: FAIL
DOMAIN: INFORMATIONAL
TEMAT: R-HOTSEAT-ETAP6E-RECON-RENDER-Q1
GOAL: Recon-only (zero kodu) kategorii render/kamera Etapu 6 planu hot-seat (§C
podpunkt e, §A8)
TESTY: brak (docs-only); zarzuty 1-4 rundy 1 zweryfikowane świeżym grep/sed/git w tej
rundzie, wszystkie potwierdzone naprawione; zarzut 5 wsparty przeliczeniem arytmetyki
§3B i porównaniem z tabelą B tego samego dokumentu
BLOKADY: brak
RUNDY: 2/5
ZARZUTY:
5. §3B: deklarowana suma „9+10+1+1+1+2 = 21" jest arytmetycznie błędna (realnie 24);
   cząstkowa suma „10" pomija 2 pozycje własnej tabeli B (`_cityRenderOpts().getCiv`
   2450-2456, `_cityRenderOpts().getCivIconId` 2480-2483); poprawne zsumowanie
   wszystkich wymienionych w §3B pozycji daje 27, nie ~22; §4 dodatkowo cytuje inną
   wersję liczby („16→21/22") niż §2/§3B/§6/§9 („~22").
NASTĘPNY KROK: Obrona (runda 2, ten sam temat/gałąź) — lista zarzutów niepusta,
R-PROC-AUTOBOT.md §3c wymaga rundy Obrony przed kolejnym Evaluatorem.
DEPLOY/PUSH: NIE WYKONANO
