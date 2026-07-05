# Rejestr UX — master (składany przez Grupy A–E)

**Status ogólny:** 🟡 **A + B + D GOTOWE** — czeka C, E  
**Ostatnia aktualizacja:** 2026-07-01 (Grupa A, 30 wpisów) · 2026-06-26 (B) · 2026-06-29 (D)  
**Katalog HTML:** [`UI/Katalog-UX-wszystkie-panele.html`](../../UI/Katalog-UX-wszystkie-panele.html) — **60 wpisów A–E**, tabela master + iframe makiet + linki Gra-podglad*

Legenda statusów: **G** gotowe · **M** mockup · **P** placeholder · **?** do uzupełnienia przez grupę

---

## Grupa A — Mapa / HUD

**Ostatnia aktualizacja:** 2026-07-01 · **Autor:** lane Grupa A (Composer / inwentaryzacja UX)  
**Status:** inwentaryzacja gotowa · 2026-07-01 · Grupa A

| ID | Nazwa UX | Kiedy widoczny (trigger) | Moduł TS / HTML | Mockup HTML | W main.ts? | Status | Jak zobaczyć (playtest) |
|----|----------|---------------------------|-----------------|-------------|------------|--------|-------------------------|
| A-01 | HUD mapy (orkiestrator + pasek [A]) | Po wejściu na mapę (S2); cała rozgrywka | `gra/src/ui/hud.ts` | `UI/Makieta-HUD-D1B-preview.html` | tak `showHud` | gotowe | `Gra-podglad.html` → Nowa gra. Góra: zasoby 🍞💰🎭🛕👥 i ⚜ Wpływ; minimapa i dolny pasek widoczne od razu. |
| A-02 | Toolbar lewy [C] | Zawsze na mapie | `gra/src/ui/mapToolbarHud.ts` | tylko `Gra-podglad.html` | tak | gotowe | Lewa kolumna: 🏛 🦉 🎭 🛕 🏗 ⚔ 🤝 i cud. Klik otwiera panel lub włącza tryb/warstwę. |
| A-03 | Dolny pasek WYKONAJ / Koniec tury [I] | Zawsze na mapie (dół) | `gra/src/ui/bottomBarHud.ts` | tylko `Gra-podglad.html` | tak | gotowe | Dół: **WYKONAJ** (pomarańczowy przy blocking) i **Koniec tury**. Przy nierozstrzygniętych chipach koniec tury jest zablokowany. |
| A-04 | Panel wydarzeń — chipy [D] | Prawa strona mapy (tura bieżąca) | `gra/src/ui/sidePanelHud.ts` | tylko `Gra-podglad.html` | tak | gotowe | Zagraj kilka tur — chipy po prawej (nauka, miasto, dyplo). Klik otwiera cel; ✕ zamyka jeśli nie `blocking`. |
| A-05 | Minimapa [B] | Prawy górny róg HUD | `gra/src/ui/minimapHud.ts` | tylko `Gra-podglad.html` | tak | gotowe | Miniatura heksów w rogu. Klik przesuwa kamerę; etykieta tury obok minimapy. |
| A-06 | Panel jednostki [H] | Klik własnej jednostki (nie garnizon) | `gra/src/ui/unitPanelHud.ts` | `UI/Makieta-panel-jednostki.html` | tak | gotowe | Klik Hoplita na mapie → karta na dole: HP, statystyki, Ruch/Fortyfikuj/Rozdziel. ✕ lub klik pustej mapy zamyka. |
| A-07 | Badge stosu armii | Heks z ≥2 jednostkami gracza | `gra/src/ui/armyStackHud.ts` | tylko `Gra-podglad.html` | tak | gotowe | Dwie jednostki na jednym heksie → badge ×N. Klik zaznacza reprezentanta stosu. |
| A-08 | Tryb budowy ulepszeń 🔨 | Toolbar 🏗 | `gra/src/ui/buildModeHud.ts` | `Civ-MAPA/Gra-podglad-ULEPSZENIA.html` | tak | gotowe | Toolbar → 🏗 → lista typów (Farma, Droga…). Wybór typu + klik na mapę stawia ulepszenie. Esc wychodzi. |
| A-09 | Lista miast | Toolbar 🏛 (toggle) | `gra/src/ui/cityListHud.ts` | tylko `Gra-podglad.html` | tak | gotowe | Toolbar → 🏛 → lewy panel miast. Klik miasta → panel miasta (B). ✕ zamyka listę. |
| A-10 | Lista armii | Toolbar ⚔ (toggle) | `gra/src/ui/armyListHud.ts` | `UI/Makieta-panel-armii.html` | tak | mockup | Toolbar → ⚔ → stosy wojska. Działa w silniku; pełna makieta D7 w osobnym HTML. |
| A-11 | Lista dyplomacji HUD | Toolbar 🤝 (toggle) | `gra/src/ui/diploListHud.ts` | `UI/Makieta-dyplomacja.html` | tak | gotowe | Toolbar → 🤝 → lista cyw. Klik → panel dyplomacji (D). Chipy w pasku [A] też prowadzą tutaj. |
| A-12 | Overlay kultura / religia (podsumowanie) | Toolbar 🎭 lub 🛕 (pierwszy klik) | `gra/src/ui/empireOverlayHud.ts` | tylko `Gra-podglad.html` | tak | gotowe | 🎭 → modal sumy kultury i miast. 🛕 → modal religii państwa. Zamknięcie przyciskiem lub Esc. |
| A-13 | Overlay Power (Wpływ) | Klik ⚜ Wpływ w pasku [A] | `gra/src/ui/powerOverlayHud.ts` | tylko `Gra-podglad.html` | tak | gotowe | Klik **⚜ Wpływ** (środek górnego paska) → składniki Power, ranking, Respekt. |
| A-14 | Bilans imperium (panel) | Plan: po turze / skrót HUD | `gra/src/ui/empireBalance.ts` | — | **nie** | placeholder | Moduł gotowy, **nie wpięty** w `main.ts`. Bilans pośrednio w pasku [A]; panel „Bilans” na razie niewidoczny. |
| A-15 | Kursor / tooltip jednostki | Hover jednostki na mapie | `gra/src/ui/mapUnitCursor.ts` | tylko `Gra-podglad.html` | tak | gotowe | Najedź własną jednostkę → tooltip. Wróg → miecz; merge → spinacz; legalny ruch → żołnierz ze strzałką. |
| A-16 | Pre-bitwa (wejście z mapy) | Atak wroga z sąsiedniego heksu | `gra/src/ui/preBattle.ts` | `UI/Makieta-preBattle.html` | tak `showPreBattle` | gotowe | Zaznacz wojsko → klik wroga obok → modal warunków → Auto / Bitwa ręczna. |
| A-17 | Oblężenie na mapie C3 | Po Oblężaj / klik oblężonego miasta | `gra/src/ui/siegeMapPanel.ts` | tylko `Gra-podglad.html` | tak | gotowe | Jednostka przy walled city → oblężenie → panel u dołu: Szturm, Odwrót, machiny oblężnicze. |
| A-18 | Merge / split armii | Merge: ruch na własny stos; Split: panel [H] | `armyMergePanel.ts`, `armySplitPanel.ts` | tylko `Gra-podglad.html` | tak | gotowe | Merge: wejdź wojskiem na heks z sojusznikami → Połącz/Osobno. Split: stos ×2 → [H] → Rozdziel → wybór heksu. |
| A-19 | Powiadomienie zdobycia miasta | Capture bez bitwy (ST-2) | `gra/src/ui/cityCaptureNotice.ts` | tylko `Gra-podglad.html` | tak | gotowe | Atak pustego miasta wroga → tabliczka „Zdobyte” + OK (bez preBattle). |
| A-20 | Hint / toast | Błędy, placeholdery, podpowiedzi | `gra/src/main.ts` (`showHintMessage`) | tylko `Gra-podglad.html` | tak | gotowe | Np. toolbar Cuda → „po v1.0”; brak heksu do split → komunikat u góry mapy na ~3 s. |
| A-21 | Picker Miasto vs Jednostka | Klik własne miasto + wojsko na heksie (A2-Q5) | `gra/src/ui/cityUnitPick.ts` | tylko `Gra-podglad.html` | tak | gotowe | Wojsko na Testpolis → klik heksu → 🏛 Miasto \| ⚔ Jednostka (klaw. 1/2). Samo miasto → od razu panel. |
| A-22 | Wybór ataku miasta (Oblężaj / Szturm) | Atak miasta wroga z murem (C3-Q1) | `gra/src/ui/cityAttackChoice.ts` | tylko `Gra-podglad.html` | tak | gotowe | Jednostka obok walled city → akcja ataku → modal **Oblężaj** / **Szturm** / Anuluj (przed panelem A-17). |
| A-23 | Ghost budowy (3D + chip) | Tryb 🏗 + hover heksów | `gra/src/main.ts` (ghost + `#civ-build-ghost-chip`) | tylko `Gra-podglad.html` | tak | gotowe | W trybie budowy najedź heks — półprzezroczysty model + chip przy kursorze (zielony OK / czerwony blokada). |
| A-24 | Warstwa zasięgu kultury (mapa 3D) | Toolbar 🎭 — drugi klik (toggle) | `hud.ts` + `main.ts` | tylko `Gra-podglad.html` | tak | gotowe | 🎭 dwa razy — przycisk podświetlony, obwódka zasięgu kultury na heksach. Trzeci klik wyłącza. |
| A-25 | Warstwa zasięgu religii (mapa 3D) | Toolbar 🛕 — drugi klik (toggle) | `hud.ts` + `main.ts` | tylko `Gra-podglad.html` | tak | gotowe | Jak A-24 dla religii — warstwa na mapie, nie modal. |
| A-26 | Chipy dyplomacji w pasku [A] | sojusz / pakt / wojna > 0 | `gra/src/ui/hud.ts` | tylko `Gra-podglad.html` | tak | gotowe | Po wojnie z AI w górnym pasku chip „⚔ Wojna N”. Klik → lista dyplomacji (A-11). |
| A-27 | Modal dyplomacji blocking | Chip blocking [D] lub blokada końca tury | `gra/src/ui/diplomacyPendingHud.ts` | tylko `Gra-podglad.html` | tak | gotowe | Propozycja AI → chip blocking. Klik → Akceptuj/Odrzuć; wymagane przed **Koniec tury**. |
| A-28 | Hub badań (trigger toolbara) | Toolbar 🦉 | `gra/src/ui/scienceHubHud.ts` | mockup drzewka (archiwum) | tak | gotowe | Toolbar → 🦉 → hub bieżącej tech. „Pełne drzewko” → `sciencePicker` (szczegóły **B-14**). |
| A-29 | Menu ☰ z mapy | Pasek [A] → ☰ Menu | `hud.ts` → `mainMenu.ts` | `UI/Gra-podglad-MENU.html` | tak | gotowe | ☰ u góry po prawej → powrót do menu głównego (lane E). |
| A-30 | Cuda — placeholder | Toolbar ikona cudów | `mapToolbarHud.ts` | `UI/Makieta-cuda.html` | tak (toast) | placeholder | Klik cud → toast „Cuda — po v1.0”. Pełny ekran = plan po v1.0. |

