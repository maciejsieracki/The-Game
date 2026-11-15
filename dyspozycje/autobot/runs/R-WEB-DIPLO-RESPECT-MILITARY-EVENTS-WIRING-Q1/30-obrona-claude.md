STATUS: PASS-WITH-NOTES (obrona r4; Z1 i Z2 odrzucone/częściowo przyjęte z dowodem, pozostałe przyjęte; decyzje właściciela DO POTWIERDZENIA)
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-RESPECT-MILITARY-EVENTS-WIRING-Q1
GOAL: zdarzenia Respektu „Przewaga militarna” (+15) i „Słabszy militarnie” (−10), próg 50% siły wojskowej, jednorazowo na przejściu progu, widoczne w rejestrze i w pasku Respektu panelu dyplomacji.
ZMIANY-COMMIT: 2dcc7dcd08f3a770950c08882812419d0edfbddf (baza: kandydat evaluatora f04c09dc0; zmiany: gra/src/main.ts (+13/-8, applyMilitaryRespektEdgeTick + import DIPLOMACY_PARAMS), gra/src/data/wikiBundle.json (regeneracja narzędziem bundle-wiki-for-game.cjs, 2 linie), docs/encyklopedia/pojecia/respekt.md, docs/PORADNIK-GRACZA/12-dyplomacja.md, dyspozycje/autobot/runs/R-WEB-DIPLO-RESPECT-MILITARY-EVENTS-WIRING-Q1/evidence/respekt-live-t2/t8/t9.png). Allowlista zgodna z dodatkiem (main.ts i wikiBundle dozwolone). Brak git add -A.
TESTY (liczby z surowego wyjścia tej rundy):
- npx tsc --noEmit: exit 0 (bez błędów).
- diplo-respect-military-offset-test.cjs: RESULT 12 OK, 0 FAIL (exit 0).
- diplo-respect-military-events-test.cjs: Wynik 30 OK, 0 FAIL (exit 0).
- diplo-respect-military-edge-test.cjs: Wynik 12 OK, 0 FAIL (exit 0).
- diplo-respect-military-live-test.cjs (headless Chromium, zbudowany bundle poza repo, tury 1–30, realny endTurn i realny tick dyplomacji): Wynik 40 OK, 0 FAIL, exit 0. Odczyty z respekt-live-result.json: T2 bar 100 = baza 85 + offset 15; T8 bar 99 = baza 84 + 15; T9 bar 72 = baza 82 − 10, rejestr „Słabszy militarnie” obecny; zero console.error/pageerror.
- git diff --check: czysto (bez wyjścia).
- Zrzuty evidence/respekt-live-t2.png, t8.png, t9.png odświeżone przez test żywy (ta sama wersja kodu co commit).
NIE ZMIERZONO w tej rundzie: mutacja M4 (kierunek zdarzeń) na nowym kodzie (zmiana nie dotyka gałęzi 'A'/'B' — kierunek bez zmian; czerwień M4 zgłosił ewaluator na f04c09dc0); bramki referencyjne city-cession-r3, stol-pw-sum, border-era-penalty-live, direct-negotiation-live, diplo-truce-live, logic, tech-tree, research, unit-replace, combat, unit-power NIE uruchamiane ponownie (powód: zmiana 13 linii w jednej funkcji; wyniki ewaluatora z f04c09dc0 podane jako baza); scenariusz clamp przy bazie ≥86 (np. 90+15 → 100) NIE dodany do testu żywego.

ODPOWIEDZI NA ZARZUTY:
Z1 (korekta +15 dodana do paska gracza i do rel.respekt AI, suma 100→130): ODRZUCAM jako defekt kodu; ZOSTAWIAM jako DO POTWIERDZENIA przez właściciela.
  Dowód: (a) pętla AI, main.ts ~43419–43426: respektAI = respektZKorektaMilitarna(computeRespekt(potAI, potPlr), offset) — rel.respekt to Respekt AI wobec gracza, zgodnie z zapisem dispatchu „+15 Respektu u AI wobec gracza”. (b) pasek gracza, main.ts ~26491: respektNorm = respektBarWithMilitaryOffset(ownerId, powerLine.respekt), czyli udział gracza + offset — decyzja z dodatku r2/r4 („pasek ma uwzględniać korektę; przewaga podnosi pasek”). (c) Te dwie wartości to różne wielkości (udział gracza do wyświetlenia vs rel.respekt AI); nie są sumowane w żadnym miejscu. Jedyna suma to audienceRelTotalEffective = zaufanie + pasek; theirRespekt (buildPlayerDiploRelations, main.ts ~8723) liczy się bez korekty. Suma 130 z zarzutu porównuje dwie różne wielkości. Czy znak korekty po stronie AI ma być odwrotny — decyzja właściciela (DO POTWIERDZENIA), nie zmieniam bez niej.
