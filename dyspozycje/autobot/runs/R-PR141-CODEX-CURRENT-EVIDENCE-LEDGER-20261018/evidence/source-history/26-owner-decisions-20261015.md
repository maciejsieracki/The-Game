# Decyzje właściciela: macierz F-05 i G11 — 2026-10-15

Źródło odpowiedzi: wiadomości właściciela z 2026-10-15. Odpowiedzi dosłowne: `1b, 2a, 3b` oraz `4b 5a`. Nie dopisano uzasadnienia ani innych warunków.

## Odpowiedź właściciela

> 1b, 2a, 3b
>
> 4b 5a

### 1. Bonusy ruchu rydwanów Egiptu — odpowiedź 1B

**Sytuacja przedstawiona:** dwa osobne bonusy po 15%; obecny kod je sumuje do 30%, a poradnik gracza opisuje jeden bonus 15%.

- **A — Sumować oba bonusy:** zachowuje oba pola i obecne +30%; ryzyko podwójnego naliczenia względem opisu +15%.
- **B — Bonus rydwanów zastępuje ogólny bonus Egiptu dla rydwanów:** zachowuje pole specyficzne i unika podwojenia; ogólny bonus pozostaje dla innych cywilizacji; wymaga reguły pierwszeństwa.
- **C — Ignorować osobne pole rydwanów:** zostawia tylko ogólny bonus +15%; jest proste i zgodne z opisem, ale pole specyficzne pozostaje niewykorzystywane.

**DECYZJA: 1B.** Dla rydwanów Egiptu pole `walka_ruch_rydwany` ma zastąpić nakładający się `walka_ruch_bitwa_proc`, nie sumować się z nim. Nie rozszerzać tej decyzji na inne ruchy/konteksty bez rozstrzygnięcia zakresu poniżej. To decyzja reguły, nie potwierdzenie implementacji ani odbioru runtime.

### 2. Zakres zniżki werbunkowej Zulusów — odpowiedź 2A

**Sytuacja przedstawiona:** historyczny opis wymienia Impi, a pole macierzy jest opisane szerzej jako dotyczące jednostek.

- **A — Tylko Impi:** zachowuje historyczny, konkretny zakres; nie obejmuje innych jednostek.
- **B — Wszystkie werbowane jednostki:** odpowiada szerokiemu opisowi pola; rozszerza historyczny bonus i może zmienić balans.
- **C — Nie stosować zniżki do czasu doprecyzowania:** nie zgaduje zakresu; pozostawia pole nieaktywne.

**DECYZJA: 2A.** `walka_koszt_rekrutacji_proc` Zulusów ma obejmować wyłącznie Impi. Nie zatwierdza to wartości liczbowej innych komórek ani wartości `prod_koszt_jednostki_proc`.

### 3. Łączenie zniżki werbunkowej i kosztu jednostki — odpowiedź 3B

**Sytuacja przedstawiona:** istnieją dwa osobne pola; dla Zulusów oba obecnie zawierają 10%, lecz zatwierdzenie jednego nie potwierdza drugiego. Brakuje zatwierdzonej reguły ich łączenia.

- **A — Zniżka werbunkowa zastępuje zniżkę kosztu jednostki:** jedna zniżka; nie sumuje się obu wartości.
- **B — Dodawać obie zniżki, a wynik zaokrąglić raz:** obie wpływają na cenę; przykładowe dwa zatwierdzone pola po 10% dawałyby łącznie 20% przed jedną operacją zaokrąglenia; grozi większym rabatem.
- **C — Na razie nie stosować zniżki werbunkowej:** zachowuje dotychczasowe ceny do czasu kontraktu; pole pozostaje nieaktywne.

**DECYZJA: 3B.** Gdy obie zniżki dotyczą tej samej dozwolonej rekrutacji, łączyć ich ułamki addytywnie i wykonać jedną operację zaokrąglenia po połączeniu. To nie zatwierdza wartości źródłowych. Pozostaje otwarte, gdzie dokładnie ta operacja ma wypaść względem tempa gry/trudności i istniejącego minimum ceny; nie wdrażać tej kolejności na podstawie domysłu.

## Pytania następcze — odpowiedzi zapisane 2026-10-15

