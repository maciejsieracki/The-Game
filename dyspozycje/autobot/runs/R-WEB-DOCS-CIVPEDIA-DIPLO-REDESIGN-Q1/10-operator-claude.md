STATUS: PASS-WITH-NOTES
DOMAIN: INFORMATIONAL
TEMAT: R-WEB-DOCS-CIVPEDIA-DIPLO-REDESIGN-Q1
GOAL: encyklopedia (Civpedia) i dokumentacja dyplomacji opisuje zasady zgodnie z kodem po przebudowie z 2026-11-13 (zaufanie, relacja, siła militarna, wypowiadanie wojny, rozejm i pokój, zmęczenie wojną, nieujemność skarbca i spichlerza). Zero zmian w gra/src i gra/data.
ZMIANY/COMMIT: baza ee28dd9c3 (detach). Allowlista: docs/encyklopedia/pojecia/{wypowiedzenie-wojny,rozejm-pokoj,zaufanie,zmeczenie-wojna,spichlerz}.md oraz ten raport. Commit: patrz pole sha w odpowiedzi (git rev-parse HEAD w worktree). Nie dotykano gra/src, gra/data, gra/tools, Dyplomacja/*.md (przeszukanie nie znalazło nieaktualnych nazw), WERSJE.md.
TESTY:
- node gra/tools/diplo-civpedia-values-test.cjs: przed zmianami PASS: 129 sprawdzeń, wierszy parametrów w haśle: 148; po zmianach PASS: 129 sprawdzeń, wierszy parametrów w haśle: 148.
- git diff --check: bez wyjścia (czysto).
- grep po docs/encyklopedia i Dyplomacja/ na: wspolna_religia, ultimatum_spelnione, „200 tur”, zastój/zastoj, −2/−3/−4, „Wrogi = relacja”, „< 30”: jedyne trafienia to „bez zastoju” (zmeczenie-wojna.md, poprawne) oraz opis historii w zaufanie.md (wcześniej −2/−3/−4, poprawny kontekst).
- tsc: NIE_ZMIERZONO (zmiana tylko w docs, tsc nie uruchamiano w tej rundzie).
- Pozostałe bramki z dispatchu poza testem civpedia: NIE_ZMIERZONO.
POKRYCIE LICZB (klucz JSON / kod; wiersze Parametry są sprawdzane testem; numery linii podano tam, gdzie je zweryfikowano):
- Zaufanie: sąsiedztwo −3/−4/−5 (diplomacy.json:params.ekspansjaGranica*_zaufanie_perTura); warunek: obie strony >2 miasta i wspólna granica lądowa (main.ts karaWspolnaGranica ~l.23351); karencja zeruje karę (main.ts karaWspolnaGranicaDelta ~l.23355); ustawienie 10/20 (diplomacy.json rozejm/pokoj_zaufanie_ustawienie; main.ts finalizePeaceTreatyBetween ~l.12196); religia 0 (diplomacy.json wspolnaReligia/odmiennaReligia_zaufanie_perTura); wojna zeruje zaufanie (diplomacy.ts clampRelationForWar ~l.1138).
- Wypowiedzenie wojny: próg zaufania 30 (diplomacy-war-peace-params.json:wypowiedzenieZaufanie.progZaufaniaWojny; ai.ts ~l.7340-7360); przewaga 20% (diplomacy-military-strength-params.json:progPrzewagiProc.wartosc) z przesunięciem charakteru, zakres 10–35% (diplomacy-war-peace-params.json:przesuniecieProguWojnyCharakter.min/max; diplomacy-war-peace-profile.ts); zerowe Zaufanie przez N tur (diplomacy-tick-params.json:p6.kryzysProgZaufania = 0); N = hamulecN z profilu, wzór round(8 − 0,5·dip_prog_wojny) w zakresie 3–7 (diplomacy-war-peace-profile.ts ~l.143 i ~l.188; main.ts diploBrakeWarParams ~l.11846, diploBrakeCrisisStep ~l.11861, processDiploCrisisQueue ~l.11918: gracz nigdy automatycznie, jedno ostrzeżenie na epizod); wczesne okno 25 tur (ai.ts AI_MAJOR_EARLY_NO_WAR_TURNS ~l.6291); agresja 0,5 (ai.ts PROG_WOJNA_AGRESJA ~l.6239).
- Rozejm/pokój: rozejm 5/10/15, domyślnie 10 (diplomacy-peace-lock.ts, stałe w kodzie); minTurWojny 1–8, domyślnie 5 (diplomacy-war-peace-params.json:minTurWojny); próg różnicy siły 0 (diplomacy-war-peace-params.json:progRozniceSilyPokoj.wartosc); bramka 'stronger' (diplomacy-war-peace-profile.ts evaluatePeaceAiGate); mnożnik ceny ≤1 po 20 turach (cenaPokoju.turyBezOgraniczenAi = 20); karencja 40/100 (war-weariness-params.json:przegrywajacy); sygnał pokoju 0,4 (diplomacy-war-peace-params.json:zmeczenie.progSygnaluPokoju); tryb pokój przy zmęczeniu 1 / gotowości 0,7 / zaufaniu 60 (diplomacy-peace-lock.ts TRUCE_AI_*_PEACE_MIN, stałe w kodzie).
- Zmęczenie: 5%/turę przez 20 tur, +10% za miasto; progi 0,5 (progChetnosci) i 0,8 (progWzajemnyPokoj); pelneTur = 20 (war-weariness-params.json:zmeczenie); oferty przegranego od tury 3 po utracie miasta i od tury 6 bez strat (przegrywajacy.ofertaOdTurWojny / ofertaBezStratOdTur); stopnie 1–2 jedno miasto, 3 do dwóch miast (war-weariness.ts stageCityLimit ~l.110).
- Etykiety: Wrogi < 10 (diplomacy-display.ts NASTAWIENIE_PROG_WROGI_ZAUFANIE = 10, l.337); Nieufny < 30 (NASTAWIENIE_PROG_NIEUFNY_ZAUFANIE = 30, l.338); relationTier Wrogi < 10 (diplomacy.ts ~l.1561).
- Nieujemność skarbca i spichlerza: od tury 11, gracz (main.ts decideEndTurnGate / nnsGateForPlayer); tury 1–10 wolne (no-negative-stocks.ts NNS_WOLNE_TURY = 10).
ROZBIEŻNOŚCI (stan faktyczny z kodu, opisany w hasłach):
1. Dispatch pkt 6: równoważenie AI NIE jest wdrożone. planAiBalance (no-negative-stocks.ts ~l.165) nie jest wywoływane w main.ts; wdrożona jest tylko blokada gracza. Hasło spichlerz.md mówi to wprost.
2. diplomacy-tick-params.json: flagaDomyslna = false i kryzysTurDoWojny = 5 są nieaktualne. Kod: DIPLO_TICK_WAR_BRAKE_ENABLED_DEFAULT = true (diplomacy-tick-war-brake.ts l.7), a N pochodzi z profilu (main.ts nadpisuje kryzysTurDoWojny w diploBrakeCrisisStep). Dla bazowego profilu N = 6. To odpowiada pytaniu N=6 vs 5 z zadania #370.
3. war-weariness-params.json, opis przegrywającego („stopień 1: złoto i surowce”) jest nieaktualny. Kod (war-weariness.ts ~l.111, ~l.127) używa wyłącznie miast. Hasło zmeczenie-wojna.md podaje stan z kodu. Opis w JSON do poprawy osobnym tematem.
4. Bramka AI proponująca pokój: słabszość liczona przez rw (ai.ts ~l.7161, weakerByPower = rw <= progPokojSlabosc), a sygnał 'f' przez pozycję militarną (peacePosMil). Dispatch pkt 4 zakłada siłę militarną. Źródła są mieszane. ZGŁOSZENIE do orkiestratora; kodu nie zmieniano (poza zakresem docs).
5. diplomacy-war-peace-params.json: progWojnyRelacji i hamulecRelacji.progKryzysuMinusPunkty są już tylko informacyjne (opisane w haśle wypowiedzenie-wojny.md).
NIE ZWERYFIKOWANO W TEJ RUNDZIE:
- respekt.md, moc-podzial.md (siła militarna jako osobna miara), wiarygodnosc.md, wladcy/bunt/porzadek: nie czytano linia po linii pod kątem nowych zasad.
- relacja.md: sprawdzono tylko etykiety i progi.
- Nie dopisano asercji kodowych do gra/tools/diplo-civpedia-values-test.cjs (dodano wiersze do tabel Parametry; parser je przyjmuje, test zielony).
- Pełne tabele plik:linia dla każdej liczby: podano klucze i wybrane linie, nie każdą linię.
BLOKADY: brak blokad technicznych. Rozbieżności 1–4 wymagają decyzji orkiestratora (dotyczą kodu, poza zakresem docs).
RUNDY: 1/5 (ostatni werdykt: brak; Operator).
NASTĘPNY KROK: Evaluator (SONNET): sprawdzić pokrycie liczb z tabeli powyżej (plik:linia), przejrzeć respekt.md i moc-podzial.md; rozstrzygnąć rozbieżności 1–4 (decyzja orkiestratora/właściciela).
UWAGI-DLA-ORKIESTRATORA: (a) rozbieżności 1 i 4 dotyczą kodu, nie docs; (b) zadania #353, #361, #370 są powiązane z tym tematem; (c) nie tworzono żadnych sesji ani zadań.
DEPLOY/PUSH: NIE WYKONANO
