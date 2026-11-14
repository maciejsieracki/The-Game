STATUS: PASS-WITH-NOTES (obrona r4; werdykt końcowy należy do Evaluatora/Final Control)
DOMAIN: GAME
TEMAT: R-WEB-ECON-END-TURN-GATE-PROJECTION-ONLY-FROM-TURN1-Q1
GOAL: bramka „Zakończ turę” liczy prognozę po turze (po reakcji automatu żywności), od tury 1; brak ręcznej dźwigni = brak blokady; propozycja podatku krokowa; stabilne API dla UI.
BAZA/KANDYDAT: kandydat Operatora r3 50565e3f3 (worktree wf_7b73eaa4-0a5-3, gałąź worktree-wf_7b73eaa4-0a5-3); niniejsza obrona = commit na czubku tej gałęzi. Uwaga: 50565e3f3 NIE jest potomkiem aktualnego origin/main (78af786ed); integracja i ewentualny rebase należą do orkiestratora.
RUNDY: obrona 4 (odpowiedź na zarzuty Evaluatora 49e6d161f, r3)

## ZMIANY/COMMIT
- gra/tools/end-turn-gate-live-test.cjs: (a) scenariusz b: asercja `propozycjaPodatku.szacunek === 'krokowy'` i `punktyProcentowe > 0` (łapie wyłączenie wpięcia prognozaPoPodatku w nnsGateForPlayer); (b) scenariusz b: odczyt fingerprint przed/po `gateInfo()` i asercja równości (brak efektów ubocznych); (c) tryb tabeli `--neg 1`: wymuszone prognozy Spichlerza < 0 przed automatem (racja 6, Auto-Żywienie, zapas 0, podatek 30/60/10).
- Kod gry (no-negative-stocks.ts, main.ts) NIE zmieniony w tej rundzie (main.ts przywrócony po mutacji, git status czysty poza testem).
- Nowe dowody: dyspozycje/autobot/runs/R-WEB-ECON-END-TURN-GATE-PROJECTION-ONLY-FROM-TURN1-Q1/r4/ (result-cand-seed11.json, result-mut-wiring-seed11.json, table-neg-seed11/22/33.json).
- Lokalnie: gra/node_modules zainstalowane przez npm ci (gitignored), build poza repo w scratchpad.

## TESTY (surowe wyniki, ta runda)
- npx tsc --noEmit: exit 0.
- end-turn-gate-projection-only-test: 49 passed, 0 failed (exit 0).
- live (kandydat 50565e3f3 + nowe asercje), seed 11: 9/9 PASS, błędy strony 0 (a/b/c/d/d2/e@t1-4, a/b/c@t12). b@t1 i b@t12: sideEffectFree=true, szacunek=krokowy.
- live MUTANT (wiring: `...(false && _nnsTaxStepDeltas.length > 0`, main.ts l.39801), seed 11: 7/9 — FAIL b@t1 i b@t12 (nowa asercja krokowy/side-effect łapie mutanta). Przywrócono main.ts (git checkout), potwierdzone git status.
- tabela NEG (wymuszona prognoza Spichlerza < 0 przed automatem), tury 1–15, ziarna 11/22/33: 45 wierszy, rozbieżnych |diff|>0.5: 0. Każdy wiersz: spBase = -4, autoDelta = 4.5 (t1–t13) lub 6 (t14–t15), prognoza po automacie 0.5 lub 2 = realny Spichlerz po endTurn (diff 0). Skarbiec 98/100 = realny (diff 0).
- Ograniczenie tabeli NEG: reżim jest jeden (spBase stałe −4, ziarno nie zmienia wartości), więc to 3 niezależne próbki jednego punktu, nie pełny zakres. Prognozy Skarbca < 0 nie są porównywalne w tabeli, bo bramka je blokuje (0 wierszy blocked w NEG); zgodność po podatku dla Skarbca mierzy scenariusz c (realny Skarbiec = prognoza ±0.5).
- NIE URUCHOMIONO w tej rundzie: live-verify-wave-689-697-a-gate-v2/v4, ai-t2-behavior-test, c3-turn-test, mutacje side-effect (np. mutant usuwający fingerprint-pewność). NIE ZMIERZONO.

