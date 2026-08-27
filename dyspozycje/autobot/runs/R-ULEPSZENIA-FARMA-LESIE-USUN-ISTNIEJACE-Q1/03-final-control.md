# 03 — FINAL CONTROL (runda 1) — R-ULEPSZENIA-FARMA-LESIE-USUN-ISTNIEJACE-Q1

Rola: Final Control (Opus 5, effort high). Worktree: `/home/user/wt-fc-farma-legacy`
(oddzielny od Operatora i Evaluatora). Kontrola prowadzona **na wytworze w worktree**
(§16b, zdanie końcowe), nie na raportach — raporty traktuję jako deklarację.

---

## 1. Kontrola proceduralna (obowiązkowa)

```text
git fetch origin autobot/R-ULEPSZENIA-FARMA-LESIE-USUN-ISTNIEJACE-Q1   → OK
HEAD worktree'u FC      = 023ce2b2286b529933de9051a39fd977d9d22f54
git status --porcelain  = (pusto)  → BRAK pracy niezacommitowanej
```

`git log --oneline`:

| SHA | Treść |
|---|---|
| `023ce2b2` | raport Evaluatora runda 1 (PASS-WITH-NOTES) |
| `cc98a78b` | usuniecie istniejacych farm w lesie (wariant C) — **cały kod tematu** |
| `9015380b` | (= `origin/main`, = `merge-base`) |

- **Praca jest w commitach** — potwierdzone per plik przez `git show --stat` obu commitów.
  `cc98a78b` niesie komplet zmian w `gra/` (+1166/−8), `023ce2b2` wyłącznie raport Evaluatora.
- **Brak dryfu:** `git merge-base HEAD origin/main` = `9015380b` = `origin/main`. Trzy równoległe
  tematy dotykające `main.ts` nie zintegrowały się w międzyczasie — rebase niepotrzebny. Diff
  czytany **od merge-base** (`origin/main...HEAD`), zgodnie z §9 poz. 9 (zakaz naiwnego `..`).
- **ID** identyczne w dispatchu, raporcie Operatora, raporcie Evaluatora i nazwie gałęzi.
- **GOAL** w obu raportach zgodny co do treści z `00-dispatch.md` (§16a pkt 9 — brak sygnału
  utraty kontekstu).
- **RUNDY 1/5** w obu raportach, licznik nie zresetowany (§3a).

## 2. Filtr odwrotny allowlisty — niezależnie

7 plików w diffie od merge-base, **każdy w allowliście, nic poza nią**:

```text
A  dyspozycje/autobot/runs/<ID>/01-operator.md
A  dyspozycje/autobot/runs/<ID>/02-evaluator.md
M  gra/src/game/save.ts                              +130
M  gra/src/main.ts                                   +63
M  gra/src/map/improvement-build.ts                  +147
A  gra/tools/farma-lesie-usun-istniejace-test.cjs    +542
M  gra/tools/farma-nie-w-lesie-test.cjs              +22/−8
```

- `git diff --check` — czysto.
- **NIETKNIĘTE:** `gra/data/terrain-improvements.json`, `isFarmBaseTerrain`,
  `dyspozycje/WERSJE.md`, `gra-robocza/ROBOCZA-MANIFEST.json`, `playbook.json`, `playbook.md`,
  `.cursor/rules/**`, `docs/decyzje/**`.
- **Wszystkie 8 usunięć** siedzi w `farma-nie-w-lesie-test.cjs` i są to **wyłącznie komentarze
  oraz 2 opisy asercji** — przeczytane linia po linii; `ok(...)` i wartości oczekiwane bez
  zmiany. Żadnego usunięcia, którego GOAL by nie wymagał (§16a pkt 6).
- **Brak sekretów** w diffie (§9 poz. 3) — przejrzane wszystkie dodane linie.
- **Brak zmiany procesu w allowliście tematu produktowego** (§9 poz. 4).
- **Higiena drzewa:** artefakty nowej bramki (`gra/tools/.farma-lesie-usun-*-entry.ts`,
  `*-bundle.cjs`) są objęte **istniejącymi** wzorcami `.gitignore` (`gra/tools/.*-entry.ts`
  linia 63, `gra/tools/.*-bundle.cjs` linia 61) — sprawdzone przez `git check-ignore -v`.
  Po uruchomieniu wszystkich bramek `git status --porcelain` jest pusty. Integracja **nie
  wymaga** zmiany `.gitignore`.

