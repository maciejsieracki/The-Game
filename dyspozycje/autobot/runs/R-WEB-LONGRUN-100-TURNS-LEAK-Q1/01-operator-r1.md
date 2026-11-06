STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-LONGRUN-100-TURNS-LEAK-Q1
GOAL: Zmierzyc w realnej grze 100 tur (Chromium, bundle vite poza repo, ?civTest=1, mgla OFF, gracz tylko konczy tury) czas tury, pamiec i liczność struktur; wskazac, co rosnie nieograniczenie / powoduje spowolnienie po ~t.60-80; naprawic minimalnie, jesli przyczyna jednoznaczna.

ZMIANY/COMMIT: SHA w sekcji ponizej (jeden commit, PUSH NIE).
- gra/src/game/trade-routes.ts: nowa funkcja `memoizeOwnerResourceAccess` (+20 linii, tylko dodatek).
- gra/src/main.ts: import + 1 linia w `recomputeTradeRouteResourceGrants` (okolice :5236).
- gra/tools/longrun-100-turns-leak-q1-measure.cjs (NOWY skrypt pomiarowy, --prepare/--run, hak `__leakDump`, liczniki faz AI/dyplomacji, listenery/timery, --cpuprof, --lkstack).
- gra/tools/longrun-100-turns-leak-q1-memo-unit-test.cjs (NOWY test jednostkowy memoizacji).
- dyspozycje/autobot/runs/R-WEB-LONGRUN-100-TURNS-LEAK-Q1/: turns-every5.csv, profile-and-growth.md, raw-*.jsonl (400 KB lacznie).
Bez zmian balansu; zero zmian w gra-robocza/, WERSJE.md, rust-port/, src-tauri/, battle/.

TESTY:
- Pomiar PRE: seed 4242 -- 100 tur (komplet), seed 777 -- tylko do t.73 (proces przerwany; t.74-100 NIE_ZMIERZONO).
- Pomiar POST (z poprawka): seed 4242 -- 100 tur (komplet) + profile CPU t.10/40/70/95; osobny krotki przebieg `--lkstack` (10 tur) do identyfikacji listenerow.
- Test jednostkowy memo: 6 PASS, 0 FAIL (wynik identyczny z/bez memo na 215 grantach; wywolan bazowych 1351 -> 60; osobne instancje nie dziela cache).
- tsc --noEmit (gra/): EXIT=0, bez bledow.
- Regresje: trade-grant-test 62/0, zloto-szlak-test 54/0, mennica-uspienie-test 49/0, trade-ilosc-test 35 PASS / 5 FAIL -- awarie dotycza `TRADE_ROUTE_STOCK_FLOW_KEYS` / `capacityPerRoutePerTurn` (kon w kluczach przeplywu, 6 zamiast 3 kluczy), kodu NIETKNIETEGO tym zmianami (diff trade-routes.ts to wylacznie nowy eksport); nie weryfikowane na czystym origin/main -> uczciwie: prawdopodobny dlug testowy istniejacy wczesniej, do potwierdzenia przez Evaluatora.

