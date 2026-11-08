STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB) — auto-ulepszenia terenu
TEMAT: R-WEB-AUTOIMPROVE-PASTURE-IRRIGATION-NOT-BUILT-Q2
GOAL: po wyczerpaniu farm na polach obywateli automat stawia trzodę, potem irygację (także w rozwijającej się cywilizacji); reguła „tylko pola obywateli” bez zmian.
RUNDY: 2/5 (baza f9af066aa = r1; kod r1 zachowany)

## 1. COMMIT-SPRAWCA (bisect na wyniku wieloturowym)
**cf236dafc (2026-10-29, „Stage food improvements across civilization”)**, `gra/src/game/auto-improvements.ts`, pętla etapów E1…E6 w `pickAutoImprovementsStaged`: `if (stagePicks.length > 0) { stagedPicks = stagePicks; break; }` (przed r2 ok. linii 1016-1030). Etap „wyczerpany” był oceniany z odczytu sprzed budowy tej tury, a pętla kończyła się na pierwszym etapie z pickami. Gdy obywatele przybywają / przesuwają się co turę, E1 (farma) ma cel KAŻDEJ tury, więc E3 (trzoda) i E4 (irygacja) nie dostają tury mimo niewydanej Pracy.
Harness: `gra/tools/autoimprove-pasture-irrigation-q2-bisect.cjs` (produkcyjny picker, dane jak main.ts, 10 miast, +1 obywatel/2 tury przez 24 tury, razem 44 tury). `starved` = tury wzrostu bez trzody/irygacji mimo farm bez trzody:
- 92d124b72 (27.10, przed etapami): starved 0, trzoda t2.
- **cf236dafc: starved 21, trzoda t14, irygacja nigdy.** aa540f357: 21.
- 0eacc66bf / 552537fe8 / 40e9fc240: 23 (trzoda t26-29). 84e8ec4a1: 21. b65363410: 23.
- d7d4f9f91 … fb75c1631: 23, irygacja do t44 nigdy (osobna luka, zamknięta w 1c19e0aba).
- 1c19e0aba … a8823b16b (main) … a4396c3d8 (r1): 23, trzoda t26, irygacja t28, 86 farm bez trzody w t24.
Hipoteza z dispatchu (51086350f, zdjęcie limitu sztuk) OBALONA: 51086350f^ i 51086350f dają identyczny wynik (limit był martwy). fb75c1631 (tylko pola obywateli) nie jest sprawcą, tylko nasila objaw (zbiór pól zmienia się z ulepszeniami). Sonda 0% z r1 (wzorzec od 552537fe8) to druga, węższa wada (zostaje).

## 2. Przypadek właściciela — pomiar w ŻYWEJ grze (bundle ROBOCZA 07503d86 = main, PRZED naprawą)
`gra/tools/autoimprove-pasture-irrigation-q2-live-measure.cjs` (Chromium, ?civTest=1, realny endTurn, 26 miast, Praca doładowywana do 3000 co turę, automatyzacja budowy WŁĄCZONA, tryb auto, % domyślny). Dowód: `evidence-live-pre-26miast.json`.
- Rozkład % per miasto (snapshot zapisu): **26/26 miast „empire” (bez override) = 33%, zero miast z 0%**. Override powstaje tylko z kliknięć gracza (main.ts:25604-25652); cities.ts:350,763 nie nadaje go nowym/zdobytym miastom. Sonda 0% z r1 NIE tłumaczy zrzutu.
- Realny przepływ: farmy t2-8 (35→121), trzoda dopiero t9 (110), od t10 farmy rosną 121→124 (po jednej na turę, nowe pola) przy STAŁYCH 110 trzody i ~20 farmach bez trzody mimo puli 2,6-4,1k. To mechanizm z pkt 1. Rezerwa 30, lostToSibling, defenseCap, tryb miasta, autoImpCities, bramka auto-build: nie są pierwszą bramką (w t9 trzoda powstaje na 104/110 polach).
- Irygacja 0 w pomiarze: przyczyna NIE_ZMIERZONO (hook unlockAllTech kończy grę w t2; irygacja wymaga techu „Gospodarka wodna”, improvement-tech.ts TECH_CANONICAL). Dla modelu z techiem wynik pokrywa harness (irygacja t3 po naprawie).

## 3. Analiza zrzutu (a)-(e)
(a) Praca 2,8k niewydana: zgodne z głodzeniem E3/E4 (budżet 33% puli, E1 zjada 1-2 pozycje co turę). (b)(c) pola obywateli bez trzody/irygacji, także poza rzeką: ten sam mechanizm, plus brak trzody poza rzeką do r1. (d) drobna zabudowa: farmy E1/E5. (e) tarasy na wzgórzach to etap E4 niezależny od trzody na płaskim.

