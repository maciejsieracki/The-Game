# R-PLATFORMA-DESKTOP-ROADMAP-Q1 — docelowa migracja z przeglądarki na aplikację desktopową (dwuetapowo)

**Data:** 2026-08-17 · **Decyzja:** Maciej · **Status:** ZAREJESTROWANE jako kierunek na
przyszłość — NIE do wdrożenia teraz, nie blokuje bieżącej pracy nad wersją przeglądarkową.

## Sytuacja

W trakcie sesji poświęconej diagnozie spowolnienia gry (`P-PERF-SPOWALNIANIE-SESJA-DLUGA-Q1`,
`dyspozycje/PYTANIA-OTWARTE.md`) — seria realnych ograniczeń przeglądarki napotkanych w historii
projektu (limit `localStorage` ~5 MB/origin, JS jednowątkowy na głównym wątku, pamięć/GPU tab-a
ograniczone przez proces przeglądarki) — Maciej wyraził żal, że projekt poszedł w wersję
przeglądarkową zamiast natywnej aplikacji na PC.

Claude (orkiestrator) zwrócił uwagę, że **konkretny objaw dzisiejszej sesji** (przeliczanie
czegoś od zera przy każdej interakcji użytkownika, rosnące z liczbą miast) **nie jest specyficzny
dla przeglądarki** — ten sam błąd algorytmiczny dawałby identyczny objaw w dowolnej technologii;
zmiana platformy nie zastępuje znalezienia i naprawienia konkretnej przyczyny. Zaproponowano dwie
opcje: (a) **Tauri** — natywna powłoka desktopowa (Rust) wokół ISTNIEJĄCEGO kodu TS/Three.js/HTML,
zero przepisywania UI/silnika, eliminuje limity `localStorage` i otwiera drogę do przeniesienia
najcięższych obliczeń (generator map, tury AI) do Rust dla realnej wielowątkowości; (b) **pełny
silnik gry** (Godot/Unity/C++) — całkowite przepisanie od zera, miesiące pracy, porzucenie
obecnego kodu, ale realne wyeliminowanie strukturalnych ograniczeń przeglądarki (jednowątkowy UI,
brak twardego sufitu pamięci).

## Decyzja

Maciej, dosłownie: *„OK, w takim razie pierwszy krok Tauri, a drugi krok pełny silnik gry."*

Dwuetapowa mapa drogowa, **w tej kolejności**:

1. **Etap 1 — Tauri.** Opakowanie istniejącego kodu (TS/Three.js/HTML, cały obecny silnik gry i
   UI) w natywną aplikację desktopową przez Tauri. Zero przepisywania warstwy prezentacji;
   zysk: realny plik `.exe`/binarka zamiast karty przeglądarki, dostęp do systemu plików bez
   limitów `localStorage`/IndexedDB, możliwość stopniowego przenoszenia najcięższych obliczeń
   (generator map, logika tur AI) do backendu Rust dla prawdziwej wielowątkowości — bez
   utraty dotychczasowej inwestycji (setki commitów, cały silnik gry).
2. **Etap 2 — pełny silnik gry** (Godot/Unity/C++ — konkretny wybór DO USTALENIA osobno, nie
   przesądzony tą decyzją). Docelowe, całkowite przepisanie eliminujące strukturalne ograniczenia
   webview (JS jednowątkowy na wątku UI, brak twardego sufitu pamięci charakterystycznego dla
   przeglądarki). Świadomie odłożone jako etap PO Tauri, nie równolegle.

## Zastrzeżenia (jawnie ustalone w rozmowie, nie domyślne)

- **To NIE jest naprawa bieżącego buga spowolnienia.** Konkretna przyczyna (`P-PERF-
  SPOWALNIANIE-SESJA-DLUGA-Q1`, wątek „każda interakcja wolna, rośnie z liczbą miast") jest
  algorytmiczna/implementacyjna — istniałaby identycznie w Tauri i w pełnym silniku, dopóki nie
  zostanie znaleziona i naprawiona w kodzie. Migracja platformy nie zastępuje tej pracy.
- **Nie blokuje ani nie spowalnia bieżącej pracy nad wersją przeglądarkową** (ROBOCZA/KANON/
  FINALNA, runbook §6 handoffu) — to równoległy, długoterminowy kierunek, nie zamiennik.
- **Skala:** Etap 1 (Tauri) to realny, ograniczony projekt integracyjny. Etap 2 (pełny silnik) to
  przepisanie całej gry od zera — miesiące pracy, nie tygodnie. Żaden z etapów nie ma dziś
  przydzielonego terminu ani dispatchu — to zarejestrowany kierunek, nie zlecenie do wykonania.
- **Nie zastępuje standing rule „nowe tematy tylko rejestruj"** obowiązującej w bieżącej sesji —
  ten dokument jest właśnie realizacją tej zasady (rejestracja decyzji strategicznej, nie jej
  wdrożenie).

## Otwarte do ustalenia przy faktycznym starcie (nie teraz)

- Konkretny wybór silnika na Etap 2 (Godot vs Unity vs C++ własny) — dziś nierozstrzygnięte,
  do osobnej analizy kiedy przyjdzie na to czas.
- Zakres pierwszej wersji Tauri (czy 1:1 z wersją przeglądarkową, czy od razu z migracją części
  logiki do Rust) — do ustalenia przy dispatchu Etapu 1.
- Wpływ na dwuosobowy model pracy integratorów (sesja chmurowa + lokalna, §6 handoffu) — Tauri
  wymaga kompilacji natywnej per-platforma, inny runbook niż dzisiejszy „zbuduj HTML bundle".
