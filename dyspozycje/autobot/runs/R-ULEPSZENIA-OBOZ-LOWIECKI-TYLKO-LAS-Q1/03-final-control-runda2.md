# 03 — FINAL CONTROL (runda 2)

STATUS: PASS
DOMAIN: GAME
TEMAT: R-ULEPSZENIA-OBOZ-LOWIECKI-TYLKO-LAS-Q1
MODEL+EFFORT: Opus 5, effort high
RUNDY: 2/5
Worktree FC: `/home/user/wt-fc3-lowiecki` (od `dfe074f5`, `node_modules` dowiązane — C-029).

## 1. Stan gałęzi — czy praca JEST w commitach

`git fetch` wykonany. `origin/autobot/R-ULEPSZENIA-OBOZ-LOWIECKI-TYLKO-LAS-Q1`:

| SHA | treść |
|---|---|
| `d6c13638` | **FC r2**: sonda `oboz-lowiecki-fc-r2-nowa-sciezka.cjs` |
| `e1de002b` | **FC r2**: raport (szkielet, commit pierwszy) |
| `dfe074f5` | raport Evaluatora r2 |
| `4a262c7f` | skan zależności od Lasu (EV) |
| `bd674b52` | sonda EV na realnym tekście `main.ts` |
| `7af9fdb0` | raport Evaluatora r2 (szkielet) |
| `705881b3` | raport Operatora r2 |
| `86f8021a` | bramka tematu +20 asercji P7 |
| `fabd40d0` | **zmiana merytoryczna rundy 2** |
| `61cb7d01` | raport Operatora r2 (szkielet) |
| `4fc004b3` | Final Control runda 1 (FAIL) |
| `0ad2c20a` | dispatch = `merge-base` z `origin/main` |

`git status` czysty. Diff rundy 2 (`4fc004b3..d6c13638`) = 8 plików, **w całości w allowliście**:
`improvement-build.ts` (+26/−3 z komentarzem), `terrain-improvements.json` (1 linia, pole `warunek`),
`gra/tools/*` (3 pliki), raporty runu. `main.ts` · `ai.ts` · `auto-improvements.ts` ·
`hexContextTooltip.ts` · `WERSJE.md` · `gra-robocza/**` **poza diffem** — `git diff --stat`, nie deklaracja.
Zero styku z plikami tematów równoległych (§2b).

Próbny merge do `origin/main` (`79bd9c02`): `git merge-tree --write-tree` → tree `eb0c6278`, exit 0,
**bez konfliktów**.

## 2. Uwaga N2 Evaluatora — rozstrzygnięta POMIAREM, nie oceną

`00-dispatch.md` faktycznie jest na gałęzi o 80 linii krótszy niż w `main`. Ale
`git log 0ad2c20a..HEAD -- 00-dispatch.md` = **0 commitów**: gałąź nigdy tego pliku nie tknęła,
więc merge bierze wersję z `main`. Sprawdzone w wyniku próbnego merge'a: plik w drzewie
`eb0c6278` ma **224 linie i zawiera sekcję „RUNDA 2 — decyzje właściciela"**. N2 **nie jest
zagrożeniem dla integracji** — jest artefaktem czytania gałęzi zamiast wyniku merge'a.

## 3. Pytanie 1 — czy P7 jest faktycznie zamknięte

Moja sonda rundy 1 `gra/tools/oboz-lowiecki-fc-balans.cjs`, bez zmian w kodzie sondy,
na moim worktree i moich ziarnach:

```
heksy Las poddane sekwencji wyrebu: 200; oboz ZOSTAL poza lasem na: 0
oboz-lowiecki-fc-balans: 5 passed, 0 failed
```

Runda 1: **200/200** i 4/1. Runda 2: **0/200** i **5/0** — dokładnie próg z dispatchu.
Kontrola przeciwna z sekcji C nadal `[OK]`: na heksie po wyrębie nowego obozu nie postawisz
(`computeImprovementBuildImpact === null`). Bilans lądu z rundy 1 (768 pól, 50,7 %) niezmieniony —
runda 2 nie dotknęła kwalifikatora.

## 4. Pytanie 2 — czy naprawa P7 otworzyła coś nowego

