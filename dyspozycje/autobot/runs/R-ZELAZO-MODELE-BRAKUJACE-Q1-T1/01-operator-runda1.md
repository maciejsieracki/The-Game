# RAPORT — Operator, runda 1/5

```
STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-ZELAZO-MODELE-BRAKUJACE-Q1-T1
GOAL: Zbudować dwa nowe, dedykowane modele 3D — Konnica lancowa asyryjska i Konnica
      łucznicza asyryjska (Żelazo, Asyria) — zamiast dzisiejszego generycznego
      fallbacku `case 'konnica'`, historycznie uzasadnione, spójne z kanonem
      wizualnym Asyrii.
ZMIANY/COMMIT: gałąź autobot/ZELAZO-T1-Q1, commit c41acac7e5abeb84efb226633c60736c2c4f968f,
      wypchnięty do origin (`git push -u origin autobot/ZELAZO-T1-Q1` — nowa gałąź).
      Pliki (staged per-plik, bez `git add -A`):
      - gra/src/render/units.ts (M) — WYŁĄCZNIE 2 importy + 2 gałęzie dispatchu w
        buildNamedUnit(), PRZED generycznym `case 'konnica'`; zero zmian poza tym
        (potwierdzone `git diff` i `git diff --check` czyste).
      - gra/src/render/zelazo-konnica-asyryjska-opus5.ts (nowy, 935 linii) — dwa
        buildery + wspólny koń/korpus jeźdźca + dispose().
      - gra/tools/zelazo-konnica-asyryjska-real-render-test.cjs (nowy) — real-render
        Playwright/Chromium.
TESTY:
  - tsc --noEmit: 0 błędów.
  - vite build (node ./node_modules/vite/bin/vite.js build --outDir /tmp/civ-zelazo-t1-dist
    --emptyOutDir, C-001): OK, 30.47s, brak błędów.
  - 5 bramek referencyjnych: logic-test 213/213, tech-tree-test 19/19, research-test
    33/33, unit-replace-test 13/13, combat-test 6/6 — wszystkie na referencyjnym poziomie.
  - Real-render test tematu: 25/25 PASS, w tym:
    * (A1-A3) łucznik dzierży realny mesh łuku+kołczanu ZERO lancy/tarczy; lancer ma
      lancę+tarczę ZERO łuku/kołczanu (zmierzone na żywej strukturze Three.js, nie
      z kodu źródłowego);
    * (D0-D5) dowód nietautologiczności: bundle z odwróconym dispatchem (2 usunięte
      linie w units.ts, w locie, bez zmiany plików repo) — wszystkie asercje
      rozstrzygające (A1-A4) faktycznie czerwienieją, obie jednostki spadają
      DOKŁADNIE na liczbę mesh generycznego fallbacku;
    * (E1-E4) proporcje: lancowa wysokość 0.869×HEX_R / promień 0.435×HEX_R / minY=0;
      łucznicza wysokość 0.863×HEX_R / promień 0.435×HEX_R / minY=0 (oba promienie
      w normie 0.70 i twardym limicie 0.866; hooves dokładnie na y=0);
    * (G1-G2) artefakt PRODUKCYJNY vite build niesie oba nowe ciągi dispatchu.
  - Zrzuty PRZED/PO z żywego Chromium wysłane do właściciela (SendUserFile) —
    wizualnie potwierdzają: łucznik trzyma łuk w naciągu + kołczan na plecach,
    lancer trzyma lancę + okrągłą tarczę, oba wyraźnie różne od generycznej
    Konnicy (Brąz) w kolorze/pancerzu/hełmie.
BLOKADY: patrz notatka o modelu poniżej (nie blokuje integracji, wymaga uwagi
      orkiestratora/właściciela).
RUNDY: 1/5.
NASTĘPNY KROK: Evaluator (adwersaryjnie, niezależnie uruchomione bramki + real-render).
DEPLOY/PUSH: PUSH WYKONANO (branch); DEPLOY NIE WYKONANO.
```

## Notatka wymagająca uwagi orkiestratora (powód PASS-WITH-NOTES)

