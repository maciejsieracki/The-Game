TEMAT: P-JEDNOSTKA-NIEWIDOCZNA-PO-WYBUDOWANIU-Q1
RUNDA: 1/5
DATA: 2026-09-03
DOMAIN: GAME
ŚCIEŻKA: gra/src/render/** (dokladny plik do potwierdzenia reconem w tej rundzie — patrz GOAL
krok 1; kandydat wskazany reconem orkiestratora: unitOwnerEmblem.ts, unitStatPlate.ts, units.ts)
MODEL+EFFORT: claude-opus-5, effort medium (Operator i Evaluator — praca w gra/src/render/**,
stala zgoda wlasciciela na Opus 5 dla tego katalogu, R-PROC-AUTOBOT.md §9 poz.6b). Final Control:
claude-sonnet-5.

WYZWALACZ (dosłownie od właściciela, dwa zrzuty ekranu tej samej okolicy miasta Ateny)
"Czasem coś się dzieje, że po wybudowaniu nowej jednostki nie pojawia się ona, tak jakby była
niewidoczna, chociaż wiemy, że jest na mapie, jakby coś później renderuje, a nagle się pojawia.
Na początku może to sprawiać wrażenie, że jednostka zniknęła albo się w ogóle nie pojawiła. Może
to wprowadzać graczy w błąd."
Zrzut 1: w miejscu jednostki widoczny malutki, uproszczony znacznik (wyglada jak mala
flaga/pinezka z cyfra "1") obok zoltej linii ruchu, bez pelnej sylwetki jednostki ani paska
zdrowia. Zrzut 2 (to samo miejsce, pozniej): pelny model 3D jednostki z paskiem zdrowia "37".

RECON (nie powtarzaj częściowo — już wykonane przez subagenta Explore tej sesji, ale WYMAGA
potwierdzenia żywym testem, nie jest pewne 1:1 — patrz GOAL krok 1)
- Silnik renderu to Three.js (geometria proceduralna), NIE Babylon.js. Caly model jednostki
  buduje `buildUnitModel()` w `gra/src/render/units.ts:1053`, W PELNI SYNCHRONICZNIE, z
  prymitywow (Box/Cylinder), BEZ GLTF/GLB i bez `loadAsync` — zero asynchronicznego ladowania
  samej geometrii/bryly jednostki. To WYKLUCZA hipoteze "model 3D laduje sie z opoznieniem" jako
  przyczyne calej niewidocznej sylwetki. Caly token (figurka + pierscien wlasciciela) powstaje w
  jednej klatce w `UnitRenderer.sync()` (`units.ts:5964-6028`), wolanym synchronicznie z
  `syncUnitsRender()` → `afterPlayerUnitSpawned()` (`main.ts:10519, 3535-3540, 28264-28270`) zaraz
  po `units.push(...)`.
- NAJBARDZIEJ PRAWDOPODOBNY, ALE NIE POTWIERDZONY 1:1 mechanizm: tabliczka nad zetonem
  (`unitStatPlate.ts`) rysuje medalion wlasciciela (portret wladcy/sygnet kultury/czaszka
  barbarzyncow) przez `ownerEmblemTexture()` → `getEmblemAsset()`
  (`gra/src/render/unitOwnerEmblem.ts:328-414`). Tarcza medalionu i zastepczy glif
  (`drawFallbackGlyph`, ~256-264) rysuja sie NATYCHMIAST na tej samej kanwie, a wlasciwy obrazek
  (portret/sygnet) dociaga sie asynchronicznie przez `loadImageInto()` (~315-321,
  `new Image(); img.onload = ...`) i podmienia dopiero po chwili (`texture.needsUpdate = true`).
  To ten sam WZORZEC co juz potwierdzony i naprawiony bug w analogicznym kodzie plakietki miasta
  (`cityMapStatChip.ts`, `BUG-IKONA-KULTURY-PLACEHOLDER` w PYTANIA-OTWARTE.md, przyczyna: cache
  `'loading'` gubil callback, naprawione commitem `ce69cf45`).
- WAZNE ZASTRZEZENIE (orkiestrator, czytanie kodu `getEmblemAsset` w tej rundzie): w
  `unitOwnerEmblem.ts` `assetByKey` cache'uje CALY obiekt `EmblemAsset` (texture+material)
  NATYCHMIAST przy pierwszym wywolaniu (linia ~356-357), zwracany SYNCHRONICZNIE — nie sam string
  `'loading'` jak w `cityMapStatChip.ts`. Asynchroniczna czesc WYLACZNIE podmienia TRESC istniejacej
  juz tekstury (`texture.needsUpdate = true`), nie tworzy calego assetu od nowa. To sugeruje, ze
  NAJWYZEJ maly medalion w rogu tabliczki moglby chwilowo pokazywac zastepczy glif zamiast
  portretu — NIE tlumaczy to w pelni opisu "cala jednostka jak malutka flaga z cyfra 1,
  niewidoczna". Medalion to MALY element tabliczki, nie caly zeton z figurka.
- Nie znaleziono w kodzie osobnego badge'u "×1" ani mechanizmu chowajacego caly model do czasu
  zaladowania czegokolwiek. Hipoteza medalionu MOZE byc niepelna lub bledna.

GOAL
1. ZANIM cokolwiek naprawisz: odtworz zywo w headless Chromium (Playwright) dokladnie ten
   scenariusz — zaloz/wybierz miasto, wybuduj jednostke, zrob seriê zrzutow klatka-po-klatce
   (lub co kilkadziesiat ms) w oknie czasowym TUZ PO zakonczeniu produkcji jednostki (kilka
   sekund), zeby zlapac dokladnie ten stan co na zrzucie 1 wlasciciela (maly znacznik/flaga z "1"
   zamiast pelnej sylwetki). PORDWNAJ z hipoteza medalionu z reconu — czy to faktycznie tabliczka
   pokazujaca zastepczy glif zamiast portretu (caly zeton+figurka JUZ widoczne, tylko maly
   medalion niepelny), czy to COS INNEGO (np. caly model niewidoczny/przezroczysty/nieprawidlowa
   skala/pozycja przez pierwsze klatki, inny mechanizm ktorego recon nie znalazl). NIE zakladaj
   ktoregokolwiek wyjasnienia bez tego zywego dowodu.
2. Gdy przyczyna zlokalizowana z dowodem (nie zgadywaniem): napraw tak, zeby jednostka (caly
   zeton, pelna figurka, tabliczka z medalionem) byla widoczna NATYCHMIAST po pojawieniu sie na
   mapie, bez fazy "niewidoczna/uproszczona → pelna po chwili". Jesli przyczyna to analogiczny
   "dropped callback" jak w juz naprawionym `BUG-IKONA-KULTURY-PLACEHOLDER`
   (`cityMapStatChip.ts`, commit `ce69cf45`) — uzyj TEGO SAMEGO wzorca naprawy, jesli pasuje do
   architektury `unitOwnerEmblem.ts` (ktora, jak ustalono w RECON wyzej, cache'uje inaczej — nie
   kopiuj naprawy mechanicznie, dostosuj do faktycznej struktury `assetByKey`/`EmblemAsset`).
3. Jesli przyczyna okaze sie byc GDZIE INDZIEJ niz hipoteza medalionu (np. w `units.ts`/
   `UnitRenderer.sync()`/`afterPlayerUnitSpawned` mimo ze recon oznaczyl je jako synchroniczne) —
   zaktualizuj allowlist swoja wlasna analiza w raporcie, trzymajac zmiane WYLACZNIE w
   zlokalizowanym zrodle (zakaz szerokiego refaktoru "przy okazji").
4. Jesli zywy test NIE odtworzy objawu na aktualnym HEAD (np. juz naprawione przy okazji innej
   pracy, analogicznie do kilku juz odkrytych w tej sesji false-lead'ow w innych tematach) —
   zatrzymaj sie ze statusem PASS-WITH-NOTES, udokumentuj dokladnie czego probowales i dlaczego
   nie odtworzyles, NIE zgaduj dalej.

KRYTERIA KOŃCA (binarne)
1. Istnieje zywy dowod (seria zrzutow/pomiarow z headless Chromium) na dokladny mechanizm
   objawu — potwierdzajacy LUB obalajacy hipoteze medalionu z reconu, z konkretnym wskazaniem co
   dokladnie jest niewidoczne/uproszczone w tym oknie czasowym.
2. Jesli przyczyna zlokalizowana i naprawiona: zywy dowod PRZED (objaw wystepuje) i PO (jednostka
   widoczna od razu w pelni) na TYM SAMYM scenariuszu (budowa jednostki w miescie, kilka
   powtorzen/ziaren dla pewnosci ze to nie przypadek/race condition zalezny od timingu).
3. Zero regresji na istniejacym mechanizmie asynchronicznego ladowania portretow/sygnetow dla
   INNYCH kontekstow uzywajacych tego samego kodu (panel bitwy, plakietka miasta, jesli dziela
   kod) — sprawdz zywo, nie zaloz.
4. `tsc --noEmit` czysty, 5 bramek referencyjnych (logic-test, tech-tree-test, research-test,
   unit-replace-test, combat-test) zielone.
5. Zero regresji na istniejacych testach renderu jednostek (znajdz je reconem, np.
   `gra/tools/*unit*render*test.cjs` lub podobne).

ALLOWLISTA (nic poza tym, chyba ze GOAL krok 3 wykaze inaczej — wtedy udokumentuj w raporcie
DOKLADNIE co i dlaczego, trzymajac zmiane w zlokalizowanym zrodle)
- gra/src/render/unitOwnerEmblem.ts
- gra/src/render/unitStatPlate.ts
- gra/src/render/units.ts (WYLACZNIE jesli recon w tej rundzie wykaze ze przyczyna lezy tu, nie
  w medalionie — z dowodem w raporcie)
- Nowy lub rozszerzony plik testu w gra/tools/*-test.cjs dla tego tematu.
Zakazane bezwzglednie: pliki z sekretami, docs/decyzje/<ID>.md, .git/**, dyspozycje/WERSJE.md,
gra-robocza/ROBOCZA-MANIFEST.json, playbook.json, main.ts (recon wskazuje ze sciezka
spawn/afterPlayerUnitSpawned jest juz w pelni synchroniczna i poprawna — jesli jednak GOAL
krok 1 wykaze inaczej, zatrzymaj sie ze statusem DECISION_REQUIRED zamiast rozszerzac zakres
samodzielnie o plik spoza render/**).

IZOLACJA
worktree /home/user/wt-jednostka-niewidoczna, gałąź autobot/P-JEDNOSTKA-NIEWIDOCZNA-PO-WYBUDOWANIU-Q1,
baza jawnie: origin/main (najnowszy commit na moment dispatchu).
Zakaz npm run build/dev w gra/ (export-data nadpisuje JSON) — dozwolona komenda:
node ./node_modules/vite/bin/vite.js build --outDir /tmp/civ-dist-jednostka-niewidoczna --emptyOutDir
Jedyna dozwolona kompilacja to node ./node_modules/typescript/bin/tsc --noEmit; bramki
referencyjne node tools/*-test.cjs nie sa nim objete.

REGUŁA PRZECIW SAMOOSZUKIWANIU (ANTY-HALUCYNACYJNA)
Zakaz uznania hipotezy medalionu (albo jakiejkolwiek innej) za potwierdzonej bez zywego dowodu w
headless Chromium odtwarzajacego dokladnie opisany objaw (budowa jednostki, seria zrzutow w
oknie tuz po zakonczeniu produkcji) — recon orkiestratora WPROST oznaczyl te hipoteze jako
"nie jest pewne 1:1", bo mechanizm cache'owania w `unitOwnerEmblem.ts` rozni sie od juz
naprawionego analogu w `cityMapStatChip.ts` (cache'uje caly obiekt assetu natychmiast, nie sam
string 'loading'). Nie kopiuj naprawy `ce69cf45` mechanicznie bez sprawdzenia, czy pasuje do
faktycznej struktury tego pliku.

PROCEDURA NAPRAWCZA PRZY FAIL
Evaluator wskazuje jeden konkretny defekt i poprawke; runda N+1 idzie na TYM SAMYM ID i TEJ SAMEJ
gałęzi, nie na nowej od zera. Po 5 rundach: LIMIT-5-EXCEEDED.

GRANICE
Operator/Evaluator/Obrona nie integruja, nie deployuja, nie pushuja. Final Control i integracja
(allowlist-only, per plik i per hunk) dzieja sie poza worktree Operatora, reka orkiestratora.

OBIEG
Operator (Opus 5, effort medium) → Evaluator (Opus 5, effort medium) → Operator (obrona, jesli
zarzuty niepuste) → Final Control (Sonnet 5) → integracja orkiestratora → READY_FOR_DEPLOY.
