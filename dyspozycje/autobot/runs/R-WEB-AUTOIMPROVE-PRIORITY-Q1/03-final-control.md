STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-AUTOIMPROVE-PRIORITY-Q1
GOAL: Final Control rundy 2 — werdykt co do 7 zarzutów Obrony i poprawki Operatora (SHA ca18db5dd).
ZMIANY/COMMIT: SHA do integracji `ca18db5dd` (baza 1ea09a182 -> 914daa502 = origin/main). Zmiany tylko w allowliście: `gra/src/game/auto-improvements.ts`, 5 skryptów `gra/tools/wyrab-*`, pliki runu. Zero zmian w gra-robocza/, WERSJE.md, rust-port/, src-tauri/.

WERDYKT PER ZARZUT
1 deadlock tartak/obóz: ODDAL (naprawione). `riverKrok0Ok` (auto-improvements.ts ~1000-1019) steruje i KROKIEM 0, i bramką tartak/obóz; bez `lesneMin`. Test r2 scen.1 zielony.
2 test jednoscenariuszowy: ODDAL. wyrab-rzeka-r2-test.cjs ma 5 scenariuszy (bez lasów dodatkowych, 1 las, 5 lasów, Objaw B, E3).
3 przypadek właściciela (mało lasu): ODDAL. Próg 3 i lesneMin nie dotyczą heksu rzeki; scen.2 zielony. Wyrąb POZA rzeką przy małym lesie celowo zachowany, DECISION_REQUIRED 1 (zgodnie z dispatchem: nie zgadywać).
4 przebudowa E1-E4 "po typach": DO DECYZJI CZŁOWIEKA. Dispatch dopuszczał DECISION_REQUIRED przy większej przebudowie FAZY 1; Operator zmierzył skutek (measure-r2-kolejnosc) i naprawił E3 minimalnie (hodowla tylko przy rzece, ~linia 1100). E1 (farma bez obywatela) i E4 - decyzje 2 i 4 do właściciela.
5 Objaw B: ODDAL z notą. Przyczyna zmierzona w pickerze: brak technologii „Oswojenie zwierząt" (terrain-improvements.json, bydlo.tech); z techem bydło po farmie powstaje (test scen.4). Realny stan gracza (main.ts:32186) i wywołanie AI (ai.ts) - NIE_ZMIERZONO; luka dowodowa opisana jawnie, nie błąd kodu pickera.
6 mutacja: ODDAL. Własna mutacja FC: auto-improvements.ts z 1ea09a182 -> r2-test 4 PASS / 6 FAIL.
7 bramki: ODDAL, powtórzone samodzielnie.

Brak zarzutu NAPRAW => PASS-WITH-NOTES.

TESTY (FC, samodzielnie na ca18db5dd, npm ci --ignore-scripts, node_modules usunięty po):
- tsc --noEmit: EXIT=0
- wyrab-rzeka-krok0-test: 3/0
- wyrab-rzeka-r2-test: 10/0
- auto-improvements-test: 45/0 (baza 45/0)
- ai-improvements-test: 53/0 (baza 53/0)
- wyrab-wycinka-nazwa-live-test: 49/0
- mutacja do 1ea09a182: 4 PASS / 6 FAIL
Znane czerwone (ai-test, diplomacy, ring itd.) niedotknięte zmianą.
BLOKADY: brak.
NOTATKI: (a) wpływ na liczby żywności AI z poprzedniej rundy NIE_ZMIERZONO; (b) ograniczenie hodowli do rzeki dotyczy też AI (jedna funkcja) - zgodne ze specyfikacją E3; (c) DECISION_REQUIRED 1-4 Operatora do właściciela przez orkiestratora.
KOLEJNOŚĆ INTEGRACJI: ca18db5dd leży na origin/main 914daa502 i nie dotyka rust-port/ ani src-tauri/ (0 plików). Integrować do main niezależnie od origin/rust-port/parity-v2 (brak konfliktu plików; przed lub po).
RUNDY: 2/5
NASTĘPNY KROK: integracja orkiestratora (jawny git add, bez push/deploy bez autoryzacji), potem READY_FOR_DEPLOY.
DEPLOY/PUSH: NIE WYKONANO
