# 03 — FINAL CONTROL, RUNDA 2

STATUS: DECISION_REQUIRED
DOMAIN: GAME
TEMAT: `R-AI-WYRAB-PRZY-RZECE-FARMY-Q1`
MODEL+EFFORT: **Opus 5, effort high**
GAŁĄŹ: `autobot/R-AI-WYRAB-PRZY-RZECE-FARMY-Q1` @ `c3b6505a` · worktree `/home/user/wt-fc-ai2`
(gałąź), `/home/user/wt-fc-ai2-base` (`56af44de`), `/home/user/wt-fc-ai2-merge` (próbny merge) —
zostawione.

GOAL: trzecia, niezależna reprodukcja rundy 2 i rozstrzygnięcie gotowości do integracji;
priorytet właściciela — **kronika oczami gracza, osobno dla AI GRACZA i osobno dla AI
CYWILIZACJI**: czy widać, że kończy jeden heks przed następnym, czy widać priorytet rzek
i czy AI CYWILIZACJI buduje równomiernie.

Git: `git fetch` wykonany. Gałąź: `50815810` (pomiar PRZED) · `9ee67089` (implementacja C) ·
`275163e2` (bramka) · `849bb951` (raport + część B) · `f687ca2d` + `c3b6505a` (Evaluator).
Zmiany są **w commitach**, nie w brudnym drzewie. `merge-base origin/main c3b6505a` =
`56af44de`; **próbny `git merge-tree --write-tree origin/main c3b6505a` → tree `6a5e3d12`,
ZERO konfliktów**. Diff `56af44de..c3b6505a` = 12 plików, jedyny plik gry to
`gra/src/game/auto-improvements.ts`; `ai.ts`, `main.ts`, `gra/data/**`, `improvement-build.ts`,
`ui/**`, `WERSJE.md`, `gra-robocza/**` nietknięte. Drzewo główne czyste (C-019).

## A. KRONIKA — MOJA TRZECIA METODA

Operator liczył ze **strumienia rozkazów**, Evaluator ze **snapshotu stanu mapy**. Ja liczę
**ciągłość heksa, bez atrybucji do miasta**: dla heksa z ≥2 rozkazami `tury` = liczba różnych
tur z rozkazem na nim, `span` = ostatnia − pierwsza + 1; heks jest **domknięty bez przerwy**
gdy `tury == span`. Atrybucji per miasto świadomie NIE robię — `AICmdBuildImprovement`
(`ai.ts:125`) nie niesie `cityId`, a promienie kandydatów sąsiednich miast zachodzą na siebie,
więc każda taka atrybucja byłaby zgadywaniem. Narzędzie: `gra/tools/fc2-kronika-dwie-sciezki.cjs`,
logi `fc2-kronika-przed.txt` / `fc2-kronika-po.txt`. Ziarna **1337, 2026, 5150, 7, 99 × 40 tur**.

### AI CYWILIZACJI — prawdziwe wejście `decideAITurn`, `maxItemsPerCity: 1`

| miara (5 ziaren × 40 tur, 600 rozkazów) | PRZED `56af44de` | PO `c3b6505a` |
|---|---|---|
| heksów tkniętych | 457 | **141** |
| heksów z ≥2 rozkazami domkniętych **bez przerwy** | 0 / 143 = **0 %** | 138 / 138 = **100 %** |
| średnia przerwa w pracy na heksie | **22,84 tury** | **0,00 tury** |
| różnych kluczy ulepszeń | 4 | **15** |
| kategorie żywność / surowce / infra | 600 / 0 / 0 | **234 / 142 / 224** |
| tartak · droga(+brukowana) · kopalnie | 0 · 0 · 0 | **68 · 35 · 3** |
| udział farm przy rzece | 20,6 % | **80,4 %** |
| udział rozkazów na heksach z rzeką | 20,8 % | **73,7 %** |

