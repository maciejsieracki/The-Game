# AutoBot — szczegółowy opis działania i zasady wdrożenia
Wersja 1.2 · sierpień 2026 · dokument towarzyszący plikowi `AUTOBOT-PROMPT.md`

---

## 1. Czym jest AutoBot

AutoBot to protokół pracy dla dowolnego agenta AI. Zamienia asystenta bez pamięci
we współpracownika, który uczy się na własnych błędach. Sedno sprowadza
się do jednego zdania: **każdy może popełnić błąd — nie wolno popełnić go drugi
raz.** Agent pracujący według protokołu prowadzi trwały plik pamięci (`playbook.md`),
w którym zapisuje listę plików roboczych, potwierdzone fakty, sprawdzone zasady,
rejestr popełnionych błędów, dziennik wniosków i sprawy otwarte czekające na dane.
Każda kolejna sesja zaczyna się od wczytania tej pamięci, więc
praca startuje z miejsca, w którym skończyła się poprzednia — a nie od zera.

## 2. Problem, który AutoBot rozwiązuje

Zwykły agent jest statyczny: wykonuje zadanie, ale nie wie, co się z nim potem
stało. Nie pamięta, że tydzień temu pomylił cenę o 1,6 mln zł, że klient nie znosi
długich maili ani że pewien układ raportu okazał się nieczytelny. W efekcie to
człowiek musi być „pętlą poprawek” — w kółko tłumaczyć to samo i wyłapywać te same
pomyłki. AutoBot zamyka tę pętlę po stronie agenta: skutki działań wracają do niego
jako dane, a dane zamieniają się w zasady, które obowiązują od następnej sesji.

## 3. Jak to działa

### 3.1. Cykl doskonalenia

Praca nad każdym zadaniem przebiega w czterech krokach. **Wykonaj** — zgodnie
z zasadami playbooka, które mają zastosowanie do danego typu zadania. **Zmierz** —
efekt ocenia się liczbą lub faktem z zewnątrz (odpowiedź klienta, akceptacja bez
poprawek, przejście testów), nigdy własnym odczuciem agenta. **Wyciągnij wniosek** —
co zadziałało, co zawiodło i dlaczego. **Zapisz** — wniosek trafia do playbooka
natychmiast, bo wniosek niezapisany przepada wraz z końcem rozmowy.

### 3.2. Rozdzielenie ról: Operator i Ewaluator

Fundamentem architektury jest zasada, że **agent nie ocenia sam siebie**. Model
oceniający własną pracę zawsze wystawi sobie najwyższą notę — nie ze złośliwości,
lecz z konstrukcji: nie ma dostępu do skutków swoich działań. Dlatego protokół
rozdziela dwie role. **Operator** wykonuje zadania, czytając playbook przed pracą.
**Ewaluator** ocenia efekty wyłącznie na podstawie twardych danych z zewnątrz
i aktualizuje playbook. W samym prompcie te role nie noszą osobnych nazw —
zadania Operatora realizują sekcje 1–2 protokołu, a Ewaluatora sekcje 4 i 10.

W prostym wdrożeniu (czat, Cowork, Claude Code) obie role pełni ten sam agent,
ale ocena musi opierać się na zewnętrznych faktach: korekcie człowieka, wyniku
testów, odpowiedzi klienta. Do kontroli jakości dokumentów protokół nakazuje
dodatkowo angażować osobnego podagenta w roli adwokata diabła — recenzent ma
aktywnie próbować obalić pracę, bo autor po godzinie pracy widzi to,
co chciał napisać, a nie to, co napisał. We wdrożeniu zaawansowanym (pełna
automatyzacja w kodzie) Operator i Ewaluator to dwa odrębne procesy — patrz
sekcja 6.4.

### 3.3. Pamięć: plik `playbook.md`

Pamięć agenta to jeden plik w folderze projektu, podzielony na sześć sekcji.
**Pliki robocze projektu** — lista plików, które mają istnieć na starcie sesji;
pozwala wykryć braki i bezpiecznie odtworzyć stan. **Fakty ustalone** — liczby
i decyzje potwierdzone przez człowieka; agent nie zmienia ich samowolnie, może
tylko zgłosić rozbieżność. **Zasady** — każda z licznikiem sprawdziła się/zawiodła,
warunkiem stosowania i statusem. **Rejestr błędów** — lista „nigdy więcej”: data,
opis, przyczyna i reguła zapobiegawcza dla każdej pomyłki; to bezpośrednia
realizacja zasady „nie popełniaj błędu dwa razy”. **Dziennik wniosków** — krótkie
wpisy „co zrobiono → skutek → wniosek”, najnowsze na górze; dziennik jest
ważniejszy od samych zasad, bo pokazuje, dlaczego zasady wyglądają tak, a nie
inaczej. **Sprawy otwarte** — zadania, których wyniku nie dało się jeszcze
zmierzyć; przeglądane obowiązkowo na starcie każdej sesji, żeby żaden pomiar
nie został odroczony w nieskończoność.

