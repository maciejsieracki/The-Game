STATUS: BLOCK (runda 3: punkt 1 NIE_ZMIERZONO — w żadnym przebiegu nie osiągnięto blokady bramki; punkt 2 NIE_ZMIERZONO — nie wykonano; brak zmian w gra/src i gra/data)
DOMAIN: GAME
TEMAT: R-WEB-LIVE-VERIFY-WAVE-689-697-A-Q1 — runda 3/5 (Operator HAIKU), wg DODATKU claude/sprawdzenie-funkcjonalnosci-ek4ra0 (00-dispatch-DODATEK-claude.md)
GOAL: dowód w żywej grze (Chromium, bundle vite poza repo, ?civTest=1): (1) bramka „Zakończ turę” w turze ≥11 przy deficycie: tooltip (title) z zasobem/minusem/dźwigniami, klik nie kończy tury, dźwignia kończy turę, tury 1–10 bez blokady, brak zakleszczenia; (2) okno „Umowa wymiany surowców” bez przeładowania węzła, obie strony wypełnialne, podpowiedź przy pustej stronie, zrzuty przed/po.
BAZA: 99e283cfa (origin/main; kandydat r1/r2). Kod gry bez zmian.
ZMIANY-COMMIT: nowy plik gra/tools/live-verify-wave-689-697-a-gate-v3.cjs (allowlista: gra/tools/live-verify-wave-689-697-a-*.cjs); evidence: runs/R-WEB-LIVE-VERIFY-WAVE-689-697-A-Q1/evidence/r3/ (surowe stdouty i result JSON); ten raport. Commit tylko tych ścieżek (bez -A). Symlink gra/node_modules -> worktree wf_435ffc79-d22-1 (poza commitem, gitignored). Bundle zbudowany do scratchpada (vite build exit 0, "✓ built in 15.75s").

TESTY (liczby z surowego wyjścia):
- vite build --outDir <scratchpad>/dist-r3: exit 0, "✓ built in 15.75s". (Pierwsza próba: brak node_modules w worktree — usunięte symlinkiem.)
- Sweep A (gra/tools/live-verify-wave-689-697-a-gate-v3.cjs --mode sweep --step 250 --maxsteps 200; stdout: evidence/r3/sweep-stdout.txt): tura 11 bez grantów przed sweepem (reachedTurn 11, awaitingFirstCity false). Sweep 50 000: transitions = [{total 0, canEnd true, turn 11}], firstBlockedDeficit null, errors [], fatal -.
- Sweep B (--step 1000 --maxsteps 150; evidence/r3/sweep2-stdout.txt): suma 150 000, bez przejścia canEnd, bez zmiany tury, firstBlockedDeficit null.
- Sweep C (--step 2500 --maxsteps 120; evidence/r3/sweep3-stdout.txt): suma 300 000, bez przejścia canEnd, bez zmiany tury (brak resetu do TURA 1 — UWAGA: przy tej ścieżce reset z r1/r2 NIE wystąpił), firstBlockedDeficit null.
- Sweep D (--pre 140000 --step 250 --maxsteps 100; evidence/r3/sweep4-pre140k-stdout.txt): po dosypce −140 000 canEnd true (preCanEnd true), sweep dalej do 165 000: bez przejścia, firstBlockedDeficit null.
- Check (tury 1–10 z deficytem T, punkt 3): NIE uruchomiono — nie ustalono T, bo blokada nie wystąpiła.
- Punkt 2 (okno wymiany, live): NIE uruchomiono (brak haka otwarcia okna; czas rundy).

INTERPRETACJA (ustalenia z kodu + pomiaru, nie dowód):
- canPlayerInitiateEndTurn (gra/src/main.ts ~39427–39470) blokuje przez nnsGateForPlayer().blokada. nnsGateForPlayer (main.ts ~39401) czyta salda NA ŻYWO (skLive) i prognozę netto tury, a decideEndTurnGate blokuje tylko gdy dźwignie (_nnsPodatekZysk, _nnsRacjeZysk) pokrywają brak. Wniosek: sam ujemny skarbiec o dużej wielkości (ponad lewar) NIE daje blokady — bramka jest wąskim oknem „brak > 0 i brak ≤ dźwignie”. Okna nie udało się trafić krokami 250/1000/2500 w zakresie 0–300 000, ani krokiem 250 w zakresie 140 000–165 000.
- Konsekwencja: scenariusz DODATKU pkt 1 („deficyt realny: miasto, tura ≥11, podatek min., jednostki utrzymania”) wymaga zbudowania ujemnego przepływu tury (utrzymanie), a nie dosypki skarbca. Hak do dodania jednostek gracza nie jest dostępny (spawnAiUnits działa dla ownera AI; ME() to humanSeats.activeHumanOwnerId — nie sprawdzono w tej rundzie, czy spawnAiUnits(ME(),n) nadaje się do tego). Nie wykonano z powodu czasu rundy i braku zweryfikowanego haka.
- Poprzedni pomiar r1/r2 (blokada przy dosypce 132–152 tys. z +5000 grantami co turę) NIE został odtworzony w czystym scenariuszu bez grantów (sweep A–D). Zjawisko „TURA 1 / Załóż miasto” z r1/r2 w tym scenariuszu nie wystąpiło — wniosek dla UWAGI-1: prawdopodobnie związane z grantami przed turą 11 (artefakt harnessu), do potwierdzenia.

