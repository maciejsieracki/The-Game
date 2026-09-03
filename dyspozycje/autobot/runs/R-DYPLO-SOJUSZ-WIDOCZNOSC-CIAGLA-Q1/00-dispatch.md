TEMAT: R-DYPLO-SOJUSZ-WIDOCZNOSC-CIAGLA-Q1
RUNDA: 1/5
DATA: 2026-09-03
DOMAIN: GAME
ŚCIEŻKA: recon wymagany — logika widoczności/fog per-turę gracza (prawdopodobnie
gra/src/game/visibility.ts, main.ts punkty wołające computePlayerVisibility/refreshFog) oraz
logika widoczności/decyzji AI (jeśli AI ma osobny model "co widzi")
MODEL+EFFORT: claude-sonnet-5, effort high (dotyka bieżącej logiki widoczności per-turę
GRACZA ORAZ AI — realne ryzyko wpływu na decyzje AI, wymaga starannej weryfikacji braku
regresji w zachowaniu AI)

WYZWALACZ (ECHO właściciela, 2026-09-03: "Tak, działaj" na propozycję poniżej)
Doprecyzowanie właściciela (2026-09-02, zarejestrowane wcześniej): "dla SOJUSZU (nie paktu/
handlu) widoczność ma być CIĄGŁA i DWUKIERUNKOWA przez cały czas trwania sojuszu (gracz widzi
bieżąco co widzi sojusznik AI i odwrotnie), nie tylko jednorazowy zrzut."

RECON (częściowo już wykonane przez orkiestratora — kontynuuj, nie zakładaj gotowego punktu
zaczepienia)
- Temat `R-DYPLO-MAPA-ODKRYCIE-PRZY-TRAKTACIE-Q1` (sprawdź jego status/kod — jeśli już
  zintegrowany, jest bazą: jednorazowy zrzut widoczności przy zawarciu DOWOLNEGO traktatu
  handlowego/paktu/sojuszu) — TEN temat dokłada NA TO ciągłe, dwukierunkowe dzielenie
  widoczności WYŁĄCZNIE dla aktywnego SOJUSZU (nie paktu, nie handlu).
- Znajdź dokładny mechanizm dzisiejszej widoczności per-turę gracza (`computePlayerVisibility`
  lub analogiczna funkcja w `visibility.ts`, wołania w `main.ts`) i ustal NAJMNIEJ inwazyjny
  sposób dołożenia "widzę też to, co widzi mój aktywny sojusznik AI" — np. unia zbioru
  widocznych heksów gracza ze zbiorem widocznych heksów każdego aktywnego sojusznika, liczona
  co turę, aktywna tylko gdy `RodzajTraktatu.Sojusz` (lub analogiczny) jest aktywny między
  gracz↔dany AI.
- Znajdź jak AI podejmuje decyzje na podstawie tego, co "widzi" (czy ma osobny, jawny model
  widoczności per-AI, czy korzysta z pełnej wiedzy o mapie i tylko UI ogranicza gracza) —
  KLUCZOWE dla GOAL 3: jeśli AI już dziś "widzi" całą mapę wewnętrznie (typowe dla wielu gier
  4X, gdzie fog jest tylko warstwą UI dla gracza), to rozszerzenie widoczności GRACZA o wgląd
  sojusznika NIE wpływa na decyzje AI wcale — potwierdź to reconem, nie zakładaj.

GOAL
1. Dla aktywnego SOJUSZU (i wyłącznie sojuszu — nie paktu, nie handlu, nie granic) gracz widzi
   NA BIEŻĄCO (co turę, nie jednorazowo) sumę własnej widoczności i widoczności sojusznika AI —
   analogicznie odwrotnie, jeśli w ogóle model gry rozróżnia "co widzi AI" (patrz recon).
2. Mechanizm aktywuje się w momencie zawarcia sojuszu, dezaktywuje natychmiast po jego zerwaniu
   (wojna, wygaśnięcie, zerwanie jednostronne) — bez opóźnienia o turę.
3. Jeśli recon potwierdzi, że AI ma wewnętrznie pełną wiedzę o mapie (fog to tylko warstwa UI
   gracza) — GOAL dotyczy WYŁĄCZNIE strony gracza (gracz widzi więcej), a "odwrotnie" z
   wyzwalacza jest już strukturalnie spełnione bez zmian kodu (AI "widziało" zawsze) —
   udokumentuj to jawnie w raporcie zamiast implementować martwy kod.
4. Zero zmian w widoczności dla pozostałych typów traktatów (pakt, umowa handlowa, otwarte
   granice) — te zostają przy jednorazowym zrzucie (jeśli już zintegrowany) lub bez zmian.