**Poza zakresem A (cross-lane):** panel miasta (B-01…), drzewko tech (B-14), dyplomacja szczegółowa (D-01), bitwa 3D (C-02).

**Legacy:** `armyStackPrompt.ts` zastąpione przez `armyMergePanel.ts` (A-18).

**Status: inwentaryzacja gotowa · 2026-07-01 · Grupa A**  
**Baseline screenshoty:** `docs/ux/baseline/A/` · 8 PNG · 2026-07-01

---

## Grupa B — Miasto / ekonomia / nauka (panel)

**Ostatnia aktualizacja:** 2026-06-26 · **Autor:** Grupa B (lane UI)  
**Status:** UX-INWENTARZ **GOTOWE**

| ID | Nazwa UX | Kiedy widoczny (trigger) | Moduł TS / HTML | Mockup HTML (jeśli jest) | W main.ts? | Status | Jak zobaczyć (playtest) |
|----|----------|---------------------------|-----------------|---------------------------|------------|--------|-------------------------|
| B-01 | Ramka panelu miasta (Civ V) | Klik własne miasto (lub „Miasto” w pickerze A-21) | `gra/src/ui/cityUxFrame.ts`, `cityPanel.ts` | `Gra-podglad-OKOLICA-UX.html` | tak `showCityPanel` | GOTOWE | `Gra-podglad.html` → Nowa gra → klik miasto. Layout: lewo produkcja, środek mapa okolicy, prawo zakładki. |
| B-02 | Pasek zasobów miasta (góra) | Panel miasta — cały czas u góry | `cityPanel.ts` (`renderCivResourceTopBar`) | `Gra-podglad-OKOLICA-UX.html` | tak | GOTOWE | W panelu miasta: górny pasek z nazwą, garnizonem i scroll statów (👥 ⚔ 🍞 🔨 💰 nauka 🎭 🛕 ⚖). ✕ zamyka panel. |
| B-03 | Karta szczegółów — ludność | Klik chip 👥 na pasku | `cityPanel.ts` (`buildTopBarLudnoscDetailCard`) | — tylko Gra-podglad.html | tak | GOTOWE | Panel miasta → klik 👥. Karta z populacją, wzrostem i składnikami. |
| B-04 | Karta szczegółów — rekruci | Klik chip ⚔ na pasku | `cityPanel.ts` (`buildTopBarRekruciDetailCard`), `manpower.ts` | — | tak | GOTOWE | Panel miasta → klik ⚔. Pula/max rekrutów, regen/t, koszt werbu. |
| B-05 | Karta szczegółów — żywność | Klik chip 🍞 | `cityPanel.ts` (`buildTopBarZywnoscDetailCard`) | — | tak | GOTOWE | Panel miasta → klik 🍞. Zapasy imperium i bilans netto miasta. |
| B-06 | Karta szczegółów — praca | Klik pasek 🔨 | `cityPanel.ts` (`buildTopBarPracaDetailCard`) | — | tak | GOTOWE | Panel miasta → klik 🔨. Pula pracy imperium i podział budynki/ulepszenia. |
| B-07 | Karta szczegółów — skarb | Klik chip 💰 | `cityPanel.ts` (`buildTopBarZlotoDetailCard`) | — | tak | GOTOWE | Panel miasta → klik 💰. Skarbiec imperium + przychód miasta/t. |
| B-08 | Karta szczegółów — nauka | Klik chip Nauka | `cityPanel.ts` (`buildTopBarNaukaDetailCard`) | — | tak | GOTOWE | Panel miasta → klik etykietę nauki. Bank nauki + przyrost miasta. |
| B-09 | Karta szczegółów — kultura | Klik chip 🎭 | `cityPanel.ts` (`buildTopBarKulturaDetailCard`) | — | tak | GOTOWE | Panel miasta → klik 🎭. Tempo kultury i progi granic. |
| B-10 | Karta szczegółów — religia | Klik chip 🛕 | `cityPanel.ts` (`buildTopBarReligiaDetailCard`) | — | tak | GOTOWE | Panel miasta → klik 🛕. Religia państwowa i wierni w mieście. |
| B-11 | Garnizon na pasku górnym | Obok nazwy miasta w B-02 | `cityPanel.ts` (`renderTopBarGarrison`) | — | tak | GOTOWE | Panel miasta → 🛡 + licznik + chipy HP. Hover etykiety → dock „Garnizon — szczegóły” po lewej. |
| B-12 | Produkcja (lewa kolumna) | Panel otwarty — lewa kolumna | `cityPanel.ts` (`renderProd`) | `Gra-podglad-OKOLICA-UX.html` | tak | GOTOWE | Lewa kolumna: bieżący projekt, pasek, Wykup/Wstrzymaj/Usuń, kolejka budowy. |
| B-13 | Kolejka rekrutacji | Pod Produkcją | `cityPanel.ts` (`appendRecruitmentQueue`) | — | tak | GOTOWE | Dodaj jednostkę (⚔) → w Produkcji widać kolejkę rekrutacji pod budową. |
| B-14 | Rail ikon zakładek | Między lewą kolumną a mapą | `cityPanel.ts` (`renderCityIconRail`) | j.w. | tak | GOTOWE | Pionowe ikony 🏛️ ⚔ 🍞 💰 🔨 ⚖ ☤ 🎭 🛕 — klik zmienia treść pod okolicą. |
| B-15 | Budowa — dostępne | Zakładka 🏛️ (góra split) | `cityPanel.ts` (`renderBuildList`) | — | tak | GOTOWE | 🏛️ → lista „Dostępne do budowy” → Buduj dodaje do kolejki. |
| B-16 | Budowa — w mieście | Zakładka 🏛️ (dół split) | `cityPanel.ts` (`renderBuildingsOwned`) | — | tak | GOTOWE | 🏛️ → dolna lista zbudowanych + Ulepsz gdy dostępne. |
| B-17 | Rekrutacja jednostek | Zakładka ⚔ | `cityPanel.ts` (`renderPurchasableUnits`) | — | tak | GOTOWE | ⚔ → lista jednostek; rekrut lub kolejka przy braku MP. |
| B-18 | Spichlerz / magazyn | Zakładka 🍞 | `cityPanel.ts` (`renderMagazyn`) | — | tak | GOTOWE | Ikona chleba → magazyn, netto żywności, ETA wzrostu. |
| B-19 | Podział handlu | Zakładka 💰 | `cityPanel.ts` (`renderHandelSlidersPanel`) | — | tak | GOTOWE | 💰 → suwaki Skarb/Nauka/Zamożność; ℹ → karta algorytmu. |
| B-20 | Zamożność (Wealth) | Zakładka 💰, pod suwakami | `cityPanel.ts` (`renderWealth`) | — | tak | GOTOWE | 💰 → sekcja W, mnożnik skarbca, karta szczegółów po kliku. |
| B-21 | Podział pracy | Zakładka 🔨 | `cityPanel.ts` (`renderPodzialPracy`) | — | tak | GOTOWE | 🔨 → suwak budynki vs ulepszenia + chipy szacunków. |
| B-22 | Porządek / społeczeństwo | Zakładka ⚖ | `cityPanel.ts` (`renderSpoleczenstwo`), `orderPanel.ts` | — | tak | GOTOWE | ⚖ → Szczęście/Prawo/Porządek, chipy garnizonu, alert buntu. |
| B-23 | Zdrowie miasta | Zakładka ☤ (caduceus) | `cityPanel.ts` (`renderZdrowie`) | — | tak | GOTOWE | Ikona zdrowia → suma +/- i rozpiska linii. |
| B-24 | Kultura (panel) | Zakładka 🎭 | `cityPanel.ts` (`renderKultura`) | — | tak | GOTOWE | 🎭 → tempo kultury, promień granicy, progi. |
| B-25 | Religia (panel) | Zakładka 🛕 | `cityPanel.ts` (`renderReligia`) | — | tak | GOTOWE | 🛕 → wiara, presja, szerzenie w mieście. |
| B-26 | Okolica — pola | Prawa kolumna u góry (zawsze) | `cityPanel.ts` (`renderOkolica`) | `Gra-podglad-OKOLICA-UX.html` | tak | GOTOWE | „Zarządzanie polami” + mini-siatka; klik heks na mapie = 👤 assign (gdy silnik OK). |
| B-27 | Chrome mapy okolicy | Overlay na mapie 3D | `cityPanel.ts` (`renderCivMapChrome`) | — | tak | GOTOWE | Tabliczka nazwy + „Wróć na mapę”; hint WASD/scroll/Esc. |
| B-28 | Surowce w okolicy | Stopka prawej kolumny | `cityPanel.ts` (`renderSurowce`) | — | tak | GOTOWE | Dół prawej kolumny → ikony surowców w zasięgu. |
| B-29 | Dock hover — budynek | Hover miniatura w Buduj | `hoverDetailDock.ts`, `buildBuildingDetailCard` | — | tak | GOTOWE | 🏛️ → najedź ikonę budynku ~0,4 s → dock koszt/bonus/tech. |
| B-30 | Dock hover — jednostka + 3D | Hover miniatura w Rekrut | `hoverDetailDock.ts`, `unitMiniPreview.ts` | — | tak | GOTOWE | ⚔ → najedź miniaturę → staty + canvas 3D modelu. |
| B-31 | Dock szczegółów (ℹ sekcji) | Hover ℹ przy tytułach sekcji | `hoverDetailDock.ts` | — | tak | GOTOWE | ℹ przy handlu, okolicy, porządku → dock 280 px lewo/prawo. |
| B-32 | Panel porządku standalone | API bez wejścia w grze | `orderPanel.ts` (`showOrderPanel`) | — | nie | PLAN | Treść w B-22; standalone niewpięty w main. |
| B-33 | Hub badań (sowa) | Mapa — toolbar 🦉 | `scienceHubHud.ts` | — tylko Gra-podglad.html | tak `toggleScienceHubHud` | GOTOWE | Na mapie (poza panelem miasta) → 🦉 → cel, postęp, lista tech, przycisk drzewka. |
| B-34 | Drzewko tech (docked) | Hub → „Pełne drzewko” | `sciencePicker.ts` (`showSciencePickerDocked`) | — tylko silnik | tak | GOTOWE | Hub → pełne drzewko SVG; klik węzła = cel; tooltip hover. |
| B-35 | Drzewko tech (fullscreen) | Legacy przycisk nauki | `sciencePicker.ts` (`showSciencePicker`) | — | tak | GOTOWE | Alternatywa pełnoekranowa; flow v1.0 = B-34. |
| B-36 | Zarządca auto (legacy) | Stary drawer `#cs-manager` | `cityPanel.ts` | — | tak hook | PLACEHOLDER | W layoucie Civ V (B-01) brak ⚙; hook `onAutoManage` w silniku jest. |
| B-37 | Prev/next miasto (legacy) | Stary drawer `#cs-prev/next` | `cityPanel.ts` (`switchCity`) | — | tak | PLACEHOLDER | W layoucie Civ V brak strzałek; API w legacy skeleton. |