## 3. Granice §9 — ocena niezależna

| # | Granica | Stan |
|---|---|---|
| 1 | zakaz `npm run build`/`dev` | u mnie build wyłącznie `node ./node_modules/vite/bin/vite.js build --outDir /tmp/civ-dist-farma-legacy-fc --emptyOutDir`; w artefakcie brak śladu zakazanej komendy |
| 2 | zakaz `git add -A` | commity per plik, w commitach nic spoza allowlisty — pośredni dowód zgodności |
| 3 | sekrety | brak |
| 4 | proces w allowliście produktowej | brak |
| 5 | `WERSJE.md` przed deployem | nietknięty |
| 6a | temat wizualny → przeglądarka | **ocena: to NIE jest temat wizualny/UX** — nie dochodzi nowy element, układ, kolor ani panel; zniknięcie mesha jedzie istniejącą, niezmienioną ścieżką `spawnImprovementMesh` (main.ts:11944 — dla `layers.length === 0` robi `scene.remove` + `disposeMergedDecor` + `improvementMeshes.delete`; przeczytane, nie założone). §9 poz. 6a nie odpala jako FAIL. Mimo to **uruchomiłem grę w żywym Chromium** — §5 niżej |
| 8 | deploy/push | nie wykonano; push wyłącznie gałęzi tematu |
| 9 | `merge-base` przy integracji | zastosowane w tej kontroli; dla orkiestratora: `merge-base` = `9015380b` |
| 10 | usuwanie worktree | nic nie usuwałem |

## 4. Bramki — uruchomione moją ręką, w moim worktree

```text
node tools/logic-test.cjs                        LOGIC OK (213/213)
node tools/tech-tree-test.cjs                    19 pass, 0 fail
node tools/research-test.cjs                     PASSED: 33 / FAILED: 0 / TOTAL: 33
node tools/unit-replace-test.cjs                 WSZYSTKIE TESTY ZIELONE (13/13)
node tools/combat-test.cjs                       COMBAT TEST: 6/6 pass
node tools/farma-lesie-usun-istniejace-test.cjs  143 OK / 0 FAIL      (bramka tematu)
node tools/farma-nie-w-lesie-test.cjs            136 passed, 0 failed (bramka sąsiednia)
node tools/map-improvement-qualify-test.cjs      117 pass, 0 fail     (bramka sąsiednia)
node ./node_modules/typescript/bin/tsc --noEmit  exit 0, zero błędów
node ./node_modules/vite/bin/vite.js build --outDir /tmp/civ-dist-farma-legacy-fc --emptyOutDir
                                                 OK, 848 modułów, 23,11 s
```

Komplet zgodny z liczbami deklarowanymi przez Operatora i Evaluatora — **niezależnie
odtworzony**, nie przepisany.

---

## 5. ZNALEZISKO 1 (NOWE) — pierwszy dowód BEHAWIORALNY wpięcia w `main.ts`

Operator i Evaluator zgodnie zgłosili tę samą dziurę: „wpięcie w `main.ts` sprawdzone
**strukturalnie, nie pomiarem**" i „ZERO weryfikacji w przeglądarce". **Zamknąłem tę dziurę.**

Metoda: żywy Chromium (Playwright, `executablePath` → `/opt/pw-browsers/chromium-1194`,
bo pakiet `playwright` oczekuje nieobecnej binarki 1228), **realny bundle produkcyjny**
`file:///tmp/civ-dist-farma-legacy-fc/index.html` — ten sam, który zbudowałem wyżej.
Dźwignia: `?demo=ulepszenia` (`seedDemoUlepszenia`, main.ts:12102) zasiewa ulepszenia na
KAŻDYM heksie, a `demoKeysForHex` dla `Nakladka.Las` zwraca `['farma','tartak','oboz_lowiecki',
'droga']` — czyli **tryb pokazowy sam stawia farmy na lesie na skalę całej mapy**. To
adwersarialny zasiew, jakiego żaden z dwóch poprzednich etapów nie miał w rękach.

Zmierzone (log konsoli przeglądarki, nie replika):

```text
[Diag:demo]     zasiano ulepszenia na 5301 heksach (tryb pokazowy)
   → klik „Zakończ turę"  (granica tury, main.ts:25650)
[Diag:migracja] farmy w lesie usuniete (granica tury): 1372 heks(ow); las zostaje, praca nie wraca
   → licznik tury: 1 → 2
   → console errors: []   pageerrors: []
```

