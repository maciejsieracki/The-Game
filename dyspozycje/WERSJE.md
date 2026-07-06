# WERSJE — jedyny rejestr wersji bundli (prowadzi: publikujący, czyli INTEGRATOR)

ZASADA: md5/stempel wpisuje się TYLKO tutaj, zaraz po publishu. Inne pliki linkują,
nigdy nie kopiują (stary system miał 4 sprzeczne „aktualne" md5 — nigdy więcej).
Format: data · md5 (pełne) · stempel z menu · co weszło (1 linia) · status.

## ROBOCZA (gra-robocza\Gra-ROBOCZA.html — wskazywana przez START.html)
- 2026-07-06 13:47 · 63abbec55aef · stempel: 2026-07-06 13:47 · bdc95d91be71 ·
  #4 ROSTER bitwy: słupek → SIATKA 6 kolumn (wg kanonu C09 v4 + DESIGN-SPEC v4;
  gridTemplateColumns repeat(6,minmax(0,1fr)) + gap 4 na roster-group-cards). Reszta
  jak 7ffa2859 (port UX + rzeki + obwódki + tonięcie + zaznaczenie + duże bitwy).
  tsc=0 · roster-group-cards HOST-verified · pending=0 · 9 plików · hub odświeżony ·
  publikował INTEGRATOR · AKTUALNA (czeka na playtest Macieja — OBIEG §9)
- 2026-07-06 12:46 · 7ffa28596769 · stempel: 2026-07-06 12:46 · c169df028365 · ZASTĄPIONA (→ 63abbec55aef)
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
- 2026-07-06 ~03:55 · skopiowany przez Cursora bundle f199c4c8 (ze stemplem PENDING) ·
  DO NADPISANIA po poprawce stempla i playteście Macieja (pakiet #0 w DO-KANONU.md)

## FINALNA (root)
- stan sprzed 2026-07-05 wieczór — bez zmian dzisiejszej nocy
