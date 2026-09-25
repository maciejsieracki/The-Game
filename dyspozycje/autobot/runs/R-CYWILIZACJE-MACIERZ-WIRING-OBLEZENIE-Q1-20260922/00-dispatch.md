# 00-dispatch — Oblezenie wiring Operator (data write + consumer wiring)

STATUS: DISPATCH READY
ROLE: Operator
TOPIC: R-CYWILIZACJE-MACIERZ-WIRING-OBLEZENIE-Q1-20260922
BOARD: the-game-real24
PROJECT: p_9ae9ac64
TENANT: the-game
BASE: origin/main=0caa4dfa31d37337cd74fdbab95ee77da4806d98
WORKSPACE: /home/ubuntu/projects/The-Game-civ-matrix-wiring-oblezenie-20260922
BRANCH: hermes/R-CYWILIZACJE-MACIERZ-WIRING-OBLEZENIE-Q1-20260922
MODEL: claude-sonnet-5
PROVIDER: anthropic

## Kontekst

Kontynuacja programu wiring civ-matrix (patrz precedens
R-CYWILIZACJE-MACIERZ-WIRING-MANPOWER-Q1-20260922, PASS pełnym łańcuchem —
ten dispatch stosuje ten sam wzorzec: nadpisanie starych placeholderów
+ podłączenie realnego konsumenta w tym samym cyklu). Właściciel: "wszystkie
nowe parametry w nowym Matrixie są obowiązujące [...] podłączyć teraz pod
realne konsumery [...] każdy parametr musi mieć konsumenta w grze [...]
wpływ ma być znaczący [...] statystyki nie zmieniają aktualnych parametrów,
a jedynie dodają się, mnożą, dzielą lub odejmują."

`gra/data/civ-matrix.json` ma dziś dla działu Oblężenie stare placeholdery
z 6 lipca 2026 (sprawdź sam `git log --follow -p -- gra/data/civ-matrix.json`
albo po prostu porównaj obecne wartości `obl_*` z
`INPUT-converted-values.json` przed zapisem). NADPISZ je.

## Kalibracja (gotowa, NIE do zmiany)

`INPUT-converted-values.json` zawiera przeliczone wartości natywne (pole
`values`) — wszystkie 3 parametry Oblężenia potraktowane jako efekt
STANDING/NON-COMPOUNDING (nie kumulują się co turę — to bonus per
starcie/atak, nie tick), skala ±0.20, analogicznie do
`dip_handlowosc_archetyp` (już działający precedens ±0.3-0.4) i do już
zamkniętego tematu Manpower (`mp_max_proc`/`mp_koszt_jednostki_proc` ±0.20).
Rekomendacja agenta, formalnie niepotwierdzona literą przez właściciela —
użyj wprost.

## WAŻNA UWAGA STRUKTURALNA — przeczytaj przed startem

`INPUT-converted-values.json → structural_note` opisuje kluczowe ryzyko:
prawdziwy mechanizm bonusu obrony miasta (`cityWallDefenseBonusPercent` w
`gra/src/game/city-defense.ts`) jest CELOWO WSPÓŁDZIELONY między
`gra/src/main.ts` (bitwa błyskawiczna na mapie, `structureDefenseBonusFor`)
i `gra/src/battle/battleScene.ts` (interaktywna bitwa/oblężenie,
`onWallWalkway`) — komentarz w pliku źródłowym wprost wymaga PARYTETU
("żeby oba tryby liczyły identyczną liczbę"). Sprawdziliśmy Kanban: NIE MA
dziś żadnego innego aktywnego tematu blokującego `battleScene.ts` (wcześniejsza
karta która go blokowała, `t_550b7836`, jest STALE i nieaktywna — możesz
edytować `battleScene.ts` jeśli to konieczne dla parytetu).

Musisz sam ustalić najlepsze miejsce podłączenia — prawdopodobnie w
`city-defense.ts` (`cityWallDefenseBonusPercent`), żeby automatycznie
propagować się do OBU trybów bez duplikowania logiki w dwóch plikach. Jeśli
po zbadaniu kodu uznasz, że bezpieczne podłączenie w jednym wspólnym miejscu
nie jest możliwe bez znaczącej przebudowy wykraczającej poza zakres tego
tematu — ZATRZYMAJ SIĘ i zgłoś DECISION_REQUIRED z dokładnym opisem
przeszkody, zamiast podłączać tylko jeden z dwóch trybów bitwy (co
oznaczałoby niespójne zachowanie między trybami — realny błąd, nie
akceptowalny skrót).

## SCOPE (dokładny allowlist)