BLOKADY:
1. Punkt 1 — NIE_ZMIERZONO: blokada bramki nie wystąpiła w żadnym sweepie (zob. TESTY). Bez zbudowania realnego ujemnego przepływu (utrzymanie jednostek) nie da się uczciwie zmierzyć tooltipa, kliku, dźwigni ani tur 1–10 z deficytem.
2. Punkt 2 — NIE_ZMIERZONO: okno „Umowa wymiany surowców” nie otwarte w tej rundzie (brak ścieżki UI/haka potwierdzonej w kodzie; brak czasu).
3. Dźwignie UI (podatek w górę/racje w dół/rozwiązanie jednostki) — NIE klikane (nie dotyczy, bo blokady nie było).
4. Dispatch DODATEK: wymaga, by naprawa była realną dźwignią; w tej rundzie żadna naprawa nie była potrzebna.

RUNDY: 3/5 (Operator, HAIKU). Rundy r1 i r2 — FAIL tej samej rundy 1 (wg dispatchu). Jeśli r3 → FAIL, zasada modeli dopuszcza Sonnet dopiero po 2 nieudanych rundach Haiku TEGO SAMEGO tematu — orkiestrator decyduje.

NASTĘPNY KROK (rekomendacja operatora):
  a. Zweryfikować w kodzie/haku, jak zbudować realny ujemny przepływ gracza (utrzymanie): np. hak dodania jednostek ME() (spawnAiUnits(ME(),n) — sprawdzić, czy kopiuje jednostkę gracza poprawnie), albo ustawienie podatku na minimum przez UI (suwak) — wymaga selektorów UI.
  b. Dopiero po zbudowaniu deficytu przepływu: sweep (krok 250) wokół progu, potem check (tury 1–10 przy T) i pomiar title/kliku/dźwigni. Runner v3 ma już tryby sweep i check oraz opcję --pre.
  c. Punkt 2: osobny runner (okno wymiany przez dyplomację/UI), zrzuty przed/po, porównanie identyczności węzła kontenera.
  d. UWAGI-1 (reset do TURA 1): nie odtworzony w czystym scenariuszu — osobna weryfikacja, czy r1/r2 był artefaktem grantów.

DEPLOY/PUSH: NIE WYKONANO (brak READY_FOR_DEPLOY; push i integracja poza zakresem Operatora).

UWAGI-DLA-ORKIESTRATORA:
UWAGI-1: Reset gry do „TURA 1 · Załóż miasto” z r1/r2 nie wystąpił w sweepach A–D (łącznie do 300 000 dosypki ujemnej, tura 11, bez grantów przed sweepem). Źródło ustala się w r4 albo osobnym tematem R-WEB-*.
UWAGI-2: Bramka „Zakończ turę” w kodzie blokuje tylko w wąskim oknie (brak ≤ dźwignie); duży ujemny skarbiec sam w sobie nie wystarcza. To jest zgodne z kodem, nie jest defektem sam w sobie — do potwierdzenia pomiarem po zbudowaniu przepływu.
UWAGI-3: runner gra/tools/live-verify-wave-689-697-a-gate-v3.cjs zawiera tryb check z pętlą tur 1–10 i opcję --pre; wymaga zweryfikowania przed dalszym użyciem (sweep i pre działają; check nieuruchomiony).
UWAGI-4: w worktree nie było gra/node_modules — użyto symlinku do istniejącego node_modules w innym worktree (gitignored, poza commitem). Dysk: ~14 GB wolnego przed startem.
UWAGI-5: Zakres punktu 2 (okno wymiany) nie zbadany live w żadnej rundzie tego tematu — priorytet przy r4.
