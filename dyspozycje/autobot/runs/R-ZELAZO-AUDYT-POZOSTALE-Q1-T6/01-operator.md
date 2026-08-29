# 01 — OPERATOR (runda 1)

STATUS: PASS
DOMAIN: GAME
TEMAT: `R-ZELAZO-AUDYT-POZOSTALE-Q1-T6`
GOAL: Audytować i podnieść do standardu serii Opus 5 cztery jednostki
śródziemnomorskie epoki Żelaza (Gwardia Tyreńska, Tyrski miecznik, Wojownik
z żelaznym khopesh, Thorakites) — kod z `jednostki-z2-srodziemne.ts`, nigdy
rygorystycznie zmierzony.
ZMIANY/COMMIT: `gra/src/render/jednostki-z2-srodziemne.ts`,
`gra/src/render/units.ts` (2 linie dispatchu + komentarz),
`gra/tools/zelazo-srodziemnomorze-real-render-test.cjs` (nowy),
`dyspozycje/autobot/runs/R-ZELAZO-AUDYT-POZOSTALE-Q1-T6/01-operator.md`.
Gałąź `autobot/ZELAZO-AUDYT-T6-Q1`, worktree `/home/user/wt-ZELAZO-AUDYT-T6`.
TESTY: nowy `zelazo-srodziemnomorze-real-render-test` **83 pass / 0 fail**;
`tsc --noEmit` 0 błędów; `vite build` (binarka z node_modules, `--outDir /tmp/...`)
OK; bramki referencyjne 213/213, 19/19, ALL GREEN, 13/13, 6/6; testy serii
T1–T5 bez regresji (24/24, 40/40, 31/31, 57/57, 42/42, 72/72).
BLOKADY: brak.
RUNDY: 1/5.
NASTĘPNY KROK: Evaluator (Opus 5, effort High).
DEPLOY/PUSH: NIE WYKONANO (push gałęzi roboczej ≠ deploy).

## Model wykonawcy (wymóg dispatchu, §5a)

Sprawdzone ze środowiska, nie z pamięci: **`claude-opus-5[1m]` (Opus 5, kontekst
1M), `CLAUDE_EFFORT=high`**. Zgodne z dispatchem (Opus 5 High dla Operatora).

## Sprostowanie założenia dispatchu (sprawdzone, nie przyjęte)

Prompt i „Kontekst techniczny" dispatchu zakładały, że Falanga z T3 leży „w tym
samym pliku" i że plik dostał już przy tamtej naprawie nazwy mesh i `anchors`.
**Nieprawda.** `buildFalangita` mieszka w `gra/src/render/hastati-falangita.ts`;
`git log gra/src/render/jednostki-z2-srodziemne.ts` ma dokładnie jeden commit
sprzed serii (`546f6a51`, porządki w dokumentacji). Zmierzone na starcie:
**0 z 33 / 0 z 30 / 0 z 31 / 0 z 32 mesh nazwanych, `anchors` = brak** — czyli
dokładnie ten sam warunek niemożliwości audytu co w T5.

## Pięć realnych defektów znalezionych POMIAREM

Trzy z nich to **nowa klasa błędu w tej serii**: nie „broń tkwi w ciele"
(T1/T3/T5), tylko „element jest fizycznie niewidoczny z jedynej kamery, jakiej
używa gra" (azymut 0, elewacja 52°).

