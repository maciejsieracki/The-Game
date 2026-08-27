# 03 — FINAL CONTROL, RUNDA 3

STATUS: DECISION_REQUIRED
DOMAIN: GAME
TEMAT: `R-AI-WYRAB-PRZY-RZECE-FARMY-Q1`
MODEL+EFFORT: **Opus 5, effort high** · RUNDY: **3/5** · DEPLOY-PUSH: **NIE WYKONANO**

GOAL: trzecia, niezależna reprodukcja rundy 3 i rozstrzygnięcie gotowości do integracji;
priorytet właściciela — **kronika trzech stanów** (PRZED runda 1 / W-A runda 2 / W-B runda 3):
czy heks nadal jest domykany kompleksowo, mimo że `posterunek` i `fort` z tej sekwencji wyszły,
i czy w kronice widać `wyrab` oraz farmę powstającą po nim.

GIT: `git fetch` wykonany. `origin/autobot/R-AI-WYRAB-PRZY-RZECE-FARMY-Q1` = **`21221d78`**
(Evaluator) ← `640c6b3e` `9edf2893` `eca8d316` `80d45068` (Operator) ← `3e84fbc8` (W-A, runda 2).
Zmiany są **w commitach**, nie w brudnym drzewie: `git status` czysty w `/home/user/wt-op-ai3`
i w drzewie głównym (C-019). `merge-base origin/main 21221d78` = `56af44de`;
**`git merge-tree --write-tree origin/main 21221d78` → tree `46a97e88`, exit 0, ZERO konfliktów**;
`git merge --no-ff --no-commit` w `/home/user/wt-fc-ai3-merge` przeszedł bez konfliktu.
Diff rundy 3 (`3e84fbc8..21221d78`) = 11 plików; **jedyny plik gry: `gra/src/game/auto-improvements.ts`**.
`ai.ts`, `main.ts`, `gra/data/**`, `improvement-build.ts`, `ui/**`, `WERSJE.md`, `gra-robocza/**`
nietknięte (sprawdzone w diffie, nie w raporcie). `git diff --check` czysty.
Worktree: `/home/user/wt-fc-ai3` (gałąź), `-base` (`470c5bb5`), `-merge` (próbny merge) — zostawione.

## A. KRONIKA TRZECH STANÓW — moja trzecia metoda

Operator liczy ze **strumienia rozkazów**, Evaluator ze **snapshotu stanu mapy**. Ja liczę
**ciągłość heksa w porządku chronologicznym** — jak w rundzie 2, ale **dwa razy**, bo W-B
zmienił definicję domknięcia: **K1** = po wszystkich rozkazach (metryka rundy 2, porównywalna
wstecz), **K2** = po rozkazach **plonowych** (bez `posterunek`/`fort`) — to jest kontrakt W-B.
Dochodzi **głębokość**: ile ulepszeń plonowych przypada na heks roboczy (sama ciągłość dałaby się
oszukać heksem z jednym ulepszeniem). Modeluję też silnik przy wyrębie (wyrąb tylko gdy heks
NADAL ma Las, potem `stripImprovementsWhenForestRemoved`) — tego kronika rundy 2 nie robiła.
Narzędzie: `gra/tools/fc3-kronika-trzy-stany.cjs`, logi `fc3-kronika-{przed,wa,wb}.txt`.
Ziarna **1337, 2026, 5150, 7, 99 × 40 tur** (te same co w mojej rundzie 2 — dlatego kolumna W-A
jest kontrolą: odtworzyła się **co do sztuki**).

### AI CYWILIZACJI — prawdziwe wejście `decideAITurn`, `maxItemsPerCity: 1`, 600 rozkazów

