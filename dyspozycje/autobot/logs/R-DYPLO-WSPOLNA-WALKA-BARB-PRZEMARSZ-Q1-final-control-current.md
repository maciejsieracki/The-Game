# AUTOBOT FINAL CONTROL — `R-DYPLO-WSPOLNA-WALKA-BARB-PRZEMARSZ-Q1`

**STATUS: BLOCK-ABC**  
**Data kontroli:** 2026-08-20  
**Tryb:** Luna High / final control  
**READY:** NIE

## Zakres i dowody

Skontrolowano:

- raport Operatora z commita `1da735d260c3d68dd09f022f9707ea03613a7721`;
- raport Evaluatora `dyspozycje/autobot/logs/R-DYPLO-WSPOLNA-WALKA-BARB-PRZEMARSZ-Q1-evaluator-current.md`;
- relację `1da735d2` względem `9e576da2048eb2f2083e0c5684ae01c66ff8d6eb`.

Kontrola Git potwierdza:

- parent `1da735d2` to dokładnie `9e576da2`;
- diff zawiera wyłącznie dodanie raportu Operatora;
- brak zmian w `gra/`, danych gry i mechanice;
- `git diff --check` przechodzi bez błędów whitespace.

Bieżące, niezwiązane zmiany robocze poza tym commitem nie są podstawą do
zmiany zakresu ani werdyktu. W ramach tej kontroli nie wykonano zmian w kodzie,
deployu ani pushu.

## Kontrola raportów

Raport Operatora prawidłowo ustawia `BLOCK-ABC` i w sekcji „Nierozstrzygnięte
ABC” identyfikuje trzy braki, których nie wolno uzupełniać domysłem.

Raport Evaluatora oznacza ocenę jako `PASS-WITH-NOTES`, ale jednocześnie
potwierdza wszystkie trzy braki i wskazuje odpowiedzi właściciela jako następny
gate. `PASS-WITH-NOTES` jest oceną jakości raportu, nie zgodą na implementację
ani statusem gotowości wydaniowej. Finalna kontrola utrzymuje więc
`BLOCK-ABC`.

## Potwierdzone blokery ABC

### ABC-1 — dokładny czas trwania umowy terminowej

Wybór `1A` mówi tylko, że umowa jest terminowa. Nie określa liczby tur,
minimum/maksimum, wartości domyślnej, sposobu ustalenia terminu ani dokładnej
granicy wygaśnięcia względem `wygasaTura`. Wartości typu `10`, `15`, `20` lub
zakres `1–20` byłyby nieautoryzowanym dopowiedzeniem.

**Werdykt:** brak semantyki wykonawczej — `BLOCK-ABC`.

### ABC-2 — które jednostki mogą wejść do wspólnej walki

Wybór `2A` potwierdza obustronność, ale nie określa, które jednostki partnera
kwalifikują się do wejścia, jaki jest wyzwalacz, czy udział jest automatyczny,
jaki obowiązuje zasięg oraz co dzieje się z jednostką już zaangażowaną w inną
walkę. Nie wolno samodzielnie przyjąć rosteru, promienia ani automatyzmu.

**Werdykt:** brak semantyki wykonawczej — `BLOCK-ABC`.

### ABC-3 — zachowanie przy naturalnym wygaśnięciu

Wybór `3A` opisuje dobrowolne zerwanie: kara Zaufania, wygaśnięcie autoryzacji
od następnej kontroli ruchu i pozostawienie jednostek bez teleportu. Nie
rozstrzyga, czy identyczna reguła obowiązuje po upływie terminu bez zerwania,
czy autoryzacja wygasa natychmiast, ani czy istnieje karencja na wyjście.

**Werdykt:** brak semantyki wykonawczej — `BLOCK-ABC`.

## Decyzja final control

Nie wystawiam `READY`. Nie zezwalam na implementację, rozszerzanie testu
kontraktowego ani zmianę logiki zależnej od tych trzech punktów do czasu
jednoznacznej odpowiedzi właściciela. W szczególności nie dodawać teraz nowego
enumu/rodzaju umowy, akcji UI, rosteru ani reguły wygasania dla tego kontraktu.

Po odpowiedzi właściciela wymagany jest nowy cykl:

`Operator → Evaluator → final control`.

**Właściciel musi rozstrzygnąć:** dokładny termin umowy; kwalifikację i sposób
wejścia jednostek do wspólnej walki; oraz zachowanie jednostek i autoryzacji
przy naturalnym końcu terminu.

**DEPLOY/PUSH:** nie wykonano.
# AKTUALNA FINALNA KONTROLA — `R-DYPLO-WSPOLNA-WALKA-BARB-PRZEMARSZ-Q1`

**STATUS: READY_FOR_DEPLOY** · Final Control GPT-5.6 Luna High

Decyzja `1B / 2A / 3B`, 3 tury, `8B / 9A / 10B` jest zgodna z implementacją.
Łańcuch: Operator `45092ca8` → Evaluator `PASS-WITH-NOTES` → finalna kontrola.
Commity implementacyjne `c912c8ce`, `12ca89f9` oraz snapshot `e69419e5` są
przodkami `main`; ROBOCZA `d2276783` ma zgodny MD5 i `VERIFY OK`.

Temat jest gotowy wydaniowo. Nowy deploy nie jest potrzebny, ponieważ zakres
już znajduje się w aktualnej ROBOCZEJ. Nie wolno budować z bieżącego brudnego
checkoutu: lokalne niezacommitowane zmiany usuwają część mechaniki wspólnej
walki. **DEPLOY/PUSH:** nowego deployu ani pushu nie wykonano.

**Następny gate:** playtest wspólnej walki, przemarszu i wygaśnięcia umowy.

---
