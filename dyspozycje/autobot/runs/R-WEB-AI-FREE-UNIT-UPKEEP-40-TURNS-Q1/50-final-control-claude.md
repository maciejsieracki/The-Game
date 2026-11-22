STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-AI-FREE-UNIT-UPKEEP-40-TURNS-Q1
GOAL: AI nie płaci utrzymania jednostek (złoto, surowce, żywność) w turach 1..40 włącznie; od tury 41 pełny koszt; rekrutacja płatna; gracz bez zmian.
ZMIANY/COMMIT: kandydat 116fa3055eae0a58fca39b0ad4fb633ab06c4d6c; baza a6fb5061a3332215a9b42f2b8d0918ab8e8c07d4 jest przodkiem (git merge-base --is-ancestor = OK). Diff: 9 plików, +535/-20 — wszystko w allowliście (ai-free-unit-upkeep.ts, params.json, economy-upkeep.ts, turn-economy.ts, main.ts podpięcia, nowy test, analiza, raporty). Brak gra-robocza/kanon/WERSJE/rust-port.

OCENA ZARZUTÓW (bez etykiet ról):
1. Off-by-one okna: NAPRAWIONE. Jedyny wołający runWorldEndTurn (main.ts L49270) ma try/finally; override = turn-1 ustawiany tuż po turn++ (L43307), zdejmowany przed fazą AI (L48547) i w finally. Tick kończący turę 40 widzi 40 (darmowy), kończący 41 widzi 41 (płatny). Potwierdzone czytaniem kodu; pełny runWorldEndTurn nie jest testowany behawioralnie (pin tekstowy) — NOTE.
2. Brak liczbowej asercji surowców: NAPRAWIONE. Test ma asercje liczbowe; moja mutacja (okno -> false) daje 27 ok / 7 FAIL.
3. Bramka rekrutacji syntetyczna: CZĘŚCIOWO. aiUpkeepRunwayAllows dostaje tempo przez paceUtrzymaniaWlasciciela (diff L39510/39555), test d2 + piny; brak testu end-to-end — NOTE.
4. Niepodpięte miejsca: CZĘŚCIOWO. Podpięto 10 miejsc w main.ts (garnizon, NNS, karty w main, statystyki AI, podglądy zamiany/rekrutacji). Zostają globalne: unitInfoCard.ts/unitAdapter.ts (karty jednostek) i suwak AI (~L46100) — rozbieżność tylko HUD/kosmetyczna, nie wpływa na tick. Do decyzji orkiestratora.
5. Pomiar kierunkowy / dokument analizy: NIE ZMIERZONO. Dokument istnieje ze statusem NIE ZMIERZONO (uczciwie); nie blokuje.
6. Wyjątki państwa-miasta/bariery: brak gotowego helpera, wyjątków nie zastosowano (tylko isHuman) — udokumentowane założenie; zgodne z dispatchem ("tylko jeśli istnieje helper").

TESTY (własne uruchomienie na 116fa305, wyniki z surowego wyjścia):
tsc --noEmit rc=0; logic-test 213/213; tech-tree 20 pass 0 fail; research 33/33 ALL GREEN; unit-replace-test rc=0 (wszystkie OK); combat 6/6; ai-free-unit-upkeep-test 34 ok 0 FAIL; unit-resource-upkeep 7/0; ai-upkeep-runway 17/0; ai-upkeep-wiring 4/0; unit-cost-tempo rc=0; upkeep-test 91/0; recruitment-no-upkeep-gate 37/0; ai-recruit-upkeep-gate 23/0.
Mutacja własna (return false w aiFreeUnitUpkeepActive): 27 ok, 7 FAIL — test czerwony; plik przywrócony.
unit-upkeep-cost-pace-test: 80 ok, 1 FAIL ("wszystkie wywołania silnika utrzymania w 27 miejscach niosą tempo") — IDENTYCZNY wynik na bazie a6fb5061 (pre-existing, nie regresja).

BLOKADY: brak blokujących. NOTE: pomiar live NIE ZMIERZONO; karty jednostek/suwak AI nie podpięte; brak testu end-to-end runWorldEndTurn.
RUNDY: FC po rundzie 2/5
NASTĘPNY KROK: integracja orkiestratora (merge, bramki), decyzja o kartach jednostek/suwaku AI jako osobny temat, pomiar live jako osobny odcinek, deploy FALA 890 na ROBOCZĄ po autoryzacji.
UWAGI-DLA-ORKIESTRATORA: pre-existing FAIL unit-upkeep-cost-pace-test (27 miejsc) — rozważyć re-pin osobnym tematem.
DEPLOY/PUSH: NIE WYKONANO