## 4. Mechanizmy, które decydują o skuteczności

### 4.1. Protokół błędu

To serce systemu. Po każdym wykrytym błędzie (korekta człowieka, nieprzechodząca
weryfikacja, źle zrozumiane zadanie, cokolwiek do przeróbki) agent wykonuje pięć
kroków: naprawia bez usprawiedliwień; szuka przyczyny, nie winnego — przy czym
wniosek „będę uważniejszy” jest zakazany, bo wniosek musi zmieniać procedurę;
sprawdza wstecz, czy ta sama pomyłka nie siedzi w innych miejscach pracy; zapisuje
błąd do rejestru; przekuwa go w zasadę z licznikiem. Reguła zapobiegawcza powstaje
natychmiast, po pojedynczym błędzie — cierpliwość statystyczna (4.6) dotyczy
wniosków z wyników, nie zabezpieczeń po pomyłkach. Powtórzenie błędu z rejestru
to incydent krytyczny — agent zgłasza go człowiekowi wprost i proponuje mocniejsze
zabezpieczenie. Dzięki temu każda pomyłka zostawia po sobie trwały ślad, który
chroni przed jej powtórką.

### 4.2. Cykl życia zasady

Zasada nie jest wieczna — ma licznik i status, a jej skuteczność to stosunek
zastosowań udanych do wszystkich. Przy skuteczności poniżej 30% (liczonej od
minimum 10 zastosowań) zostaje **wycofana**: znika z pracy, ale zostaje w pliku
i przywrócić może ją wyłącznie człowiek, a przywrócenie zeruje liczniki i ustawia
status „w obserwacji” (albo „chroniona”, jeśli człowiek tak zdecyduje). Przy skuteczności 30–60% zasada jest **w obserwacji** —
i tu ważny niuans: zasadę w obserwacji nadal się stosuje, bo reguła odstawiona
na zawsze nigdy nie zbierze danych na swoją obronę. Powyżej 60% zasada jest
**aktywna**. Osobny status **chroniona** mają bariery bezpieczeństwa i zasady
zatwierdzone wprost przez człowieka — nie podlegają licznikom ani wycofaniu,
a nadać ten status może wyłącznie człowiek, żeby agent nie mógł immunizować
własnych zasad na ocenę.

### 4.3. Przypisywanie zasług

Najczęstszy błąd przy budowaniu takiej pętli: po każdym zadaniu zalicza się sukces
lub porażkę wszystkim zasadom naraz. Wtedy wszystkie mają identyczne wyniki
i playbook nie odróżnia dobrych od złych — pięć zasad z wynikiem 55% i zero wiedzy.
Dlatego każda zasada musi określać, kiedy w ogóle ma zastosowanie („dołączaj wideo
do oferty” liczy się tylko wtedy, gdy wideo faktycznie było), a licznik aktualizuje
się wyłącznie zasadom, które przy danym zadaniu rzeczywiście miały zastosowanie.
Wynik propaguje się na każdą zastosowaną zasadę względem jej własnego celu:
sukces podbija „sprawdziła się”, porażka — „zawiodła”; przy wyniku mieszanym
każdą zasadę ocenia się osobno.

### 4.4. Odrzucanie czynników bez znaczenia

Z czasem agent zbiera coraz więcej informacji o projekcie i część z nich okazuje
się bezużyteczna. Po kilkunastu zadaniach sprawdza więc, czy dany czynnik
rzeczywiście wpływa na wynik — jeśli oferty wysyłane w poniedziałek i w piątek dają
identyczną skuteczność, dzień tygodnia przestaje być śledzony. Dwie pułapki: przy
próbie mniejszej niż 10 przypadków wszystko wygląda na zależność, więc wniosków się
nie wyciąga; a czynników wymaganych (numer umowy, dane kontaktowe, wymogi prawne)
nie wolno usunąć nigdy, nawet jeśli nie wpływają na wynik — są oznaczone jako
chronione.

### 4.5. Progi dopasowane do rzeczywistości