**Uwagi lane B:** flow v1.0 = **B-01…B-31** w panelu; nauka **B-33–B-35** na mapie (charter B). Picker miasto/jednostka → **A-21**. Mockup UX: `Gra-podglad-OKOLICA-UX.html`.

**Status: inwentaryzacja gotowa · 2026-06-26 · Grupa B (lane UI)**

---

## Grupa C — Walka

**Ostatnia aktualizacja:** 2026-06-30 · **Autor:** lane C (Grupa C)  
**Status:** UX-INWENTARZ **GOTOWE** · indeks mockupów: [`docs/grupa-c/04-mockupy-INDEX.md`](../grupa-c/04-mockupy-INDEX.md)

| ID | Nazwa UX | Kiedy widoczny (trigger) | Moduł TS / HTML | Mockup HTML | W main.ts? | Status | Jak zobaczyć (playtest) |
|----|----------|---------------------------|-----------------|-------------|------------|--------|-------------------------|
| C-01 | Ekran przed bitwą (Total War) | Atak / obrona jednostki z mapy (potyczka) | `gra/src/ui/preBattle.ts` | `UI/Makieta-preBattle.html` | tak `showPreBattle` | GOTOWE | `Gra-podglad.html` → Nowa gra → zaznacz wojsko → atak wroga na sąsiednim heksie. Pojawi się pełnoekranowy panel ze składami, prognozą i bonusami. |
| C-02 | Przycisk „Auto” (natychmiastowy wynik) | Wewnątrz C-01 | `gra/src/ui/preBattle.ts` | `UI/Makieta-preBattle.html` | tak (callback `onAuto`) | GOTOWE | W pre-battle kliknij **Auto** (⚡) lub Enter (domyślnie). Walka rozstrzyga się od razu na mapie — bez pola 3D. |
| C-03 | Przycisk „Bitwa ręczna” / pole 3D | Wewnątrz C-01 | `gra/src/ui/preBattle.ts` | `UI/Makieta-preBattle.html` | tak (callback `onManual`) | GOTOWE | W pre-battle kliknij **Bitwa ręczna** (⚔) lub Enter (gdy ustawiony tryb manual). Otwiera się overlay bitwy 3D z fazą deploymentu. |
| C-04 | Wybór: oblężenie vs szturm (miasto z murem) | Atak wrogiego miasta z murem — pierwszy klik | `gra/src/ui/cityAttackChoice.ts` | tylko `Gra-podglad.html` | tak `showCityAttackChoice` | GOTOWE | `Gra-podglad.html` → wojsko przy wrogim mieście z 🛡 → klik miasto → modal **Oblężaj** / **Szturm**. Szturm prowadzi przez C-01 do bitwy z murem. |
| C-05 | Panel oblężenia na mapie (C3) | Po wyborze „Oblężaj” lub klik obleganego miasta | `gra/src/ui/siegeMapPanel.ts` | tylko `Gra-podglad.html` | tak `showSiegeMapPanel` | GOTOWE | Kontynuuj oblężenie z C-04 → panel **Oblężenie** (zapasy, machiny, tura). Przycisk **Szturm** uruchamia C-01 z pełnym składem oblężenia. |
| C-06 | Faza deploymentu (ustawienie wojsk) | Start bitwy 3D z `deploy: true` | `gra/src/battle/battleScene.ts` (`_buildDeployOverlay`) | `Gra-podglad-BITWA.html` | tak | GOTOWE | Po C-03 lub klawisz **T** w grze → overlay **USTAW WOJSKA**: formacje F1–F3, przeciąganie atakujących, **▶ Start walki**. |
| C-07 | Pole bitwy 3D (canvas) | Po deploymentcie lub bitwa bez deploy | `gra/src/battle/battleScene.ts` | `Gra-podglad-BITWA.html` | tak `BattleScene` | GOTOWE | Otwórz `Gra-podglad-BITWA.html` w przeglądarce (preset testowy) albo wejdź z mapy przez C-03. Widzisz heksowe pole, figurki 3D i kamerę. |
| C-08 | Górny pasek HUD bitwy | Cała bitwa 3D | `gra/src/battle/battleScene.ts` (`_topBar`) | `Gra-podglad-BITWA.html` | tak | GOTOWE | W trakcie bitwy — górny pasek: numer tury, prędkość ×N, paski morale obu armii, licznik strat, badge pauzy. |
| C-09 | Dolny pasek komend | Cała bitwa 3D | `gra/src/battle/battleScene.ts` (cmdBar) | `Gra-podglad-BITWA.html` | tak | GOTOWE | Dół ekranu: **P** pauza, **S** prędkość, **R** AUTO/reczne, STOP, wycofanie, **H** paski, **M** dźwięk, **POMIN**. |
| C-10 | Wskaźnik prędkości (lewy górny) | Cała bitwa 3D | `gra/src/battle/battleScene.ts` (`speedHud`) | `Gra-podglad-BITWA.html` | tak | GOTOWE | Podczas bitwy w lewym górnym rogu mapy 3D: etykieta **Predkosc: Nx** (zsynchronizowana z **S** / cyklem 1→512). |
| C-11 | Log starć bitewnych | Cała bitwa 3D | `gra/src/battle/battleScene.ts` (`clashLog`) | `Gra-podglad-BITWA.html` | tak | GOTOWE | Prawy górny róg pola — panel z ostatnimi zadaniami obrażeń („X → Y: −N HP”). Przyspiesz bitwę (**S**) żeby szybciej zapełnić log. |
| C-12 | Paski morale armii (boki ekranu) | Cała bitwa 3D | `gra/src/battle/battleScene.ts` (`_updateArmyMoraleBars`) | `Gra-podglad-BITWA.html` | tak | GOTOWE | Pionowe paski po lewej (atak) i prawej (obrona) — aktualizują się po stratach. Spadnięcie morale poniżej progu kończy bitwę. |
| C-13 | Paski HP / morale / amunicja nad figurkami | Bitwa 3D, domyślnie włączone | `gra/src/battle/battleScene.ts` (billboardy 3D) | `Gra-podglad-BITWA.html` | tak | GOTOWE | Nad każdą jednostką mini-pasek HP (i morale dla wybranych typów). Klawisz **H** lub ikona 📊 w pasku komend przełącza widoczność. |
| C-14 | Baner trybu AUTO / RĘCZNE | Po przełączeniu **R** | `gra/src/battle/battleScene.ts` (`modeBanner`) | `Gra-podglad-BITWA.html` | tak | GOTOWE | W bitwie kliknij 🎮 (**R**) — u góry środka pojawia się **TRYB: AUTO** lub **TRYB: RECZNE**. W RECZNYM możesz zaznaczać własne jednostki. |
| C-15 | Panel zaznaczonej jednostki (rozkazy) | Tryb RĘCZNY — klik / box-select | `gra/src/battle/battleScene.ts` (`_selPanel`, `_updateSelectedPanel`) | `Gra-podglad-BITWA.html` | tak | GOTOWE | **R** → klik własną jednostkę → prawy panel: HP, morale, STOJ/WYC, Grupuj, F1–F3, Kituj/Strzał (łucznicy). Znane drobne UX do poprawy (decyzja C2-UX-defer). |
| C-16 | Dolny roster jednostek | Tylko tryb RĘCZNY | `gra/src/battle/battleScene.ts` (`_buildRosterBar`) | `Gra-podglad-BITWA.html` | tak | GOTOWE | Po **R** na dole pojawia się pasek kart jednostek gracza. Klik karty zaznacza; Ctrl+drag scala rannych (Q7). |
| C-17 | Minimapa bitwy | Cała bitwa 3D (lewy dół) | `gra/src/battle/battleScene.ts` (`_minimapWrap`) | `Gra-podglad-BITWA.html` | tak | GOTOWE | Lewy dolny róg — miniatura siatki; przeciągnij żeby przesunąć kamerę. Działa równolegle z głównym widokiem 3D. |
| C-18 | Tooltip jednostki (hover) | Najazd kursorem na figurkę ~0,3 s | `gra/src/battle/battleScene.ts` (`_hoverTooltip`) | `Gra-podglad-BITWA.html` | tak | GOTOWE | W bitwie najedź na jednostkę — dymek z nazwą, HP i typem. Znika po zjechaniu kursorem. |
| C-19 | HUD muru i bramy (oblężenie) | Bitwa z opcją `siege` (mur aktywny) | `gra/src/battle/battleScene.ts` (`siegeHudDiv`) · meshe: `gra/src/battle/siegeWall.ts` | `Gra-podglad-OBLEZENIE-BITWA.html` | tak | GOTOWE | Otwórz `Gra-podglad-OBLEZENIE-BITWA.html` lub szturm miasta z murem (C-04→C-01). U góry pola: pasek **Brama** + HP segmentu muru; tarany/wieże niszczą mur. |
| C-20 | Mur 3D na polu bitwy | Jak C-19 | `gra/src/battle/siegeWall.ts` + `battleScene.ts` | `Gra-podglad-OBLEZENIE-BITWA.html`, `Gra-podglad-MUR-BITWA.html` | tak | GOTOWE | W preview oblężenia — mur obrońcy z bramą i stylem cywilizacji. Obrońcy mogą stać na murze; po wyburzeniu — przejście. |
| C-21 | Ekran końca bitwy | Morale armii / brak jednostek / POMIN | `gra/src/battle/battleScene.ts` (`_showEndScreen`) | `Gra-podglad-BITWA.html` | tak | GOTOWE | Doprowadź bitwę do końca (lub **POMIN**) → środkowy panel: zwycięzca, statystyki strat, **Szczegóły** i **Zakończ bitwę**. |
| C-22 | Baner flash wyniku | Moment rozstrzygnięcia (przed C-21) | `gra/src/battle/battleScene.ts` (`_showResultBanner`) | `Gra-podglad-BITWA.html` | tak | GOTOWE | Tuż przed panelem końcowym — krótki napis **Zwycięstwo atakującego/obrońcy!** na środku ekranu (fade, bez kliknięcia). |
| C-23 | Modal szczegółów bitwy | Klik **Szczegóły** w C-21 | `gra/src/battle/battleScene.ts` (`_showEndDetails`) | tylko `Gra-podglad.html` | tak | GOTOWE | Po zakończeniu bitwy → **Szczegóły** → rozwinięta lista jednostek (padli / ocalał) z logiem starć. |
| C-24 | Skrót testowy bitwy (**T**) | Gra na mapie — klawisz T | `gra/src/main.ts` `launchTestBattle` · dane: `gra/src/battle/testBattle.ts` | `Gra-podglad-BITWA.html` | tak | GOTOWE | `Gra-podglad.html` → start gry → **T** → preset Rzym vs Grecja z deploymentem. Szybki smoke całego UI C-06–C-21 bez szukania wroga. |
| C-25 | Playtest walki (`?playtest=walka`) | URL z parametrem — większy skład + preset Macieja | `gra/src/main.ts` · `Gra-podglad-PLAYTEST-WALKA.html` | `Gra-podglad-PLAYTEST-WALKA.html` | tak | GOTOWE | Otwórz `Gra-podglad-PLAYTEST-WALKA.html` → gra od razu w trybie playtestu. **T** ładuje preset `maciej_playtest` (duży skład). |
| C-26 | Mockup panelu armii (D7) | Osobny HTML — nie w silniku | — | `UI/Makieta-panel-armii.html` | nie | MOCKUP | Otwórz plik w przeglądarce — design reference listy armii (decyzja D7=B odłożona). W grze tymczasowo: toolbar ⚔ → `armyListHud.ts` (lane A). |
| C-27 | Mockup paska armii | Osobny HTML — nie w silniku | — | `Civ-UNITS/Makieta-pasek-armii.html` | nie | MOCKUP | Otwórz `Civ-UNITS/Makieta-pasek-armii.html` — wizualizacja paska składu armii; brak wpiecia w kanon. |
| C-28 | ManualBattle (alternatywna bitwa ręczna) | Nie podpięte — moduł gotowy | `gra/src/battle/manualBattle.ts` | tylko `Gra-podglad.html` (brak entry) | nie | PLACEHOLDER | Klasa istnieje (`README-manualBattle.md`), ale **main.ts** używa wyłącznie `BattleScene`. Podgląd możliwy dopiero po integracji SILNIK. |

