STATUS: PASS
DOMAIN: INFRA
TEMAT: R-HOTSEAT-ETAP4-NOOP-HARNESS-Q1
GOAL: Zbudować samodzielną bramkę-narzędzie dowodu no-op dla przyszłego rozcięcia
`triggerPlayerEndTurn()` (Etap 4 planu hot-seat) i dowieść jej samej (30/30 identycznych
hashy SHA-256 miedzy dwoma niezależnymi uruchomieniami na DZISIEJSZYM, nierozciętym
kodzie) — bez żadnej zmiany `gra/src/**`.

ZMIANY/COMMIT:
- NOWY plik: `gra/tools/hotseat-etap4-noop-test.cjs` (jedyna zmiana produkcyjna/testowa,
  zgodna z allowlistą). Zero zmian w `gra/src/main.ts` ani innym pliku produkcyjnym
  (potwierdzone `git status --porcelain` w worktree: jedno trafienie, `??` nowy plik).

MECHANIZM BRAMKI (patrz docstring pliku dla pełnego uzasadnienia):
1. Realny `vite build` (jedyna dozwolona komenda buildu, C-001) do `os.tmpdir()`.
2. Realny headless Chromium (Playwright) + realny `doStartGame(params)` przez istniejący
   hak `__cityStateStartUnitsTestDebug.startNewGame('normal', 2)` (main.ts ~22239, seed
   778899 stały w kodzie hooka) + realne `foundPlayerStartCity()`
   (`tryFoundPlayerCityAt`) — DOKŁADNIE ten sam bootstrap co dowiedziony w
   `city-state-start-units-live-test.cjs`.
