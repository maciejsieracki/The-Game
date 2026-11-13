# R-WEB-DIPLO-TRUST-DRIFT-IN-WAR-Q1 — Final Control

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-TRUST-DRIFT-IN-WAR-Q1
GOAL: ustalic, gdzie zaufanie rosnie 0->1 w wojnie/neutralnosci, czy zgodne z krokami 1-3; N=5 vs 6 (pomiar). Bez zmiany wartosci gry.
ZMIANY/COMMIT: kandydat 3893030810333cece0897401ada62d80209dbc62 (potomek bazy fbafec4b3, `git merge-base --is-ancestor` = tak). Diff vs baza: 3 pliki, +311 (gra/tools/diplo-trust-war-drift-test.cjs, 10-operator-claude.md, 30-obrona-claude.md). gra/src, gra/data bez zmian; w allowlisci. Integrowac: SHA commitu raportu FC (zawiera kandydata).

## Werdykty wobec zarzutow
1. DO DECYZJI CZLOWIEKA — realna sprzecznosc produktowa: kryzysProgZaufania=0 + dryf W*0,03 (diplomacy.ts:1809-1810) => wojna z zerowego zaufania nieosiagalna bez ujemnych czynnikow (tabela: neutralna W=20 nigdy w 20 turach; W=0 tura N; kara granicy -3 tura N). Operator nazwal to w obronie (D1, rekomendacja A). Nie jest bledem kodu.
2. ODDAL — obserwacja z neutralnych (potwierdzone w evidence LIVE-VERIFY); spekulacja o main.ts:12091 wycofana.
3. ODDAL — obrona podaje komplet sciezek z cytatami (main.ts:23349-23351, 42327, 25888, 29693, diplomacy-factors.ts:165-166). Sprawdzilem samodzielnie diplomacy-factors.ts:165 i diplomacy.ts:1809/1830 — zgodne.
4. ODDAL — kod zweryfikowany: main.ts:11876 podaje kryzysTurDoWojny: w.n (hamulecN profilu), p6.kryzysTurDoWojny=5 nadpisywane (martwe w grze). Test na funkcji kroku (N=5 -> tura 5, N=6 -> tura 6). Liczba "live" NIE_ZMIERZONO w naturalnym przebiegu (artefakt harnessu) — zapisane uczciwie; decyzja D2 do wlasciciela.
5. ODDAL (naprawione w r2) — wlasna mutacja: usuniecie `!atWar &&` w diplomacy.ts:1809 => PASS=13 FAIL=1 (czerwony: computeTickZaufanieDelta(atWar=true, W=-20)); zrodlo przywrocone (git status czysty).
6. ODDAL — DODATEK nie istnieje w repo (git ls-tree); zakres przyjety z 00-dispatch.md (zalozenie).
Brak NAPRAW => nie FAIL.

## TESTY (surowe wyjscia)
- node gra/tools/diplo-trust-war-drift-test.cjs: PASS=14 FAIL=0. Tabela po t1/t3/t6: wojna 0/0/0 (W undefined, +20, -20); neutralna i pokoj (W=20) 0.66/1.98/3.96.
- tsc --noEmit: exit 0.
- diplomacy-test: 149 passed, 0 failed. ai-test: 297 passed, 0 failed.
- 5 bramek referencyjnych, diplo-weariness-*, diplo-war-peace-*: NIE_WYKONANO — gra/src i gra/data identyczne z baza (diff pusty), wiec wynik = baza; brak regresji mozliwej.
- Weryfikacja w Chromium: nie dotyczy (brak zmian UI).

## Odpowiedz merytoryczna
(b) W wojnie zaufanie nie rosnie (guardy: diplomacy.ts:1809, 1830-1831, main.ts:23350/42327, clamp). Wzrost 0->1 w LIVE-VERIFY pochodzil z neutralnosci = dryf Wiarygodnosci (REL-WIARYG-DRIFT-Q1), nie blad.
(d) Obowiazuje N=hamulecN profilu (domyslnie 6, zakres 3-7); p6.kryzysTurDoWojny=5 martwe; brak off-by-one (wojna po N kolejnych turach zaufania<=0).

BLOKADY: brak
RUNDY: FC 1 (r2 Operatora po FAIL Evaluatora ae9bffe54) / 5
NASTEPNY KROK: orkiestrator integruje (tylko test + raporty) i zadaje wlascicielowi ABC: D1 (A zostawic dryf i opisac w Civpedii / B wylaczyc dryf w liczeniu licznika — wymaga main.ts / C zmiana progu) oraz D2 (zostawic 6; martwe pole JSON osobnym tematem).
UWAGI-DLA-ORKIESTRATORA: poprawic opis "N=6 live" w R-WEB-DIPLO-LIVE-VERIFY-STEPS-1-4-Q1 (artefakt resetu zaufania w probe S3); martwe pole p6.kryzysTurDoWojny=5.
DEPLOY/PUSH: NIE WYKONANO