| miara | PRZED (r1) | W-A (r2) | **W-B (r3)** |
|---|---|---|---|
| heksów tkniętych | 457 | 141 | **224** |
| K1 domkniętych bez przerwy | 0/143 = **0 %** | 138/138 = **100 %** | 191/203 = **94 %** |
| **K2 (plonowe — kontrakt W-B)** | 0/143 = **0 %** | 120/138 = **87 %** | **193/203 = 95 %** |
| średnia przerwa na heksie plonowym | **22,84 tury** | 0,13 | **0,08** |
| głębokość: ulepszeń plonowych/heks | 1,31 | **2,91** | 2,47 |
| **`wyrab` / farma PO wyrębie** | **0 / 0** | **0 / 0** | **67 / 64** |
| `posterunek` / `fort` | 0 / 0 | 96 / 93 | **10 / 11** |
| `tartak` | 0 | 68 | 19 |
| kategorie żywność/surowce/infra | 600/0/0 | 234/142/224 | **324/140/69** |
| farmy przy rzece | 94/456 = 20,6 % | 78/97 = 80,4 % | 91/121 = **75,2 %** |
| **plon żywności/turę** | **3429** | **2892** | **3139** |
| drewno/turę | 2570 | 2570 | **1925** |

`wyrab` per ziarno (1337·2026·5150·7·99): **18 · 10 · 9 · 17 · 13**; farmy po wyrębie
**17 · 9 · 8 · 17 · 13**. **Zero na żadnym ziarnie.** E1/E2 na moich ziarnach (narzędziem
Operatora, kontrola krzyżowa — rozkład per klucz i plon **identyczne** z moim narzędziem):
**E1 max 5** (ziarno 7), śr. **2,1**; **E2 rozpiętość 2,1 tury**, obcych heksów **1,6**.
E1 ≤ 5 i E2 ≤ 6 — spełnione, ale **E1 max = 5 to dokładnie limit, zero zapasu** (tak samo
zgłosił Evaluator).

**ODZYSK ŻYWNOŚCI, LICZBĄ: (3139 − 2892) / (3429 − 2892) = 247/537 = 46,0 %.**
Operator 42,2 %, Evaluator 42,8 % (model harnessowy) i 32,1 % (model wierny terytorium).
**Trzy harnessy, trzy zestawy ziaren, trzy razy MNIEJ NIŻ POŁOWA. Kryterium 1 rundy 3 jest
NIESPEŁNIONE — potwierdzam to własnym pomiarem, nie przepisuję cudzej liczby.**
Odzysk jest realny, nie przesunięty: rosną żywność (+247), praca (+101) i handel (+174);
spada wyłącznie drewno (2570 → 1925, **−25,1 %**) — to jest zmierzona cena decyzji Q1
„wycinać mimo to", nie usterka.

### ODPOWIEDŹ NA PYTANIE 1 — czy heks NADAL jest domykany kompleksowo?

**TAK, i na kontrakcie W-B jest domykany LEPIEJ niż w W-A: K2 87 % → 95 %.** Powód widać
w kronice: w W-A `posterunek`/`fort` wchodziły w środek sekwencji plonowej i przy
`maxItemsPerCity: 1` wstawiały heksowi plonowemu przerwę; w W-B idą na osobne heksy graniczne
(znacznik `[OBRONA]`) i nie przerywają nic. Spadek K1 (100 % → 94 %) i głębokości (2,91 → 2,47)
ma jedną przyczynę, którą podaję uczciwie: te same 600 rozkazów rozkłada się teraz na **224
heksy zamiast 141** (67 rozkazów zjada sam wyrąb, a wycięte heksy otwierają nowe sekwencje).
To jest rozcieńczenie, nie powrót do chaosu — punkt odniesienia PRZED to **0 %** i **22,84 tury
przerwy**.

### ODPOWIEDŹ NA PYTANIE 2 — czy w kronice widać wyrąb i farmę po nim?