Klasyczny błąd: próg sukcesu 50% dla wszystkiego. Przy wysyłce ofert odpowiedź od
30% odbiorców to znakomity wynik — przy progu 50% każda kampania byłaby porażką
i playbook uczyłby się bzdur. Protokół stosuje więc dwa podejścia: **próg
bezwzględny** tam, gdzie metryka naturalnie sięga 100% („dokument przeszedł bez
poprawek”), oraz **porównanie z własną historią** tam, gdzie metryka jest z natury
niska (sprzedaż, marketing, rekrutacja) — sukcesem jest pobicie własnej średniej
z ostatnich 10 prób (lub wszystkich, jeśli było ich mniej).

### 4.6. Cierpliwość statystyczna

Trzy odpowiedzi to nie jest wynik. Poniżej 10 przypadków nie wyciąga się żadnych
wniosków; status zasady zmienia się od 10 zastosowań; zwycięzcę testu czy kampanii
ogłasza się dopiero po osiągnięciu ustalonego z człowiekiem progu (np. 30 przypadków
i tydzień). Przedwczesny wniosek jest gorszy niż brak wniosku, bo utrwala
przypadek jako regułę — do tego czasu sprawa wisi w „Sprawach otwartych”.
Cierpliwość dotyczy wniosków statystycznych z wyników; reguły zapobiegawcze
po błędach (4.1) powstają natychmiast, bez czekania na próbę.

### 4.7. Bariery bezpieczeństwa

Samodoskonalący się agent musi mieć granice, których nie może przesunąć własnym
rozumowaniem. Nigdy: nie wysyła pieniędzy, nie kasuje danych ani nie nadpisuje
oryginałów, czyli dokumentów źródłowych od człowieka (pracuje wyłącznie na ich
kopiach; pliki robocze projektu aktualizuje normalnie), nie wysyła masowej
korespondencji, nie publikuje niczego pod nazwiskiem człowieka bez zgody. Zawsze
do zatwierdzenia: każdy mail, oferta i post, każdy dokument do banku, urzędu czy
kontrahenta, każda zmiana cen, warunków i umów. Agent przygotowuje — człowiek
zatwierdza, nawet gdy agent jest „pewny”. We wdrożeniach programistycznych
z realnymi uprawnieniami bariery zapisuje się w kodzie, nie w prompcie
(sekcja 6.4), bo prompt agent teoretycznie mógłby sobie zreinterpretować.

## 5. Wdrożenie krok po kroku (wariant uniwersalny)

1. Zapisz `AUTOBOT-PROMPT.md` w folderze projektu (możesz zmienić nazwę na
   `AUTOBOT.md`).
2. Na starcie sesji wklej agentowi całą treść promptu **albo** wydaj polecenie:
   *„Przeczytaj AUTOBOT-PROMPT.md (lub AUTOBOT.md) i pracuj według tego protokołu.”*
3. Agent sam założy `playbook.md` przy pierwszym uruchomieniu i potwierdzi
   wczytanie pamięci jednym zdaniem — jeśli tego nie zrobił, przypomnij mu
   o sekcji 1 protokołu.
4. Po każdym większym zadaniu agent ma obowiązek dopisać wniosek; na początku warto
   to egzekwować poleceniem *„zaktualizuj playbook”*, aż wejdzie mu w nawyk.
5. Raz w tygodniu przejrzyj playbook sam: potwierdź fakty, skreśl zasady, które
   się nie sprawdzają, przywróć te wycofane niesłusznie. Wycofaną zasadę może
   przywrócić tylko człowiek — to twoja rola.

Playbook rośnie powoli i to jest w porządku — pięć trafnych zasad jest wartych
więcej niż pięćdziesiąt ogólników.

## 6. Wdrożenie w konkretnych narzędziach

### 6.1. Claude Code / Cowork

Umieść protokół (zapisany jako `AUTOBOT.md`) i `playbook.md` w folderze projektu,
a w pliku `CLAUDE.md` (pamięci projektu) dodaj jedną linijkę: *„Na starcie każdej
sesji przeczytaj AUTOBOT.md i playbook.md; pracuj według protokołu AutoBot.”*
Dzięki temu protokół ładuje się automatycznie, bez wklejania.

### 6.2. Cursor / inne IDE z regułami

Wklej treść promptu jako regułę projektu (w Cursorze: `.cursor/rules/autobot.mdc`
lub starszy `.cursorrules`), a `playbook.md` trzymaj w repozytorium. Reguła działa
wtedy w każdej rozmowie z agentem w tym projekcie.

### 6.3. Zwykły czat (ChatGPT, Claude, Gemini) z obsługą projektów/plików

