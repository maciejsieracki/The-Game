## 01 — OPERATOR (runda 1)

```
STATUS: PASS
DOMAIN: GAME
TEMAT: R-ZELAZO-AUDYT-POZOSTALE-Q1-T5
GOAL: Audytować i podnieść do standardu serii Opus 5 (zmierzona geometria, sekcja
      historyczna ze źródłami, real-render dowód) cztery jednostki mezopotamskie
      epoki Żelaza: Garnizon Harappy, Gwardia hetycka, Mur tarcz (Sargonid),
      Piechota neobabilońska.
ZMIANY/COMMIT: gałąź `autobot/ZELAZO-AUDYT-T5-Q1`, merge-base 559227b9.
      gra/src/render/jednostki-z1-mezopotamia.ts
      gra/src/render/units.ts (tylko 4 linie dispatchu + komentarz)
      gra/tools/zelazo-mezopotamia-real-render-test.cjs (nowy)
      dyspozycje/autobot/runs/R-ZELAZO-AUDYT-POZOSTALE-Q1-T5/01-operator.md
TESTY: temat 72/72 · tsc 0 błędów · vite build OK (23,2 s, poza repo, `gra/dist`
      nie powstało) · logic 213/213 · tech-tree 19/19 · research 33/33 ·
      unit-replace 13/13 · combat 6/6 · T1 29/29 · T2 40/40 · T3 38/38 ·
      T4 55/55 · zelazo-gate 24/24 (T1-T4 z `--skip-vite`)
BLOKADY: brak
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (osobny subagent, Opus 5 High)
DEPLOY/PUSH: push gałęzi roboczej WYKONANO (`origin/autobot/ZELAZO-AUDYT-T5-Q1`);
      deploy NIE WYKONANO, `main` nietknięty
```

**MODEL WYKONUJĄCY: Opus 5, ID `claude-opus-5[1m]`** — odczytane ze środowiska tej
sesji (rząd 1 wg §13a), nie z pamięci. Dispatch wymaga Opus 5 High (§5a, wyjątek
graficzny) — model zgodny.

---

### 1. Metoda — pomiar, nie czytanie

Zbudowałem każdą z czterech figurek w żywym Chromium (Playwright + Three.js),
policzyłem świtowe OBB każdego mesh i przepuściłem **każdą parę brył** przez test
SAT. Progi styku broni z dłonią wziąłem z RODZINY, nie z sufitu: zaakceptowany
model Falangi z T3 ma przedramię/drzewce 0,0218 i pięść/drzewce 0,0335 przy
**ramieniu 0,0000**.

### 2. Znalezione realne błędy (3) — żaden widoczny w kodzie

| # | Jednostka | Błąd | Pomiar PRZED |
|---|---|---|---|
| A1 | Mur tarcz | włócznia przechodzi przez **własne ramię** włócznika | SAT 0,0365×HEX_R w ramieniu, 0,0295 w przedramieniu; oś ramienia oddalona od osi włóczni o 0,0233 przy barku i **0,0096 przy łokciu**, przy progu styku 0,0365 |
| A2 | Mur tarcz | lewe przedramię sterczy **na wylot przez pole tarczy w kolorze gracza** | SAT 0,0303 przez pole, 0,0373 przez deskę |
| A3 | wszystkie 4 | nazwy EN z `units.json` **nie trafiały w modele** | „Hittite Guard"/„Neo-Babylonian Infantry"/„Shield Wall (Sargonid)"/„Harappan Garrison" → **28 mesh = generyk**, PL → 34/37/35/37 |

A1 to dokładnie klasa błędu z T3 (dory Falangi) i T1 (lanca jeźdźca). A2 miał
jedną przyczynę: tarcza była **jedyną z czwórki** ustawioną na pozycji wpisanej na
sztywno — zwrot z `z1BuildArm` szedł do kosza, gdy pozostałe trzy kotwiczą tarczę
w `armL.wrist`. A3 jest realne, nie teoretyczne: `battleScene.ts` bierze
`modelName = stats['Jednostka'] ?? bu.nazwa`, a `bu.nazwa` to „Nazwa EN"
(`testBattle.ts:358`).

Naprawy: A1 — włócznia dostała **własną oś** odczepioną od przedramienia + rękę
z nadgarstkiem wyżej od łokcia (wzorzec naprawy T3); A2 — kotwica w `armL.wrist`;
A3 — aliasy EN, każdy rdzeń sprawdzony na jednoznaczność w całym `units.json`.
Przy okazji A2 tarcza jednostki o Obronie 10/Pancerzu 7 była **mniejsza** niż
tarcza Harappy o 8/5 — po naprawie 0,0874 vs 0,0711 (płyta czołowa), zasłania
94% szerokości torsu.

### 3. Zmierzone i potwierdzone jako POPRAWNE (bez zmian geometrii)

