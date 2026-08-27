# 02 — EVALUATOR (runda 1)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: `R-EPOKA-ZELAZO-WYMUSZONA-WOJNA-Q1`
GOAL: Główna cywilizacja AI, która awansuje do epoki Żelaza (i nie jest już w żadnej wojnie),
force-wypowiada wojnę jednemu sąsiadowi terytorialnemu — mechanizmem wzorowanym 1:1 na Brązie,
tylko dla epoki 3. Miasta-państwa i gracz wyłączeni identycznie jak w Kamieniu/Brązie.
MODEL+EFFORT: **Opus 5, effort high** (Evaluator).
RUNDY: 1/5 · DEPLOY/PUSH: **NIE WYKONANO**

Weryfikowany commit: **`5532f3f1`** na gałęzi `autobot/R-EPOKA-ZELAZO-WYMUSZONA-WOJNA-Q1`
(bazowany na `origin/main` `9015380b`). Worktree Evaluatora: `/home/user/wt-ev-zelazo-wojna`
(+ `/home/user/wt-ev-zelazo-baseline` na `origin/main` dla przebiegu PRZED).

---

## 0. Werdykt w jednym akapicie

Mechanizm Żelaza jest zaimplementowany zgodnie z dispatchem, wpięty wyłącznie dopisami obok
Kamienia i Brązu (0 usunięć w `ai.ts`/`main.ts`), a jego działanie **potwierdziłem WŁASNYM,
INNYM pomiarem w żywej przeglądarce**, nie powtórzeniem harnessu Operatora. Wszystkie 8
kryteriów końca sprawdziłem osobno; wszystkie 5 bramek referencyjnych, obie bramki
Kamienia/Brązu, obie nowe bramki Żelaza, sondę mutacyjną, `tsc --noEmit` i `vite build`
uruchomiłem własną ręką w swoim worktree. **Sporną decyzję Operatora — wyzwalacz
`isIronEraEntry(prev, next) = (prev < 3 && next >= 3)` zamiast sztywnego `prev === 2 &&
next === 3` — AKCEPTUJĘ, i mój pomiar pokazuje, że jest ona nie tylko dopuszczalna, ale
KONIECZNA:** przy dojściu do Żelaza PRAWDZIWYMI BADANIAMI awans idzie **1 → 3 jednym skokiem**
(6/6 wejść w moim przebiegu), więc sztywna równość `2→3` **nie uzbroiłaby ANI JEDNEJ**
cywilizacji. Podtrzymuję wszystkie noty §13a Operatora (auto-pokój/odpoczynek/cooldown nie
zmierzone w rozgrywce; naturalne tempo dojścia do Żelaza nie zmierzone; w niezmodyfikowanej
grze mechanizm — jak Kamień i Brąz — dziś nie odpala w ogóle przez Z1/Z5) i dokładam dwie
własne obserwacje niżej. Brak blokad.

---

## 1. Filtr odwrotny allowlisty (nic poza allowlistą)

```
git -c core.quotePath=false diff --name-status <merge-base> HEAD
```
20 plików, **wszystkie w allowliście**, **wszystkie `A` lub `M`, zero `D`**:

| plik | status | wpis allowlisty |
|---|---|---|
| `gra/src/game/forced-war-iron.ts` | A (+234) | „nowy plik" |
| `gra/src/game/ai.ts` | M (**+38 / −0**) | wprost |
| `gra/src/main.ts` | M (**+244 / −0**) | wprost |
| `gra/tools/forced-war-iron-{test,main-guard-test,mutant-probe}.cjs` | A | `gra/tools/**` |
| `gra/tools/wojny-zelazo-{audyt.vite.config.ts,audyt.cjs,analiza.cjs}` | A | `gra/tools/**` |
| `dyspozycje/autobot/runs/R-EPOKA-ZELAZO-WYMUSZONA-WOJNA-Q1/**` (11 plików) | A | wprost |

Filtr odwrotny (`grep -v` po wzorcach allowlisty) → **0 plików**.
`gra/src/game/forced-war-common.ts` **NIE ruszony** — rdzeń wystarczył bez zmian, więc zero
ryzyka regresji dla Kamienia i Brązu z tej strony.
`dyspozycje/WERSJE.md` → **0 trafień**. `git diff --check` → **czysto**. `git status` → czysty.

**Współbieżność:** `origin/main` przesunął się w trakcie mojej pracy z `9015380b` na
`127db163` (+63 linie w `main.ts` z innych tematów). Sprawdziłem `git merge-tree` gałęzi
na nowy `origin/main` — **0 konfliktów**. Punktowość zmiany w `main.ts` (same dopisy w
osobnych blokach) zadziałała zgodnie z ostrzeżeniem dispatchu.