**Kronika, ziarno 1337, AI CYWILIZACJI** (pełna w `fc2-kronika-po.txt`) — trzy miasta,
każde domyka swój heks, wszystkie z rzeką:
`(4,5)[RZEKA][LAS]` farma t0 → obóz t1 → tartak t2 → posterunek t3 → fort t4, dopiero potem
`(5,4)` t5–t11, potem `(5,5)` t12–t18, potem `(6,4)` t19–t23. Ani jednego wyjścia na inny heks
w środku sekwencji. **PRZED, to samo ziarno: 93 heksy tknięte, 0 domkniętych bez przerwy,
średnia przerwa 23,15 tury** — dosłownie skarga właściciela „15 heksów naraz".

**Równomierność (wprost wymóg właściciela)** — rozbicie PO, AI CYWILIZACJI, 600 rozkazów:
`farma 97 · posterunek 96 · fort 93 · oboz_lowiecki 69 · tartak 68 · warzelnia_soli 40 ·
lodzie_rybackie 38 · bydlo 26 · glinianka 24 · droga 18 · droga_brukowana 17 · kamieniolom 7 ·
owce 4 · kopalnia_miedzi 2 · kopalnia_zelaza 1`. PRZED: `farma 456 · oboz_lowiecki 75 ·
bydlo 68 · owce 1` — cztery klucze, sama żywność. **Tartaki, drogi i kopalnie widać w kronice.**

### AI GRACZA — konfiguracja `main.ts` ODTWORZONA, profil „Zrównoważona"

| miara (5 ziaren × 40 tur) | PRZED | PO |
|---|---|---|
| rozkazów · heksów tkniętych | 313 · 188 | 272 · **76** |
| domkniętych bez przerwy | 5 / 120 = **4 %** | 32 / 48 = **67 %** |
| średnia przerwa | 13,22 tury | **1,21 tury** |
| kluczy · kategorie zyw/sur/infra | 6 · 308/0/5 | **13** · **93/55/124** |
| tartak · udział farm przy rzece | 0 · 33,8 % | **37** · **95,3 %** |

**BRAK DOWODU (§13a):** to jest odtworzona konfiguracja, nie prawdziwe wejście — `main.ts` jest
closure `boot()`. Zgłoszone uczciwie przez obie wcześniejsze role. **Moje domknięcie luki:**
strażnik tekstowy z bramki tematu uruchomiłem **na drzewie próbnego mergea**, czyli przeciwko
`main.ts` z aktualnego `origin/main` — `ai2-heks-po-heksie-test` **16/0**, więc odtworzona
konfiguracja zgadza się z żywym `main.ts`, a nie tylko z jego kopią sprzed rundy.

**Uczciwie: 67 %, nie 100 %.** Przerwy AI GRACZA to 1–4 tury wywołane wyczerpaniem budżetu
33 %, nie skakaniem po mapie (kronika `1337`: `(5,4)` droga t1 → farma t4 → … → fort t8).
Zachowanie jest wyraźnie kompleksowe, ale nie jest domknięte co do jednego heksa.

## B. CZY CZĘŚĆ B ZOSTAŁA WDROŻONA PO CICHU — NIE

Sprawdzone w diffie, nie w raporcie: `AI_IMPROVEMENT_PRIORITY` (21 kluczy) **nie występuje
w diffie**, `prioritiesForUlepszeniaFocus` i profile `ULEPSZENIA_FOCUS_*` nietknięte,
`ai.ts` i `main.ts` nie ma w diffie w ogóle. Zmieniona jest wyłącznie **kolejność obchodzenia
heksów** i dodany strażnik duplikatu warstwy. Trzy warianty W-A/W-B/W-C są w raporcie
Operatora jawnie jako pytanie do właściciela. **Werdykt: przedstawione uczciwie.**

Odtworzyłem podstawę liczbową własnym pomiarem `tileYield` (Łąka + rzeka, delta ulepszenia):
`farma 3/3/3` · `tartak 0/3/3` · `oboz_lowiecki 1/1/3` · `droga 0/0/2` · **`posterunek 0/0/0`** ·
**`fort 0/0/0`** · `kopalnia_zlota 0/2/10` (najwyższa delta, **nieobecna** w liście priorytetów).
Udział rozkazów o zerowej delcie plonu PO zmianie: **AI CYWILIZACJI 189/600 = 31,5 %**
(Operator 193/600, Evaluator 166/600 — zgodne), **AI GRACZA 85/272 = 31,3 %** (liczba,
której nie podała żadna z wcześniejszych ról).