Nowa sonda FC `gra/tools/oboz-lowiecki-fc-r2-nowa-sciezka.cjs` (**22 pass / 0 fail**), pisana
pod scenariusze wskazane w zadaniu. Inwentaryzacja powtórzona **od strony zapisu** i **od
strony nakładki**, jak w rundzie 1.

**A. Domknięcie wejść.** Ekstrakcja dosłownego tekstu `main.ts` (zliczanie klamr, nie grep po repo):
`stripForestDependentImprovements(hexKey)` występuje w **dokładnie 2 miejscach — `:11912`
(wyrąb gracza) i `:28906` (wyrąb AI)**, zgadza się co do linii z dispatchem. Nowa ścieżka usuwania
nie ma trzeciego wejścia. Gracz i AI wołają **tę samą funkcję** — parytet jest tożsamością kodu,
nie zbieżnością dwóch implementacji.

**B. Założenie miasta na lesie — NIE zmienione.** `finalizeCityFounding` (`main.ts:11219`)
nie zawiera ani `stripForestDependentImprovements`, ani `stripImprovementsWhenForestRemoved`
(tekst funkcji, nie grep) — filtruje przez `cityKeepsImprovement` (macierz B). Pomiar na heksie
lasu (ziarno 4242, `4,4`): `[tartak, oboz_lowiecki, droga]` → **`[droga]`**, nakładka `las → brak`.
Obóz znika, ale **tartak też** — a strip tartaka nie rusza (kontrola B5). To dowodzi, że wynik
pochodzi z macierzy B, a nie z nowego filtra. Zachowanie identyczne jak przed rundą 2.

