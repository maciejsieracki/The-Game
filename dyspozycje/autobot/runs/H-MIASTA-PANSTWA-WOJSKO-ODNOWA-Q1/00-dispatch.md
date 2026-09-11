# 00-dispatch — H-MIASTA-PANSTWA-WOJSKO-ODNOWA-Q1

STATUS: OPERATOR
DOMAIN: GAME
TEMAT: H-MIASTA-PANSTWA-WOJSKO-ODNOWA-Q1
GOAL: Zastosować nowe reguły liczby jednostek startowych zależnie od trudności oraz potwierdzić i naprawić, jeśli trzeba, przydzielanie i co-turę uzupełnianie wojska/HP bez naruszenia ustawień państw-miast gracza z kreatora.

## Wyzwalacz

Bezpośrednie zlecenie właściciela z 2026-09-11: państwa-miasta obcych cywilizacji AI mają szybciej padać; jednocześnie właściciel poprosił o sprawdzenie, czy przydzielanie i uzupełnianie wojska w jednostkach działa poprawnie.

## Wymagane zachowanie

1. Jednostki startowe gracza: łatwy = 1, normalny = 2, trudny = 3.
2. Państwa-miasta należące do innych cywilizacji AI: łatwy = 2, normalny = 1, trudny = 0.
3. Państwa-miasta związane z cywilizacją/fotelem gracza: liczba pozostaje sterowana ustawieniem państw-miast w kreatorze i nie dziedziczy głównej trudności gry.
4. Zweryfikować żywą ścieżkę przydziału/uzupełniania wojska, w tym HP jednostek i pulę Manpower; nie zmieniać parametrów bez dowodu, że obecna implementacja nie realizuje wymogu.

## Kryteria binarne

- [ ] K1: test jednostkowy/behawioralny potwierdza tabelę 1/2/3 dla gracza dla easy/normal/hard.
- [ ] K2: test potwierdza tabelę 2/1/0 dla obcych państw-miast AI.
- [ ] K3: test potwierdza, że państwo-miasto gracza używa `_menuCityStateDifficulty`/odpowiednika kreatora niezależnie od `_menuDifficulty`, także w hot-seat, jeśli ścieżka jest dostępna.
- [ ] K4: testuje się oba strukturalne miejsca spawnu państwa-miasta, bez sprawdzania samej funkcji w izolacji.
- [ ] K5: istniejąca ścieżka odnowy Manpower i HP jest sprawdzona na rzeczywistym resolverze: normal 30%, easy 40%, hard 20% maxHP/turę, 2% max Manpower/turę, cap, brak puli, oblężenie i zapis do żywego obiektu.
- [ ] K6: parytet gracz/AI jest jawny; wyjątek obcego państwa-miasta wynika wyłącznie z niniejszej decyzji i jest pokryty testem.
- [ ] K7: test mutacyjny czerwieni po zmianie jednej wartości tabeli albo usunięciu rozróżnienia gracz/obce państwo-miasto.
- [ ] K8: TypeScript 5.9.3 oraz pięć bramek referencyjnych przechodzą, albo blokada środowiska jest udokumentowana rzeczywistym wynikiem.
- [ ] K9: brak zmian poza allowlistą i brak zmian w `main` checkoutu nadrzędnego.

## Allowlista

- `gra/src/main.ts` — wyłącznie startowy spawn państw-miast/gracza oraz call-site'y odnowy, jeśli Operator udowodni konkretny defekt.
- `gra/src/game/ai-difficulty-bonus.ts` — funkcje czystej kalkulacji liczby jednostek startowych.
- `gra/src/game/manpower.ts` — wyłącznie jeśli audyt wykaże błąd przydziału/odnowy HP lub Manpower.
- `gra/src/game/turn-economy.ts` — wyłącznie jeśli audyt wykaże brak/niepoprawne wywołanie odnowy.
- `gra/tools/` — test tematu i ewentualne rozszerzenie istniejących bramek.
- `dyspozycje/autobot/runs/H-MIASTA-PANSTWA-WOJSKO-ODNOWA-Q1/` — raporty procesu.

Zakazy: `WERSJE.md`, `gra-robocza/**`, ręczna zmiana playbooka/reguł AutoBota, merge, push i deploy. Nie zmieniaj mechaniki HP/Manpower tylko dlatego, że istnieje w zakresie audytu — naprawiaj wyłącznie dowiedziony defekt.

## Plan testów

1. Odczyt istniejących testów `city-state-start-units-test.cjs`, `city-state-start-units-live-test.cjs`, `ai-difficulty-bonus-test.cjs` i bramek Manpower.
2. Testy scenariuszy startu dla trzech trudności i dwóch klas państw-miast.
3. Test realnego call-site'u obu ścieżek spawnu.
4. Test odnowy Manpower/HP i synchronizacji live unit/save.
5. Mutacje nietautologiczne.
6. `node ./node_modules/typescript/bin/tsc --noEmit`, bramki referencyjne i `git diff --check`.

## Reguła przeciw samooszukiwaniu

Nie uznawać zielonej funkcji `cityStateStartUnitCount()` za dowód: test musi przejść przez oba call-site'y spawnu i rozróżnić cywilizację/fotel gracza od obcego typu AI. Nie uznawać samego paska na ekranie za dowód odnowy HP: sprawdzić liczby przed/po, pulę Manpower, cap i zapis żywego obiektu.

## Procedura naprawcza

Przy FAIL Operator poprawia wyłącznie wskazany defekt w tej samej gałęzi i zachowuje ten sam ID. Przy niejednoznaczności technicznej rozstrzyga sam; pytanie do właściciela tylko wtedy, gdy wynik zmienia produkt, balans lub odwracalność.

## Routing

Provider: OpenAI (obowiązujący wybór właściciela dla subagentów).
Operator: `gpt-5.6-luna`, effort `high`.
Evaluator: `gpt-5.6-luna`, effort `xhigh`.
Final Control: `gpt-5.6-luna`, effort `max`, osobny subagent.

Worktree: `/home/ubuntu/projects/The-Game-worktrees/H-MIASTA-PANSTWA-WOJSKO-ODNOWA-Q1`
Branch: `hermes/H-MIASTA-PANSTWA-WOJSKO-ODNOWA-Q1`
Baza: `origin/main` @ `46bfc81e`

PUSH/DEPLOY: NIE WYKONANO

## Hermes Kanban — próba kontrolowana 2/5

BOARD: default
PARENT_TASK_ID: N/D przed utworzeniem karty
DEPENDENCY_TASK_IDS: []
IDEMPOTENCY_KEY: H-MIASTA-PANSTWA-WOJSKO-ODNOWA-Q1:operator:r2:kanban
WORKSPACE: dir:/home/ubuntu/projects/The-Game-worktrees/H-MIASTA-PANSTWA-WOJSKO-ODNOWA-Q1-kanban-r2
KANBAN_STATUS: DISPATCHED

Poprzedni run r1 uruchomiono poza Kanbanem i zatrzymano przed raportem terminalnym; nie jest źródłem routingu. Zachowano jego worktree bez czyszczenia. Ta próba jest kontrolowanym r2 i nie resetuje licznika.
