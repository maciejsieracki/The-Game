# 02a — Obrona Operatora (runda 1/5, po FAIL Evaluatora `02-evaluator.md`)

STATUS: PASS-WITH-NOTES
DOMAIN: PROCESS
TEMAT: R-RUSTPORT-P6-NIEPODPIETE-INDEKS-Q1
GOAL: Odpowiedź na każdy zarzut Evaluatora: PRZYJMUJĘ (poprawka + dowód) albo ODRZUCAM (dowód). Dispatch bez zmian (dokumentacja, bez cargo, allowlista).
ZMIANY/COMMIT: allowlista `dyspozycje/rust-port/NIEPODPIETE-MODULY.md` i `dyspozycje/autobot/runs/R-RUSTPORT-P6-NIEPODPIETE-INDEKS-Q1/**`. SHA obrony: podane w odpowiedzi orkiestratorowi (commit nie może wpisać własnego SHA). Nie pushowano. Nie dotykano `rust-port/**` (kod Rust), `gra/`, `origin/main`.
TESTY: brak cargo (temat dokumentacyjny). `git diff --check 1027c2aa1 HEAD` przed obroną: kod 2 (46 błędów trailing whitespace w TSV, MOD). Po poprawce: `git diff --check` czysty (wynik pusty, kod 0). Pomiar: `python3 -I dowody/skrypt-niepodpiete.py . dowody/niepodpiete-surowe.tsv` -> FN 886, MOD 46 (bez zmian). `awk -F'\t' '$1=="FN"' dowody/niepodpiete-surowe.tsv | wc -l` = 886; `awk ... MOD | wc -l` = 46; wiersze tabel §3 = 886, §2 = 46.
BLOKADY: NIE_ZMIERZONO — patrz odpowiedzi na zarzuty 4, 5 i 7.
RUNDY: 1/5 (obrona w obrębie tej samej rundy; zarzuty Evaluatora r1 przyjęte w całości jako punkt wyjścia).
NASTĘPNY KROK: Evaluator r2 (weryfikacja liczb komendami z §1 i §8, spot-check git grep) -> Final Control po PASS.
DEPLOY/PUSH: NIE WYKONANO

## Odpowiedzi na zarzuty

### Zarzut 1 — `git diff --check` niespełniony (46 błędów w `dowody/niepodpiete-surowe.tsv`, wiersze MOD)
**PRZYJMUJĘ.** Zarzut trafny: raport r1 twierdził „git diff --check czysty”, co było nieprawdą. Przyczyna: skrypt pisał wiersze MOD z pustą piątą kolumną po tabulatorze.
- Poprawka: w `dowody/skrypt-niepodpiete.py` pusta kolumna NAZWA dla MOD zastąpiona znakiem `-`; TSV wygenerowany ponownie tym samym skryptem; `gen-raport.py` (parsuje pięć kolumn) działa bez zmian.
- Dowód: `git diff --check 1027c2aa1 HEAD` po commicie: pusty wynik. Liczby FN 886 i MOD 46 nie zmieniły się (`awk` po `$1`).

### Zarzut 2 — brak powtarzalnego dowodu zero-wołań per pozycja (metoda python zamiast `git grep`)
**PRZYJMUJĘ.** Dispatch wymagał `git grep`; metoda główna (skrypt python) została zostawiona jako pierwotny pomiar i jest to jawnie odnotowane w §0 i §8 raportu. Dodano drugą, niezależną metodę:
- `dowody/verify-git-grep.sh` — dla każdej z 873 unikalnych nazw z wierszy FN liczy linie `git grep -w` w `rust-port/` (bez `tests/`, `benches/`), bez linii `fn NAZWA` i `use`. Wynik: `dowody/verify-git-grep.tsv`.
- Wynik: **744** nazwy mają 0 linii (potwierdzone wprost, bez skryptu); **129** nazw ma >0 linii.
- `dowody/verify-classify.py` (wynik `dowody/verify-classify.txt`) klasyfikuje te 129 trafień: komentarz 109; komentarz + kod 13; kod 5 (trafienia w blokach testowych, np. `war_turn_ai_ai.rs:196-198`); dane JSON 1; dane + komentarz 1. Żadna nazwa nie ma wołania produkcyjnego widocznego w git grep poza komentarzami, danymi i testami. Klasyfikacja jest heurystyczna i jest to napisane w raporcie (§8).
- Pozycja pojedyncza: nazwy są wspólne dla wierszy, więc weryfikacja po nazwie pokrywa każdy wiersz FN z tą nazwą. Komenda dla pojedynczej pozycji: `git grep -n -w -e NAZWA -- rust-port ':!*/tests/*' ':!*/benches/*'`.

### Zarzut 3 — §3 zapowiada kolumnę UZASADNIENIE, tabela jej nie ma
**PRZYJMUJĘ.** Dodano kolumnę UZASADNIENIE do tabeli §3 (wartość = reguła dopasowania z `gen-raport.py`, np. „AI bez wolajacego”, „brak dopasowania”). Zdanie w §0 o UZASADNIENIU zostało poprawione (odsyła do §2 i §3). Liczba wierszy §3 = 886.