**Uwagi lane C:** główny flow v1.0 = **C-01 → C-03 → C-06 → C-07–C-21**. Flow oblężenia = **C-04 → C-05 → C-01 → C-19/C-20**. Poprawki UX zaznaczania/ataku w trybie ręcznym = odłożone (**C2-UX-defer**, nie P0).

**Status: inwentaryzacja gotowa · 2026-06-30 · lane C**

---

## Grupa D — Cywilizacje / dyplomacja

**Ostatnia aktualizacja:** 2026-06-29 · **Autor:** lane CYW (Grupa D)  
**Status:** UX-INWENTARZ **GOTOWE**

| ID | Nazwa UX | Kiedy widoczny (trigger) | Moduł TS / HTML | Mockup HTML | W main.ts? | Status | Jak zobaczyć (playtest) |
|----|----------|---------------------------|-----------------|-------------|------------|--------|-------------------------|
| D-01 | Panel relacji (legacy) | Przycisk „⚔️ Dyplomacja” góra-prawo (poza layoutem D1B) | `gra/src/ui/diplomacyPanel.ts` | `UI/Makieta-dyplomacja.html` | tak `showDiplomacyPanel` | WPIĘTE | Gra-podglad → gra → przycisk Dyplomacja (prawy górny róg) → lista relacji + „Audiencja” |
| D-02 | Lista dyplomacji (D1B) | Toolbar mapy → 🤝 Dyplomacja | `gra/src/ui/diploListHud.ts`, `mapToolbarHud.ts` | — | tak `createDiploListHud` / `toggleDiploListFromToolbar` | GOTOWE | Nowa gra → na mapie klik 🤝 w lewym toolbarze → lista cywilizacji z tierem |
| D-03 | Audiencja dyplomatyczna | Klik cywilizacji z D-02 lub „Audiencja” w D-01 | `gra/src/ui/diplomacyAudience.ts` | — | tak `openDiplomacyAudience` | GOTOWE | 🤝 → wybierz cywilizację z kontaktem → pełnoekranowa audiencja (portrety, Zaufanie, Respekt) |
| D-04 | Karty akcji audiencji (12) | Wewnątrz D-03 | `diplomacyAudience.ts` + `main.ts` `buildAudienceActions` | — | tak | GOTOWE | Audiencja → aktywne: kontakt (1), wojna (11), pokój (10), handel (5); reszta szara „v1.1” |
| D-05 | Modal potwierdzenia wojny | Akcja „11. Wojna” w audiencji | `diplomacyAudience.ts` `showWarConfirmModal` | — | tak | GOTOWE | Audiencja → Wojna → modal „Na pewno wypowiadasz wojnę …?” → Tak/Anuluj |
| D-06 | Modal propozycji AI | Koniec tury — blocking event `diplo-pend-*` | `gra/src/ui/diplomacyPendingHud.ts` | — | tak `showDiplomacyPendingModal` | GOTOWE | Gra do momentu propozycji AI (handel/pokój) → modal Akceptuj/Odrzuć blokuje „Koniec tury” |
| D-07 | Chip dyplomacji (side panel) | Tura: oczekująca propozycja AI | `gra/src/ui/sidePanelHud.ts` + `main.ts` `collectTurnEvents` | — | tak (via `hud.ts`) | GOTOWE | Side panel prawo → chip dyplomacji → otwiera D-06 |
| D-08 | Toasty dyplomacji | Po akcji audiencji / wojnie / pokoju | `main.ts` `showHintMessage` | — | tak | GOTOWE | Audiencja → wojna/pokój/handel → komunikat u dołu ekranu ~3–4 s |
| D-09 | Sekcja wojen obcych | Panel D-01 — wywiad | `diplomacyPanel.ts` `getKnownWarsBetweenOthers` | — | tak | GOTOWE | D-01 → sekcja „Wojny (wywiad)” gdy AI walczy między sobą |
| D-10 | Game Over (zwycięstwo/przegrana) | Koniec tury — `checkVictory` | `main.ts` `showGameOverOverlay` (inline) · logika `victory.ts` | — | tak | WPIĘTE | **Cross E:** UI w main; typy zwycięstwa D. Dominacja/nauka/przegrana → overlay + „Nowa gra” |
| D-11 | Wybór cywilizacji (kreator) | Menu → Nowa gra → krok „Cywilizacja” | `gra/src/ui/newGameFlow.ts` (krok 3) · dane `civs.json` | w `Gra-podglad.html` | tak | GOTOWE | **Cross E:** plik E, dane/roster D. Krok 3 → ikony 9 typów + podgląd klastra |
| D-12 | Podgląd klastra startowego | Kreator krok 3–5 | `newGameFlow.ts` `appendKlasterBlock` · `buildStartPreview` | — | tak | GOTOWE | Kreator → po wyborze cyw. blok „Start w klastrze typu” (stolica, rywale, obce typy) |
| D-13 | Barbarzyńcy / obozy | Od tury startu — tylko mapa 3D | `barbarians.ts` + render jednostek (UNITS/MAPA) | — | tak (logika) | BRAK PANELU | Brak dedykowanego UI — obozy i jednostki na heksach; epoka ≥ Średniowiecze = buntownicy |
| D-14 | Bonusy cywilizacji w UI | Plan: preBattle / panel miasta | handoff `CYWILIZACJE-do-UI_bonusy-wyswietlanie.md` | — | nie | PLAN | **Cross UI** — moduł D gotowy (`civ-bonusy.ts`), wyświetlanie jeszcze nie wpięte |
| D-15 | Mockup dyplomacji (referencja) | Osobny HTML — nie w silniku | — | `UI/Makieta-dyplomacja.html` | nie | MOCKUP | Otwórz plik w przeglądarce (design reference, nie kanon gry) |

