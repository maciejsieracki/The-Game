# Aktywna kolejka Codex — wyłącznie niezakończone cele
Aktualizacja: 2026-11-10T16:16:44.569503+01:00
GOAL: każda zakwalifikowana poprawka do 11/11: niezależny Operator Luna high → Evaluator → warunkowa Obrona → Final Control → integracja main → Robocza → push/readback → cleanup. Max4tematy, role osobno w temacie. Raport nie zatrzymuje pracy. Brak narzędzia scheduler: kontrola przy każdym wyniku/raporcie, bez fikcyjnego heartbeat w tle.
Najnowsze polecenie właściciela obejmuje całą listę, także wcześniej odłożone pozycje; kolejność Rust/model na końcu pozostaje zależnością, nie zgodą na pomijanie. Nie powtarzać wdrożonych589–609.

| Cel | Stan / następny krok |
|---|---|
| Karty technologii Top5 | FC8 PASS; source72b4e7beb, integracja9; release610 |
| Cztery poprawki języka UI Q2 | FC8 PASSWITHNOTES; source1b3a19915, integracja9; release610; parentaudytPARTIAL |
| Pobliskie wojska w oblężeniu | FCfollowup8 PASSWITHNOTES po jawnej korekcie scope/ledger, integracja9 b314bbe1a; release610; browserniemierzony |
| Armia: rekrutacja per miasto 0 + globalny zakup | R-WEB-ARMY-CITY-RECRUIT-ZERO-BATCH-Q1: Operator aktywny /tmp/codex-army-city-recruit. Armia2przyciski góra/dół, oddzielnyHUDpanel zostaje z1górnymprzyciskiem; drafty city/type, częściowy zakupbezutraty |
| Machiny wyłącznie podczas oblężenia | R-WEB-SIEGE-ENGINES-BUILT-ONLY-DURING-SIEGE-Q1:1/11, decyzje jużpotwierdzonew dodatkach1–2; operatorpozwolnieniuslotu. Koszt pieniądz+surowce, floor(Nbezmachin/10)/turębezsufitu, graczAI |
| Pomiń/AUTO oblężenie z wyłomem | R-WEB-BATTLE-SKIP-TICK-LOOP-UNIFY-Q1:1/11; po integracjibliskichwojsk, rzeczywistyparytet niepowtarzać589/600 |
| AI szuka głównej armii wroga | R-WEB-AI-WAR-ARMY-SEEKS-ENEMY-MAIN-ARMY-FIRST-Q1:1/11; ustalić istniejąceparametry N/ratio, noweprogi zapytaćwłaściciela |
| Wezwanie sojusznika do wojny | R-WEB-DIPLO-ALLIANCE-JOIN-WAR-CALL-TO-ARMS-Q1:1/11; sprawdzićzależność130/90jużwdrożona; niepowtarzać |
| Samodzielne oferty handlowe AI | R-WEB-AI-TRADE-PROPOSALS-TO-PLAYER-Q1:1/11; istniejącedecyzjeodczytać, serializowaćai.ts |
| Pozostały audyt języka UI/Civpedia | R-WEB-POLISH-LANGUAGE-AUDIT-Q1 PARTIAL; kontynuować macierzQ2 bezduplikatów, potwierdzoneusterki→własnescope |
| sciencePicker: odmiana ETA N tur | PotwierdzoneprzezQ2Evaluator/FC; nowyfollowup: minimalnyformatter1/2/5/12/21/22, osobnydispatchprzedkodem |
| Pełny test dużej cywilizacji | D-FOGskryptygotowe, pomiarjeszczenieuruchomiony; wykonaćnaostatkuweb poprzeczytaniukontraktówpomiaru i limitówzasobów; wyniki→diagnoza→operatorpoprawki |
| Model Falangi | R-WEB-RENDER-FALANGA-UNIT-MODEL-PHALANGITE-Q1: wcześniejownerheld, noweogólnepolecenieobejmuje; na końcuweb, sprawdzićistniejącer1/zależności |
| REPIN Rust | Po web, oddzielnydispatch/parytet, niepowtarzaćstarychpoprawek bezreadback |
| #201 Przydziel obywatela | Ustalić aktywne decyzje: przycisk/kamera/Ważne, zadaćkonkretnepytaniejeślibrak |
| #201 Marsz | Powiadomienia obstacle/no_path/blocked_city i limitstosu; sprawdzićcojuż599, brakującewariantywyjaśnić |
| #201 Nazwy terenów | Mała rzeka/Rzeka w sąsiedztwie/Tropiki: brak definicji, niezgadywać; właścicieldecyzja |
| #201 Sól/Koń ×0 | Odczytaćkontraktzasobówdostępowych; propozycjaUXwłaścicielowi, niezmieniaćilościmechaniki |
| #201 Rozejm20% |605jużwdrożony; tylkonierozstrzygniętainterpretacja20%=80%siły, nieotwieraćponowniewdrożenia |
| #201 Brąz×1994AI | Pomiar, niepotwierdzonybug; aktualnyaudytniewykazałluki; symulacja/reproprzednaprawą |
| Wizualna kontrola Roboczej | Nieoznaczaćgrepsourcejakolive; macierznajważniejszychzmienionychwidoków, systemChromiumHTTP, limityjasno |

Zamkniętego testu przejmowania cudów nie wliczać do otwartych:11/11 receipt90-push-readback.md. Inne zakończone źródła w STAN-ZADAN, bez otwierania ich ponownie.

Nowe zgłoszenie: R-WEB-CAVALRY-FRONT-FLANKS-PLACEMENT-Q1 — Z przodu/Z boku/Z tyłu; domyślnie skrzydła; sprawdzić rzeczywiste działanie. Operator start po read-only diagnozieAI, która czeka na decyzje N/ratio. Rekrutacja i scienceETA ukończyły Operatora, kierowane do Evaluatorów.
