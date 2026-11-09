STATUS: DECISION_REQUIRED
DOMAIN: GAME
TEMAT: R-WEB-UNIT-REPLACE-AI-INSTANT-BRONZE-AND-PLAYER-BLOCKED-Q1
GOAL: Ustalić, czy AI zamienia jednostki na Brąz taniej/szybciej niż gracz (błąd), oraz dlaczego gracz nie widzi wyższych zamienników w "Zastąp"; napraw tylko jednoznaczne błędy.
ZMIANY/COMMIT: BAZA main 8718bbd26 (FALA 569). Dodany wyłącznie gra/tools/unit-replace-ai-vs-player-test.cjs (diagnostyka + bramka faktów) i ten raport. ZERO zmian w kodzie gry. SHA: patrz `git log -1` brancha worktree-wf_fd49f261-6f3-1 (commit "R-WEB-UNIT-REPLACE ... r1").
TESTY: unit-replace-ai-vs-player-test.cjs 13/13; unit-replace-test.cjs 15/15; ai-era-unit-promotion-test.cjs 12/12. Przeglądarka/żywa gra: NIE_ZMIERZONO (brak).
BLOKADY: brak techniczny; decyzje produktowe poniżej (ABC do właściciela przez orkiestratora).
RUNDY: 1/5
NASTĘPNY KROK: Evaluator; orkiestrator zadaje ABC (pkt D1-D3).
DEPLOY/PUSH: NIE WYKONANO

## 1. AI — mechanizm (dowody w kodzie)
- main.ts `upgradeAiUnitsForEra(ownerId)` (~7345), wołane raz na świeżą turę każdego AI (`ensureAiOwnerStartEra(ownerId); if (!isCommandResume) upgradeAiUnitsForEra(ownerId);` ~39356). Każda jednostka AI -> `promoteAiUnitForEra` (game/ai-era-unit-promotion.ts): wybiera NAJNOWSZY dostępny zamiennik tego samego Typ (nie pojedynczy krok), pobiera `max(0, koszt_nowej - koszt_starej)` WYŁĄCZNIE w Pieniądzu ze skarbca AI, ustawia `ruchLeft=0`, `replaceUsedThisTurn=true`.
- Brak limitu liczby zamian na turę (jedyny hamulec: skarbiec >= dopłata, jednostka po jednostce).
- Brak pobrania surowca. Rekrutacja pobiera `unitStockCost` (Wojownik z mieczem i tarczą = 50 Brązu/szt. po skali epoki) + dalej utrzymanie; zamiana pobiera 0 Brązu. Bramka surowca to tylko `zapas > 0` (production.ts empireStockHas), bez porównania z ilością.
- Symulacja (tools/unit-replace-ai-vs-player-test.cjs, 90x "Wojownik", Brązownictwo+Koszary+Brąz>0, poziom normal): dopłata 11 Pieniądza/szt. (5 -> 16). Skarb 0: 0 zamian; 100: 9; 270: 24; >=990: 90/90 w JEDNEJ turze. Brąz zużyty 0 (rekrutacja tych 90 = 4500 Brązu). Przyrost utrzymania po zamianie: +900 Brązu/turę (10 vs 3 Drewna na szt.) — utrzymanie rośnie, więc AI może wpaść w deficyt Brązu następnej tury.
- Wniosek: to nie "zero kosztu", tylko koszt = wyłącznie mała dopłata Pieniądzem. Przy ~90 jednostkach AI wystarczy ~1000 Pieniądza, by zamienić wszystkie w pierwszej turze po zdobyciu Brązownictwa+Koszar — zgodne z obserwacją właściciela.

## 2. Symetria AI vs gracz
| Aspekt | Gracz (performUnitReplace) | AI (upgradeAiUnitsForEra) |
|---|---|---|
| Koszt Pieniądz | max(0, nowa-stara) | to samo |
| Koszt surowca | 0 | 0 (symetria) |
| Limit/turę | raz na jednostkę, ręcznie | raz na jednostkę, automat, bez limitu liczby |
| Zasięg | tylko własne terytorium (isUnitInPlayerTerritory) | BRAK sprawdzenia terytorium — jednostki w polu/obcym kraju też |
| Wybór celu | dowolny z listy (picker) | zawsze najnowszy (przeskok kilku epok naraz) |
| Koszary/tech/epoka | per miasto garnizonu lub unia w polu | ta sama funkcja kontekstu (unitReplaceCtx) |
Asymetrie (nie błędy kosztu): zasięg terytorialny (AI luźniejsze), automatyczny masowy tryb AI.
Źródło reguły "tylko Pieniądz": komentarz main.ts ~7230 — decyzja właściciela 2026-07-19 (wcześniejsza niż JEDNOSTKI-SUROWIEC-01 z 2026-07-24, która wprowadziła koszt Brązu w rekrutacji) — możliwa luka polityczna, nie regresja kodu.

