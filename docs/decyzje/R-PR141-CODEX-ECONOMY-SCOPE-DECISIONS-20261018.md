# R-PR141-CODEX-ECONOMY-SCOPE-DECISIONS-20261018 — zakres dwóch pól ekonomii F-04

**Data:** 2026-10-18  
**Status:** OWNER DECISIONS — semantyczny zakres pól; bez nowych wartości i bez implementacji  
**Kontekst:** Dotyczy pól objętych osobnym source approval F-04. Nie ustanawia source values, nie aktywuje consumerów ani nie stanowi gameplay/product acceptance.

## Q1 — `eko_pieniadz_port_proc`

**Literalne pytanie właściciela:** „F-04 / pieniądz z portu: do czego ma stosować się eko_pieniadz_port_proc? W istniejącym kodzie przychód budynku portu da się wydzielić, natomiast przychody morskich szlaków nie mają osobnej proweniencji.”

**Literalna odpowiedź właściciela, 2026-10-18:** „B — także do przychodów morskich szlaków; trzeba najpierw dodać ich rozróżnianie.”

**Zakres decyzji:** `eko_pieniadz_port_proc` ma obejmować zarówno przychód budynku portu, jak i przychody morskich szlaków. Zanim wartość zostanie podłączona do obu źródeł przychodu, trzeba dodać rozróżnianie/proweniencję morskich szlaków. Decyzja nie stwierdza, że takie rozróżnianie istnieje, i nie zatwierdza implementacji tej zmiany.

## Q2 — `eko_zadowolenie_proc`

**Literalne pytanie właściciela:** „F-04 / zadowolenie: do czego ma stosować się eko_zadowolenie_proc? Wartości źródłowe obecnie wynoszą zero.”

**Literalna odpowiedź właściciela, 2026-10-18:** „B — do końcowego zadowolenia miasta, łącznie z Porządkiem i pozostałymi składnikami.”

**Zakres decyzji:** `eko_zadowolenie_proc` ma odnosić się do końcowego zadowolenia miasta łącznie z Porządkiem i pozostałymi składnikami, a nie wyłącznie do wkładu budynków. Pytanie podaje, że źródłowe wartości obecnie wynoszą zero; odpowiedź nie ustanawia nowych wartości i nie zmienia danych.

## Granice

Są to dwie decyzje o zakresie semantycznym. Nie oznaczają aktywacji konsumentów ani akceptacji zachowania produktu i nie rozszerzają zakresu source approval poza udokumentowaną macierz. Implementacja, rozróżnienie proweniencji, testy i akceptacja gameplay wymagają osobnego dispatchu i review. Zapis decyzji nie zmienił kodu, danych, testów ani runtime; nie wykonano commita ani publikacji.
