STATUS: DECISION_REQUIRED (diagnoza Objawu B częściowa; implementacja D1/D3/D4 NIE wykonana w tej rundzie)
DOMAIN: GAME (WEB, `gra/`)
TEMAT: R-WEB-AUTOIMPROVE-PRIORITY-Q1
GOAL: Objaw B (trzoda i irygacja po farmie) — przyczyna plik:linia + dowód; naprawa lub DECISION_REQUIRED.

BAZA: branch `web-wip/AIMP-fc` @ `555e25020` rebase na `origin/main` @ `4d1916f2c` -> kod po rebase `b1bc18707` (cherry-pick R1/R2 `607f636fe`, `985358d2a`). Node_modules tylko do pomiaru, usunięte.

ZMIANY/COMMIT: tylko dowody i skrypty pomiarowe (allowlista): `gra/tools/objaw-b-measure.cjs`, `gra/tools/objaw-cost-probe.cjs`, `dyspozycje/autobot/runs/R-WEB-AUTOIMPROVE-PRIORITY-Q1/*`. Zero zmian w `src/` (Objaw B bez naprawy, patrz niżej). SHA: w sekcji poniżej po commicie.

OBJAW B — WYNIKI
1. Realny przebieg gry (Chromium / pełna tura `main.ts:35727`): NIE ODTWORZONO. Nie uruchamiałem przeglądarki; NIE_ZMIERZONO. Lista prób: tylko wywołanie `pickAutoImprovements` z parametrami jak w `main.ts:35727-35770` (syntetyczna mapa, pula, budżet).
2. Trzoda po farmie (syntetycznie, `objaw-b-measure-r3.txt`): trzoda (`bydlo`) powstaje na heksie rzeki z farmą i obywatelem (run A, E, F, H). Bramki `qualifies` (`improvement-build.ts`, createQualifier, bydlo) i `canAddFoodLayer` (`improvement-build.ts:829-833`) przepuszczają. Brak przyczyny w kodzie picker dla tego scenariusza.
3. Irygacja — ZMIERZONA PRZYCZYNA: koszt irygacji = 60 Pracy (`objaw-cost-probe-r3.txt`; JSON `koszt_praca` 30 × mnożnik epoki 2, `terrain-improvements.ts:108-115`). Budżet FAZY 1 = `pct% × pula` (`auto-improvements.ts:729`, domyślnie 33%: `cities.ts:229`). Irygacja wchodzi tylko, gdy pula >= ~182 (`globalSpent+60 <= 0.33*pula` i `pula-60 >= 30`). Pomiar: pula 150 -> brak irygacji na 4 tury (run I); pula 200 -> irygacja na rzece w turze 2 (run H).
   Skutek: etap E4 (irygacja) praktycznie nie startuje przy typowej puli; farmy na innych heksach zjadają budżet.

ZASADY NIE ZMIENIANE (stare uzgodnienia kolidują — ABC niżej).

PYTANIA ABC (zgodnie z regułą właściciela 2026-10-31; orkiestrator zadaje właścicielowi)
Q1 (trzoda a złoże): `data/terrain-improvements.json` bydlo: „pierwsze pastwisko wymaga złoża bydła” / „ABC-18: dostęp dopiero po postawieniu na złożu trzody”, a kod nie wymaga złoża: `livestock-unlock.ts:162-175` (`return true` dla bydlo) i `improvement-build.ts` (bydlo bez warunku złoża). Opcje:
 A) Zostaw kod (bez złoża), popraw tekst JSON. Konsekwencja: trzoda na każdej łące z farmą+obywatelem (obecne zachowanie).
 B) Wymagaj złoża bydła (zmiana kwalifikacji). Konsekwencja: trzoda tylko na heksach ze złożem — mniej trzody.
 C) Inne (wskaż).
 Rekomendacja: A (kod = obecna gra; JSON to stara notatka ABC-18).
Q2 (irygacja vs budżet 33%): irygacja kosztuje 60 (epoka 2), cap 33% puli. Opcje:
 A) Zostaw cap; irygacja tylko przy puli >= ~182 (obecny skutek).
 B) Etap E4 (irygacja) i E3 (trzoda) zwolnij z capu procentowego (tylko ograniczenie puli rezerwą 30).
 C) Obniż koszt irygacji do 30 (decyzja balansu, dane `terrain-improvements.json`).
 Rekomendacja: B (zgodne z kolejnością E1–E4; cap dotyczy kosztu, nie kolejności).
Q3 (stara reguła „wolno karczować poza rzeką” vs D1–D4): `auto-improvements.ts` `lesneMin`/`wolnoKarczowacPozaRzeka` (~875-883; ECHO 2026-08-27) vs D1 (wycinka na rzece ignoruje próg) i D3 (po rzekach: las poza rzeką). Opcje:
 A) Minimum leśne (`ceil(pop/10)` tartak+obóz) zostaje dla wycinki POZA rzeką; D1/D3 jak w dispatchu.
 B) Minimum leśne usunąć także poza rzeką (po zagospodarowaniu rzek wycinka bez warunku).
 C) Zachować stary próg także po D3 (wycinka poza rzeką dopiero po tartaku+obozie).
 Rekomendacja: A.
Q4 (D4 vs testy „kompleksowość heksa”, R-AI-WYRAB-PRZY-RZECE-FARMY-Q1): przebudowa FAZY 1 na etapy globalne zmienia oczekiwania zamkniętych testów (ECHO „15 heksów naraz”). Nie zmieniano; wymaga decyzji: A) zmienić oczekiwania testów (uzasadnienie D4), B) limit etapu na turę (np. N heksów), C) zostawić FAZĘ 1 i tylko dodać bramkę etapu.
 Rekomendacja: B.

STAN D1, D3, D4 — NIE WDROŻONE w R3 (brak czasu/zakresu w tej rundzie; wymagają Q3/Q4 przed kodem).
ZAŁOŻENIE: nie zmieniano `main.ts` ani `ai.ts`; irygacja/trzoda bez zmian do decyzji Q1/Q2.

TESTY (na `b1bc18707`, EXIT zapisane w logach `gate-r3-*.txt`):
- wyrab-rzeka-krok0-test: 3 PASS / 0 FAIL (baza 3/0)
- wyrab-rzeka-r2-test: 10 PASS / 0 FAIL (baza 10/0)
- auto-improvements-test: 45 passed / 0 failed (baza 45/0)
- ai-improvements-test: 53 passed / 0 failed (baza 53/0)
- tsc --noEmit: EXIT=0
- NIE_ZMIERZONO: diplomacy (148), war-era-counter (82), ring (15), civ-matrix-ai-diplomacy-wiring — nie uruchamiane (brak zmian w src, więc przed/po identyczne).

BLOKADY: brak realnego przebiegu gry w przeglądarce (NIE_ZMIERZONO); decyzje Q1–Q4 od właściciela.
RUNDY: 3/5 (ta runda: pomiar + pytania ABC, bez zmiany src).
NASTĘPNY KROK: odpowiedzi właściciela na Q1–Q4 -> runda 4: (a) realny przebieg Chromium dla Objawu B, (b) implementacja wybranych opcji D1/D3/D4 z testami czerwony PRZED/zielony PO.
DEPLOY/PUSH: NIE WYKONANO
