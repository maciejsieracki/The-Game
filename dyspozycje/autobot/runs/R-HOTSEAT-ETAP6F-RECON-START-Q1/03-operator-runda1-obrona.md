# R-HOTSEAT-ETAP6F-RECON-START-Q1 — Operator, Obrona runda 1

STATUS: PASS-WITH-NOTES
DOMAIN: INFORMATIONAL
TEMAT: R-HOTSEAT-ETAP6F-RECON-START-Q1
GOAL: Recon kategorii "start gry/wybór cywilizacji" (6/6, ostatni pod-etap Etapu 6).
ZMIANY/COMMIT: `dyspozycje/autobot/runs/R-HOTSEAT-ETAP6F-RECON-START-Q1/01-operator-runda1.md`
poprawiony w tej rundzie (docs-only, zero zmian w `gra/`): dodano pominiętą
`restoreAiRosterFromSave` do inwentarza §1 i kategorii migracji (i) §3, skorygowano fałszywe
"zero nakładania Etapu 1" w §0, naprawiono błędną atrybucję linii 7557 i logu
`fillAiOwnerCivMap` (34042), przeliczono narzędziem (`python3`, suma ZBIORU unikalnych linii)
sumę main.ts 47→53 i sumę całkowitą 57→63, poprawiono mnożnik 3.8×→4.2×, przeliczono podział
(i)/(ii) na 3/52 miejsca (11+52=63).
TESTY: Świeże `grep -n "assignAiCivTypes("` (3 trafienia: 2139/7524/7555), `grep -n
"fillAiOwnerCivMap("` (7516/10552/34041), `grep -n "isAiOwner(humanSeats"` (trafienie 7570
wewnątrz `restoreAiRosterFromSave`), `Read` main.ts:7538-7574 i main.ts:34036-34045,
`Read` main.ts:10548-10556, arytmetyka `python3` (sumowanie zbioru unikalnych linii, nie sumy
bucketów — kod wklejony w dokumencie §1) dająca main.ts=53, suma=63.
BLOKADY: 1 ABC do rozstrzygnięcia przy implementacji (dev/quick-start ścieżki: drugi sztywny
civ czy single-seat-only) — nie blokuje zamknięcia recon.
RUNDY: 1/5

OBRONA:

1 -> PRZYJMUJĘ. `grep -n "assignAiCivTypes(" gra/src/main.ts` → dokładnie 3 trafienia
(2139, 7524, 7555), trzecie wewnątrz `restoreAiRosterFromSave` (`Read` main.ts:7538-7574,
def na 7538, wołanie main.ts:36058). Dodano jako trzecią pozycję w inwentarzu §1 (main.ts)
i w kategorii migracji (i) §3, z pełnym rozbiciem linii (7538/7549/7550/7555/7557/36058 — 6
linii).

2 -> PRZYJMUJĘ. `grep -n "isAiOwner(humanSeats" gra/src/main.ts` → trafienie na main.ts:7570,
fizycznie wewnątrz zakresu `restoreAiRosterFromSave` (7538-7574, `Read` potwierdza). Twierdzenie
"zero nakładania Etapu 1" w §0 dotyczyło tylko 2 z 3 funkcji o tym samym celu — poprawione
jawną notatką w §0 z odesłaniem do tej linii i konsekwencją dla planu migracji (i) w §3.

3 -> PRZYJMUJĘ. `grep -n "fillAiOwnerCivMap("` → 7516 (def), 10552, 34041 (2 realne call
site'y) — linia 7557 leży w `restoreAiRosterFromSave` (7538-7574), nie w `fillAiOwnerCivMap`.
`Read` main.ts:34036-34045 pokazuje log `console.log(...)` bezpośrednio po wołaniu na 34042 —
to prawdziwy "log" bucketu, nie 7557. Bucket `fillAiOwnerCivMap` poprawiony na
7516/7526/10552/34041/34042; suma main.ts przeliczona narzędziem (`python3`, zbiór unikalnych
linii, bo `34041` fizycznie pokrywa się też z bucketem `_menuCivId`/`applyMenuParams`) na 53,
suma całkowita na 63 — wyższa niż stare 57, zgodnie z przewidywaniem zarzutu.

4 -> PRZYJMUJĘ CZĘŚCIOWO Z KOREKTĄ WŁASNEGO BŁĘDU. Zarzut o buckecie literałów New Game
(9 vs 10) był trafny i już naprawiony w dokumencie (bucket = 10, po odjęciu nakładania 35019/
35240 z bucketem `applyMenuParams` — potwierdzone `python3`: zakresy sumują się do 12 linii
surowo, minus 2 nakładające = 10). Przy przeliczaniu całości w tej Obronie wykryłem WŁASNY
nowy błąd arytmetyczny (nie zarzucony przez Evaluatora): moja pierwsza wersja poprawki sumowała
długości bucketów wprost (12+5+5+11+10+4+1+6=54), co PONOWNIE liczyło linię `34041` (należącą
jednocześnie do bucketu `_menuCivId`/`applyMenuParams` i do `fillAiOwnerCivMap`). Poprawne
sumowanie zbioru unikalnych linii (kod `python3` w dokumencie §1, uruchomiony i zweryfikowany:
wynik 53) daje main.ts=53, sumę całkowitą=63 — nie 54/64. Dokument §1 zawiera teraz jawną notkę
o tym mechanizmie nakładania i skrypt do powtórnej weryfikacji.

5 -> PRZYJMUJĘ. `restoreAiRosterFromSave` dodana jako trzecia pozycja kategorii (i) w §3,
z rozszerzonym planem dowodu no-op (dodatkowy test: legacy-save bez `meta.aiOwnerCivMap`
wczytany przed/po zmianie, porównanie odtworzonego rosteru) i notatką o częściowym nakładaniu
z Etapem 1 (linia 7570, zarzut 2) — reszta funkcji (7566-7573) jest już per-human, migracja
dotyczy tylko wywołania `assignAiCivTypes` (7549-7557). Podział (i)/(ii) przeliczony na 3/52
miejsca (11+52=63, zgodne z nową sumą całkowitą).

Spójność końca dokumentu: §2 (mnożnik), §3 (podział i/ii i suma 11+52=63) i §4 (Wynik) zostały
zaktualizowane razem, tak by żadna sekcja nie odwoływała się już do starych liczb 47/54/57
inaczej niż jako jawnie oznaczone "przed korektą" (uniknięcie błędu Etapu 6b runda 1).

NASTĘPNY KROK: Evaluator — weryfikacja poprawek tej Obrony (§0, §1, §2, §3, §4), w
szczególności świeże przeliczenie sumy main.ts=53/suma=63 i sprawdzenie braku dalszych
nakładań linii między bucketami.
DEPLOY/PUSH: NIE WYKONANO
