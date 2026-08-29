# 01 — OPERATOR

```text
STATUS: PASS
DOMAIN: GAME
TEMAT: R-ZELAZO-AUDYT-POZOSTALE-Q1-T11
GOAL: Audytować Katapultę (bez kultury/nacji) — realny pomiar geometrii w żywym
      Three.js, jednoznaczne ustalenie typu machiny, naprawa znalezionych defektów,
      sekcja ZGODNOŚĆ HISTORYCZNA ze źródłami i test real-render z dowodem
      nietautologiczności per asercja.
MODEL WYKONAWCY: Opus 5 (`claude-opus-5[1m]`) — odczytane ze środowiska sesji,
      nie z założenia. Dispatch wymaga Opus 5 High (§5a, wyjątek graficzny).
      Sam model się zgadza; POZIOMU EFFORT nie potrafię odczytać ze środowiska
      i go NIE potwierdzam — zgłaszam jako niezweryfikowane, nie jako spełnione.
ZMIANY/COMMIT: gałąź `autobot/ZELAZO-AUDYT-T11-Q1` (od `origin/main` = 88e2181f)
      - `gra/src/render/units.ts` — WYŁĄCZNIE `buildCatapult()` (przebudowa
        + sekcja K1-K9) i linia dispatchu 1435 (+6 linii komentarza).
        Zakres diffu potwierdzony `git diff -U0`: wszystkie hunki mieszczą się
        w 1435 oraz 3022–3441. Nic poza allowlistą.
      - `gra/tools/zelazo-katapulta-real-render-test.cjs` — NOWY test (831 linii)
      - `gra/data/**` — BEZ ZMIAN
TESTY:
      - `zelazo-katapulta-real-render-test` — 22 pass / 0 fail
        (15 asercji H + macierz ablacyjna 15 mutacji, każda czerwieni SWOJĄ + G1-G3)
      - Seria bez regresji: gate 24/24, mezopotamia 70/0, śródziemnomorze 81/0,
        super-rzym-grecja 89/0, germanie 77/0, falanga 38/0, celtowie 40/0,
        jeździec-oszczepami 55/0, konnica-asyryjska 29/0, siege 11/11
      - Bramki §6: tsc --noEmit 0 błędów, logic 213/213, tech-tree 19/19,
        research 33/33 ALL GREEN, unit-replace 13/13, combat 6/6
      - `unit-power-test` 4 pass / 2 fail — PRE-ISTNIEJĄCE, nie regresja:
        sprawdzone przez uruchomienie tego samego testu na bazie 88e2181f,
        wynik identyczny (4/2). Zgodne z tym, co zgłosił T8.
      - `vite build` binarką z node_modules do /tmp (C-001) — czysty, 21.96 s
BLOKADY: brak. Dwa zgłoszenia do rejestru (§7 niżej), oba POZA allowlistą T11.
RUNDY: 1/5.
NASTĘPNY KROK: Evaluator (Opus 5 High).
DEPLOY/PUSH: NIE WYKONANO.
```

---

## 1. Co było przed T11 — wszystko zmierzone, nic odczytane z kodu

Pomiar na `origin/main` (88e2181f), żywy Chromium, `buildUnitModel('katapulta',
0x3366ee, 'Katapulta')`, jednostki HEX_R = 1.0:

```
mesh 11 | nazwanych 0 | userData.anchors: null
bbox  X[-0.195, 0.195]  Y[0, 0.67688]  Z[-0.190, 0.32101]
```

**Zero nazwanych brył i brak `anchors`** — ta sama przyczyna, dla której T5–T8
zastawały swoje pliki „nigdy niemierzalne". Bez nazw żadna asercja nie może
zaadresować części, a progi musiałyby być wpisane liczbowo w test, czyli test
mierzyłby sam siebie. Nazwanie 48 brył i dodanie 14 kotwic jest warunkiem
istnienia wszystkiego poniżej, nie kosmetyką.

## 2. Defekty — każdy zmierzony PRZED oceną

| # | Defekt | Zmierzone PRZED | PO |
|---|---|---|---|
| D1 | **Ramię miotające nie było osadzone na własnej osi obrotu** | oś obrotu leży **0.1985** od odcinka ramienia = **43.2 % jego własnej długości**; najbliższy koniec ramienia **0.2289** od osi | 0.0000 / 0.0000, stopka tkwi w skręcie (SAT 0.0446) |
| D2 | **Kubeł z kamieniem wisiał w powietrzu obok ramienia** | środek kubła **0.2072** od osi ramienia; szczelina powierzchni kubeł↔ramię **0.1508**, kamień↔ramię **0.1643** | proca zwisa pionowo pod hakiem (odchyłka 0.0000), kamień w kieszeni (SAT 0.0200), kieszeń na łożu (szczelina 0.0000) |
| D3 | **„Liny łączące oś ze skrzynią" nie łączyły niczego** | oba końce w powietrzu, szczelina do poprzeczki osi, do której rzekomo prowadziły: **0.1101** | lina liczona z DWÓCH istniejących punktów: bęben ↔ ucho na ramieniu, oba końce 0.0000 |
| D4 | **Koła odczepione od ramy** | szczelina koło↔rama **0.0050** po obu stronach; brak osi łączącej koła; lewe koło nie dotykało NICZEGO | oś przechodzi przez obie piasty na wylot, zero brył bez styku |
| D5 | **Barwa właściciela: jedna banderola, po jednej burcie, oderwana** | x = **+0.175** (brak lustra), szczelina do ramy **0.0375** | 4 bryły, parzyste i lustrzane, przylegające (weryfikowane asercją H9) |
| D6 | **Brak pęku liny skrętnej, spustu i zderzaka** | machina skrętowa bez skrętu; nie da się powiedzieć, co ją napędza ani co ją trzyma | skręt + tarcze + drążki, sworzeń spustu, belka zderzakowa z wypchanym worem |
| D7 | **Sylwetka poniżej rodziny oblężniczej** | rzut z kamery gry **18 550 px / 209 px wysokości** — NAJNIŻSZY z sześciu mierzonych modeli (rodzina oblężnicza 20 396–21 841 px / 217–257 px) | 19 562 px / **228 px** — powyżej progu rodziny |

**Przyczyna D1 i D2 to jeden błąd znakowy.** Stary kod obracał ramię przez
`mArmM.rotation.x = ARM_ANGLE` (co daje zwrot osi `(0, cos θ, sin θ)`, czyli przy
θ = −1.05 kierunek **ku −Z**), ale POŁOŻENIE liczył z `Math.sin(-ARM_ANGLE)`,
czyli **ku +Z**. Zwrot i położenie pochodziły z przeciwnych znaków tego samego
kąta. Zmierzone skutki: oś ramienia `(0, 0.4976, −0.8674)`, końce ramienia
`(0, 0.5829, −0.1200)` i `(0, 0.3540, 0.2790)`, poprzeczka osi `(0, 0.3540, −0.1200)`
— żaden koniec nie trafia w oś. Kubeł i kamień siedziały w punkcie „zamierzonym",
czyli w rogu tej rozbieżności, i przez to nie dotykały ani ramienia, ani niczego innego.

Komentarz w starym kodzie mówił też `ARM_ANGLE = -1.05 // ~-60° od poziomej`.
To nieprawda: `atan(0.4976 / 0.8674) = 29.85°` od poziomu (60° od PIONU).
Odnotowuję jako trzeci, czysto tekstowy defekt tej samej linii.

## 3. Typ machiny — ustalony z danych gry, nie z upodobania (kryterium 2)

Dispatch pytał wprost: onager czy balista. Rozstrzygnięcie oparte na trzech
niezależnych świadectwach **wewnątrz projektu**, nie na moim guście:

1. `units.json`, pole `Uwagi`: „burzy mur/bramę zza linii (**lob nad murem**)".
2. `units.json`: `Atak dystansowy` = 8, `Zasięg ataku (hex)` = 6, `Przebicie` = 6,
   `wallAttack` = 16, `Kultura` = null, `Nacja` = "".
3. `src/battle/battleScene.ts` — „Animacja pocisku kamiennego katapulty:
   **sfera szara lecąca parabolą**", plus predykat pocisków, który już dziś
   uznaje `onager` za alias tej klasy.

Dwuramienny miotacz kamieni (gr. *λιθοβόλος*, rzym. *ballista*) strzela torem
**płaskim** — kruszy mur wprost, nie przerzuca nad nim. Jedyna machina antyczna,
która lobuje kamień nad murem, to **jednoramienna machina skrętowa — onager**.
Dane jednostki nie zostawiają wyboru. Model ma DOKŁADNIE JEDNO ramię (pilnowane
asercją H10) i kulisty kamień, zgodnie z animacją pocisku w silniku.

**Wątpliwość chronologiczna rozstrzygnięta i zapisana jawnie (§10, kryterium 7).**
Onager jest machiną PÓŹNĄ: pierwszy pełny opis daje dopiero Ammianus Marcellinus
w 2. poł. IV w. n.e., a samo słowo nazywa on nowinką swoich czasów (XXIII.4.7).
Wcześniejszą część epoki Żelaza obsługiwał dwuramienny miotacz kamieni, znany od
armii Filipa II i Aleksandra (IV w. p.n.e.). Onager mieści się więc w oknie
„Żelazo ~500 p.n.e.–500 n.e.", ale przy jego **późnym krańcu, nie w środku**.
Wybrałem go mimo to, bo dane jednostki wymagają lobu nad murem — i zapisałem tę
niezgodność w K2 wprost, żeby nikt później nie czytał modelu jako „typowej
machiny V w. p.n.e.".

## 4. Sekcja historyczna K1–K9 (kryterium 3)

Dziewięć punktów w nagłówku `buildCatapult()`, każdy z lokalizacją źródła.
Rdzeń materiału:

- **Ammianus Marcellinus, *Res gestae* XXIII.4.4** — dwie belki z dębu albo
  ostrolistu, lekko wygięte, spięte „jak w pile ramowej", z dużymi otworami po
  bokach; między nimi, przez te otwory, przeciągnięte mocne liny. → dwie
  podłużnice + `kt-skein-bundle` przechodzący przez oba stojaki na wylot.
- **XXIII.4.4–5** — z tych lin wyrasta drewniany trzon „**ukośnie, jak dyszel
  wozu**", umocowany sznurami tak, by dało się go podnosić i opuszczać;
  „na jego szczycie umocowane są **żelazne haki, z których zwisa proca**, ze
  sznura albo z żelaza". → dwa wnioski wprost przeciwne staremu modelowi:
  ramię jest UKOŚNE (nie pionowe) i pocisk leży w **zwisającej procy na haku**,
  a nie w sztywnym kubełku przyklejonym do ramienia. To źródło, nie ja, obaliło
  „kubeł".
- **XXIII.4.5** — pod trzonem leży „wielki wór wypełniony strzępami", mocno
  przewiązany; **XXIII.4.6** — zwolniony trzon, „trafiwszy na miękkie włosie,
  miota kamień". → `kt-stop-pad` + `kt-stop-strap-*`.
- **XXIII.4.6** — „kładzie się okrągły kamień w procę, a czterej młodzieńcy
  z każdej strony odkręcają drąg (…) i zginają trzon niemal płasko. Wtedy dopiero
  celowniczy, stojąc powyżej, mocnym młotem **wybija sworzeń trzymający całą
  konstrukcję**". → poza modelu = NAPIĘTA I ZAŁADOWANA; spust to **sworzeń**
  (`kt-trigger-bolt`), nie zapadka.
- **XXIII.4.7** — nazwa: *tormentum* od skręcania (*torquetur*), *scorpio* od
  uniesionego żądła, a „czasy dzisiejsze dały mu nową nazwę *onager*", bo dzikie
  osły ścigane przez myśliwych kopnięciem odrzucają kamienie.
- **Witruwiusz, *De architectura* X.10 (katapulty/skorpiony) i X.11 (balisty)** —
  w łacinie I w. p.n.e. *catapulta* to machina **strzałowa**, a *ballista*
  **kamienna**, czyli odwrotnie niż w polszczyźnie potocznej; w późnym antyku
  nazewnictwo się rozjeżdża. Polska „Katapulta" jest terminem potocznym i nie
  wymusza miotacza bełtów (K3).
- **Witruwiusz X.10.1** — proporcje machin strzałowych liczy się z długości
  strzały, a otwór w kapitelu to **jedna dziewiąta** tej długości.
  **X.11.2** — dla machin kamiennych tabela: kamień 2-funtowy → otwór 5 palców,
  10-funtowy → 8 palców, 100-funtowy → stopa i 1½ palca, aż po 360-funtowy →
  stopa i 10 palców. → model idzie za ZASADĄ jednego modułu: `MOD` jest jedyną
  miarą, z której liczą się średnica skrętu, oba przekroje ramienia, promień
  kamienia i przekrój podłużnicy (K4).

Dwie rzeczy, których źródło NIE mówi, są w komentarzu nazwane po imieniu jako
moje decyzje rekonstrukcyjne, nie jako cytat: (a) Ammianus każe worowi spoczywać
na usypanej darni albo stosie cegieł — tu machina stoi na kołach, więc wór siedzi
na belce poprzecznej; (b) pełne napięcie to u Ammianusa „niemal płasko", co przy
skali tokena znikałoby z sylwetki, więc ramię stoi pod 24° nad poziomem.

## 5. Co zbudowałem — i czego świadomie NIE ma

48 nazwanych brył (przed: 11 bez nazw), prefiks `kt-`, 14 kotwic w `userData.anchors`.
Łańcuch mechaniczny zamknięty i zmierzony:

```
skręt (kt-skein-bundle) → stopka ramienia → ramię → ucho → lina kołowrotu →
bęben → tarcza → SWORZEŃ SPUSTU → kozioł
                       ↘ hak na szczycie → sznury procy → kieszeń → KAMIEŃ → łoże
swobodny tor ramienia  → PODUSZKA zderzaka (dist 0.3118 < ARM_LEN 0.3392)
```

Wybrane pomiary końcowe (żywy Three.js):

```
mesh 48 | nazwanych 48/48 | anchors 14 kluczy | materiałów 8
bbox X ±0.1855  Y[0, 0.65614]  Z[-0.2989, 0.2777]  maxR 0.3281
oś obrotu ↔ odcinek ramienia            0.0000   (przed: 0.1985)
oś obrotu ↔ najbliższy koniec ramienia  0.0000   (przed: 0.2289)
proca zwisa pionowo pod hakiem          0.0000   (przed: kubeł 0.2072 obok ramienia)
kamień w kieszeni (SAT)                 0.0200   (przed: szczelina 0.1643)
kieszeń ↔ łoże                          0.0000
lina ↔ bęben / lina ↔ ucho              0.0000 / 0.0000  (przed: 0.1101 do niczego)
dist(oś obrotu, poduszka) / ARM_LEN     0.3118 / 0.3392  → zapas 0.0274
bryły bez styku z czymkolwiek           0 z 48   (przed: ramię i lewe koło)
minY                                    0.0000   (rodzina: 0.0000)
maxR                                    0.3281   (Taran okuty 0.372 — mieści się)
```

**Czego nie ma i dlaczego — decyzja z pomiaru, nie z niedbalstwa.** Zbudowałem
najpierw parę ściągów łączących stojak skrętu ze słupem zderzaka. Pomiar pikseli
z kamery gry dał im **0 pikseli**: leżały w tym samym paśmie X co oba słupy,
a słup zderzaka stoi przed nimi. Dwie niewidoczne bryły to martwa geometria —
koszt draw calla bez wkładu w obraz. Usunąłem je i pogrubiłem słupy zderzaka
(0.052 × 0.050 zamiast 0.048 × 0.044). Powód zapisany w kodzie, żeby nikt tego
nie „naprawił" z powrotem.

## 6. Defekty, które znalazłem we WŁASNEJ pracy, zanim ją oddałem

Trzy z nich złapał dopiero pomiar, nie czytanie kodu — odnotowuję, bo to
najlepszy dowód, że metoda działa także przeciw autorowi:

1. **Lina kołowrotu miała ZERO PIKSELI z kamery gry.** Pojedyncza lina biegła
   w osi `x = 0`, dokładnie pod ramieniem, które jest grubsze i całkowicie ją
   zasłaniało. To dokładnie ta klasa błędu, którą T6 i T8 znajdowały jako
   „element istnieje w 3D, a nie widać go na ekranie". Rozdzieliłem na parę lin
   burtowych (34 + 34 px). Mutacja **M7** odtwarza ten stan i czerwieni H7.
2. **Obręcz koła schodziła 0.0022 pod teren.** `CylinderGeometry` o liczbie
   segmentów niepodzielnej przez 4 (miałem 14) nie ma wierzchołka w najniższym
   punkcie, więc `minY` wychodziło ujemne — kołowa odmiana „stóp pod terenem"
   z T7/T8. 16 segmentów daje `minY = 0.0000` co do zera. Mutacja **M6**.
3. **Sworzeń spustu tylko muskał kozioł** (SAT 0.0011 — trzymał się „na styk",
   nie w gnieździe). Kozioł kołowrotu sięgał dokładnie tak wysoko jak bęben.
   Podniosłem kozioł ponad bęben; teraz sworzeń tkwi w nim na 0.0140.
4. **Fałszywy komentarz we własnym kodzie.** K4 twierdził, że przekroje są
   wielokrotnościami modułu `MOD`, podczas gdy w kodzie były wielokrotnościami
   `U`. Zamiast zmiękczać zdanie, zrobiłem je PRAWDZIWYM: `ARM_R_ROOT`,
   `ARM_R_TIP`, `STONE_R` i `FRAME_HW` liczą się teraz z `MOD`. Wymiary nie
   drgnęły (H 0.6561, maxR 0.3281 przed i po), więc to poprawka czysto
   deklaratywna — ale zostawienie jej byłoby defektem klasy T7/T8.
5. Zderzak wchodził w stojak skrętu (SAT 0.028); proca kolidowała z bębnem
   kołowrotu (SAT 0.012–0.017). Oba przebudowane, potwierdzone pełnym skanem par.

## 7. Zgłoszenia do rejestru — POZA allowlistą T11, nie tknąłem

**Z1 — Katapulta w bitwie ręcznej renderuje się jako PIESZY WOJOWNIK.**
`src/battle/manualBattle.ts:750` woła `buildUnitModel(bu.kategoria, bu.ownerColor)`
**bez nazwy**. Dispatch modelu Katapulty jest wyłącznie po NAZWIE (`units.ts:1435`),
a `buildCategoryModel()` nie ma `case 'katapulta'`. Zmierzone:

```
buildUnitModel('katapulta')  bez nazwy → 87 mesh
buildUnitModel('taran')      bez nazwy → 87 mesh
buildUnitModel('wieza')      bez nazwy → 87 mesh
buildUnitModel('katapulta', …, 'Katapulta') → 48 mesh
```

Wszystkie trzy machiny oblężnicze dostają tam **ten sam generyczny model
humanoidalny**. To defekt realny i widoczny, ale mieszka w `manualBattle.ts`
i w `buildCategoryModel()` — **oba poza allowlistą T11**. Nie ruszałem.
Rekomendacja: albo przekazać nazwę w tym wywołaniu, albo dodać gałęzie
kategorii dla machin.

**Z2 — aliasy `onager`/`balista`/`trebuchet` rozjeżdżają się między warstwami.**
`battleScene.ts:6625` i `testBattle.ts:426` uznają `onager` (a pierwszy także
`balist`) za Katapultę, `units/setup.ts:282` dokłada `trebuchet`, a dispatch
modelu w `units.ts:1435` zna tylko `katapulta`/`catapult`. Dziś **nie ma skutku**:
sprawdziłem `units.json` — żadna jednostka nie nosi tych rdzeni, jedyny wiersz
to „Katapulta"/„Catapult". Świadomie NIE dodałem aliasów do dispatchu: to byłby
kod pod jednostki, które nie istnieją (§10, zakaz pracy spekulatywnej). Zgłaszam
jako niespójność do decyzji właściciela, nie jako defekt do naprawy teraz.

## 8. Test regresji i dowód nietautologiczności (kryterium 4)

`gra/tools/zelazo-katapulta-real-render-test.cjs` — **22 pass / 0 fail**.

15 asercji H1–H15 mierzonych w żywym Chromium. Progi biorą się z RODZINY
mierzonej w TYM SAMYM renderze (Taran, Taran okuty, Wieża oblężnicza jako
machiny; Hastati i Falanga jako dolna granica „to już piechota"), nigdy z sufitu.

**Katapulta nie jest jednostką pieszą**, więc asercje T1–T10 („broń w ciele",
„tarcza względem kamery", „stopy pod terenem") nie przenoszą się 1:1. Ich
odpowiednikiem dla maszyny jest łańcuch mechaniczny: H1 ramię na osi obrotu,
H2 pocisk trzymany, H3 zderzak w zasięgu, H4 lina między dwoma istniejącymi
punktami, H5 nic nie wisi w powietrzu, H6 stanie na ziemi, H7 widoczność
z jedynej kamery, H8 skala rodziny, H9 neutralność kulturowa i symetria barwy,
H10 typ = onager, H11 mierzalność, H12 dispatch, H13 zero regresji sąsiadów,
H14 sekcja historyczna, H15 spójność pozy napiętej.

**Macierz ablacyjna: 15 mutacji, każda podmienia DOKŁADNIE JEDNO miejsce**
(pilnuje tego mechanicznie asercja M0). Wynik:

- **M1: KAŻDA z H1–H15 czerwienieje pod SWOJĄ pojedynczą mutacją** — zielona.
- **M2: na niezmienionym źródle wszystkie H są zielone** — zielona.

Osiem mutacji odtwarza **dosłowny stan sprzed T11** (M1 odwrócony znak Z,
M5 oderwana barwa właściciela, M6 koło pod terenem, M8 token poniżej rodziny,
M9 barwa po jednej burcie) albo defekt znaleziony w trakcie T11 (M7 lina
z zerem pikseli). Macierz jest drukowana w całości i **nic nie jest ukryte**:
M1 czerwieni też H4 i H15, M11 też H1, M3 i M8 też H7, a M12 (Katapulta
dispatchowana do taranu) czerwieni prawie wszystko — bo podmienia cały model.
Kierunek egzekwowany jest PER-H, nie PER-M, tak jak ustalił Evaluator T4.

Sekcja (G) sprawdza **artefakt produkcyjny vite** (C-001: binarka z node_modules
przez `node`, `--outDir` poza repo). G3 celowo NIE jest negacją komentarza
(minifikacja i tak usuwa komentarze, więc taka asercja byłaby zawsze zielona)
ani samym słowem „onager" — sprawdziłem grepem, że występuje ono także
w `battleScene.ts` i `testBattle.ts`, więc trafiłoby do artefaktu i bez T11.
Kotwicami są klucze `anchors` istniejące w całym repo wyłącznie
w `buildCatapult()` po T11: `machineType`, `winchEye`, `skeinR`.

## 9. Zero regresji (kryterium 5)

```
zelazo-gate-test                             24/24
zelazo-mezopotamia-real-render-test          70 pass / 0 fail
zelazo-srodziemnomorze-real-render-test      81 pass / 0 fail
zelazo-super-rzym-grecja-real-render-test    89 pass / 0 fail
zelazo-germanie-real-render-test             77 pass / 0 fail
zelazo-falanga-real-render-test              38 pass / 0 fail
zelazo-celtowie-soldurii-gaesatae-...        40 pass / 0 fail
zelazo-jezdziec-oszczepami-real-render-test  55 pass / 0 fail
zelazo-konnica-asyryjska-real-render-test    29 pass / 0 fail
_tmp-siege-test                              11/11
--- 5 bramek referencyjnych ---
logic-test 213/213 | tech-tree-test 19/19 | research-test 33/33 ALL GREEN
unit-replace-test 13/13 | combat-test 6/6
--- §6 ---
tsc --noEmit: 0 błędów
vite build (C-001, /tmp): czysty, 21.96 s
```

Sąsiedzi zmierzeni w tym samym renderze i NIETKNIĘCI: Taran okuty 102 mesh /
H 0.641, Taran 85 / 0.610, Wieża oblężnicza 46 / 0.745. Pilnuje tego H13,
a mutacja M13 (rozlanie rdzenia dispatchu na „taran") czerwieni ją.

## 10. Pełna lista zmienionych plików z uzasadnieniem

**`gra/src/render/units.ts`** — jedyny plik gry w allowliście.

1. **Linia 1435, linia dispatchu (+6 linii komentarza).** Sama linia dispatchu
   jest MERYTORYCZNIE BEZ ZMIAN — sprawdziłem ją i jest poprawna. Dodałem
   komentarz zapisujący to, co faktycznie zweryfikowałem w danych, a nie
   założyłem: rdzenie „katapulta"/„catapult" pasują do DOKŁADNIE JEDNEGO
   wiersza `units.json`, więc dopasowanie po podciągu jest bezpieczne; żadna
   z tych nazw nie zawiera rdzenia „taran"/„battering ram" i odwrotnie, więc
   kolejność względem taranów wyżej też jest bezpieczna. Bez tego zapisu
   następny czytelnik musiałby powtórzyć ten sam grep.

2. **`buildCatapult()`, linie 3022–3441 — przebudowa.** Uzasadnienie zakresu:
   defekty D1–D6 nie są punktowe. Ramię nie było osadzone na osi, pocisk nie był
   trzymany, liny nie łączyły niczego, a machiny skrętowej bez skrętu, spustu
   i zderzaka nie da się „poprawić" — trzeba ją zbudować. Dispatch dopuszcza
   wprost całą tę funkcję. Struktura:
   - **nagłówek K1–K9** — sekcja ZGODNOŚĆ HISTORYCZNA z lokalizacjami źródeł
     (§4), w tym jawne zapisanie dwóch decyzji rekonstrukcyjnych i jednej
     niezgodności chronologicznej;
   - **helper `add()`** — nadaje KAŻDEJ bryle nazwę; warunek mierzalności;
   - **helper `span()`** — element rozpięty MIĘDZY DWOMA PUNKTAMI (długość,
     środek i zwrot liczone z końców). To strukturalna odpowiedź na D3:
     przy tym helperze lina, która nie sięga swoich końców, jest niewyrażalna;
   - **`U` i `MOD`** — skala tokena z pomiaru rzutu (D7) i moduł witruwiański (K4);
   - **48 nazwanych brył** w grupach: podwozie, rama, głowica skrętu, ramię,
     proca, zderzak, kołowrót ze spustem, barwa właściciela;
   - **`userData.anchors`** — 14 kotwic WYPROWADZONYCH z modelu (nie wpisanych
     liczbowo), żeby test mierzył relacje, a nie przepisywał stałe.
   `mats` i `perTokenGeos` zachowane bez zmian — kontrakt zwalniania zasobów
   tokena jest taki sam jak w całym pliku.

**`gra/tools/zelazo-katapulta-real-render-test.cjs`** — NOWY, 831 linii.
Dispatch dopuszcza `gra/tools/*`. Zawiera pomiar geometrii, pomiar pikseli
z kamery gry, pomiar sylwetki, 15 asercji, 15 mutacji ablacyjnych i sekcję
artefaktu produkcyjnego.

**`gra/data/**` — BEZ ZMIAN.** Znaleziska danych zgłoszone w §7, nie naprawione.

## 11. Czego NIE zrobiłem i dlaczego

- Nie dodałem aliasów `onager`/`balista`/`trebuchet` do dispatchu modelu —
  nie istnieją jednostki, które by ich potrzebowały (Z2).
- Nie naprawiłem renderu Katapulty w bitwie ręcznej — poza allowlistą (Z1).
- Nie ruszałem `buildBatteringRam`, `buildSiegeTower` ani `buildCategoryModel`.
- Nie aktualizowałem `WERSJE.md` (zakaz przed deployem).
- Nie pushowałem i nie deployowałem.
- **Nie potwierdzam poziomu effort** — patrz nagłówek raportu.
