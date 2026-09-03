TEMAT: P-REPO-2-BUNDLE-NIEODTWARZALNE-Q1
RUNDA: 1/5
DATA: 2026-09-03
DOMAIN: PROCESS/INFRA (nie GAME — nie dotyka gra/src ani gra/data)
ŚCIEŻKA: dokumentacja/przygotowanie w dyspozycje/autobot/runs/P-REPO-2-BUNDLE-NIEODTWARZALNE-Q1/,
ewentualna poprawka gra/tools/sync-playtest-bundles.cjs (WYŁĄCZNIE jeśli GOAL 1 tego wymaga)
MODEL+EFFORT: claude-sonnet-5, effort high (przygotowanie do operacji NIEODWRACALNEJ na całym
repo — precyzja krytyczna, ZERO wykonania rewrite historii w tej rundzie, patrz GRANICE)

WYZWALACZ (ECHO właściciela, 2026-09-03)
"Zaakceptuj trwałą utratę tych 2 bundli (BITWA-DUZA, OBLEZENIE-DUZE), idź dalej z filter-repo"
— odpowiedź na pytanie: bramka `filter-repo` (przepisanie historii Gita) jest zablokowana, bo
2 z 8 usuniętych bundli PLAYTEST nie odtworzą się wcale skryptem `sync-playtest-bundles.cjs`.

RECON (nie powtarzaj — już wykonane, patrz REJESTR-PROSB-I-ZADAN.md, wpis
P-REPO-2-BUNDLE-NIEODTWARZALNE-Q1, 2026-08-26)
- Tylko 2 z 8 usuniętych bundli PLAYTEST były kopią bieżącego `Gra-ROBOCZA.html`; pozostałe
  miały md5 `28d236f5` (×4) i `95021308` (×2). `sync-playtest-bundles.cjs` zna 6 nazw —
  `BITWA-DUZA` i `OBLEZENIE-DUZE` NIE odtworzy w ogóle.
- Dziś treść żyje jeszcze w historii Gita (odwracalne). Przepisanie historii (`filter-repo`)
  uczyni utratę NIEODWRACALNĄ dla WSZYSTKICH osób z klonem repo, nie tylko lokalnie.

GOAL — TA RUNDA JEST WYŁĄCZNIE PRZYGOTOWANIEM, NIE WYKONANIEM filter-repo (patrz GRANICE)
1. Ustal DOKŁADNIE, jaki zakres historii/plików ma objąć `filter-repo` (prawdopodobnie usunięcie
   dużych, nieaktualnych bundli PLAYTEST z historii — potwierdź dokładny cel operacji reconem w
   `dyspozycje/`/`docs/decyzje/`, jeśli istnieje wcześniejsze uzasadnienie tej bramki; jeśli
   nie istnieje jednoznaczny zapis celu, zatrzymaj się ze statusem DECISION_REQUIRED zamiast
   zgadywać zakres operacji na całej historii repo).
2. Napisz jawny, czytelny dokument (w katalogu tego tematu) wymieniający DOKŁADNIE które commity/
   pliki/bundle zostaną nieodwracalnie utracone (w tym explicite: `BITWA-DUZA`, `OBLEZENIE-DUZE`,
   oraz każdy inny plik objęty planowanym zakresem filter-repo), z uzasadnieniem że właściciel
   świadomie zaakceptował tę utratę (cytat ECHO wyżej).
3. Przygotuj DOKŁADNĄ komendę `git filter-repo` (lub równoważną), gotową do uruchomienia przez
   orkiestratora — ale NIE URUCHAMIAJ jej. Opisz w raporcie: co dokładnie usuwa, jak wygląda
   rollback PRZED uruchomieniem (np. pełny backup/bundle repo), i że po uruchomieniu rollback
   nie jest możliwy.
4. Jeśli `sync-playtest-bundles.cjs` da się w prosty sposób rozszerzyć o pozostałe 2 nazwy
   (BITWA-DUZA, OBLEZENIE-DUZE) z INNYMI, wciąż w historii dostępnymi źródłami (nie md5
   `28d236f5`/`95021308` — sprawdź czy istnieje jakikolwiek inny, poprawny commit z tymi
   bundlami) — zrób to jako dodatkowe zabezpieczenie PRZED nieodwracalną operacją. Jeśli
   źródła faktycznie nie istnieją (potwierdź reconem, nie zgadnij), pomiń ten punkt i jawnie
   to odnotuj.

KRYTERIA KOŃCA (binarne)
1. Dokument w `dyspozycje/autobot/runs/P-REPO-2-BUNDLE-NIEODTWARZALNE-Q1/` istnieje, wymienia
   każdy tracony element z nazwy, i zawiera dosłowny cytat ECHO właściciela jako dowód zgody.
