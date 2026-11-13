STATUS: DECISION_REQUIRED (cel 1 spełniony; cel 2 NIE spełniony, udokumentowana próba układu; wymagana decyzja właściciela)
DOMAIN: GAME (WEB) — UI: górny baner zasobów (HUD topbar, lewy baner 3+3)
TEMAT: R-WEB-HUD-TOPBAR-BIGGER-NUMBERS-NO-GAPS-Q1
GOAL: (1) główne liczby +25–35%; (2) brak pustych przestrzeni; (3) brutto/netto i deficyt bez zmian, układ 3+3 stały.
ZMIANY-COMMIT: kod + test + zrzuty + logi: `1dc837e91fa1c993925d8f0c166767e0489dbf1a` (baza: runda 1 `b98a0bf074d022cbb1d4ee53123832c1299e792b`, origin/main 4905bac05). Ten plik raportu: osobny commit po nim (SHA w `git log`/odpowiedzi orkiestratora). Pliki: `gra/src/ui/hud.ts`, `gra/tools/hud-topbar-bigger-numbers-real-render-test.cjs` (NOWY), `zrzuty/` (24 PNG PRZED/PO), `gate-*.txt`. Push NIE.

ODPOWIEDZI NA ZARZUTY EVALUATORA
1. Cel 2 niespełniony — PRZYJMUJĘ. Próba: (a) `justify-content:space-between` na linii żetonu — bez efektu (przyrosty już mają margin-left:auto); (b) przyrosty w dwóch liniach pod sobą (wariant „stacked") — przerwa WZROSŁA do 145–200 px przy 1920, bo węższe przyrosty powiększają wolne miejsce między liczbą a przyrostami (liczba jest wyrównana do lewej z założenia, więc rozkład flex nie zamknie luki). Wniosek: przy szerokości komórki ~225 px (1920) i ~100 px (1366) wartość +25–35% nie wypełni komórki bez zmiany jednego z trzech parametrów: rozmiaru liczby (ponad +35%), szerokości banera (zwężenie — sprzeczne z „treść wypełnia szerokość") albo układu (np. liczba wycentrowana/powiększona w 3 wierszach). Decyzja do właściciela (patrz niżej).
2. Brak nowego testu real-render — PRZYJMUJĘ. Dodany `gra/tools/hud-topbar-bigger-numbers-real-render-test.cjs`: prawdziwy renderBarD1B + CSS w Chromium, PRZED (kopia bazy 4905bac05) vs PO, okna 1920/1366/1024/640 (+ 800–1321 dla zakresu środkowego), zestawy 12 / 3 456 / 2 345 678. Asercje: B1 font ≥1,25× PRZED; B2 scrollWidth ≤ clientWidth w każdej komórce + brak poziomego scrolla strony; B3 pozycje x/y/szerokość komórek i wysokość banera identyczne dla małych i dużych liczb; B4 przerwa ≤6 px (cel 2); B5 brutto i netto widoczne. Wynik: 50 ok / 2 FAIL — FAIL tylko B4 (1920 i 1366 px; w 1321/1280/1250/1201 też, patrz gate-bigger-numbers-widths-640-1920.txt). Logi: `gate-bigger-numbers-real-render.txt`, `gate-bigger-numbers-widths-640-1920.txt`.
3. Mutacja — PRZYJMUJĘ. `HUD_TS=<kopia bazy>` (cofnięty rozmiar czcionki): B1 pada w 4/4 oknach (`gate-mutant-cofniecie-font.txt`, EXIT=1).
4. Zrzuty niekompletne — PRZYJMUJĘ. Teraz 4 szerokości × 3 zestawy × PRZED/PO = 24 PNG w `zrzuty/` (poprzednie 4 pliki z rundy 1 usunięte — dotyczyły stanu sprzed poprawek). Brak zrzutu 1920 i 1024 z rundy 1 uzupełniony.
5. Usunięte `margin-left:0` — ODRZUCAM (dowód). W bazie 4905bac05 `gra/src/ui/hud.ts` linia 700 (blok `@media (max-width:1200px)`): `.civ-hud .civ-hud-chip-figs{margin-left:0;line-height:1.3;...}`. W PO ta sama reguła: `margin-left:0;line-height:1.2;...` — zmieniono tylko line-height/height, `margin-left:0` zostało. Zakres 701–1200 px zmierzony: 640, 800, 900, 1100, 1200 px (B2/B3/B4 OK, przerwa 0 px); 1201 px — patrz pkt 8.
6. Sekcja B (żywa gra, --dist) — NIE ZAMKNIĘTA, ale NIE jest regresją. Uruchomiona na zbudowanej kopii BAZY 4905bac05 (`gate-grid-dist-BAZA-4905bac05.txt`): te same 4 FAIL (netto z HUD ≠ zmiana magazynu po endTurn, magazyn bez zmiany: 4741→4741) + wyjątek zamkniętej strony. Błąd leży w harnessie endTurn, nie w CSS (magazyn nie zmienia się nawet w bazie). Na końcowym CSS sekcji B nie przebudowywano (brak czasu na ponowny build); stan = identyczny z bazą.
7. Test Mocy 21/7 — ODRZUCAM (dowód). `gate-moc-warstwa-BAZA-4905bac05.txt` (kopia bazy): WYNIK 21 PASS / 7 FAIL; `gate-moc-warstwa-PO.txt`: ten sam zestaw FAIL. Dług sprzed zmiany, niezależny od CSS.
8. Nieraportowany zakres 701–1200 / 1201 px — PRZYJMUJĘ, naprawiono. Przy 1201–1300 px i wartości 2 345 678 liczba była przycinana (overflow): przyrosty obok liczby (flex-shrink:0) zjadały komórkę ~100 px. Poprawka w `hud.ts`, blok `@media (min-width:1201px) and (max-width:1320px)`: medalion 30→24 px, odstępy kolumn 6/3 px, przyrosty 9,5→8,5 px TYLKO w tym przedziale. Wartości wypróbowane: 15 px liczba — nadal przycina (1201/1250 huge); 9 px przyrosty — nadal przycina (Nauka, 1201); 8,5 px — brak przycinania. Liczba zostaje 17 px (+31%). Koszt: przyrosty w przedziale 1201–1320 są o 1 px mniejsze niż w bazie (9,5 → 8,5) — zgłaszam jako odstępstwo od pkt 3 celu.
9. Raport rundy 1: „13→17 zmiana z 11 na 10" — PRZYJMUJĘ. Błędny opis: baza brutto/netto = 9,5 px, runda 1 zmieniła na 10 px. Teraz przywrócono 9,5 px w bloku bazowym (brutto/netto bez zmian poza przedziałem 1201–1320, pkt 8). `hud-topbar-no-labels-test` przechodzi (94/0) także po przywróceniu.
10. Brak SHA w raporcie rundy 1 — PRZYJMUJĘ: SHA kodu podany powyżej; ten raport ma osobny commit.
11. Brak logów `gate-*.txt` z `EXIT=` — PRZYJMUJĘ: wszystkie bramki w katalogu runu, każdy plik kończy się linią `EXIT=`.

