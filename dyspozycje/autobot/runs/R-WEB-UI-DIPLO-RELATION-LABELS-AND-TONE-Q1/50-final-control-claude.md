# R-WEB-UI-DIPLO-RELATION-LABELS-AND-TONE-Q1 — Final Control (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-UI-DIPLO-RELATION-LABELS-AND-TONE-Q1
GOAL: etykiety perspektywy relacji (AI w wierszu wpływu, gracza w audiencji) i neutralny ton wiersza przy „Możesz przyjąć”, bez zmian silnika.
ZMIANY/COMMIT: kandydat 60936e397 (potomek bazy e607cc120 i 6409ef95d — `merge-base --is-ancestor` OK). Zmiany względem bazy: diplomacyAcceptanceBalance.ts, diplomacyAudience.ts (tylko etykiety), diplomacy-relation-labels-test.cjs, diplomacy-relation-deal-text-consistent-live-test.cjs, raporty runu. Wszystko w allowliście; brak zmian w gra/src/game, JSON, WERSJE.md, rust-port. `git diff --check` czysty. Wiki/wikiBundle: frazy „Wpływ Relacji na deal” dotyczą nazwy wiersza (bez zmian), nowe etykiety nie występują w wiki — regeneracja zbędna.

TESTY (surowe wyjścia, kandydat 60936e397):
- tsc --noEmit: exit 0
- diplomacy-relation-labels-test 23/0; deal-text-consistent 6/0; acceptance-points 304/0; dyplo-pokoj-kierunek 18/0
- logic 213/213; tech-tree 20/0; research 33/0; unit-replace 21/21; combat 6/6 (unit-power nie uruchamiany: znany czerwony pre-istniejący, poza zakresem UI)
- Live Chromium (Vite build poza repo): consistent-live 14 pass/0 fail (1. przebieg, bez timeoutu); value-mismatch-live 10/0; zero console.error/pageerror. Zrzut obejrzany: wiersz „Relacja z perspektywy AI 11,6 · wymiana symetryczna” neutralny, audiencja „Relacja z perspektywy gracza 90 / 200”, „Możesz przyjąć”, Przyjmij aktywny.

ZARZUTY:
1. Brak asercji live — ODDAL (Obrona dodała 4 asercje live i uruchomiła value-mismatch; zweryfikowane: 14/0, 10/0).
2. Brak asercji etykiet audiencji — ODDAL (asercja na wiersz relacja-total w live teście; Obrona zgłasza mutację 13/1; nie powtarzano mutacji).
3. incomingAccepted neutralne także przy Relacji >100 i widoczne „−88,4%” — ODDAL jako założenie zgodne z dispatchem (neutralny ton i „wymiana symetryczna” dla całego „Możesz przyjąć”); test @120 jest, tooltip „trzeba dopłacić” usunięty. Nota: procent pozostaje widoczny przy neutralnym tonie — ewentualna decyzja produktowa właściciela, nie blokuje.
4. Zawijanie etykiety na 3 wiersze — ODDAL (kosmetyka, czytelne na zrzucie, brak kryterium binarnego).
Brak NAPRAW; brak DO DECYZJI blokującej.

BLOKADY: brak
RUNDY: 1/5 (Final Control)
NASTĘPNY KROK: integracja orkiestratora (FF/merge 60936e397 razem z raportem FC), potem READY_FOR_DEPLOY po bramkach.
DEPLOY/PUSH: NIE WYKONANO
