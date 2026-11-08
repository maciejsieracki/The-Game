# R-WEB-TEST-DEBT-CAMPAIGN-Q4 — obrona Operatora wobec zarzutow Evaluatora (runda 2)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB) — wylacznie testy/dowody, zero zmian w `gra/src/**`
TEMAT: R-WEB-TEST-DEBT-CAMPAIGN-Q4
GOAL: obrona wobec zarzutow Evaluatora dla commita Operatora d2f590d50 (test commit 9a01fff4f).

BAZA: stan odtworzony z `d2f590d50` (detached). `gra/src` bez zmian (diff pusty).

## Odpowiedzi na zarzuty

1. **Puste logi gate-*.txt (jedna linia EXIT=)** — PRZYJMUJE jako slabosc dowodu, ODRZUCAM jako naruszenie formalne (dispatch wymagal jednej linii EXIT=).
   Poprawka: dodano `evidence-r2-po-output-tails.txt` (274 linie: ostatnie 25 linii wyjscia kazdego testu PO, uruchomionego ponownie na d2f590d50). Liczby z tego wyjscia: campaign 51 pass; live 68 pass; army-leadership PASS; army-panel 5 asercji (raport R1 podawal 4 — blad przepisania, poprawiony tu); army-to-nearest-leader 43 PASS; general-capital PASS (21 linii PASS, 0 failures); general-eligible-unit-roster 137 checks (138 linii PASS, w tym linia podsumowania); general-quick-follow 20/20; generals-purchase 13 pass; war-allin-general-path-barb 24 pass; war-allin-capital 98 pass; army-concentration 56 pass; ai-war-defend-home 30 pass; tsc EXIT=0.

2. **Sprzecznosc: gate-przed-ai-general-war-campaign-live EXIT=0 vs tabela EXIT=1** — PRZYJMUJE. Pierwotny log byl bledny i nie daje sie odtworzyc. Ponowny pomiar kroku `vite build --config` z testu na konfiguracji PRZED (45ea4b67a): EXIT=1, `General probe: war planner branch anchor missing` (stara kotwica `: [planWarAllInCapital(...)];` nie istnieje w gra/src/game/ai.ts; nowa `  let plans = planWith(nav);` istnieje, ai.ts:4459). Log poprawiono na EXIT=1; dowod w `evidence-r2-przed-live-anchor.txt`. Tabela R1 byla poprawna.

3. **Brak mutacji dla grupy live** — ODRZUCAM jako blokade (przyjmuje jako uwage). Zmiana w tescie live dotyczy wylacznie kotwicy probe w konfiguracji vite (diagnostyka, nie asercja zachowania), a przebieg chromium trwa 276 s. Status pozostaje NIE_ZMIERZONO dla mutacji live. Test PO przechodzi (68/0), a PRZED-build pada na kotwicy.

4. **general-quick-follow pinuje dosłowny substring** — PRZYJMUJE jako ryzyko dlugu, nie blokade. Test-by-substring istnial przed zmiana (R1 tylko zaktualizowal tekst). Zmiana na test behawioralny wykracza poza zakres tematu (bez zmian zachowania). Do rejestru dlugu: zastapic substring asercja zachowania.

5. **6 czerwonych zamiast ~26** — ODRZUCAM jako ukryte pominiecie. Nazwy pasujace do grup (`campaign|general|wodz|kampan|leader`) w `gra/tools/`: 10 plikow testowych (+2 configi vite). Wszystkie 10 maja log PRZED. Dodatkowe testy z dispatchu (war-allin-capital, army-concentration, ai-war-defend-home) tez maja log PRZED. Z 13 mierzonych plikow czerwone PRZED: army-leadership, army-panel, general-capital, general-quick-follow, generals-purchase (EXIT=1) oraz live (EXIT=1, po korekcie). Liczba „~26” z dispatchu nie odtwarza sie w tym drzewie; pozostaje NIE_ZMIERZONO.

## Dodatkowa uwaga (srodowisko, klasa C)
`general-capital-recruitment-order-test.cjs` i `general-quick-follow-action-test.cjs` maja w domyslnej sciezce `/usr/bin/chromium` (nie istnieje na tej maszynie). Uruchomione z `PLAYWRIGHT_CHROMIUM_EXECUTABLE=/opt/pw-browsers/chromium-1194/chrome-linux/chrome`. Bez zmiany pliku testu (zgloszone jako C).

## Zmiany w tej rundzie
- `gate-przed-ai-general-war-campaign-live-test.txt`: EXIT=0 -> EXIT=1 (re-measured).
- nowe: `evidence-r2-po-output-tails.txt`, `evidence-r2-przed-live-anchor.txt`, `02-operator-r2-obrona.md`.
- Zadnych zmian w `gra/tools` ani `gra/src`.

## BLOKADY
Brak blokad procesu. Klasa B (prawdziwa usterka gry): 0.

## TESTY (ponowne uruchomienie, stan d2f590d50)
Wszystkie PO: EXIT=0 (kolejno: campaign, live, army-leadership, army-panel, army-to-nearest-leader, general-capital (z env), general-eligible, general-quick-follow (z env), generals-purchase, war-allin-barb, war-allin-capital, army-concentration, ai-war-defend-home (solo), tsc). PRZED-live-build: EXIT=1 (anchor).

## RUNDY
2/5. Ostatni werdykt: PASS-WITH-NOTES (runda 1, Evaluator). Nastepny werdykt: Evaluator.

## NASTEPNY KROK
Evaluator (Sonnet 5.5): weryfikacja korekty gate-przed-live (EXIT=1) i dowodow evidence-r2-*.

DEPLOY/PUSH: NIE WYKONANO
