STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-UI-LEFT-BANNER-CHIP-GRID-TOP-CLIP-Q1
GOAL: przy oknie 800×600 (lewy baner w trybie 2×3 `.hud-left-fallback`) siatka chipów `.hud-chip-grid` nie wystaje nad górną krawędź okna (była top = −6 px); przy 640×480 etykiety bez przycięcia; brak zmian układu od 1000×700 wzwyż.
ZMIANY-COMMIT: kod + test + raport w jednym commicie (SHA w polu sha wyniku Operatora).
  - gra/src/ui/hud.ts — jedna reguła CSS (ok. l.732–738, po bloku `@media (max-width:700px)` banera): `@media (max-height:699px){ .civ-hud .civ-hud-banner-left.hud-left-fallback>.civ-hud-banner-shell{height:88px;} }`. Zero zmian JS, zero zmian układu dla okna o wysokości ≥700 px.
  - gra/tools/left-banner-chip-grid-clip-test.cjs — NOWY test Chromium (prawdziwe showHud() z hud.ts, esbuild, Playwright), 1000×700 / 800×600 / 640×480 × 4 stany liczb; tryb `--mutant` cofa regułę (wstawia `max-height:0px`).
  - dyspozycje/autobot/runs/R-WEB-UI-LEFT-BANNER-CHIP-GRID-TOP-CLIP-Q1/10-operator-claude.md (ten plik)
  - dyspozycje/autobot/runs/R-WEB-UI-LEFT-BANNER-CHIP-GRID-TOP-CLIP-Q1/evidence/{base,a2}-{800x600,640x480}-srednie.png (przed/po, zrzuty obejrzane)
  - Brak zmian w sidePanelLayout.ts (nie był potrzebny), brak zmian gry/danych, WERSJE.md nietknięte.

PRZYCZYNA (zmierzona, nie zgadywana): w trybie 2×3 siatka ma ~87–99 px wysokości, a `.civ-hud-banner-shell` ma stałe `height:56px` (reguła ~l.747). Flex `align-items:center` wysrodkowuje siatkę, więc przy 800×600 jej górna krawędź wypada na y = 16 + (56−99)/2 = −6.

POMIAR PRZED (HEAD 7aaa231d6, prawdziwe showHud, skrypt scratchpad/measure-banner.cjs):
| okno / stan | powłoka t–b (h) | siatka t–b | elementy poza oknem |
|---|---|---|---|
| 800×600 male/srednie/duze/deficyt | 16–72 (56) | −6 – 94 | 13 (hud-chip-grid, chip, chip-body, chip-top, chip-lbl…) |
| 640×480 male/srednie/duze/deficyt | 16–72 (56) | 1 – 87 | 0 |
| 1000×700 male/srednie/duze/deficyt | 16–72 (56) | 2 – 86 (duze 9–79) | 0 |

POMIAR PO (ten commit):
| okno / stan | powłoka t–b (h) | siatka t–b | elementy poza oknem | przycięte etykiety/komórki |
|---|---|---|---|---|
| 800×600 wszystkie 4 | 16–104 (88) | 10 – 110 | 0 | 0 |
| 640×480 wszystkie 4 | 16–104 (88) | 17 – 103 | 0 | 0 |
| 1000×700 wszystkie 4 | 16–72 (56) | bez zmian | 0 | 0 |

Porównanie 1000×700 przed/po: dla 4 stanów pełny zapis pomiaru (powłoka, siatka, każda etykieta, scroll dokumentu) jest IDENTYCZNY (porównanie JSON, 4/4 równe, 0 różnic).
Pozycje komórek 800×600 są identyczne dla stanów małych i dużych liczb (wymóg z testu hud-topbar-grid-gross-net).

DLACZEGO 88 PX, A NIE `height:auto` (odrzucona wcześniejsza wersja): (1) `height:auto` z numerami dużymi (`duze`) zmieniało pozycje komórek — test hud-topbar-grid-gross-net czerwienił 800 px („Handel” y 59,8 vs 53,8); (2) połączenie `flex-direction:row` dla plusów zwężało komórki i ikony medalionów spadały do 9 px (test hud-gross-net-rest 640/huge). Stała wysokość 88 px nie zależy od liczb i nie rusza szerokości.
Dół powłoki = 104 px = `SIDE_PANEL_TOP` (ta sama granica, którą pilnuje hud-panels-below-banner-test). Siatka wystaje o ~6 px poniżej powłoki przy 800×600 — tak samo jak już wystaje o ~14 px przy 1000×700 w ustalonym układzie; to świadoma konsekwencja, nie nowa klasa błędu.

