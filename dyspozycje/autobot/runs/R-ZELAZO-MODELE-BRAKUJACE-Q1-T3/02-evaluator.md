Verification complete. Worktree restored clean, test green (40/40, exit 0).

---

**STATUS: PASS-WITH-NOTES**
**DOMAIN:** GAME
**TEMAT:** `R-ZELAZO-MODELE-BRAKUJACE-Q1-T3`
**GOAL:** Dać jednostce Falanga (Żelazo, kultura Grecka) dedykowany dispatch PO NAZWIE (nie tylko po kategorii) i uzupełnić dokumentację historyczną istniejącego modelu do standardu serii Opus 5. — **zgodny co do słowa z `00-dispatch.md`** (§16a pkt 9 OK).
**MODEL WYKONUJĄCY EWALUACJĘ:** **Opus 5, `claude-opus-5[1m]`, effort High** (`CLAUDE_EFFORT=high` odczytane ze środowiska, nie z pamięci). Zgodne z §5a (wyjątek wizualny: Operator i Evaluator → Opus 5).
**ZMIANY/COMMIT:** `5aaddf389c5268c8cc312864743b3b050d15b549`, 3 pliki = **dokładnie allowlista**, `+850/−15`. `git merge-base origin/main origin/autobot/ZELAZO-T3-Q1` = `cb2d6346` = **czubek `origin/main`**, więc diff `origin/main..gałąź` jest diffem prawdziwym (§9 poz. 9 bez pułapki).
**TESTY (wszystkie uruchomione przeze mnie, własny worktree `/home/user/wt-eval-ZELAZO-T3`):** T3 real-render **40/40** (exit 0) · T1 **31/31** · T2 **42/42** · zelazo-gate **24/24** · `node ./node_modules/typescript/bin/tsc --noEmit` **0 błędów** · vite build **OK** (binarka, `--outDir` poza repo) · bramki §6: **213/213, 19/19, 33/33, 13/13, 6/6** · **własny** skrypt Evaluatora: **14/17** (3 „FAIL" to błędy MOJEGO pomiaru, rozliczone niżej).
**BLOKADY:** brak. **RUNDY:** 1/5. **NASTĘPNY KROK:** Final Control (Sonnet 5 High). **DEPLOY/PUSH:** NIE WYKONANO — `git merge-base --is-ancestor 5aaddf38 origin/main` → **fałsz**, potwierdzone.

## Dowody własne (nie raport Operatora)

**Napisałem własny harness** (`/tmp/.../scratchpad/eval-falanga.cjs`, `eval-allpairs.cjs`, `eval-diag.cjs`) inną metodą niż Operator: dwa bundle z **dwóch różnych drzew źródłowych** (`origin/main` w osobnym worktree vs gałąź), kolizje liczone **SAT na OBB** (rozstrzygające dla prostopadłościanów), bez korzystania z `userData.anchors` Operatora.

**Błąd geometrii jest prawdziwy — potwierdzony na faktycznym `main`, nie na mutacji w locie.** Drzewce dory `#19` i ramię `#16` (te same półwymiary w obu drzewach, identyfikacja po wymiarach): **main luz SAT = −0,02529 (przenikanie), gałąź = +0,02896 (rozłączne)**. Próbkowanie osi drzewca: na `main` leży wewnątrz bryły ramienia na odcinku 0,63–0,998 długości kości; na gałęzi **BRAK przenikania**. Przedramię: `main` −0,934…+0,994 (praktycznie cała kość), gałąź 0,529…0,957 (wyłącznie koniec nadgarstkowy, zakryty pięścią, której środek leży na 1,304). Widać to też na zrzutach z żywego Chromium (własna kamera, azymut 0): PRZED drzewce przecina bark, PO przechodzi nad barkiem.

**Skan WSZYSTKICH par brył:** main 28 par stykających się, gałąź **24** — wszystkie na gałęzi to legalne styki stawów. **Żadna nowa kolizja nie powstała** (drzewce nie tyka helmu, grzebienia, torsu ani głowy).

**Regresja — pełna, własna:** odcisk palca geometryczny (tri, typ, kolor, transformacja świata każdego mesh) dla **143 nazw** (PL + EN, kategoria z `categoryOf`), main vs gałąź. Różnią się **dokładnie 2: „Falanga" i „Phalanx"** — ta sama jednostka. Liczba Operatora (141/143) potwierdzona co do sztuki.

**Blazon — sprawdzony w danych i we własnej wiedzy historycznej.** `civs.json`: 15 cywilizacji, **jedna** grecka („Grecy"), brak Sparty. `city-names-pools.json` → `grecy.miasta_panstwa` = Ateny, **Sparta**, Korynt, Teby, Argos, Mykeny, Milet, Rodos, Syrakuzy, Delfy — dokładnie dziesięć **równorzędnych**. „Sparta" poza tym występuje wyłącznie jako łańcuch nazwy miasta. Wszystkich jednostek greckich jest 5; jedyna przypisana konkretnej polis to tebański Hieros Lochos. **Merytorycznie się zgadzam:** Λ = Lakedaimon jest atrybucją spartańską, jednolite godła miejskie to zjawisko późnego V–IV w. p.n.e., wcześniej godło indywidualne albo brak, a koncentryczny pierścień jest attestowaną, apolitejską episemą. Brak umba na aspis (w odróżnieniu od scutum) — poprawnie. Λ na jednostce liniowej całej cywilizacji faktycznie przeczyłaby rosterowi. **Nie mam zastrzeżenia historycznego.** Episema: mimośrodowość **w płaszczyźnie tarczy = 0,000000**, |normalna·+Z| = 0,980, budżet **404 → 404 tri** (28 → 27 mesh).

**Granice §9:** bez naruszeń — zero sekretów w diffie, brak `npm run build/dev` (test Operatora woła `node_modules/vite/bin/vite.js` do `os.tmpdir()`), `WERSJE.md` nietknięty, brak zmian procesu w allowliście, dowód wizualny obecny, commit poza `main`. `buildHastati()` **bajtowo identyczny** (md5 funkcji zgodny main↔gałąź), `getGNILambda` usunięty bez wiszących referencji.

**Test Operatora jest nietautologiczny i fail-closed:** przy mutacji kąta na wartość **niezaszytą** w teście (1,85 → 1,52) test przerywa i zwraca **exit 1** (mój wcześniejszy odczyt „exit 0" był błędem — czytałem kod `tail`, nie `node`).

## Uwagi (żadna nie zawraca tematu do Operatora)

1. **Luka pokrycia w nowym teście (istotna, ale nie „dowodowa").** Zsunąłem drzewce wzdłuż własnej osi (mutacja **nieanchorowana**: `0.130` → `-0.060`) — grot **odczepia się i wisi w powietrzu** (para `dory-shaft ↔ dory-tip` znika ze styków, zmierzone SAT), a test świeci **38/38**. Brak asercji na **ciągłość trzech części włóczni**. Klasyfikacja: **nie** jest to brak dowodu dla tego tematu (niezmieniony przez T3 niezmiennik, który zmierzyłem i **trzyma z zapasem**: styk `shaft↔tip` −0,003, `shaft↔sauroter` −0,0035), tylko pokrycie na przyszłość. Rekomendacja: jedna asercja przy integracji **albo** wpis do rejestru.
2. **Brak `01-operator.md` w `runs/R-ZELAZO-MODELE-BRAKUJACE-Q1-T3/`** (jest wyłącznie `00-dispatch.md`), podczas gdy T1 i T2 mają komplet. To zadanie orkiestratora przy integracji (katalog runów jest poza allowlistą T3), ale §4 i §16b pkt 3 wymagają go **przed** zamknięciem.
3. **Uwaga kosmetyczna Operatora musi trafić do rejestru, nie zostać w raporcie** (§3b): nagłówek pliku deklaruje `~0.55*HEX_R`, zmierzona wysokość Falangity to **0,7269×HEX_R** (potwierdzam własnym pomiarem; komentarz jest wspólny z `buildHastati`, więc słusznie poza zakresem). Rejestr ma już analogiczną sekcję na znaleziska T1/T2 — tam jest jej miejsce.
4. **Kosmetyczne, bez akcji:** (a) uzasadnienie w K4 („grzebień poprzeczny = oficer") jest mocne dla Rzymu, słabsze dla praktyki greckiej — sam wybór grzebienia **wzdłużnego** jest poprawny niezależnie od tego zdania; (b) raport Operatora ma **727 słów** wobec orientacyjnych ~400 z §11 (mierzone, nie z pamięci) — bez wklejonych diffów i logów, więc istota §11 zachowana; ten mój raport też jest dłuższy, bo niesie własne pomiary; (c) wpis rodzica w `REJESTR-PROSB-I-ZADAN.md` wciąż mówi „dispatch T1/4 wystartowany" mimo zamkniętych T1/T2 (§16b pkt 6).

**Uzasadnienie werdyktu (§3b):** wszystkie 7 kryteriów sukcesu z dispatchu spełnione i **odtworzone niezależnie**. Żadna uwaga nie dotyczy GOAL, zakresu, granic §9 ani gotowości integracyjnej; uwaga 1 dotyczy pokrycia przyszłego, nie dowodu tej zmiany. Uwagi 2 i 3 to czynności orkiestratora/Final Control przed zamknięciem. **Gotowość do integracji: TAK**, warunkowo po dopisaniu `01-operator.md` i zarejestrowaniu uwagi kosmetycznej.

Worktree Evaluatora zostawiam do dyspozycji Final Control: `/home/user/wt-eval-ZELAZO-T3` (czysty, na `5aaddf38`) i `/home/user/wt-eval-ZELAZO-T3-main` (odniesienie `origin/main`); skrypty i zrzuty w `/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/` (`eval-falanga.cjs`, `eval-allpairs.cjs`, `eval-diag.cjs`, `eval-{main,branch}-{front,profil,tyl-skos}.png`).