---

## 2. Kryteria końca — każde sprawdzone NIEZALEŻNIE

### K1 — nowy `forced-war-iron.ts`, funkcje czyste, własne stałe

Zrobiłem różnicę strukturalną `forced-war-bronze.ts` ↔ `forced-war-iron.ts` po
znormalizowaniu nazw (`bronze→XXX`, `braz→YYY` itd.) i odjęciu komentarzy. Poza komentarzami
kod różni się **dokładnie trzema rzeczami**:

```
+ export const EPOKA_ZELAZO_NUMER = 3;
+ export function isIronEraEntry(prev, next) { return prev < 3 && next >= 3; }
  (nazwy trzech stałych: WOJNA_WYMUSZONA_* → WOJNA_ZELAZO_WYMUSZONA_*)
```

Wszystko inne (eligibility, wybór celu, próg miast, odpoczynek, serializacja/deserializacja)
to cienkie delegacje do **niezmienionego** `forced-war-common.ts`. Zero DOM, zero mutacji
globalnych. Wartości: `2` miasta / `20` tur odpoczynku / `20` tur cooldownu — zgodne
z §PARAMETR dispatchu, bez własnych liczb Operatora. **K1 SPEŁNIONE.**

### K2 — wpięcie w `main.ts` analogiczne do Brązu/Kamienia

Policzyłem odwołania do 4 rejestrów każdej z trzech epok:

| rejestr | Kamień | Brąz | **Żelazo** |
|---|---|---|---|
| `*ForceWarPendingOwners` | 12 | 11 | **12** |
| `*ForceWarCycleOwners` | 11 | 10 | **10** |
| `*ForceWarRestUntilByOwner` | 11 | 12 | **11** |
| `*ForceWarActiveByPairKey` | 15 | 16 | **15** |

Jedyna różnica (Kamień ma 11 odwołań do `cycleOwners`, Żelazo 10) jest wyjaśniona: Kamień ma
dodatkowy warunek `!stoneForceWarCycleOwners.has(ownerId)` przy wyzwalaczu, bo jego wyzwalacz
to **próg tury** i musi sam pilnować jednorazowości; Brąz i Żelazo używają zamiast tego flagi
`pending`. Wpięcie Żelaza pokrywa komplet 8 punktów Brązu: rejestry, wyzwalacz w
`syncOwnerEraFromResearch`, wybór celu w pętli dyplomacji AI, konsumpcja `pending` WYŁĄCZNIE
przy faktycznym sukcesie DOW (B4), licznik miast z **OBU** funnel-i (`applyCityCaptureToMap`
**i** `resolveSiegeSurrender`), `cleanupIronForcedWarOnPeace` w `finalizePeaceTreatyBetween`,
save/load (4 pola w `meta`), sprzątanie przy eliminacji ownera i przy starcie nowej gry.
**K2 SPEŁNIONE.**

### K3 — wpięcie w `ai.ts` jako wczesny `return` POZA ogólnymi regułami

Blok Żelaza (`ai.ts:4196`) jest znak w znak tym samym kształtem co Brąz (4150) i Kamień (4171),
stoi **za nimi i przed** `const p: DiplomacjaParams = {...}`, czyli przed ogólnymi regułami
wojny — dokładnie jak żąda ECHO właściciela. Komplet czterech guardów po stronie celu
(`stanWojny` / `peaceLocked` / `hasNapTreaty` / `hasAllianceTreaty`) jest zachowany.
**K3 SPEŁNIONE.**

### K4 — pomiar PRZED/PO w rozgrywce — MOJĄ WŁASNĄ METODĄ

Nie powtarzałem harnessu Operatora. Napisałem własny
(`gra/tools/ev-zelazo-pomiar.vite.config.ts` + `ev-zelazo-pomiar.cjs` + `ev-zelazo-analiza.cjs`),
który różni się od jego harnessu w **czterech** miejscach:

| element | Operator | **Evaluator (ja)** |
|---|---|---|
| dźwignia dojścia do Żelaza | podniesienie `ownerStartEraByOwner` do 3 | **nadanie PRAWDZIWYCH BADAŃ**: wszystkie technologie z `data.tech` → `aiResearchDone`, cuda wyłączne (E) epok 1 i 2 → `completedWorldWonders`; awans liczy PRAWDZIWY `computeMainCivEraFromResearch` swoją pętlą `while` |
| odblokowanie Z1/Z5 | łatka **źródła** (gałąź `startCityState`, podmiana `dipLayer`) | **poziom STANU GRY**, bez tykania tych mechanizmów: kasowanie `startCityState` na miastach ownerów niebędących MP + dodanie ownerów do `diplomaticallyDiscoveredOwners` (jakby gracz ich odkrył) |
| rejestrator wypowiedzeń | tylko wypowiedzenia Żelaza (hak w bloku Żelaza) | **KAŻDE `wypowiedz_wojne` w grze** (kotwica na `chargeWarDeclarationCredibility`) z polem `powod` z `ai.ts` — filtrowanie po mechanizmie dopiero w analizie |
| rejestrator wyzwalacza | brak | **`prev`/`next` per (tura, owner)** prosto z `syncOwnerEraFromResearch` + czy uzbroiło rejestr |
| ziarna | 111 / 222 / 333 | **4001 / 4002 / 4003** |

Ścieżka pomiaru ta sama co u Operatora, bo innej sensownej nie ma: prawdziwa pętla tury
(`doStartGame` + `triggerPlayerEndTurn`) w żywym Chromium na artefakcie `vite build`,
instrumentacja **wyłącznie w pamięci** (brak kotwicy = twardy błąd buildu), `gra/src/**`
nietknięte (`git status` czysty po pomiarze).

**Wyniki (moje ziarna, mój harness, 11 tur na ziarno, dźwignia badań w turze 6):**

| przebieg | ziarno | awans epoki (dźwignia badań) | `ironPending` po awansie | wypowiedzenia wymuszonej wojny Żelaza |
|---|---|---|---|---|
| **PO** (`5532f3f1`) | 4001 | wszystkie 6 majorów **1 → 3** | `[1,8,15,22,29,36]` | **5**: T7 AI1→AI36, AI8→AI1, AI15→AI1, AI22→AI36, AI29→AI36 |
| **PO** | 4002 | wszystkie 6 majorów **1 → 3** | `[1,8,15,22,29,36]` | **4**: T7 AI1→AI15, AI8→AI15, AI22→AI36, AI29→AI36 |
| **PO** | 4003 | wszystkie 6 majorów **1 → 3** | `[1,8,15,22,29,36]` | **4**: T7 AI1→AI22, AI8→AI29, AI15→AI1, AI36→AI8 |
| **PRZED** (`origin/main`) | 4001 | wszystkie 6 majorów **1 → 3** | **`[]`** | **0** |
| **PRZED** (`origin/main`) | 4002 | wszystkie 6 majorów **1 → 3** | **`[]`** | **0** |

**13 wypowiedzeń PO (5+4+4) vs 0 PRZED** przy identycznych ziarnach, identycznej dźwigni
i identycznym odblokowaniu — jedyną różnicą jest obecność mechanizmu.

Trzy rzeczy, które mój rejestrator pokazuje mocniej niż rejestrator Operatora:

1. **Atrybucja bez luk.** Rejestruję KAŻDE `wypowiedz_wojne` w grze, nie tylko wypowiedzenia
   Żelaza. W każdym z 3 przebiegów PO liczba wszystkich wypowiedzeń = liczba wypowiedzeń
   Żelaza, **`wypowiedzenInne = 0`**. Nie ma więc żadnej wątpliwości, że wojny pochodzą
   z nowego mechanizmu, a nie z Kamienia, Brązu czy ogólnych reguł.
2. **Wszystkie 13 wypowiedzeń** ma `epokaNapastnika = 3` i `epokaCelu = 3`, warstwa `full`,
   i wszystkie padają w turze **bezpośrednio po** awansie (T7 po dźwigni w T6) — czyli
   „w najbliższej możliwej turze", jak dopuszcza K4 dispatchu.
3. **Reszta majorów zachowuje `pending`.** W każdym ziarnie 1–2 cywilizacje nie wypowiadają
   wojny, bo w tej samej turze stały się OBROŃCAMI (`alreadyAtWarAnyRole`) — i zostają
   w `ironForceWarPendingOwners`. To zachowanie B4 przeniesione z Brązu, widoczne wprost.

**Kluczowa obserwacja (rozstrzyga notę (d) Operatora):** przy dojściu do Żelaza prawdziwymi
badaniami `computeMainCivEraFromResearch` przenosi cywilizację **1 → 3 w jednej
synchronizacji** — bo w tej samej chwili spełnia warunki awansu epoki 1 i epoki 2. W moim
przebiegu **6/6 wejść do Żelaza miało `prev = 1`**. Sztywny wyzwalacz `prev === 2 &&
next === 3` **nie uzbroiłby ANI JEDNEJ cywilizacji**. Decyzja Operatora nie jest kosmetyką —
jest warunkiem działania mechanizmu.

