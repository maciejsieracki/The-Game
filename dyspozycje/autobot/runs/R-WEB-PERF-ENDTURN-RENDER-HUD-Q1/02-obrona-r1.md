STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB), wydajność: render/HUD w końcu tury
TEMAT: R-WEB-PERF-ENDTURN-RENDER-HUD-Q1
GOAL: bez zmiany (jak w dispatchu): −40% łącznego czasu syncUnitsRender + renderLoop + syncStatChips w końcu tury (137 miast / 321 jednostek), obraz 0 px, bez zmiany logiki gry.
ZMIANY/COMMIT: obrona bez zmiany kodu gry. Odtworzony stan Operatora: `70d499059ba3a84355b677e57dcad6f29179f4e8` (baza `6a673c838b306dbad47dd33d58f5f5a72882a71c`, merge-base zgodny z origin/main). Commit obrony: patrz SHA w raporcie orkiestratora (dodany: `gra/tools/perf-endturn-render-deferral-regression-test.cjs`, ten plik).
TESTY:
- `node gra/tools/perf-endturn-render-deferral-regression-test.cjs`: EXIT=0 (nowy test, zarzut 5). Test sprawdza: deklarację haka raz; instalację haka wyłącznie w bloku fazy AI (`aiUnitRenderBatch.markDirty`); odroczenie w `refreshFog` tylko przy `fogOn`; zerowanie haka raz, po `catch (eAILoop)` i po `flushAiCityRenderBatch()`. Na bazie `6a673c838` hak nie istnieje (0 trafień), więc test rozróżnia wersje.
- Bramki z Operatora (nie powtarzane, bo obrona nie zmienia `src`): tsc EXIT=0, logic 213/213, capture-render-sync 23/0, unit-renderer-overlay-sync 17/0, city-badge-zoom-lod 67/0, memory-static-geometry-pool 18/0, memory-static-material-pool-pixel 7/0. Brak `node_modules` w worktree obrony, więc testy zależne od esbuild nie były uruchamiane ponownie.
- NIE_ZMIERZONO w obronie: nowy pomiar A/B i pixel (wymaga dwóch buildów Vite i serii na Chromium; w r1 nie wykonany).

ODPOWIEDZI NA ZARZUTY:

1. Kryterium −40% spełnione tylko w 1. końcu tury (unia), nie w 2. końcu ani w sumie obu końców. PRZYJMUJĘ.
   Dowód: `evidence/ab-aggregate.txt`. EOT 1 unia −42,3% (zaliczone), suma −51,6%. EOT 2 unia −13,2%, suma −18,8%. Oba końce (n=10) unia −17,7%, suma −22,4%. Wall-clock końca tury mediana 14,9 s (baza) vs 15,2 s (cand3), bez poprawy.
   Założenie metryki (dla jasności): liczę unię, a nie sumę trzech, bo `syncStatChips` jest zagnieżdżone w `syncUnitsRender` i suma liczy je dwa razy. Przy unii 1. koniec tury przechodzi, a cel „końca tury” jako całości nie.
   Poprawka w r1: brak. Nowa redukcja w 2. końcu tury wymaga pomiaru, czego nie zrobiono. Decyzja o zawężeniu GOAL (do 1. końca tury dużej gry) albo o r2 należy do orkiestratora. Obrona nie zamyka tego kryterium sama.

2. renderLoop nie zredukowany (+2% do +5%, szum). PRZYJMUJĘ.
   Dowód: `ab-aggregate.txt`, renderLoop EOT 1 −5,4%, EOT 2 +3,7%, EOT all +2,1%. Nie ma w `evidence/` profilu renderLoop. Twierdzenie „głównie WebGLRenderer.render (SwiftShader)” z raportu Operatora nie ma dowodu w runie, więc traktuję je jako niezweryfikowane.
   Poprawka w r1: brak. Dispatch dopuszcza `scene.ts` tylko po profilu, a profilu renderLoop nie ma. Do r2: zapisany profil renderLoop (CDP) i ewentualna zmiana w `scene.ts` (np. statyczne podgrupy) w ramach allowlisty.

