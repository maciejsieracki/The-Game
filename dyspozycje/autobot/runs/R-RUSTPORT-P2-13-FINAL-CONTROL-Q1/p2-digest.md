## Digest skrócony 12 tematów P2 (do sprawdzania sprzeczności krzyżowych — orkiestrator, 2026-10-21)

Dla każdego pliku P2-n: jeśli plik ma na końcu sekcję "## N. Rozstrzygnięcia (orkiestrator, ...)" —
TA SEKCJA JEST WIĄŻĄCA I NADRZĘDNA wobec wcześniejszej treści tego samego pliku (propozycji
Operatora, list D-n z deklaracją "wymaga decyzji"). Wcześniejsza treść to ŚLAD DEBATY, nie żywa
decyzja, jeśli rozstrzygnięcie jej dotyczy. To jest META-REGUŁA do zastosowania przy całej analizie
spójności — wiele pozornych "sprzeczności między plikami" to w rzeczywistości czytanie przedawnionej
treści D-n sprzed rozstrzygnięcia zamiast sekcji rozstrzygnięć.

1. **P2.1 DOMAIN-MODULES** — katalog 15 modułów domeny, 183/183 plików web przypisanych. Bez
   rozstrzygnięć orkiestratora (czysty katalog, PASS bez DECISION_REQUIRED).
2. **P2.2 GAMESTATE-CONTRACT §8** — kontrakt `GameState`. D7 (jedyna genuine decyzja, zadana
   właścicielowi): Rust CZYTA zapisy web 1:1 (import jednokierunkowy, Rust nie musi zapisywać w
   formacie czytelnym przez web). Pozostałe 15 punktów rozstrzygnięte administracyjnie (struktura
   drzewa GameState, grupowanie pól, D14: `policy` jako pod-struktura `OwnerState`).
