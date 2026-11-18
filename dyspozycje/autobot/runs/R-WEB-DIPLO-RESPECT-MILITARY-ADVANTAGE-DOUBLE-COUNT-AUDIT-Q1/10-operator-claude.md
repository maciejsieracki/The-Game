# R-WEB-DIPLO-RESPECT-MILITARY-ADVANTAGE-DOUBLE-COUNT-AUDIT-Q1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (audyt, bez zmian kodu)
TEMAT: R-WEB-DIPLO-RESPECT-MILITARY-ADVANTAGE-DOUBLE-COUNT-AUDIT-Q1
GOAL: ustalić, czy „Przewaga militarna” (+15) liczy się w panelu i w Respekcie dwa razy.
ZMIANY-COMMIT: brak zmian kodu (wariant A). Commit tylko tego raportu. Baza 468488084cf8cd8d654300afffd8c3501d3e888d.

**Werdykt: wariant A.** Dwa wiersze to dwa realne przejścia progu 50% (gracz ≥1,5×). Między nimi stan spadł do `brak`. Respekt liczy +15 raz.

Mechanizm:
- `diplomacy-military-strength.ts:325-339` `respektMilitaryCrossing`: zdarzenie tylko na przejściu do `A`; stan `A` nie generuje zdarzenia.
- `main.ts:13010-13050` `applyMilitaryRespektEdgeTick`: stan w meta pary; spadek do `brak` zeruje offset (13029); korekta zastępuje, nie kumuluje (13043-13050).
- Jedno wywołanie na turę (main.ts:26030, z 42249). Wariant B wykluczony.
- Wiersze panelu: `buildRelationBreakdown` (diplomacy-factors.ts:195-199) wypisuje każdy wpis `diplomacyFactorLog`, dopisywany w `applyDiploEventTracked` (main.ts:13244-13258).

Symulacja logiki (`/tmp/claude-0/r-web-dd/sim.cjs`, bundle z kodu źródłowego), ratio gracz/partner per tura:
- T1 1,0 → brak; T2 1,6 → A, +15; T3–T4 1,6 → brak zdarzenia; T5 1,2 → brak; T6 1,6 → A, +15; T7 1,6 → brak zdarzenia; T8 0,6 → B, −10; T9 1,0 → brak.
- Surowa lista: [T2 przewaga +15], [T6 przewaga +15], [T8 słabszy −10].
- Dwa wiersze „Przewaga militarna +15” odpowiadają T2 i T6. Scenariusz zrzutu NIE jest odtworzony z zapisu gracza (NIE ZMIERZONO na prawdziwym zapisie).

Spójność liczb (Respekt 87, Relacja 115 = Zaufanie 28 + Respekt 87):
- Pasek = clamp(base + offset, 0, 100) (main.ts:3078, 27281). Offset jest jeden, maks. +15.
- Suma wierszy (+70) nie jest składnikiem paska. Respekt 87 przy stanie `A` oznacza base 72; base nie widać na zrzucie (NIE ZMIERZONO).

Uwaga przy kodzie (nie dotyczy zrzutu):
- `applyMilitaryWinRespectEvent` (main.ts:13263-13270) zapisuje +5 do `rel.respekt`. Tick końcowy tury (main.ts:45388-45395) nadpisuje `rel.respekt` wartością `computeRespekt + offset`. Pasek czyta wartość bez `rel.respekt` (27281). Wniosek z kodu: wiersze „Wygrana bitwy +5” są w historii, ale nie wchodzą do paska Respektu. Do potwierdzenia w grze (NIE ZMIERZONO runtime).

TESTY (cwd gra/, node / tsc):
- `npx tsc --noEmit`: exit 0.
- logic-test: LOGIC OK (213/213).
- tech-tree-test: 20 pass, 0 fail.
- research-test: 33/33.
- unit-replace-test: 21/21.
- combat-test: 6/6.
- diplo-respect-military-edge-test: exit 0.
- diplo-respect-military-events-test: exit 0.
- diplo-respect-military-offset-test: exit 0.
- diplo-military-strength-test: exit 0.
- diplo-respect-military-live-test: exit 1. Powód: `launchBrowser` szuka `/usr/bin/chromium` i `/opt/pw-browsers/chromium-1194/...`, a na maszynie jest `/opt/pw-browsers/chromium-1243`. Nie zmieniano testu (poza allowlistą). NIE ZMIERZONO.
- Mutacja w kopii: pominięta (brak zmian kodu).

BLOKADY: test żywy (headless) nieuruchomiony, patrz wyżej. Brak pytania ABC: zasada „+15 przy ponownym przekroczeniu” jest zgodna z ustaleniem.

RUNDY: 1/5 (werdykt A, bez poprawki).

NASTĘPNY KROK (dla orkiestratora): decyzja, czy wiersze „Wygrana bitwy +5” mają wpływać na pasek Respektu. Obecnie są w historii i są nadpisywane w końcowym ticku tury. Oraz: naprawa ścieżki Chromium w `diplo-respect-military-live-test.cjs` (poza tym tematem).

UWAGI-DLA-ORKIESTRATORA: jw.

DEPLOY-PUSH: NIE WYKONANO