## 4. Naprawa (`pickAutoImprovementsStaged`)
Po zbudowaniu pickow etapu (zapis do mergedPlaced) sonda nieograniczonego budżetu sprawdza, czy etap ma jeszcze cel. Brak celu = etap wyczerpany, następny etap w TEJ SAMEJ turze z resztą budżetu. Jest cel (budżet ucina) = czeka, niższe etapy wstrzymane. Wyjątki zachowujące kontrakty: tura z pickiem niedoboru surowca (S3-1) albo z wycinką (KROK 0 / E2 / E5) kończy etapy jak dawniej (rejestr #1: farmy na wyciętych polach przed trzodą). Dotyczy gracza i AI (ten sam picker).

## 5. Testy
Nowy blok (e) w `autoimprove-pasture-irrigation-q2-test.cjs`: **17 OK / 0 FAIL**; na kodzie r1 (HEAD): **12 OK / 5 FAIL** (starved 23, trzoda t26, irygacja t28, 86 farm bez trzody). Po naprawie: starved 0, trzoda t2, irygacja t3, kolejność wycinka→farmy→trzoda→irygacja bez naruszeń (także z miastem 0%).
Regresje: logic-test 213/213; ai-test 274 OK / 20 FAIL (bez zmian vs baza); tsc: 0 błędów w auto-improvements/ai/main (pozostałe błędy środowiskowe: brak vite/client w tymczasowym node_modules); stages-q1 299/0; irrigation-after-farms 42/0; ai-improvements 56/0; auto-improvements 46/0; no-item-cap 15/0; autoclear-priority-q1 60/0; river-forest-first 12/0; no-citizen-unit 17/0; autoclear-river-forest 17/0; hodowla-las 113/0; oboz-lowiecki-las 94/0; farma-nie-w-lesie 138/0; production-overflow 213/0; ai2-heks 39/0; wyrab-rzeka d1/krok0/r2 OK; simple-food-rule 36/0; irrigation-river-unify 30/0; autobuild-toggle 39/0; ai-food-only-worked 69/0; ai-food-improvement-priority-stages OK.
Bez zmian vs baza: auto-fort-claim 2 FAIL; auto-improve-q3 „playwright dostępny” (brak playwright w środowisku); testy wymagające playwright (no-citizen-q1, live) nie uruchomione.
Zaktualizowane z uzasadnieniem (kodowały „jeden etap na turę”): `ai-food-improvement-priority-stages-test.cjs` (kaskada E3<E4<E5 w jednym wywołaniu, farmy pierwsze, brak wycinki; sól E6 może być już zbudowana).

## 6. Weryfikacja żywa po buildzie (orkiestrator)
Z gra/: `ROBOCZA_HTML=<zbudowany bundle> NODE_PATH=/opt/node-tools/node_modules EVID_DIR=<kat> SEED=18 CITIES=26 TURNS=13 POOL=3000 UNLOCK=none node tools/autoimprove-pasture-irrigation-q2-live-measure.cjs post`.
Oczekiwane: kolumna pasture rośnie już w t3-5 równolegle do farm, `pastureOnFarmsRiver` ≈ `farmsRiver` bez luki ~20 farm w t10-13 (przed: pasture 0 do t8, potem 110 przy 124 farmach). Irygacja wymaga u gracza techu „Gospodarka wodna”.

## Blokady / ryzyka
- Miasto z % > 0, ale z capem (% × pula) poniżej kosztu najtańszej pozycji, nadal wstrzymuje niższe etapy (sonda r1 filtruje tylko 0%). Zmierzone przy 1%: pula niewydana, bez wpływu na E3/E4 pozostałych miast w teście. NIE naprawiane; DECISION_REQUIRED brak.
- NIE_ZMIERZONO: żywa weryfikacja kodu PO naprawie (zakaz buildu w gra/); przyczyna braku irygacji w żywym pomiarze przed naprawą (tech).
- Koszt: do 6 etapów × 2 przebiegi pickera na turę (ai-test bez spadku).

## Zmiany/Commit
Pliki (jawny git add): gra/src/game/auto-improvements.ts; gra/tools/autoimprove-pasture-irrigation-q2-{test,bisect,live-measure}.cjs; gra/tools/ai-food-improvement-priority-stages-test.cjs; ten katalog (01-operator-r2.md, evidence-live-pre-26miast.json).
SHA kodu r2: 9420ae1da (baza f9af066aa), worktree-gałąź wf_37741b4b-310-1.
NASTĘPNY KROK: Evaluator. DEPLOY/PUSH: NIE WYKONANO.
