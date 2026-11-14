STATUS: BLOCK (punkt 1 nie zmierzony poprawnie w tym przebiegu; punkt 2 nie wykonany na żywo; brak zmian kodu gry)
DOMAIN: GAME
TEMAT: R-WEB-LIVE-VERIFY-WAVE-689-697-A-Q1 (runda 1/5, Operator HAIKU)
GOAL: dowód w żywej grze (Chromium, bundle vite poza repo, ?civTest=1):
  1. FALA 697/693 — bramka „Zakończ turę” gracza: tura ≥11 z ujemnym skarbcem/spichlerzem → blokada z title (zasób, minus, dźwignie), klik nie kończy tury; po naprawie tura się kończy; tury 1–10 bez blokady; brak zakleszczenia.
  2. FALA 692 — okno „Umowa wymiany surowców”: dodanie pozycji po obu stronach nie przeładowuje okna (ta sama identyczność węzła DOM), obie strony wypełnialne przed „Zaproponuj”, podpowiedź przy pustej stronie; zrzuty przed/po.
BAZA: 7aaa231d6 (origin/main), checkout --detach. Dispatch: 00-dispatch.md z commita 7a4394f1e (gałąź claude/sprawdzenie-funkcjonalnosci-ek4ra0). Zob. BLOKADY/1.

ZMIANY-COMMIT: nowy plik gra/tools/live-verify-wave-689-697-a-gate.cjs (allowlista: gra/tools/live-verify-wave-689-697-a-*.cjs) oraz runs/R-WEB-LIVE-VERIFY-WAVE-689-697-A-Q1/ (raport + evidence/). Nie zmieniano gra/src ani gra/data. node_modules zainstalowany (npm ci, gitignored), bundle zbudowany do scratchpada poza repo (vite build exit 0, 15.47 s).

TESTY (liczby z surowego wyjścia):
- npm ci w gra/: exit 0, "added 71 packages in 2s".
- vite build --outDir <scratchpad>/dist-a: exit 0, "✓ built in 15.47s" (bundle poza repo).
- tools/no-negative-stocks-end-turn-gate-levers-test.cjs (offline, czysta logika bramki): "25 passed, 0 failed", exit 0.
- tools/trade-dialog-no-rerender-test.cjs (jsdom, NIE live): "19/19 PASS", exit 0. Obejmuje: panel B zachowany, obie strony wypełnialne, jedno kliknięcie „Zaproponuj" = jedna propozycja z OBIEMA stronami, podpowiedź przy pustej stronie.
- LIVE punkt 1 (Chromium headless, seed 11, skrypt gra/tools/live-verify-wave-689-697-a-gate.cjs, wynik: dyspozycje/.../evidence/result-seed11.json):
  | Krok | Wynik | Ocena |
  |---|---|---|
  | P1a tura 5, skarbiec −200 000 | canEnd=true, title="", koniec tury przeszedł (5→6) | PASS (tury 1–10 bez blokady) |
  | P1b tura 11, sweep skarbca 150 000 → 0 → −18 600 krokami po 50 | pierwsza blokada (canEnd=false) przy łącznym deficycie 168 600 (skarbiec ≈ −18 600); title="" po włączeniu renderu | NIE_ZMIERZONO (stan gry był zresetowany, patrz niżej) |
  | P1b klik w stanie blokady | tura 1→1 (brak zmiany) | NIE_ZMIERZONO (tura już 1, test nieważny) |
  | P1c przywrócenie skarbca (+151 000), klik | canEnd=false, tura 1→1 | NIE_ZMIERZONO (stan zresetowany) |
  | Zrzut blokady | p1b-turn11-blocked-at168600.png (widoczny overlay „Tworzenie świata”, patrz BLOKADY/3) | obejrzany |
- LIVE punkt 2 (okno wymiany, FAL 692): NIE wykonano na żywo w tej rundzie (brak ścieżki otwarcia okna przez haki; czas). Podstawa: jsdom 19/19 (powyżej), NIE jest dowodem live.

Obserwacje pomiarowe (z evidence, obejrzane):
- Zrzut p1b-turn11-deficit251500.png (przebieg z krokiem 5000/500): HUD pokazuje „Skarbiec −101,5k” i stan „TURA 1 · 4000 P.N.E.”, z panelem „Załóż miasto (FREE, pierwsze miasto)”. Gracz nie ma miasta, czyli gra wróciła do stanu początku.
- Liczba 150 000 jako stan skarbca w turze 11 wynika z tego zrzutu (150 000 − 251 500 = −101 500).