**Zaliczam K4 z notą Operatora (b) podtrzymaną:** ani jego, ani mój pomiar nie pokazuje
cywilizacji dochodzącej do Żelaza własnym tempem badań (to pomiar wielogodzinny) — obie
dźwignie są akceleratorami. Moja dźwignia idzie jednak przez PRAWDZIWĄ bramkę awansu
(technologie + cud E), więc jest bliżej naturalnego przebiegu niż podniesienie epoki
startowej. **BRAK DOWODU (§13a) na przebieg w naturalnym tempie — podtrzymuję.**

### K5 — miasta-państwa i gracz nigdy celem ani napastnikiem

Sprawdziłem to **trzema niezależnymi ścieżkami**:

1. **Strukturalnie (czytanie kodu).** Napastnik przechodzi przez `ownerId > 0 &&
   !typCityCopyOwners.has(ownerId) && !isBarbarian(ownerId) && !eliminatedOwners.has(ownerId)
   && !isOwnerClusterCityState(ownerId, ownerCityStateOpts())`. Pula celów przez ten sam
   komplet z `oid` zamiast `ownerId`. `ironForceWarTargetId` jest deklarowany `let` WEWNĄTRZ
   iteracji po ownerze, więc nie przecieka między ownerami. `pickIronForcedWarTargetId`
   zwraca `ownerId` z puli albo `null` — nigdy `0`, więc gracz nie może stać się celem nawet
   przez pomyłkę w `ai.ts`.
2. **Empirycznie, moim rejestratorem.** Mój rejestrator notuje **KAŻDE** wypowiedzenie wojny
   w grze (nie tylko Żelaza) razem z klasyfikacją obu stron **w chwili wypowiedzenia** oraz
   pełną pulę kandydatów. Wyniki dla 3 ziaren PO (13 wypowiedzeń, 13 rekordów puli):
   - **unia wszystkich kandydatów = dokładnie `[1, 8, 15, 22, 29, 36]`** w KAŻDYM z 3 ziaren —
     6 głównych cywilizacji AI i nikt więcej. `aiOwnerList` w tych samych rekordach ma
     ~42 ownerów (majorzy + 6 kopii typu 43–48 + miasta-państwa klastra) — filtr odcina
     resztę, zanim wybór celu w ogóle się zacznie;
   - **gracz (`ownerId 0`) ani razu w puli**, ani razu jako cel, ani razu jako napastnik;
   - **żadna kopia typu (`typCityCopyOwners`) ani miasto-państwo (`simplifiedDiplomacyOwners`)
     ani razu w puli**, ani jako strona wypowiedzenia;
   - **żaden barbarzyńca** (`ownerId -1`) — wojny barbarzyńskie w zrzutach istnieją, ale
     **ani jedna nie jest wypowiedzeniem wymuszonym Żelaza** (rejestrator notuje wszystkie);
   - **`naruszeniaK5: []` we wszystkich 5 moich przebiegach** (3× PO, 2× PRZED).
3. **Przeliczyłem dowody Operatora od zera** własnym skryptem, nie ufając jego `summary.json`:
   PO 3+4+5 = 12 wypowiedzeń Żelaza, PRZED 0, STOCK 0; unia kandydatów w każdym z 3 ziaren
   PO = dokładnie `[1, 8, 15, 22, 29, 36]`; unia napastników `[1,8,15,22,29,36]`, unia celów
   `[1,8,15,29,36]`. **Liczby Operatora reprodukują się co do sztuki.**

**K5 SPEŁNIONE.**

### K6 — dowód nietautologiczny

Uruchomiłem **własną ręką** `gra/tools/forced-war-iron-mutant-probe.cjs`:

```
kontrakt czysty: 46/46 asercji zaczerwienionych
bramka main/ai:  29/29 asercji zaczerwienionych
62 mutacje, 0 mutacji bez efektu
Źródła przywrócone bajt w bajt.   exit 0
```
`git status` po sondzie: czysty (poza moimi własnymi, nowymi plikami `tools/ev-zelazo-*`).
Mutacja **M05** (wyzwalacz sztywno `prev===2 && next===3`) czerwieni asercję
„skok Kamień(1) → Żelazo(3) też wyzwala" — czyli dokładnie ten warunek, który mój pomiar
w rozgrywce pokazał jako konieczny. **K6 SPEŁNIONE.**

