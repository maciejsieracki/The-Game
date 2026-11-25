STATUS: PASS-WITH-NOTES
DOMAIN: GAME (testy)
TEMAT: R-WEB-TEST-DEBT-Q15-SAVELOAD-HOTSEAT-Q1
GOAL: 6 czerwonych testów zapisu/hotseat sklasyfikowanych z dowodem i naprawionych do obowiązujących reguł; realpath-mutation przywraca plik po ubiciu; bramki zielone. Runda 3/5 (dodatek r3 orkiestratora), baza 9141031f4 (origin/main, detached).
ZMIANY-COMMIT: jedyna zmiana kodu: gra/tools/hotseat-etap6d-podetap-d-exec-test.cjs (+41/-3). Raport: ten plik. gra/src i gra/data NIETKNIĘTE: md5 gra/src/main.ts = e750abbd7d945a4e406cf3a9388a839e = `git show HEAD:gra/src/main.ts` (sprawdzone po każdym biegu mutacji). SHA commita: pole sha w StructuredOutput.

TESTY (solo, surowe wyniki tej rundy)
- hotseat-etap6d-podetap-b-exec-test: exit 0, "48 PASS, 0 FAIL" (bez zmian, potwierdzone).
- hotseat-etap6d-podetap-e-exec-test: exit 0, "24 PASS, 0 FAIL" (bez zmian, potwierdzone).
- hotseat-etap6d-podetap-d-exec-test: r3 start exit 1 "40 PASS, 6 FAIL" -> po naprawie exit 0, "46 PASS, 0 FAIL" (6 iteracji pętli loader/ReferenceError; limit 12 nie wyczerpany).
- save-load-roundtrip-state-drift-test (warstwa statyczna, --static-only 1): baseline exit 0 "SAVE-LOAD ROUNDTRIP OK"; MUTANT (kopia main.ts POZA repo, orderMultByCity: Array.from(orderMultMap.entries()) -> []) exit 1, "FAIL zapis orderMultByCity", "SAVE-LOAD ROUNDTRIP FAIL (1)".
- resource-ledger-realpath-mutation-test --ids m01: patrz sekcja realpath.
- Bramki: patrz sekcja BRAMKI.

KLASYFIKACJA (hotseat-D, dowód z logu i z kodu)
- Przyczyna czerwieni (r3 -> obecnie): HARNESS. Blok B (main.ts L46625, `if (diplomaticallyDiscoveredOwnersSet().has(ownerId)) {`) woła funkcje zagnieżdżone w runWorldEndTurn, których harness nie miał w mockach: diploMilitarySideOf (L12383), blokSojusznicyDla (L46566), objectivePowerForOwner (L3116), warLimitPermits (L26077), diploRelWarFields (L12461), diploMiastaWycenaDla (L41431), pickAiPlayerCyclicBarter (L25288). Każda dodana jako spy (rejestruje argumenty, zwraca neutralną wartość) z komentarzem wskazującym linię main.ts.
- Trzy asercje "PRAWDZIWY ME()" czerwone w r3 mają przyczyny w HARNESSIE, nie w grze:
  (a) civKeyForOwnerId był mockiem stałym 'grecy', a blok woła civKeyForOwnerId(ME()) -> mock zależy od id (ME -> 'rzymianie').
  (b) isPeaceLockedBetween: asercja zakładała orientację (ownerId, ME()); main.ts woła w DWU orientacjach: karaWspolnaGranica = isPeaceLockedBetween(ME(), ownerId), peaceLocked = isPeaceLockedBetween(ownerId, ME()). Log przed poprawką: [[7,4],[4,7]]. Asercja zmieniona na: obie orientacje obecne z ME(). UWAGA dla Evaluatora: to zmiana asercji (nie osłabienie: wymaga obu wywołań, a r3 wymagał jednego w złej orientacji); oceńcie, czy zaakceptować.
  (c) blokSojusznicyDla / warLimitPermits / diploRelWarFields / objectivePowerForOwner: nowe asercje rejestrują, że ME() trafia w właściwą pozycję argumentów (spy). Uwaga: to testuje routing ME(), nie logikę zagnieżdżonych funkcji (ich ciała są mockowane).
- Mutacje hotseat-D (wszystkie czerwienią się realnie, okMutation wymaga cond===false): blok A i blok B na skompilowanym kodzie (ME()->0, 5 linii "OK (mutacja realnie zmieniła wynik)" dla B+A) ORAZ na main.ts na dysku (cofnięcie ME()->0 w bloku A i bloku B, świeży ekstraktor): 2 linie OK, bajt w bajt przywrócone (asercja "PRZYWRÓCONY" OK). Log: 7 linii OK (mutacja). Mutacja ME()->0 bloku B nie jest już "NIE-ZMIERZONO" (r3 blokada (a) zdjęta).

