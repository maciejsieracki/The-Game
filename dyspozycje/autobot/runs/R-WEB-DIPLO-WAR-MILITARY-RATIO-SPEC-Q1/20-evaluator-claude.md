# R-WEB-DIPLO-WAR-MILITARY-RATIO-SPEC-Q1 — raport Evaluatora (runda 1/5)

STATUS: PASS-WITH-NOTES (zarzuty 1–7 do rozstrzygnięcia przez Obronę/FC; Evaluator nie wydaje werdyktu końcowego)
DOMAIN: GAME (specyfikacja; zero zmian kodu)
TEMAT: R-WEB-DIPLO-WAR-MILITARY-RATIO-SPEC-Q1
GOAL: specyfikacja parametru `militaryRatioWar` zweryfikowana w kodzie (`10-operator-claude.md`), bez zmian w grze.
ZMIANY/COMMIT: kandydat f39b580916d55efaa30903ce210a3bf16ebb6e4b, baza 5d0c5f8d1e3e6efd188064419418804779868cfa (kandydat jest potomkiem bazy: `merge-base --is-ancestor` = tak). `git diff --name-status baza..kandydat` = jedna linia: `A dyspozycje/autobot/runs/R-WEB-DIPLO-WAR-MILITARY-RATIO-SPEC-Q1/10-operator-claude.md`. Allowlista SPEŁNIONA. Ten raport: jedyny plik dodany przez Evaluatora.

TESTY: tsc i 5 bramek referencyjnych NIE_DOTYCZY (dispatch: brak zmian kodu; diff to jeden plik .md). Dowód mutacyjny NIE_DOTYCZY. `git diff --check` NIE_ZMIERZONO (sandbox odrzucił polecenie git z dwoma SHA).
Weryfikacja dowodów plik:linia na bazie 5d0c5f8d1 (odczyt `sed -n`), 20 odwołań:
- ZGODNE: diplomacy.ts:1141–1153 (clamp), diplomacy.ts:1105 (`WAR_RELATION_SCORE_CAP = progMinimalnyRelacja - 1`), ai.ts:6229 (`PROG_WOJNA_SILA = 0.6`), ai.ts:6852/6875/6895/6919/7312 (`wypowiedz_wojne`), ai.ts:6952–6957 (`rw/(1−rw)`), power-objective.ts:241/244 (Armia/Rekruci), power-objective.ts:194–205 (`loadMilitaryComponentKeys`), data/power-params.json:32 i :45 (`wojskowy: true` dokładnie dwa składniki), diplomacy-war-peace-profile.ts:314–336, main.ts:24700–24713, main.ts:11611–11641, main.ts:12478–12491, diplomacy.ts:1017–1024 i 875–876, diplomacy.ts:1094 i 1860 (wywołania clampa), diplomacy-pn-engine.ts:69–73 i 143–145, diplomacy-proposals.ts:1328/2279 i `ctx.militaryRatio` w 389/1222/1535/1863, diplomacy-war-peace-profile.ts:396–400, ai.ts:7118–7139, main.ts:12060/21564/12325/2764, manpower.ts:590.
- Drobne nieścisłości numeracji: data/diplomacy-war-peace-params.json — `"przewagaMilitarna"` jest w linii 89, ale `"prog": 0.20` w linii 91 (spec cytuje :89 jako wartość progu); diplomacy-factors.ts — etykieta „Przewaga militarna” w linii 72, spec cytuje :73 (to „Słabszy militarnie”). Nie zmieniają wniosków.
- Uśpione zdarzenia `przewaga_militarna`/`slabszy_militarnie`: `grep` po `gra/src` potwierdza wyłącznie definicję typu, `case` w diplomacy.ts i etykiety. Brak emitera. Twierdzenie operatora PRAWDZIWE.
- Kolizje nazw: grep `Stosunek militarny|militaryRatioWar|Przewaga wojenna|warAdvantage` po gra/src, gra/data, docs, wiki = 0 trafień. Twierdzenie PRAWDZIWE.
- Sekcja „ZAŁOŻENIA DO POTWIERDZENIA” (p.8) nie zawiera słowa „pytanie”; to słowo występuje tylko w nagłówku 3a („odpowiedź na pytanie z dodatku”), poza sekcją. Kryterium SPEŁNIONE.
- Istnienie plików testowych z p.5 (`tools/diplo-respect-military-events-test.cjs`, `tools/diplo-peace-balance-accept-test.cjs`, `tools/diplo-war-peace-sim-test.cjs`, `tools/diplomacy-proposal-test.cjs`, `tools/diplomacy-test.cjs`, `tools/wiarygodnosc-test.cjs` itd.): NIE_ZMIERZONO w tej rundzie (listing `ls tools | grep` nie zwrócił wyniku przed odrzuceniem polecenia). Do sprawdzenia przez Obronę.

BLOKADY: brak. Sandbox odrzucił kilka złożonych poleceń git; użyto prostych.

## ZARZUTY

1. Podwójne liczenie rekrutów w wzorze (p.4b). Składnik (a) `R_sila` wg samego operatora to Armia + Rekruci (`power-objective.ts:241,244`; Rekruci = `rekrutEkw`), a składnik (c) `R_pula` to znów `rekrutEkw` (p.2c). Pula rekrutów wchodzi do iloczynu dwukrotnie (raz w S, raz w R_pula), czego dodatek (zał. 3: osobne składniki a i c) nie zakłada, i operator tego nie zauważa ani nie rozstrzyga (ani w p.8). Propozycja naprawy powinna albo liczyć (a) tylko jako Armię, albo uznać (c) za zawarte w (a).