Z2 (rejestr pokazuje dwa wpisy +15, suma +30, pasek +15; wpisy zostają po zdjęciu korekty): PRZYJMUJĘ częściowo.
  Kod rejestru bez zmian (rejestr jest dziennikiem zdarzeń, jak pozostałe wpisy Respektu). Dopisano w respekt.md i poradniku, że wpisy zostają po zdjęciu korekty, a pasek pokazuje wyłącznie aktualną korektę. Zmiana rejestru na wartość stanu = decyzja właściciela (DO POTWIERDZENIA).
Z3 (testy jednostkowe replikują logikę; jedyny dowód mutacyjny na realnym kodzie to test żywy bez bramki): ODRZUCAM jako blokujące, PRZYJMUJĘ jako notę.
  Dowód: test żywy (diplo-respect-military-live-test.cjs) wykonuje realny endTurn i realny applyMilitaryRespektEdgeTick w bundle vite; mutacja M4 zgłoszona przez ewaluatora na f04c09dc0 daje exit 1 (dispatch wymaga tego dowodu). Testy offset/edge są testami replik i nie są podstawą dowodu — tak traktuję je w tym raporcie. events-test zawiera asercje tekstowe na źródle, też traktowane jako uzupełnienie. Mutacji M4 nie powtórzono na nowym kodzie (patrz NIE ZMIERZONO).
Z4 (poradnik 12-dyplomacja.md mówi tylko „+15 jednorazowo”, bez zaniku korekty): PRZYJMUJĘ — dopisane: korekta trwa, dopóki utrzymuje się stan progu; po powrocie w pasmo neutralne pasek wraca do wartości bez korekty; wpis w rejestrze zostaje.
Z5 (respekt.md, sprzeczne zdania „usunięte z obowiązujących” i „zasady niewdrożone” przy przewadze podpiętej): PRZYJMUJĘ — akapit historii przepisany: stan zweryfikowany 2026-11-13 (zdarzenia nie były wywoływane), podpięcie decyzją ABC 2026-11-14; stare sformułowania „niewdrożone/usunięte” usunięte.
Z6 (korekta = clampowane dR, więc przy skrajnych bazach pasek przesuwa się o mniej niż +15/−10): PRZYJMUJĘ — poprawka w kodzie.
  Zmiana main.ts applyMilitaryRespektEdgeTick: respektMilOffset = nominał DIPLOMACY_PARAMS.przewagaMilitarna_respekt (+15) albo slabszyMilitarnie_respekt (−10), tym samym źródłem co applyDiplomaticEvent. Obcięcie 0–100 działa wyłącznie przy wyliczaniu paska (respektZKorektaMilitarna). Dowód: test żywy T2/T8/T9 PASS (bez zmiany wartości w tych bazach, bo nie są skrajne). Scenariusz skrajny (baza ≥86 przy +15) nie został dodany do testu — NIE ZMIERZONO.

ZMIANY W KODZIE (r4, obrona): main.ts (nominał korekty, import DIPLOMACY_PARAMS); wikiBundle.json (regeneracja); respekt.md, 12-dyplomacja.md (doprecyzowanie). Zrzuty evidence odświeżone.

BLOKADY: brak blokad technicznych. Decyzje właściciela DO POTWIERDZENIA (nie blokują zgodności z dispatchem r4, ale wymagają odpowiedzi): (1) znak korekty po stronie AI względem udziału bazowego (Z1); (2) rejestr jako dziennik vs stan (Z2); (3) zastępowanie korekty przy przejściu progu i zdjęcie w pasmo neutralne (Z3 r4 / wariant A); (4) nominał vs clamp przy skrajnych bazach (Z6) — przyjęto nominał.

RUNDY: 4/5 (obrona). Operator SONNET (uzasadnienie w dispatchu: trzy nieudane rundy Haiku, defekt wymaga analizy semantyki w trzech miejscach main.ts).

UWAGI-DLA-ORKIESTRATORA: (a) w worktree dodano symlink gra/node_modules -> wf_1465bf01-f91-1/gra/node_modules (wyłącznie do esbuild/playwright/tsc, nie jest śledzony przez git); do usunięcia przy sprzątaniu. (b) Test żywy został automatycznie przeniesiony do tła przez harness (limit 120 s), zakończył się exit 0; nie uruchamiano żadnych sesji ani zadań. (c) Przy sprzątaniu: zrzut bundle w scratchpad/bundle-r4 (do usunięcia).

NASTĘPNY KROK: ewaluator r5 — weryfikacja commitu 2dcc7dcd0 (zmiana nominału + docs + wiki); przed READY_FOR_DEPLOY wymagane: bramki referencyjne i M4 na nowym kodzie; decyzje właściciela (1)–(4) jako DO POTWIERDZENIA.
DEPLOY/PUSH: NIE WYKONANO