5. Zero wpływu na FAKTYCZNE decyzje AI (cele ataku, priorytety ekonomiczne) — jeśli GOAL 1
   wymaga zmiany także w tym, co AI "wie" (nie tylko gracz), zweryfikuj że to nie zmienia
   istniejących testów zachowania AI na tym samym seedzie.

KRYTERIA KOŃCA (binarne)
1. Test: żywa gra, zawarcie sojuszu z AI, symulacja kilku tur — heksy widoczne WYŁĄCZNIE dla
   sojusznika (poza zasięgiem własnych jednostek/miast gracza) STAJĄ SIĘ widoczne dla gracza,
   aktualizowane co turę (nie jednorazowo przy zawarciu).
2. Test: zerwanie sojuszu (dowolnym mechanizmem — wojna, wygaśnięcie) — dodatkowa widoczność
   znika natychmiast (nie utrzymuje się z poprzednich tur).
3. Test regresyjny: pakt/handel/granice — zachowanie niezmienione względem stanu przed tym
   tematem.
4. Test regresyjny: zachowanie/decyzje AI na tym samym seedzie (istniejące testy AI) —
   NIEZMIENIONE, chyba że recon z GOAL 3 wykaże że zmiana faktycznie dotyczy tylko UI gracza.
5. Zero regresji na istniejących testach widoczności/fog/dyplomacji (znajdź reconem, m.in.
   `ai-fog-test.cjs`, `river-fog-visibility-test.cjs`, testy sojuszu).
6. `tsc --noEmit` czysty, 5 bramek referencyjnych (logic-test, tech-tree-test, research-test,
   unit-replace-test, combat-test) zielone.

ALLOWLISTA (nic poza tym)
- gra/src/game/visibility.ts — funkcje widoczności per-turę.
- gra/src/main.ts — WYŁĄCZNIE punkty wołające/agregujące widoczność per-turę (nie logika
  decyzyjna AI poza tym, co GOAL 3 wymaga udokumentować, nie zaimplementować, jeśli okaże się
  niepotrzebne).
- Nowe lub rozszerzone testy w gra/tools/*-test.cjs.
Zakazane bezwzględnie: pliki z sekretami, docs/decyzje/<ID>.md, .git/**,
dyspozycje/WERSJE.md, gra-robocza/ROBOCZA-MANIFEST.json, playbook.json, zmiana widoczności dla
paktu/handlu/granic, zmiana logiki wyboru celów/priorytetów AI (`ai.ts`) poza tym, co ściśle
wymaga GOAL 1 (jeśli w ogóle).

IZOLACJA
worktree /home/user/wt-sojusz-widocznosc-ciagla, gałąź autobot/R-DYPLO-SOJUSZ-WIDOCZNOSC-
CIAGLA-Q1, baza jawnie: origin/main (najnowszy commit na moment dispatchu).
Zakaz npm run build/dev w gra/ (export-data nadpisuje JSON) — dozwolona komenda:
node ./node_modules/vite/bin/vite.js build --outDir /tmp/civ-dist-sojusz-widocznosc --emptyOutDir
Jedyna dozwolona kompilacja to node ./node_modules/typescript/bin/tsc --noEmit; bramki
referencyjne node tools/*-test.cjs nie są nim objęte.

REGUŁA PRZECIW SAMOOSZUKIWANIU (ANTY-HALUCYNACYJNA)
Zakaz uznania kryterium 1/2 za spełnione bez żywej, wieloturowej symulacji z realnym zawarciem
i zerwaniem sojuszu — nie czytania samej logiki. Zakaz założenia bez reconu, że AI ma/nie ma
wewnętrznego modelu widoczności — to musi być potwierdzone czytaniem kodu decyzyjnego AI, bo od
tego zależy, czy GOAL 3 wymaga jakiejkolwiek zmiany.

PROCEDURA NAPRAWCZA PRZY FAIL
Evaluator wskazuje jeden konkretny defekt i poprawkę; runda N+1 idzie na TYM SAMYM ID i TEJ
SAMEJ gałęzi, nie na nowej od zera. Po 5 rundach: LIMIT-5-EXCEEDED.

GRANICE
Operator/Evaluator/Obrona nie integrują, nie deployują, nie pushują. Final Control i
integracja (allowlist-only, per plik i per hunk) dzieją się poza worktree Operatora, ręką
orkiestratora.

OBIEG
Operator (Sonnet 5, effort high) → Evaluator (Sonnet 5, effort high) → Operator (obrona, jeśli
zarzuty niepuste) → Final Control (Sonnet 5) → integracja orkiestratora → READY_FOR_DEPLOY.