**TAK, dosłownie, tura po turze.** Ziarno 1337, AI CYWILIZACJI (`fc3-kronika-wb.txt`):
`(5,5)[RZEKA][LAS] wyrab t9 → farma t10 → bydlo t11 → droga t12 → droga_brukowana t13`,
równolegle `(7,20)` i `(12,7)` tym samym wzorem. **Par `wyrab → farma` na tym samym heksie:
17 z 18 na tym ziarnie, średnie opóźnienie 0,9 tury** — czyli farma w następnej turze po
wycince, dokładnie jak w ECHO właściciela. Wszystkie wycinane heksy w kronice mają znacznik
`[RZEKA]`. Warstw skasowanych przez wyrąb (`stripImprovementsWhenForestRemoved`): **0** —
zgodnie z Evaluatorem; nowy krok nie kasuje tartaków ani obozów.

### AI GRACZA — konfiguracja `main.ts` ODTWORZONA (BRAK DOWODU, §13a)

`wyrab` = **0** w PRZED, w W-A i w W-B, na wszystkich profilach. Przyczyna potwierdzona przeze
mnie **na drzewie próbnego merge'a**, czyli przeciwko aktualnemu `main`: `src/main.ts:27192`
`skipWyrab: true` (dla porównania `src/game/ai.ts:1999` `skipWyrab: false`, `:1998`
`maxItemsPerCity: 1` — nietknięty). `main.ts` jest **poza allowlistą rundy 3**, więc to nie jest
wina Operatora. Reszta ścieżki gracza (profil „Zrównoważona"): K2 58 % → **65 %**,
`posterunek`/`fort` 43/42 → **5/5**, `tartak` 37 → **47**, plon żywności 2621 → **2704**.
Dług dowodowy z rundy 2 (closure `boot()`) **zostaje nieusunięty**.

## B. NIETAUTOLOGICZNOŚĆ — reprodukcja i JEDNA NOWA MUTACJA

- **M0** (całe źródło rundy 2 pod bramkę rundy 3): **22/10** — co do sztuki jak u Operatora
  i Evaluatora.
- **M-FC1 (moja, nowa): usunięcie warunku rzeki przy wyrębie** (`riverHexKeys.has(hexKey) ||
  wolnoKarczowacPozaRzeka` → `true`). Bramka tematu: **34/0 — NIE ZAUWAŻA**. Skutek
  zachowania jest realny i zmierzony (`fc3-mutacja-mfc1.txt`): `wyrab` 67 → **75**,
  `tartak` 19 → **12**, drewno 1925 → **1805**. **Bramka pinuje, że wyrąb w ogóle jest, ale
  NIE pinuje, że jest PRZY RZECE** — a „przy rzece" jest w nazwie tematu. Luka asercji, nie
  defekt kodu; źródło przywrócone, drzewo czyste.

## TESTY (moja ręka, każde wywołanie w `timeout`, wynik uruchomienia — nie z pamięci)

**Na gałęzi `21221d78`:** `tsc --noEmit` **0** (TypeScript 5.9.3, `node_modules` podlinkowane,
C-029) · logic **213/213** · tech-tree **19/0** · research **33/33** · unit-replace **13/13** ·
combat **6/6** · auto-improvements **45/0** · map-improvement-qualify **112/0** ·
oboz-lowiecki-las **91/0** · oboz-lowiecki-evaluator-probe **88/0** · oboz-lowiecki-fc-balans
**5/0** · oboz-lowiecki-fc-r2-nowa-sciezka **22/0** · ai-improvements **52/0** ·
ai-jednostki-tylko-zakup **44/0** · bramka tematu `ai2-heks-po-heksie-test` **34/0**.

**Na drzewie PRÓBNEGO MERGE'A (`origin/main` `470c5bb5` + gałąź) — komplet powtórzony:**
tsc **0** · logic **213/213** · tech-tree **19/0** · research **33/33** · unit-replace **13/13** ·
combat **6/6** · auto-improvements **45/0** · map-improvement-qualify **112/0** · cztery bramki
obozu **91/0, 88/0, 5/0, 22/0** · ai-improvements **52/0** · ai-jednostki-tylko-zakup **44/0** ·
bramka tematu **34/0**.

**ZASTANY REGRES:** `ai-praca-split-parity-test` **21/1 na bazie `main` `470c5bb5`**,
**21/1 na gałęzi**, **21/1 po mergeu** — trzy pomiary moją ręką. Nie pogorszony, nie naprawiany.

**Build C-001:** `node ./node_modules/vite/bin/vite.js build --outDir /tmp/civ-dist-airzeki-r3-fc
--emptyOutDir` → **exit 0**, `index.html` **37 417,94 kB**, 23,56 s (outDir unikalny per rola).

## KONTROLA ŚLADU (§16b)

`00-dispatch.md` istnieje; `GOAL` w raportach Operatora i Evaluatora zgodny z wiążącą sekcją
**RUNDA 3 — ECHO właściciela**; ID identyczne we wszystkich trzech rundach; werdykt Evaluatora
oparty na własnym narzędziu i własnych uruchomieniach, nie na deklaracjach; licznik **3/5**,
bez cichego resetu; temat nie był dzielony na węzły. Rozróżnienie **AI GRACZA / AI CYWILIZACJI**
utrzymane w obu raportach i w tym. `PASS-WITH-NOTES` Operatora **nie ukrywa** uwagi o GOAL-u ani
o granicach — kryterium 1 zgłosił sam, liczbą, w pierwszym akapicie (§3b spełnione).

## BLOKADY

1. **Kryterium 1 rundy 3 NIESPEŁNIONE — 46,0 % (moje), 42,2 % (Operator), 42,8 %/32,1 %
   (Evaluator).** Decyzja właściciela: które ulepszenia NIEżywnościowe przyciąć
   (`warzelnia_soli` 81, `lodzie_rybackie` 79, drogi 48, `glinianka` 29 na moich ziarnach)
   kosztem wymogu „równomiernie" z rundy 2. **Zakaz wybierania za właściciela** — to jest
   balans rozgrywki (§10).
2. **GOAL wyrębu spełniony TYLKO dla AI CYWILIZACJI.** Dla AI GRACZA `wyrab` = 0, bo
   `main.ts:27192 skipWyrab: true` — plik poza allowlistą rundy 3. To decyzja właściciela
   (czy automat gracza ma karczować), nie poprawka Operatora.
3. **Bramka tematu nie pinuje warunku rzeki przy wyrębie** (moja mutacja M-FC1 → 34/0).
   Do domknięcia w rundzie 4, razem z asercją „farma po wyrębie stoi na heksie z rzeką".
4. **`JEDEN_NA_ILU_OBYWATELI = 10` rozszerzone przez Operatora z ECHO o tartaku/obozie na
   `posterunek`/`fort`** — liczba dobrana przez Operatora, zgłoszona przez niego uczciwie,
   **do potwierdzenia przez właściciela**. Skutek: 2 posterunki + 2 forty na ziarno przy
   3 miastach, czyli **jedno miasto na ziarno nie dostaje obrony w 40 turach**.
5. **E1 max = 5 przy limicie 5** — zero zapasu; kolejna zmiana zwiększająca liczbę heksów
   w toku przekroczy kryterium.
6. **BRAK DOWODU (§13a)** — ścieżka AI GRACZA nadal mierzona odtworzoną konfiguracją
   (closure `boot()` w `main.ts`). Dług z rundy 2, nieusunięty.
7. **Rejestr nie odzwierciedla stanu faktycznego (§16b pkt 6), niezmienione od rundy 2:**
   wpis ABC rundy 1 (`PYTANIA-OTWARTE.md:32035`) nadal ma `STATUS: **OTWARTE** — Runda 2 NIE
   startuje przed odpowiedzią`, choć właściciel odpowiedział i ruszyły rundy 2 i 3; **brak
   wpisu ABC dla decyzji W-A/W-B/W-C** (0 trafień) mimo że decyzja „W-B" zapadła. Zadanie
   orkiestratora.
8. **Artefakt `territoryNodes`** (węzeł na heks zamiast na miasto) w narzędziach wszystkich
   trzech ról — wykryty przez Evaluatora, potwierdzam, że i moje narzędzie go dziedziczy po
   rundzie 2. Nie zmienia kierunku wniosku (model wierny daje odzysk NIŻSZY, 32,1 %).
9. Do rejestru (§14, NIE naprawiam): `kopalnia_zlota` poza `AI_IMPROVEMENT_PRIORITY`;
   `ULEPSZENIA_FOCUS_ZROWNOWAZONE` to ta sama stała co `AI_IMPROVEMENT_PRIORITY`;
   zastany regres `ai-praca-split-parity-test` 21/1 na `main`.

## CZEGO BRAKUJE — KONKRETNY CEL RUNDY 4 (nie powtórka)

1. **Decyzja właściciela (ABC), dwa pytania, oba liczbowe:** (a) które ulepszenia
   nieżywnościowe przyciąć, żeby odzysk przekroczył 50 % — z listą kandydatów i ceną każdego;
   (b) czy AI GRACZA ma karczować (`skipWyrab` w `main.ts`), a jeśli tak — rozszerzenie
   allowlisty o tę jedną linię.
2. **Domknięcie bramki:** asercja „wyrąb wchodzi wyłącznie na heks z rzeką, dopóki są
   niezagospodarowane rzeki" + asercja „farma po wyrębie na heksie z rzeką", każda z mutacją
   (M-FC1 jest gotowym wzorcem).
3. **Naprawa artefaktu `territoryNodes`** w narzędziach pomiarowych — jeden wspólny model
   terytorium dla trzech ról, żeby czwarta runda nie licytowała się modelami.

ZMIANY-COMMIT: ten raport · `gra/tools/fc3-kronika-trzy-stany.cjs` ·
`fc3-kronika-przed.txt` · `fc3-kronika-wa.txt` · `fc3-kronika-wb.txt` · `fc3-mutacja-mfc1.txt`.
**Zero zmian w `gra/src/**` i `gra/data/**`.** Allowlista rundy 3 dotrzymana,
`git diff --check` czysty.

RUNDY: 3/5
NASTĘPNY KROK: ABC do właściciela z blokadami 1, 2 i 4 (dotyczą OBU ścieżek AI — silnik wspólny)
oraz zamknięcie nieaktualnego wpisu ABC rundy 1; po odpowiedzi — runda 4 z celem wyżej,
potem integracja allowlist-only.
DEPLOY-PUSH: NIE WYKONANO

**GOTOWOŚĆ DO INTEGRACJI: NIE** — i mówię wprost, że **nie z powodu wady wykonania**.
Praca Operatora broni się w trzeciej, niezależnej reprodukcji: `wyrab` faktycznie się dzieje
(67/64 na moich ziarnach, > 0 na każdym), heks jest domykany kompleksowo (K2 95 %, lepiej niż
w W-A), `posterunek`/`fort` nie zniknęły, rozkład kategorii jest niezdegenerowany, wszystkie
bramki są zielone także po próbnym mergeu, merge jest bezkonfliktowy, zakres nie wychodzi
poza jeden plik gry. Blokuje **jawne, liczbowe kryterium 1 tej rundy** (odzysk 46 % < 50 %),
którego naprawa wymaga decyzji właściciela o przycięciu ulepszeń nieżywnościowych — czyli
odwołania jego własnego wymogu „równomiernie" z rundy 2, a tego nie wolno wybrać za niego —
oraz **niespełniona połowa kryterium 3** (AI GRACZA `wyrab` = 0 przez flagę w pliku poza
allowlistą). Obie rzeczy to odpowiedzi właściciela, nie praca Operatora: **odpowiedź na dwa
pytania z ABC odblokowuje rundę 4, a ta jedno wejście do integracji.**
