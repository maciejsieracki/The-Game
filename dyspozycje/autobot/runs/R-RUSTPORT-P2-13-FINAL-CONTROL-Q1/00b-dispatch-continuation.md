STATUS: DISPATCHED (kontynuacja po LIMIT-5-EXCEEDED pierwotnej rundy 1-5)
DOMAIN: PROCESS
TEMAT: R-RUSTPORT-P2-13-FINAL-CONTROL-Q1 (runda 2, licznik zresetowany przez orkiestratora)
GOAL: Dokończyć syntezę bramki P2 w `dyspozycje/rust-port/p2/P2-13-GATE-SYNTHESIS.md` — poprzednia
runda (1-5, LIMIT-5-EXCEEDED) zostawiła 8 z 12 plików P2-n nieprzeczytanych w całości, niepełną
macierz spójności, nierozliczone zobowiązanie Z-1 (przegląd 288 plików z P2.6) i nieocenione
pojedynczo punkty D-ID-1…7/11 oraz D-CMD-14. To NIE jest nowy temat od zera — kontynuuj istniejący
plik, zachowaj poprawną treść (§0-§7 w dużej mierze dobre, patrz werdykty ODDAL Final Control
poprzedniej rundy: 6,7,8,9,10,11 — te fragmenty NIE wymagają zmian).
RUNDA: 1/5 (nowy licznik tej kontynuacji — poprzednie 5 rund to osobny, zamknięty cykl)
MODEL+EFFORT: Operator: Haiku 5.5 medium. Evaluator: Haiku 5.5 medium. Final Control: Sonnet 5.5
  medium. Wszystko wyłącznie przez agent() w Workflow.

KONKRETNE LUKI DO ZAMKNIĘCIA (z werdyktów Final Control poprzedniej rundy, NAPRAW 1,2,3,4,5,12,13,14)
1. Przeczytaj W CAŁOŚCI pozostałe 8 plików: `P2-2-GAMESTATE-CONTRACT.md`, `P2-3-ENTITY-IDS.md`,
   `P2-5-COMMANDS.md`, `P2-6-EVENTS.md`, `P2-9-ASSET-DATA-MAPPING.md`, `P2-10-FIXTURES.md`,
   `P2-11-SAVE-MIGRATION.md`, `P2-12-COMPLIANCE-MATRIX.md` (wszystkie w `dyspozycje/rust-port/p2/`).
   P2-1, P2-4, P2-7, P2-8 były już przeczytane w całości — nie trzeba ponownie.
2. **Z-1 (przegląd 288 plików heurystyki S5/S6 z P2.6 §16) — ROZSTRZYGNIĘCIE DOSTARCZONE PRZEZ
   ORKIESTRATORA, wklej dosłownie do §3 i §0, zastępując obecny wpis Z-1:**
   „**Z-1 ROZLICZONE (orkiestrator, decyzja §0e tego dokumentu): opcja (b) — jawne przeniesienie do
   P3, nie blokuje bramki P2.** Uzasadnienie: (i) to jest pytanie o KOMPLETNOŚĆ KATALOGU (czy
   istnieje jeszcze jakiś nieodkryty event), nie o POPRAWNOŚĆ już skatalogowanych 53 wierszy — ryzyko
   dotyczy wyłącznie tego, że pojedyncza rzadka akcja gracza nie dostanie powiadomienia UI w Rust,
   co jest wykrywalne i naprawialne podczas implementacji/testowania P3, nie wymaga przedpłaty teraz;
   (ii) P2.6 §16 już wykonał dwie niezależne próby alternatywnych wzorców wyszukiwania (żadna nie
   znalazła pominiętego eventu) i ręczny przegląd 4 reprezentatywnych plików zerowych (same fałszywe
   pozytywy) — to nie jest zero dowodu, to ograniczony, ale nie zerowy dowód; (iii) blokowanie całej
   bramki P2 (12 zamkniętych tematów, setki stron analizy) na pełnym przeczytaniu 6642 linii bez
   konkretnego sygnału, że coś tam jest, byłoby kosztem niewspółmiernym do ryzyka. Warunek
   przeniesienia: przed P3.6 (implementacja warstwy eventów) wymagany jest RZECZYWISTY przegląd
   pozostałych plików z `szeroki_r5_broad` niesklasyfikowanych pojedynczo (dziś 195 plików, gdzie
   S5/S6=0 mimo trafienia szerokiego wzorca) — zapisane jako zobowiązanie techniczne dla P3, nie dla
   bramki P2."