**Zastrzeżenie, które musi usłyszeć właściciel:** gałąź **JEST wariantem W-A**. Integracja
przed odpowiedzią oznacza wybór W-A za właściciela. Farmy AI CYWILIZACJI spadają
456 → 97 przy stałych 600 rozkazach — to jest mechanizm spadku żywności o 16,8 %,
zmierzonego zgodnie przez Operatora i Evaluatora.

## C. NIETAUTOLOGICZNOŚĆ — powtórzona moją ręką

M2 (bez priorytetu rzeki) **15/1** · M3 (bez strażnika duplikatu warstwy) **15/1**, czysto
**16/0**. Przy M3 odtworzyłem defekt dróg: ziarno 1337, AI CYWILIZACJI, 40 tur — **`droga = 31`**
zamiast 4 (Evaluator: 31, co do sztuki). Źródło przywrócone, drzewo czyste.

## TESTY (moja ręka, każde w `timeout`, wynik uruchomienia, nie z pamięci)

**Na gałęzi `c3b6505a`:** `tsc --noEmit` **0** (TypeScript 5.9.3, `node_modules` podlinkowane —
C-029) · logic **213/213** · tech-tree **19/0** · research **33/33** · unit-replace **13/13** ·
combat **6/6** · auto-improvements **45/0** · map-improvement-qualify **112/0** ·
oboz-lowiecki-las **91/0** · oboz-lowiecki-evaluator-probe **88/0** · oboz-lowiecki-fc-balans
**5/0** · oboz-lowiecki-fc-r2-nowa-sciezka **22/0** · ai-jednostki-tylko-zakup **44/0** ·
ai-improvements **52/0** · bramka tematu `ai2-heks-po-heksie-test` **16/0**.

**Na drzewie PRÓBNEGO MERGEA (`origin/main` e74cb933 + gałąź)** — komplet powtórzony:
`tsc` **0** · logic **213/213** · tech-tree **19/0** · research **33/33** · unit-replace **13/13** ·
combat **6/6** · auto-improvements **45/0** · map-improvement-qualify **112/0** · cztery bramki
obozu **91/0, 88/0, 5/0, 22/0** · ai-jednostki-tylko-zakup **44/0** · bramka tematu **16/0** ·
**`wydarzenia-zbadano-karta-tech-real-render` 77/0** — bramka nie istnieje na gałęzi (baza
rundy sprzed jej integracji), ale **istnieje po mergeu i jest zielona**; to **usuwa BRAK
DOWODU nr 3 z raportów Operatora i Evaluatora**. Build C-001:
`node ./node_modules/vite/bin/vite.js build --outDir /tmp/civ-dist-airzeki-fc --emptyOutDir`
**exit 0**, 37 418,91 kB, 25,93 s.

**Zastany regres:** `ai-praca-split-parity-test` **21/1 na czystym `origin/main` (e74cb933)**,
**21/1 na bazie `56af44de`**, **21/1 na gałęzi**, **21/1 po mergeu** — cztery pomiary, nie
pogorszony, nie zielony. Nie mój, nie naprawiam.

## BLOKADY

1. **`DECISION_REQUIRED` (część B) — otwarte.** Wybór W-A/W-B/W-C to decyzja o balansie
   rozgrywki, więc należy do właściciela (§10), a dispatch pozwolił ją pominąć tylko gdyby
   Evaluator **i** Final Control uznali projekt za oczywisty. Evaluator nie uznał; ja też nie —
   31,5 % budżetu AI CYWILIZACJI na ulepszenia o zerowym plonie to nie jest rzecz oczywista.
2. **Brak wpisu ABC dla części B** (W-A/W-B/W-C) w `PYTANIA-OTWARTE.md` — 0 trafień.
   Zadanie orkiestratora.
3. **Wpis ABC rundy 1 jest NIEAKTUALNY** (`PYTANIA-OTWARTE.md:32035`): nadal
   `STATUS: **OTWARTE** — Runda 2 NIE startuje przed odpowiedzią`, mimo że właściciel
   odpowiedział („wycinać mimo to", „kompleksowość + tartaki") i runda 2 na tej odpowiedzi
   ruszyła. §16b pkt 6 — rejestr nie odzwierciedla stanu faktycznego. Nie widziała tego
   żadna z wcześniejszych ról. Zadanie orkiestratora.
