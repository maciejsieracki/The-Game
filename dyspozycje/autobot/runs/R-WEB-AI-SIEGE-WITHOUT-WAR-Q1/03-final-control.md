STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-AI-SIEGE-WITHOUT-WAR-Q1
GOAL: Oblezenie i szturm miasta tylko w stanie wojny. Koniec wojny zdejmuje oblezenie, takze w starych zapisach.
ZMIANY/COMMIT: sprawdzono e6d4c8f85 (obrona r1) na 1d7200589 (operator r1). Baza 23dd158e9, origin/main = 1099bdac2, merge-tree e6d4c8f85 do origin/main czysty. Kod produkcyjny: gra/src/main.ts + nowy gra/src/game/diplomacy-siege-war-gate.ts (w zakresie diplomacy-*.ts).
TESTY (wlasne, e6d4c8f85): ai-siege-requires-war-test 48 OK / 0 FAIL EXIT=0 (mutacja bramki lamie 24 asercje); oblezenie-remis-endsiege 271/0; oblezenie-siege-lifted-po-bitwie 16/0; tsc --noEmit EXIT=0. Jedyne miejsce ustawiajace city.oblegane=true (main.ts:16193) lezy w startMapSiege, ktory ma bramke; sciezka presetu (main.ts:41334) wchodzi przez startMapSiege.
WERDYKTY ZARZUTOW: allowlista - ODDAL; 16 starych FAIL regresji (te same nazwy PRZED/PO wg logow operatora) - ODDAL (poza zakresem); brak obejscia w main.ts - ODDAL; NOTA 2 test behawioralny - naprawiony w obronie, ODDAL; NOTA 3 - ODDAL; NOTA 1 pomiar live - DO DECYZJI CZLOWIEKA/NIE_ZMIERZONO. Zero NAPRAW.
Uwaga: obrona deklaruje poprawke komunikatu w oblezenie-siege-lifted-po-bitwie-test.cjs, ale ten plik nie jest w diffie e6d4c8f85; bez wplywu na wynik.
BLOKADY: NIE_ZMIERZONO: symulacja >=5 ziaren/150 tur PRZED/PO, wizualna nakladka, relacja AI-gracz w zgloszeniu wlasciciela (jesli faktycznie byla 'wojna', np. wymuszona, poprawka jej nie zmienia). Testy 'live' timeout, nie weryfikowane.
RUNDY: 1/5
NASTEPNY KROK: integracja orkiestratora: cherry-pick 1d7200589 + e6d4c8f85 + ten raport; main.ts moze kolidowac z rownoleglymi tematami. Kolejnosc wzgledem origin/rust-port/parity-v2 (6b3882cad): niezalezne (web gra/ vs Rust), dowolna kolejnosc. Po integracji pomiar live przez orkiestratora/wlasciciela.
DEPLOY/PUSH: NIE WYKONANO
