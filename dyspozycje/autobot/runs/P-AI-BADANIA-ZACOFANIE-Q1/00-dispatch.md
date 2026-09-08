STATUS: DISPATCH
DOMAIN: GAME
TEMAT: P-AI-BADANIA-ZACOFANIE-Q1
GOAL: Napraw gigantyczne zacofanie technologiczne cywilizacji AI względem gracza
(zgłoszenie właściciela: gracz jest w epoce brązu i za chwilę wejdzie do żelaza, a AI
ledwo ma kilka pierwszych technologii, nawet bez Oswojenia zwierząt). Ustal budżet Nauki
AI na STAŁE 60% (istniejący sufit `MAX_PROCENT_NAUKA`), BEZ dynamicznego sterowania przez
AI (bez zmniejszania w wojnie/kryzysie finansowym, bez zamrożenia w early game) — analogicznie
do już istniejącego wzorca `AI_FIXED_PROCENT_BUDYNKI=50` (R-AI-PRACA-PODZIAL-STALY-50-50-Q1).

KONTEKST — PRZECZYTAJ W CAŁOŚCI PRZED PIERWSZĄ ZMIANĄ KODU:
- Zgłoszenie właściciela (dosłowne): "Jest jakiś gigantyczny problem z badaniami u innych
  cywilizacji. Ja już jestem w epoce brązu i za chwilę wejdę do żelaza, a oni ledwo mają
  kilka technologii, nawet nie mają oswojenia zwierząt, a łowiectwo to pierwsze cztery
  technologie... Powinno być ustalenie maksymalnie 60% od razu, żeby nie generowali
  nadmiernych ilości złota, a jednocześnie nie rezygnowali z badań. Nie powinno być
  sterowania tym aspektem przez AI; po prostu maksymalizuję badania i rozwój."
- Orkiestrator ZWERYFIKOWAŁ ŚWIEŻO (przed tym dispatchem, świeży `Read`/`grep`) mechanizm
  odpowiedzialny — POTWIERDŹ PONOWNIE każdą liczbę przed zmianą kodu (kod mógł się przesunąć):
  1. `gra/src/game/cities.ts:398-399` `DEFAULT_PODZIAL_HANDLU.procentNauka = 20` — WSZYSTKIE
     miasta (gracz i AI) startują z 20% budżetu Handlu na Naukę (reszta → Pieniądz).
  2. `gra/src/game/cities.ts:543` `MAX_PROCENT_NAUKA = 60` — istniejący, już wdrożony sufit
     (R-NAUKA-LIMIT-60-PROC-BUDZETU-Q1) — DOKŁADNIE liczba, o którą prosi właściciel. Sufit
     JUŻ ISTNIEJE, problem NIE jest brakiem sufitu, tylko tym że AI rzadko go osiąga.
  3. `gra/src/game/ai.ts` `decideAIEconomySliders()` (ok. linia 5430-5522): heurystyka AI
     dostosowująca `procentNauka` w stronę 60% krokami `krokProcentPracaNauka` (domyślnie 10,
     `econ-params.json` `ai_suwaki_krok_praca_nauka`) NIE CZĘŚCIEJ niż raz na `minOdstepTur`
     (domyślnie 3) tur — ALE:
     a. Blok `isMajorAi && isEarlyGame` (ok. linia 5461-5469, 5475-5482, 5498) w ogóle NIE
        rusza `procentNauka` — early game koncentruje się WYŁĄCZNIE na `procentRozwoj`
        (wzrost miast). `isEarlyGame` = `computeMajorAiEarlyGame()` (`ai.ts:1189-1210+`),
        próg `AI_MAJOR_EARLY_MAX_TURN=40` (`ai.ts:1146`) tur na normal/hard, `_L1=25` na easy
        (lub hard z bonusowym miastem startowym). Skutek: AI siedzi na **20%** budżetu Nauki
        przez PIERWSZE 25-40 TUR gry, zero ruchu w stronę 60%.
     b. Po early game: `procentNauka += krok` TYLKO w pokoju i bez `moneyCrisis`
        (`treasuryGold < upkeepGoldCost`) — ok. linia 5495-5511. `atWar` ODEJMUJE krok
        zamiast dodawać. Przy typowej agresywności AI (`agresjaMnoznik` itd., patrz temat
        różnic trudności z tego samego dnia) cywilizacje są w wojnie znaczną część gry —
        każda wojna cofa postęp Nauki o krok, wydłużając czas do osiągnięcia 60%.
     c. Nawet w najlepszym razie (pokój ciągły od tury 40): (60-20)/10 = 4 korekty ×
        `minOdstepTur=3` = min. 12 tur PO zakończenia early game, czyli dopiero od ok. tury
        37-52 AI osiąga 60%. W praktyce (wojny, kryzysy finansowe) znacznie później albo
        nigdy w typowej partii.
  4. Gracz NIE ma tego ograniczenia — ustawia swój suwak Handlu ręcznie w UI w dowolnym
     momencie (bez early-game freeze, bez war/money-crisis auto-decrementu). To jest DOKŁADNIE
     rodzaj asymetrii, o której mówi bariera parytetu gracz↔AI (`R-PROC-AUTOBOT.md` §9 poz.
     11) — chyba że świadomie udokumentowana inaczej (nie znaleziono takiej decyzji dla tego
     konkretnego mechanizmu, w przeciwieństwie do `AI_FIXED_PROCENT_BUDYNKI`, który MA swoją
     jawną decyzję R-AI-PRACA-PODZIAL-STALY-50-50-Q1).
  5. Precedens do naśladowania w TYM SAMYM pliku: `procentBudynki` (linia 5453-5456) jest
     JUŻ dokładnie tak naprawiony — `AI_FIXED_PROCENT_BUDYNKI` narzucane bezwarunkowo,
     niezależnie od wojny/pokoju/early game, z udokumentowanym uzasadnieniem w komentarzu
     (ok. linia 5441-5452): dawna dynamika "podbijała budżet budynków do 100% w wojnie",
     co zerowało pulę ulepszeń terenu — świadomie usunięte. Właściciel prosi o analogiczne
     rozwiązanie dla Nauki: zero dynamiki, stała wartość.

