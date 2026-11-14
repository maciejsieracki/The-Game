STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-LIVE-VERIFY-WAVE-689-697-B2-PANEL-AIAI-CITYCHANGE-Q1
GOAL: Żywa weryfikacja (Chromium, ?civTest=1, tryb przyspieszony, >=2 ziarna): P1 panel dyplomacji gracz↔AI, P2 wojna AI↔AI >=16 tur, P3 zmiana właściciela miasta (+10 pp), P4 anomalia „neutralni/240 s”.
ZMIANY/COMMIT: kandydat d2045bfd0da4cae0bdab525d474da6f2bb16aa4b (potomek bazy 78be66bb5: `git merge-base --is-ancestor` = TAK). Diff vs 78be66bb5: 129 plików, wyłącznie gra/tools/live-verify-wave-689-697-b2-panel-run.cjs + runs/<ID>/** (JSON, PNG, 10-operator, 30-obrona). Zero zmian w gra/src, gra/data, WERSJE.md, gra-robocza/, rust-port/. `git diff --check` czysty. `node --check` runnera: OK. `git merge-tree --write-tree origin/main d2045bfd0` (origin/main = df4929710): czysty, bez konfliktów.
INTEGRATION_SHA: d2045bfd0da4cae0bdab525d474da6f2bb16aa4b (+ ten raport, commit FC na jego czubku).

## ZAKRES BRAMEK
Kandydat nie zmienia gra/src ani gra/data, więc tsc --noEmit, testy tematu i 5 bramek referencyjnych dają wynik identyczny z bazą z konstrukcji (diff pusty dla kodu gry); NIE uruchamiano ich osobno (powód: brak zmian w kodzie gry, sprawdzone listą nazw plików diffu). Weryfikacja dotyczy dowodów i runnera.

## SAMODZIELNA WERYFIKACJA DOWODÓW (surowe pliki JSON/PNG)
- Digesty: `turns[].digest` r3 vs r3rep: 271828 = 22/22 równe, 314159 = 22/22 równe (policzone moim skryptem node na surowym JSON).
- pageErrors = [] w b2-war-seed{271828,314159}-r3.json.
- P1 odczyt DOM (probes[].audience): 271828 T16 Desperacja 43% / T17 46% / T18 48% / T20 53%; 314159 T10 Desperacja 0%, T16 54%, T17 57%, T18 59%, T20 63%; wpis `pokoj` AI→gracz (proposerOwnerId 1, responder 0) w `entries` od T17 na obu ziarnach, brak w T5/T10/T16. Zgodne z raportem operatora.
- Zrzut b2-war-seed314159-r3-T20-aud1.png OBEJRZANY: pełnoekranowa „Audiencja dyplomatyczna”, baner WOJNA, brak nakładki „Tworzenie świata”, w prawej karcie „Ty Desperacja 63% / Chińczycy Zmęczenie wojną 95%”, w kolumnie „Oni oferują” kafel „ICH PROPOZYCJA — Propozycja pokoju / zawieszenia broni · 500 PW, wygasa za 2 tur”.
- Zrzut b2-aiwar-seed271828-r3c-T30-aud16.png OBEJRZANY: karta Sumerów, status POKÓJ z graczem, w „W stanie wojny z” tylko „Egipt Zmęczenie wojną 30%” (jedna etykieta; potwierdza zarzut 3).
- P3 gracz↔AI (capture.before/after.audienceLines): 271828 Zmęczenie 15% → 25%; 314159 15% → 25% (+10 pp, 2 ziarna).
- P4: b2-speed-seed271828-r3.json `warDeclaredAtTurn: 1` — przebieg prowadził wojnę AI→gracz od T1 (zarzut 1 potwierdzony).
- P2: b2-aiwar-seed271828-r3e.json `stoppedBy` = „blad endTurn … Timeout 120000ms”, T58, jedyne miasto gracza utracone (zarzut 2 potwierdzony co do faktu).
- Kod (zarzut 3): `warWearinessLabelPl` (gra/src/game/diplomacy-display.ts:382) i `warWearinessPartnerSuffixHtml` (gra/src/ui/diplomacyAudience.ts:1592) zwracają jedną etykietę dla wiersza pary AI↔AI.

## ROZSTRZYGNIĘCIE ZARZUTÓW
1. P4 (zawężenie): ODDAL. Obrona przyjęła i poprawiła sformułowanie; poprawka jest wyłącznie opisowa i FC ją przejmuje. Wersja obowiązująca: P4 wojna AI→gracz, 271828, tryb nieprzyspieszony T2–T23, czas tury 15,6–21,7 s: NIE_ODTWORZONO; stan neutralny (bez wojny): NIE_ZMIERZONO (nie uruchomiono takiego przebiegu). Brak defektu produktu, nie wymaga zmian w kodzie.
2. P2 (>=16 tur niespełnione, okno po karencji niezmierzone): ODDAL z zastrzeżeniem. Kryterium >=16 tur: NIE_OSIĄGNIĘTO w 7 przebiegach na 2 ziarnach (wojny kończą się po 9–10 turach przy zmęczeniu ok. 0,45–0,50, log „pokój … za cenę … 0/0 PW” lub `R-AI-PEACE-2T accept_paid`). Wniosek „próg 0,8 nieosiągalny dla AI↔AI” obowiązuje jako HIPOTEZA poparta kodem (war-weariness.ts l.251, 281–283, 315–316) i tymi przebiegami, NIE jako ogólny dowód. Okno T75+ po karencji: NIE_ZMIERZONO (powód: runner bez obrony gracza, gracz traci jedyne miasto do T58). Nie jest to FAIL tego tematu, bo dispatch dopuszcza NIE_ZMIERZONO z konkretnym powodem technicznym, a istotny rezultat (reguła pokoju za 0 PW przy ok. 0,5) jest zmierzony wprost na dwóch ziarnach. Pozostaje decyzja produktowa niżej (UWAGI 1).
3. Panel AI↔AI pokazuje jedną etykietę zamiast obu: ODDAL do osobnego tematu. To realny defekt wobec decyzji #364 (klasyfikacja operatora „UI informacyjnie” była błędna, obrona to poprawiła), ale poprawka wymaga gra/src, co ten temat wprost zakazuje („Defekty → UWAGI, nie naprawiaj”). Wynik pomiaru: panel AI↔AI = DEFEKT (zmierzony), nie PASS.
4. P3 AI↔AI bez odczytu licznika: ODDAL. Licznik pary jest w domknięciu main.ts (`diploWarWearinessPairView`), brak hooka; DODATEK dopuszczał hak tylko dla przejęcia miasta w P3 gracz↔AI (zrealizowany istniejącym `__peaceRulesTestDebug.captureCityForTest`). NIE_ZMIERZONO z powodem technicznym; pomiar wchodzi do tematu naprawy z p.3.
5. (a) digesty: potwierdzone przeze mnie 22/22 na obu ziarnach. (b) czasy generacji 141–217 s z 3 równoległych przebiegów nie są miarą wydajności: PRZYJĘTE. ODDAL (korekta opisowa).
Liczba zarzutów z werdyktem NAPRAW: 0.

## TABELA WERDYKTÓW PUNKTÓW
| Punkt | Werdykt | Dowód |
|---|---|---|
| P1 panel gracz↔AI, zrzut bez nakładki + DOM, T5/10/16/20, 2 ziarna | PASS | b2-war-seed{271828,314159}-r3.json + *-aud1.png (obejrzane) |
| P1 propozycja pokoju AI widoczna dla gracza od T17 | PASS (z uwagą UI: licznik zakładki „Dyplomacja” = 0 mimo blokującej karty decyzji) | `entries` pokoj T17+, *-notif.png |
| P1 powtarzalność | PASS | digesty 22/22 na 2 ziarnach |
| P2 wojna AI↔AI >=16 tur | NIE_OSIĄGNIĘTO (reguła pokoju przy ok. 0,5; 7 przebiegów) | b2-aiwar-*.json |
| P2 okno po karencji (T75+) | NIE_ZMIERZONO (runner bez obrony gracza) | b2-aiwar-seed271828-r3e.json |
| P2 panel pary AI↔AI | DEFEKT (jedna etykieta, niezgodne z #364) | b2-aiwar-seed271828-r3c-T30-aud16.png, diplomacyAudience.ts:1592 |
| P3 +10 pp gracz↔AI | PASS (15%→25%, 2 ziarna) | b2-war-*-capture-*.png/json |
| P3 para AI↔AI | NIE_ZMIERZONO (brak hooka) | b2-aiwar-seed314159-r3d.json |
| P4 wojna AI→gracz, tryb nieprzyspieszony | NIE_ODTWORZONO | b2-speed-seed271828-r3.json |
| P4 stan neutralny | NIE_ZMIERZONO | brak przebiegu |
Reguły dispatchu: zero `?playtest=mapa` (URL ?civTest=1&civSeed=…), zero ujemnych grantów (operator: nnsGrants=0), generacja świata dokończona przed turami.

## BLOKADY
Brak blokad technicznych dla integracji.

## UWAGI-DLA-ORKIESTRATORA
1. [DECYZJA WŁAŚCICIELA, powiązane z #359/#363/#376] Wojny AI↔AI kończą się pokojem bez miasta i bez zapłaty („0/0 PW”) przy zmęczeniu ok. 0,50 po 9–10 turach (priceZero w war-weariness.ts), także gdy przegrywający ma 5 miast. Zasada #347 mówi „pokój tylko za miasto”, dokumentacja progu 0,8 sugeruje koniec później. Potwierdzić, czy to zamierzone (wariant C z #359). Odpowiada na #376 w części AI↔AI: AI proponuje pokój bezwarunkowy graczowi od zmęczenia 0,8 (T17), zmierzone.
2. [DEFEKT, osobny temat R-WEB-UI-*, wymaga gra/src] Panel pary AI↔AI pokazuje jedną etykietę (desperacja LUB zmęczenie) zamiast obu (#364); poprawka w `warWearinessLabelPl`/`warWearinessPartnerSuffixHtml`. W tym samym temacie dodać hak odczytu licznika pary AI↔AI, by zmierzyć +10 pp dla AI↔AI.
3. [UI, drobne] Licznik zakładki „Dyplomacja” = 0, gdy jedyny wpis to blokująca karta propozycji pokoju.
4. [TEST-INFRA] `__aiTradeWiringTestDebug.info().aiOwners` zaczyna się od miast-państw (40, 41); nowe runnery mają brać cywilizacje główne z `__borderEraPenaltyRuntimeTestDebug.ownerIds()`.
5. [OPCJONALNY TEMAT POMIAROWY] Runner z obroną gracza (lub 2 graczy-bufory) do pomiaru okna AI↔AI po karencji T75+ oraz przebieg P4 w stanie neutralnym (bez wojny). Niski priorytet.
6. [PROCES] Ten raport przejmuje korekty sformułowań z 30-obrona-claude.md (P4, P2 jako hipoteza, panel AI↔AI jako defekt); raport operatora 10-operator-claude.md zachowuje starsze sformułowania historycznie.

## RUNDY
3/5 (r3). Werdykt FC: PASS-WITH-NOTES.

## NASTĘPNY KROK
Orkiestrator: integracja d2045bfd0 (+ commit tego raportu) do main (merge-tree z df4929710 czysty), wpis w rejestrze; zarejestrować UWAGI 1–5 (decyzja właściciela dla p.1, nowy temat dla p.2). Brak zmian w grze, więc brak deployu.

DEPLOY/PUSH: NIE WYKONANO