**Uwagi lane D:** główny flow v1.0 = **D-02 → D-03 → D-04/D-05**. Stary **D-01** nadal dostępny przyciskiem legacy. Tier 2–3 dyplomacji (NAP, sojusz, negocjacje) = karty disabled „v1.1”.

**Status: UX-INWENTARZ GOTOWE · 2026-06-29 · lane CYW**

---

## Grupa E — Meta / menu / start

**Ostatnia aktualizacja:** 2026-06-26 · **Autor:** lane E (inwentaryzacja UX)  
**Status:** UX-INWENTARZ **GOTOWE**

| ID | Nazwa UX | Kiedy widoczny (trigger) | Moduł TS / HTML | Mockup HTML | W main.ts? | Status | Jak zobaczyć (playtest) |
|----|----------|---------------------------|-----------------|-------------|------------|--------|-------------------------|
| E-01 | Menu główne | Start aplikacji / powrót z gry (reload) | `gra/src/ui/mainMenu.ts` · parametry `gra/data/ui-params.json` | tylko `Gra-podglad.html` · ref. wizualna `UI/Gra-podglad-MENU.html` (ARCHIWUM) | tak `showMainMenu` | GOTOWE | Otwórz `Gra-podglad.html` — od razu pełnoekranowe menu z emblematem, wideo/tłem i przyciskiem „Rozpocznij grę”. |
| E-02 | Panel „Więcej” | Menu główne → przycisk „Więcej ▾” | `mainMenu.ts` (sekcja `#cm-more`) | tylko `Gra-podglad.html` | tak | GOTOWE | W menu kliknij **Więcej** — rozwija Kontynuuj, Wczytaj, O grze, Wyjdź oraz skróty playtest dev. |
| E-03 | Ustawienia globalne | Menu → **Ustawienia** | `mainMenu.ts` · dane `ui-params.json` → `menu.ustawienia` | tylko `Gra-podglad.html` | tak | WPIĘTE | Menu → Ustawienia → siatka 6 suwaków (muzyka, efekty, grafika, język, skala UI, mgła). **Uwaga:** część opcji to UI-only — bramka audio/języka w silniku niepełna. |
| E-04 | Toast „Wkrótce” | Klik Kampania / Multiplayer w menu | `mainMenu.ts` `showToast` | — | tak | PLACEHOLDER | Menu → **Kampania** lub **Multiplayer** — krótki komunikat u dołu ekranu (~2,5 s), bez przejścia dalej. |
| E-05 | Kontynuuj / Wczytaj grę | Menu → Więcej (gdy istnieje autosave) | `mainMenu.ts` · zapis `gra/src/game/save.ts` · wczytanie `main.ts` `doLoadGame` | tylko `Gra-podglad.html` | tak | WPIĘTE | Rozegraj turę i zapisz (Ctrl+S) lub autosave → wróć do menu → **Kontynuuj** / **Wczytaj grę**. Brak osobnego pickera slotów — tylko slot `autosave`. |
| E-06 | O grze | Menu → Więcej → **O grze** | `mainMenu.ts` · callback `onAbout` w `main.ts` | — | tak (pusty stub) | PLACEHOLDER | Klik **O grze** — obecnie brak ekranu (callback pusty). Docelowo ekran About w `mainMenu.ts`. |
| E-07 | Wyjdź | Menu → Więcej → **Wyjdź** | `mainMenu.ts` · `onQuit` w `main.ts` | — | tak (pusty stub) | PLACEHOLDER | Przycisk widoczny; w wersji HTML w przeglądarce nie zamyka okna (brak implementacji). |
| E-08 | Kreator — krok 1 Intro | Menu → Rozpocznij grę | `gra/src/ui/newGameFlow.ts` (krok 1) | ref. `UI/Makieta-flow-nowa-gra.html` (ARCHIWUM) | tak `showNewGameFlow` | GOTOWE | Menu → **Rozpocznij grę** → ekran „NOWA GRA” z opisem flow → **Rozpocznij konfigurację →**. Pasek kroków: Intro · Epoka · Cywilizacja · Ustawienia · Start. |
| E-09 | Kreator — krok 2 Epoka startowa | Kreator krok 2 | `newGameFlow.ts` · epoki + filtr `epokiStartowe` z `civs.json` | tylko `Gra-podglad.html` | tak | GOTOWE | Krok 2 → wybierz **Kamień / Brąz / Żelazo** (badge „X cyw.”). Celtowie/Germanie dostępni od Brązu. **Dalej** aktywne gdy epoka ma cywilizacje. |
| E-10 | Kreator — krok 3 Wybór cywilizacji | Kreator krok 3 | `newGameFlow.ts` · dane `civs.json` | tylko `Gra-podglad.html` | tak | GOTOWE | Krok 3 → siatka ikon cywilizacji + panel szczegółów (bonusy, jednostka spec., klaster startu). **Cross D-11** — roster i dane z lane CYW. |
| E-11 | Kreator — krok 4 Ustawienia rozgrywki | Kreator krok 4 | `newGameFlow.ts` · `ui-params.json` → `nowa_gra.ustawienia` | tylko `Gra-podglad.html` · szkic E2 `UI/Gra-podglad-KREATOR-E2.html` (dev bundle, nie mockup statyczny) | tak | GOTOWE | Krok 4 → trudność, rozmiar mapy, typ świata, prędkość, miasta-państwa, typy cyw. na mapie + podgląd startu. **ROZPOCZNIJ GRĘ** → krok 5. |
| E-12 | Kreator — modal Zaawansowane opcje | Kreator krok 4 → **Zaawansowane opcje** | `newGameFlow.ts` `showAdvancedModal` | — | tak | GOTOWE | Krok 4 → **Zaawansowane opcje** → seed, gęstość surowców/rzek/pustyni/lasów, warunki zwycięstwa, barbarzyńcy, bitwy ręczne, mgła debug. **Zastosuj** zamyka modal. |
| E-13 | Kreator — krok 5 Generowanie świata | Po **ROZPOCZNIJ GRĘ** (krok 5) | `newGameFlow.ts` `renderGenStep` · start mapy `main.ts` `doStartGame` | tylko `Gra-podglad.html` | tak | GOTOWE | Krok 5 → animacja heksów + podsumowanie parametrów → silnik generuje mapę i przechodzi do rozgrywki 3D. |
| E-14 | Nawigacja kreatora (Wstecz / Dalej) | Kroki 2–4 kreatora | `newGameFlow.ts` (pasek `.nav`) | — | tak | GOTOWE | Kroki 2–3: **Wstecz** / **Dalej**; krok 4: **Wstecz** + przycisk startu w treści. Ukończone kroki w pasku górnym można klikać (skok wstecz). |
| E-15 | Ekran zwycięstwa / porażki | Koniec tury — spełniony warunek w `checkVictory` | `main.ts` `showGameOverOverlay` · logika `gra/src/game/victory.ts` | tylko `Gra-podglad.html` | tak | WPIĘTE | Dominacja typu / nauka (rakieta) / utrata miast i osadników → pełnoekranowy overlay (złoty = wygrana, czerwony = porażka) + **Nowa gra** (reload). **Cross D-10** — typy zwycięstwa z lane CYW. |
| E-16 | Skróty playtest dev | Menu → Więcej (tylko w bundlu dev) | `mainMenu.ts` · starty `main.ts` `doStartPlaytest*` | tylko `Gra-podglad.html` | tak | GOTOWE | Menu → Więcej → **Playtest walki** / **Playtest miasta** / **Playtest mapy** — pomija kreator, wchodzi w scenariusz testowy. |
| E-17 | Hub mockupów UI (START) | Osobny HTML — nie w silniku | — | `UI/Makieta-START.html` | nie | MOCKUP | Otwórz plik w przeglądarce — indeks linków do katalogu UX i pojedynczych makiet (nie kanon gry). |
| E-18 | Mockup flow nowa gra (archiwum) | Osobny HTML — wycofany | — | `UI/_archiwum/Makieta-flow-nowa-gra_legacy-mock-2026-06-29.html` | nie | ARCHIWUM | Tylko referencja wizualna sprzed wpięcia kreatora w silnik; kanon = `newGameFlow.ts` w `Gra-podglad.html`. |
| E-19 | Mockup menu (archiwum) | Osobny HTML — wycofany | — | `UI/_archiwum/Gra-podglad-MENU_legacy-mock-2026-06-29.html` | nie | ARCHIWUM | Stary statyczny podgląd menu; kanon = `mainMenu.ts`. |
| E-20 | Mockup cudów świata | Plan toolbar / osobny HTML | — | `UI/Makieta-cuda.html` | nie | MOCKUP | Otwórz `UI/Makieta-cuda.html` — design reference panelu cudów; brak wpięcia w grę v1.0. |

