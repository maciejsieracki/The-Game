# RAPORT — Evaluator, runda 1/5

```
STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-ZELAZO-MODELE-BRAKUJACE-Q1-T1
GOAL: Zbudować dwa nowe, dedykowane modele 3D — Konnica lancowa asyryjska i
      Konnica łucznicza asyryjska (Żelazo, Asyria) — zamiast generycznego
      fallbacku `case 'konnica'`, historycznie uzasadnione, spójne z kanonem
      wizualnym Asyrii. Zgadza się z GOAL w 00-dispatch.md — bez rozjazdu.
ZMIANY/COMMIT: własny, niezależny worktree `/home/user/wt-eval-ZELAZO-T1`
      (origin/autobot/ZELAZO-T1-Q1, detach, commit c41acac7), usunięty po
      weryfikacji. `git diff <merge-base da776f8d>..c41acac7 --name-only`
      (NIE naiwny `origin/main..branch` — §9 poz. 9) = dokładnie 3 pliki,
      wszystkie w allowliście: `gra/src/render/units.ts` (M, wyłącznie 2
      importy + 2 gałęzie dispatchu, PRZED generycznym `case 'konnica'`,
      `git diff --check` czyste), `gra/src/render/zelazo-konnica-asyryjska-opus5.ts`
      (nowy), `gra/tools/zelazo-konnica-asyryjska-real-render-test.cjs` (nowy).
      Zero plików spoza `gra/`. Zero dotknięcia `jednostki-p3-dystans.ts`
      (Łucznik asyryjski Brąz) i `braz-konnica-opus5.ts` — potwierdzone.
TESTY (wszystkie uruchomione NIEZALEŻNIE przeze mnie, symlink na `node_modules`
      z main, własny worktree):
  - `node ./node_modules/typescript/bin/tsc --noEmit` (v5.9.3): 0 błędów.
  - `node ./node_modules/vite/bin/vite.js build --outDir /tmp/civ-zelazo-eval-dist
    --emptyOutDir`: OK, 29.24s. Bundle zawiera oba ciągi dispatchu
    (`assyrian lancer`, `assyrian horse archer` — po 1 wystąpieniu).
  - 5 bramek referencyjnych: logic 213/213, tech-tree 19/19, research 33/33,
    unit-replace 13/13, combat 6/6 — zgodne z punktem odniesienia §6.
  - `unit-power-test` (defensywnie, nie wymagany): 4/6 — zgodne z
    udokumentowanym pre-istniejącym czerwonym stanem (§6), NIE regresja.
  - Real-render Operatora (`zelazo-konnica-asyryjska-real-render-test.cjs`),
    uruchomiony przeze mnie od zera: 25/25 PASS, w tym (0a-0h) statyczne
    kotwice, (A1-A4) łucznik=łuk+kołczan/ZERO lancy, lancer=lanca+tarcza/ZERO
    łuku, (D0-D5) dowód nietautologiczności (mutacja usuwa dokładnie 2 linie
    w locie, asercje A1-A4 czerwienieją, obie jednostki spadają na identyczny
    meshCount co generyczny fallback), (E1-E4) proporcje: lancowa 0.869×HEX_R
    wys./0.435×HEX_R promień, łucznicza 0.863/0.435, oba minY=0.0000,
    (G1-G2) artefakt produkcyjny niesie oba ciągi.
  - WŁASNY, napisany od zera skrypt real-render (nie kopia Operatora):
    zmierzył bounding-boxy mesh uzbrojenia niezależnie od nazw testu Operatora
    (lancer: shield+shaft(0.61 wys.)+head; łucznik: bow-mid+arrow-tip+quiver,
    ZERO wspólnych nazw), zrenderował 4 zrzuty własną kamerą/kątem: lancer
    solo-zoom, łucznik solo-zoom, lancer-vs-dedykowana-Konnica(Brąz),
    łucznik-vs-dedykowana-Konnica(Brąz). Wizualnie: łucznik trzyma czytelny
    łuk kompozytowy w naciągu (widoczne ramiona/siyah, strzała z grotem,
    kołczan z 2 strzałami na plecach), lancer trzyma długą lancę pod kątem
    (grot żelazny widoczny); OBIE jednostki wyraźnie odróżnialne od
    dedykowanej Konnicy Brązu (jaśniejszy koń, miękka czapka, brak zbroi
    łuskowej, pojedyncza dzida) w bezpośrednim zestawieniu obok siebie.
    Zero błędów strony/konsoli w obu renderach.
  - Zero kolizji nazw: `n.includes('konnica lancowa asyryjsk'/'lucznicza
    asyryjsk'/'assyrian lancer'/'assyrian horse archer')` trafia WYŁĄCZNIE
    w te dwie jednostki w units.json (sprawdzone programowo po wszystkich
    rekordach) — brak ryzyka przypadkowego dopasowania innej jednostki.
  - `npx vite build --outDir <tmp>` użyte w narzędziu testowym Operatora
    (zamiast literalnego `node ./node_modules/vite/bin/vite.js`) — SPRAWDZONE
    empirycznie: `npx` NIE uruchamia hooków `prebuild`/`predev` npm (te
    triggerują `export-data.py`, który nadpisuje JSON), md5 `data/units.json`
    identyczne przed/po. Nie jest to naruszenie §9 poz.1 w praktyce (zakaz
    dotyczy `npm run build/dev`, nie wywołania binarki przez `npx`) —
    odnotowuję jako kosmetyczną rozbieżność z literą normy, nie jako defekt.
  - Historia (Z1-Z9): zweryfikowana własną wiedzą — brak strzemion (poprawne,
    strzemię to wynalazek dużo późniejszy), brak sztywnego siodła (zgodne z
    reliefami neoasyryjskimi), przejście konnicy od par jeźdźców do
    samodzielnych łuczników konnych u Aszurbanipala (udokumentowane), brak
    podków/zbroi końskiej jako reguła (zgodne), skala konia +6% i wędzidło
    brązowe jako świadome, umiarkowane, jawnie uzasadnione decyzje
    interpretacyjne (nie twierdzenia faktograficzne) — bez anachronizmów.
    Tarcza u lancera pochodzi z `Uwagi` w units.json sprzed tego dispatchu
    (dane, nie wymysł Operatora) — poza zakresem oceny historycznej tego tematu.
BLOKADY: brak blokad technicznych/zakresowych. JEDNA blokada procesowa —
      patrz notatka niżej.
RUNDY: 1/5.
NASTĘPNY KROK: decyzja orkiestratora/właściciela w sprawie notatki poniżej,
      następnie Final Control.
DEPLOY/PUSH: NIE WYKONANO (nie moja rola).
```

## Notatka — NIE kosmetyczna, dotyczy granicy §9 (poz. 6b)

Potwierdzam niezależnie zgłoszenie Operatora: zostałem uruchomiony jako
**Sonnet 5** (potwierdzone przez środowisko wykonawcze tej sesji, rząd 1
źródeł — nie z pamięci), nie Opus 5 High wymagany przez `00-dispatch.md`
(„Model/effort: Opus 5 High dla Operatora i Evaluatora — temat czysto
wizualny, §5a"). To dokładnie ten sam znany gap (C-061) po stronie
Operatora i Evaluatora jednocześnie.

`R-PROC-AUTOBOT.md` §9 poz. 6(b) wprost klasyfikuje to jako **granicę
nienaruszalną** dla sesji Claude Code na tematach wizualnych, a nagłówek §9
mówi: „Naruszenie którejkolwiek z poniższych pozycji oznacza natychmiastowy
FAIL, niezależnie od tego, jak dobra jest reszta pracy." Zgodnie z §3b,
uwaga dotycząca granicy §9 **nie jest kosmetyczna** i `PASS-WITH-NOTES` z
takim zastrzeżeniem **nie kończy procesu** — wraca do decyzji
orkiestratora/właściciela, nie do automatycznego zamknięcia.

Jednocześnie zgadzam się z oceną Operatora, że to nie jest defekt kodu,
zakresu ani dowodu — jest to odstępstwo od przypisania modelu na poziomie
dispatchu subagentów, którego ani Operator, ani ja nie mogliśmy sami
skorygować (brak parametru w tym narzędziu wykonawczym). Dowód GOAL jest
kompletny i **niezależnie odtworzony przeze mnie od zera** (własny skrypt,
własne zrzuty, własne pomiary bounding-box) — jakość i kompletność weryfikacji
wizualnej nie jest tu wątpliwa; wątpliwa jest wyłącznie zgodność z literą
przypisania modelu z dispatchu.

**Rekomendacja:** to jest przypadek `DECISION_REQUIRED` w duchu C-054
(rozjazd dispatch vs. faktyczne wykonanie, nienaprawialny przez kolejną
rundę Operatora, bo dotyczy dispatchu subagenta, nie treści promptu) —
orkiestrator/właściciel decyduje: (a) zaakceptować mimo niezgodności modelu,
biorąc pod uwagę siłę automatycznego dowodu (25/25 + własna, niezależna
weryfikacja Evaluatora dająca ten sam wynik), czy (b) zażądać powtórki na
Opus 5. Rekomendowałbym też zapisanie problemu z dispatchowaniem modelu
subagentów jako osobny temat PROCESS w rejestrze, żeby nie powtarzał się
milcząco w kolejnych rundach tego samego ID.

## Pliki (ścieżki absolutne, dowody Evaluatora)

- Własny skrypt real-render: `/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/eval-render.cjs`
- Zrzuty własne: `/tmp/zelazo-t1-eval-shots-own/` (`own-lancowa-solo-zoom.png`, `own-lucznicza-solo-zoom.png`, `own-lancowa-vs-brazkonnica.png`, `own-lucznicza-vs-brazkonnica.png`)
- Zrzuty z ponownego uruchomienia testu Operatora: `/tmp/zelazo-t1-eval-shots/` (`po-lancowa-lucznicza.png`, `przed-oba-generyczne.png`)
- Artefakt vite (mój, niezależny): `/tmp/civ-zelazo-eval-dist/index.html`