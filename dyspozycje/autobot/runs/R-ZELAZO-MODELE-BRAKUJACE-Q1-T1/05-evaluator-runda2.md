STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: `R-ZELAZO-MODELE-BRAKUJACE-Q1-T1`
GOAL: Dwa dedykowane modele 3D — Konnica lancowa i łucznicza asyryjska (Żelazo, Asyria) — zamiast wspólnego fallbacku `case 'konnica'`, historycznie uzasadnione i spójne z kanonem wizualnym Asyrii. **Zgodny z `00-dispatch.md` co do treści (§16a pkt 9) — brak przesunięcia GOAL.**

**MODEL WYKONAWCZY EVALUATORA: `claude-opus-5[1m]` („Opus 5, 1M context"), effort High.** Dowód ze środowiska, nie z pamięci: (a) prompt systemowy tego subagenta podaje wprost „Opus 5 (1M context) / claude-opus-5[1m]"; (b) `env` → `CLAUDE_EFFORT=high`; (c) `get_session` sesji-rodzica (orkiestrator `session_01Fs7eok…`) zwraca `model: claude-sonnet-5` / `last_served_model: claude-sonnet-5` — **inną** wartość niż moja, co dowodzi, że `opts.model` faktycznie nadpisał dziedziczenie. Wymóg §5a/§9 poz. 6(b) spełniony dla obu ról rundy 2.

ZMIANY/COMMIT: `0b2b091f` na `autobot/ZELAZO-T1-Q1`, własny worktree `/home/user/wt-eval-ZELAZO-T1-r2` (detached, `node_modules` podlinkowane — C-029). Diff `origin/main...branch` **wyłącznie addytywny: 15/1180/497 linii, 0 usunięć**, dokładnie 3 pliki allowlisty. `units.ts`: 2 importy + 2 gałęzie przed generykiem, generyczny `case 'konnica'` nietknięty. Sekrety: 7 trafień grepa to gra­ne „token"/`perTokenGeos`, zero poświadczeń. Brak styku z save/load i parytetem gracz/AI/MP (czysta geometria renderu).

TESTY (własne uruchomienia, nie odczyt raportu):
- Temat **31/31**, real render Playwright/Chromium. Wymiary zgodne co do cyfry z raportem: lancowa 0.864/0.546/minY 0.0000, łucznicza 0.818/0.435/minY 0.0000.
- `tsc --noEmit` 0 błędów. `vite build` binarką, `--outDir /tmp/civ-dist-eval-r2` (C-001) OK.
- Bramki: logic **213/213**, tech-tree **19/19**, research **33/33**, unit-replace **13/13**, combat **6/6**.
- **Nietautologiczność (H) dowiedziona MOCNIEJ niż w raporcie** — zamiast jednego zbiorczego cofnięcia zrobiłem 5 mutacji izolujących każdą asercję; każda czerwieni tylko swój cel, z realną liczbą: H1 0.1312<0.2062 (parametry lancy r1), H2 0.3624<0.4516 (cant=0, skala 1.10), H3 0.1574 / 0.2448, H4 0.049 rad (cel poza zasięgiem → IK prostuje), H5 dot=0 (`rim.rotation.y`). `bellyY` 0.2062 potwierdza liczbę Operatora.
- **Weryfikacja ponad zakres asercji:** własny test penetracji (próbkowanie osi broni w local space 47 brył) → **zero przecięć broń↔koń u OBU jednostek**; jedyny kontakt to dłoń na chwycie (y 0.532–0.561 = `AC_LANCE_GRIP.y` 0.545), nie udo. Defekt rundy 1 realnie naprawiony.
- Własne zrzuty izolowane, 4 kąty/jednostkę: łucznik dzierży łuk kompozytowy w naciągu, z przechyłem, kołczan ze strzałami, bez tarczy; lancer ma lancę z żelaznym grotem w przód-w górę i okrągłą tarczę z umbem; obie bez strzemion, nogi zwisają, wodze od wędzidła. Zrzut PRZED potwierdza przesłankę dispatchu: obie jednostki miały identyczny model z bronią drzewcową — łucznik dystansowy (`Atak dystansowy=6`) nie miał łuku.
- `units.json` sprawdzony niezależnie: wszystkie liczby i cytaty z nagłówka (0/6, zasięg 2, `Hutnictwo żelaza`, `Żelazo`, `Asyria`, `Mount`, oba `Uwagi`) zgadzają się dosłownie. Dane gry po moich uruchomieniach **nienaruszone** (`git diff gra/data/` pusty).

Kryteria sukcesu 1–9: wszystkie spełnione, każde potwierdzone niezależnie.

BLOKADY: brak.

UWAGI (niepodlegające §3b — żadna nie dotyka GOAL, dowodu, zakresu, istoty §9 ani gotowości do integracji; do zarejestrowania jako osobny temat):
1. Test w linii 477 woła `npx vite build`, nie kanoniczne `node ./node_modules/vite/bin/vite.js`. Wiążąca istota C-001 (`npm run build`/`dev`, skrypt `export-data`) **nie jest naruszona** i empirycznie nie doszło do nadpisania JSON-ów — ale `npx` przy braku lokalnej binarki pobrałby vite z rejestru. Utwardzenie: przejść na formę z §9 poz. 1.
2. (H1) mierzy wyłącznie linię brzucha; oś „lanca w udzie" (naprawiona przez `AC_LANCE_GRIP.x`) nie jest zaryglowana żadną asercją — potwierdziłem ją własnym testem, ale w repo zostaje bez ochrony regresyjnej.
3. Raport Operatora przekracza ~400 słów (§11) — Operator zgłosił to sam.
4. Kosmetyczna, historyczna: Z3 („okucia końskie pozostają brązowe… widoczne w realnych znaleziskach asyryjskich") lekko przecenia jednoznaczność źródeł — żelazne wędzidła są w kontekstach nowoasyryjskich poświadczone. Wybór jest jednak jawnie udokumentowany z uzasadnieniem, czego wymaga kryterium 9, więc nie jest wadą.

Reszta warstwy historycznej (Z1 brak strzemion, Tiglat-Pileser III 745–727 p.n.e., ewolucja od par jeźdźców do samodzielnych za Aszurbanipala, krótkość łuku kompozytowego, przechył jako technika łucznictwa konnego, brak podków/kropierza) — sprawdzona, trafna i poprawnie hedgowana tam, gdzie źródła są słabsze.

Uwaga integracyjna dla orkiestratora: `origin/main` wyprzedza gałąź o 3 commity (`5e410537`, `985d5b42`, `2cfb0844`) dotykające **wyłącznie** `docs/` i `dyspozycje/autobot/runs/` — zero kolizji z allowlistą `gra/**`. Scalać `git merge --no-ff` od `merge-base` (§9 poz. 9).

RUNDY: 2/5.
NASTĘPNY KROK: Final Control (Sonnet 5 High, osobny subagent) — gotowość do integracji z mojej strony: **TAK**.
DEPLOY/PUSH: NIE WYKONANO. `main` nietknięty; `git merge-base --is-ancestor 0b2b091f origin/main` → fałsz (praca poprawnie poza `main`). Mój worktree pozostawiony czysty pod `/home/user/wt-eval-ZELAZO-T1-r2` (HEAD `0b2b091f`).