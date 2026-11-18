STATUS: DECISION_REQUIRED
DOMAIN: GAME (testy/narzędzia; logika gry nietknięta)
TEMAT: R-WEB-TEST-DEBT-Q4-UPGRADE-ENDTURN-TERMINOLOGY-Q1
GOAL: naprawić 4 czerwone testy długu bazowego (baza b2d5b4e51), bez osłabiania asercji.
ZMIANY-COMMIT:
- 809272ef3 (2) gra/tools/end-turn-block-event-test.cjs: asercja (f) szuka `hintEndTurnBlocked` do następnej deklaracji `\n    function ` zamiast okna 2500 znaków. Przed: 34 pass / 1 fail. Po: 35 pass / 0 fail. Mutacja w kopii (usunięte `noteEndTurnBlockedByNns()` w gałęzi NNS): 34 / 1 FAIL (f).
- 25b63a2cd (3) gra/tools/barb-karencja-czas-trwania-real-render-test.cjs: FALLBACK_CHROME = /opt/pw-browsers/chromium (chromium-1194 nie istnieje; to skrypt powłoki na chromium-1243, Chrome 153). Przed: błąd launch (nie zapisano kodu wyjścia). Po: 13 PASS / 0 FAIL. Mutacja w kopii (chipy `[5, 10, 16]`): 11 PASS / 2 FAIL.
- (1) i (4): brak commitów (patrz BLOKADY).
- npm ci --ignore-scripts w gra/ (node_modules nieśledzone, bez zmian w git).
TESTY (surowe wyniki, przed -> po):
- tsc --noEmit: EXIT 0.
- logic-test: 213 PASS, 0 FAIL. tech-tree-test: 20 pass, 0 fail. research-test: PASSED 33 / FAILED 0. unit-replace-test: 21 linii [OK]. combat-test: 6/6.
- upgrade-budynki-test: 60 pass / 1 fail przed i po (bez zmian).
- end-turn-block-event-test: 34/1 -> 35/0.
- barb-karencja-czas-trwania-real-render-test: błąd launch -> 13 PASS / 0 FAIL.
- terminology-trade-vs-tax-test: 798 pass / 1 fail przed i po (FAIL: `[G] gen-building-cards-top5.cjs --check`).
BLOKADY:
(1) upgrade-budynki „stale palisade completion”: applyCompletedBuildingIds(['mury_kamienne','mury','fort'], 'palisada') zwraca ['mury_kamienne','mury','fort'], oczekiwano ['mury','fort']. Przyczyna: gra/src/game/production.ts:922-923 (blockedByHigher) usuwa tylko completedBuildingId i lowerIds; niższy mury_kamienne już obecny zostaje. Komentarz production.ts:919 obiecuje „zostaje najwyższy”, więc to rozjazd kod vs kontrakt, nie błąd testu. Wejście z dwoma poziomami muru jest stanem niespójnym (naprawia go collapseFortificationChain). Asercji NIE zmieniono (zmiana oczekiwania = zakodowanie błędu). Kandydat na osobny temat (logika gry): collapse w applyCompletedBuildingIds albo test na realistycznym stanie ['mury','fort'].
(4) terminology: generator daje „Wytwarza ceramikę: do 50 sztuk na turę” (źródło: dyspozycje/analizy/karty-budynkow/budynki-top5.csv, wiersz Garncarnia). Commitowany gra/data/building-cards-top5.json ma „30–110” (zgodne z econ-params.json:404-410, decyzja 2026-11-14). Regeneracja cofnęłaby poprawny tekst do nieaktualnego: NIE zregenerowano, plik przywrócono (git checkout). Właściwa naprawa wymaga zmiany źródła poza allowlistą (CSV w dyspozycje/ lub korekta w gra/tools/card-text-corrections.cjs).
DECYZJE DLA ORKIESTRATORA:
Q1: czy (1) zostawić czerwony z kandydatem, czy zmienić test na stan realistyczny ['mury','fort']?
Q2: dla (4) czy dopuścić edycję CSV/korekt poza allowlistą?
RUNDY: 1/5 (ostatni werdykt: brak; Operator, bez Evaluatora).
NASTĘPNY KROK: decyzja Q1/Q2, potem runda 2 (tematy 1 i 4) i bramki. Zalecane: (1) jako osobny temat logiki gry.
UWAGI-DLA-ORKIESTRATORA: administrator-panel-real-render-test.cjs i administrator-icon-everywhere-render-test.cjs nadal mają FALLBACK_CHROME = chromium-1194 (ten sam błąd, poza zakresem tematu).
DEPLOY/PUSH: NIE WYKONANO
