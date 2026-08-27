# 02 — EVALUATOR (runda 2)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-ULEPSZENIA-OBOZ-LOWIECKI-TYLKO-LAS-Q1
GOAL: Obóz łowiecki wyłącznie na nakładce Las (gracz, automat, AI). Runda 2 domyka P7 —
wyrąb lasu spod obozu; ECHO właściciela 2026-08-27 wariant A: obóz znika, praca NIE wraca,
tartak NIE znika.
MODEL+EFFORT: Opus 5, effort **high**
RUNDY: 2/5
WORKTREE: /home/user/wt-ev3-lowiecki (detached @ 705881b3, `node_modules` symlink, `tsc` 5.9.3)
DEPLOY-PUSH: NIE WYKONANO

## 1. SCOPE / allowlista (16a.1, 16a.2, 16a.5–16a.7)

`git diff --stat 4fc004b3 705881b3` — diff RUNDY 2, cztery pliki:
`01-operator-runda2.md` · `gra/data/terrain-improvements.json` (1 linia, pole `warunek`
wpisu `oboz_lowiecki`) · `gra/src/map/improvement-build.ts` (+25/−1) ·
`gra/tools/oboz-lowiecki-las-test.cjs` (+196/−1). **Cała rundа 2 w allowliście.**

- `gra/src/main.ts` — **NIETKNIĘTY** (potwierdzone `git diff --stat`, nie deklaracją).
  Zakaz z dispatchu dotrzymany.
- `ai.ts`, `auto-improvements.ts`, `hexContextTooltip.ts`, `WERSJE.md`, `gra-robocza/**`
  — poza diffem rundy 2. `hexContextTooltip.ts` jest w diffie GAŁĘZI, ale wyłącznie
  z rundy 1 (P4), gdzie był w allowliście.
- Zero kolizji z tematami równoległymi (§2b): żaden z plików
  `buildModeHud.ts`/`economy-upkeep.ts`/`cityPanel.ts`/`techDiscoveryNotice.ts`/
  `entityCards/*`/`sidePanelHud.ts` nie występuje w diffie.
- Brak sekretów. Brak usunięć poza jedną zmianą linii eksportu w bramce (dopisane
  `Ulepszenie`). `git diff --check` czysty, `git status --porcelain` pusty.
- `git merge-tree --write-tree origin/main HEAD` → `23293628…`, exit 0, **zero konfliktów**
  (origin/main = 79bd9c02).

## 2. Sonda Evaluatora (reguła a dispatchu) — binarne kryterium rundy

| sonda | runda 1 | **runda 2** |
|---|---|---|
| `gra/tools/oboz-lowiecki-evaluator-probe.cjs` | 87 pass / **1 FAIL** (F2 = P7) | **88 pass / 0 fail** ✔ |
| `gra/tools/oboz-lowiecki-fc-balans.cjs` (sonda FC) | 4 / **1 FAIL** | **5 pass / 0 fail** ✔ |

Sonda FC: „heksy Las poddane sekwencji wyrębu: 200; obóz ZOSTAŁ poza lasem na: **0**"
(runda 1: 200/200). Oba znaleziska blokujące rundy 1 są zamknięte.

## 3. P7 zmierzone MOJĄ, INNĄ metodą (reguła b) — nie transkrypcja

Operator dowodził **przepisaną ręcznie** kopią sekwencji z `main.ts` (`wyrabGracza`/`wyrabAI`
w bramce tematu). Transkrypcja dowodzi zachowania KOPII, nie oryginału.

Moja sonda `gra/tools/oboz-lowiecki-ev-r2-mainpath.cjs` **niczego nie przepisuje**: wycina
DOSŁOWNY tekst źródłowy z `src/main.ts` (dopasowanie klamer od nagłówka), kompiluje esbuildem
i URUCHAMIA go — `improvementKeyToUlepszenie` (:11307), `syncHexUlepszenieFields` (:11321),
`stripForestDependentImprovements` (:11893), `finalizeHexClearing` (:11907, ścieżka gracza)
oraz dosłowny blok `if (meta?.typ === 'wycinka') { … }` (:28879, ścieżka AI, opakowany w
pętlę 1× bo używa `continue`). Zaślepione są wyłącznie mesh/decor/overlay; wszystko, co
dotyka warstw heksa, jest oryginalne. Heksy z `generateMap`, **ziarna moje** (90210, 777,
31415, 5150, 424242 — nie 42/1337/2026/7 Operatora).