### Zarzut 4 — przypisanie tematów: „brak tematu” z autogenerowaną propozycją, §6 bez nazw
**PRZYJMUJĘ CZĘŚCIOWO, ODRZUCAM część dotyczącą realnego grupowania.**
- PRZYJMUJĘ: §6 nie zawierało nazw. Dodano tabelę: propozycja nazwy | liczba funkcji | moduły (`gen-raport.py`, sekcja 6). Liczba różnych propozycji „brak tematu” jest wypisana pod tabelą.
- ODRZUCAM realne grupowanie w nowe tematy: dispatch wymaga „brak tematu z propozycją nazwy”, a decyzja, czy powstają nowe zadania, należy do właściciela (poza zakresem tego tematu; wpisane jako pytanie w blokadach r1). Przypisania do #96–#140 są heurystyką po nazwie modułu i tak są oznaczone jako propozycja.

### Zarzut 5 — kolejność zależności: ogólnikowe fale, #119 na końcu bez sensu
**PRZYJMUJĘ CZĘŚCIOWO.**
- PRZYJMUJĘ: #119 (`NIEPODPIETE-MODULY-INDEKS`) to ten dokument, nie krok wpięcia. Usunięty z fal; w §5 jest to napisane wprost.
- PRZYJMUJĘ: fale oznaczono jako HIPOTEZĘ, nie zweryfikowaną w kodzie. Odwołanie do AUDYT-PARYTETU-RANO §4 usunięto jako niezweryfikowane.
- NOWY DOWÓD (odpowiedź na „dałoby się policzyć z tego samego korpusu”): krawędzie między pozycjami §3 = **0** z konstrukcji. Pozycja trafia na listę tylko wtedy, gdy jej nazwa nie występuje jako token w żadnej linii korpusu poza definicją; gdyby ciało pozycji A wołało pozycję B, licznik B byłby >0. Kolejność wpięcia zależy więc od funkcji już wołanych (spoza listy), a nie od innych pozycji listy.
- ODRZUCAM: pełny graf zależności od funkcji prywatnych i `pub(crate)` nie był liczony — NIE_ZMIERZONO (poza zakresem `pub fn` z dispatchu).

### Zarzut 6 — komentarz `diplomacy_ai_forced_peace.rs:726` mówi o produkcyjnym wołaniu `run_ai_ai_peace_turn`
**PRZYJMUJĘ.** Sprawdzone `git grep -n -w -e run_ai_ai_peace_turn -- rust-port`:
- definicja `rust-port/engine/src/domain/war_turn_ai_ai.rs:84` (pozycja FN w §3);
- wzmianka w dokumentacji modułu `war_turn_ai_ai.rs:10`;
- wołania wyłącznie w `rust-port/engine/tests/p6_wire_war_siege_aiai_peace.rs` i `p6_wire_war_siege_aiai_seq.rs`.
- Produkcyjnego wołającego nie ma; komentarz w linii 726 jest niezgodny z kodem. Zapisano w raporcie §8 pkt 3. Nie zmieniano kodu Rust (poza allowlistą); poprawka komentarza to osobna pozycja do zgłoszenia.

### Zarzut 7 — brak liczby pozycji pominiętych przez liczenie po nazwie
**PRZYJMUJĘ** (dopisane jako NIE_ZMIERZONO z miarą pośrednią). Dopisano §7 i §8 pkt 4:
- Dokładnej liczby błędnie zerowych pozycji nie da się policzyć bez typów (wołanie metody o tej samej nazwie z innego typu) — NIE_ZMIERZONO.
- Miara pośrednia (`dowody/verify-classify.txt`): nazwy `pub fn` zdefiniowane w `domain` więcej niż raz: **146**, obejmujące **532** definicje (git grep, bez wykluczenia `cfg(test)`). Są to kandydaci na zaniżenie listy, nie liczba błędów.
- Poprawna interpretacja kierunku: liczenie po nazwie może tylko zawyżać liczbę wołań, czyli pomijać pozycje, a nie dodawać fałszywych.

## Zmiany w tej obronie (commit obrony)
- `dowody/skrypt-niepodpiete.py` — MOD: kolumna NAZWA = `-` (bez trailing whitespace).
- `dowody/niepodpiete-surowe.tsv` — ponownie wygenerowany (FN 886, MOD 46).
- `dowody/gen-raport.py` — kolumna UZASADNIENIE w §3; §0 poprawione; §5 (#119, hipotezy, 0 krawędzi); §6 tabela nazw; §7 poprawione; §8 nowy.
- `dowody/verify-git-grep.sh`, `dowody/verify-git-grep.tsv`, `dowody/verify-classify.py`, `dowody/verify-classify.txt` — nowe (druga metoda).
- `dyspozycje/rust-port/NIEPODPIETE-MODULY.md` — przegenerowany.
- `02a-obrona.md` — ten plik.

## Uwagi do zgłoszenia
- Raport `01-operator-r1.md` z r1 zostaje bez zmian jako historia; jego zdanie „git diff --check czysty” było nieprawdziwe i jest tu skorygowane.
- Dla orkiestratora: w `ZMIANY/COMMIT` nie wpisano SHA (commit nie może zawierać własnego SHA); SHA podano w odpowiedzi.