3. **P2.3 ENTITY-IDS §9** — schemat ID: newtype `u64` per typ, monotoniczny licznik, `OwnerRef` enum,
   kanon człowieka=0. **D-ID-5 (oblężenie/garnizon) ROZSTRZYGNIĘTE w §9 l.315**: `oblega:
   Option<CityId>` jest JAWNIE PRZECHOWYWANE na jednostce (NIE wyprowadzane z pozycji) — wymóg
   importu 1:1 (D7). Wcześniejsza treść §2/§7 tego samego pliku ("D-ID-5 wymaga decyzji", "garnizon
   wyprowadzany z pozycji") jest PRZEDAWNIONA przez to rozstrzygnięcie — NIE jest to sprzeczność
   międzydokumentowa, to stara treść w tym samym dokumencie. `kind` jednostki = klucz katalogu danych
   (nie zamknięty enum).
4. **P2.4 RNG-DETERMINISM** — prymitywy RNG zgodne matematycznie. Generator świata Rust NIEZGODNY z
   web (brak gór/rzek/lasów) — to NIE jest regresja, to zakres przyszłej pracy P3/P4 (generator
   jeszcze nieprzeportowany). Bez DECISION_REQUIRED.
5. **P2.5 COMMANDS §9** — katalog 96 wierszy komend (0 GOTOWA, 28 CZĘŚCIOWA, 48 BRAK, 20 WIDOK).
   Rozstrzygnięcia: akcje widokowe = `WIDOK (bez komendy)`; zaznaczenie jednostki/miasta = stan UI,
   NIE GameState; kanon ID P2.3 rozszerzony o 14 nazw (newtype dla bytów z cyklem życia jak DealId/
   BattleId/SlotId, klucz katalogu dla reszty); `set_city_policy` ma być rozbite na typowane komendy
   w P3+ (wytyczna, nie wymóg teraz); `owner: PlayerId` jawnie podawany przez front (nie wyprowadzany
   z sesji); import nieniszczący.
6. **P2.6 EVENTS §9** (UWAGA: sekcja nosi numer **§9**, NIE §16 — jeśli gdziekolwiek pojawia się
   odwołanie "P2.6 §16", to BŁĄD CYTOWANIA, popraw na §9) — katalog 53 wierszy eventów, pełne
   pokrycie per plik 457/457. Rozstrzygnięcia: granulacja eventów per encja/przyczyna (D-EV-15, nie
   zagregowana); `engine_state_changed` (snapshot) i nowy `engine_event` (powiadomienia) współistnieją;
   brak bufora/sekwencji eventów — frontend resynchronizuje się pełnym snapshotem po powrocie
   nasłuchu. **Zobowiązanie jawnie zapisane w §9: pełny przegląd linia-po-linii pozostałych 195-288
   plików heurystyki S5/S6 (niesklasyfikowanych pojedynczo) jest WYMAGANY PRZED P2.13** — patrz
   punkt "Z-1" niżej, już ROZSTRZYGNIĘTE przez orkiestratora w tym temacie P2.13 (nie trzeba
   ponownie dyskutować, tylko wkleić gotowy tekst rozstrzygnięcia podany w dispatchu 00b).
7. **P2.7 SAVE-SERIALIZATION** — katalog 22 top-level + 94 `meta` kluczy zapisu web. Gap
   `meta.forcedWarWavesByPairKey` POTWIERDZONY (web ma, Rust brak). PASS-WITH-NOTES, bez
   DECISION_REQUIRED (czysty katalog faktów).
8. **P2.8 TAURI-ADAPTER** — dzisiejszy stan adaptera (1 komenda `engine_command` 6 wariantów, 1
   event), żadna z docelowych kategorii P2.5 nie wpięta. Czysty katalog faktów, bez DECISION_REQUIRED.
9. **P2.9 ASSET-DATA-MAPPING** — mapowanie `gra/data/*.json` → struktury Rust. Loader: BRAK dla
   29/29 plików (brak mechanizmu wczytywania). **Znalezisko krytyczne: `units.json`↔`recruitment.rs`
   — 75/75 NAZW zgodne, ALE 75/75 WARTOŚCI rozbieżne** (komentarz w kodzie "mirrored from units.json"
   nieprawdziwy). Kontrastowo `buildings.json`: 40/40 zgodne wartościowo. Czysty katalog faktów, bez
   DECISION_REQUIRED (to nie jest decyzja, to zidentyfikowany dług do naprawy w P3).
10. **P2.10 FIXTURES §16** — format fixture + 7 scenariuszy startowych (FX-01…FX-07). Rozstrzygnięcia:
    `D-FIX-15` (zakres czytania) ZAMKNIĘTE; `D-FIX-20` (model wyroczni) ROZSTRZYGNIĘTE: wyrocznią jest
    WYŁĄCZNIE zmierzona wartość web, nie przewidywanie Rust z odczytu kodu. Pozostałe `D-FIX-1,3,4,
    9-14,16-19` to ŚWIADOMIE udokumentowane decyzje propozycji (GOAL dispatchu to wymagał) — NIE są
    blokadą zamknięcia tego katalogu, rozstrzygane dopiero przy nagraniu/implementacji harnessu w P3+.
    **Nagłówek pliku P2-10 (linia ok. 7) może nadal pokazywać "DECISION_REQUIRED" ze starej rundy
    Operatora sprzed §16 — to STARY nagłówek, PRZEDAWNIONY przez §16 (status: temat zamknięty PASS).**
11. **P2.11 SAVE-MIGRATION §10** — reguła migracji 116 kluczy (22 top-level + 94 meta). Kluczowe:
    `budowaListaBiblioteka` → import jako dane (korekta błędnej klasyfikacji P2.2 jako flagi UI);
    `inGarnizon`/`oblegaCityId` → import jako dane, **DOKŁADNIE TEN SAM precedens co `oblega` w P2.3
    §9 D-ID-5** (NIE jest to sprzeczność z P2.3 — to świadome, jawnie nazwane zastosowanie tej samej
    już podjętej decyzji do symetrycznego pola; P2-11 §10 mówi to wprost); tabela legacy-ID atomowa
    (zgodna z P2.3 §9 D-ID-1); import nieniszczący; naprawa-z-ostrzeżeniem zamiast twardego fail dla
    drobnych defektów.
12. **P2.12 COMPLIANCE-MATRIX §15** — macierz 41/41 wierszy P1 (18 POKRYTY, 19 CZĘŚCIOWO, 4 LUKA).
    Czysty audyt kompletności kontraktu wobec P1, bez DECISION_REQUIRED (7 poprawek mechanicznych
    już wykonanych przez orkiestratora).

## Rozstrzygnięcie Z-1 (orkiestrator, gotowy tekst do wklejenia dosłownie — NIE renegocjować)

**Z-1 ROZLICZONE (orkiestrator): opcja (b) — jawne przeniesienie do P3, nie blokuje bramki P2.**
Uzasadnienie: (i) to jest pytanie o KOMPLETNOŚĆ KATALOGU (czy istnieje jeszcze jakiś nieodkryty
event), nie o POPRAWNOŚĆ już skatalogowanych 53 wierszy — ryzyko dotyczy wyłącznie tego, że
pojedyncza rzadka akcja gracza nie dostanie powiadomienia UI w Rust, co jest wykrywalne i
naprawialne podczas implementacji/testowania P3, nie wymaga przedpłaty teraz; (ii) P2.6 **§9** (NIE
§16 — to literówka do poprawienia wszędzie gdzie się pojawi) już wykonał dwie niezależne próby
alternatywnych wzorców wyszukiwania (żadna nie znalazła pominiętego eventu) i ręczny przegląd 4
reprezentatywnych plików zerowych (same fałszywe pozytywy) — to nie jest zero dowodu, to
ograniczony, ale nie zerowy dowód; (iii) blokowanie całej bramki P2 (12 zamkniętych tematów, setki
stron analizy) na pełnym przeczytaniu 6642 linii bez konkretnego sygnału, że coś tam jest, byłoby
kosztem niewspółmiernym do ryzyka. Warunek przeniesienia: przed P3.6 (implementacja warstwy
eventów) wymagany jest RZECZYWISTY przegląd pozostałych plików z `szeroki_r5_broad`
niesklasyfikowanych pojedynczo (dziś 195 plików, gdzie S5/S6=0 mimo trafienia szerokiego wzorca) —
zapisane jako zobowiązanie techniczne dla P3, nie dla bramki P2.

## Pozycje, które NIE są sprzecznościami (rozstrzygnięte wcześniej w tym temacie, nie renegocjować)

- **K-1 (D-ID-5 vs P2-11 l.445/539):** NIE jest sprzecznością. P2.3 §9 (l.315) i P2.11 §10 (D-MIG-19)
  są ZGODNE — oba mówią "przechowywać jawnie, nie wyprowadzać". P2-11's własny tekst D-MIG-19
  cytuje PRZEDAWNIONĄ (pre-rozstrzygnięcie) treść P2.3 z linii 283/113 jako punkt wyjścia analizy,
  ale P2-11 §10 kończy wnioskiem zgodnym z P2.3 §9. Oznacz jako ZGODNE w macierzy, nie jako
  kontradykcję.
- **D-CMD-14 (manifest 357 vs P2-5 l.19 "330, weryfikacja 19/19"):** to jest ROZBIEŻNOŚĆ LICZBOWA w
  obrębie JEDNEGO pliku (P2-5) między r4 i r5 jego własnej historii rund (r5 rozszerzyło przegląd z
  19 do 33 plików, 330→357 trafień — to jest udokumentowany PRZYROST zakresu w P2-5 §0 zmiany r5,
  nie błąd). Sprawdź w P2-5-COMMANDS.md §0 akapit "r5 (zarzut 3)" — tam jest wprost napisane
  "357/357 trafień" jako finalna, poprawiona liczba. Nie jest to luka wymagająca DO-FC, to stara
  liczba (330) z wcześniejszej rundy tego samego pliku, zastąpiona przez nowszą (357). ADMIN-OK.