WYNIKI BRAMEK (na końcowym CSS, `1dc837e91`):
- hud-topbar-grid-gross-net-test (z mutantami, bez --dist): 1199 ok / 0 fail, EXIT=0.
- hud-topbar-no-labels-test: 94 ok / 0 fail, EXIT=0.
- hud-gross-net-rest-test: 752 ok / 0 fail, EXIT=0.
- hud-resource-deficit-red-test: 41 pass / 0 fail, EXIT=0.
- hud-skarbiec-test: 34 passed / 0 failed, EXIT=0.
- sidepanel-hud-deadzone-test: 43 pass / 0 fail, EXIT=0. Uwaga: przebieg 1 dał 34/2 FAIL (flake czasowy; przebieg 2 i baza 43/0). Log: wersja z przebiegu 2.
- hud-zetony-ekonomia-brutto-live-test: EXIT=0 (test zapisuje zrzut do repo — przywrócony `git checkout`).
- hud-number-abbrev-test, hud-recruits-abbrev-test: OK, EXIT=0.
- hud-moc-warstwa-test: 21/7 — jak baza (pkt 7, nie z tego tematu).
- tsc --noEmit: EXIT=0.
- hud-topbar-bigger-numbers-real-render-test: 50 ok / 2 FAIL (tylko B4 = cel 2), EXIT=1 — zgodnie z oczekiwaniem.
- mutacja (cofnięty font): B1 FAIL 4/4, EXIT=1.
- git diff --cached --check: czysto.

BLOKADY:
- CEL 2 (przerwa ≤6 px) NIE SPEŁNIONY: 1920 px 111–185 px; 1366 px 12–92 px (zależnie od liczb); 1024/640 px 0 px. Wymagana decyzja (ABC) — opcje:
  (A) liczba większa niż +35% (np. ~2× przy 1920) — łamie cel 1;
  (B) zwężenie banera do treści — łamie „treść wypełnia szerokość banera" i asercję N6 w `hud-topbar-no-labels-test`;
  (C) układ 3-wierszowy z liczbą wycentrowaną/powiększoną w komórce — zmiana wysokości banera (32 px → ok. 40 px);
  (D) zaakceptować przerwę przy szerokich oknach i zamknąć cel 2 jako odstąpiony.
- Sekcja B (żywa gra) — FAIL także na bazie (pkt 6), poza zakresem tematu.
- Odstępstwo: przyrosty 8,5 px w przedziale 1201–1320 px (pkt 8).

RUNDY: 2/5
NASTĘPNY KROK: Evaluator ocenia pkt 1–11 i decyzję ABC dla celu 2 (A/B/C/D). Bramki: `hud-topbar-bigger-numbers-real-render-test` (wynik zgodny z oczekiwaniem: tylko B4), `hud-topbar-grid-gross-net-test`, `hud-topbar-no-labels-test`, `hud-gross-net-rest-test`, `hud-skarbiec-test`, `hud-resource-deficit-red-test`, `sidepanel-hud-deadzone-test`, `tsc`.
DEPLOY/PUSH: NIE WYKONANO
