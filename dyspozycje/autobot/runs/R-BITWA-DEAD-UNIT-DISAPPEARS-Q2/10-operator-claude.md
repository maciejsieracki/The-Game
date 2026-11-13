STATUS: PASS-WITH-NOTES (wynik: NIE_ODTWORZONO — brak czerwonej ścieżki; bez zmian kodu produkcyjnego; decyzja dla właściciela)
DOMAIN: GAME
TEMAT: R-BITWA-DEAD-UNIT-DISAPPEARS-Q2
GOAL: zabite jednostki znikają ze sceny natychmiast (model, pasek HP, pierścień zaznaczenia, pole zajęte) na realnych ścieżkach; odtworzyć zgłoszonego ducha albo uczciwie zgłosić brak odtworzenia.

ZMIANY/COMMIT: baza kodu 2c6c0400c (kandydat Codexa). Dodane WYŁĄCZNIE pliki testowe + dowody, zero zmian w gra/src:
- gra/tools/battle-dead-unit-e2e-entry.html / .ts — scena bitwy sterowana realnym AUTO / skip() / skip w trakcie ręcznej / skip w trakcie AUTO, z inwariantem sprawdzanym w każdej klatce rAF i na końcu.
- gra/tools/battle-dead-unit-e2e-browser-test.cjs — Chromium przez Vite HTTP, bez file://.
- dyspozycje/.../evidence/e2e-ghost-audit.json, e2e-weak.json, e2e-weak-modes.json, e2e-mutation.json.
SHA: patrz commit na czubku (zwrócony w polu sha).

INWARIANT (per klatka): dla każdej jednostki z dead/removed/hp<=0 (poza żywym uciekinierem hp>0): group.parent===null, hpBarGroup.parent===null, !visible, nie trzyma kafla occByKey, hp<=0 => removed; oraz skan sceny: żaden model jednostki (userData.mats) w scene.children, który nie należy do żywej jednostki (wykrywa osierocone duplikaty po replay/odświeżeniu).

TESTY (liczby z surowego wyjścia, Chromium /opt/pw-browsers/chromium-1194, swiftshader):
- Pole, pełne HP: auto (100 klatek, runda 8, 2 zabitych), skip (14 klatek, runda 7, 2 zabitych): 0 naruszeń.
- Pole, kruche armie (hp=12%, E2E_WEAK=1, dużo zabójstw): auto 16 zabitych / 33 klatki, 0 naruszeń; skip 24 zabitych, 0; manualskip (skip po 1,5 s w trybie ręcznym) 21 zabitych, 0; midskip (skip w trakcie AUTO) 21 zabitych, 0.
- Oblężenie bez wyłomu, skip (kruche): 8 zabitych, runda 150, wynik remis (sufit 150 tur), 0 naruszeń. Zabójstwa przy wyłomie muru (katapulta na kaflu) pokrywa baseline Codexa (_breachWallTile, PASS).
- Mutacja (E2E_MUTATE=1: _removeUnitFromScene = no-op): inwariant CZERWIENIEJE — deadAttached 15, deadVisible 15, osierocone modele 10, 60 naruszeń w jednym przebiegu skip. Skan jest więc realnie czuły.
- Bramki: tsc --noEmit czysty; battle-dead-unit-disappearance-test PASS; battle-dead-units-removed-test PASS; battle-dead-unit-disappearance-browser-test (Codex) PASS wg 01-operator.md.
- Zera błędów strony/konsoli we wszystkich przebiegach.

NIE ZMIERZONO / LUKI (założenie: nie blokują werdyktu):
- auto:siege (AUTO w oblężeniu) przekroczył 200 s w swiftshader (runda 2, 0 zabitych, 0 naruszeń) — niedokończone, bez wniosku. skip:siege pokrywa tę samą logikę zabójstw (ten sam kod _singleBlow).
- Weryfikacja pikselowa renderu (zrzut) pominięta: pixelRatio 0.1 w harnessie; sprawdzany jest graf sceny (jedyne źródło rysowania — nie ma instancingu ani scalonych siatek w bitwie; scalanie statyczne dotyczy mapy świata, units.ts).
- Ścieżka _skipInstantFallback (skip przed started) nie przechodzi przez scenę; wynik liczony rachunkiem, jednostki nie giną wizualnie — tylko ekran końca. Zaobserwowane w kodzie, niezweryfikowane w przeglądarce; nie zgłoszone jako duch.

AUDYT KODU (przyczyny wykluczone): jedyna droga do hp<=0 w _singleBlow -> _resolveBlowOutcome -> _startFade -> _removeUnitFromScene (idempotentne, zdejmuje group i hpBarGroup, pierścień zaznaczenia jest dzieckiem group); scalanie/podział HP (_mergeUnits) też woła _removeUnitFromScene; ucieczka i wyłom muru tak samo; brak dobiegającej animacji ponownie dodającej obiekt (jedyne scene.add jednostek są przy _placeUnits, po replay poprzedzonym _removeAllUnitsFromField). Brak rezerw w trakcie bitwy (limit 500, nie 120).

BLOKADY: brak. Decyzja produktowa dla właściciela (ABC w rundzie orkiestratora): bez dokładnych kroków odtworzenia (jaka bitwa/tryb/co widać: karta w rosterze? etykieta? model?) nie ma czerwonej ścieżki do naprawy; sugerowana opcja A: zamknąć jako NIE_ODTWORZONO, zostawić nowy test e2e jako bramkę regresji; opcja B: poprosić o zapis/zrzut zgłoszonego przypadku.
RUNDY: 2/5 (Operator Claude; poprzednia: Codex r1).
NASTĘPNY KROK: Evaluator (potwierdzenie, że brak zmian w gra/src, powtórzenie e2e i mutacji), potem decyzja orkiestratora; deploy na ROBOCZĄ NIE dotyczy (brak zmiany produkcyjnej).
DEPLOY/PUSH: NIE WYKONANO