ZADANIE:
1. Odtwórz problem z dowodem PRZED naprawą — headless symulacja wielu tur (wzorem istniejących
   `gra/tools/ai-slider-test.cjs`, jeśli istnieje, albo nowy harness w stylu
   `diag-znikoma.cjs` z tematu `P-AI-ULEPSZENIA-BUDOWA-ZNIKOMA-Q1`, świeżo zintegrowanego —
   przeczytaj go jako wzorzec): dla kilku ziaren, ~100-150 tur, zmierz trajektorię
   `procentNauka` per cywilizacja AI w czasie ORAZ liczbę odkrytych technologii AI vs gracz
   (jeśli symulacja nie steruje graczem, porównaj z rozsądnym tempem referencyjnym z
   `research-test.cjs`/`tech-tree-test.cjs`).
2. Zaimplementuj FIXED wartość Nauki dla AI, analogicznie do `AI_FIXED_PROCENT_BUDYNKI`:
   nowa stała (np. `AI_FIXED_PROCENT_NAUKA = MAX_PROCENT_NAUKA` w `cities.ts`, obok istniejącej
   `AI_FIXED_PROCENT_BUDYNKI`), narzucana bezwarunkowo w `decideAIEconomySliders()` (usuń/
   zastąp blok early-game-freeze i blok war/money-crisis decrement dla `procentNauka` —
   analogicznie do bloku `procentBudynki` linia 5453-5456), z komentarzem wyjaśniającym
   decyzję i cytujący to zgłoszenie.
3. **Wyjątek do rozważenia i przetestowania**: blok `moneyCrisis` (skarbiec < utrzymanie)
   istnieje dziś WYŁĄCZNIE po to, żeby AI nie zbankrutowało. Jeśli sztywne 60% Nauki
   (40% Pieniądz) w połączeniu z istniejącym sufitem budżetu budynków (50%, `R-PRACA-MIASTO-
   SPLIT-BUDZET-AUTOMAT-Q1`) prowadzi w symulacji do realnego bankructwa/masowej likwidacji
   budynków AI z braku Pieniądza — **NIE zgaduj**, zmierz to w tej samej symulacji punktu 1
   (skarbiec AI w czasie, PRZED i PO). Jeśli faktycznie się to zdarza w widocznej skali:
   zatrzymaj się z tą jedną obserwacją jako DECISION_REQUIRED (opisz dokładnie warunki i
   skalę), ale NIE blokuj całej reszty fixu — 60% Nauki fixed jest jawnym życzeniem
   właściciela, ewentualny osobny mechanizm ratunkowy dla bankructwa to decyzja poboczna.