TESTY:
- NOWY left-banner-chip-grid-clip-test.cjs: PASS 64 ok / 0 fail (po zmianie). Mutant (`--mutant`): FAIL — 4 fail, wszystkie „zaden element lewego banera poza oknem” przy 800×600 (exit 1). Test czerwienieje na cofniętej regule → nie jest tautologiczny.
- hud-panels-below-banner-test.cjs: PASS 130/0 (po; nie uruchomiono osobno na bazie).
- hud-topbar-layout-a-test.cjs: PASS 144/0 (po).
- hud-topbar-one-row-test.cjs: PASS 140/0 (po).
- hud-topbar-no-labels-test.cjs: PASS 94/0 (baza 94/0; wersja z regułą `height:auto` dała 2 FAIL — odrzucona).
- hud-topbar-grid-gross-net-test.cjs: exit 0, „OK … (1150 ok, 0 fail)” (po); baza exit 0 (zmierzona na HEAD).
- hud-gross-net-rest-test.cjs: exit 0, „OK … (820 ok, 0 fail)” (po); baza exit 0.
- hud-number-abbrev-test.cjs: OK (po).
- left-banner-overflow-narrow-test.cjs: PASS (1024/1280 bez błędów strony) (po).
- city-side-panels-below-topbanners-test.cjs: PASS (po).
- hud-topbar-bigger-numbers-real-render-test.cjs: exit 2 — wymaga pliku `gra/src/ui/hud.__base.ts` z commita 4905bac05, którego brak w repo. NIE_ZMIERZONO: błąd środowiskowy/pre-existing, nie zależy od tej zmiany (test kończy się przed pomiarem).
- `node ./node_modules/typescript/bin/tsc --noEmit` (gra/): exit 0 (po).
- 5 bramek referencyjnych z R-PROC-AUTOBOT §6 (TypeScript, Logika, Drzewo technologii, Badania, Wymiana jednostek, Walka, Moc jednostek): NIE uruchomione w tym temacie. Zmiana to jedna reguła CSS w bloku HUD, która nie dotyka logiki gry; tsc (bramka TypeScript) — zielony. Jeżeli Evaluator chce pełnej serii, wymagane osobne uruchomienie.
- `npm run build/dev`: NIE uruchamiane (zakaz). Nie budowano bundla.

BLOKADY: brak blokad kodu. Luki rozstrzygnięte założeniem:
  (1) DODATEK-claude.md (`00-dispatch-DODATEK-claude.md`) nie istnieje na gałęzi origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0 (ls-tree pokazuje tylko 00-dispatch.md); dispatch główny też nie jest na origin/main, tylko na tej gałęzi. Przyjęto treść z 00-dispatch.md (GOAL, KRYTERIA a–e, ALLOWLISTA, ZAKAZY).
  (2) KRYTERIUM (e) „układ ≥1000×700 bez zmian” zrealizowane jako porównanie pełnego pomiaru przed/po (4/4 identyczne).
  (3) Etykieta „Spichlerz” przycięta po prawej przy 640×480 (opis dispatchu) NIE została odtworzona: pomiar etykiet (scrollWidth vs clientWidth oraz prawa krawędź etykiety vs komórki) dał 0 przycięć dla 4 stanów przed zmianą; zrzut evidence/base-640x480-srednie.png pokazuje pełny tekst „Spichlerz”. Możliwe, że przycięcie dotyczy innej wartości/szerokości; NIE_ZMIERZONO dla wartości dłuższych niż używane w fixture.
  (4) Pomiar w trybie „live” pełnej gry (vite dev/build poza repo, skrypt W24 z commita refs/keep) nie był dostępny w tej sesji — pomiar prowadzony na prawdziwym showHud()/fitHudTopbar() z hud.ts (ten sam kod, bez całej gry). Dowód na żywo w grze: NIE_ZMIERZONO.

RUNDY: 1/5
NASTĘPNY KROK: Evaluator (Sonnet) — sprawdzić: (a) zrzuty evidence/*.png; (b) mutant FAIL; (c) 5 bramek referencyjnych z §6 na tym commicie (poza zakresem Operatora); (d) czy dla 640×480 etykieta „Spichlerz” ma przypadek przycięcia, którego fixture nie pokrywa.
DEPLOY/PUSH: NIE WYKONANO
UWAGI-DLA-ORKIESTRATORA:
  - W gałęzi origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0 brakuje pliku DODATEK (patrz BLOKADY 1); orkiestrator może go dodać lub potwierdzić, że dispatch jest kompletny w 00-dispatch.md.
  - Pomiarowy skrypt scratchpad (measure-banner.cjs) nie jest w repo; test w repo to left-banner-chip-grid-clip-test.cjs.
  - Przy `npm ci` w gra/ zainstalowano node_modules (gitignored), nie commitowane.
