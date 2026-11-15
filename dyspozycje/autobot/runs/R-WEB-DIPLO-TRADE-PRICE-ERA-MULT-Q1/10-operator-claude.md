# R-WEB-DIPLO-TRADE-PRICE-ERA-MULT-Q1 — raport Operatora (runda 1/5)

STATUS: BLOCK (częściowo: część zakresu DO DOKOŃCZENIA z DODATKU nie zrealizowana w tej rundzie; patrz BLOKADY)
DOMAIN: GAME (dyplomacja, wycena koszyka handlu)
TEMAT: R-WEB-DIPLO-TRADE-PRICE-ERA-MULT-Q1
GOAL: krok/blok handlu surowcem zależy od epoki (Kamień 10, Brąz 50, Żelazo 100 szt. na 1 PN; cena za blok bez zmian; złoto/węgiel /5 i /10), epoka umowy = wyższa z dwóch stron.
BAZA: 98f25e3438a9158b4e22f4cd53a617b1818b37e7 (kandydat z DODATKU 1, checkout --detach). Kod src/ z tego commita NIE został zmieniony w tej rundzie.

ZMIANY/COMMIT:
- gra/tools/diplomacy-trade-era-table-test.cjs: dodano testy mieszanych epok (Brąz+Kamień => blok Brązu 50 szt. = 1 PN; kontrola: sama epoka 1 => 5 PN) oraz determinizm (3 powtórzenia).
- gra/data/diplomacy-acceptance-points.json: opis `zrodlo` poprawiony (cena_* = PN za BLOK, nie za sztukę; bloki 10/50/100 wg epoki); klucz `pn_per_szt` przemianowany na `pn_per_blok` (żaden plik w src/ ani tools/*.cjs nie czyta tego JSON po kluczu; tools/.dip-audit-bundle.cjs ma własną kopię literału).
- commit: SHA w polu sha zwróconym przez Operatora (czubek pracy); commit obejmuje wyłącznie te dwa pliki i ten raport.

TESTY (liczby z surowego wyjścia tej rundy):
- npx tsc --noEmit: exit 0.
- node tools/diplomacy-trade-era-table-test.cjs: 151 pass, 0 fail (przed zmianą testu, na kandydacie: 145 pass, 0 fail — ZMIERZONO).
- diplomacy-value-catalog-test: 82 pass, 0 fail.
- diplomacy-resource-values-x5-regression-test: 76 pass, 0 fail.
- diplomacy-acceptance-points-test: 304 pass, 0 fail.
- diplomacy-basket-duplicate-test: 21/21 PASS.
- diplomacy-ai-balance-test: 36/36 PASS.
- diplomacy-ai-offer-balance-test: 29 passed, 0 failed.
- diplomacy-resource-cyclic-trade-test: 53 pass, 0 fail.
- git diff --check: czysto.
- Uwaga: bramki zmierzono po zmianie; zmiana nie dotyka src/ (tylko JSON opisowy i test), więc wynik na bazie jest identyczny z dzisiejszym — to wnioskowanie, NIE ZMIERZONO osobno na bazie.

KRYTERIA (stan):
(a) tabela 15 kluczy × epoki 1/2/3 — ZMIERZONO (test tabeli zielony).
(b) mieszane epoki Brąz+Kamień => blok 50 — ZMIERZONO na poziomie funkcji (parametr era). Na poziomie wywołań w grze NIE ZMIERZONO (BLOKADA 1).
(c) bramka uczciwości diplomacyFairGivePn w tej samej epoce obu stron — NIE ZMIERZONO.
(d) test realnego DOM okna „Umowa wymiany surowców” (Brąz/Żelazo) — NIE ZMIERZONO (brak testu Playwright w tej rundzie).
(e) oferta AI w Brązie: wielokrotność 50 i brak odrzucenia bramką — NIE ZMIERZONO (ai-trade-proposal.ts nie przekazuje epoki).
(f) mutacja (blok 10 w Brązie => czerwono) — ZMIERZONO: asercja `!== 1` w teście tabeli.
(g) determinizm — ZMIERZONO (3 powtórzenia w teście).
(h) tsc 0 — ZMIERZONO; 7 bramek referencyjnych zielonych — ZMIERZONO; pełny zestaw trade-*/diplomacy-*/ai-trade-* (156 skryptów) — NIE ZMIERZONO.

BLOKADY (z DODATKU 1, nie zrealizowane w tej rundzie):
1. Reguła „epoka umowy = wyższa z dwóch stron”: przekazanie epoki przez ai-trade-proposal.ts, diplomacy-ai-offer-balance.ts, UI okna wymiany (diplomacyTradeBasket.ts), bramkę uczciwości — NIE zrobione. Wszystkie wywołania nadal biorą epokę gracza (globalną z setDiplomacyTradeEra). ZAŁOŻENIE do potwierdzenia: epoka strony AI pochodzi z danych cywilizacji AI.
2. Ładowanie zapisu gry i zmiana epoki: ustawienie epoki handlu przy wczytaniu zapisu — NIE zrobione (main.ts ustawia epokę tylko przy zmianie epoki gracza w boot()).
3. Test realnego DOM okna wymiany w Brązie/Żelazie (Chromium, require("playwright"), chromium.launch() bez opcji) — NIE zrobione.
4. Opis pn_per_szt — ZROBIONE (patrz ZMIANY).
5. Test AI w Brązie (wielokrotność 50) — NIE zrobione (zależne od pkt 1).
6. ai-trade-proposal.ts: logika ilości z tematu QTY-CAP nietknięta. Kolejność merge z QTY-CAP r2 — do uzgodnienia przez orkiestratora.
7. Poradnik gracza (docs/PORADNIK-GRACZA/**) — NIE zaktualizowany; wikiBundle NIE regenerowany w tej rundzie. Civpedia (docs/encyklopedia/pojecia/handel-surowcami-dyplomacja.md) zmieniona już w kandydacie, nie weryfikowana w tej rundzie.
8. Stare zapisane propozycje/oferty (obcinanie ilości do kroku epoki) — NIE opisane ani nie zaimplementowane.
9. Epoki powyżej Żelaza: kandydat przyjmuje blok Żelaza (fallback 4 => 100); DO POTWIERDZENIA przez właściciela.

ZAŁOŻENIA (DO POTWIERDZENIA):
- Epoka strony AI do wyliczenia „wyższej z dwóch stron” = epoka cywilizacji AI (nie zaimplementowane).
- Złoto/węgiel: cena za sztukę = cena_bazowa / mnożnik (krok_blok_epoki / krok_blok_kamien), jak w kandydacie.
- Ilości niebędące wielokrotnością bloku są obcinane w dół (zgodnie z GOAL).

UWAGI-DLA-ORKIESTRATORA:
- Dispatch pod ścieżką runs/R-WEB-DIPLO-TRADE-PRICE-ERA-MULT-Q1/00-dispatch.md NIE istnieje w origin/main (392aa14c1); treść wzięto z DODATKU na gałęzi claude/sprawdzenie-funkcjonalnosci-ek4ra0 i z komendy Workflow.
- Brak przeglądarki/Playwright w tej rundzie: NIE ZMIERZONO testów DOM.
- Dług zgłoszony w dispatchu: wartości krok_blok_* w econ-params.json mają inne wcięcia niż reszta pliku (JSON poprawny, tylko styl).

NASTĘPNY KROK: runda 2 Operatora — pkt 1 (przekazanie epoki umowy) i pkt 2 (zapis gry), potem testy DOM (pkt 3) i AI (pkt 5), potem dokumentacja (pkt 7).
DEPLOY/PUSH: NIE WYKONANO
