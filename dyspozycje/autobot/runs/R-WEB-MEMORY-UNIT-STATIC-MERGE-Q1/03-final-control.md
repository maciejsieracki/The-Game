STATUS: PASS
DOMAIN: GAME (WEB) — pamięć i wydajność renderu jednostek
TEMAT: R-WEB-MEMORY-UNIT-STATIC-MERGE-Q1
GOAL: statyczne części żetonu scalone w jeden mesh na materiał. Zachowane: picking, zaznaczenie, animacje, deferred dim, mgła, kolory właściciela, SmallPartLod i pule z FALA 526/530. Różnica obrazu ≤ ~120 px z 1,6 mln.

ZMIANY-COMMIT:
- baza 6a673c838b306dbad47dd33d58f5f5a72882a71c; łańcuch: 1f3d84c59 (kod) → ca9701022 (scalanie w miejscu po przyciemnieniu) → e866e1889 (raport Operatora) → 3faa918deeb681726b75ffc2803cf4c81cc2656e (obrona) → commit tego raportu (gałąź lokalna `autobot/R-WEB-MEMORY-UNIT-STATIC-MERGE-Q1-fc`, bez push).
- Diff od bazy poza runs/ obejmuje 7 plików, wszystkie na allowliście: `gra/src/render/{units.ts,smallPartLod.ts,unitStaticMerge.ts}` i 4 nowe `gra/tools/memory-unit-static-merge-*.cjs`. main.ts, data, WERSJE.md, battle/, vite.config i rust-port bez zmian. `git diff --check` czysty. Obrona zmieniła tylko test game-frame z allowlisty; kod gry jest ten sam co w e866e18.

ORZECZENIA:
- Z1 (próg 8/255) — ODDAL. Obrona usunęła próg i liczy piksel różny w dowolnym kanale. Mierzy też szum, uruchamiając każdy build dwa razy. Szum A vs A i B vs B wynosi 0 we wszystkich K1–K5. A vs B: 0/0/1/1/1 px (maks. 1/255). Mutacja „scalony mesh niewidoczny” wykryta w 5/5 kadrach. Log `gate-obrona-r1-game-frame*.txt`, EXIT=0, sprawdzony.
- Z2 (zakres klatki) — ODDAL. Doszły K3 (60 dodatkowych żetonów), K4 (połowa prawdziwego ruchu) i K5 (po ruchu), wszystkie ≤ 1 px. Atak przesuwa tylko korzeń żetonu, a jego wypad pokrywa S3 na prawdziwym UnitRenderer (2 px). Uzasadnienie dla t.50 przyjmuję: liczba jednostek różni się między przebiegami nawet przy tym samym buildzie i seedzie (424/385/412), więc porównanie pikseli w t.50 nie byłoby porównaniem A/B. Obraz w t.50 pozostaje NIE_ZMIERZONO; to uwaga, nie brak.
- Z3 (zrzuty) — ODDAL. W runie jest komplet 15 plików `zrzuty/gra-K1..K5-{A-przed,B-po,roznica}.png`.
- Z4 (baza render-all) — ODDAL. Obrona puściła własną bazę 79 narzędzi na 6a673c838 i nie stwierdziła regresji. Trzy rozbieżności to niestabilne testy albo poprawa (log `gate-obrona-r1-render-all-baza.txt`, EXIT=0).
- Z5 (koszt budowy) — ODDAL jako uwaga. Budowa 475 żetonów od zera jest droższa o +27–46%, około 0,2 s jednorazowo. Mieści się w H3 (≤ 2,5×). Przejście tury jest szybsze: 186,6 → 108,0 ms.
- NAPRAW: 0. DO DECYZJI CZŁOWIEKA: 0.

TESTY (odtworzone przez FC na drzewie integracyjnym `origin/main` 02fbe7dcf + 3faa918, merge bez konfliktu; FALA 531 / R-WEB-PERF-ENDTURN-RENDER-HUD-Q1 jest już w main i nie dotyka units.ts ani smallPartLod.ts):
- tsc: EXIT=0, 0 linii błędów.
- logic: 213/213.
- memory-unit-static-merge-test: 9/0.
  - Meshe 11701→3315, draw calls 12636→4250.
  - Obraz: stanie/marsz/atak 6/1/2 px, zbliżenie 0 px.
  - Picking: 170/170.
  - Przyciemnienie: ten sam uuid, scalanie w miejscu.
  - LOD: liczba chowanych części B == A dla 6 odległości.
  - Pule po usunięciu żetonów puste.
- unit-renderer-overlay-sync: 17/0.
- capture-render-sync: 23/0.
- small-part-lod: 24/0.
- unit-deferred-reveal-dim-real-render: 19/0.
- city-badge-zoom-lod: 67/0.
- Interakcja z FALA 531:
  - perf-endturn-render-deferral-regression: OK;
  - perf-endturn-render-resume-flush: OK (3 scenariusze × kod/mutacja);
  - perf-endturn-render-progress-live: EXIT=0. Pierwsze uruchomienie przerwał mój własny limit 180 s; przy limicie 580 s test przeszedł.
- Nie powtarzałem: pomiaru w pełnej grze (~3 h), ai-test, render-all, heap i game-frame. Logi Operatora i Obrony sprawdziłem: mają linie EXIT=, a mediany są spójne. Kod gry od odtworzenia przez Evaluatora się nie zmienił.
- Sprzątanie: symlink node_modules i plik wyniku w /tmp z mojego przebiegu usunięte, worktree czysty.

KOLEJNOŚĆ INTEGRACJI:
- Najpierw `main`: merge SHA końcowego FC na `origin/main` (02fbe7dcf). Merge-tree jest czysty, a bramki powyżej przeszły na scalonym drzewie.
- `origin/rust-port/parity-v2` (b520768b0) nie zawiera bieżącego main (wspólna baza f4c89d008). Temat dotyka tylko `gra/` i runs/, merge-tree z parity-v2 też jest czysty. Nie wymaga osobnej integracji na parity-v2, ale dojdzie tam przy najbliższej synchronizacji z main (REPIN Rust po zmianach weba).

BLOKADY: brak. Uwagi:
- (a) budowa od zera jest droższa o +27–46%;
- (b) obraz w t.50: NIE_ZMIERZONO;
- (c) renderLoop mierzony na swiftshader, więc liczby są tylko względne.

RUNDY: 1/5
NASTĘPNY KROK: integracja orkiestratora na main → READY_FOR_DEPLOY (deploy/push wymaga osobnej autoryzacji)
DEPLOY-PUSH: NIE WYKONANO