WYNIKI (szczegoly i tabele: profile-and-growth.md, turns-every5.csv)
1) Czas tury (seed 4242, PRE): 31 s (t.5) -> 15 s (t.25) -> 25 s (t.50) -> 36 s (t.70) -> 53 s (t.100). Faza AI: 0.3 -> 2.9 -> 4.0 s, dyplomacja AI: ~0.001-0.01 s -- obie <10% tury. Maszyna byla mocno obciazona innymi sesjami (load 13-32/4 rdzenie), wiec ms bezwzgledne w POST sa ~2-3x wieksze; wnioski opieram na udzialach w profilu CPU.
2) Pamiec: po GC 312 -> 625 MB, liniowo +3.1 MB/ture, bez przyspieszenia po t.60. DOM plaski (1289 -> ~1305), timery 0-1, interwaly 3 (plaskie). Listenery netto 383 -> 5135 (~+47/ture od t.1), ale to elementy panelu (pasek narzedzi mapy ui/mapToolbarHud.ts:161, panel wydarzen ui/sidePanelHud.ts, `data-wykonaj` ui/bottomBarHud.ts:275) odtwarzane przez innerHTML; wezly znikaja z GC, brak listenerow na window/document w top-12 -> licznik, nie wyciek.
3) Struktury rosnace (t.50 -> t.100): `placedImprovements` main.ts:14638 (1294 -> 2953 hexow, 7188 warstw), `improvementMeshes` :14656, `cityBuilt` :3292, `roadRenderedHexes` :14664, `tradeRoutes` :3297 (74 -> 118), `wiarygodnoscZdarzeniaByOwner` :9101 (123 -> 362, bez przycinania -- tablica tylko rosnie; skala mala, pomijalny koszt). To stan gry, nie nieograniczony wyciek; `activeDeals`, dyplomacja, powiadomienia -- plateau. Zadne Map/Set nie rosnie wykladniczo.
4) PRZYCZYNA SPOWOLNIENIA (jednoznaczna, potwierdzona profilem CPU w 2 ziarnach): `computeTradeRouteResourceGrants` (trade-routes.ts:1881; koszt `xji`) wolane z `recomputeTradeRouteResourceGrants` (main.ts:5236) po kazdej turze. Dla kazdej trasy x 5 surowcow pyta 4x `ownerHasNativeResourceAccess` (main.ts:5202), a kazde pytanie przelicza `placedImprovementsForOwner` (main.ts:5151) = petla po WSZYSTKICH ulepszeniach mapy x `territoryOwnerAt` po wszystkich wezlach terytorium. Koszt = trasy x ulepszenia x miasta: 0 s (t.10) -> 0.95 s (t.40) -> 7.5 s (t.70) -> 19.2 s (t.95) z 57.5 s profilu t.95; to ~65% JS konca tury i ~1/3 calego czasu. Seed 777: 1.05 s (t.40) -> 4.2 s (t.70). Roznica jakosciowa wobec obserwacji "okolo t.80": trasy handlowe pojawiaja sie ok. t.25-30, koszt rosnie z liczba ulepszen i tras (superliniowo).

NAPRAWA (minimalna, bez zmiany balansu): memoizacja `(wlasciciel, surowiec)` na czas JEDNEGO przeliczenia (cache zyje w domknieciu, nie miedzy turami; stan gry nie zmienia sie w trakcie przeliczenia, wynik identyczny -- test). Wynik POST (seed 4242, t.95): `xji` 19.2 s -> brak w profilu; JS konca tury (`nkM`/`YkM`) 29.7 s -> 11.6 s mimo ~3x wiekszego obciazenia maszyny; `LU` 20.0 -> 1.45 s. Surowe ms POST nie nadaja sie do porownania (load).

OPCJE (NIE wdrozone -- wieksze/niejasne, do decyzji):
 A) Drugi hotspot: `placedImprovementsForOwner` nadal ok. 14 s inkl. w t.95 POST; glownie `mAA` (auto-ulepszanie jednostek: `UR(G)` wola dostep do surowcow PER JEDNOSTKA, ~5.4 s przy ~490 jednostkach) -- fix: cache wyniku per (owner) na czas petli. Mniejsze: ocena handlu AI (`PDA`), `Ro`/`lC`/`ii` ok. 0.7 s kazde.
 B) Trwaly cache `placedImprovementsForOwner` uniewazniany przy zmianie `placedImprovements`/`cities` (wiekszy zakres, ryzyko nieswiezosci).
 C) Przycinanie `wiarygodnoscZdarzeniaByOwner` po czasie zapomnienia (nie pilne).
 D) Wczesne tury (t.5-20, 30 s): ~20 s to `(program)` = natywny render swiftshader plus AI-handel `PDA`->`Kc`->`Do`->`wCA` (skan calej mapy per zapytanie) -- artefakt srodowiska/headless, nie wyciek.

BLOKADY:
- Seed 777 PRE niedokonczony (t.73) -- proces przerwany w poprzedniej probie; brak POST dla seed 777; POST tylko na seed 4242. Wnioski dla 2. ziarna oparte na profilach t.10/40/70 PRE.
- Obciazenie maszyny (load 13-32) uniemozliwia porownanie ms PRE/POST; trajektorie PRE i POST nie sa bit-identyczne.
- trade-ilosc-test: 5 FAIL (niezwiazane z diffem; niezweryfikowane na czystym main).
- Wiadomosc wlasciciela w kontekscie (mnozniki dla cegielni) -- adresowana do orkiestratora; NIE wykonana.

RUNDY: 1/5
NASTEPNY KROK: Evaluator R-WEB-LONGRUN-100-TURNS-LEAK-Q1 (zweryfikowac memo + powtorzyc krotki POST na 2. ziarnie; potwierdzic baseline trade-ilosc-test na czystym origin/main); decyzja orkiestratora co do opcji A.
DEPLOY/PUSH: NIE WYKONANO
