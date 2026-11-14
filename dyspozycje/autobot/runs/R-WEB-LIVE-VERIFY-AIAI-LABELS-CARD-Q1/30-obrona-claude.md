STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-LIVE-VERIFY-AIAI-LABELS-CARD-Q1
GOAL: dowód na żywo (zrzut + odczyt DOM), że karta AI w wojnie AI↔AI pokazuje na liście „W stanie wojny z” OBA znaczniki (strona rozmówcy i partnera), a wojna gracz↔AI bez regresji. Ta runda: odpowiedź na 5 zarzutów Evaluatora (kandydat bc7b59286, baza 3cc49c07b).
ZMIANY/COMMIT: tylko korekta raportu (ten plik). Kod, runner, JSON i PNG bez zmian względem bc7b59286. Zero zmian w gra/src, gra/data, WERSJE.md (git diff --stat 3cc49c07b bc7b59286 -- gra/src gra/data WERSJE.md: pusty; git diff --check: czysty).

## Odpowiedzi na zarzuty Evaluatora

### Zarzut 1 (raport 10-operator-claude.md, l.16 — „nie ma wiersza z nazwą AI”): PRZYJĘTY
Zarzut jest trafny. Operator błędnie napisał, że w wojnie gracz↔AI nie pojawia się wiersz z nazwą AI. Dowód z evidence/b2-war-seed271828-player-regress.json, pole probes[].audience_1 (tekst karty), kolejno dla tur 5, 10 i 16:
- T5: „Ty\nZmęczenie wojną 20%\nCeltowie\nZmęczenie wojną 20%”
- T10: „Ty\nZmęczenie wojną 45%\nCeltowie\nZmęczenie wojną 45%”
- Łącznie w tym pliku 13 trafień „Zmęczenie wojną”, zgodnie z grep -o.
Wiersze „Ty” i „Celtowie” są więc w sekcji „Relacje z innymi” / „W stanie wojny z” karty Celtowie, a kryterium „dwa wiersze (Ty, nazwa AI)” jest SPEŁNIONE. Pomylił się operator, patrząc na listę „W stanie wojny z” i na klasę .da-rel-war-wear zamiast na pełny tekst wiersza. Korekta: w wojnie gracz↔AI karta AI pokazuje dwa wiersze (Ty + nazwa AI) z wartościami zmęczenia; brak regresji nadal zachodzi (porównanie z bazą z raportu R-WEB-LIVE-VERIFY-WAVE-689-697-B2-PANEL-AIAI-CITYCHANGE-Q1 nie zmienia się przez tę korektę). Zdanie z raportu 10 („w karcie AI nie pojawia się wiersz z nazwą AI ani w bazie, ani teraz”) uznaję za nieprawdziwe i nie jest podstawą wyniku.

### Zarzut 2 (runner nie wyciąga strukturalnie wierszy gracz↔AI; warWear to tylko .da-rel-war-wear): ODRZUCAM jako defekt, przyjmuję jako uwagę
Stan faktyczny: gra/tools/live-verify-aiai-labels-run.cjs zapisuje pole warWear (wszystkie .da-rel-war-wear w karcie AI) oraz warWearCount. Wiersze gracza są w tekście karty, czyli w probes[].audience_1, nie w warWear. Dispatch nie wymagał osobnego pola dla wojny gracz↔AI; wymagał „odczyt dwóch wierszy bez regresji” i „odczyt DOM jako JSON w evidence”. Oba warunki są spełnione przez audience_1 (patrz zarzut 1). Dodanie pola strukturalnego oznaczałoby ponowne uruchomienie runnera (ok. 240 s na ziarno plus bundle), czego dispatch nie wymagał, więc nie wykonano. Uwaga do orkiestratora: przy następnej rundzie runnera warto dopisać strukturalne pole dla wierszy wojny gracza.

### Zarzut 3 (zrzuty pełnoekranowe; brak dowodu dla tur od 11; baner „POKÓJ”): PRZYJĘTY W CZĘŚCI (doprecyzowanie), ODRZUCONY W CZĘŚCI
- Zrzuty *-aud1.png są pełnoekranowe, a nie wycinkiem karty. Karta AI jest na nich czytelna: obejrzałem evidence/b2-aiwar-seed271828-T10-aud1.png i widać w niej sekcję „Relacje z innymi” > „W stanie wojny z” z dwoma wierszami („Zulusi Celtowie: Zmęczenie wojną 45%” i „Zulusi: Zmęczenie wojną 45%”). Wycinek nie jest wymagany przez kryteria dispatchu (zrzut karty + JSON z oboma znacznikami); opis zostaje jako NIE_ZMIERZONO-uwaga (a).
- Baner „POKÓJ” na zrzucie aud1 dotyczy lewej strony audiencji (Rzymianie = gracz) i prawej (Celtowie), czyli relacji gracz↔Celtowie, a NIE wojny AI↔AI. Operator tego nie napisał wprost; przyjmuję korektę.
- Pliki *-notif.png nie pokazują karty: obejrzałem evidence/b2-aiwar-seed271828-T10-notif.png, to widok mapy z powiadomieniem „Produkcja: Rzym” bez otwartej karty AI. Dowodem karty są wyłącznie *-aud1.png i JSON. Ten fakt dopisuję do raportu.
- Brak dowodu dla tur od 11: wojna AI↔AI kończy się pokojem w turze 11 w obu ziarnach (peaceUntilTurn 51). Już zapisane jako NIE_ZMIERZONO (b) w raporcie 10; ODRZUCAM zarzut, że to „ukryty” brak, bo był jawnie wpisany.

