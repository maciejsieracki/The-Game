# 03 — FINAL CONTROL (runda 1)

STATUS: W TOKU
DOMAIN: GAME
TEMAT: R-ULEPSZENIA-OBOZ-LOWIECKI-TYLKO-LAS-Q1
MODEL+EFFORT: Opus 5, effort high
RUNDY: 1/5
Worktree FC: /home/user/wt-fc2-lowiecki (od 902ae764).

## 1. Stan gałęzi (weryfikacja po awarii workflow)

`git fetch` wykonany. `origin/autobot/R-ULEPSZENIA-OBOZ-LOWIECKI-TYLKO-LAS-Q1`:

| SHA | treść |
|---|---|
| 902ae764 | raport Evaluatora rundy 1 |
| 6d1a7533 | sonda Evaluatora |
| c2ebef6b | raport Evaluatora (szkielet) |
| 24ba11c4 | raport Operatora rundy 1 |
| c77f6cd2 | bramka na heksach z generateMap |
| 92392f43 | raport Operatora (szkielet) |
| 08972e1f | odzyskany harness AI 40 tur |
| bbc4ceed | bramka woła prawdziwy tooltip |
| 1ed473b9 | **zmiana merytoryczna** (obóz tylko na Las) |
| 0ad2c20a | dispatch (merge-base) |

Cała praca JEST w commitach — `git status` czysty, brak zmian niezacommitowanych.
Diff `0ad2c20a..902ae764`: 8 plików, w CAŁOŚCI w allowliście.
`main.ts`, `ai.ts`, `auto-improvements.ts` — POZA diffem (potwierdzone `git diff --stat`).
Próbny merge do `origin/main` (8d0eafac): `git merge-tree --write-tree` → tree
`1c03e1d0`, exit 0, **zero konfliktów**.

## 2. Własna inwentaryzacja — OD ZAPISU DO STANU, nie od nazwy ulepszenia

Nie szukałem punktów po kluczu `oboz_lowiecki`. Wziąłem **wszystkie miejsca, gdzie
ulepszenie w ogóle powstaje na heksie** — zapisy do jedynego magazynu warstw
(`placedImprovements`, main.ts:11067) i do `hex.ulepszenie`/`ext.ulepszenia`.
**8 zapisów `placedImprovements.set`:**

| # | linia | co to jest | konsultuje regułę terenu? |
|---|---|---|---|
| 1 | main.ts:11234 | `finalizeCityFounding` — miasto na heksie | **NIE**, ale filtruje przez `CITY_KEEP_IMPROVEMENT_KEYS`; `oboz_lowiecki` **nie należy** do zbioru → obóz i tak znika (macierz B). BEZPIECZNE |
| 2 | main.ts:11572 | `undoPendingBuildRequest` | tylko usuwa warstwy. BEZPIECZNE |
| 3 | main.ts:11758 | `commitBuildRequest` (gracz) | TAK — `computeImprovementBuildImpact` (nowy gate) |
| 4 | main.ts:11898 | `stripForestDependentImprovements` | **NIE — DZIURA (P7)** |
| 5 | main.ts:12014 | `restorePlacedImprovementsFromSave` | NIE, celowo (kryt. 6 — stare zapisy zostają) |
| 6 | main.ts:12062 | `seedDemoUlepszenia` (`?demo=ulepszenia`) | TAK incydentalnie — obóz tylko w gałęzi `n === Nakladka.Las`. Tryb pokazowy, nie rozgrywka |
| 7 | main.ts:27119 | automat ulepszeń gracza | TAK — `pickAutoImprovements` |
| 8 | main.ts:28921 | AI | TAK — ta sama `pickAutoImprovements` (ai.ts:1986) |

**Domknięcie od drugiej strony — nakładka.** Obóz może wyjść poza las także wtedy, gdy
nie rusza się ulepszenia, tylko **znika las pod nim**. Wypisałem WSZYSTKIE zapisy do
`.nakladka` w `src/`: generator (`gen-helpers.ts`, przed istnieniem ulepszeń — bez
znaczenia), `city-hex-clear.ts` (poz. 1 wyżej, bezpieczne), `inca-llama-seed.ts`,
`playtestMiastoEkonomia.ts` (harness) i **dokładnie 3 miejsca w rozgrywce**:
- `main.ts:11753` — `impact.removesForest` → **ścieżka MARTWA**: `removesForest`
  jest w `improvement-build.ts:365` zapisane na sztywno `const removesForest = false`.
  Zmierzone, nie założone. Nie jest dziurą.
