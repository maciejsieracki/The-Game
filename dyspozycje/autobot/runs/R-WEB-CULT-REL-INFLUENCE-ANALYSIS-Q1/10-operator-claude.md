STATUS: PASS-WITH-NOTES
DOMAIN: GAME (analiza i propozycja, bez zmian kodu gry)
TEMAT: R-WEB-CULT-REL-INFLUENCE-ANALYSIS-Q1 (CULTRELANALYSIS #172)
GOAL: opis stanu kultury, religii i Porządku; model świeżo zdobytego miasta; propozycja parametrów trzech poziomów „Kultura i religia" (mały / neutralny / duży); plan implementacji.
ZMIANY/COMMIT: allowlista zachowana. Nowe pliki: dyspozycje/analizy/KULTURA-RELIGIA-WPLYW-2026-11-26.md (dokument z §1–§7, streszczenie na początku), dyspozycje/analizy/model-kultura-religia-2026-11-26.py (model), dyspozycje/autobot/runs/R-WEB-CULT-REL-INFLUENCE-ANALYSIS-Q1/10-operator-claude.md (ten raport). Zero zmian w gra/**, gra-robocza/, gra-kanon/, rust-port/, WERSJE.md, manifest.
TESTY:
- Bramki kodu: brak (zgodnie z dispatchem).
- Uruchomienie modelu: `python3 -I dyspozycje/analizy/model-kultura-religia-2026-11-26.py` → exit 0, wynik zmierzony (liczby z surowego wyjścia): dla „mały" (obecne wartości) świeżo zdobyte miasto obcej kultury i religii bez budynków potrzebuje 2 jednostek garnizonu (Porządek 0,0 przy 0 jedn., 25,5 przy 1, 51,0 przy 2); własna kultura i religia wymaga 1 jednostki (29,8 przy 0). Wymuszone Prawo 100% przez 5 tur maskuje wszystkie scenariusze (50–83).
- Wariant „duży" (x=16, Szczęście nieobcinane od dołu): d = 4 jednostki bez świątyni, 3 ze świątynią; b/c = 2. Wariant „neutralny" (x=7): d = 2, b/c = 2 (wyliczenie ręczne potwierdzone zgodnie z wzorem; NIE ZMIERZONO w skrypcie dla x=7, dopisano tylko x=10/12/14/16 w wyjściu — x=7 policzono ręcznie).
- Model jest reimplementacją wzorów w Pythonie, NIE bundlem esbuild z gry. NIE ZMIERZONO w silniku TypeScript, w grze, w AI i w testach live.
- Git: `git diff --name-only` poza allowlistą — brak; `git diff --check` — do wykonania przy commicie (pliki nowe).
BLOKADY: brak blokad technicznych. Luki (założenia, nie zmierzone): (1) start udziału kultury/religii po zdobyciu (założono 0% własnej) — nie sprawdzono `onCityCapturedReligion`/`applyCapturePopulationLoss`; (2) tempo konwersji kultury i religii w grze; (3) epoki 2–3 (x=16/23 w grze) — model liczy tylko epokę 1; (4) czy `order.ts` (drugie progi `porzadek_prog_t1/t2` = 0/6) jest jeszcze czytane w turze; (5) czy `cultureHappiness` (`haKult`, main.ts ok. 44770) wpływa na wynik; (6) wpływ na AI i balans wojen.
Ustalenia odbiegające od dispatchu (do zanotowania przez orkiestratora):
- Dispatch zakładał, że dziś garnizon nie ma znaczenia (0 jednostek). Model mówi, że dziś obca kultura i religia wymagają 2 jednostek po 5 turach od podboju; różnica własna–obca to ok. 30 pkt Porządku. Kara jest ukryta obcięciem Szczęścia do 0% (`clampPct`, society-breakdown.ts ~498) i wymuszonym Prawem 100% przez 5 tur (`POST_CAPTURE_LAW_PCT`, post-capture-law.ts).
- Świątynia (+2 Szczęścia, baza) nie pomaga przy obcej kulturze i religii, bo wynik jest obcięty do 0%.
- W kodzie istnieją dwa systemy tierów Porządku (order.ts `orderTier` w surowych punktach vs society-breakdown.ts `tierFromPorPct` w %). Żywy wydaje się być procentowy; do potwierdzenia.
- Kary `kultura_kara_zadowolenie_lt50/lt25` (−2/−4) są nadal w JSON i w `cultureHappiness`, które jest liczone w main.ts (haKult) — do potwierdzenia, czy trafiają do wyniku.
UWAGI-DLA-ORKIESTRATORA:
- Propozycja „duży" wymaga nowego klucza `szczescie_kultura_religia_obciecie_dolu` (0/1 per poziom) i zmiany `clampPct` tylko dla linii kultury/religii; to zmiana mechaniki, nie tylko wartości — ABC do właściciela (pytanie: wariant obcinania i poziom domyślny) musi przejść turniej C-018 przed pokazaniem właścicielowi.
- Epoki 2–3 nie zostały policzone; wartości x=11/16 i 16/23/33 w dokumencie są oznaczone jako do potwierdzenia.
- Działanie na istniejących zapisach: zapis bez pola = poziom „mały" (bit-w-bit) — do ujęcia w planie implementacji (już ujęte w §4).
- Proces: nie użyto spawn_task, create_session, create_trigger, send_later, run_in_background. Nie integrowano, nie deployowano, nie pushowano na main.
NASTĘPNY KROK: (1) orkiestrator decyduje o ABC poziomów (turniej C-018), (2) po odpowiedzi — CULTRELSETTING (#173), (3) pomiar po implementacji (model + 100 tur AI na trzech poziomach) przed CULTRELIMPL (#174).
RUNDY: 1/5
DEPLOY/PUSH: NIE WYKONANO