Uwaga o charakterze dowodu (nie blokująca): `forced-war-iron-main-guard-test.cjs` to bramka
**tekstowa** nad źródłem `main.ts`/`ai.ts` — taka sama, jaką mają Kamień i Brąz, i z tego
samego powodu (`main.ts` nie da się zbundlować w teście jednostkowym). Sama w sobie nie jest
dowodem zachowania w rozgrywce; tę rolę pełni pomiar z §K4.

### K7 — pięć bramek referencyjnych + `tsc`

Wszystko uruchomione własnoręcznie z `gra/` w moim worktree:

| bramka | wynik |
|---|---|
| `node tools/logic-test.cjs` | **LOGIC OK (213/213)** |
| `node tools/tech-tree-test.cjs` | **19 pass, 0 fail** |
| `node tools/research-test.cjs` | **33/33, ALL GREEN** |
| `node tools/unit-replace-test.cjs` | **13/13** |
| `node tools/combat-test.cjs` | **6/6** |
| `node ./node_modules/typescript/bin/tsc --noEmit` | **0 błędów (exit 0)** |
| `node ./node_modules/vite/bin/vite.js build --outDir /tmp/civ-dist-zelazo-wojna-ev --emptyOutDir` | **✓ built in 18.08s**, 37 422 kB |

**K7 SPEŁNIONE.**

### K8 — Kamień i Brąz naprawdę nie ucierpiały

| bramka | wynik (mój przebieg) |
|---|---|
| `forced-war-stone-test.cjs` | **32/32** |
| `forced-war-stone-main-guard-test.cjs` | **18 PASS, 0 FAIL** |
| `forced-war-bronze-test.cjs` | **44/44, ALL GREEN** |
| `forced-war-bronze-main-guard-test.cjs` | **25 PASS, 0 FAIL** |
| `forced-war-iron-test.cjs` (nowa) | **46/46** |
| `forced-war-iron-main-guard-test.cjs` (nowa) | **29 PASS, 0 FAIL** |

Ale bramki to za mało — prześledziłem **każdy** punkt, w którym kod Żelaza dotyka wspólnej
ścieżki, i sprawdziłem, czy może zmienić zachowanie tamtych dwóch:

- `finalizePeaceTreatyBetween` — dodane `cleanupIronForcedWarOnPeace(...)` jest **no-op**,
  gdy dla tej pary nie ma aktywnej wojny Żelaza (`if (!ironSt) return;`).
- oba funnel-e przejęcia miasta — dodane `maybeResolveIronForcedWarOnCityCapture(...)`
  wychodzi natychmiast, gdy para nie jest parą Żelaza.
- `decideAIDiplomacy` — blok Żelaza stoi **za** blokami Brązu i Kamienia, więc jest
  nieosiągalny, kiedy któryś z nich zwrócił komendę.
- handler `wypowiedz_wojne` — dodany guard sojuszu Żelaza (`continue`) odpala tylko przy
  `targetId === ironForceWarTargetId`, a Żelazo i tak nie wybiera sojusznika (jest w
  `ironBlockedOwnerIds`); guard Kamienia stoi zresztą przed nim.
- `syncOwnerEraFromResearch` — wyzwalacz Brązu (`prev === 1 && next === 2`) nietknięty.

Do tego twarda liczba: **`ai.ts` +38/−0, `main.ts` +244/−0 — zero usunięć, zero modyfikacji
istniejących linii.** **K8 SPEŁNIONE.**

---

## 3. Werdykt w sprawie świadomej różnicy Operatora (nota (d))

**AKCEPTUJĘ `isIronEraEntry(prev, next) = (prev < 3 && next >= 3)`. Nie żądam zmiany na
sztywne `prev === 2 && next === 3`.** Uzasadnienie:

1. Dispatch w §GOAL i §PARAMETR wiąże **wyzwalacz** („awans do epoki Żelaza") i **trzy
   liczby**, a nie formę porównania; K2 wprost zabrania mechanicznego kopiowania
   („**NIE kopiuj mechanicznie** … potem zrób to samo dla Żelaza").
2. Warunek jest **ścisłym nadzbiorem** `2→3` i nie może odpalić fałszywie: epoka nigdy nie
   maleje, `next >= 3` przy `prev < 3` to zawsze faktyczne wejście.
3. **Mój pomiar pokazuje, że wariant sztywny byłby błędem**: przy awansie z prawdziwych badań
   6/6 wejść miało `prev = 1`, więc `prev === 2 && next === 3` uzbroiłby 0 cywilizacji.
4. Mutacja M05 sondy dowodzi, że bramka tę różnicę pilnuje (asercja czerwieni się przy
   sztywnym wariancie), więc nie jest to nieudokumentowany dryf.

---

## 4. Noty i obserwacje (żadna nie blokuje)

**Podtrzymuję noty Operatora (a), (b), (c), (e), (f)** — sprawdziłem każdą i wszystkie są
prawdziwe:

- **(a) BRAK DOWODU §13a** — auto-pokój po 2 miastach, 20 tur odpoczynku i 20 tur cooldownu
  **nie zostały zaobserwowane w rozgrywce** ani przez Operatora (12 tur), ani przeze mnie
  (11 tur). Pokryte wyłącznie jednostkowo + bramką tekstową. Zgodnie z §13a **zielona bramka
  nie jest dowodem zachowania w rozgrywce** — to zostaje otwarte.
- **(b) BRAK DOWODU §13a** — naturalne tempo dojścia do Żelaza nie zmierzone (obie metody
  używają akceleratora; moja idzie przez prawdziwą bramkę badań, ale to wciąż akcelerator).
- **(c)** — **potwierdzam samodzielnie, i moja liczba jest jeszcze ostrzejsza od jego.**
  Puściłem osobny przebieg **STOCK** (mój kod, ziarno 4001, ta sama dźwignia badań, ale
  **bez żadnego odblokowania Z1/Z5**):

  ```
  wejść do epoki Żelaza:                6 / 6   (wszystkie prev=1 -> next=3)
  uzbrojonych (ironForceWarPendingOwners):  1   <-- 5 z 6 majorów było w chwili awansu
                                                    isOwnerClusterCityState === true  (Z1)
  pula kandydatów jedynego uzbrojonego (AI8), tura 7:   []   <-- pozostali majorzy
                                                    odfiltrowani jako „miasta-państwa" (Z1)
  wypowiedzeń wojny w CAŁEJ grze:       0
  ironForceWarPendingOwners na koniec:  [8]  (nigdy nieskonsumowane)
  ```
  Czyli w niezmodyfikowanej grze mechanizm jest **zablokowany podwójnie**: Z1 opróżnia
  zarówno wyzwalacz, jak i pulę celów, a nawet gdyby cel się znalazł, Z5 (`pre_contact`)
  skasowałby komendę. Wniosek Operatora dla właściciela jest prawdziwy: **samo dołożenie
  trzeciej epoki NIE sprawi, że w normalnej grze pojawią się wojny między cywilizacjami.**
  Obie wady są poza allowlistą tego tematu i słusznie nietknięte.
- **(e)** — potwierdzam czytaniem kodu: `main.ts` przy starcie nowej gry czyści rejestry
  Kamienia (4 `.clear()`) i Żelaza (4 `.clear()`), **ale NIE Brązu**. To luka Brązu, poza
  allowlistą tego tematu — Operator słusznie jej nie tknął. **Do osobnego zgłoszenia.**
- **(f)** — usunięcie meta-asercji „usunięcie haka jest wykrywalne" jest słuszne: takiej
  asercji nie da się zaczerwienić żadną mutacją źródła, więc byłaby tautologią.

**Moje dwie własne obserwacje (nowe, nie z raportu Operatora):**

- **O1 — higiena dowodów.** Zrzuty `PO-seed-*.json`, `PRZED-seed-*.json` i `STOCK-seed-111.json`
  **nie zapisują, które flagi środowiska buildu były aktywne** (`ZELAZO_BASELINE`,
  `ZELAZO_SCEN_CS`, `ZELAZO_SCEN_LAYER`). Rozróżnienie „PO = z odblokowaniami Z1/Z5"
  vs „STOCK = bez" żyje wyłącznie w nazwie pliku i w prozie §5 raportu. Sam raport jest pod
  tym względem uczciwy i jednoznaczny, więc to **nie jest blokada** — ale czytelnik samych
  artefaktów mógłby wziąć liczby PO za pomiar niezmodyfikowanej gry. Moje zrzuty zapisują
  pola `baseline` i `unblock` wprost w JSON-ie. **Do rozważenia przy kolejnych pomiarach.**
- **O2 — wzorzec odziedziczony po Kamieniu/Brązie (NIE regresja tego tematu).** Księgowanie
  w handlerze `wypowiedz_wojne` ma kształt `if (xForceWarTargetId != null && targetId ===
  xForceWarTargetId) { ... }` — osobno dla Brązu, Kamienia i Żelaza. Jeśli w jednej turze dla
  TEGO SAMEGO ownera dwa mechanizmy wybiorą TEN SAM cel (a wybierają deterministycznie
  „najbliższy, remis → niższy ownerId" z tej samej puli, więc wybiorą ten sam), to zaksięgują
  się **oba**: Żelazo dopisze aktywną parę i `cycleOwners` dla wojny, którą wypowiedział Brąz.
  Zasięg jest wąski (wymaga równoczesnego `pending` obu mechanizmów dla jednego ownera), a
  **kształt jest dokładnie ten sam, który Kamień i Brąz mają dziś między sobą** — Żelazo
  wiernie odtwarza istniejący wzorzec, nie wprowadza nowego. Zgłaszam jako obserwację do
  ewentualnego osobnego tematu „ujednolicenie księgowania trzech wojen wymuszonych", **nie
  jako wadę tej paczki**.

---

## 5. Dowody Evaluatora

`dyspozycje/autobot/runs/R-EPOKA-ZELAZO-WYMUSZONA-WOJNA-Q1/dowody-ev/`

- `EV-PO-UNBLOCK-seed-{4001,4002,4003}.json` — pełne zrzuty mojego pomiaru PO
- `EV-PRZED-seed-{4001,4002}.json` — to samo na `origin/main` (bez mechanizmu), ten sam harness
- `EV-STOCK-seed-4001.json` — przebieg bez odblokowań Z1/Z5 (weryfikacja noty (c))
- `EV-analiza.json` — redukcja do liczb (`tools/ev-zelazo-analiza.cjs`)

Narzędzia: `gra/tools/ev-zelazo-pomiar.vite.config.ts`, `gra/tools/ev-zelazo-pomiar.cjs`,
`gra/tools/ev-zelazo-analiza.cjs`.

---

## KONTRAKT RAPORTU

```
STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-EPOKA-ZELAZO-WYMUSZONA-WOJNA-Q1
GOAL: wymuszona wojna epoki Żelaza (3. epoka) wzorem Brązu — wyzwalacz = awans do Żelaza,
      2 miasta / 20 tur odpoczynku / 20 tur cooldownu, miasta-państwa i gracz wyłączeni
ZMIANY/COMMIT: WERYFIKOWANY commit Operatora 5532f3f1 (gałąź
      autobot/R-EPOKA-ZELAZO-WYMUSZONA-WOJNA-Q1, baza origin/main 9015380b) —
      20 plików, WSZYSTKIE w allowliście, filtr odwrotny 0 plików, zero usunięć
      (ai.ts +38/-0, main.ts +244/-0), forced-war-common.ts nietknięty,
      dyspozycje/WERSJE.md nietknięty, git diff --check czysto.
      WŁASNY commit Evaluatora: 02-evaluator.md + dowody-ev/** (6 zrzutów) +
      gra/tools/ev-zelazo-pomiar.vite.config.ts + gra/tools/ev-zelazo-pomiar.cjs +
      gra/tools/ev-zelazo-analiza.cjs. Kod gry NIE zmieniany przez Evaluatora.
TESTY: (wszystkie uruchomione własnoręcznie w worktree /home/user/wt-ev-zelazo-wojna)
      logic 213/213 · tech-tree 19 pass/0 fail · research 33/33 · unit-replace 13/13 ·
      combat 6/6 · tsc --noEmit 0 błędów ·
      vite build --outDir /tmp/civ-dist-zelazo-wojna-ev ✓ 18.08s ·
      forced-war-stone 32/32 + stone-main-guard 18/0 (bez pogorszenia) ·
      forced-war-bronze 44/44 + bronze-main-guard 25/0 (bez pogorszenia) ·
      forced-war-iron 46/46 + iron-main-guard 29/0 ·
      sonda mutacyjna 62 mutacje: pokrycie 46/46 i 29/29, 0 mutacji bez efektu,
        źródła przywrócone bajt w bajt, exit 0 ·
      WŁASNY POMIAR (inna metoda niż Operator: dźwignia = PRAWDZIWE badania + cuda E,
        odblokowania Z1/Z5 na poziomie STANU gry, rejestrator KAŻDEGO wypowiedzenia
        wojny, ziarna 4001/4002/4003, 11 tur, żywe Chromium, gra/src nietknięte):
        PO  (5532f3f1): 13 wypowiedzeń Żelaza (5+4+4), wszystkie T7, epoka 3→3,
                        ironPending [1,8,15,22,29,36] w każdym ziarnie
        PRZED (origin/main, te same ziarna/dźwignia): 0 wypowiedzeń, ironPending []
        wypowiedzeń NIE-Żelaza w przebiegach PO: 0 (pełna atrybucja)
        K5: unia kandydatów = dokładnie [1,8,15,22,29,36] w każdym ziarnie;
            gracz/MP/kopie typu/barbarzyńcy 0 razy w puli, 0 razy stroną; naruszeń 0
        WYZWALACZ: 36/36 wejść do Żelaza (6 przebiegów: 3 PO + 2 PRZED + 1 STOCK) miało
            prev=1 -> next=3;
            sztywne prev===2 && next===3 uzbroiłoby 0 cywilizacji
      Dowody Operatora przeliczone od zera własnym skryptem — reprodukują się co do sztuki
        (PO 3+4+5=12, PRZED 0, STOCK 0, unia kandydatów = 6 majorów).
BLOKADY: brak. Kryteria końca 1–8: WSZYSTKIE SPEŁNIONE.
      WERDYKT w sprawie noty (d) Operatora: AKCEPTUJĘ wyzwalacz
        isIronEraEntry(prev,next) = (prev < 3 && next >= 3) zamiast sztywnego 2→3.
        Nie jest to kosmetyka — mój pomiar pokazuje, że przy awansie z prawdziwych badań
        skok idzie 1→3 i sztywna równość nie uzbroiłaby ŻADNEJ cywilizacji. Zgodne
        z §GOAL dispatchu („wyzwalacz = awans do Żelaza") i z K2 („NIE kopiuj mechanicznie").
      NOTY PODTRZYMANE (§13a, wszystkie sprawdzone):
        (a) BRAK DOWODU: auto-pokój po 2 miastach, 20 tur odpoczynku i 20 tur cooldownu
            NIE zaobserwowane w rozgrywce (Operator 12 tur, ja 11 tur — za mało na
            2 przejęcia miast); pokryte wyłącznie jednostkowo + bramką tekstową, co NIE
            jest dowodem zachowania w rozgrywce;
        (b) BRAK DOWODU: naturalne tempo dojścia do Żelaza nie zmierzone — obie metody
            używają akceleratora (moja idzie przez prawdziwą bramkę badań + cud E, więc
            jest bliżej naturalnej, ale wciąż to akcelerator);
        (c) POTWIERDZONE WŁASNYM PRZEBIEGIEM STOCK (ziarno 4001, bez odblokowań):
            6/6 wejść do Żelaza, uzbrojony 1 owner, jego pula kandydatów PUSTA,
            0 wypowiedzeń — w niezmodyfikowanej grze mechanizm Żelaza (jak Kamienia
            i Brązu) NIE odpala w ogóle przez Z1 (isOwnerClusterCityState po przejęciu
            miasta byłego miasta-państwa) i Z5 (pre_contact kasuje komendy AI↔AI).
            Obie wady poza allowlistą, słusznie nietknięte — osobne, otwarte wątki;
        (e) POTWIERDZONE: Brąz NIE czyści swoich 4 rejestrów przy starcie nowej gry
            (Kamień czyści, Żelazo czyści) — luka Brązu, poza zakresem, do zgłoszenia;
        (f) słuszne — usunięta meta-asercja była tautologiczna.
      OBSERWACJE WŁASNE EVALUATORA (żadna nie blokuje):
        O1 higiena dowodów — zrzuty pomiarowe Operatora nie zapisują, które flagi
           środowiska buildu (ZELAZO_BASELINE / SCEN_CS / SCEN_LAYER) były aktywne;
           rozróżnienie żyje tylko w nazwie pliku i w prozie §5 raportu (raport jest
           uczciwy, więc to nie blokada — do poprawy w kolejnych pomiarach);
        O2 wzorzec odziedziczony (NIE regresja tego tematu) — gdyby w jednej turze dla
           tego samego ownera dwa mechanizmy wybrały ten sam cel, zaksięgowałyby się oba;
           kształt jest identyczny z tym, który Kamień i Brąz mają dziś między sobą,
           więc Żelazo wiernie odtwarza istniejący wzorzec. Do osobnego tematu.
      WSPÓŁBIEŻNOŚĆ: origin/main przesunął się 9015380b → 127db163 (+63 linie w main.ts
        z innych tematów). git merge-tree gałęzi na nowy origin/main → 0 konfliktów.
RUNDY: 1/5
NASTĘPNY KROK: Final Control (Opus 5, effort high) — obowiązkowo git fetch + git log + SHA
      i potwierdzenie, że zmiany SĄ W COMMITACH.
DEPLOY/PUSH: NIE WYKONANO — wypchnięta wyłącznie gałąź tematu
      autobot/R-EPOKA-ZELAZO-WYMUSZONA-WOJNA-Q1. Brak pushu do main, brak integracji,
      brak deployu.
```