Powtórzone w trzech niezależnych przebiegach — za każdym razem **1372** heksy. To jest dowód,
że:

1. sweep w `main.ts` **faktycznie się wykonuje w grze**, na granicy tury, w realnym bundlu;
2. import `removeLegacyFarmsOnForest` do `main.ts` nie wywraca boota (boot bez `?demo`
   również: `CANVAS = true`, zero błędów konsoli);
3. skala pracy jest realna (1372 heksy), a nie syntetyczna.

**Czego NADAL nie udowodniłem (§13a):**

- **Brak wizualnego PRZED/PO mapy.** Mapa playtestowa trybu demo kończy się zwycięstwem przez
  dominację **na turze 2** — ekran „ZWYCIĘSTWO" zasłania mapę już ~2,5 s po granicy tury.
  Zrzut PRZED mam (`fc-A-przed.png`, mapa z ulepszeniami), zrzutu PO mapy nie ma.
- **Idempotencja w przeglądarce NIEUDOWODNIONA.** Drugiej granicy tury nie da się w tym trybie
  osiągnąć (gra zakończona) — kolejne kliki „Zakończ turę" nie przesuwają licznika, więc brak
  drugiego sweepu **niczego nie dowodzi**. Idempotencja jest udowodniona wyłącznie w Node
  (bramka tematu + sonda Evaluatora), nie w grze.
- Nadal brak dowodu na **realnym, starym pliku zapisu właściciela** oraz na **partii z aktywnymi
  AI CYWILIZACJI** (komputerowi przeciwnicy). Sprzątanie jest z konstrukcji globalne
  (`map.hexes` + rejestr, bez ownera), więc obejmuje zarówno AI GRACZA (automat wspierający
  gracza), jak i AI CYWILIZACJI — ale to odczyt kodu, nie pomiar rozgrywki.

## 6. ZNALEZISKO 2 (NOWE, spoza obu raportów) — zwrot Pracy za farmę, której już nie ma