3. ZNALEZISKO tej rundy (odnotowane w docstringu): pierwotna próba użycia sandboksa
   `?playtest=mapa` (sugerowany przez wstępny szkic specyfikacji jako "2-cywilizacyjny
   sandbox") ZAWIODŁA na żywo — sandbox kończy się `[Victory] ZWYCIĘSTWO — dominacja
   (tura 2)`, po czym `canPlayerInitiateEndTurn=false` blokuje KAŻDY kolejny `endTurn()`.
   Zdiagnozowane debug-runem (2 tury, verbose), zanim zostało zgłoszone jako gotowe —
   naprawione użyciem realnego `doStartGame` zamiast sandboksa bitewnego.
4. Pętla 30× `window.__eraTestDebug.endTurn()` (main.ts ~21498, ten sam hak co inne testy
   Playwright) — bez żadnych innych rozkazów gracza.
5. Hash stanu po KAŻDEJ turze: main.ts nie eksportuje `buildSaveGameSnapshot()` do
   window (domknięcie main.ts, zakaz zmiany main.ts) — zamiast reimplementacji, po
   każdym `endTurn()` naciskany jest prawdziwy Ctrl+S (`doQuickSave(true)` →
   `persistSaveToSlot` → `saveToLocal('autosave', buildSaveGameSnapshot(...))`), a surowy
   JSON czytany wprost z IndexedDB (`thegame-saves`/`kv`/`thegame.save.autosave` —
   natywne API przeglądarki, bez importu modułu). Jedyne normalizowane pole:
   `meta.savedAt` (jedyny zegar ścienny w całym `buildSaveGameSnapshot`, main.ts:27805,
   potwierdzone świeżym grepem `Date.now()|new Date()` — dwa pozostałe trafienia to
   `endTurnStartedAt`, nieserializowany licznik). Reszta: `JSON.stringify` z kluczami
   posortowanymi REKURENCYJNIE + SHA-256.
6. Determinizm: `page.addInitScript` podmienia `Math.random` na mulberry32(424242) PRZED
   jakimkolwiek skryptem strony — eliminuje 11 wystąpień `Math.random()` w main.ts
   (generatory id jednostek + `pickVillageReward`). Podmiana wyłącznie w pliku testowym.
7. Dwa niezależne uruchomienia A i B: świeży `browser.newPage()`, świeży (pusty) IndexedDB
   za każdym razem, ten sam seed PRNG, ta sama sekwencja komend.

TESTY (BINARNE KRYTERIUM SUKCESU — 30/30 identycznych hashy A vs B):
Uruchomienie A — 30 hashy SHA-256 (jeden na turę, tury 1..30):
  tura  1: 5a812a3ce327964fe4c465519a135c12bc50941d99000e2a35bc3d0d0db9ef25
  tura  2: 82da654cde086d2263b717149cbf2be4c5a3c7fa227c39e56d9b2ca09facd6ff
  tura  3: 2d4b8b37941dbaa0d4c10d8c24511a606df5ecc7b256ccbf54e3d26a985fc360
  tura  4: a7318a7a57c6bfe80d6ff4e7d716421ce263599d74002baf483f7d7779f3f2ce
  tura  5: 807c882e40dd176982438a0a112dc7f6a81913ea5c1636096ae8aaaa7ceb316f
  tura  6: 2abe05d7cb8e13bfa0f2deef055072e63e149ed2a23ad6ac74107ac8564c2f1c
  tura  7: 81b168fe54f3443ca28957a522c2bea4d543ed4cd6b14eb926114c9222c4753d
  tura  8: 29a3a61bc6e50894e6a160e8792a151004f6bb1be69de534243a7b533fd60a97
  tura  9: 656edb82a164ed46613f0afd8ba93d7576c571a67f5cc054ae88d34edd7e96e1
  tura 10: ce9673bd22caec68fba5e8bf2e480409deac7c1f8312ab1827b271ded64b3959
  tura 11: a17ab1685741285664294e6565f9b6a85ca341c24a978ec6ef2d104c3776d25e
  tura 12: 4ed06ca55397531c4385972215aa019dab7472661070f4f42e5d389aa7ae49ea
  tura 13: bb77cd110662ef2db5870ccac19d8ed363d7859ed0420e622aaf77632f65ad68
  tura 14: 15c03b1d3a653732e0c252fb770543fa1f2f49e5007e2b6a4c088e52014767ea
  tura 15: eda5d87add4cfe61500c83e901fedf68936e3d13dc5c651ae7a4a93d68e99002
  tura 16: 99033e16e37c06f95f2afd9bdbee6c9b497a362825e8bbac425a9ea3b4900218
  tura 17: 7b9d40a30446620fa4e24ceb00a1ece5f084b0a774959e5f17750b5476f101d9
  tura 18: eb3412872d85430405b3e33e032ddde434be4230c345e2f3123c77615d6ef227
  tura 19: f0f14346ae65138d02a035f9dcfd700b10b1a920bc9564bd3f9693d30bb808a7
  tura 20: b8e014993070911c7b7ba5207fe9f32e1a5f90e41a2318028889e776a9e24c7b
  tura 21: 52485750987ea7b8300a6edef6dfe5d3032c41b9f3c39f7fe51ff8e2eab65361
  tura 22: f9561904ec24948280354fa4a74f5bb596e3b95f52d4a8865907a228ddcfbd5e
  tura 23: 5836dcf05657e6b0158b2de8bbdb8f3db25927e61f32e51aa3aea26090c6e88f
  tura 24: 27ad1c1bf8f75da4bddb17e58a47f6b152366adc088bf71054bc1e7ac7c6f87a
  tura 25: 88490f0953d0d7f9678357f39e9b84c821db3470b7e1f5f1229f474a23b06c4c
  tura 26: d662f3173447cb3688c2c34e400df4ebb49321f9b59f38da388b89d3e7d7aebb
  tura 27: 80641516c88f7aba0e945973befd3c08cd549434400d9b059ec4f1f9639b2455
  tura 28: f7fb9453f77358145c76e9dde8bf61e0806005e6c5a7f26d4b16f7f03b341371
  tura 29: c24238de22b7be1f0f9a9b8a96eac4f789805ac81b36662c9d1cef58bf034cad
  tura 30: f9580821f34db5f8df2c5c4e695405ab6e86c187d58266999e8c0a0ec5b0e95e

Uruchomienie B — 30 hashy SHA-256: BYTE-FOR-BYTE IDENTYCZNE z uruchomieniem A (dowód
`diff` obu list zapisanych osobno z surowego stdout, exit code diff = 0, nie samo
zapewnienie "są takie same" — zgodnie z regułą przeciw samooszukiwaniu dispatchu).
Komenda dowodowa: `diff runA_hashes.txt runB_hashes.txt` → brak wyjścia, `$? == 0`.

Wynik: 30/30 identycznych hashy A vs B → BINARNE KRYTERIUM SUKCESU SPEŁNIONE.

WYKONANIE BRAMKI 2× NIEZALEŻNIE (poza samym A/B wewnątrz jednego procesu, dla wykrycia
wszelkiego przypadkowego stanu międzyprocesowego): cała bramka (`node
tools/hotseat-etap4-noop-test.cjs`, build + A + B) uruchomiona DWUKROTNIE jako osobne
procesy. Przebieg 1 (pierwsza wersja pliku, przed poprawką kryterium PASS opisaną niżej)
dał identyczny wynik 30/30 (te same 30 hashy co wyżej, potwierdzone `diff`). Przebieg 2
(po poprawce) dał ten sam wynik 30/30 ORAZ poprawny exit code procesu:
`hotseat-etap4-noop-test: PASS (30/30 identycznych, jsExcA=0, jsExcB=0, consErrA=7,
consErrB=7)` / `EXIT_CODE=0`.

ZNALEZISKO W TRAKCIE PISANIA HARNESSU (samokorekta PRZED zgłoszeniem, nie przez
Evaluatora): pierwsza wersja pliku traktowała KAŻDY `console.error()` jako powód FAIL
(razem z prawdziwymi wyjątkami JS). W obu przebiegach main.ts loguje deterministycznie 7×
świadomy, udokumentowany w kodzie log `[Wojna wymuszona] DECISION_REQUIRED: brak
niezablokowanej sojuszem pary/trójkąta dla ownerów [0] -- ...` (main.ts:30703, komentarz
autora tej linii: "ECHO, brzegowy przypadek... NIE zgadujemy") — to NIE jest crash, tylko
świadome console.error() z mechaniki wojny wymuszonej. Poprawka: bramka rozróżnia
`pageerror` (nieprzechwycony wyjątek JS — realny sygnał zepsucia, gasi PASS) od
`console.error()` gry (informacyjne, NIE gasi PASS — dispatch definiuje binarne kryterium
sukcesu WYŁĄCZNIE jako 30/30 identycznych hashy, §6.2 pkt 7). Identyczna liczba (7=7) tych
logów w A i B jest dodatkowym, nieobowiązkowym sygnałem determinizmu.

tsc --noEmit: `gra/tsconfig.json` ma `"include": ["src"]` — `tools/*.cjs` jest POZA
zakresem, potwierdzone `tsc --listFiles` (nowy plik nie pojawia się na liście). Zero
ryzyka regresji typów z tego pliku; nie ma czego uruchamiać jako "zielone tsc" dla tego
konkretnego pliku — odnotowane zamiast zgadywane, zgodnie z poleceniem zadania.

BLOKADY: brak blokującej. Jedna nietrywialna obserwacja (NIE blokada, informacyjna):
w OBU uruchomieniach (A i B) main.ts loguje identyczną liczbę (7) świadomych
`console.error()` z mechaniki "Wojna wymuszona" — `[Wojna wymuszona] DECISION_REQUIRED:
brak niezablokowanej sojuszem pary/trójkąta dla ownerów [0] -- ... Przydział pominięty
tej tury.` (main.ts:30703, udokumentowany w kodzie brzegowy przypadek, NIE crash —
komentarz przy tym miejscu: "ECHO, brzegowy przypadek... NIE zgadujemy"). Bramka
rozróżnia to od prawdziwego zepsucia silnika: gasi się WYŁĄCZNIE na `pageerror`
(nieprzechwycony wyjątek JS, zero wystąpień w obu przebiegach), nie na `console.error`
gry — identyczna liczba (7=7) tych logów w A i B jest dodatkowym (nieobowiązkowym)
sygnałem determinizmu, zgłaszana w outpucie informacyjnie.

RUNDY: 1/5
NASTĘPNY KROK: Evaluator → Final Control → integracja allowlist-only. Bramka gotowa do
użycia w przyszłej rundzie faktycznego rozcięcia `triggerPlayerEndTurn()` (porówna hash-
listę SPRZED i PO rozcięciu na tym samym mechanizmie).
DEPLOY/PUSH: NIE WYKONANO
