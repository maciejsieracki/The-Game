STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-ANNEX-CITYSTATE-SPOILS-Q1
GOAL: Aneksja panstwa-miasta przenosi jego majatek na przejmujacego tak jak eliminacja przez zdobycie, a komunikat pokazuje komplet.

ZMIANY/COMMIT: kod+test `7f5285dd4` (baza `b89ecee44`, zawiera `f568e1ed3`), raport operatora `3150d8371`. Final Control: tylko ten plik. Allowlista: `git diff --name-only b89ecee44 7f5285dd4` = gra/src/game/capital-capture.ts, gra/src/main.ts, gra/tools/annex-citystate-spoils-test.cjs (nowy), gra/tools/elimination-full-spoils-test.cjs (uzasadniona aktualizacja kotwicy mutacji); `7f5285dd4..3150d8371` = wylacznie runs/<ID>/**. Zero zmian w gra-robocza, WERSJE.md, rust-port.

TESTY (odtworzone samodzielnie na 3150d8371, npm ci --ignore-scripts, node_modules usuniete po pracy):
- tsc --noEmit: EXIT=0
- annex-citystate-spoils-test: 79 passed, 0 failed
- capital-capture-test: 107/107; elimination-full-spoils-test: 114/114
- ai-cs-absorption, ai-major-absorb, elimination-toast-merge: EXIT=0
- eliminacja-lup-kwoty-test: 34 passed / 4 failed (4e-4h, got null). Wg Evaluatora identyczny wynik na bazie (blad istniejacy, nie regresja); samodzielnie na bazie NIE_ZMIERZONO.
- wydarzenia-eliminacja-podboj-karta-test: przekroczyl 100 s (NIE_ZMIERZONO); test nie odwoluje sie do annexCityStateToOwner/applyAnnexCityStateSpoils.
- Przeglad diffu: refaktor applyCapitalCapturePlunder zachowuje semantyke (kolejnosc skarbiec/Praca/zywnosc/Nauka; Zdarzenie 1: skarbiec przenoszony, Praca zerowana bez transferu; techy tylko eliminacja). annexCityStateToOwner wola rdzen PRZED eliminateOwner na tych samych akcesorach; barbarzynca-ofiara -> null, barbarzynca-wchlaniajacy -> no-op zapisow. Relacje/kary bez zmian. Odjecie ceny aneksji od skarbca MP w galezi `wchloniecie` poprawne (inaczej cena wracalaby do platnika).

ROZSTRZYGNIECIE ZARZUTOW: brak zarzutow NAPRAW. Uwagi Evaluatora: (1) brak weryfikacji w przegladarce -> ODDAL, NIE_ZMIERZONO swiadomie (zakaz build/dev, main.ts bez eksportow; wiazanie sprawdzone testem po zrodle). (2) Sformulowanie "przejeta od wyeliminowanej cywilizacji" w wierszu Puli pracy przy aneksji -> ODDAL (kosmetyka). (3) Zalozenia (techy niekopiowane, Moc niedopisywana, komunikat tylko dla gracza) zgodne z dispatchem -> ODDAL. Pre-existing 4 FAIL -> ODDAL. Zero pozycji DO DECYZJI CZLOWIEKA.

BLOKADY: brak (poza NIE_ZMIERZONO wyzej).
RUNDY: 1/5 (FC: PASS-WITH-NOTES)
NASTEPNY KROK: integracja orkiestratora: SHA do integracji `7f5285dd4` (kod+test; runs/<ID> opcjonalnie). Kolejnosc: najpierw origin/main (zmiana web w `gra/`); origin/rust-port/parity-v2 nie zawiera b89ecee44 ani tej zmiany (merge-base f4c89d008) i nie dotyka tych plikow, wiec nie ma konfliktu kolejnosciowego; parity-v2 wchodzi po main, jesli port ma utrzymac parytet aneksji (osobny temat).
DEPLOY/PUSH: NIE WYKONANO