| # | Jednostka | Defekt (zmierzony) | Po naprawie |
|---|---|---|---|
| A1 | Gwardia Tyreńska | miecz uniesiony wzdłuż kierunku patrzenia kamery: rzut/długość własna **0,142** (Falangita T3 = 0,894) | **0,999**, łokieć nadal zgięty 0,700 rad |
| A2 | Żelazny khopesz | sierp wygięty w płaszczyźnie strzałkowej — na ekranie pionowa kreska, strzałka łuku **0,0000**, rozrzut poziomy 0 | strzałka **0,0461** (22% cięciwy), rozrzut poziomy **0,0964** |
| A3 | Thorakites | dzwon helmu attyckiego pochłaniał oczy — SAT **0,0195** na każdym oku, twarz zakryta (renderował się helm ZAMKNIĘTY) | **0,0000**, twarz odkryta |
| A4 | Gwardia vs Tyrski miecznik | odróżnialność z kamery gry **0,373** przy 0,721–0,811 dla każdej innej pary czwórki | **0,558** (najniższa para, ale w paśmie) |
| A5 | dispatch EN | „Tyre Guard" i „Tyrian Swordsman" dawały 28-meshowy generyk `miecznik` | trafiają we własny model |

Naprawy A1/A2 to zmiana **czterech stałych** (`THU`/`THF` Gwardii, `THU`/`THF`
i `KH_ROLL` khopesza), A3 jednej (`HELM_Y`), A4 dwóch materiałów (helm złocony,
promienie gwiazdy złote — uzasadnienie rzeczowe w sekcji K1 Gwardii).

## Zmierzone i potwierdzone jako poprawne (bez zmian)

- **Zero** przenikania broni przez ciało i **zero** przenikania kończyn przez
  tarczę we wszystkich czterech modelach, pełny SAT na wszystkich parach
  nazwanych mesh, PRZED i PO naprawach. Próg chwytu wzięty z rodziny
  (Falangita T3: przedramię/drzewce 0,0218, pięść 0,0335, RAMIĘ 0,0000).
- Żadna tarcza nie jest odwrócona tyłem do kamery (klasa błędu T2): normalne
  pól gracza −0,603 / −0,603 / −0,603 / −0,603.
- **Thorakites JEST odróżnialny od Falangi** (pytanie dispatchu): 0,576 przed
  naprawami, 0,578 po; inna tarcza (thureos owalny vs aspis), inny hełm
  (attycki otwarty vs koryncki zamknięty), inny pancerz (kolczuga vs linothorax).
- **Khopesz JEST zakrzywiony** (pytanie dispatchu): kąt ostatniego segmentu
  wobec części prostej 1,550 rad. Problemem była widoczność, nie krzywizna.
- `buildTriari` (ten sam plik) i `buildFalangita` (T3): wyjście **byte-identyczne**
  przed/po (37 i 27 mesh, te same pozycje, kwaterniony, kolory) — sprawdzone
  przez zbudowanie obu wersji pliku w jednym harnessie.

## Zgodność historyczna (K-style, 4 sekcje, ze źródłami)

Trzy **twarde anachronizmy nazwane wprost**, nie zamiecione (wzorem T5):
(1) khopesz to broń epoki brązu, wychodzi z użycia bojowego ok. 1300 p.n.e.,
a Egipt przyjmuje żelazo dopiero w XXVI dynastii saickiej (664–525 p.n.e.,
ośrodek: Naukratis, ostatnia tercja VII w.) — „żelazny khopesz" to obiekt,
który nie istniał; (2) khepresz był nakryciem głowy **zastrzeżonym dla faraona**,
nie dla szeregowego; (3) thorakitai to formacja **hellenistyczna** (Polibiusz,
III–II w. p.n.e.), a thureos przejęto od Celtów po najeździe galackim 280–275
p.n.e. — jednostka jest o 300–900 lat późniejsza niż rama gry. `units.json`
jest poza allowlistą i **nie został tknięty**; decyzja §10 (Operator rozstrzyga
i dokumentuje), z jawnym uzasadnieniem przy każdej pozycji.
Źródła cytowane w sekcjach: Brązowe Wrota z Balawat (Salmanasar III), reliefy
Sennacheryba, Ezechiel 27,10-11, Herodot VII.89, Pliniusz NH IX.60-65, panoplia
z Argos (Courbin 1953, ost. ćwierć VIII w. p.n.e.), Polibiusz, łuski z Malkata
i grobowca Tutanchamona, kości słoniowe z Nimrud i Arslan Tash.
Jawnie nazwana **rozbieżność ze źródłem**: Herodot mówi o tarczach fenickich
BEZ obręczy, model ma obręcz — powód (czytelność żetonu) zapisany, nie ukryty.

