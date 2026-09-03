TEMAT: R-MIASTA-PANSTWA-PRODUKCJA-OBRONNA-Q1
RUNDA: 1/5
DATA: 2026-09-03
DOMAIN: GAME
ŚCIEŻKA: gra/src/game/city-state-difficulty.ts (cityStateMilitaryProductionCap),
gra/src/game/ai.ts (kolejność priorytetów produkcji miast-państw, kandydaci budowlani)
MODEL+EFFORT: claude-sonnet-5, effort high (zmiana balansu AI, rdzeń logiki ai.ts —
wymaga starannej weryfikacji braku regresji dla cywilizacji AI, nie tylko miast-państw)

WYZWALACZ (dosłownie od właściciela)
"Na najtrudniejszym poziomie państw-miast, każde państwo-miasto powinno zaczynać od razu
z dwiema jednostkami wojskowymi. Na najłatwiejszym zero, na normalnym jedna jednostka
[TEMAT OSOBNY — patrz R-MIASTA-PANSTWA-STARTOWE-JEDNOSTKI-Q1, kolejka]. [...] Państwa-
miasta powinny się na początku skupić na budowie jednostek wojskowych, żeby się obronić.
W tej chwili nie są w ogóle wyzwaniem. Ewentualnie powinny budować palisadę jako
budynki, rekrutować jednostki i na początku skupić się na tym w dużej mierze."

RECON (nie powtarzaj — już wykonane przez orkiestratora tej sesji, subagent Explore)
- `cityStateMilitaryProductionCap` (`city-state-difficulty.ts:38-47`) to dziś MAKSYMALNY
  SUFIT wojska miasta-państwa: hard=4, normal=1, **easy=null (BEZ LIMITU!)** —
  egzekwowany w `ai.ts:1546-1563` przez filtrowanie kandydatów wojskowych po
  osiągnięciu capu. To jest ODWROTNIE niż intencja właściciela — im trudniejszy
  poziom, tym NIŻSZY pułap wojska (poza easy=bez limitu), zaprojektowane pod mechanikę
  fali ataku (ograniczenie liczby jednostek NA RAZ na mapie), nie pod obronę własną.
- `ai.ts:1400-1454` (blok `defensiveCopy`) — miasto-państwo PO zdobyciu 1. jednostki
  garnizonowej (`cityGuardCount >= 1`) przechodzi do budowy infrastruktury; `mury`/
  `koszary` mają OBNIŻANY score (`-90` normal / `-25` hard) — czyli AI wręcz UNIKA
  budowy fortyfikacji, zamiast je preferować.
- "Palisada" jako budynek NIGDY nie pojawia się w kandydatach AI miast-państw —
  potwierdzone grepem po `ai.ts`: zero wystąpień `'palisada'`. AI zna wyłącznie `'mury'`.
  Sprawdź reconem w danych gry (`buildings.json` lub podobne), czy budynek "Palisada"
  w ogóle istnieje jako osobna, wcześniejsza (tańsza) pozycja od "Mury" w drzewie
  budynków obronnych — jeśli tak, to właśnie ta pozycja ma trafić do kandydatów AI
  miast-państw jako PIERWSZY wybór obronny (tańszy, szybszy niż mury).

GOAL
1. Na poziomie trudności miast-państw HARD, `cityStateMilitaryProductionCap` NIE MOŻE
   być niższy niż na NORMAL — sufit wojska ma rosnąć (albo być usunięty/bardzo wysoki)
   wraz z trudnością, nie maleć. Ustal nowe wartości z zachowaniem sensu mechaniki fali
   ataku (recon: sprawdź DOKŁADNIE do czego ten cap służy — czy to faktycznie
   ogranicza rozmiar armii obronnej, czy tylko liczbę jednostek WYSYŁANYCH w ataku na
   gracza — jeśli to drugie, cap na ATAK i cap na OBRONĘ to mogą być dwie różne rzeczy
   pomylone dziś w jednej stałej; jeśli tak, rozdziel je, nie zmieniaj ślepo jednej
   liczby).
2. Wczesna faza gry (miasto-państwo świeżo założone, brak lub minimalny garnizon) —
   priorytet produkcji przesunięty NA jednostki wojskowe I budynki obronne (Palisada
   jeśli istnieje jako tańsza wcześniejsza pozycja niż Mury, inaczej Mury) —
   PRZED infrastrukturą ekonomiczną. Dokładny próg "wczesnej fazy"/liczba jednostek do
   osiągnięcia przed przejściem do ekonomii — dobierz sensownie do balansu (np. 2-3
   jednostki garnizonowe na hard, mniej na easy/normal), uzasadnij w raporcie.
3. Usuń/złagodź obniżony score dla `mury`/analogicznych budynków obronnych w kontekście
   miast-państw — mają być NEUTRALNIE lub POZYTYWNIE punktowane we wczesnej fazie, nie
   karane.
4. Skalowanie z trudnością miast-państw: im wyższy poziom, tym silniejszy priorytet
   obronny (więcej jednostek/szybciej budynki obronne) — analogicznie do już istniejącego
   wzorca `citySupportByDifficulty` (main.ts, poza allowlistą tego tematu — użyj jako
   punkt odniesienia do stylu skalowania, nie edytuj).
