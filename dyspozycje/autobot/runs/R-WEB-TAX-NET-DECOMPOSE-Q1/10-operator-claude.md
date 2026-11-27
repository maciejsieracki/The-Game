STATUS: PASS-WITH-NOTES
DOMAIN: GAME (analiza ekonomii, zero zmian gry)
TEMAT: R-WEB-TAX-NET-DECOMPOSE-Q1 (tag TAXNET)
GOAL: rozłożyć 20 Podatku z zamiany 100 Żywności (Targowisko, kurs 0,2) na składniki i ocenić, czy netto +6 w skarbcu jest zgodne z intencją.
ZMIANY/COMMIT: dyspozycje/analizy/TARGOWISKO-NETTO-PODATEK-2026-11-27.md (nowy) oraz ten raport. gra/src i gra/data bez zmian. Runner gra/tools/taxnet-decompose-live.cjs NIE utworzono (patrz BLOKADY).

WYNIK (z kodu i arytmetyki, dokument §3):
- Korupcja stolicy: 1 pkt proc. (hard, 1 miasto) = -0,20; zaokrąglenie puli w dół = -0,80.
- Podział suwakiem domyślnym 60/30/10: Nauka 11, Skarb (Pieniądz) 6, Zamożność (Luksus) 2. Suma 19.
- Zmierzone B - A = 6 (VLIVE3, dane vlive3-targowisko-1tura-max-stdout.txt). Zgodne z modelem.
- Wniosek: ZAMIERZONE wg wzoru. Kod (economy.ts:942-944, work-tax.ts:63 i :83) mówi wprost, że podatek ręczny nie trafia 1:1 do Skarbu i przechodzi przez korupcję, Mennicę i suwak. Brak rozjazdu z dokumentacją.
- Pytanie o grę (DECISION_REQUIRED, jednozdaniowo): czy Żywność zamieniona na Podatek ma trafiać do Skarbu tylko wg suwaka (dziś 30% z 20 = 6), czy mieć stały, większy udział bezpośrednio do Skarbu. Rozstrzyga właściciel, nie operator.

TESTY:
- Pomiar: tylko poziom hard (Trudny), suwaki domyślne, jedno miasto, bez Mennicy. Dane z VLIVE3, bez nowego biegu live.
- Bramki: tsc, logic 213, ai-test 297/0 NIE URUCHOMIONO. Powód: zmian w gra/src brak (git diff gra/ pusty), a worktree nie ma gra/node_modules. Nie instalowano zależności.
- Nowy bieg live: NIE WYKONANO (patrz BLOKADY).

BLOKADY:
- Rozkład składników (Nauka/Skarb/Zamożność) w żywej grze: NIE ZMIERZONO. Runner VLIVE3 odczytuje tylko skarbiec, rezerwę i kolejkę. Potrzebny hak odczytu (wynik tury: perCity.nauka i stan Wealth). Haka nie dodano, bo zakaz zmian w gra/src. To wymaga decyzji orkiestratora (hak testowy pod civTest, bez wpływu na grę).
- Pula bazowa gracza (A = +1) nie rozbita, więc 6 jest zgodne z modelem, a nie wyprowadzone z pomiaru składników.
- Poziomy inne niż hard, Mennica (×1,38 hard), zmienne suwaki i Wealth: wyliczenia z kodu, NIE ZMIERZONO (dokument §5).

RUNDY: 1/5
NASTĘPNY KROK: orkiestrator decyduje (a) czy zlecić hak odczytu składników i bieg live, (b) czy przekazać DECISION_REQUIRED z dokumentu §7 właścicielowi jako pytanie ABC (wariant A zgodny z kodem obecnie).
UWAGI-DLA-ORKIESTRATORA: VLIVE3 zgłasza też przerwany bieg ON w turze 12 (endTurnInProgress). Ta analiza tego nie rusza. Kandydat na osobny temat.
DEPLOY/PUSH: NIE WYKONANO