**C. Wczytanie starego zapisu — NIE zmienione.** `restorePlacedImprovementsFromSave`
(`main.ts:12005`) nie przepuszcza warstw przez nową ścieżkę. Odtworzenie semantyki loadu:
zapis `{'3,4': ['oboz_lowiecki']}` na heksie bez lasu **przeżywa wczytanie**. Kryterium 6
dispatchu („stare zapisy zostają, nie zmieniaj po cichu") dotrzymane — runda 2 **nie
wprowadziła cichej migracji kasującej cudze ulepszenia**.

**D. Wyrąb AI na cudzym terenie — niemożliwy.** W obsłudze `cmd.type === 'buildImprovement'`
(`:28824`) bramka `isTerritoryHexOwnedBy(cmd.q, cmd.r, ownerId, territoryGate)` stoi na
**`:28858`**, blok wycinki na **`:28879`**, usunięcie warstw na **`:28906`** — kolejność
zmierzona z pozycji w pliku. Obce terytorium kończy się `continue`; AI nie dociera do wyrębu,
więc nie skasuje obozu innej cywilizacji. Ścieżka gracza ma symetryczną bramkę
`assertPlayerTerritoryForBuild` w `applyBuildRequest` przed gałęzią `wycinka`.

**E. Filtr nie jest za szeroki.** Wszystkie **23 klucze** z `terrain-improvements.json`
przepuszczone przez strip pojedynczo i hurtem: usuwany jest **dokładnie jeden — `oboz_lowiecki`**.
Tartak, farma, glinianka, droga, tarasy, fort nietknięte; duplikat klucza też znika (filtr,
nie `splice`); pusta lista nie wybucha.

## 5. Mutacje — czy przyrządy w ogóle czerwienieją (moja ręka, kopia źródeł)

Mutowałem KOPIĘ (`/tmp/fc-r2-gra/src` przez `OBOZ_SRC_DIR`), worktree nietknięty, kopia usunięta.

| mutacja | co zmieniono | wynik |
|---|---|---|
| **M-FC-1** | cofnięcie poprawki (`return [...layers]`) | sonda FC **4/1** (200/200) · bramka tematu **86/5** · sonda EV r1 **87/1** · moja sonda r2 **19/3** |
| **M-FC-2** | filtr za szeroki (`+tartak, +farma`) | bramka tematu **86/5** (P7-C2/C3/D1/E1/E2) · moja sonda r2 **17/5** (E1/E3/E4 + kontrola B5) |
| **M-FC-3** | usunięty hook AI z `main.ts` | bramka tematu **91/0 ZIELONA** · sonda EV r1 **88/0 ZIELONA** · sonda EV mainpath **26/4** · moja sonda r2 **20/2** (A1: 1 wejście zamiast 2) |

M-FC-1 odtwarza liczby rundy 1 co do jednej — przyrządy mierzą to, co deklarują, w obie strony.
M-FC-3 **niezależnie reprodukuje uwagę N1 Evaluatora** i zarazem pokazuje, że luka jest
**domknięta dwoma NARZĘDZIAMI JUŻ W COMMITACH** (`bd674b52`, `d6c13638`), nie obietnicą.

## 6. Bramki (moja ręka, mój worktree)

| bramka | runda 1 | **runda 2** |
|---|---|---|
| `tsc --noEmit` | 0 | **0** |
| logic | 213/213 | **213/213** |
| tech-tree | 19/0 | **19/0** |
| research | 33/33 | **33/33** |
| unit-replace | 13/13 | **13/13** |
| combat | 6/6 | **6/6** |
| auto-improvements | 45/0 | **45/0** |
| map-improvement-qualify (kanon) | 112/0 | **112/0** |
| bramka tematu `oboz-lowiecki-las-test` | 71/71 | **91/0** (≥71, diff addytywny) |
| sonda Evaluatora | 87/**1** | **88/0** |
| **sonda FC `oboz-lowiecki-fc-balans`** | 4/**1** | **5/0** |
| sonda FC r2 (nowa) | — | **22/0** |
| build C-001 → `/tmp/civ-dist-fc2` | exit 0 | **exit 0**, `✓ built in 38.70s` |

Żadna wartość się nie pogorszyła. AI 40 tur, ziarna FC (777, 90210), informacyjnie:
`oboz_lowiecki=59 pastwiska=42` — **co do jednego pola tyle samo co w rundzie 1**. Runda 2
nie dotknęła zachowania AI, zgodnie z oczekiwaniem (strip odpala się tylko przy wyrębie).

## 7. Ocena uwag Evaluatora wobec §3b

| nota | klasyfikacja | uzasadnienie |
|---|---|---|
| **N1** okablowanie `main.ts` niepinowane bramką tematu | **nie blokuje** | `main.ts` jest POZA allowlistą i niezmieniony — to ryzyko przyszłej regresji, nie wada tej pracy. Luka **domknięta w gałęzi** dwoma sondami (potwierdzone M-FC-3). Do rejestru: dopisać obie sondy do stałej listy bramek |
| **N2** dispatch na gałęzi w tyle | **nie blokuje, nieaktualna** | gałąź nie tknęła pliku; wynik merge'a ma pełne 224 linie (§2) |
| **N3** „farma na Wzgórzu po wyrębie" tylko w raporcie | **kosmetyczna, wymaga rejestracji** | świadoma decyzja, poza allowlistą (kasowanie cudzej farmy = ECHO właściciela) |
| **N4** numery linii ±2 | kosmetyczna | zmierzyłem sam: `:11912`, `:28906`, `:11893` |
| **N5** `createQualifier` w izolacji: **BRAK DOWODU** | **nie blokuje** (dispatch to przesądza) | obrona w głąb — `qualifies()` niesie gate commitu tranzytywnie; luka w DOWODZIE, nie w zachowaniu (ustalone w rundzie 1 §7) |
| **N6** skarga „zamiast owcy buduje obóz" | **nie blokuje** (dispatch to przesądza) | wagi AI, `ai.ts` poza allowlistą, osobny temat |

Żadna uwaga nie dotyka `GOAL`, dowodu wykonania, zakresu, granic §9 ani gotowości do integracji.
**§3b spełnione co do treści** — pod jednym warunkiem operacyjnym niżej.

## 8. Checklista §16b

1. `00-dispatch.md` istnieje; `GOAL` w raportach Operatora i Evaluatora **zgodny** z dispatchem
   (obóz wyłącznie na nakładce Las + wariant A dla wyrębu) — bez przesunięcia. ✔
2. To samo pełne ID we wszystkich rundach i commitach. ✔
3. Werdykt Evaluatora oparty na artefaktach: własne sondy (`bd674b52`, `4a262c7f`), własne
   mutacje, wklejone liczby — nie na deklaracjach Operatora. ✔
4. `PASS-WITH-NOTES` nie ukrywa uwagi z §3b (tabela §7). **Ale**: N3/N5/N6 **nie są jeszcze
   zapisane jako osobne pozycje w rejestrze**. ✔ z warunkiem.
5. Licznik rund: 2/5, ta sama gałąź, to samo ID, **bez cichego resetu** (§3a). ✔
6. **`dyspozycje/REJESTR-PROSB-I-ZADAN.md` NIE ZAWIERA ANI JEDNEJ WZMIANKI o tym temacie**
   (`grep -in lowieck` → 0 trafień w 3181 liniach). Rejestr **nie odzwierciedla stanu
   faktycznego**. Plik jest poza allowlistą tematu — to krok orkiestratora przy integracji,
   nie powrót do Operatora. ✘ do domknięcia przy integracji.
7. Temat nie był dzielony na węzły — punkt nie dotyczy.
8. Werdykt niżej.

## 9. Higiena

`git status` czysty. Kopia mutacyjna `/tmp/fc-r2-gra` usunięta. Bundle esbuilda
(`gra/tools/.oboz-*`) objęte `.gitignore` — nie weszły do żadnego commitu.
`map-gen-regression-test` NIE uruchamiany. Zakaz `npx`, `npm run build/dev`, `git add -A`
i pushu do `main` dotrzymany — push wyłącznie na gałąź tematu, po każdym kroku.
Kontrola C-031 (§0c): w tej sesji nie rejestrowałem zgłoszeń, więc brak wpisów do potwierdzenia;
29 pozycji `STATUS: **OTWARTE` w `PYTANIA-OTWARTE.md` to stan zastany, nie mój.

## RAPORT TERMINALNY

STATUS: PASS
DOMAIN: GAME
TEMAT: R-ULEPSZENIA-OBOZ-LOWIECKI-TYLKO-LAS-Q1
GOAL: Obóz łowiecki wyłącznie na nakładce Las; runda 2 — wyrąb lasu spod obozu usuwa obóz
(ECHO wariant A), praca nie wraca, tartak zostaje.
MODEL+EFFORT: Opus 5, effort high.
ZMIANY-COMMIT: gałąź `autobot/R-ULEPSZENIA-OBOZ-LOWIECKI-TYLKO-LAS-Q1`. Diff rundy 2
`4fc004b3..d6c13638` = 8 plików, allowlist-only; `main.ts`/`ai.ts`/`auto-improvements.ts`/
`hexContextTooltip.ts`/`WERSJE.md` poza diffem. FC dodał `e1de002b` (szkielet),
`d6c13638` (`gra/tools/oboz-lowiecki-fc-r2-nowa-sciezka.cjs`) i ten commit; `gra/src`,
`gra/data` przeze mnie NIETKNIĘTE. `merge-tree` z `origin/main` (`79bd9c02`) → `eb0c6278`, exit 0.
TESTY: tsc 0 · logic 213/213 · tech-tree 19/0 · research 33/33 · unit-replace 13/13 ·
combat 6/6 · auto-improvements 45/0 · map-improvement-qualify 112/0 · bramka tematu **91/0** ·
sonda Evaluatora **88/0** · **sonda FC 5/0** (było 4/1; obóz poza lasem 0/200, było 200/200) ·
**nowa sonda FC 22/0** · build C-001 exit 0. Mutacje: M-FC-1 → 4/1, 86/5, 87/1, 19/3;
M-FC-2 → 86/5, 17/5; M-FC-3 → bramka 91/0 zielona, ale sondy 26/4 i 20/2 łapią.
AI 40 tur (informacyjnie): 59/42 — identycznie jak w rundzie 1.
BLOKADY: brak.
WARUNEK INTEGRACJI (krok orkiestratora, nie powrót do Operatora): założyć wpis tematu
w `REJESTR-PROSB-I-ZADAN.md` (dziś **zero wzmianek**) i zarejestrować trzy znaleziska —
N3 „farma na Wzgórzu po wyrębie", N5 `createQualifier` BRAK DOWODU, N6 wagi AI
(„zamiast owcy buduje obóz"). Wynika z §3b i §16b pkt 4/6.
RUNDY: 2/5
NASTĘPNY KROK: integracja orkiestratora (allowlist-only, `git merge --no-ff` od `merge-base`
`0ad2c20a`), potem `READY_FOR_DEPLOY`.
DEPLOY-PUSH: NIE WYKONANO

GOTOWOŚĆ DO INTEGRACJI: TAK