**Model wykonawcy.** Dispatch (`00-dispatch.md` §Pętla) wymaga „Opus 5 High dla
Operatora i Evaluatora" (temat czysto wizualny, R-PROC-AUTOBOT §5a). Zostałem
uruchomiony jako **Sonnet 5** (potwierdzone przez środowisko wykonawcze, nie z
pamięci) — bez możliwości samodzielnej zmiany modelu z poziomu tego subagenta.
To jest znany gap (playbook C-061: narzędzie dispatchujące subagentów w tej
warstwie nie zawsze niesie parametr modelu/effort do orkiestratora nadrzędnego).
Nie próbowałem tego obejść ani ukryć — zgłaszam wprost, żeby orkiestrator
zdecydował: (a) zaakceptować wynik mimo niezgodności modelu, biorąc pod uwagę
mocny automatyczny dowód (25/25 real-render, w tym dowód nietautologiczności i
zmierzone proporcje) w miejsce jakości subiektywnej oceny modelu, albo
(b) zdecydować o powtórce na właściwym modelu. To NIE jest naruszenie granicy
§9 (nie dotyczy zakresu/kodu/bezpieczeństwa) — jest to odstępstwo od przypisania
modelu, które sam nie mogłem skorygować.

Uwaga jest **kosmetyczna z punktu widzenia GOAL/dowodu/zakresu** (te są spełnione
w pełni, zmierzone niezależnie) i dotyczy wyłącznie procesu doboru modelu — zgodnie
z §3b powinna zostać zapisana jako odrębna sprawa procesowa, nie blokować integracji
tego tematu.

## Skrót decyzji projektowych (pełne uzasadnienie: komentarz Z1-Z9 w pliku)

- **Z1-Z2**: brak strzemion i sztywnego siodła (jak w Brązie), derka bogatsza z
  fredzlami (Z2) — zweryfikowane, nie zgadywane.
- **Z3**: wędzidło świadomie BRĄZOWE (nie żelazne) — żelazo idzie w broń/pancerz,
  nie w drobne okucia końskie; to jest zamierzony kontrast materiałowy, nie
  niedopatrzenie.
- **Z4**: kluczowa różnica funkcjonalna — lancer: długa lanca (grot żelazny) +
  okrągła tarcza na lewym przedramieniu (units.json: „elitarna konnica szturmowa
  z długą lancą i okrągłą tarczą"); łucznik: łuk kompozytowy w pełnym naciągu +
  kołczan, wodze luźno na przedramieniu (technika udokumentowana na reliefach
  Aszurbanipala — samodzielny jeździec-łucznik, bez drugiego woźnicy).
- **Z6**: koń +6% wysokości względem konia Brązu (uzasadnione poborem koni z
  Medii/Urartu w źródłach asyryjskich), maść jednolita bez pręgi grzbietowej
  (kontrast z „prymitywną" maścią Brązu).
- **Z7**: zbroja łuskowa ŻELAZNA (szaro-stalowa) zamiast brązowo-płowej —
  bezpośrednie odwzorowanie `Tech: Hutnictwo żelaza`/`Surowiec: Żelazo` z
  units.json, jednocześnie sygnał odróżniający od Brązu.
- **Z9**: rozróżnialność wobec siebie nawzajem, wobec dedykowanej Konnicy (Brąz)
  i wobec generycznego fallbacku — zmierzona automatycznie (D1-D3), nie tylko
  opisana.

## Pliki (ścieżki absolutne)

- `/home/user/wt-ZELAZO-T1/gra/src/render/zelazo-konnica-asyryjska-opus5.ts`
- `/home/user/wt-ZELAZO-T1/gra/src/render/units.ts` (diff)
- `/home/user/wt-ZELAZO-T1/gra/tools/zelazo-konnica-asyryjska-real-render-test.cjs`
- Zrzuty PRZED/PO wysłane do właściciela; kopie lokalne: `/tmp/zelazo-t1-shots/`

Nie napotkałem faktycznego konfliktu kontraktu w allowliście ani w GOAL — jedyne
odstępstwo to model wykonawcy opisany wyżej, zgłoszony jako notatka, nie jako BLOCK.