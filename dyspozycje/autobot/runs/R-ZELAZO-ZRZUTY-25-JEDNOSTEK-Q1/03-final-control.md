# 03 — FINAL CONTROL (runda 1)

STATUS: PASS-WITH-NOTES
DOMAIN: INFORMATIONAL
TEMAT: `R-ZELAZO-ZRZUTY-25-JEDNOSTEK-Q1`
GOAL: Zrzuty wszystkich 25 jednostek epoki Żelaza od przodu, każdy podpisany nazwą, żeby
właściciel zobaczył je po dwóch seriach audytu; zero zmian w kodzie gry. Zgodne z
`00-dispatch.md` i z GOAL w obu poprzednich raportach — bez rozjazdu (§16b p.1).

ZMIANY/COMMIT: zweryfikowane w trzecim, niezależnym worktree (`/home/user/wt-eval-zrzuty-25`,
detached `fd2d5ec0`). Diff od `git merge-base origin/main origin/<gałąź>` = `bfb180a8`:
**3 pliki** — `gra/tools/zelazo-zrzuty-25-jednostek-render.cjs` (+681) oraz dwa raporty
(`01-operator.md`, `02-evaluator.md`). `gra/src`/`gra/data`: zero (`git diff --stat` puste,
`git status` czyste po uruchomieniu harnessu). Zero PNG w repo. Zero sekretów w diffie.
Próbny `git merge-tree` z aktualnym `origin/main` (`3ee5b8ea`, przesuniętym o cudzy deploy)
— **czysty merge, zero konfliktów**, allowlista tematu nie styka się z tym, co main dostał.

TESTY — uruchomione przeze mnie od zera, trzecia niezależna reprodukcja:
- Harness: **61/61**, zero błędów konsoli.
- **26/26 PNG bajtowo identyczne** w trzech niezależnych runach (Operator, Evaluator, Final
  Control) — zero, nie „prawie zero", różnic (`diff -rq`).
- Bramki §6: `tsc --noEmit` 0 błędów · logic 213/213 · tech-tree 19/19 · research 33/33 ·
  unit-replace 13/13 · combat 6/6. `map-gen` nie uruchamiany (zgodnie z zakazem dispatchu).
- Lista 25 nazw kontra `units.json`: policzone programowo — dokładnie 25 pozycji z
  `Epoka: Żelazo`, zgodnie z twierdzeniem Operatora/Evaluatora.
- **Dowód modelu dedykowanego** odtworzony niezależnie: dispatch po nazwie/kulturze,
  liczby mesh dedykowany > generyk (poza udokumentowanym wyjątkiem Falangi — jedyny lokator
  kategorii `falanga`, sprawdzone), test nietautologiczności (D1: mutacja wyłącza
  `buildNamedUnit`/`buildSuperUnit` w pamięci → 25/25 traci dispatch, `units.ts` w repo
  nietknięty).
- **Oględziny wzrokowe — WSZYSTKICH 26 obrazków, osobno, nie tylko arkusza zbiorczego.**
  To był priorytet tej rundy, nie formalność: sprawdzałem, czy broń/tarcza/sylwetka czyta
  się poprawnie (topór jako topór, nie młot; khopesh jako zakrzywione ostrze, nie prosty
  miecz; iklwa i tarcza Zulusów rozpoznawalne), nie tylko czy asercje są zielone. Dociągnąłem
  kadr Berserkera germańskiego (siekiera) 3× w powiększeniu — szeroki, płaski, asymetryczny
  ostrze topora, czytelny jako topór, NIE młot. Żaden z 25 nie ma broni wskazującej w ziemię
  ani nieczytelnej sylwetki poza trzema już zgłoszonymi defektami (patrz niżej — potwierdzone
  naocznie, nie tylko z raportu). Podpis wypalony na każdym, oba kadry obecne, tło jasne,
  niebieski gracza spójny we wszystkich 25.

BLOKADY: brak.

**Potwierdzone naocznie (nie tylko z raportu) — trzy z czterech zgłoszonych defektów,
świadomie nienaprawione, do rejestru jako osobne tematy:**
1. Gaesatae — realna szpara dłoń–drzewce w obu kadrach.
2. Garnizon Harappy — tarcza trzcinowa faktycznie zasłania większość sylwetki od przodu.
3. Triari — hasta od przodu prawie niewidoczna (silne skrócenie), czytelna dopiero z kamery
   gry — dokładnie tryb defektu, przed którym ostrzegał dispatch.
4. Niespójna orientacja rodziny konnej (3× `konnica` w +X profil vs `Rydwan celtycki` w +Z)
   — potwierdzone wzrokowo na wszystkich czterech.

Żaden z tych czterech nie dotyka GOAL, dowodu modelu dedykowanego, zakresu ani granic §9 tego
tematu — to defekty MODELI ujawnione przez render, nie defekty renderu; allowlista
(`gra/tools/*` wyłącznie) i tak zabrania ich naprawy tutaj, zgodnie z dispatchem.

**Ocena uwag Evaluatora wobec §3b/§16b p.4:** żadna z pięciu uwag Evaluatora nie dotyka
GOAL, dowodu, zakresu ani §9 — długość raportu, dwuznaczne sformułowanie stopki, margines 3px
(dziś bez skutku), zdanie do przekazania właścicielowi o orientacji koni (informacyjne, nie
defekt zakresu — pokazanie tego profilu jest zgodne z GOAL: kamera gry ma być pokazana taka,
jaka jest) i brak wpisu w rejestrze (zadanie orkiestratora, nie Operatora/Evaluatora). Wszystkie
kosmetyczne → `PASS-WITH-NOTES` **kończy proces** na tym ID, zgodnie z §3b.

**Integration micro-fix wykonany:** żaden nie był wymagany — stopki „model X mesh vs generyk
kategorii X mesh" (Triari, Wojownik germański) są poprawne i jednoznaczne przy odczycie w
kontekście linii wyżej „MODEL DEDYKOWANY: TAK — buildSuperUnit → gałąź kultury ... (≠ default)";
uwaga Evaluatora #2 jest realna dla czytelnika bez kontekstu, ale to zmiana tekstu w PNG
(artefakcie, nie w kodzie źródłowym) — nie ma pliku źródłowego wartego poprawki bez ponownego
renderu 25 obrazków, co jest nieproporcjonalne do kosmetycznej uwagi; zostawiam jako uwagę do
rejestru, nie jako poprawkę.

RUNDY: 1/5.
NASTĘPNY KROK: integracja orkiestratora (allowlist-only: `gra/tools/zelazo-zrzuty-25-jednostek-render.cjs`
+ cztery pliki `dyspozycje/autobot/runs/R-ZELAZO-ZRZUTY-25-JEDNOSTEK-Q1/*`; `gra/src`, `gra/data`
nietknięte), potem dopisanie wiersza w `REJESTR-PROSB-I-ZADAN.md` i czterech defektów modeli
jako osobnych tematów (Evaluator uwaga #5).

**GOTOWOŚĆ DO INTEGRACJI: TAK.**

Katalog z finalnymi obrazkami dla właściciela (26 plików, zweryfikowane bajtowo identyczne w
trzech niezależnych uruchomieniach):
`/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/zrzuty-zelazo-25/`

DEPLOY/PUSH: NIE WYKONANO.