## ODPOWIEDZI NA ZARZUTY EVALUATORA
1. [wiring nie zabezpieczony] PRZYJMUJĘ. Poprawka: asercja `szacunek === 'krokowy'` w live b (commit tej rundy). Dowód: mutant `false &&` daje FAIL b@t1 i b@t12 (r4/result-mut-wiring-seed11.json); kandydat daje PASS (r4/result-cand-seed11.json). Test pure (11a regex) nie był zmieniony; wiązanie pokrywa live.
2. [brak prognoz ujemnych w tabeli] PRZYJMUJĘ CZĘŚCIOWO. Dodano tryb --neg z reżimem spBase<0 + automat; 3 ziarna x 15 tur: 45 wierszy, 0 rozbieżności (r4/table-neg-seed*.json). Pozostaje: reżim jednopunktowy (spBase −4) i brak porównania prognoz Skarbca < 0 (blokowane przez bramkę, więc nie ma realnego endTurn do porównania) — to ograniczenie zapisuję jawnie, NIE ZMIERZONO dla innych wartości spBase.
3. [brak asercji efektów ubocznych] PRZYJMUJĘ. Dodano porównanie gateStateFingerprint przed/po gateInfo w scenariuszu b (sideEffectFree=true w t1 i t12, asercja w ok). Hook pokrywa racje miast, podział podatków, skarbiec, zapas Spichlerza (main.ts ~31933). Mutacja side-effect NIE wykonana (NIE ZMIERZONO).
4. [v2/v4 i ai-t2/c3 nieuruchomione] PRZYJMUJĘ jako NIE ZMIERZONO (brak czasu w tej rundzie; nie udaję wykonania). Zalecenie dla orkiestratora: uruchomić live-verify v2 (check --deficit) i v4 przed FC; to jest dług do domknięcia przed READY_FOR_DEPLOY, bo oczekiwanie „blokada od tury 1” w tych testach nie zostało zmierzone po zmianie.
5. [zmiana semantyki „częściowa dźwignia ⇒ blokada”] ODRZUCAM jako defekt kodu. Zachowanie wynika wprost z DODATKU 6 (Zasada semantyczna: „gdy istnieje realna niewykorzystana dźwignia ... a jej pełne użycie nadal nie wystarcza — blokada obowiązuje i propozycja niesie flagę niewystarczające”) i z decyzji właściciela (DODATEK 2: blokada tylko przy realnej ręcznej dźwigni). Ryzyko UX (gracz blokowany, gdy maksymalny podatek nie wystarcza, a ma jednostki do rozwiązania) jest świadomie przekazywane orkiestratorowi jako decyzja do potwierdzenia przez właściciela; nie zmieniam tego bez jego zgody.
6. [tooltip nie widoczny na PNG] ODRZUCAM. Tooltip jest atrybutem `title` przycisku (natywny tooltip przeglądarki, nie element DOM renderowany na zrzucie). Dowód treści: result-cand-seed11.json, scenariusz b, pole buttonTitle = „Nie można zakończyć tury. Skarbiec (złoto): po zakończeniu tury zabraknie 6 …”; asercja `btnB.title` zawiera „po zakończeniu tury” w live (PASS). Zrzut PNG pokazuje wygaszony przycisk, co jest zgodne z canEnd=false.

## BLOKADY
- Brak ponownego uruchomienia v2/v4 i ai-t2/c3 (zarzut 4) — do domknięcia przed READY_FOR_DEPLOY.
- Ryzyko UX z zarzutu 5 wymaga decyzji właściciela (nie blokuje testów).
- Wpięcie w main.ts jest na ścieżce bramki gracza (nnsGateForPlayer); nie dotknięto ścieżki ofert AI.

## UWAGI-DLA-ORKIESTRATORA
- Baza: 50565e3f3 nie zawiera origin/main 78af786ed; przed integracją trzeba rebase/merge i regeneracja wikiBundle (zgodnie z dispatchem). Nie wykonywano.
- Nie tworzono żadnych sesji/zadań (zakaz właściciela); nie integrowano, nie pushowano na main.

RUNDY: 4/5 (obrona). NASTĘPNY KROK: Evaluator r4 — weryfikacja asercji krokowy/side-effect na kandydacie i decyzja o zarzucie 4 (v2/v4).
DEPLOY/PUSH: NIE WYKONANO