**Uwagi lane E:** Kanon meta/start = **jeden plik** `Gra-podglad.html`. Brakuje dedykowanych UI: picker wielu slotów zapisu, ekran About, pełna implementacja ustawień audio/języka. Kreator krok 1 nie ma przycisku „Anuluj do menu” (powrót tylko przez reload / koniec gry).

**Status: UX-INWENTARZ GOTOWE · 2026-06-26 · lane E**

---

## Grupa F — Integrator (nie wypełnia tabel za A–E)

- Scala wpisy · aktualizuje katalog HTML · weryfikuje `main.ts` importy
- **Nie** dodaje wierszy „w imieniu” grup bez ich potwierdzenia

---

## Znane luki (Maciej słusznie nie widzi w HTML)

| UX | Dlaczego nie widać w katalogu |
|----|-------------------------------|
| Cały panel miasta B-01…B-12 | Otwiera się **tylko po kliku** w `Gra-podglad.html` |
| Hover docki B-04, B-05 | Wymagają otwartego panelu + najazdu |
| Hub nauki B-13 | Toolbar mapy, nie iframe |
| Side panel blocking | Zależy od wydarzeń w turze |
| Większość HUD A | Kanon = gra, nie statyczny HTML |

**Playtest kanonu:** [`Gra-podglad.html`](../Gra-podglad.html) · UX miasta: [`Gra-podglad-OKOLICA-UX.html`](../Gra-podglad-OKOLICA-UX.html)

---

## Historia

| Data | Zdarzenie |
|------|-----------|
| 2026-06-26 | Szkic integratora + dyspozycja do grup A–E |
| 2026-06-26 | **Grupa B: inwentaryzacja gotowa** (37 wpisów B-01…B-37) |
| 2026-06-26 | Usunięto nieaktualne `UI/Gra-podglad-MIASTO.html`, `UI/Gra-podglad-NAUKA.html` |
| 2026-06-29 | Grupa D: UX-INWENTARZ GOTOWE (15 wpisów D-01…D-15) |
| 2026-06-30 | Grupa C: UX-INWENTARZ GOTOWE (28 wpisów C-01…C-28) |
| 2026-06-29 | Regeneracja `UI/Katalog-UX-wszystkie-panele.html` — 60 wpisów, tabela master, filtry A–E |
| 2026-06-26 | Grupa E: UX-INWENTARZ GOTOWE (20 wpisów E-01…E-20) |