**Nie jest to naruszenie GOAL-a** (żadna farma na lesie nie powstaje), ale **jest to wyłom
w kryterium końca nr 2 („praca włożona w farmę NIE wraca")** — i żaden z dwóch poprzednich
etapów go nie zauważył.

Mechanizm (odczyt kodu + własny pomiar):

- `improvement-build.ts:899` — w kwalifikacji: `if (state.pendingUndoKeys?.has(\`${hexKey}:${key}\`)) return true;`
  — wpis „cofnij" **omija wszystkie reguły terenowe**, w tym bramkę leśną.
- `improvement-build.ts:1416` — `handleHexClick` dla klucza z `pendingUndoKeys` buduje żądanie
  **z pominięciem `qualifies()`**.
- `main.ts:11632` `applyBuildRequest` → `pendingImprovementsTurn.has(...)` → `undoPendingBuildRequest`
  → `main.ts:11585-11588` `playerPracaPool += pending.kosztPraca`.
- Kolejność wczytania: `main.ts:32410` `restorePlacedImprovementsFromSave` (→ tam sweep,
  linia 12027) biegnie **PRZED** `main.ts:32418` `PendingImprovementsTurn.fromSave(...)`.
  Kolejność EOT: sweep (25650) → `doRotatingAutosave()` (25668) → `commitTurn()` (25679) —
  czyli **autozapis rotacyjny powstaje, gdy lista `pending` jest jeszcze pełna**.

Pomiar (własna sonda, `buildImprovementQualifier` + `createImprovementBuildApi` z realnego
źródła; heks `3,1` = Łąka + Las + farma-relikt, `kosztPraca` z danych gry):

```text
isImprovementBlockedOnForest('farma', Las)      = true
qualifies(farma,3,1) BEZ pending                = false          ← bramka leśna działa
sweep.removed                                   = 1
improvementKeysForHex(3,1) PO sweepie           = []             ← farma usunięta
placed.has(3,1) PO sweepie                      = false
qualifies(farma,3,1) Z pending PO sweepie       = true           ← BRAMKA OMINIĘTA
getQualifyingHexes(farma) zawiera 3,1           = true           ← heks jeszcze podświetlony
handleHexClick(3,1)                             = {"key":"farma","hexKey":"3,1","kosztPraca":40}
canBuild(farma,3,1) Z pending                   = true
```

Skutek: zapis zrobiony **w trakcie tury** przez starą wersję gry (z nieskomitowanym wpisem
„cofnij" dla farmy na lesie) po wczytaniu daje stan, w którym farma jest już usunięta przez
migrację, a gracz **klikając ten heks odzyskuje 40 Pracy za ulepszenie, którego nie ma**.
Efekt drugiego rzędu: gdy w rejestrze nie ma już wpisu, `undoPendingBuildRequest` woła
`syncHexUlepszenieFields(hexKey, [])`, co zdejmuje z heksa również warstwy istniejące
wyłącznie w polach heksa.

**Dlaczego nie stawiam z tego BLOKERA:** GOAL („żaden stan gry nie zawiera farmy na lesie")
jest spełniony — ścieżka undo tylko usuwa, nigdy nie dostawia farmy; wyłom dotyczy waluty
(Praca), nie stanu heksa; wymaga starego zapisu zrobionego w trakcie tury; a poprawka rusza
podsystem cofania (`pendingImprovementsTurn`), którego dispatch tego tematu nie obejmuje
i przy którym obowiązuje §14. Kandydat na poprawkę jest jednolinijkowy (zdjęcie wpisu
`pending` dla posprzątanego heksa w `sweepLegacyFarmsOnForest`), ale **decyzja o zakresie
należy do orkiestratora/właściciela, nie do mnie** — oddaję to jako osobny temat.

## 7. ZNALEZISKO 3 (proces, §16b pkt 4) — uwaga U1 Evaluatora nie jest kosmetyczna i nigdzie nie zapisana

Evaluator zgłosił U1 (`demoKeysForHex` dla `Nakladka.Las` nadal zwraca `'farma'`) i zostawił ją
**w raporcie**. §16b pkt 4 wymaga, by uwaga `PASS-WITH-NOTES` dotykająca GOAL/zakresu albo
została rozstrzygnięta, albo **zapisana jako osobny temat**. `grep` po `dyspozycje/*.md` nie
znajduje żadnego wpisu. Mój pomiar z §5 pokazuje, że to nie drobiazg: tryb pokazowy stawia
**1372 farmy w lesie**, które nowe sprzątanie po cichu kasuje na pierwszej granicy tury —
tryb podglądu prezentuje więc układ sprzeczny z obowiązującą regułą, a potem sam się zmienia
pod ręką oglądającego. **Nie wolno tego dołożyć do allowlisty tego tematu** (§14) — to nowy,
jednolinijkowy temat do dispatchu.

## 8. ZNALEZISKO 4 (proces, §16b pkt 6) — rejestr nie odzwierciedla stanu faktycznego

`dyspozycje/REJESTR-PROSB-I-ZADAN.md`:

- linia **3218**: `P-ULEPSZENIA-FARMY-JUZ-STOJACE-W-LESIE-Q1` → nadal
  `OTWARTE — wymaga decyzji wlasciciela (turniej C-018 w toku)`;
- linia **3241** (ECHO 2026-08-27): ten sam identyfikator → `ZAREJESTROWANE — rozstrzygniete
  jako WARIANT C, do dispatchu`.

Dwa sprzeczne stany tego samego pytania, a **żaden wiersz nie odnotowuje, że temat
`R-ULEPSZENIA-FARMA-LESIE-USUN-ISTNIEJACE-Q1` został zdispatchowany i wykonany**. Rejestr
jest poza allowlistą tego tematu → **zadanie orkiestratora przy integracji**, nie Operatora.

## 9. Weryfikacja werdyktu Evaluatora

- Werdykt oparty na artefaktach, nie na deklaracjach (§16b pkt 3): **tak** — Evaluator podaje
  numery linii, własne ziarna, własne mutacje i własną sondę; jego liczby bramek odtworzyłem
  co do sztuki.
- `PASS-WITH-NOTES` nie ukrywa uwagi dotyczącej GOAL, dowodu, zakresu ani granic §9 (§16b pkt 4):
  **uwagi są jawne**, ale U1 nie została zapisana jako osobny temat — §7 wyżej.
- U2 (asymetria nośników: plan czyta wyłącznie rejestr, gdy wpis istnieje) — sprawdziłem
  niezależnie i potwierdzam zarówno zjawisko, jak i argument o nieosiągalności: wszyscy pisarze
  obu nośników (`applyBuildRequest`, `undoPendingBuildRequest`, `restorePlacedImprovementsFromSave`,
  `seedDemoUlepszenia`) aktualizują je razem. Dodam, że **render czyta UNIĘ** obu nośników
  (`mergedImprovementLayers`, main.ts:2274), więc unia w planie byłaby też spójniejsza z tym,
  co widzi gracz. Nie jest to bloker.
- Temat nie był dzielony na węzły (§12) — pkt 7 §16b nie ma zastosowania.

---

## 10. Werdykt

GOAL jest spełniony i **po raz pierwszy udowodniony behawioralnie w żywej grze** (1372 heksy
posprzątane na granicy tury w realnym bundlu, zero błędów konsoli). Ślad procesowy jest
kompletny: dispatch → Operator → Evaluator → Final Control, jedno ID, praca w commitach, brak
dryfu, allowlista czysta, komplet bramek zielony odtworzony niezależnie. Dwa znaleziska
procesowe (§7, §8) i jedno kodowe (§6) są **poza GOAL-em tego tematu** i idą do orkiestratora
jako osobne pozycje — nie jako warunek integracji.

**GOTOWOSC DO INTEGRACJI: TAK**

Do wykonania przez orkiestratora **przy** integracji (nie w tej allowliście):
1. uporządkować `REJESTR-PROSB-I-ZADAN.md` (§8);
2. zarejestrować osobny temat na `demoKeysForHex` (§7);
3. zarejestrować osobny temat/ABC na zwrot Pracy z nieaktualnego wpisu „cofnij" (§6).

---

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-ULEPSZENIA-FARMA-LESIE-USUN-ISTNIEJACE-Q1
GOAL: Zaden stan gry — nowa partia, trwajaca partia, wczytany zapis — nie zawiera farmy stojacej
na heksie z nakladka Las; las zostaje nietkniety, praca NIE wraca.
ZMIANY/COMMIT: bez zmian w `gra/`. Oceniony commit kodu `cc98a78b`, raport Evaluatora `023ce2b2`,
merge-base `9015380b` (= `origin/main`, brak dryfu). Ten raport:
`dyspozycje/autobot/runs/R-ULEPSZENIA-FARMA-LESIE-USUN-ISTNIEJACE-Q1/03-final-control.md`.
TESTY: logic 213/213, tech-tree 19/0, research 33/33, unit-replace 13/13, combat 6/6,
farma-lesie-usun-istniejace 143/0, farma-nie-w-lesie 136/0, map-improvement-qualify 117/0,
`tsc --noEmit` 0 bledow, build vite `--outDir /tmp/civ-dist-farma-legacy-fc` OK (848 modulow,
23,11 s). Ponadto ZYWY CHROMIUM na realnym bundlu: `?demo=ulepszenia` → 5301 heksow zasianych,
granica tury → `farmy w lesie usuniete (granica tury): 1372 heks(ow)`, tura 1→2, zero bledow
konsoli, powtorzone 3x. Wlasna sonda kwalifikacji: `qualifies(farma,las)` bez `pending` = false,
z nieaktualnym wpisem `pending` = true, `handleHexClick` zwraca zadanie z `kosztPraca: 40`.
BLOKADY: brak blokad integracji. Trzy pozycje dla orkiestratora poza allowlista tematu:
(1) rejestr niespojny (REJESTR-PROSB-I-ZADAN.md:3218 vs :3241, brak sladu wykonania tematu);
(2) uwaga U1 Evaluatora (`demoKeysForHex` sieje farmy w lesie — zmierzone 1372) niezapisana
jako osobny temat, wymagana przez §16b pkt 4; (3) nieaktualny wpis „cofnij" zwraca Prace za
usunieta farme — wylom w kryterium 2, nie w GOAL.
RUNDY: 1/5
NASTEPNY KROK: integracja orkiestratora (allowlist-only, `git merge --no-ff` od merge-base
`9015380b`), nastepnie `READY_FOR_DEPLOY` wystawiony przez orkiestratora.
DEPLOY/PUSH: NIE WYKONANO. Push wylacznie galezi tematu
`autobot/R-ULEPSZENIA-FARMA-LESIE-USUN-ISTNIEJACE-Q1` z tym raportem. Do `main` nie pushowano,
nie integrowano, nie deployowano.