4. **BRAK DOWODU — ścieżka AI GRACZA** mierzona przez odtworzoną konfigurację (zawężone
   przeze mnie strażnikiem uruchomionym na drzewie mergea, ale nie usunięte).
5. **`wyrab` = 0 na obu ścieżkach i strukturalnie nieosiągalny dla AI CYWILIZACJI.**
   Potwierdzam własnym przebiegiem: FAZA 2 (`wyrab`) rusza tylko gdy FAZA 1 nic nie
   postawiła, a przy `maxItemsPerCity: 1` FAZA 1 stawia coś w **600 na 600** rozkazów.
   Regresu nie ma (PRZED też 0), ale **wiążąca decyzja właściciela Q1 „wycinać mimo to"
   po tej zmianie jest trudniejsza do wdrożenia niż przed nią** — to musi wejść do rundy 3
   jawnie, a nie jako uwaga w raporcie. ID tematu brzmi `WYRAB`; jego własny GOAL wciąż
   nie jest spełniony.
6. Do rejestru (§14): `kopalnia_zlota` — najwyższa delta plonu (`+2` praca, `+10` handel),
   **nieobecna** w `AI_IMPROVEMENT_PRIORITY` (potwierdzone moim odczytem listy 21 kluczy
   i moim pomiarem `tileYield`). Nie naprawiam.
7. Nota: `ULEPSZENIA_FOCUS_ZROWNOWAZONE` **jest tą samą stałą** co `AI_IMPROVEMENT_PRIORITY`
   (`auto-improvements.ts:61`) — „Zrównoważona gracza ≈ AI cywilizacji" jest spełniona
   **z konstrukcji**, nie z wyniku. Podobieństwo rozkładów jest tego skutkiem, nie dowodem.
   Stan zastany, nietknięty tą zmianą.

## KONTROLA ŚLADU (§16b)

`00-dispatch.md` istnieje; `GOAL` w raportach Operatora i Evaluatora zgodny z sekcją
**KOREKTA ZAKRESU RUNDY 2** (wiążącą); ID identyczne we wszystkich rundach; werdykt
Evaluatora oparty na własnych uruchomieniach i własnym narzędziu, nie na deklaracjach;
licznik **2/5**, bez cichego resetu (ta sama gałąź, to samo ID); temat nie był dzielony
na węzły. Rejestr: patrz blokada 3. Rozróżnienie AI GRACZA / AI CYWILIZACJI utrzymane
w obu raportach i w tym.

ZMIANY-COMMIT: ten raport · `gra/tools/fc2-kronika-dwie-sciezki.cjs` ·
`fc2-kronika-przed.txt` · `fc2-kronika-po.txt`. **Zero zmian w `gra/src/**` i `gra/data/**`.**
Allowlista rundy 2 dotrzymana, `git diff --check` czysty.

RUNDY: 2/5
NASTĘPNY KROK: ABC do właściciela z częścią B (W-A/W-B/W-C) **oraz** zamknięcie
nieaktualnego wpisu ABC rundy 1; po odpowiedzi — integracja allowlist-only (gdy W-A)
albo runda 3 (gdy W-B/W-C), razem z niewdrożonym `wyrab`.
DEPLOY-PUSH: NIE WYKONANO

**GOTOWOŚĆ DO INTEGRACJI: NIE** — nie z powodu wady wykonania. Mechanika (część C) jest
zweryfikowana trzeci raz, niezależnie, i broni się w kronice obu ścieżek; bramki są zielone
także po próbnym mergeu; merge jest bezkonfliktowy. Blokuje **otwarta decyzja właściciela
z części B**: gałąź w obecnej postaci JEST wariantem W-A i integracja przed odpowiedzią
byłaby wyborem za właściciela, wbrew jawnemu zakazowi z dispatchu. **Odpowiedź „W-A"
odblokowuje integrację bez ani jednej dodatkowej zmiany w kodzie.**
