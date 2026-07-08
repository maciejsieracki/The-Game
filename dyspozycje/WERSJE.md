# WERSJE — jedyny rejestr wersji bundli (prowadzi: publikujący, czyli INTEGRATOR)

ZASADA: md5/stempel wpisuje się TYLKO tutaj, zaraz po publishu. Inne pliki linkują,
nigdy nie kopiują (stary system miał 4 sprzeczne „aktualne" md5 — nigdy więcej).
Format: data · md5 (pełne) · stempel z menu · co weszło (1 linia) · status.

## ROBOCZA (gra-robocza\Gra-ROBOCZA.html — wskazywana przez START.html)
- 2026-07-08 19:50 · **51c2eb248aedac4f97a78854ad9b7422** · stempel: 2026-07-08 19:50 · 7fe722e3 · **WYDAJNOŚĆ D1+D3 na KANONIE `gra/src` + fix drzewka technologii przywrócony na live** ·
  Zbudowane z committed `gra/src` @ **865c94e** (wypchnięty na origin/main) — koniec ery deploy-only D1/D3, live=commit. vite-direct
  (bez `npm run build`/`export-data.py` → **balans zachowany**: Falanga=45). WSZYSTKIE 9 plików + hub na tym samym md5 `51c2eb24`
  (spójność). tsc=0 · bundle-gate HOST-verified: **drzew 88 / Nauka 129** (stary live c293647 miał 87/128 = **regres drzewka
  NAPRAWIONY**), viewBox 343, counterTyp 7 · FRESH≥LIVE i ==HEAD · publikował CODE-INTEGRATOR · **AKTUALNA (klucz=stempel)**.
- 2026-07-08 11:40 · stempel: 2026-07-08 11:40 · c293647ccedf · **WYDAJNOŚĆ D1+D3** (kolejka D1→D3→D2, osobno) ·
  D3 = usunięty zbędny `refreshFog()` z `applyCityPanelWorldView` (main.ts) — otwarcie panelu miasta nie zmienia wejść
  mgły (setFog no-op); widoczność miast ustawia `cityRenderer.sync()`; poprawność mgły zapewniają realne zdarzenia.
  `refreshFog();` 27→26 (usunięta dokładnie 1). + D1. Z HEAD bc51a01 (sejwy+HEAD zachowane). tsc=0 · vite OK · pending=0 ·
  10 plików · hub · HOST-verify · publikował INTEGRATOR · ZASTĄPIONA (→ 51c2eb24…, stempel 7fe722e3 · 2026-07-08 19:50 — właściwy build z committed `gra/src` @ 865c94e). D2 następne (osobno, +`?culling=0`).
- 2026-07-08 11:20 · stempel: 2026-07-08 11:20 · 6102654b5d60 · **WYDAJNOŚĆ D1** (kolejka Mastera D1→D3→D2, osobno) · ZASTĄPIONA (→ c293647ccedf) ·
  D1 = lokalna enumeracja heksów (helper `hexKeysWithinRadius`) zamiast pełnomapowych skanów `Object.keys(map.hexes)`
  przy otwarciu miasta — `okolicaTiles`/`hexesInCitySight`/`collectRangeKeys` (320k→~700, ~450×). Zbudowane z HEAD
  **bc51a01** (zawiera moduł sejwów Cursora + plony z Excela + panel B14 + drzewko tech — nic nie nadpisane; D1 dotyka
  tylko okolica.ts/resource-access.ts/cityOkolicaOverlay.ts). tsc=0 · vite OK · pending=0 · 10 plików · hub · HOST-verify ·
  publikował INTEGRATOR · AKTUALNA (klucz=stempel). Uwaga: podniosło live z 3b089468→bc51a01. D3, D2 następne (osobno).
- 2026-07-06 20:41 · stempel build 371151b5544247c1e66f93597770c2f8 · ROBOCZA · 371151b5 · 20:41 · ZASTĄPIONA (→ 6102654b5d60; między nimi buildy Cursora be32d0a8/58e76604/6e3027fe/3b089468 — wciągnięte przez bc51a01) ·
  SAVE/LOAD UX: dialog zapisu (nazwa sejwu) + dialog wczytywania (lista slotów, usuwanie);
  wczytanie z menu regeneruje mapę z seeda zapisu (fix „randomowa gra"); z-index dialog nad menu;
  Kontynuuj → wybór sejwu. tsc=0 · smoke OK · publish Cursor (wyjątek Macieja, bez Integratora)
- 2026-07-06 18:35 · <plik-md5 dryfuje> · stempel: 2026-07-06 18:35 · e4d99a49b659 ·
  FIX duplikatu „SUROWCE W ZASIĘGU" w panelu miasta (usunięte wywołanie `appendW4TabFooter` @6489 w
  `ui/cityPanel.ts`). + całość d744 (balans, countery, rzeki, KONTRAKT #8, UX, roster, obwódki, duże bitwy).
  tsc=0/vite OK · pending=0 · 9/9 · hub · HOST-verify. Build z klonu; do repo po pushu · AKTUALNA (klucz=stempel)
- 2026-07-06 18:10 · <plik-md5 dryfuje> · stempel: 2026-07-06 18:10 · d744cd7956fb · ZASTĄPIONA (→ e4d99a49b659) ·
  COUNTERY po polu `Typ` (counterMultiplier czyta `counterTyp` z def['Typ']) — włócznicy o opisowych
  nazwach dostają +50% vs konnica; `game/combat.ts` + `battle/battleScene.ts`. + całość 7fb9f6d3e8fb
  (balans HP×2/dyst×0.5, rzeki, KONTRAKT #8, UX, roster, obwódki, duże bitwy). tsc=0/vite OK · pending=0 ·
  9/9 · hub · HOST-verify. Build z klonu; do repo po pushu Macieja · publikował INTEGRATOR · AKTUALNA (klucz=stempel)
- 2026-07-06 17:55 · <plik-md5 dryfuje> · stempel: 2026-07-06 17:55 · 7fb9f6d3e8fb · ZASTĄPIONA (→ d744cd7956fb) ·
  BALANS-WALKI (wartości Macieja z uploadu Jednostki-PL0.xlsx): HP×2 + dystans×0.5 dla
  jedn. z polami EN; Falanga=40; 26 jedn. PL0 uzupełnione pola EN + Typ; 3 przemianowania
  (Legionarius→Legion Rzymski itd.); wszystkie 75 z Typ. + całość a9fffc3e (rzeki, KONTRAKT #8,
  UX, roster, obwódki, duże bitwy). tsc=0/vite OK · pending=0 · 9/9 · hub. Build z klonu na
  „wpinaj" Macieja; publikował INTEGRATOR
- 2026-07-06 16:52 · a9fffc3eeeb9 · stempel: 2026-07-06 16:52 · d3a3edb52848 · ZASTĄPIONA (→ 7fb9f6d3e8fb)
  BUILD ZBIORCZY z GitHub HEAD b1b9fed (pierwszy build po migracji na GitHub): rzeki
  „wodospad" (render-only, hash bezpieczny) + KONTRAKT #8 ikony jednostek (⚔️→SVG w
  stosie armii / panelu [H] / scal-rozdziel) + grafiki UX [16:20] (ikony surowców mapy
  + teren) + podmiany UX [16:40] (7× emoji→SVG) + całość d4d667d8 (siatka rostera 6 kol,
  obwódki właściciela, tonięcie, zaznaczenie, duże bitwy, port UX). tsc=0 · HOST-verified
  (stempel + owner-ring + resources-map + menu-save) · pending=0 · 9 plików spójne
  (wewn. stempel d3a3edb52848) · hub odświeżony · publikował INTEGRATOR · AKTUALNA
  (czeka na playtest Macieja). UWAGA: klucz wersji = WEWN. STEMPEL (md5 pliku dryfuje na OneDrive).
- 2026-07-06 13:47 · a76514621f02 · stempel: 2026-07-06 13:47 · bdc95d91be71 · ZASTĄPIONA (→ a9fffc3eeeb9)
  #4 ROSTER bitwy: słupek → SIATKA 6 kolumn (wg kanonu C09 v4 + DESIGN-SPEC v4;
  gridTemplateColumns repeat(6,minmax(0,1fr)) + gap 4 na roster-group-cards). Reszta
  jak 7ffa2859 (port UX + rzeki + obwódki + tonięcie + zaznaczenie + duże bitwy).
  tsc=0 · roster-group-cards HOST-verified · pending=0 · 9 plików · hub odświeżony ·
  publikował INTEGRATOR · AKTUALNA (czeka na playtest Macieja — OBIEG §9)
- 2026-07-06 12:46 · 7ffa28596769 · stempel: 2026-07-06 12:46 · c169df028365 · ZASTĄPIONA (→ a76514621f02)
  PORT UX wpięty (rebuild łączony): buildModeHud emoji→SVG (panel Ulepszeń) +
  brandAssets.improvementIconSvg + improvement-icon-map.json + cityPanel nowsza
  (karty budynków Poziom B + rekrutacja + ramka zakładek W4) + nowe unitRecruitCard.ts
  i unitInfographic.ts. Zawiera też całość d4d667d8 (rzeki+C3+B0.6+zoomLOD+obwódki+
  tonięcie+zaznaczenie+duże bitwy). tsc=0 · markery imp-farm/unitRecruit/owner-ring
  HOST-verified · pending=0 · hub+manifest odświeżone · 9 plików na tym md5 ·
  publikował INTEGRATOR · AKTUALNA (czeka na playtest Macieja — OBIEG §9)
- 2026-07-06 11:34 · d4d667d80ebb · stempel: 2026-07-06 11:34 · e47323c170ab · ZASTĄPIONA (→ 7ffa28596769)
  GŁÓWNA GRA odświeżona do najnowszego bundla (był desync — wisiała na 26730a2a).
  Zawiera: 26730a2a (rzeki+C3+B0.6+zoomLOD+UX) + obwódki właściciela jednostek
  (own=niebieski/wróg=czerwony) + zaznaczenie w kolorze właściciela + fix tonięcia
  na wzgórzach/górach + duże bitwy (arena, deploy:true). tsc=0 · marker civ-owner-ring
  HOST-verified · pending=0 · WSZYSTKIE playtesty na tym samym md5 (spójność) ·
  POLE-BITWY skasowany (niepodpięty do głównej gry) · publikował INTEGRATOR · AKTUALNA
- 2026-07-06 09:12 · 26730a2ab4ec9e11425a8a090d4b1caf · stempel: 2026-07-06 09:12 ·
  3b15f0bab7f6 · ZBIORCZY: rzeki (bezUjscia=0/sieroc=0) + C3 porcjowana scena +
  **B0.6 frustumCulled=false ×12 (zalany ląd)** + zoom LOD A1+A4 + B1-B2 (sanitizeCoast
  BFS + early-exit) + panel „Moc imperium v3" (UX) · tsc=0 · weryfikacja PASS ·
  hash ziemia/42=4284176530 (determinizm) · stempel HOST-side POTWIERDZONY · publikował
  INTEGRATOR (bash-first /tmp/build, srcKopiaMaster=lustro) · ZASTĄPIONA (→ d4d667d80ebb)
- 2026-07-06 01:01 · bc04038ffd30db33d9ed5e1a81c83ee4 · stempel: 2026-07-06 01:01 ·
  fc15d6ca71c4 · RZEKI KOMPLET (każda główna z ujściem, zero sierocych delt,
  pruneOrphanRiverPaths) + całość batchy z wczoraj; UWAGA: UI w wersji sprzed
  batcha T4b-T5 (odtworzenie UI od zera = następny build) · publikował MASTER
  awaryjnie (decyzja Macieja); stempel zweryfikowany HOST-side · ZASTĄPIONA (→ 26730a2ab4ec)
- 2026-07-06 ~03:40 · f199c4c808e6… · stempel: BŁĄD (PENDING — deploy niestemplowanej
  kopii) · rzeki domknięte (bezUjscia=0, sieroc=0) + całość z 22:37 · DO POPRAWKI
  (integrator przestemplowuje — patrz kanał [03:50])
- 2026-07-05 ~22:37 · b04524f11a87ebb65df3871332f301d7 · 2026-07-05 · d3b1aee7f5af ·
  overlay+worker, B0.9, panel wydajności, A5, H1, rzeki I1/I2 · ZASTĄPIONA
- 2026-07-05 17:37 · 23d76157a8e3610b9eaae454bb97bdb5 · (bez stempla w menu) ·
  ostatni publish Cursora sprzed przejęcia · ZASTĄPIONA

## PLAYTESTY-BITWY (osobne pliki testowe w gra-robocza\ — nie główna gra)
- 2026-07-06 10:53 · 486a65094ddb · stempel: 2026-07-06 10:53 · 4771ec9ba9f0 ·
  DWIE DUŻE BITWY jako ARENA taktyczna: `Gra-ROBOCZA-PLAYTEST-BITWA-DUZA.html` (pole) +
  `Gra-ROBOCZA-PLAYTEST-OBLEZENIE-DUZE.html` (mur). Na boot odpalają PROSTO `BattleScene`
  (armia vs armia), z pominięciem mapy świata. Skład/strona: 10 Hastati/Falanga + 10 Łucznik
  + 8 Konnica (konnica na skrzydłach). Oblężenie: defCiv=grecja + machiny u atakującego
  (ensureSiegeMachines). Presety `bitwa_duza_pole`/`oblezenie_duze` + `launchBigPresetBattle`.
  tsc=0 · markery arena HOST-verified · pending=0 · źródło w srcKopiaMaster · AKTUALNA
- 2026-07-06 10:32 · e893f8bfd47c · stempel: 773234ea3a68 · WERSJA MAPOWA (28 jedn./stronę
  rozstawione na MAPIE ŚWIATA) — ZŁY POZIOM, Maciej chciał areny · ZASTĄPIONA (→ 486a65094ddb)

## KANON (gra-kanon\)
- 2026-07-08 21:02 · **f2dcbbb8d9e7707d779d310ecff9a643** · stempel KANON: **8adcd682** · źródło robocza md5 **51c2eb248aed** · promocja z roboczej PRZED pracą nad wydajnością (Maciej: „wypchnij obecną wersję do kanonu"). Zawartość = live D1/D3 (miasto szybko + mgła) + fix drzewka NA GÓRZE + balans/countery/plony/rzeki/ikony; źródło `865c94e` na origin. **Bez** eksperymentu B (geometria heksa). publikował CODE-INTEGRATOR (publish-kanon-snapshot.ps1) · **AKTUALNA**
- 2026-07-06 20:17 · **7856d3451a0cb3963bd3c50c032f5ad5** · stempel wewn.: **d744cd7956fb**
  (2026-07-06 18:10) · promocja Cursor Grupa G z roboczej (Maciej: playtest OK + GitHub
  bad0c7f). Zawartość: rzeki wodospad, KONTRAKT #8 ikony, UX emoji→SVG, siatka rostera
  6 kol., obwódki właściciela, duże bitwy arena, port UX W4, balans HP×2/dyst×0.5,
  countery po polu `Typ`, C3/B0.6/Test wydajności/A5/H1. gra/src zsynchronizowane ze
  srcKopiaMaster. tsc=0 · smoke OK · publikował Cursor (publish-kanon-snapshot.ps1) · **ZASTĄPIONA** (→ 51c2eb24 / kanon 8adcd682, 2026-07-08 21:02)
- 2026-07-06 ~03:55 · skopiowany przez Cursora bundle f199c4c8 (ze stemplem PENDING) ·
  **ZASTĄPIONA** (→ 7856d345)

## FINALNA (root)
- 2026-07-08 21:02 · **605761807eb0b79f43c047c4e70916f7** · stempel FINALNA · zsynchronizowana z kanonem 51c2eb24 (Gra-FINALNA.html) · **AKTUALNA**
- 2026-07-06 20:17 · **7856d3451a0cb3963bd3c50c032f5ad5** · zsynchronizowana z kanonem
  (Gra-FINALNA.html) · **ZASTĄPIONA** (→ 60576180)
