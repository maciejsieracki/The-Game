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