### 4. Gdzie stosować regułę Egiptu 1B?

**Sytuacja:** źródłowy ślad pokazuje, że współdzielony przelicznik ruchu jest używany zarówno przy ruchu w bitwie, jak i przy koszcie wejścia na płytkie morze. Pytanie 1 opisywało bonus jako ruch rydwanów, lecz nie rozstrzygało drugiego zastosowania.

- **A — Reguła 1B obowiązuje we wszystkich miejscach użycia tego przelicznika.** Zyskujesz spójne działanie; oddajesz odrębne traktowanie wejścia na płytkie morze.
- **B — Bonus dotyczy wyłącznie ruchu w bitwie; nie wpływa na koszt wejścia na płytkie morze.** Zyskujesz zgodność z nazwą pola i opisem bonusu; oddajesz efekt w tym dodatkowym miejscu użycia i potrzebna jest osobna logika.
- **C — Rozdzielić reguły:** w bitwie stosować 1B, a dla wejścia na płytkie morze zachować dotychczasowy wynik +30%. Zyskujesz kompatybilność tego drugiego efektu; oddajesz spójność, a jeden bonus ma różne znaczenie zależnie od kontekstu.

**Rekomendacja — nie-decyzja:** B, ponieważ nazwa i opis odnoszą bonus do ruchu w bitwie. Potrzebna decyzja właściciela.

**DECYZJA: 4B.** Bonus Egiptu dotyczy wyłącznie ruchu w bitwie; nie wpływa na koszt wejścia na płytkie morze. Implementacja musi oddzielić te zastosowania współdzielonego przelicznika. To decyzja zakresu, nie potwierdzenie implementacji ani runtime.

### 5. Kiedy zaokrąglać po addytywnym połączeniu zniżek 3B?

**Sytuacja:** obecna ścieżka bez macierzy zaokrągla cenę po zniżce przed zastosowaniem tempa/trudności; ścieżka macierzowa ma własne obniżenie ceny przed tempem/trudnością. Decyzja 3B ustaliła sumowanie i jedno zaokrąglenie, ale nie jego położenie względem tempa/trudności.

- **A — Zsumować zniżki, raz zaokrąglić cenę zniżoną (minimum 1), potem zastosować tempo/trudność.** Zyskujesz zgodność z dotychczasową kolejnością ścieżki bez macierzy; oddajesz możliwość, by tempo/trudność zmieniały podstawę obliczenia zniżki.
- **B — Najpierw zastosować tempo/trudność do ceny bazowej, potem sumę zniżek i jedno zaokrąglenie (minimum 1).** Zyskujesz jedną końcową korektę ceny; oddajesz zgodność z dotychczasową kolejnością i mogą zmienić się końcowe ceny.
- **C — Nie podłączać G11 do ceny, dopóki kolejność nie zostanie zatwierdzona.** Zyskujesz brak zgadywania; oddajesz działającą zniżkę do czasu decyzji.

**Rekomendacja — nie-decyzja:** A, bo zachowuje istniejącą kolejność historycznej zniżki werbunkowej. Potrzebna decyzja właściciela.

**DECYZJA: 5A.** Po addytywnym połączeniu dozwolonych zniżek wykonać jeden floor/minimum ceny 1, a następnie zastosować tempo gry i trudność. To decyzja kolejności, nie zatwierdzenie wartości źródłowych ani odbiór cen runtime.

## Granice i dalsza praca

- Nie zmieniono kodu/danych, nie wykonano dispatchu, retry, pushu, merge’u ani deployu.
- F-04 pozostaje zablokowane: zatwierdzone źródło wartości `prod_koszt_jednostki_proc` / wymaganych 360 komórek nadal nie zostało odzyskane. Decyzja 3B nie zatwierdza tych wartości.
- F-05/G11 nadal nie mają odebranego Operatora. Odpowiedzi 1–5 usuwają decyzje kontraktowe opisane w tym pliku, ale nie stanowią acceptance. Wymagane są zatwierdzone wartości, dozwolona trasa wykonawcza, rzeczywiste ścieżki gracza i AI oraz niezależne bramki.
- Chroniony checkout `/home/ubuntu/projects/The-Game/` i środowisko Hermesa nie były modyfikowane.