4. Żywy dowód PRZED/PO: ta sama symulacja z punktu 1, PRZED (dzisiejszy kod) i PO (fix) —
   liczba technologii AI po tej samej liczbie tur powinna wyraźnie wzrosnąć.
5. Zaktualizuj/rozszerz test istniejący dla suwaków AI (`ai-slider-test.cjs` jeśli istnieje)
   o asercję: `procentNauka` dla AI jest ZAWSZE `MAX_PROCENT_NAUKA`, niezależnie od
   wojny/pokoju/early game/kryzysu finansowego (poza ewentualnym udokumentowanym wyjątkiem
   z punktu 3).

BINARNE KRYTERIUM SUKCESU: AI (cywilizacje główne) ma budżet Nauki na STAŁE 60%, potwierdzone
testem i symulacją PRZED/PO pokazującą wyraźnie szybszy postęp technologiczny AI. `tsc --noEmit`
czysty, 5 bramek referencyjnych zielone, nowa/rozszerzona bramka suwaków zielona.

ALLOWLISTA:
- `gra/src/game/ai.ts` (WYŁĄCZNIE `decideAIEconomySliders` i bezpośrednio powiązane stałe/typy)
- `gra/src/game/cities.ts` (WYŁĄCZNIE nowa stała `AI_FIXED_PROCENT_NAUKA` obok istniejącej
  `AI_FIXED_PROCENT_BUDYNKI` — bez zmiany `MAX_PROCENT_NAUKA`/`DEFAULT_PODZIAL_HANDLU`)
- `gra/tools/ai-slider-test.cjs` (jeśli istnieje) lub nowy plik testu/diagnostyczny w
  `dyspozycje/autobot/runs/P-AI-BADANIA-ZACOFANIE-Q1/`
- `dyspozycje/autobot/runs/P-AI-BADANIA-ZACOFANIE-Q1/*`
Zakaz `git add -A`. Zakaz zmiany `MAX_PROCENT_NAUKA` (60 zostaje 60, to jest dokładnie liczba
właściciela) i `AI_FIXED_PROCENT_BUDYNKI` (50 zostaje 50, temat niepowiązany).

REGUŁA PRZECIW SAMOOSZUKIWANIU: zakaz deklaracji "AI ma teraz 60% Nauki" bez dowodu z żywej
symulacji pokazującej trajektorię w czasie (nie tylko wywołanie funkcji raz z sztucznym
wejściem). Zakaz cichego rozszerzenia zmiany na `procentBudynki`/`procentRozwoj` — dotyczy
WYŁĄCZNIE `procentNauka`. Zakaz przemilczenia realnego ryzyka bankructwa jeśli symulacja je
pokaże (patrz zadanie pkt 3) — zgłoś jako obserwację nawet jeśli nie blokujesz nią fixu.

IZOLACJA: worktree `/home/user/wt-ai-badania-zacofanie`, gałąź
`autobot/P-AI-BADANIA-ZACOFANIE-Q1`, baza `origin/main` @ `c814ab1f`.
C-001: zakaz `npm run build`/`dev` w `gra/`; jedyna dozwolona kompilacja to
`node ./node_modules/typescript/bin/tsc --noEmit`; jedyna dozwolona komenda buildu do
bramki Chromium (jeśli w ogóle potrzebna — temat jest logiką, nie UI): `node
./node_modules/vite/bin/vite.js build --outDir <poza repo> --emptyOutDir`.

PROCEDURA NAPRAWCZA PRZY FAIL: Evaluator wskazuje jeden konkretny defekt; runda N+1 na
TYM SAMYM ID i TEJ SAMEJ gałęzi. Po 5 rundach: LIMIT-5-EXCEEDED.

NASTĘPNY KROK: Operator → Evaluator → (Obrona jeśli zarzuty) → Final Control (Ścieżka A,
Workflow) — zmiana logiki gry (nie tylko UI), wymaga Final Control.
DEPLOY/PUSH: NIE WYKONANO