2. `R_bitwy` w p.4b jest błędnie sformułowany. Wzór `(1+wygraneA)/(1+przegraneA) ÷ ((1+wygraneB)/(1+przegraneB))` przy statystyce pary (przegraneA = wygraneB, przegraneB = wygraneA) daje `((1+wA)/(1+wB))^2`, czyli kwadrat. Spec nie mówi, że to zamierzone, a wejście funkcji z p.4c wymienia osobno `wygraneB/przegraneB`, podczas gdy struktura stanu w p.4a ma tylko `wygraneA/przegraneA` (redundancja). Niespójność specyfikacji, nie błąd kodu.

3. Wniosek o „zmianie wartości Respektu” przez clamp (p.3a, zał. 6/8, wymagany przez dodatek) nie jest dowiedziony do końca. Operator pokazuje, że `diplomacy.ts:1094` i `:1860` zapisują obcięte wartości (PRAWDA), ale sam przyznaje (3b), że Respekt w propozycjach jest nadpisywany `computeRespekt(potProposer, potResponder)` (`main.ts:24702–24703`), a `diplomacy-display.ts:437` liczy Respekt w UI wprost z Mocy, bez odczytu stanu. Nie ustalono, KTO czyta zapisany `rel.respekt` w wojnie i czy obcięcie ma jakikolwiek wpływ poza `relationScore` (Zaufanie + Respekt) i progami PN. Zdanie „prawda tylko dla bieżącego odczytu: wartości zapisane w tick są już obcięte” jest przypuszczeniem bez dowodu plik:linia. Kryterium dodatku („potwierdzić, gdzie clamp wpływa na wartość Respektu”) spełnione tylko częściowo.

4. Ryzyko R3 (reset stempla wojny przy wczytaniu zapisu) jest przesadzone lub niedowiedzione. Komentarz w `main.ts` przy `setDiploRelation` (okolice 11545–11550) mówi, że stempel jest nakładany w jedynym punkcie mutacji statusu „i zachowywany przez save/load”, a spec (p.2b i R3) sam pisze, że meta jest zapisywana w całości. Reset do tury wczytania dotyczy co najwyżej zapisów sprzed wprowadzenia stempla; operator nie rozróżnia obu przypadków. Opis `diploEnsureWarStart` jako „leniwego” pomija, że główny stempel jest stawiany synchronnie w `setDiploRelation`.

5. Niekompletność względem zadania 1 dispatchu („WSZYSTKIE miejsca decyzji”) i 2b („gdzie dodać”). Spec sam deklaruje NIE ZWERYFIKOWANO dla: UI wypowiedzenia wojny przez gracza, funkcji otaczającej wojnę wymuszoną (main.ts:11820–11870), `forced-war-*.ts`, gałęzi `namow_wojne`, UI panelu wojny (zał. 8) oraz — najważniejsze — miejsca końca bitwy, w które trzeba wpiąć licznik (K3). Kroki K3 i K7 są przez to bez adresu wdrożenia. Dispatch wymagał opisu „co dodać i gdzie”; część „gdzie” brakuje.

6. Sprzeczność z wymogiem „zero pytań” (dispatch pkt 7, kryterium: właściciel nie chce pytań). W p.3 C4 i w „NASTĘPNYM KROKU” spec wymaga od orkiestratora „decyzji Z-A, Z-B, Z-D przed jakimkolwiek K1”, a w C4 pisze „Nie wybieram sam (zakaz z CLAUDE.md §ABC)”. To po fakcie przerzuca punkty na właściciela zamiast rozstrzygnąć je założeniem z wartością domyślną (dispatch: „Luki rozstrzygaj założeniem”). Wartości domyślne w Z-A…Z-G są podane, ale kontrast z „decyzje przed K1” jest niejasny. Do uporządkowania w treści.

7. Niespójność zał. 1 vs zał. 5 rozwiązana tylko domyślnie (Z-G: wypowiedzenie wojny zostaje na `PROG_WOJNA_SILA`), czyli „zastosowanie: wypowiedzenie wojny” z zał. 5 zostaje faktycznie niezrealizowane. Dispatch mówi „nie zmieniaj założenia po cichu”; spec to ujawnia (C1), więc to uwaga, nie wada, ale brak jawnego wariantu alternatywnego (np. pomiar na „pre-wojennym” stosunku sił wojskowych) jako opcji do wyboru.

## Kryteria binarne dispatchu
- `10-operator-claude.md` zawiera punkty 1–7 z plik:linia: TAK (z zastrzeżeniem zarzutu 5).
- Zero zmian poza katalogiem runu: TAK.
- Brak słowa „pytanie” w sekcji ZAŁOŻENIA DO POTWIERDZENIA: TAK.
- ≥5 losowych odwołań w kodzie: 20 sprawdzonych, 18 dokładnych, 2 z nieścisłością numeru linii (zob. wyżej).

RUNDY: 1/5
NASTĘPNY KROK: Obrona (Haiku) — odpowiedź na zarzuty 1–7; następnie Final Control (Sonnet).
DEPLOY/PUSH: NIE WYKONANO
