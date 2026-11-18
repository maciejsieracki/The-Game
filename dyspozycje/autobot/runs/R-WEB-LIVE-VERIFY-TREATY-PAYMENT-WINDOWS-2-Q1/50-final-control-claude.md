STATUS: PASS-WITH-NOTES
DOMAIN: GAME (pomiar na żywo; bez zmian logiki gry)
TEMAT: R-WEB-LIVE-VERIFY-TREATY-PAYMENT-WINDOWS-2-Q1
GOAL: (a) żywy render wiersza płatności D w oknie traktatu (Chromium, zrzut, asercje, mutacja); r3 zawężona do (a) + drobnice (f-DOM, d-rozejm).
ZMIANY/COMMIT: kandydat 2a2e76e6dc6917e08d1c36889ce2c7669aa6fb05 = potomek bazy 2b54ffd58 (merge-base --is-ancestor OK). Diff vs baza: gra/tools/diplo-treaty-pay-window-live-verify-2-test.cjs (nowy), gra/src/main.ts (+/-: opcjonalny 7. parametr extraPayload haka pushNegotiationForTest w bloku __truceTestDebug; tylko civTest, bez zmiany logiki), raporty i dowody w runs/<ID>/. Allowlista zachowana. integration_sha = 2a2e76e6d (ten raport: osobny commit tylko z tym plikiem).
TESTY (własny bieg, surowe):
- tsc --noEmit: exit 0
- logic 213/213; tech-tree 20 pass 0 fail; research 33/33; unit-replace 21/21; combat 6/6 (bramki zielone na kandydacie, więc porównanie z bazą zbędne)
- Chromium (bundle vite poza repo /tmp/fc-bundle, DSF 1, 1400x900): diplo-treaty-pay-window-live-verify-2-test.cjs 29/29 passed; wiersze D: "606 złoto", "100 złoto, 1700 brąz", "technologia Obróbka drewna, 596 złoto"; przelew płatnik-/odbiorca+ == wiersz; r z okna ≈ 1,3; Przyjmij aktywne i kliknięte realnie; zero pageerror. Zrzuty case1-3 odtworzone (402-403 KB, <=1 MB).
- Mutacja (log r4 w dowodach): 1/4 passed, 3 FAIL (wiersz D usunięty w kopii) - test czerwieje.
ROZSTRZYGNIĘCIE ZARZUTÓW:
1 ODDAL (ograniczenie headless: natywny title niewidoczny na zrzucie; dowód = DOM; ocena wizualna NIE ZMIERZONO).
2 ODDAL (case2.png dodany w kandydacie, zweryfikowane).
3 ODDAL (d-rozejm NIE ZMIERZONO; DODATEK dopuszczał; przyczyna "nie wykonano w r3" - luka, nie blokada celu (a)).
4 ODDAL (DODATEK r3: przemarsz LUB wasal; wasal, sojusz, kierunek gracz->AI NIE ZMIERZONO).
5 ODDAL (dublowanie wiersza D w tooltipie - kosmetyka UI poza allowlistą; kandydat na R-WEB-UI-*).
6 ODDAL (naprawione w obronie: brak aktywnego Przyjmij = FAIL iii0, bez fallbacku).
BLOKADY: brak.
RUNDY: FC r3/5 (Operator Sonnet po 2 nieudanych Haiku).
NIEZMIERZONE (uczciwie): wygląd tekstu wiersza D na zrzucie; wasal/sojusz; kierunek gracz->AI; d-rozejm przez acceptTruceForTest.
UWAGI-DLA-ORKIESTRATORA: dublowanie wiersza D/podziału PW w tooltipie (plainTextWithTitles, diplomacyAcceptanceBalance.ts:800-812) -> osobny R-WEB-UI-*; pozostałe NIE ZMIERZONO jako ewentualny temat r4 (wasal, gracz->AI, rozejm). Pliki /tmp: /tmp/fc-bundle, /tmp/fc-shots. Brak procesów w tle.
NASTĘPNY KROK: integracja orkiestratora 2a2e76e6d (tylko narzędzia/raporty/hak civTest; bez wdrożenia ROBOCZEJ wymaganego).
DEPLOY/PUSH: NIE WYKONANO