BLOKADY:
1. Dispatch: plik 00-dispatch-DODATEK-claude.md NIE istnieje na żadnym dostępnym refie (sprawdzone na origin/main, na tipie gałęzi orkiestratora 7a4394f1e i na 7aaa231d6). Na origin/main nie ma katalogu R-WEB-LIVE-VERIFY-WAVE-689-697-A-Q1 w ogóle. Użyto 00-dispatch.md z commita 7a4394f1e (zawiera GOAL, allowlistę, kryteria i zakazy). Zakres ZAŁOŻONO wg tych kryteriów; dodatek (środowisko, stan, zadanie tej rundy) nie był dostępny.
2. Punkt 1 (P1b/P1c) nie da się zmierzyć ważnie: po przekroczeniu skarbca poniżej zera (ok. −18 600 w pierwszym przebiegu tej serii, −101 500 w innym) gra przechodzi do stanu „TURA 1 / Załóż miasto” (brak miasta gracza, awaitingFirstPlayerCity). W takim stanie canPlayerInitiateEndTurn zwraca false (zgodnie z kodem: isAwaitingFirstPlayerCity), więc blokady nie da się odróżnić od resetu. Mechanizm resetu NIE został ustalony (nie wiadomo, czy to zamierzona upadłość/utrata miasta, czy błąd harnessu, np. ścieżka startGame/refound). To jest zgłoszenie do decyzji orkiestratora (patrz UWAGI-1).
3. Nakładka „Tworzenie świata” (7/10 · Rzeki — uzupełnianie, „Uplynęło 2:12”) pozostaje widoczna na zrzutach w trakcie tur (fast mode i po przełączeniu renderu). Zgodne z otwartym tematem #376 w liście orkiestratora. Przykrywa przycisk; klik realizowano przez element.click().
4. Nie dało się sprawdzić zakleszczenia (brak dźwigni) ani dźwigni klikiem: naprawa skarbca odbywa się hakiem grantPlayerGold, nie podatkiem w UI. Dźwignie podatku/racji NIE są wykonywane klikiem.
5. Punkt 2 nie wykonany na żywo (BLOKADA czasu rundy i braku haka otwarcia okna wymiany).

RUNDY: 1/5 (Operator). Brak Evaluatora, Obrony i Final Control (nie wykonywano przez tę rundę).

NASTĘPNY KROK (rekomendacja operatora, decyzja orkiestratora):
  a. Ustalić, dlaczego skarbiec gracza poniżej zera resetuje grę do TURA 1 / brak miasta — najpierw w kodzie (ścieżka upadłości/utraty miasta przy ujemnym skarbcu gracza i wywołania startu gry), potem w pomiarze. Jeśli to defekt gry: osobny temat R-WEB-*, nie w tym dispatchu.
  b. Dla punktu 1 ponowić pomiar z gwarancją: miasto gracza nieusunięte (np. skarbiec schodzi tylko do −(wartość dźwigni), nie do −18 600), tryb renderu włączony przed odczytem title, klik natywny. Kryterium zaliczenia P1b: title niepusty (zasób, minus, dźwignie).
  c. Punkt 2: osobny runner (lub ten sam) z ustawieniem okna „Umowa wymiany surowców” w grze (ścieżka UI przez dyplomację) i zrzutami przed/po, z porównaniem identyczności węzła DOM kontenera.
  d. Wyjaśnić nakładkę „Tworzenie świata” (#376) — czy blokuje interakcję w trybie ?civTest=1.

DEPLOY/PUSH: NIE WYKONANO (brak READY_FOR_DEPLOY; push dokumentacji/narzędzia wykonuje orkiestrator po FC).

UWAGI-DLA-ORKIESTRATORA:
UWAGI-1 (kandydat na defekt, NIE zweryfikowany): negatywny skarbiec gracza w turze 11 → utrata miasta gracza i powrót do „TURA 1 / Załóż miasto” (zobacz BLOKADY/2). Powód możliwy: upadłość/utrata miasta przy skarbcu < 0, albo artefakt harnessu. Nie rozstrzygnięte. Wymaga ustalenia przed dalszymi pomiarami bramki.
UWAGI-2: w innym trybie (nie ten dispatch) zaobserwowano, że bramka nie blokuje, gdy dźwignie nie wystarczą (zgodnie z kryterium b „brak zakleszczenia”). Tego nie da się potwierdzić, dopóki stan gry nie jest poprawny (UWAGI-1).
UWAGI-3: tytuł przycisku (title) był pusty we wszystkich odczytach, także w stanie blokady przy renderze włączonym — ale te odczyty były w stanie zresetowanym (UWAGI-1), więc nie są dowodem braku tooltipa.
UWAGI-4: pierwszy przebieg skryptu nie znajdował przycisku, bo innerText zwraca tekst po text-transform (wersaliki „ZAKOŃCZ TURĘ”). Poprawka w skrypcie: textContent + regex /i. Odnotowane, bo dotyczy każdego przyszłego pomiaru tego przycisku.
UWAGI-5: plik gra/tools/live-verify-wave-689-697-a-gate.cjs jest narzędziem pomiarowym (wejdzie w allowlistę tego tematu). Nie zawiera sekretów. Ścieżki wyjścia są przekazywane argumentami.