3. Zbuduj pełną macierz spójności 12×12 (66 par) — nie tylko 14 par. Dla par oczywiście
   nieprzecinających się tematycznie (np. P2.4 RNG vs P2.8 Tauri adapter) wystarczy jedno zdanie
   „brak punktu styku, nie dotyczy" — nie trzeba głębokiej analizy KAŻDEJ pary, ale KAŻDA para musi
   mieć wiersz w tabeli, nie może być pominięta milczeniem.
4. Oceń POJEDYNCZO (nie zbiorczo) każdy z punktów D-ID-1…7, D-ID-11, D-CMD-14 pod kątem „czy to
   powinna być genuine decyzja właściciela, czy słusznie rozstrzygnięte administracyjnie" — dla
   każdego jedno zdanie uzasadnienia, nie etykieta zbiorcza.
5. Popraw licznik K-11 (ma być spójny z Z-10/§0/§1 — sprawdź aktualną liczbę otwartych D-* pozycji
   po rozstrzygnięciu Z-1 powyżej, policz naprawdę z tabeli, nie przepisuj starej liczby).
6. Usuń sprzeczność Z-1 vs O-1 (Z-1 po rozstrzygnięciu punktu 2 powyżej NIE jest już
   DECISION_REQUIRED — zamknięte przez orkiestratora, usuń O-1 z listy otwartych DECISION_REQUIRED
   albo oznacz je jako zamknięte z odwołaniem do nowego Z-1).
7. Dodaj O-22 (D-FIX-15, forma dowodu) do listy w §6 pkt 3, spójnie z resztą dokumentu.

PO ZAMKNIĘCIU TYCH 7 PUNKTÓW: wydaj jawny werdykt końcowy — czy bramka P2 jest formalnie otwarta dla
P3, czy nie, z jednoznacznym uzasadnieniem.

ANTY-HALUCYNACYJNA REGUŁA
Zakaz deklarowania poprawki bez faktycznego wykonania edycji w pliku — poprzednia Obrona rundy 5
zadeklarowała poprawki, które nie były w pliku; Final Control to wykrył. Każda deklaracja „poprawiono
X" musi być weryfikowalna grepem w samym pliku.

BINARNE KRYTERIUM SUKCESU
Wszystkie 12 plików P2-n przeczytane w całości (potwierdzone cytatami z każdego); macierz 66 par
kompletna; Z-1 rozliczone wklejonym tekstem z punktu 2; D-ID-1…7/11 i D-CMD-14 ocenione pojedynczo;
licznik spójny; jawny werdykt końcowy bramki.

ALLOWLISTA
Zapis wyłącznie: `dyspozycje/rust-port/p2/P2-13-GATE-SYNTHESIS.md` (ISTNIEJĄCY plik, kontynuacja),
`dyspozycje/autobot/runs/R-RUSTPORT-P2-13-FINAL-CONTROL-Q1/**`. Odczyt: `dyspozycje/**` read-only,
`gra/**` read-only, `rust-port/engine`/`parity-v2` read-only. Zero zmian w `gra/**`, zero nowego kodu
Rust, zero zmian w P2.1-P2.12.

IZOLACJA
Czysta praca projektowa/odczytowa + edycja istniejącego pliku .md. Ostatni temat fazy P2.

PROCEDURA NAPRAWCZA PRZY FAIL
Standardowa. Po 5 rundach TEJ kontynuacji: LIMIT-5-EXCEEDED, eskalacja do właściciela (to już byłaby
druga porażka tego samego zakresu zadania).

OGRANICZENIA WYJŚCIA
Raport max ok. 500 słów (więcej treści niż zwykle ze względu na zakres).

FORMAT ODPOWIEDZI
STATUS / DOMAIN / TEMAT / GOAL / ZMIANY-COMMIT / TESTY / BLOKADY / RUNDY / NASTĘPNY KROK
DEPLOY/PUSH: NIE WYKONANO