REALPATH (resource-ledger-realpath-mutation-test)
- Dowód 1 (ubicie DZIECKA vite w trakcie mutacji, przez PID dziecka): `setsid nohup timeout 1500 node tools/resource-ledger-realpath-mutation-test.cjs --ids m01` (PID procesu testu 12777); w trakcie: main.ts zmutowany (md5 31ce2a0b70a586bb911937d9c1061c9f), vite child PID 12787; `kill -TERM 12787`. Wynik: "[m01] BLAD BUILDU mutacji: vite v5.4.21 building ..."; "MUTACJE: zabite=0 przezyly/bledy=1", proces zakończony po 5 s (exit 1 = oczekiwany dla błędu buildu). Po biegu: md5 gra/src/main.ts = e750abbd7d945a4e406cf3a9388a839e = HEAD (IDENTYCZNY); brak civ-ledger-mut-* w /tmp; brak procesów. DOWÓD SPEŁNIONY.
- Dowód 2 (pełny bieg m01 bez ubicia): exit 1, "[m01] ZABITA (exit 1) — pominiecie lupu z bitwy :: FAIL lup z bitwy: wpis „Łup z bitwy” (lup_bitwy) dla zwyciezcy" (MUTACJE: zabite=1 przezyly/bledy=0). Po biegu md5 main.ts = HEAD. 
- Uwaga (nie naprawiane w tej rundzie, zgłoszone): po pełnym biegu katalog wyjściowy vite `${os.tmpdir()}/civ-ledger-mut-<pid>-<id>` (DIST) ZOSTAJE w /tmp (cleanupOrphans kasuje tylko kopie backup/applied). Usunięty ręcznie. Poprawka kandydatem R-WEB-*/następna runda (dodać rm DIST w finally).
- Mutacje m02–m17 i tryb SIGKILL z dzieckiem: NIE-ZMIERZONO w tej rundzie (zakres dispatchu: m01).

ROUNDTRIP (save-load-roundtrip-state-drift-test)
- Mutacja warstwy statycznej: ZMIERZONA, czerwona (dowód wyżej).
- Mutacja warstwy dynamicznej (kopia bundla, Chromium): NIE-ZMIERZONO. Powód: każdy bieg dynamiczny to ~5 min/ziarno z Chromium, a w tej rundzie wykonano priorytetowo realpath (kill dziecka + pełny m01) i bramki; nie wykonano też samodzielnego biegu dynamicznego bez mutacji w tej rundzie. Ostatni dowód dynamiczny (obrona r3): exit 0 "SAVE-LOAD ROUNDTRIP OK", seed 4242 i 777 w JEDNYM biegu (domyślne seeds = dwa równoległe Chromium, łamie regułę "jeden Chromium naraz"; do poprawy: --seeds po jednym).

DESERIALIZE-AUDIT (z dispatchu pkt 5 r2) — nie w zakresie r3, bez zmian.

BRAMKI (surowe wyniki na kandydacie 9141031f4, przed commitem pliku D):
- tsc --noEmit: exit 0.
- logic-test: exit 0, "LOGIC OK (213/213)".
- tech-tree-test: exit 0, "tech-tree-test: 20 pass, 0 fail".
- research-test: exit 0, ostatnia linia "ALL GREEN".
- combat-test: exit 0, "All sanity checks passed.".
- ai-test: exit 0, "ai-test: 297 passed, 0 failed".
- unit-replace (6 plików): unit-replace-test exit 0 "WSZYSTKIE TESTY ZIELONE (21/21)"; archer-slinger exit 0 "51 OK, 0 FAIL"; army-multi-select exit 0 (w wyjściu: "Chromium/live panel: NIE_ZMIERZONO" -- część live nie zmierzona); full-cost exit 0 "40 passed, 0 failed"; multitype-walk exit 0 "25 OK, 0 FAIL"; promotion-table exit 0 "PASS: 32 wpisów źródłowych, 63 krawędzi, brak cykli".

BLOKADY (jawna lista)
(a) roundtrip: mutacja dynamiczna NIE-ZMIERZONO (powód wyżej).
(b) unit-replace-army-multi-select: część Chromium/live NIE_ZMIERZONO (brak playwright/jsdom w piaskownicy).
(c) realpath: mutacje m02-m17 i SIGKILL z dzieckiem NIE-ZMIERZONO w tej rundzie.
(d) hotseat-D: harness zależy od ręcznych mocków zagnieżdżonych funkcji main.ts; każda runda main.ts może dodać kolejne (rekomendacja: wspólny loader, jak r1 Evaluatora).
BŁĘDY GRY (kandydaci R-WEB-*): nie stwierdzono. Czerwień hotseat-D w r3 była harnessem.

UWAGI-DLA-ORKIESTRATORA
(1) Uruchamianie: dwa testy roundtrip domyślnie odpalają seeds równolegle (dwa Chromium) -- sprzeczne z zasadą "jeden Chromium naraz"; zaproponować --seeds po jednym w runnerze lub szeregowanie.
(2) realpath zostawia katalog DIST w /tmp po biegu (nie kasowany).
(3) Asercja isPeaceLockedBetween w hotseat-D została zmieniona (patrz KLASYFIKACJA (b)) -- proszę o ocenę Evaluatora.
(4) gra/node_modules zainstalowany w worktree (npm ci --ignore-scripts, ignorowany przez git); sprzątane po commicie.

RUNDY: 3/5 (dodatek r3 orkiestratora, operator).
NASTĘPNY KROK: Evaluator r3 -- ocena zmiany asercji isPeaceLockedBetween i nowych spy; ewentualnie runda 4: (1) dynamiczna mutacja roundtrip (jeden seed); (2) realpath: kasowanie DIST w finally; (3) m02-m17 pełnym biegiem.
DEPLOY/PUSH: NIE WYKONANO
