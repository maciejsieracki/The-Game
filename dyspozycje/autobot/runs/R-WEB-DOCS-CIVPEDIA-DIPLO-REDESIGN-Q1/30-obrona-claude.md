STATUS: PASS-WITH-NOTES (obrona runda 2; zarzuty 1, 2, 3, 5 PRZYJETE z poprawką i dowodem; zarzut 4 PRZYJETY CZĘŚCIOWO, reszta NIE_ZMIERZONO)
DOMAIN: INFORMATIONAL
TEMAT: R-WEB-DOCS-CIVPEDIA-DIPLO-REDESIGN-Q1
GOAL: Civpedia zgodna z kodem po przebudowie dyplomacji z 2026-11-13 (zero zmian w gra/src, gra/data). Obrona odpowiada na 5 zarzutów Evaluatora (20-evaluator-claude.md, commit 563c4b3a7).
ZMIANY-COMMIT:
- Baza: 268d22bd4 (kandydat z rundy 1). Poprawka: 788832e9d (docs/encyklopedia/pojecia/{zmeczenie-wojna,rozejm-pokoj,wypowiedzenie-wojny,zaufanie,respekt,moc-podzial}.md; 33 wstawienia, 19 usunięć).
- Ten raport: commit zawierający 30-obrona-claude.md (SHA końcowy w polu sha odpowiedzi).
- Allowlista OK: git diff --name-only zawiera wyłącznie docs/encyklopedia/pojecia/*.md i dyspozycje/autobot/runs/R-WEB-DOCS-CIVPEDIA-DIPLO-REDESIGN-Q1/30-obrona-claude.md. Brak zmian w gra/src, gra/data, gra/tools, WERSJE.md, rust-port, gra-robocza.
- `git diff --check`: bez wyjścia (czysto).

ODPOWIEDZI NA ZARZUTY:

Zarzut 1 (zmeczenie-wojna.md, „Koniec wojny 1,0 — wojna wygasa”): PRZYJMUJĘ.
- Dowód kodu: war-weariness.ts:229-234 (`wearinessUnconditionalEndDue` = level >= progKoncaZmeczenia), war-weariness-params.json:zmeczenie.progKoncaZmeczenia = 0.8; brak w gra/src mechanizmu wygaszania przy 1,0 (grep „wygas” w src/game/war-weariness.ts i ai.ts: 0 trafień).
- Poprawka: wiersz tabeli zastąpiony wierszem „Koniec zmęczenia (pokój bezwarunkowy) | 0,8”; wiersz „Wzajemny pokój 0,8” przemianowany na „Wyjście awaryjne (wzajemny pokój) | 0,8” z warunkiem odrzuceniaDoKapitulacji = 3 (war-weariness.ts:307-308, warunek `exhausted`). Akapit: 1,0 nie ma osobnego skutku.
- Rozbieżność JSON (_wzor „100% wojna wygasa”) zgłoszona w Historii i w UWAGACH.
- Dodatkowo rozejm-pokoj.md (linia „100% — wojna wygasa”) poprawiona tak samo: „bez osobnego skutku; koniec zmęczenia to próg 80%”.

Zarzut 2 (sprzeczność 3/6 vs tura 10): PRZYJMUJĘ.
- Dowód kodu: war-weariness.ts:251 `if (w.turnsAtWar < PEACE_PROPOSAL_MIN_WAR_TURNS) { none(); continue; }` jest PRZED bramkami ofert (war-weariness.ts:277-278); diplomacy-peace-proposal-timing.ts:2 = 10; diplomacy-proposals.ts:1131-1132 (gracz); main.ts:20522 `if (peaceProposalIsTooEarly(ownerId, ME(), converted.actionId)) return;` (propozycje AI do gracza); main.ts:36666 (AI↔AI `peaceAllowed` = turnsAtWar >= 10).
- Wniosek: ofertaOdTurWojny = 3 i ofertaBezStratOdTur = 6 nie działają jako pierwsze terminy; najwcześniejsza oferta to tura 10.
- Poprawka: zmeczenie-wojna.md (akapit o bramkach ofert) opisuje to wprost; rozejm-pokoj.md (sekcja „Minimalny czas wojny”) dopisuje wspólną blokadę 10 tur obok minTurWojny 1–8 (oba obowiązują).
- Zgodnie z zarzutem „Pierwsze propozycje pokoju AI od tury 10” (rozejm-pokoj.md:51) było już poprawne i zostało.

Zarzut 3 (brak hasła „Siła militarna”): PRZYJMUJĘ.
- Fakt: w docs/encyklopedia/pojecia nie ma pliku „siła-militarna”; grep „Siła militarna” trafiał w 5 haseł, a definicja była w „Zasadach zatwierdzonych, jeszcze niewdrożonych”, mimo że krok 2 jest wdrożony (dispatch #337 completed; kod: diplomacy-military-strength.ts:64 computeMilitaryStrength; diplomacy-military-strength-params.json:_formula; progPrzewagiProc = 20 w tym samym pliku; trybutBonusProc = 10, trybutBonusTur = 10).
- Poprawka: nowa sekcja „### Siła militarna” w moc-podzial.md (wzór, przewaga 20%, bonus trybutu); odnośniki w rozejm-pokoj.md, wypowiedzenie-wojny.md (Wiki-S), zaufanie.md (linia 97) wskazują na „Siła militarna w haśle Moc (Power) i jej podział na wojskowy i gospodarczy”. Brak martwego odsyłacza do nieistniejącego hasła.
- Usunięte nieaktualne twierdzenie w moc-podzial.md („decyzje o pokoju i wojnie korzystają z całkowitej Mocy”, „zasada niewdrożona”): sprzeczne z ai.ts:7015 (`rel.silaMilitarnaAI`) i main.ts (diploMilitarySideOf). Zmiana wykonana tylko dla tej linii i bloku.
- respekt.md: blok „zatwierdzone, niewdrożone” zamieniony na „Siła militarna a Respekt” (Respekt pary liczy się z Mocy; siła militarna służy do decyzji o wojnie i pokoju). Pętla odsyłaczy respekt → wypowiadanie → siła militarna → moc-podzial została przerwana.

Zarzut 4 (zakres niezrealizowany/niesprawdzony): PRZYJMUJĘ CZĘŚCIOWO.
- pkt 5 (panel dyplomacji): PRZYJMUJĘ. Dodano sekcję „### Panel dyplomacji” w zmeczenie-wojna.md. Dowód: src/ui/diplomacyAudience.ts (AudienceWarWearinessView, pola zmeczenie/desperacja, linie 243-262; komentarz „R-WEB-UI-DIPLO-WEARINESS-DESPAIR-DISPLAY-Q1”).
- pkt 7 (mutual_peace): PRZYJMUJĘ. Grep `mutual_peace` w docs/ i Dyplomacja/: 0 trafień przed poprawką, więc encyklopedia nie twierdziła błędnie, że taka akcja istnieje. Dopisano jednak wyjaśnienie w Historii zmeczenie-wojna.md: to wynik ticku AI↔AI (war-weariness.ts, runWarWearinessTick, out.push action 'mutual_peace'), nie akcja gracza ani AI.
- pkt 2 (respekt, moc-podzial, relacja, wiarygodnosc): CZĘŚCIOWO. W tej rundzie przeczytane i poprawione: moc-podzial.md (blok siły militarnej, linia o Mocy) i respekt.md (blok siły militarnej). NIE_ZMIERZONO: relacja.md i wiarygodnosc.md nie czytane linia po linii w tej rundzie; respekt.md poza blokiem siły militarnej (etykiety Nastawienia, progi) nie sprawdzone ponownie. Te pozycje zostają jako luka zakresu dla Final Control.

Zarzut 5 (rozejm-pokoj.md l. 52-53 uproszczone; pat 15/10 bez asercji): PRZYJMUJĘ.
- Dowód kodu: ai.ts:7161 `rel.stanWojny && !aiFeelsStronger && aiPeaceTimeOk && !peaceWeakerNoCityVsPlayer && (rw <= progPokojSlabosc || peaceSignals.wantsPeace)`; ai.ts:7153-7155 (sygnał 'f' gdy peacePosMil === 'slabsza'); ai.ts:6251 PROG_POKOJ_SLABOSC = 0.4; diplomacy-war-peace-profile.ts:293-318 aiPeaceSignals (sygnały a-e z progRwMiasta, patTurWojny, patBrakZmianyTur, progSygnaluPokoju, progZdrowia); main.ts:11789 (armyHealthShare podawane — sygnał c jest wdrożony; komentarz w ai.ts:7125 „NIEZAIMPLEMENTOWANY” jest nieaktualny).
- Poprawka: sekcja „Kiedy AI proponuje rozejm, a kiedy pokój” w rozejm-pokoj.md przepisana: słabość militarna (sygnał f), sygnały a–e z liczbami i kluczami JSON, rw jako respekt względny w sygnale a, zakaz propozycji wobec gracza bez miasta.
- Parametry: dopisano wiersze `diplomacy-war-peace-params.json:sygnalyPokoju.progRwMiasta` (0,5), `patTurWojny` (15), `patBrakZmianyTur` (10). Test je sprawdza (patrz TESTY).

TESTY (wykonane na tej gałęzi po poprawce):
- node gra/tools/diplo-civpedia-values-test.cjs: PASS: 129 sprawdzeń, wierszy parametrów w haśle: 155 (przed poprawką runda 1: 148 wierszy, 129 sprawdzeń).
- Dowód mutacyjny nowego wiersza: w zmeczenie-wojna.md zmiana `0.8 | ...zmeczenie.progKoncaZmeczenia` na 0.81 -> FAIL: „zmeczenie-wojna.md: war-weariness-params.json:zmeczenie.progKoncaZmeczenia w haśle=0.81 w kodzie/JSON=0.8”, WYNIK: CZERWONY — 1 z 130 sprawdzeń niezgodnych. Plik przywrócony z kopii; ponowny przebieg: PASS 129, 155 wierszy.
- Ograniczenie testu (zostaje, zgodnie z zarzutem Evaluatora): test sprawdza tylko wiersze tabel Parametry. Liczby w prozie (np. „0,4”, „15 tur”, „20%”) nie są chronione. Nie dodano asercji do gra/tools/diplo-civpedia-values-test.cjs (dozwolone, nie wymagane).
- grep stare nazwy po poprawce (wspolna_religia, ultimatum_spelnione, „200 tur”, −2/−3/−4, „Wrogi = relacja”, „100% — wojna wygasa”, „zatwierdzone, jeszcze niewdrożone” w moc-podzial/respekt): 0 trafień w tych sprawach poza: „bez zastoju” (zmeczenie-wojna.md) i opisem historii w zaufanie.md. Pozostałe „wygasa” w docs dotyczą cudów i wiarygodności (inne tematy, poza zakresem).
- `git diff --check`: czysto.
- NIE_ZMIERZONO: tsc, logic-test, tech-tree-test, research-test, unit-replace-test, combat-test — zmiana dotyczy wyłącznie docs/, kod nie został zmieniony względem kandydata 268d22bd4, który Evaluator odtworzył jako zielony.
- NIE_ZMIERZONO: build i Chromium (zmiana tylko docs).

BLOKADY: brak blokad technicznych.

RUNDY: 2/5 (Obrona w rundzie 2; ostatni werdykt Evaluatora: PASS-WITH-NOTES, 5 zarzutów; runda 1 = Operator).

NASTĘPNY KROK: Final Control (SONNET) — sprawdzić commity 788832e9d (poprawki) i ten raport; zweryfikować pkt 4 (relacja.md, wiarygodnosc.md, respekt.md poza blokiem) i decyzję o zakresie testu prozy.

UWAGI-DLA-ORKIESTRATORA:
- Rozbieżności KODU, nie docs (poza zakresem tej paczki, do osobnego tematu w gra/data lub decyzji): (1) war-weariness-params.json `_wzor` „100% wojna wygasa” i `przegrywajacy` opis „stopień 1: złoto i surowce” są nieaktualne; (2) diplomacy-tick-params.json flagaDomyslna/kryzysTurDoWojny (patrz runda 1, pkt 2); (3) ai.ts:7125 komentarz o sygnale c „NIEZAIMPLEMENTOWANY” jest nieaktualny (main.ts:11789 podaje armyHealthShare); (4) bramka pokoju AI mierzy słabość mieszanie: rw (a, b) i siłą militarną (f) — to decyzja projektowa, nie docs.
- zaufanie.md: nagłówek „Zasady zatwierdzone, jeszcze niewdrożone” (linia 95) przy treści „są wdrożone” — niespójne; nie zmieniano (poza zakresem zarzutów), do decyzji FC.
- Test civpedia nie dostał nowych asercji poza 3+1 wierszami Parametry; dług „liczby w prozie” zostaje.
- Nie założono żadnych sesji, nie wywołano żadnego narzędzia tworzącego sesje lub zadania.

DEPLOY/PUSH: NIE WYKONANO