5. Zero zmian w logice produkcji CYWILIZACJI AI (nie miast-państw) — te same funkcje w
   `ai.ts` są prawdopodobnie współdzielone, więc każda zmiana MUSI być warunkowana
   `isCityState`/analogiczną flagą, nigdy globalna.

KRYTERIA KOŃCA (binarne)
1. Test: nowa gra, poziom trudności miast-państw HARD — po N turach (dobierz sensowną
   liczbę reconem/testem) miasto-państwo ma WIĘCEJ jednostek wojskowych i/lub
   ukończone/w budowie fortyfikacje niż DZIŚ na tym samym seedzie (porównanie PRZED/PO).
2. Test: cap wojska na HARD nie jest niższy niż na NORMAL (porównanie wartości
   `cityStateMilitaryProductionCap` PRZED/PO dla wszystkich trzech poziomów).
3. Test: cywilizacje AI (nie miasta-państwa) mają NIEZMIENIONĄ kolejność/priorytety
   produkcji na tym samym seedzie — zero regresji.
4. Żywy test symulujący wczesną grę (np. 10-15 tur) pokazuje miasto-państwo hard
   budujące jednostki/fortyfikacje jako priorytet, nie przypadkowe budynki ekonomiczne.
5. Zero regresji na istniejących testach AI/miast-państw (znajdź reconem, np.
   ai-*-test.cjs, city-state-*-test.cjs w gra/tools/).
6. `tsc --noEmit` czysty, 5 bramek referencyjnych (logic-test, tech-tree-test,
   research-test, unit-replace-test, combat-test) zielone.

ALLOWLISTA (nic poza tym)
- gra/src/game/city-state-difficulty.ts — WYŁĄCZNIE `cityStateMilitaryProductionCap` i
  ewentualne nowe, powiązane stałe (jeśli GOAL 1 wymaga rozdzielenia cap-atak/cap-obrona).
- gra/src/game/ai.ts — WYŁĄCZNIE fragmenty dot. priorytetów produkcji miast-państw
  (`defensiveCopy` blok ok. linii 1400-1454, filtrowanie kandydatów wojskowych ok.
  linii 1546-1563) — WSZYSTKIE zmiany warunkowane `isCityState`/analogiczną flagą.
- Nowe lub rozszerzone testy w gra/tools/*-test.cjs.
Zakazane bezwzględnie: pliki z sekretami, docs/decyzje/<ID>.md, .git/**,
dyspozycje/WERSJE.md, gra-robocza/ROBOCZA-MANIFEST.json, playbook.json, zmiana logiki
produkcji CYWILIZACJI AI (bez warunku isCityState), zmiana sojuszy między miastami-
państwami (`formSisterAlliancesIfThreatened`, osobny, potwierdzony jako DZIAŁAJĄCY
mechanizm — poza zakresem), zmiana startowych jednostek (osobny temat
R-MIASTA-PANSTWA-STARTOWE-JEDNOSTKI-Q1).

IZOLACJA
worktree /home/user/wt-miasta-panstwa-produkcja-obronna, gałąź
autobot/R-MIASTA-PANSTWA-PRODUKCJA-OBRONNA-Q1, baza jawnie: origin/main (najnowszy commit
na moment dispatchu).
Zakaz npm run build/dev w gra/ (export-data nadpisuje JSON) — dozwolona komenda:
node ./node_modules/vite/bin/vite.js build --outDir /tmp/civ-dist-miasta-panstwa-obrona --emptyOutDir
Jedyna dozwolona kompilacja to node ./node_modules/typescript/bin/tsc --noEmit; bramki
referencyjne node tools/*-test.cjs nie są nim objęte.

REGUŁA PRZECIW SAMOOSZUKIWANIU (ANTY-HALUCYNACYJNA)
Zakaz uznania kryterium 1/4 za spełnione bez żywej symulacji wielu tur (nie samego
czytania zmienionych wartości progowych w kodzie) pokazującej FAKTYCZNIE inny wybór
produkcji miasta-państwa niż dziś. Zakaz założenia, że `cityStateMilitaryProductionCap`
dotyczy WYŁĄCZNIE obrony bez potwierdzenia reconem, do czego dokładnie ten cap jest
używany (może ograniczać też coś innego, np. atak/najazd — sprawdź WSZYSTKIE miejsca
odczytu tej stałej przed zmianą wartości).

PROCEDURA NAPRAWCZA PRZY FAIL
Evaluator wskazuje jeden konkretny defekt i poprawkę; runda N+1 idzie na TYM SAMYM ID i
TEJ SAMEJ gałęzi, nie na nowej od zera. Po 5 rundach: LIMIT-5-EXCEEDED.

GRANICE
Operator/Evaluator/Obrona nie integrują, nie deployują, nie pushują. Final Control i
integracja (allowlist-only, per plik i per hunk) dzieją się poza worktree Operatora,
ręką orkiestratora.

OBIEG
Operator (Sonnet 5, effort high) → Evaluator (Sonnet 5, effort high) → Operator (obrona,
jeśli zarzuty niepuste) → Final Control (Sonnet 5) → integracja orkiestratora →
READY_FOR_DEPLOY.
