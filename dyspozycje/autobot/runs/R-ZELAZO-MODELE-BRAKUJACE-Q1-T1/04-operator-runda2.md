STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: `R-ZELAZO-MODELE-BRAKUJACE-Q1-T1`
GOAL: Dwa dedykowane modele 3D — Konnica lancowa i łucznicza asyryjska (Żelazo, Asyria) — zamiast wspólnego fallbacku `case 'konnica'`, historycznie uzasadnione i spójne z kanonem wizualnym Asyrii.

**MODEL WYKONAWCZY (czego zabrakło w rundzie 1): `claude-opus-5[1m]`.** Dowód nie z pamięci: (a) prompt systemowy tego subagenta podaje wprost „Opus 5 (1M context) / claude-opus-5[1m]"; (b) `get_session` sesji-rodzica (orkiestrator `session_01Fs7eok…`) zwraca `model: claude-sonnet-5`, `last_served_model: claude-sonnet-5` — **inną** wartość niż moja, co dowodzi, że `opts.model` faktycznie nadpisał dziedziczenie (w rundzie 1 dziedziczenie dałoby Sonnet 5 także tutaj). Effort: `CLAUDE_EFFORT=high`.

ZMIANY/COMMIT: gałąź `autobot/ZELAZO-T1-Q1`, commit **`0b2b091f`** (kontynuacja `c41acac7`, ta sama gałąź, pushed). Allowlista: `gra/src/render/zelazo-konnica-asyryjska-opus5.ts`, `gra/tools/zelazo-konnica-asyryjska-real-render-test.cjs`. `units.ts` **bez zmian** — dispatch rundy 1 zweryfikowany jako poprawny (`normName` składa `ł→l`, gałęzie stoją przed generykiem, `units.json` potwierdza `Atak dystansowy` 0/6).

**Nie potwierdziłem pracy rundy 1 — znalazłem w niej cztery twarde błędy geometrii**, których 25/25 nie wykryło, bo sekcje (A)-(E) mierzą wyłącznie nazwy mesh i pudełko zbiorcze bryły. Realne zrzuty izolowane (nie odczyt źródła) pokazały:
1. **Lanca prawie pionowa na osi uda** — drzewce przechodziło na wylot przez udo jeźdźca, pięta zwisała 0.05×HEX_R pod brzuchem konia. → chwyt na zewnątrz uda, grot w przód-w górę (Z4a).
2. **Łuk w „pieszej" skali i bez przechyłu** — dolne ramię wchodziło 0.06×HEX_R w grzbiet konia. → przechył wokół osi strzału (Z10) + skala do torsu jeźdźca (Z11); oba z uzasadnieniem historycznym, nie kompozycyjnym.
3. **Ramię naciągu z dwóch odcinków o tym samym kierunku** — proste (kąt łokcia 0 rad), przestrzeliwało własny cel `NOCK` czterokrotnie. → nowy `acArmIK` (dwukostny IK z biegunem, technika `pdArmIK` z kanonu kulturowego).
4. **Obręcz tarczy prostopadle do tarczy** — torus (normalna +Z) kontra walec (oś +Y) przy tym samym `rotation.y`. → dziedziczy kwaternion tarczy.
Dodatkowo wodze obu jednostek biegną teraz od faktycznego wędzidła (`bitY/bitZ`); łucznik w rundzie 1 nie miał wodzy, tylko pętelkę połączoną z niczym.

TESTY: temat **31/31** (dawne 25 + nowa sekcja (H): 5 asercji mierzących relacje między częściami, punkty odniesienia brane z modelu). Nietautologiczność (H) dowiedziona cofnięciem samych stałych pozy do wartości rundy 1 → **26 pass / 5 fail**, każda (H) czerwona (H1 0.157<0.206; H2 0.388<0.452; H3 0.173; H4 0 rad; H5 dot=0). `tsc --noEmit` 0 błędów. `vite build` binarką, `--outDir /tmp/civ-dist-r2` (C-001) OK. Bramki: logic 213/213, tech-tree 19/19, research 33/33, unit-replace 13/13, combat OK. Wymiary: lancowa 0.864×HEX_R / promień 0.546 / minY 0.0000; łucznicza 0.818 / 0.435 / 0.0000.

BLOKADY: brak.
RUNDY: 2/5.
NASTĘPNY KROK: Evaluator (Opus 5 High) — proszę zweryfikować niezależnie sekcję (H) i jej dowód nietautologiczności oraz zrzuty izolowane, nie tylko zrzut tokenowy.
DEPLOY/PUSH: push na gałąź tematu WYKONANO (wymagany przez dyspozycję); **deploy NIE WYKONANO**, `main` nietknięty.

UWAGI (`PASS-WITH-NOTES`, §11): raport przekracza ~400 słów, bo runda 2 musiała udokumentować cztery odrzucenia pracy rundy 1. Kosmetyczna, nieblokująca: trailer `Co-Authored-By` w commicie niesie narzuconą przez harness nazwę „Claude Sonnet 5" — faktyczny model wykonawczy jest podany wprost w treści commita i wyżej.