2. Dokładna komenda `filter-repo` jest przygotowana, opisana krok po kroku, WERYFIKOWALNA (np.
   dry-run lub `--analyze` jeśli narzędzie to wspiera) — ale NIEURUCHOMIONA w tej rundzie.
3. Jeśli GOAL 4 był możliwy — `sync-playtest-bundles.cjs` rozszerzony i przetestowany (żywy
   test odtwarzający bundle ze skryptu). Jeśli niemożliwy — jawnie udokumentowane dlaczego.
4. `tsc --noEmit` czysty (jeśli GOAL 4 dotknął pliku .cjs — sprawdź czy w ogóle jest objęty tsc;
   jeśli nie, pomiń), 5 bramek referencyjnych zielone (nie powinny być dotknięte tym tematem —
   potwierdź że faktycznie nie są).
5. Raport jawnie stwierdza: "filter-repo NIE zostało uruchomione w tej rundzie — wymaga osobnej,
   jawnej autoryzacji orkiestratora/właściciela PRZED wykonaniem, ze względu na nieodwracalność."

ALLOWLISTA (nic poza tym)
- dyspozycje/autobot/runs/P-REPO-2-BUNDLE-NIEODTWARZALNE-Q1/ — nowe pliki dokumentacyjne.
- gra/tools/sync-playtest-bundles.cjs — WYŁĄCZNIE jeśli GOAL 4 jest wykonalny.
- Nowy test w gra/tools/*-test.cjs, WYŁĄCZNIE jeśli GOAL 4 tego wymaga.
Zakazane bezwzględnie: URUCHOMIENIE `git filter-repo` lub jakiejkolwiek innej operacji
przepisującej historię Gita w tej rundzie (patrz GRANICE), pliki z sekretami,
docs/decyzje/<ID>.md, .git/** (poza czytaniem — zero zapisu), dyspozycje/WERSJE.md,
gra-robocza/ROBOCZA-MANIFEST.json, playbook.json, zmiana `gra/src`/`gra/data`.

IZOLACJA
worktree /home/user/wt-repo-bundle-nieodtwarzalne, gałąź
autobot/P-REPO-2-BUNDLE-NIEODTWARZALNE-Q1, baza jawnie: origin/main (najnowszy commit na moment
dispatchu).
Zakaz npm run build/dev w gra/ (export-data nadpisuje JSON). Jedyna dozwolona kompilacja to
node ./node_modules/typescript/bin/tsc --noEmit, jeśli w ogóle dotyczy tej rundy.
ZAKAZ BEZWZGLĘDNY: `git filter-repo`, `git filter-branch`, `git push --force` na `origin/main`,
lub jakakolwiek inna komenda modyfikująca istniejącą historię Gita, w tym w worktree Operatora.

REGUŁA PRZECIW SAMOOSZUKIWANIU (ANTY-HALUCYNACYJNA)
Zakaz uznania GOAL 4 za "niemożliwy" bez faktycznego reconu w historii Gita (np.
`git log --all --oneline -- <ścieżka>`) szukającego alternatywnego, poprawnego źródła dla
BITWA-DUZA/OBLEZENIE-DUZE — nie zgadywać, sprawdzić. Zakaz przygotowania komendy filter-repo
"na oko" bez zweryfikowania jej dokładnego zakresu (np. przez `--analyze` lub dry-run trybu
narzędzia, jeśli istnieje) — błędny zakres na operacji nieodwracalnej jest nie do naprawienia.

PROCEDURA NAPRAWCZA PRZY FAIL
Evaluator wskazuje jeden konkretny defekt i poprawkę; runda N+1 idzie na TYM SAMYM ID i TEJ
SAMEJ gałęzi, nie na nowej od zera. Po 5 rundach: LIMIT-5-EXCEEDED.

GRANICE
Operator/Evaluator/Obrona nie integrują, nie deployują, nie pushują, i W SZCZEGÓLNOŚCI NIE
URUCHAMIAJĄ filter-repo — to jest jedyny cel tej bariery, powtórzony celowo trzykrotnie w tym
dokumencie. Faktyczne uruchomienie filter-repo (jeśli w ogóle nastąpi) wymaga OSOBNEJ, jawnej
autoryzacji poza tym dispatchem, bezpośrednio od właściciela, bezpośrednio przed wykonaniem.

OBIEG
Operator (Sonnet 5, effort high) → Evaluator (Sonnet 5, effort high) → Operator (obrona, jeśli
zarzuty niepuste) → Final Control (Sonnet 5) → orkiestrator wraca do właściciela z gotowym
planem i PROSI O OSTATECZNĄ, JAWNĄ ZGODĘ na uruchomienie filter-repo — READY_FOR_DEPLOY tego
tematu oznacza "plan gotowy", NIE "wykonane".