3. Parytet 0 px nie zmierzony; widać 92 px w pasku HUD. PRZYJMUJĘ, że 0 px nie jest wykazane. ODRZUCAM, że kandydat wprowadza tę różnicę.
   Dowód: `pixel-parity-cand.txt`: after-EOT vs forced sync = 92 px, max delta 1, bbox [1584,841,1586,878]. `pixel-parity-base.txt`: ta sama para na bazie = 137 px, bbox [1584,838,1587,881], a dwie wymuszone synchronizacje bazy różnią się o 83 px (bbox [1584,842,1586,877]). Różnica leży w tym samym pasku HUD i występuje też na bazie, więc wynika z animacji HUD, nie z odroczenia żetonów. Digest sceny: 0 niezgodnych z 38033 obiektów.
   Brak porównania pikselowego baza vs kandydat (NIE_ZMIERZONO). Do r2: ustalić animację HUD (wyłączenie lub zamrożenie klatki) na obu buildach i porównać bez szumu.

4. Metodologia A/B słabsza niż w dispatchu; SUM3 oznaczony „cand” mimo wartości z cand3. PRZYJMUJĘ.
   Fakty: finalny kandydat v3 zmierzony osobną serią po bazie (nie naprzemiennie), więc dryf maszyny jest możliwy. Etykieta: w wierszu SUM3 „EOT 1” kolumna `cand` zawiera wartości cand3 (mediana 802 ≈ 170 + 529 + 102 = 801). Poprawna etykieta to cand3. Wiersze pozostałe już używają cand3.
   Poprawka w r1: tylko korekta etykiety w tym pliku (poniżej). Pełna seria naprzemienna ≥5 par dla finalnego kodu nie została wykonana (NIE_ZMIERZONO).
   Korekta etykiet: w `evidence/ab-aggregate.txt` linia `SUM3 base … cand {…}` w bloku „EOT 1” oznacza cand3. Dane nie są zmieniane.

5. Odroczenie w fazie AI bez testu regresji na haku `deferRefreshFogUnitSync`. PRZYJMUJĘ i poprawiam.
   Poprawka: `gra/tools/perf-endturn-render-deferral-regression-test.cjs` (test statyczny, EXIT=0). Ścieżki sprawdzone w kodzie: `flushAiCityRenderBatch()` przed `launchIncomingMapFieldBattle` (linie ~40467) przy `aiTurnAwaitingBattle = true`, i zerowanie haka po `flushAiCityRenderBatch()` za `catch (eAILoop)` (linie ~40870-40871). Wewnątrz bloku `try` fazy AI nie ma bezpośredniego `return` (trafienia są w zagnieżdżonych funkcjach pomocniczych). Hak nie przetrwa więc zawieszenia fazy na bitwie. Parytet hotseat z `fogOn` nie został zmierzony na żywo (NIE_ZMIERZONO), co zostaje jako ryzyko do r2.

6. Zmiana kolejności efektów w `refreshFog` przy `fogOn` w fazie AI (`applyFogVisibility` przed `syncStatChips`). ODRZUCAM jako regresję stanu końcowego.
   Argument: flush haka odbywa się po `applyFogVisibility` (linie ~12600 i ~40870), więc chipy liczą się z widoczności po fogu. Stan końcowy jest więc poprawny, a poprzednia kolejność była w stanie pośrednim. Digest sceny po końcu tury: 0 niezgodnych. Różnica dotyczy stanów pośrednich w fazie AI, które są zasłonięte ekranem przejścia (wg raportu Operatora; nie sprawdzone przeze mnie). Ta kolejność jest teraz udokumentowana tutaj.

NASTĘPNY KROK: orkiestrator decyduje, czy zawęzić GOAL do 1. końca tury (ECHO), czy otworzyć r2 z: profilem i redukcją renderLoop (`scene.ts`), redukcją w 2. końcu tury, pikselowym porównaniem baza vs kandydat po ustaleniu animacji HUD oraz naprzemiennym A/B ≥5 par dla finalnego kodu. Evaluator powinien sprawdzić parytet hotseat z `fogOn`.
RUNDY: 1/5 (Operator), obrona r1.
DEPLOY/PUSH: NIE WYKONANO