Gwardia hetycka, Piechota neobabilońska, Garnizon Harappy: **zero** przenikania
broni przez ciało i **zero** przenikania kończyn przez tarcze. **Żadna z czterech
nie ma błędu z T2** — normalne pól tarcz względem kierunku patrzenia kamery gry
(azymut 0, elewacja 52°): −0,603 / −0,606 / −0,616 / −0,606, każda zwrócona do
kamery. Odcisk palca **całego rosteru (75 jednostek)** main vs gałąź: różnią się
**dokładnie 4**, a wśród nich PL-geometria zmieniła się **tylko u Mur tarcz**
(maxR 0,6377 → 0,6623) — pozostałe trzy mają odcisk co do cyfry identyczny.

### 4. Warunek możliwości audytu

Plik **nie nazywał ani jednego mesh** i nie miał `userData.anchors`, więc żaden
test nie mógł zaadresować części — to jest powód, dla którego przez cztery tematy
serii nie był sprawdzony. Dodane: nazwy dla wszystkich 143 mesh (prefiksy `het-`,
`nb-`, `mt-`, `gr-`) i kotwice dla czterech grup, konwencją `hastati-falangita.ts`.

### 5. Sekcje historyczne — z jawnie nazwanymi napięciami

K-sekcje dla każdej z czterech (K1–K9/K10). Trzy twarde napięcia **nazwane, nie
zamiecione**: (a) imperium hetyckie upada ok. 1180 p.n.e. → jednostka osadzona
w państwach neohetyckich (Karkemisz, do 717 p.n.e.); (b) „Sumerowie" + „Sargonid"
w jednym wpisie `units.json` dzieli ok. 1300 lat → uzbrojenie sargonidzkie,
dziedzictwo sumeryjskie tylko wizualne, kaunakes zostawiony jako **świadomy
anachronizm z uzasadnieniem**; (c) Harappa to epoka brązu (2600–1900 p.n.e.),
więc „garnizon epoki żelaza" jest anachronizmem z definicji → warstwa
późno-/postharappańska. Źródła m.in.: KBo 1.14 (list o żelazie), reliefy
Karkemisz (Woolley), Stela Sępów Eannatuma, reliefy z Lakisz 701 p.n.e.,
Herodot VII.65, Arrian „Indike" 16, „Kapłan-Król" z Mohendżo-Daro.
`units.json` **nietknięty** (poza allowlistą) — rozjazdy opisane, nie poprawiane.

### 6. Dowód nietautologiczności — macierz ablacyjna

Standard ustalony przez Evaluatora T4: **mutacja pojedyncza na asercję**, nie
zbiorcza. 11 osobnych bundli, w każdym DOKŁADNIE jedna podmieniona linia:

```
        H1    H2    H3    H4    H5    H6    H7    H8    H9    H10   H11
BAZA    green green green green green green green green green green green
M1      RED   green RED   green green green green green green green green
M2      green RED   green green RED   green green green green green green
M3      green green RED   green green green green green green green green
M4      green green green RED   green green green green green green green
M5      green green green green RED   green green green green green green
M6      green green green green green RED   green green green green green
M7      green green green green green green RED   green green green green
M8      green green green green green green RED   RED   green green green
M9      RED   green green green green green green green RED   green green
M10     green green green green green green green green green RED   green
M11     green green green green green green green green green green RED
```

Każda z H1–H11 czerwienieje pod **swoją** pojedynczą mutacją. Dodatkowo (D):
usunięcie czterech aliasów EN → A5–A8 padają w komplecie, A1–A4 zostają zielone.
Sprzężenia M1→H3, M8→H7, M9→H1 są konsekwencjami fizycznymi, nie przypadkiem.

### 7. Granice §9

Poz. 1 (C-001): zero `npm run build`/`dev`/`npx`; build wyłącznie
`node ./node_modules/vite/bin/vite.js build --outDir /tmp/... --emptyOutDir`;
po buildzie `git status` pokazuje wyłącznie trzy pliki allowlisty, `data/*.json`
nietknięte, `gra/dist` nie powstało. Poz. 2: `git add` per plik, zero `git add -A`.
Poz. 3: grep na sekrety — 0 trafień. Poz. 4/5/7: zero zmian procesu, `WERSJE.md`
i `playbook.json` poza diffem. Poz. 6a: real render + zrzuty + dowód
nietautologiczności. Poz. 8: deploy NIE wykonany.

`origin/main` przesunął się w trakcie pracy (559227b9 → afbd3b8d), ale wyłącznie
o sześć nowych `00-dispatch.md` dla T6–T11 — **zero przecięcia** z moją allowlistą.

### 8. Zakres — czego NIE zrobiłem

Nie ruszyłem `units.json` (poza allowlistą — rozjazdy „Sumerowie/Sargonid"
i „Harappa/żelazo" są opisane w kodzie, nie poprawiane). Nie ruszyłem geometrii
trzech jednostek, u których pomiar niczego nie wykazał. Nie zmieniałem kształtu
tarczy-ósemki Gwardii mimo że dla epoki żelaza jest archaiczna — napięcie
opisane w K6, zmiana wykraczałaby poza „napraw to, co pokazał pomiar".