Wynik: **30 pass / 0 fail.**

| pomiar | wynik |
|---|---|
| GRACZ, `finalizeHexClearing` (ziarno 90210, las na **wzgórzu**) | `placed=null`, `hex.ulepszenia=null`, `improvementKey=null`, `hex.ulepszenie='brak'`, `nakladka='brak'` |
| GRACZ: nowego obozu na tym heksie już nie postawisz | `computeImprovementBuildImpact = null` ✔ |
| AI, dosłowny blok wycinki (ziarno 777) | `placed=null`, `hex.ulepszenia=null`, `ulepszenie='brak'` |
| **SKALA: 5 map, 754 heksy z Lasem** (naprzemiennie ścieżka gracza i AI) | obóz ZOSTAŁ poza lasem — **gracz 0, AI 0** |

Praca NIE jest zwracana: w `stripForestDependentImprovements` i w bloku AI nie ma żadnego
kredytu Pracy — wariant A ECHO dotrzymany co do drugiego zdania, nie tylko pierwszego.

## 4. Kontrola ODWROTNA (reguła c) — czy filtr nie jest za szeroki

**Pomiar, nie odczyt kodu.** `gra/tools/oboz-lowiecki-ev-r2-lasdep-scan.cjs`: dla wszystkich
**22 kluczy** z `terrain-improvements.json`, na 3 mapach z `generateMap`, porównuję
`buildImprovementQualifier` (PEŁNY `qualifies`, nie sam gate commitu) na tych samych heksach
przed i po zdjęciu lasu — 457 heksów z Lasem.

Klucze, dla których **Las jest warunkiem** (tracą kwalifikację po wyrębie):
`oboz_lowiecki` 457 · `tartak` 457 · `wyrab` 457 · `farma` 33 (tylko Wzgórza).
**Dokładnie cztery — inwentaryzacja Operatora potwierdzona niezależnie, nic nie zgubił.**

| klucz | decyzja Operatora | moja weryfikacja |
|---|---|---|
| `oboz_lowiecki` | usuwany | ✔ znika na 754/754 (§3) |
| `tartak` | ZOSTAJE (kanon) | ✔ **754/754 zostaje**; kanon `map-improvement-qualify-test` 112/0 |
| `farma` | ZOSTAJE, znalezisko do rejestru | ✔ zostaje (C3); zależność potwierdzona liczbowo: 33 heksy = Wzgórza |
| `glinianka` | nie zależy od Lasu | ✔ 0 utrat kwalifikacji; zostaje (C4) |
| `wyrab` | akcja, nie warstwa | ✔ `'wyrab'` występuje w `main.ts` **wyłącznie** w `spawnClearingMesh` (:11870, ikona 🪓 w `clearingMeshes`) — nigdy w żadnym z 8 `placedImprovements.set` |
| pozostałe 17 kluczy | nietknięte | ✔ `droga/fort/kamieniolom/irygacja/pastwisko` zostają (C7); heks mieszany `[tartak,oboz,droga] → [tartak,droga]`, `improvementKey` przeliczony na `droga` (C5/C6) |

## 5. P1–P6 nadal zielone (reguła d)

Diff bramki tematu jest **czysto addytywny**: `--numstat` = 196 dodanych, 1 zmieniona
(dopisane `Ulepszenie` do listy eksportów). **Żadna asercja rundy 1 nie została usunięta
ani przerobiona.** 91 = 71 (rundy 1) + 20 (P7). Sonda rundy 1, pokrywająca P1–P7, wraca
88/0 — czyli P1–P6 mierzone tym samym narzędziem co w rundzie 1, bez pogorszenia.

## 6. Mutacje — powtórzone MOJĄ ręką (reguła e)

Mutowana KOPIA źródeł wstrzykiwana przez `OBOZ_SRC_DIR` (worktree nietknięty), poza M-R2-2
na kanonie — `map-improvement-qualify-test.cjs` ma `../src/…` na sztywno i **ignoruje
`OBOZ_SRC_DIR`**, więc tam mutowałem w miejscu i cofnąłem (`git checkout --`, `git status`
pusty; to wyjaśnia, dlaczego pierwsza próba dała mylące 112/0).