## 3. Gracz — dlaczego nie ma "wyższych" zamienników
Reguła (production.ts `availableReplacementsFor`): lista = A) jednostki TEGO SAMEGO Typ, odblokowane teraz (epoka imperium, Tech, Nacja, Koszary dla epoki >= Brąz, Naval = woda, Super-jednostka jedna żywa) + B) pole "Zastąp specjalnie". Zamiana jest też dozwolona na słabszą. Brak awansu między Typ (Swordsman -> Spearman/Mount NIE).
Tabela, Grecja, epoka Brązu (wynik testu):
| Jednostka gracza | Oferowane (pełne bramki) | Gdy brak Koszar w mieście/ctx | Brak techu Brązownictwo | Epoka imperium = 1 | Brąz = 0 |
|---|---|---|---|---|---|
| Wojownik (Swordsman, Kamień) | Wojownik z mieczem i tarczą; Wojownik mykeński | (brak) | (brak) | (brak) | widok: oba wyszarzone "Brak w magazynie państwa: Brąz"; AI/walidacja: brak |
| Wojownik z mieczem i tarczą | Wojownik; Wojownik mykeński | Wojownik | Wojownik | Wojownik | Wojownik |
| Wojownik mykeński | Wojownik; Wojownik z mieczem i tarczą | Wojownik | Wojownik | Wojownik | Wojownik |
| Włócznik / Oszczepnik / Konnica / Rydwan (woły) | brak (jedyny w Typ lub bez bramek) | — | — | — | — |
| Łucznik (Distance) | Oszczepnik (słabszy, tego samego Typ) | to samo | to samo | to samo | to samo |
Jednostki innych nacji (np. Wojownik germański, z khopesh, fenicki) niewidoczne (unitAllowedForCivNation). Hieros Lochos (Żelazo) dopiero po epoce Żelaza.
Wniosek: dla scenariusza ze zrzutu przycisk "Zastąp" jest pusty/wyszarzony jeśli: (a) jednostka stoi W MIEŚCIE BEZ KOSZAR (bramka per-miasto, a w polu liczy się unia wszystkich miast — niespójność); (b) brak techu; (c) epoka imperium < 2; (d) Brąz = 0 (AI/walidacja). Przy Koszarach+Brązownictwie+Brązie>0 gracz DOSTAJE zamienniki. "Wyższy rząd" poza Typ (np. Wojownik -> Falanga/Hoplita) NIE jest przewidziany regułą — Typ Swordsman != Falangite. To zamierzone według kodu, ale może rozmijać się z oczekiwaniem właściciela. Wskazanie konkretnej przyczyny na zrzucie wymaga stanu zapisu (NIE_ZMIERZONO).

## 4. Dodatek 1 (karta Brąz 542 / 100000, +1350/t)
Nie zmierzono w żywej grze. Spójność: zamiana nie pobiera Brązu, więc "Zastąp" nie zużywa stanu 542. Najprawdopodobniej wyjaśnienie niskiego stanu przy wysokim przychodzie: utrzymanie jednostek brązowych (34 definicje z "Utrzymanie surowiec"=Brąz; 10 Brązu/szt. dla Wojownika z mieczem) — 127 jednostek ~ do ~1270 Brązu/turę, co zjada +1350 brutto (HIPOTEZA, NIE potwierdzona; do osobnego tematu weryfikacji netto/brutto w HUD, bez naprawy w tej rundzie). Blokada "Zastąp" gracza nie wynika z braku surowca przy stanie 542 > 0. AI przy podobnym przychodzie kupiłoby ~90 zamian w jednej turze, bo jedyny koszt to ~11 Pieniądza/szt.

## 5. Decyzje (ABC dla właściciela)
D1 Koszt surowca w "Zastąp" (gracz + AI):
 A) Zostaje tylko Pieniądz (stan obecny). Zaleta: prostota, zgodne z decyzją 2026-07-19. Wada: darmowe 4500 Brązu/90 szt., zamiana tańsza niż rekrutacja.
 B) Dopłata surowca = max(0, surowiec_nowej - surowiec_starej) (analogicznie do Pieniądza); REKOMENDACJA. Wada: AI i gracz częściej blokowani brakiem Brązu.
 C) Pełny koszt surowca nowej jednostki. Wada: najdroższe, zamiana ~ rekrutacja.
D2 Tempo AI: A) bez zmian; B) limit zamian na turę AI (np. max 10 lub 10% armii) — REKOMENDACJA B; C) AI zamienia tylko jednostki w granicach własnego terytorium (parytet z graczem).
D3 Gracz: A) bez zmian (ten sam Typ); B) per-miasto -> unia Koszar także w mieście (spójność z polem); REKOMENDACJA B; C) dodać awans między Typ (Wojownik -> Falanga) przez rozszerzenie "Zastąp specjalnie" w units.json (wymaga listy par od właściciela).
Naprawa kodu nie wykonana: żaden z punktów nie jest jednoznacznym błędem (brak pominięcia limitu/kosztu względem gracza — AI i gracz stosują tę samą regułę kosztu).
