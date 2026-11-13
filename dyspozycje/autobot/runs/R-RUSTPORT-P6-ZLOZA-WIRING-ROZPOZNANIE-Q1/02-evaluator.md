STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-ZLOZA-WIRING-ROZPOZNANIE-Q1 (ZLOZA-WIRING #104, rozpoznanie)
GOAL: ustalic wywolania zlozeGrants / deactivate / sync w pinie 07d2fbd72 i odpowiedniki w Rust (baza fc2ed160f); tabela, lista brakow, podzial na tematy.
ZMIANY/COMMIT: Evaluator dopisuje tylko ten plik. Ocenianie: wip/R-RUSTPORT-P6-ZLOZA-WIRING-ROZPOZNANIE-Q1 @ d15f8b0fc. `git diff --stat fc2ed160f..d15f8b0fc` = 3 pliki (00-dispatch.md, 01-operator-r1.md, rozpoznanie .md), +146/-0; wszystkie w allowliscie; zero zmian w rust-port/**, gra/**, tests/**, Cargo.*.
TESTY: bramki cargo (fmt/clippy/test --lib) NIE DOTYCZY: zero zmian kodu, wiec wynik = wynik bazy; nie uruchamiano (wolne 5,0 GB na / — ryzyko dysku). Dispatch nie wskazuje testu. Brak #[ignore]/osłabionych asercji do oceny (brak diffu w testach). Zamiast tego odtworzono WSZYSTKIE twierdzenia plik:linia w pinie (git show 07d2fbd72) i w Rust (grep/sed na checkoutcie bazy).
BLOKADY: brak blokujacych.
RUNDY: 2/5 (Evaluator po rundzie Operatora 1/5)
NASTEPNY KROK: Final Control; uwzglednic uwagi 1-5 (do poprawki w dokumencie rozpoznania lub jako zastrzezenie dla tematow ZLOZA-*).
DEPLOY/PUSH: NIE WYKONANO

## Co zweryfikowano (zgodne)
- Pin: wszystkie linie z tabeli sekcji 1-3 zgodne (12566, 12613, 22741, 22774, 23688-23694, 24229-24234, 24294, 12706-12709, 10010, 10973, 30649, 37358, 47251-47253, 47264; 6 wolajacych breakTreatiesOnWar: 11705, 13169, 13206, 23809, 40442, 41932; 11 wywolan syncRelationFromDeals bez definicji 22832). `git grep zlozeGrants 07d2fbd72 -- gra/src` potwierdza brak konsumenta grantow poza main.ts i komentarzem trade-routes.ts:1817.
- Rust: 4185 ZlozeGrant, 4197 deactivate (tylko test p6_r7k7b_zloze_sync.rs), 4225 sync_relation_status_from_deals (tylko test), turn_war_dipl_steps.rs:275/1004/917/238/950, alliance_war_obligation.rs:251 + test truce_aggressor:504, diplomacy.rs:1727 expire_deals. Zero produkcyjnych wolajacych deactivate/suspend; brak pola stanu zlozeGrants; brak suspend_zloze_grants_for_war. Rownowaznosc obu funkcji sync potwierdzona przez porownanie kodu (Alliance > Nap -> Peace, War nie nadpisywana).

## Zarzuty (ponumerowane)
1. (sredni) Sekcja 4 pkt 2 i sekcja 7: "kandydat diplomacy.rs wokol :2639" jest BLEDNY. diplomacy.rs:2639 to `build_cyclic_resource_transfers` (QuantityResource/Gold/Work), nie realizacja koszyka. W calym `rust-port/engine/src` jedyne uzycie `BasketItemKind::Deposit` poza definicja to wycena (`diplomacy.rs:2002`, `deposit_prices`). Brak funkcji odpowiednika `transferBasketItems`; ZLOZA-B nie ma wiec punktu zaczepienia (trzeba najpierw ustalic/zbudowac sciezke realizacji koszyka, w tym dla pozostalych typow). Rozmiar B "1-2 rundy" moze byc zanizony.
2. (maly) Sekcja 2 wiersz 22774 + sekcja 7: "NIE_ZMIERZONO czy istnieje odpowiednik breakTreatyVoluntarily" — da sie rozstrzygnac: brak funkcji; jedyne slady to `DiplomaticEvent::VoluntaryTreatyBreak` (diplomacy.rs:588, -15 zaufania :672) i `CredibilityEvent::ZerwanieDobrowolne*` (credibility.rs:196-197). Nie ma komendy usuwajacej umowe ani otwierajacej okno N3 (pin 22741-22774). ZLOZA-C ma wiec dodatkowy, niewymieniony zakres (cala komenda dobrowolnego zerwania, nie tylko hak).
3. (maly) Sekcja 1: "NIE_ZMIERZONO poza trade-routes.ts" — pelny `git grep` po gra/src pinu byl tani i daje jednoznaczne "brak konsumenta"; zostawiono luke, ktora da sie zamknac.
4. (maly) Sekcja 5: niespojnosc zaleznosci. Naglowek: "A -> B -> C; D niezalezne od A", a punkty: C i D "zalezy od A", kolejnosc "A -> B -> C -> D". Z tekstu wynika, ze B i C sa niezalezne od siebie (obie od A). Do ujednolicenia przed dispatchem.
5. (maly) Brak wzmianki, ze komentarz diplomacy.rs:4177-4180 deklaruje "Bez migracji: zadnych nowych pol w stanie gry" — ZLOZA-A tego wymaga zmiany; ryzyko serde(default)/format zapisu zostalo zadeklarowane jako NIE_ZMIERZONO (akceptowalne, ale ZLOZA-A musi to zmierzyc na schemacie save).
6. (proces) 01-operator-r1.md: pole ZMIANY/COMMIT nie podaje SHA ("patrz sekcja SHA w odpowiedzi") — kontrakt wymaga SHA w raporcie; SHA jest dopiero w sekcji dopisanej (86c09c574 / d15f8b0fc). Incydent: Operator usunal plik /home/user/tmp/x poza repo (7,3 MB) — naruszenie granic dispatchu (zero zmian poza allowlista); zglosic wlascicielowi; katalog /home/user/tmp nadal istnieje (zawiera gen.out). Nie wplywa na tresc rozpoznania.
7. (info) Rozpoznanie nie sprawdzilo, czy produkcyjne wypowiedzenie wojny w Rust usuwa umowy (`deals.retain` w turn_war_dipl_steps.rs:955 dotyczy tylko D6; eliminate_owner #141 czysci umowy) — to wazne dla D, ale poprawnie oznaczone jako poza zakresem/#120.

## Werdykt
Tresc faktograficzna rozpoznania jest prawidlowa i kompletna co do kryteriow 1-3; zarzut 1 (zly kandydat realizacji koszyka) wymaga korekty w dokumencie lub zastrzezenia w dispatchu ZLOZA-B. Reszta to uwagi. PASS-WITH-NOTES.