| mutacja | bramka tematu | sonda r1 | sonda FC | moja sonda | kanon qualify |
|---|---|---|---|---|---|
| **M-R2-1** cofnięcie poprawki (`return [...layers]`) | **86/5** (A4,A5,B3,B4,D1) | **87/1** | **4/1** (200/200) | **22/8**, obóz został 377 gracz + 377 AI | — |
| **M-R2-2** filtr za szeroki (+`tartak`,+`farma`) | **86/5** (C2,C3,D1,E1,E2) | — | — | **25/5**, tartak został 0/754 | **111/1** („tartak stays when forest removed") |

**Obie liczby Operatora odtworzone co do asercji.** Asercja tartaka nie jest tautologią.

### 6a. Mutacja, której Operator nie mógł zrobić — i co ujawnia (uwaga N1)

**M-EV-3:** usunąłem `stripForestDependentImprovements(hexKey);` **tylko** ze ścieżki AI
w `main.ts` (linia :28906), zostawiając poprawkę w `improvement-build.ts` nietkniętą.

| co uruchomiono | wynik na M-EV-3 |
|---|---|
| bramka tematu `oboz-lowiecki-las-test` | **91/0 — CAŁKOWICIE ZIELONA** |
| sonda Evaluatora rundy 1 | **88/0 — CAŁKOWICIE ZIELONA** |
| **moja sonda `…-ev-r2-mainpath`** | **26/4** (X2, B2, B3, **D2: obóz został na 377 heksach**) |

To jest dokładnie wzorzec **C-046** (logika żyje inline w niewyeksportowanej funkcji
`main.ts`, test odtwarza własną kopię — mutacja produkcji ucieka bramce). Zachowanie DZIŚ
jest poprawne (dowód §3, na realnym tekście), a Operator nie mógł zrobić inaczej: `main.ts`
był mu jawnie zakazany. Lukę **domykam swoim narzędziem**, wypchniętym na gałąź — patrz N1.

## 7. Bramki (moja ręka, mój worktree)

| bramka | runda 1 | **runda 2** |
|---|---|---|
| `tsc --noEmit` (5.9.3, symlink `node_modules`) | 0 | **0** |
| `logic-test` | 213/213 | **213/213** |
| `tech-tree-test` | 19/0 | **19 pass / 0 fail** |
| `research-test` | 33/33 | **33/33, ALL GREEN** |
| `unit-replace-test` | 13/13 | **13/13** |
| `combat-test` | 6/6 | **6/6** |
| `auto-improvements-test` | 45/0 | **45 passed / 0 failed** |
| `map-improvement-qualify-test` (kanon) | 112/0 | **112 pass / 0 fail** |
| **bramka tematu** `oboz-lowiecki-las-test` | 71/0 | **91 passed / 0 failed** (≥71 ✔) |
| **sonda Evaluatora** | 87/**1** | **88 / 0** ✔ |
| **sonda FC** | 4/**1** | **5 / 0** ✔ |
| **moja sonda rundy 2** (nowa) | — | **30 / 0** |

`map-gen-regression-test` **NIE uruchamiany** (zakaz dispatchu). Każde wywołanie w `timeout`.
Zakaz `npx`, `npm run build/dev`, `git add -A`, pushu do `main` — dotrzymany.

## 8. Build kanon C-001

`node ./node_modules/vite/bin/vite.js build --outDir /tmp/civ-dist-ev --emptyOutDir`
→ `✓ built in 32.57s`, exit 0, `/tmp/civ-dist-ev/index.html` = 37 476 661 B. ✔

## 9. Pomiar AI 40 tur (informacyjnie)

| ziarna | PRZED (4fc004b3) | PO (705881b3) |
|---|---|---|
| **moje** 5150 / 31337 / 90210 | 24/21 · 28/22 · 27/24 → **79/67** | 24/21 · 28/22 · 27/24 → **79/67** |
| Operatora 42 / 1337 / 2026 | — | 31/19 · 33/20 · 35/17 → **99/56** |

**PRZED = PO co do jednego pola** — poprawka rundy 2 nie rusza zachowania AI, zgodnie
z oczekiwaniem. Liczba Operatora (99/56) odtworzona co do jedności na jego ziarnach.
Skarga „zamiast owcy buduje obóz" nadal nierozwiązana — wagi AI, osobny temat.

## 10. UWAGI (jawne, nie ukryte — §16b pkt 4)

- **N1 — bramka tematu nie pinuje okablowania `main.ts` (C-046).** Dowód i skala w §6a.
  **Naprawione przeze mnie, nie odłożone:** `gra/tools/oboz-lowiecki-ev-r2-mainpath.cjs`
  (30/0) jest wypchnięty na gałąź i **musi jechać razem z bramką tematu** — sama bramka
  tematu nie wystarcza jako dowód, że hook w `main.ts` nadal istnieje.
- **N2 — `00-dispatch.md` na gałęzi jest o 80 linii W TYLE za `origin/main`**: brakuje
  CAŁEJ sekcji „RUNDA 2 — decyzje właściciela" (ECHO wariant A, rozstrzygnięcie `tylko Las`,
  allowlista i kryteria rundy 2). Final Control sprawdzający GOAL **na gałęzi** przeczyta
  dispatch bez mandatu rundy 2. Do naniesienia przez orkiestratora przy integracji; ja
  dispatchu nie ruszam (nie mój artefakt, C-025). Merytorycznie GOAL Operatora zgadza się
  z wersją z `main` (§16a pkt 9 spełnione względem aktualnego dispatchu).
- **N3 — znalezisko „farma na Wzgórzu po wyrębie" żyje wyłącznie w raporcie Operatora §7**,
  nie w `REJESTR-PROSB-I-ZADAN.md`/`PYTANIA-OTWARTE.md` (oba poza allowlistą rundy 2).
  Bez rejestracji przez orkiestratora to zgubione zgłoszenie (C-027/C-030). Potwierdzam
  liczbowo: 33 heksy na 3 mapach, wyłącznie Wzgórza.
- **N4 — numery linii w raporcie Operatora są o 1–2 przesunięte** (`main.ts:11892`/`:28904`
  wobec faktycznych `:11893`/`:28906`, hook wołany z `:11912` i `:28906`). Kosmetyka,
  poprawne numery wyżej.
- **N5 — `createQualifier` w izolacji: BRAK DOWODU** — stan niezmieniony z rundy 1,
  jawnie zgłoszony przez Operatora, Evaluatora i Final Control. Obrona w głąb, nie luka.
- **N6 — skarga o preferencje AI** nierozwiązana tym tematem (§9), świadomie, osobny temat.

Żadna z uwag nie dotyczy GOAL, zakresu ani granic §9. N1 jest uwagą o DOWODZIE i została
w tej rundzie domknięta narzędziem, nie odłożona.

## RAPORT TERMINALNY

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-ULEPSZENIA-OBOZ-LOWIECKI-TYLKO-LAS-Q1
GOAL: Obóz łowiecki wyłącznie na nakładce Las (gracz, automat, AI); runda 2 — wyrąb lasu
spod obozu usuwa obóz (ECHO wariant A), praca nie wraca, tartak zostaje.
MODEL+EFFORT: Opus 5, effort high.
ZMIANY-COMMIT: Operator rundy 2 — `fabd40d0` (poprawka + `warunek`), `86f8021a` (bramka
+20 asercji), `61cb7d01`/`705881b3` (raporty); allowlist-only, `main.ts` nietknięty.
Evaluator dodał: `7af9fdb0` (szkielet), `bd674b52` (`gra/tools/oboz-lowiecki-ev-r2-mainpath.cjs`),
`4a262c7f` (`gra/tools/oboz-lowiecki-ev-r2-lasdep-scan.cjs`) i ten commit. `gra/src`,
`gra/data` przeze mnie NIETKNIĘTE. Merge do `origin/main` (79bd9c02) bezkonfliktowy.
TESTY: tsc 0 · logic 213/213 · tech-tree 19/0 · research 33/33 · unit-replace 13/13 ·
combat 6/6 · auto-improvements 45/0 · map-improvement-qualify 112/0 · bramka tematu **91/0**
(≥71) · sonda Evaluatora **88/0** (było 87/1) · sonda FC **5/0** (było 4/1) · moja sonda na
realnym tekście `main.ts` **30/0** (754 heksy: obóz został 0, tartak został 754/754) ·
vite build exit 0. Mutacje: M-R2-1 86/5, M-R2-2 86/5 + kanon 111/1, M-EV-3 26/4.
AI 40 tur: PRZED=PO 79/67 (moje ziarna), 99/56 odtworzone na ziarnach Operatora.
BLOKADY: brak.
RUNDY: 2/5
NASTĘPNY KROK: Final Control, runda 2. Do zaadresowania przy integracji: N2 (dispatch na
gałęzi bez sekcji rundy 2) i N3 (rejestracja znaleziska o farmie).
DEPLOY-PUSH: NIE WYKONANO