- `main.ts:11910` — wyrąb gracza → woła `stripForestDependentImprovements`
- `main.ts:28905` — wyrąb AI → woła `stripForestDependentImprovements`

Czyli zbiór dziur jest **domknięty i wynosi dokładnie jeden punkt: P7**.
To potwierdza znalezisko Evaluatora i zarazem **ogranicza je od góry** — poza wyrębem
nie ma innej ścieżki. Operator tego punktu nie wymienił.

## 3. P7 — reprodukcja niezależna

`stripImprovementsWhenForestRemoved` (`improvement-build.ts:165`) to dosłownie:

```ts
export function stripImprovementsWhenForestRemoved(layers: readonly string[]): string[] {
  return [...layers];
}
```

Docstring obiecuje filtrowanie („odfiltruj ulepszenia zależne od nakładki Las"),
ciało nie filtruje nic. Co gorsza wołający (`main.ts:11896`) ma wczesny
`if (next.length === prev.length) return;` — więc przelot jest nie tylko pusty,
ale i **bez zapisu**.

Nie wołałem samej funkcji (to byłaby tautologia na cudzej asercji). Odtworzyłem
**dosłowną sekwencję z main.ts** (`hex.nakladka = Brak` → `strip` → wczesny return)
na heksach z `generateMap`, ziarna FC:

```
heksy Las poddane sekwencji wyrębu: 200; obóz ZOSTAŁ poza lasem na: 200/200
```

Nie jest to przypadek losowy ani zależny od ziarna — **100 %, deterministycznie**.
Skutek w normalnej rozgrywce: gracz (`main.ts:11908`) i AI (`:28906`) stawiają obóz
legalnie na lesie, wycinają las pod nim i zostaje obóz na `nakladka='brak'` —
czyli dokładnie to, czego GOAL zakazuje („nigdy poza lasem").

Kontrola przeciwna (żeby nie przecenić): na takim heksie **nowego** obozu już nie
postawisz — `computeImprovementBuildImpact` zwraca `null`. Dziura tworzy stan
nielegalny, ale nie otwiera swobodnego budowania. Sonda FC sekcja C: `[OK]`.

## 4. BALANS — czy obóz nie stał się martwy (własne ziarna FC)

To pytanie osobne od asercji: zielone testy przy niebudowalnym ulepszeniu byłyby
wynikiem GORSZYM niż stan wyjściowy.

| ziarno | pola lądu | DZIŚ `Las∨złoże` | **`tylko Las`** | `Las∧złoże` | las na wzgórzu | % lądu |
|---|---|---|---|---|---|---|
| 777 | 302 | 164 | 164 | 0 | 9 | 54,3 % |
| 4242 | 303 | 160 | 160 | 0 | 6 | 52,8 % |
| 90210 | 303 | 148 | 148 | 0 | 10 | 48,8 % |
| 5 | 303 | 151 | 151 | 0 | 8 | 49,8 % |
| 31415 | 305 | 146 | 145 | 0 | 14 | 47,5 % |
| **RAZEM** | **1516** | **769** | **768** | **0** | **47** | **50,7 %** |

**Liczba kwalifikujących się pól po zmianie: 768 na 5 mapach (50,7 % lądu).**
Obóz NIE jest martwy — zawężenie odbiera **1 pole z 769 (0,13 %)**. Balans jest
w porządku i to NIE jest powód do `DECISION_REQUIRED`.

Wariant `Las I złoże` = **0 pól**, potwierdzone niezależnie na moich ziarnach.
To zero **strukturalne, nie losowe**: `Nakladka` to JEDNO pole enuma, a `Las`
i `Zloze*` to wzajemnie wykluczające się warianty — koniunkcji nie da się spełnić
na żadnej mapie. Wariant `Las I złoże` nie jest więc realną opcją do wyboru,
tylko konstrukcją niemożliwą. `tylko Las` to jedyne wykonalne odczytanie zdania
właściciela „tylko w lesie", a 47 pól lasu na wzgórzu pokrywa kryt. 2.

## 5. Bramki (moja ręka, mój worktree)

| bramka | wynik |
|---|---|
| `tsc --noEmit` | **0 błędów** |
| logic | 213/213 |
| tech-tree | 19 pass / 0 fail |
| research | 33/33 |
| unit-replace | 13/13 |
| combat | 6/6 |
| auto-improvements (baseline) | 45 pass / 0 fail — **bez pogorszenia** |
| bramka tematu `oboz-lowiecki-las-test` | 71/71 |
| sonda Evaluatora | 87 pass / **1 fail** (F2 = P7) |
| **sonda FC `oboz-lowiecki-fc-balans`** | 4 pass / **1 fail** (B = P7) |

Nowy plik FC: `gra/tools/oboz-lowiecki-fc-balans.cjs` (allowlista `gra/tools/*`).

## 6. Werdykt

Zmiana merytoryczna (`1ed473b9`) jest **poprawna i kompletna w swoim zakresie**:
5 z 5 ścieżek tworzących obóz konsultuje regułę, tooltip zgadza się z silnikiem,
`galleryTerrainEligible` naprawia zgubiony las na wzgórzu, pułapka „p-LAS-kie"
obłożona asercją, balans zdrowy. Ale GOAL brzmi **„nigdy poza lasem"**, a ścieżka
wyrębu tę obietnicę łamie w zwykłej rozgrywce, deterministycznie, u gracza i u AI.
To nie jest nota — to niespełnione kryterium celu.

Naprawa mieści się w allowliście (`improvement-build.ts`), więc temat nie wymaga
poszerzenia zakresu, a jedynie rundy 2.

## 7. Mutacje — czy bramka tematu w ogóle czerwienieje (moja ręka)

Mutowałem KOPIĘ źródeł (`/tmp/fc-gra/src`, wstrzykiwaną przez `OBOZ_SRC_DIR`),
worktree nietknięty.

| mutacja | co cofnięto | bramka tematu |
|---|---|---|
| **M1** | TYLKO `createQualifier` → stara forma `Las ∨ złoże` | **71/71 zielona — 0 FAIL** |
| **M2** | TYLKO twarda blokada w `computeImprovementBuildImpact` | **63/8 — 8 FAIL** |

M2 dowodzi, że bramka **nie jest tautologiczna** — ma realną czułość.

M1 potwierdza „BRAK DOWODU" zgłoszony przez Evaluatora, ale **doprecyzowuję jego
przyczynę, bo zmienia to wagę zgłoszenia**. Sprawdziłem, czy to nie jest dziura
behawioralna: `canBuild` i `getQualifyingHexes` (podświetlenie trybu budowy,
`canPlaceAny` w panelu) wołają **wyłącznie** `qualifies` — bez własnego gate'u
commitu. Gdyby na tym kończył się łańcuch, regresja `createQualifier` podświetlałaby
gołe wzgórza jako budowalne. Ale `qualifies()` kończy się linią

```ts
// improvement-build.ts:848
if (!terrainOk) return false;
return computeImprovementBuildImpact(key, hex, existing) !== null;
```

— czyli panel i podświetlenie niosą twardy gate **tranzytywnie**. Oba gate'y stoją
SZEREGOWO w tej samej funkcji, więc każdy z osobna wystarcza.
**Wniosek: to luka w DOWODZIE, nie w zachowaniu.** Bramka nie potrafi zaświecić na
czerwono regresji samej linii `createQualifier` i tego się nie da naprawić inaczej
niż asercją na `terrainOk` przed gate'em commitu. Nota do rundy 2, nie blokada.

## 8. Trzeci, niezależny pomiar AI (ziarna FC, 40 tur)

| ziarno | PRZED (`0ad2c20a`) obóz/pastw. | PO (`902ae764`) obóz/pastw. |
|---|---|---|
| 777 | 32/18 | 32/18 |
| 90210 | 27/24 | 27/24 |
| **RAZEM** | **59/42** | **59/42** |

Trzecia niezależna reprodukcja, na ziarnach, których nie użyli ani Operator, ani
Evaluator: **PRZED = PO co do jednego pola**. Zawężenie terenu nie zmienia zachowania
AI. Skarga właściciela „zamiast owcy buduje obóz łowiecki" **pozostaje nierozwiązana**
(AI dalej stawia 59 obozów wobec 42 pastwisk) — i słusznie trafia do rejestru jako
osobny temat, bo `ai.ts` jest poza allowlistą.

Uboczny, ale istotny dowód balansu: AI stawia po zmianie **32 i 27 obozów na mapę**
przez 40 tur. Ulepszenie żyje.

## 9. Build

`node ./node_modules/vite/bin/vite.js build --outDir /tmp/civ-dist-fc --emptyOutDir`
→ exit 0, `✓ built in 31,15 s`. C-001 dotrzymane (bez `npm run build`/`dev`).

## 10. Higiena

`git status` czysty. Artefakty esbuilda (`gra/tools/.oboz-*`) objęte `.gitignore`;
własne śmieci diagnostyczne usunięte. `main.ts` i `ai.ts` NIE dotknięte przez FC
(potwierdzone `git status` + `git diff --stat`). Nie zbliżałem się do plików tematów
równoległych. `map-gen-regression-test` NIE uruchamiany. Zakaz `npx`, `git add -A`
i pushu do `main` dotrzymany — push wyłącznie na gałąź tematu.

## RAPORT TERMINALNY

STATUS: FAIL
DOMAIN: GAME
TEMAT: R-ULEPSZENIA-OBOZ-LOWIECKI-TYLKO-LAS-Q1
GOAL: Obóz łowiecki wyłącznie na nakładce Las (dowolny teren pod lasem, także wzgórze),
nigdy poza lasem — gracz, automat, AI jednakowo.
MODEL+EFFORT: Opus 5, effort high.
ZMIANY/COMMIT: gałąź `autobot/R-ULEPSZENIA-OBOZ-LOWIECKI-TYLKO-LAS-Q1`. FC dodał
`114370b7` (szkielet), `e70c378c` (raport + `gra/tools/oboz-lowiecki-fc-balans.cjs`)
i ten commit. `gra/src`, `gra/data` NIETKNIĘTE przeze mnie. Merge do `origin/main`
(8d0eafac) bezkonfliktowy (`merge-tree` → `1c03e1d0`, exit 0).
TESTY: tsc 0 · logic 213/213 · tech-tree 19/0 · research 33/33 · unit-replace 13/13 ·
combat 6/6 · auto-improvements 45/0 (bez pogorszenia) · bramka tematu 71/71 ·
sonda Evaluatora 87/1 · sonda FC 4/1 · vite build exit 0.
Mutacje FC: M1 0 FAIL (luka w dowodzie, wyjaśniona), M2 8 FAIL (bramka czuła).
BLOKADY:
1. **P7 — obóz zostaje po wyrębie lasu pod nim.** Reprodukcja własna,
   **200/200 heksów, deterministycznie**, ścieżka gracza i AI. Łamie GOAL
   („nigdy poza lasem") w zwykłej rozgrywce. `stripImprovementsWhenForestRemoved`
   (`improvement-build.ts:165`) to pusty przelot. Plik JEST w allowliście.
   Wybór naprawy = pytanie ABC (A: obóz znika przy wyrębie / B: wyrąb zablokowany
   pod obozem / C: zostaje, GOAL do przeformułowania).
2. Skarga „zamiast owcy buduje obóz" nierozwiązana — do rejestru, `ai.ts` poza allowlistą.
BALANS: **NIE jest blokadą.** 768 pól kwalifikujących się na 5 mapach (50,7 % lądu),
zawężenie kosztuje 1 pole z 769 (0,13 %). `DECISION_REQUIRED` Operatora na wariancie
**odpada**: `Las I złoże` = 0 to niemożliwość strukturalna (`Nakladka` = jedno pole
enuma), a nie ciasny wybór — `tylko Las` jest jedynym wykonalnym odczytaniem.
RUNDY: 1/5
NASTĘPNY KROK: Operator runda 2 — JEDNA poprawka merytoryczna (P7) + pytanie ABC
o wariant naprawy; dodatkowo asercja na `terrainOk` w `createQualifier` przed gate'em
commitu (domknięcie luki dowodowej M1). Reszta zweryfikowana trzykrotnie — nie przerabiać.
DEPLOY/PUSH: NIE WYKONANO