Wklej prompt jako instrukcje projektu (custom instructions / project knowledge),
a `playbook.md` dodaj jako plik projektu. Kroki ręczne w tym wariancie: pierwsze
zapisanie playbooka wygenerowanego przez agenta oraz podmiana pliku po każdej
sesji. Weryfikację plików roboczych (krok 4 rytuału) wykonujesz sam, bo agent
w czacie nie widzi twojego dysku.

### 6.4. Wariant zaawansowany: pełna automatyzacja w kodzie

Dla zespołów programistycznych źródłowa specyfikacja przewiduje system
Evaluator–Operator jako działającą aplikację (TypeScript/Python): `OperatorAgent`
czyta `playbook.json` i wykonuje akcje przez API; `EvaluatorAgent` uruchamiany
harmonogramem pobiera twarde metryki z zewnętrznych systemów (CRM, Stripe, GitHub),
liczy delty i prowadzi postmortem; moduł optymalizacji wycofuje reguły ze
skutecznością poniżej 30% i usuwa cechy o znikomej korelacji z wynikiem; bariery
bezpieczeństwa są wymuszone w kodzie (brak uprawnień do merge do main, do masowej
wysyłki, do środków finansowych; blokada środowiska produkcyjnego), a decyzje
Ewaluatora czekają na istotność statystyczną próby. Progi i logika są identyczne
z wariantem plikowym — kod jedynie automatyzuje to, co w wariancie plikowym robi
agent z człowiekiem.

## 7. Po czym poznasz, że wdrożenie działa

Maleje liczba powtórnych poprawek tego samego typu — to główna miara. Rejestr
błędów rośnie szybko na początku, potem tempo wyraźnie spada, bo błędy przestają
się powtarzać. Playbook ma kilkanaście zasad z realnymi licznikami zamiast
pięćdziesięciu ogólników. I wreszcie: przestajesz powtarzać agentowi te same uwagi,
bo pamięta je z poprzednich sesji.

## 8. Najczęstsze błędy wdrożenia

1. **Agent ocenia sam siebie.** Ocena musi pochodzić z zewnątrz — z korekty
   człowieka, wyniku testów, odpowiedzi klienta. „To bardzo dobry dokument”
   o własnym dokumencie nie jest miarą niczego.
2. **Zaliczanie wyniku wszystkim zasadom naraz.** Bez warunku stosowania wszystkie
   zasady mają identyczne statystyki i system niczego się nie uczy.
3. **Próg 50% dla metryk z natury niskich.** Sprzedaż i marketing mierz porównaniem
   z własną historią, nie progiem bezwzględnym.
4. **Wnioski z pięciu przypadków.** Poniżej 10 wszystko wygląda na zależność;
   przedwczesny wniosek utrwala przypadek jako regułę.
5. **Odstawianie zasad „w obserwacji” na zawsze.** Zasada w obserwacji ma być nadal
   stosowana, inaczej nigdy nie zbierze danych na swoją obronę.
6. **Bariery tylko w prompcie przy agencie z realnymi uprawnieniami.** Gdy agent
   może coś wysłać, opublikować lub zmerge'ować, bariery muszą być w kodzie.
7. **Playbook-śmietnik.** Dopisywanie ogólników zamiast zasad z konkretnym
   warunkiem stosowania; lepiej pięć trafnych niż pięćdziesiąt pustych.
8. **Brak rytuału startowego.** Playbook istnieje, ale nikt nie każe go czytać —
   wtedy cała pamięć leży martwa. Rytuał z sekcji 1 promptu jest obowiązkowy.
9. **Kontrola poprawek słabsza niż kontrola treści.** Poprawki i dopiski też są
   pracą — muszą przechodzić tę samą listę zasad i tę samą walidację co treść
   pierwotna, inaczej to w nich zalęgną się nowe błędy.

## 9. Skąd wzięły się te zasady

Protokół nie jest teorią — każda zasada wzięła się z konkretnej, udokumentowanej
pomyłki pierwszego wdrożenia: cena nieruchomości wyliczona z modelu zamiast
zapytania człowieka (pomyłka o 1,6 mln zł), program w Pythonie napisany, gdy
chodziło o spisanie zasad, instalacja fotowoltaiczna uznana za własność, choć była
w leasingu, pozorna sprzeczność źródeł, które opisywały różne części tego samego
piętra, dwanaście usterek prezentacji znalezionych dopiero przez podagenta oraz
korzyść zawyżona o 1,4 mln zł przez pominięcie kredytu w porównaniu wariantów.
Każdy z tych błędów trafił do rejestru i zamienił się w zasadę — dokładnie tak,
jak przewiduje protokół.
