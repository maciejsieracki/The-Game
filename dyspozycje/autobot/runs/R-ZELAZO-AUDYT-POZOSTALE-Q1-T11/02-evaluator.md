# 02 — EVALUATOR

```text
STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-ZELAZO-AUDYT-POZOSTALE-Q1-T11
GOAL: Niezależnie zweryfikować audyt Katapulty — każde kryterium sukcesu 1–7
      z dispatchu, każdą liczbę geometryczną odtworzoną WŁASNYM pomiarem
      (nie odczytaną z raportu Operatora), allowlistę, zero regresji,
      nietautologiczność macierzy ablacyjnej i PRAWDZIWOŚĆ KAŻDEGO ZDANIA
      w nowych komentarzach.
MODEL WYKONAWCY: Opus 5 (`claude-opus-5[1m]`) — odczytane ze środowiska sesji.
      Poziomu effort nie potrafię odczytać ze środowiska i go NIE potwierdzam.
ZMIANY/COMMIT: bez zmian w `gra/**`. Wyłącznie ten raport
      (`dyspozycje/autobot/runs/R-ZELAZO-AUDYT-POZOSTALE-Q1-T11/02-evaluator.md`).
TESTY: własny harness pomiarowy (Chromium + esbuild, niezależny od kodu testu
      Operatora), pomiar stanu PRZED na `88e2181f` i PO na `9176af07`,
      3 warianty mutacyjne pod weryfikację liczb z komentarzy, pełny przebieg
      T1–T10, 5 bramek referencyjnych, `tsc --noEmit`, `vite build` (C-001).
      Szczegóły w §1 i §6.
BLOKADY: brak.
RUNDY: 2/5.
NASTĘPNY KROK: Final Control — z listą mikro-poprawek U1–U4 i U6 (§4),
      wszystkie czysto tekstowe, żadna nie rusza geometrii ani asercji.
DEPLOY/PUSH: NIE WYKONANO.
```

---

## 1. Jak weryfikowałem — bez zaufania do liczb Operatora

Nie użyłem `zelazo-katapulta-real-render-test.cjs` jako źródła prawdy. Napisałem
własny harness (`/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/eval-measure.cjs`
+ `analyze.cjs`), który buduje własny bundel esbuild i mierzy w żywym Chromium:
OBB każdej bryły, SAT/szczeliny na pełnym skanie par, sylwetkę i piksele z kamery
gry (azymut 0, elewacja 52°). Ten sam harness puściłem na **`origin/main`
(88e2181f)** — czyli stan PRZED — żeby odtworzyć zastane defekty samodzielnie.
Osobny skrypt (`eval-claims.cjs`) przebudowuje `units.ts` z podmienionym
JEDNYM miejscem, żeby sprawdzić liczby, które Operator wpisał do komentarzy
jako „zmierzone".

Test Operatora uruchomiłem osobno, jako kontrolę: **22 pass / 0 fail**,
odtworzone u mnie 1:1, z pełną macierzą ablacyjną na wydruku.

## 2. Kryteria sukcesu 1–7 — werdykt punkt po punkcie

| # | Kryterium | Werdykt | Mój dowód |
|---|---|---|---|
| 1 | Model zmierzony | **SPEŁNIONE** | 48 mesh / 48 nazwanych / 17 kluczy `anchors`; PRZED: 11 mesh / 0 nazwanych / `anchors === null` |
| 2 | Typ machiny ustalony i geometria spójna | **SPEŁNIONE** | `units.json` „lob nad murem", `Atak dystansowy` 8, `Zasięg` 6 — sprawdzone w danych; `battleScene.ts:6745` dosłownie „sfera szara lecąca parabolą"; model ma dokładnie 1 ramię i `SphereGeometry` |
| 3 | Sekcja historyczna K-style ze źródłami | **SPEŁNIONE** (z uwagą U4) | Tabela Witruwiusza z K4 zweryfikowana w źródle — **wszystkie cztery cytowane liczby trafione**; Ammianus XXIII.4.4 (rama, liny przez otwory), haki i zwisająca proca, wór ze strzępami — potwierdzone |
| 4 | Real render + nietautologiczność per asercja | **SPEŁNIONE** | patrz §5 |
| 5 | Zero regresji T1–T10 + 5 bramek | **SPEŁNIONE** | patrz §6; sąsiedzi bit-identyczni |
| 6 | `tsc --noEmit` i `vite build` (C-001) | **SPEŁNIONE** | tsc 0 błędów; vite build czysty, 17.93 s, artefakt niesie części T11 |
| 7 | Wątpliwość historyczna rozstrzygnięta, nie odesłana | **SPEŁNIONE** | K2 zapisuje niezgodność chronologiczną wprost, z uzasadnieniem wyboru |

## 3. Stan PRZED — odtworzyłem defekty sam, na `88e2181f`

Nie przepisuję liczb Operatora; poniżej są **moje**, policzone niezależnie
(część także ręcznie z geometrii starego kodu, bez przeglądarki):

- **D1 potwierdzony, także rachunkiem na papierze.** `mArmM.rotation.x = ARM_ANGLE`
  daje zwrot osi `(0; cos(−1.05); sin(−1.05)) = (0; 0.4976; −0.8674)`, a położenie
  liczone jest z `Math.sin(-ARM_ANGLE) = +0.8674`. Końce ramienia wychodzą
  `(0; 0.58288; −0.12000)` i `(0; 0.35400; 0.27902)`, oś obrotu `(0; 0.354; −0.120)`.
  **Odległość osi od odcinka ramienia = 0.1990** (Operator: 0.1985), **= 43.3 %**
  długości `ARM_LEN` 0.460. Najbliższy koniec **0.22888** — co do czwartego miejsca
  zgodne z raportem. Błąd znakowy REALNY.
- **Stary komentarz `// ~-60° od poziomej` faktycznie fałszywy.**
  `atan(0.4976 / 0.8674) = 29.85°` od poziomu. Potwierdzam.
- **D2 potwierdzony co do cyfry.** Środek kubła **0.20722** od osi ramienia
  (Operator: 0.2072); szczelina powierzchni ramię↔kubeł **0.1508** — identycznie.
- **D4 potwierdzony.** Lewe koło: najmniejsza szczelina do CZEGOKOLWIEK = **0.0050**.
- **D5 potwierdzony.** Jedna bryła barwy właściciela, `x = +0.175`, brak lustra;
  szczelina do ramy **0.0375** (maksimum po osiach OBB) — zgadza się.
- **D7 potwierdzony.** Sylwetka stara **18 550 px / 209 px wysokości**; rodzina
  `wieza 20 396/217`, `taran 21 486/253`, `taran okuty 21 841/257`,
  `hastati 15 952/221`, `falanga 14 434/267`. **209 px to faktycznie najniższa
  wysokość z sześciu.** (Zastrzeżenie do sformułowania: patrz U11.)

## 4. ZNALEZISKA — nieprawdziwe i nieprecyzyjne zdania w NOWYCH komentarzach

Dispatch kazał szukać tego aktywnie, bo w T5–T10 to był powtarzalny wzorzec.
**Znalazłem go znowu — cztery razy w kodzie produkcyjnym i raz w nowym teście.**
Żadne z tych znalezisk nie psuje geometrii ani nie unieważnia asercji; wszystkie
są czysto tekstowe.

### U1 — FAŁSZYWA LICZBA w komentarzu produkcyjnym (`units.ts:3180`)

```
// BEZ przekroczenia promienia heksa (maxR 0.310 → 0.328; Taran okuty 0.372).
```

**Zmierzone dwiema niezależnymi metodami** (rogi bbox w świecie oraz rogi OBB
z kwaternionu): `Taran okuty maxR = 0.33144`, `Taran = 0.33954`,
`Wieża oblężnicza = 0.23691`. **Żadna machina nie ma 0.372.**
Liczby własne Katapulty są prawdziwe (0.30954 przy `U = HEX_R`, 0.32811 obecnie —
sprawdziłem przebudowując model z `U = 1.00 * HEX_R`), i **wniosek się broni**
(0.328 < 0.331 < 0.340). Fałszywa jest wyłącznie liczba odniesienia.
To dokładnie klasa T8/U2. Ta sama liczba jest w raporcie Operatora §5.

### U2 — ODWRÓCONA DIAGNOZA w komentarzu produkcyjnym (`units.ts:3213–3216`)

```
// Liczba segmentów podzielna przez 4 daje wierzchołek dokładnie w najniższym
// punkcie, więc spód koła wypada na y=0 co do zera, a nie 0.002 pod terenem
// (klasa błędu „stopy pod terenem" z T7/T8, tu w wydaniu kołowym).
```

Pierwsza połowa jest PRAWDZIWA i zmierzona: przy 16 segmentach najniższy
wierzchołek bandaża leży na `y = +3.17e-10`. Druga połowa jest **geometrycznie
niemożliwa**: wielokąt wpisany w okrąg nigdy nie wychodzi poza ten okrąg, więc
liczba segmentów niepodzielna przez 4 nie może zepchnąć koła POD teren.
Przebudowałem model z `14` segmentami i zmierzyłem: najniższy wierzchołek bandaża
**`y = +0.00178`, czyli 0.0018 NAD terenem — koło zaczyna wisieć, nie tonąć.**
Klasa błędu jest odwrotna do deklarowanej. Poprawka (16 segmentów) jest słuszna,
asercja H6 i mutacja M6 działają — błędne jest wyłącznie wyjaśnienie.
To samo odwrócone rozumowanie („`minY` wychodziło ujemne") jest w raporcie §6 pkt 2.

### U3 — DWA FAŁSZYWE CZŁONY + SPRZECZNOŚĆ WEWNĘTRZNA (`units.ts:3104`, K8)

```
 *     napięta między bębnem a hakiem na ramieniu, zapadka na zębatce założona,
```

**(a)** Lina kołowrotu NIE biegnie do haka. Biegnie do `kt-arm-winch-eye`
(`t = 0.240·U`, zmierzone `z = −0.1158`), a hak `kt-arm-hook` siedzi
`t = 0.310·U`, `z = −0.18359` — to dwa różne punkty i dwie różne role
(ucho = kołowrót, hak = proca). **`units.ts:3403` mówi poprawnie: „NAPIĘTA między
bębnem a UCHEM na ramieniu"** — K8 przeczy zarówno kodowi, jak i własnemu
komentarzowi lokalnemu.

**(b)** W modelu **nie ma żadnej zapadki**. `units.ts:3391–3394` twierdzi
DOKŁADNIE ODWROTNIE, i to jako świadomy argument źródłowy: „Ammianus XXIII.4.6
mówi o SWORZNIU (…) — **nie o zapadce**". K8 stwierdza to, czemu komentarz spustu
zaprzecza cztery ekrany niżej.

### U4 — ZDANIE ZA SZEROKIE (`units.ts:3061–3065`, K4)

```
 *     Model idzie za ZASADĄ, nie za liczbami: `MOD` niżej jest jedynym modułem,
 *     a średnica skrętu, grubość ramienia, przekrój belek i kamień są jego
 *     wielokrotnościami.
```

Z `MOD` liczą się: `SKEIN_R`, `ARM_R_ROOT`, `ARM_R_TIP`, `STONE_R` i `FRAME_HW`.
**„Przekrój belek" to nadużycie**: z `MOD` bierze się wyłącznie PÓŁSZEROKOŚĆ dwóch
podłużnic. Ich wysokość (`FRAME_H = 0.048·U`) i wszystkie pozostałe belki —
poprzeczki (`0.090·U`, `0.060·U`), stopa (`0.250×0.050·U`), stojaki skrętu
(`0.024/0.034·U`), słupy i belka zderzaka (`0.052×0.050·U`, `0.260×0.050×0.048·U`),
kozły kołowrotu (`0.048·U`) — liczą się z `U`. Nawet węższe zdanie przy definicji
`MOD` („przekrój podłużnicy liczy się z MOD", `units.ts:3160`) jest prawdziwe tylko
w połowie: szerokość tak, wysokość nie.

Uwaga: **liczby witruwiańskie w K4 są za to bezbłędne** — sprawdziłem tabelę
X.11.3 w źródle: kamień 2-funtowy → 5 palców, 10-funtowy → 8 palców,
100-funtowy → stopa i 1½ palca, 360-funtowy → stopa i 10 palców. Wszystkie cztery
cytowane pozycje trafione co do jednej.

### U5 — LICZBA NIEAKTUALNA (`units.ts:3174–3176`)

Komentarz: „miała przy `U = HEX_R` **17 315 pikseli** przy 215 px wysokości".
Przebudowałem model z `U = 1.00 * HEX_R` i zmierzyłem: **17 480 px przy 215 px**.
Wysokość trafiona co do piksela, pole rzutu rozjechane o 165 px (~1 %) — liczba
pochodzi sprzed którejś z późniejszych zmian (najpewniej sprzed usunięcia ściągów
i pogrubienia słupów zderzaka). Pozostałe liczby w tym samym komentarzu są
dokładne: pasmo rodziny 20 396–21 841 px i Hastati 15 952 zgadzają się co do jednego.

### U6 — FAŁSZYWA LISTA w NOWYM teście (`zelazo-katapulta-real-render-test.cjs`, komentarz H5)

```
// PRZED T11 unosily sie: kubel z kamieniem, obie „liny", oba kola (0.005 od ramy)
// i banderola (0.010).
```

Puściłem kryterium H5 (najmniejsza szczelina do JAKIEJKOLWIEK innej bryły
> `FLOAT_EPS`) na starym modelu. **Unoszą się dokładnie dwie bryły: ramię (0.1508)
i lewe koło (0.0050).** Kubeł dotyka kamienia, obie „liny" tkwią w belce podstawy,
a prawe koło i banderola stykają się ze sobą (0.0015). Wymienione części wiszą
względem tego, do czego MIAŁY być przymocowane — i to jest prawdziwy defekt — ale
nie względem kryterium, którego H5 faktycznie używa.

### U7 — liczba nie do odtworzenia + zdanie za mocne (raport §2 D3 i streszczenie)

Raport: „«Liny łączące oś ze skrzynią» nie sięgały tej osi o **0.1101** —
**obydwa końce w próżni**".

**(a)** 0.1101 nie odtwarza się. Mierzę szczelinę OBB lina↔poprzeczka osi
**≈ 0.098**, a odległość końca liny od powierzchni poprzeczki **= 0.134**.
**0.134 to liczba z komentarza H4 w teście tego samego Operatora** — raport i test
podają dwie różne wartości, a raportowa nie zgadza się z żadną z nich.
**(b)** „Obydwa końce w próżni" jest nieprawdą: dolny koniec liny
(`y ≈ 0.0876`) tkwi WEWNĄTRZ belki podstawy (`y` 0.064–0.104). W powietrzu wisi
tylko koniec górny. Meritum — że „liny" nie dosięgają osi, do której rzekomo
prowadzą — stoi.

### U8 — liczba nie do odtworzenia (raport §6 pkt 3)

„Teraz sworzeń tkwi w nim na **0.0140**". Mierzę
`SAT(kt-trigger-bolt, kt-windlass-block-left) = **0.02438**` (policzone też ręcznie
z wymiarów: `0.007·U + 0.047·U − 0.031·U = 0.023·U`). Kierunek dobry (tkwi głęboko,
nie na styk), liczba zła.

### U9 — liczniki w raporcie (§5, §9)

- **„anchors 14 kluczy" / „14 kotwic" — jest 17.** Zmierzone:
  `hexR, machineType, mod, pivot, armDir, armLen, armDeg, armTip, hook, winchEye,
  stopPad, frameTopY, frameBotY, wheelR, axleY, stoneR, skeinR`. 14 to długość
  listy `ANCHOR_KEYS` wymaganej przez H11, nie zawartość modelu.
- **Liczniki regresji w §9 są zaniżone dokładnie o liczbę asercji (G)** w każdym
  teście — czyli testy uruchomiono z `--skip-vite`, czego raport nie mówi.
  Moje pełne przebiegi: mezopotamia 72, śródziemnomorze 83, super-rzym-grecja 92,
  germanie 80, falanga 40, celtowie 42, jeździec 57, konnica 31 — wszystkie 0 fail.
  Meritum („zero regresji") niezmienione.

### U10 — nazwa myląca (drobiazg)

`kt-windlass-ratchet` to zwykły `CylinderGeometry` bez zębów, a komentarz przy nim
nazywa go „tarczą" i **jawnie odrzuca** zapadkę. Nazwa mesh mówi „ratchet" —
niespójnie z całym argumentem K8/spustu.

### U11 — sformułowanie dwuznaczne (raport D7)

„18 550 px / 209 px wysokości — NAJNIŻSZY z sześciu mierzonych modeli". Prawda dla
WYSOKOŚCI (209 < 217 < 221 < 253 < 257 < 267). **Nieprawda dla pola rzutu**:
Hastati 15 952 i Falanga 14 434 są mniejsze od 18 550. Nawias rozstrzyga intencję,
ale samo zdanie jest dwuznaczne.

---

## 5. Test i macierz ablacyjna — sprawdzone ręcznie

Uruchomiłem i przeczytałem całą macierz. Kierunek gwarancji jest **per-H**:
każda z H1–H15 ma co najmniej jedną mutację, która ją czerwieni.

**Odpowiedź na pytanie z dispatchu „czy KAŻDA mutacja czerwieni TYLKO swoją
asercję": NIE, i to jest w porządku.** Rozlewają się: `M1 → {H1, H4, H15}`,
`M3 → {H3, H7}`, `M8 → {H7, H8}`, `M11 → {H1, H11}`, `M12 → prawie wszystko`.
Pozostałe dziesięć trafia punktowo. Kluczowe:

- **M0 pilnuje mechanicznie**, że każda mutacja podmienia dokładnie jedno miejsce
  (`applied === 1`), i przerywa przebieg, jeśli kod się przesunął.
- **Macierz jest drukowana w całości, nic nie jest ukryte.**
- **Nagłówek testu mówi to wprost** (linie 42–46): „Nie znaczy to, ze kazda mutacja
  czerwieni WYLACZNIE jedna asercje". To jest **nauczka z T8/U3 odrobiona** —
  tam Final Control musiał przepisać nagłówek, bo twierdził „DOKŁADNIE swoją".
  Tu Operator napisał od razu prawdę. **Bez zastrzeżeń.**
- Rozlewanie się jest merytorycznie uzasadnione: M1 rusza `onArm()`, z którego
  liczą się i ramię, i ucho liny, i wierzchołek — H4 i H15 MUSZĄ zareagować.
  M12 podmienia cały model, więc czerwienienie wszystkiego jest poprawne.

Sekcja (G) sprawdziłem osobno na własnym artefakcie `vite build`: `kt-skein-bundle`,
`kt-arm-winch-eye`, `kt-trigger-bolt`, `kt-owner-panel-`, `machineType`, `winchEye`,
`skeinR` — obecne; `kt-arm-second` — **0 wystąpień**. G3 nie jest tautologią:
kotwice `anchors` faktycznie nie istnieją w repo poza `buildCatapult()` po T11.

## 6. Zero regresji i bramki — moje własne przebiegi

```
zelazo-gate-test                              24/24
zelazo-mezopotamia-real-render-test           72 pass / 0 fail
zelazo-srodziemnomorze-real-render-test       83 pass / 0 fail
zelazo-super-rzym-grecja-real-render-test     92 pass / 0 fail
zelazo-germanie-real-render-test              80 pass / 0 fail
zelazo-falanga-real-render-test               40 pass / 0 fail
zelazo-celtowie-soldurii-gaesatae-...         42 pass / 0 fail
zelazo-jezdziec-oszczepami-real-render-test   57 pass / 0 fail
zelazo-konnica-asyryjska-real-render-test     31 pass / 0 fail
_tmp-siege-test                               11/11
zelazo-katapulta-real-render-test (T11)       22 pass / 0 fail
--- 5 bramek referencyjnych ---
logic-test 213/213 | tech-tree-test 19/19 | research-test 33/33 ALL GREEN
unit-replace-test 13/13 | combat-test 6/6
--- §6 ---
tsc --noEmit: 0 błędów
vite build (C-001, binarka z node_modules, --outDir poza repo): czysty, 17.93 s
```

**`unit-power-test` 4 pass / 2 fail — POTWIERDZAM jako pre-istniejący.**
Uruchomiłem ten sam test na **czystym `88e2181f`** (worktree `main`): identyczne
4/2, identyczne dwa komunikaty (`Hastati M_pole=50 (got 57.5)`,
`sumArmyFieldPower 3 units (got 167.5)`). Nie jest to regresja T11. Warto
odnotować, że trzy asercje dotyczące **Katapulty** w tym teście są ZIELONE.

**Sąsiedzi nietknięci — zmierzone na obu commitach, bit w bit:**

| model | mesh (main → T11) | H | maxR |
|---|---|---|---|
| Taran | 85 → 85 | 0.61000 → 0.61000 | 0.33954 → 0.33954 |
| Taran okuty | 102 → 102 | 0.64100 → 0.64100 | 0.33144 → 0.33144 |
| Wieża oblężnicza | 46 → 46 | 0.74500 → 0.74500 | 0.23691 → 0.23691 |
| Hastati | 92 → 92 | 0.82200 → 0.82200 | 0.42007 → 0.42007 |
| Falanga | 27 → 27 | 0.72689 → 0.72689 | 0.61221 → 0.61221 |

## 7. Allowlista — RESPEKTOWANA, sprawdzone hunk po hunku

`git diff origin/main..autobot/ZELAZO-AUDYT-T11-Q1 --stat` → 3 pliki,
+1625/−83. `git diff -U0` daje 9 hunków:

- `+1435,7` — komentarz nad linią dispatchu; **sama linia dispatchu bez zmian**
  (hunk jest czysto dodający, `-1434,0`). Allowlista dopuszcza „linię dispatchu".
- `-3015,2 / +3022,98` — stary dwuwierszowy JSDoc Katapulty zamieniony na
  nagłówek K1–K9. **Nie dotyka `buildBatteringRam`** (kończy się w starym pliku
  na 3012).
- Siedem pozostałych hunków: nowe linie **3130–3447**, wszystkie wewnątrz
  `buildCatapult()` (funkcja 3121 → przed `buildSiegeTower` na 3458).

Kontrole granic:
- `gra/data/**` — **bez zmian** (`git diff --name-only`: tylko `units.ts`,
  nowy test, raport Operatora).
- `WERSJE.md` — **nietknięty** (zakaz przed deployem).
- `git diff --check` — **czysto**.
- Gałąź **NIE jest na `origin`** (`git ls-remote --heads origin | grep T11` → 0).
- Worktree czysty, brak plików roboczych po teście.
- Brak `npm run build` / `dev` — vite uruchomiony binarką z `node_modules`
  przez `node`, `--outDir` poza drzewem repo (C-001). Potwierdzam też u siebie.

## 8. Zgłoszenia Z1 i Z2 — potwierdzone, słusznie nietknięte

- **Z1 PRAWDZIWE i zmierzone przeze mnie.** `manualBattle.ts:750` woła
  `buildUnitModel(bu.kategoria, bu.ownerColor)` bez nazwy. Mój pomiar:
  `buildUnitModel('katapulta', color)` **bez nazwy → 87 mesh**, z nazwą → 48.
  87 to model generyczny. Defekt jest realny; `manualBattle.ts`
  i `buildCategoryModel()` są POZA allowlistą T11 — Operator postąpił poprawnie,
  nie ruszając ich. **Rekomenduję otwarcie osobnego tematu.**
- **Z2 PRAWDZIWE i dziś bez skutku.** `battleScene.ts:6625` (`onager`, `balist`),
  `testBattle.ts:426` (`onager`), `units/setup.ts:282` (`trebuchet`) — wszystkie
  trzy potwierdzone grepem. W `units.json` **zero wierszy** z rdzeniem
  `onager`/`balist`/`trebuchet` — sprawdziłem sam. Decyzja Operatora, żeby NIE
  dodawać aliasów pod nieistniejące jednostki, jest zgodna z §10.

## 9. Co Operator zrobił dobrze — warto to zapisać

- **Znalazł trzy defekty własnej pracy pomiarem, nie czytaniem** (zerowa lina,
  koło poza terenem, sworzeń na styk) i zgłosił je zamiast schować. Wszystkie trzy
  potwierdziłem jako realne przez odtworzenie mutacjami.
- **Usunął martwą geometrię (ściągi głowicy) na podstawie pomiaru pikseli, nie
  gustu**, i zapisał powód w kodzie, żeby nikt tego nie „naprawił" z powrotem.
- **K2 nie zamiata niezgodności chronologicznej.** Onager rzeczywiście jest machiną
  późną, i to jest w komentarzu napisane wprost, razem z uzasadnieniem wyboru.
- **Nagłówek macierzy ablacyjnej mówi prawdę o kierunku gwarancji** — dokładnie ta
  lekcja, którą Final Control musiał wymuszać w T8.
- **Dwie decyzje rekonstrukcyjne nazwane po imieniu** (wór na belce zamiast na
  darni; 24° zamiast „niemal płasko") zamiast przemycone jako cytat ze źródła.

## 10. Werdykt i rekomendacja

**STATUS: PASS-WITH-NOTES.**

Inżynieria jest solidna i sprawdza się pod niezależnym pomiarem: defekty D1–D7 były
realne (odtworzyłem je co do czwartego miejsca po przecinku), naprawa jest realna
(łańcuch mechaniczny domyka się, zero brył wiszących nawet przy dziesięciokrotnie
ostrzejszym progu 0.0005), allowlista jest respektowana co do hunka, regresji nie ma
żadnej, wszystkie bramki są zielone, a dowód nietautologiczności jest uczciwy
i sprawdzony ręcznie.

**Nie daję czystego PASS z jednego powodu: w NOWYCH komentarzach produkcyjnych
są cztery zdania nieprawdziwe albo za szerokie (U1, U2, U3 — dwa człony, U4),
plus fałszywa lista w nowym teście (U6).** To jest ten sam wzorzec, który
dispatch kazał ścigać, i w T8 analogiczne znaleziska (U2/U3) zostały zamknięte
mikro-poprawką Final Control, nie zwrotem do Operatora. Żadne z nich nie rusza
geometrii, nie zmienia wyniku żadnej asercji i nie wymaga ponownego pomiaru.

**REKOMENDACJA: Final Control — mikro-poprawka tekstowa, bez zwrotu do Operatora.**
Lista do wykonania, wszystkie w `gra/src/render/units.ts` i nowym teście, czyli
wewnątrz istniejącej allowlisty T11:

1. **`units.ts:3180`** — usunąć albo poprawić „Taran okuty 0.372". Zmierzona
   wartość to **0.33144**; największa w rodzinie oblężniczej to **Taran 0.33954**.
   Wniosek zostaje bez zmian.
2. **`units.ts:3213–3216`** — odwrócić diagnozę: przy liczbie segmentów
   niepodzielnej przez 4 koło **unosi się nad terenem o 0.0018**, nie tonie pod nim.
   To nie jest „stopy pod terenem" z T7/T8, tylko klasa odwrotna.
3. **`units.ts:3104` (K8)** — poprawić na „napięta między bębnem a **uchem** na
   ramieniu" i usunąć „zapadka na zębatce założona"; zastąpić sworzniem, zgodnie
   z `units.ts:3391–3394` i z Ammianusem.
4. **`units.ts:3061–3065` (K4)** — zawęzić „przekrój belek" do faktycznego zakresu
   (półszerokość podłużnic). Ewentualnie doprecyzować `units.ts:3160`.
5. **`units.ts:3174–3176`** — odświeżyć 17 315 → **17 480** albo usunąć samą liczbę
   pola rzutu (wysokość 215 px jest trafiona).
6. **`zelazo-katapulta-real-render-test.cjs`, komentarz H5** — poprawić listę:
   pod kryterium H5 na starym modelu unosiły się **ramię (0.1508) i lewe koło
   (0.0050)**; pozostałe wymienione części wisiały względem tego, do czego miały
   być przymocowane, a nie względem czegokolwiek.
7. **Opcjonalnie (U10):** przemianować `kt-windlass-ratchet` na coś bez „ratchet"
   (np. `kt-windlass-disc`), skoro komentarz jawnie odrzuca zapadkę.
   **UWAGA — to NIE jest zmiana jednoliniowa.** Sprawdziłem: nazwa jest używana
   w trzech miejscach i zmiana wymaga wszystkich trzech naraz, inaczej test
   czerwienieje: `units.ts:3392` (`add(...)`), `zelazo-katapulta-real-render-test.cjs:589`
   (H15 czyta `n['kt-windlass-ratchet']`) oraz `:821` (nazwa jest na liście
   `T11_ONLY` sprawdzanej przez **G2** w artefakcie vite). Jeśli Final Control nie
   chce ruszać testu, **bezpieczniejszym wariantem jest zostawić nazwę i dopisać
   przy `units.ts:3392` jedno zdanie**, że „ratchet" to nazwa historyczna gniazda,
   a bryła jest tarczą bez zębów. Rekomenduję ten wariant.

U5, U7, U8, U9, U11 dotyczą **raportu Operatora**, który leży poza kodem — do
odnotowania w rejestrze uwag serii, nie do naprawy w `gra/`.

Po tych poprawkach temat jest gotowy do integracji i do zbiorczego deployu ROBOCZA
całej serii `R-ZELAZO-AUDYT-POZOSTALE-Q1`.

## 11. Ścieżki artefaktów mojej weryfikacji

- Worktree Operatora (czytany, nietknięty): `/home/user/wt-T11-Q1`
- Worktree `main` do pomiaru stanu PRZED: `/home/user/The-Game` (88e2181f, czysty)
- Harness pomiarowy: `/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/eval-measure.cjs`
- Analiza geometrii: `/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/analyze.cjs`
- Weryfikacja liczb z komentarzy (warianty mutacyjne):
  `/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/eval-claims.cjs`
- Odciski pomiarowe: `.../scratchpad/new.json` (9176af07), `.../scratchpad/old.json` (88e2181f)
- Logi przebiegów: `.../scratchpad/*.log`; artefakt vite: `.../scratchpad/dist-eval/`