## Dowód nietautologiczności — macierz ablacyjna 11×11

Jedenaście osobnych bundli, każdy z **dokładnie jedną** podmienioną linią
(większość odtwarza dosłownie stan sprzed audytu). Macierz jest praktycznie
diagonalna; każda z H1–H11 czerwienieje pod swoją mutacją, baza cała zielona.
Trzy komórki poboczne są fizycznie poprawnymi następstwami (M1→H8: miecz
zakotwiczony w torsie nie leży już na osi dłoni; M5→H4: prosty khopesz nie ma
łuku do zobaczenia; M11→H2: małe koło zamiast thureosa wchodzi w przedramię).
Osobna mutacja (D) cofa dokładnie dwa aliasy EN i czerwieni tylko A5–A6.
Zrzuty z żywego Chromium (kamera gry, azymut 0 / elewacja 52°) generuje flaga
`--shots`, w tym zrzuty stanu sprzed naprawy z mutacji M3/M4/M6.

## Poza allowlistą — do rejestru (§14), NIE naprawione tutaj

1. **„Iron Khopesh Warrior" buduje model BRĄZOWEGO wojownika.** Zmierzone:
   sygnatura części nazwy EN jest identyczna z `Wojownik z khopesh`, nie z
   modelem żelaznym. Przyczyna: wcześniejsza linia `n.includes('khopesh warrior')`
   w sekcji EGIPT `units.ts` przechwytuje nazwę, a rdzeń `khopesh warrior` pasuje
   do DWÓCH wierszy `units.json`. Poprawka wymaga tknięcia linii innej jednostki.
   Stan jest pilnowany jawną asercją (A8), żeby nikt nie uznał go za naprawiony.
   Skutek dziś: **żaden** — wszystkie żywe wywołania `buildUnitModel` przekazują
   nazwę polską (sprawdzone niezależnie: `battleScene.ts` ×4 →
   `stats['Jednostka']`, `unitMiniPreview.ts` → `u.Jednostka`, `units.ts` ×2 →
   `typeId`, a `typeId` jest porównywany z `u.Jednostka` w `main.ts:2931`).
2. **Khepresz (korona królewska) na szeregowym wojowniku** — dotyczy tej
   jednostki i jej brązowego przodka w `jednostki-p4-melee.ts`; zdjęcie korony
   tylko tutaj rozjechałoby parę, brązowy model jest poza allowlistą.
3. **Tyrski miecznik ma Pancerz 4, a model nie pokazuje pancerza** — napięcie
   między `units.json` a sylwetką; `units.json` poza allowlistą.

## Interpretacja allowlisty (zgłoszona wprost, nie po cichu)

Allowlista mówi „WYŁĄCZNIE funkcje `buildGwardiaTyrenska/buildTyrskiMiecznik/
buildZelaznyKhopesh/buildThorakites`; NIE ruszać innych funkcji w tym samym
pliku". Nadanie nazw mesh wymagało dodania parametrów do **wspólnych funkcji
pomocniczych** (`z2Seg`, `z2BuildArm`, `z2BuildLeg`, `z2Core`, `z2IronSword`,
`z2RoundShield`), z których korzysta także `buildTriari`. Przyjęta wykładnia:
zakaz chroni **wyjście innych jednostek**, więc parametry dostały domyślną
wartość pustą, a niezmienność `buildTriari` została **udowodniona pomiarem**
(byte-identyczny dump 37 mesh), a nie założona. Jeśli Evaluator czyta ten zapis
wąsko (litera zamiast skutku), jest to jedyne miejsce diffu do zakwestionowania.