1. `gra/data/civ-matrix.json`:
   - Nadpisz 3×15=45 komórek: `obl_obrona_miasta_proc`, `obl_mur_proc`,
     `obl_machines_proc` wartościami z `INPUT-converted-values.json→values`.
   - Zero innych zmian (nie ruszaj `paramDefs`/`defaults`/meta-parametrów —
     ten worktree wciąż ma 113 paramDefs, temat usunięcia meta jest osobny
     i już zamknięty, czeka na integrację).
2. `gra/src/game/city-defense.ts`:
   - Podłącz `obl_mur_proc` jako mnożnik do `cityWallDefenseBonusPercent`
     (bonus strukturalny muru/cytadeli/baszty/palisady) — SKŁADAJ się z
     istniejącym bonusem addytywnym, nie zastępuj (np. finalny % =
     structural_pct * (1 + obl_mur_proc), zachowując istniejącą logikę
     addytywną między warstwami mur/cytadela/baszta jako punkt wyjścia przed
     mnożeniem).
   - Podłącz `obl_obrona_miasta_proc` jako dodatkowy, osobny mnożnik ogólnej
     obrony miasta (jeśli jest sensowne miejsce odróżnić go od samego bonusu
     murów — jeśli nie ma dziś w kodzie takiego rozróżnienia, uzasadnij w
     raporcie jak go potraktowałeś, np. jako dodatkowy czynnik na tym samym
     wyniku funkcji).
   - Sprawdź czy trzeba dotknąć `main.ts`/`battleScene.ts` żeby przekazać
     civKey do `cityWallDefenseBonusPercent`/wywołań tej funkcji (podobnie
     jak w temacie Manpower — sprawdź czy civKey jest już dostępny w obu
     miejscach wywołania przez istniejące mechanizmy typu `civKeyForOwnerId`).
3. `gra/src/game/siegeMachines.ts` i/lub miejsce nadające statystyki
   jednostkom `category: 'obleznicza'` (Taran/Wieża) w `battle/battleScene.ts`
   (linie ok. 6975-7165, `wallAttack` z units.json):
   - Podłącz `obl_machines_proc` jako mnożnik do efektywnego `wallAttack`
     (obrażeń machin oblężniczych wobec murów/bram) dla właściciela machiny.
   - Jeśli struktura kodu nie pozwala łatwo przekazać civKey do tego
     konkretnego punktu bez większej przebudowy — zgłoś DECISION_REQUIRED
     dla TEGO JEDNEGO parametru z dokładnym opisem, ale nie blokuj tym
     pozostałych dwóch parametrów (mur/obrona miasta), jeśli te da się
     podłączyć bezpiecznie.
4. Nowy plik testowy `gra/tools/civ-matrix-oblezenie-wiring-test.cjs`:
   - Dowód że min. 2 różne cywilizacje z niezerową wartością dają realnie
     różny wynik bonusu obrony miasta (np. Grecy vs Zulusi dla obl_mur_proc,
     Grecy +0.2 vs Zulusi -0.2).
   - Analogicznie dla obl_obrona_miasta_proc.
   - Dla obl_machines_proc: albo dowód realnej różnicy w wallAttack machin,
     albo — jeśli DECISION_REQUIRED — test dokumentujący dlaczego nie da się
     dziś tego zweryfikować.
   - Kontrola negatywna: nieznana cywilizacja → mnożnik neutralny 1.0.
5. `dyspozycje/autobot/runs/R-CYWILIZACJE-MACIERZ-WIRING-OBLEZENIE-Q1-20260922/**`

## ACCEPTANCE

1. 45/45 komórek civ-matrix.json zgodne z INPUT-converted-values.json,
   zero innych zmian.
2. `tsc --noEmit` PASS.
3. Nowy test PASS z realnymi liczbami (albo jawnym, uzasadnionym
   DECISION_REQUIRED dla obl_machines_proc, jeśli strukturalnie
   niemożliwe w tym zakresie).
4. Istniejące testy oblężenia/miasta/city-defense (jeśli są) nadal PASS —
   znajdź je (`grep -rl "cityWallDefenseBonusPercent\|city-defense" gra/tools`)
   i uruchom.
5. `git diff --check` czyste; diff ograniczony do plików z allowlisty.
6. Brak commit/push/merge/deploy.

## ANTI-SELF-DECEPTION

Podłączenie TYLKO main.ts BEZ battleScene.ts (albo odwrotnie) jest FAIL —
złamałoby udokumentowany wymóg parytetu między trybami bitwy. Lepiej
zgłosić DECISION_REQUIRED dla całego działu niż stworzyć rozjazd między
dwoma trybami.

## REQUIRED ARTIFACTS

`01-operator.md`, `01-evidence.json`, `01-transition-receipt.md`.
`PUSH/DEPLOY: NIE WYKONANO`.

## NEXT PHASE

Terminal Operator → niezależny Evaluator → Obrona tylko dla zarzutów
blokujących → Final Control → workerless integration gate.