### Zarzut 4 (brak powtórzenia runnera na żywo i dowodu mutacyjnego): ODRZUCAM
- Dispatch nie wymaga ponownego uruchomienia runnera przez Obronę ani dowodu mutacyjnego. Kandydat nie wprowadza poprawki w gra/src, więc test mutacyjny nie ma zastosowania. Obrona nie uruchamiała ponownie runnera (NIE_ZMIERZONO w tej rundzie). Dowody z bc7b59286 są zapisane i zacommitowane, zgodnie z kryteriami dispatchu.

### Zarzut 5 (00-dispatch.md nie istnieje w origin/main): ODRZUCAM (zgłoszone już w raporcie 10)
Weryfikacja: git cat-file -e origin/main:dyspozycje/autobot/runs/R-WEB-LIVE-VERIFY-AIAI-LABELS-CARD-Q1/00-dispatch.md → fatal: path does not exist, exit 128. Treść zadania pochodzi z DODATKU 00-dispatch-DODATEK-claude.md na gałęzi claude/sprawdzenie-funkcjonalnosci-ek4ra0 (zgodnie z treścią zadania Obrony). To jest stan repo, nie błąd Operatora, i jest już w UWAGACH-DLA-ORKIESTRATORA raportu 10.

## Wyniki sprawdzeń Obrony (surowe)
- git checkout --detach bc7b592869b620ae8c584252ea361855cfb43013: HEAD = bc7b59286 (OK).
- Odczyt probes[].audience_1 w trzech JSON: player-regress T5/T10/T16 zawiera „Ty”+„Celtowie” z wartościami zmęczenia w T5 i T10 (T16: brak wojny, zgodnie z pokojem od tury 11); aiwar-271828 T5/T10 warWearCount=2 (oba wiersze zawierają „Zulusi Celtowie: … Zulusi: …”), T16 0; aiwar-314159 T5/T10 warWearCount=2 („Hetyci Chińczycy: …”), T16 0.
- Zrzuty: aud1 T10 271828 obejrzany (Read); notif T10 271828 obejrzany (Read), bez karty.
- git diff --check 3cc49c07b bc7b592 -- dyspozycje gra/tools: exit 0 (czysto).
- git diff --stat 3cc49c07b bc7b592 -- gra/src gra/data WERSJE.md: pusty.

## Korekty do raportu 10 (zapisane tutaj, raport 10 nietknięty)
1. Zdanie „w karcie AI nie pojawia się wiersz z nazwą AI” (raport 10, sekcja TESTY, wojna gracz↔AI) — NIEPRAWDA. Prawidłowo: karta AI w wojnie gracz↔AI pokazuje dwa wiersze „Ty” i „Celtowie” (wartości zmęczenia 20% w T5, 45% w T10), źródło: probes[].audience_1 w evidence/b2-war-seed271828-player-regress.json.
2. Baner „POKÓJ” na zrzutach aud1 dotyczy relacji gracz↔Celtowie, nie wojny AI↔AI.
3. Pliki *-notif.png nie zawierają karty AI; dowodem karty są *-aud1.png i JSON.
4. Dla ziarna 314159 etykiety z rowText brzmią „Hetyci Chińczycy: Desperacja 23% Hetyci: Zmęczenie wojną 45%” (T10); raport 10 skrócił je do „Chińczycy: …”, co jest zgodne z treścią, ale nie dosłowne.

## Podsumowanie wyniku
- Kryteria binarne dispatchu: AI↔AI 271828 — PRAWDA (T5, T10: po 2 znaczniki, JSON + zrzut aud1); AI↔AI 314159 — PRAWDA (T5, T10: po 2 znaczniki, JSON + zrzut aud1); gracz↔AI — PRAWDA (dwa wiersze „Ty”/„Celtowie”, bez regresji względem bazy).
- NIE_ZMIERZONO: (a) zrzuty pełnoekranowe, nie wycinek karty; (b) brak dowodu dla tur ≥11 (pokój w turze 11 w obu ziarnach); (c) ponowne uruchomienie runnera i dowód mutacyjny nie były wykonywane w tej rundzie; (d) T20/T22 poza zakresem.

BLOKADY: brak krytycznych. Zarzut 2 jest uwagą do przyszłej rundy runnera (strukturalne pole dla wierszy gracza).
RUNDY: 1/5 (obrona, odpowiedź na zarzuty Evaluatora r1)
NASTĘPNY KROK: Evaluator r2 (lub Final Control) weryfikuje korektę tego raportu względem evidence/*.json i aud1 PNG; po FC PASS integracja runnera i dowodów do main (orkiestrator).
DEPLOY/PUSH: NIE WYKONANO

UWAGI-DLA-ORKIESTRATORA:
- origin/main nie zawiera 00-dispatch.md tego tematu; treść z DODATKU na claude/sprawdzenie-funkcjonalnosci-ek4ra0.
- Kandydat bc7b59286 i ten commit Obrony różnią się tylko plikiem raportu 30-obrona-claude.md.
- Runner gra/tools/live-verify-aiai-labels-run.cjs zapisuje warWear tylko dla .da-rel-war-wear; wiersze gracza są w audience_1. Przy następnej rundzie runnera dopisać pole strukturalne (zarzut 2).
- node_modules w gra/ zainstalowane w worktree Operatora (gitignored): do usunięcia przy sprzątaniu worktree po FC.
