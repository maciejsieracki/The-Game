# DODATEK (runda 1/5, Operator HAIKU 5.5)
## Fakty
Poprzedni pomiar (częściowy): dyspozycje/analizy/WOJNY-EPOKI-PO-ZMIANACH-2026-11-25.md, dane w dyspozycje/autobot/runs/R-WEB-MEASURE-ERA-WAR-START-AFTER-CHANGE-Q1/dane/. Runner: gra/tools/war-duration-measure.cjs (patche pomiarowe: ai-city-live-measure.cjs --prepare, ai-war-weariness-live-audit-hook.cjs na KOPII gra/; hak __wwDump w main.ts; hak powodu końca __diploWarEndLog z FALI 909). Awarie Chromium (SIGSEGV, „Target page closed”) ≠ błąd gry; wznowienia reseedują PRNG (odcinki nie bit-identyczne). Pole epoki cywilizacji NIE było w rekordach — dodaj je w runnerze/patchu na kopii (np. empireEpochForOwner(oid) per civ per tura) albo odczytaj z haka civTest.
## Zadanie
1. Zbuduj kopię gry poza repo (node ./node_modules/vite/bin/vite.js build --outDir /tmp/<unikalny> --emptyOutDir na kopii z patchami; NIE npm run build w repo; NIE zmieniaj gra/src w repo).
2. Dodaj do runnera (gra/tools/war-duration-measure.cjs lub nowy gra/tools/era-war-q2-measure.cjs — w allowliście) pole epoki każdej cywilizacji per tura oraz zapis __diploWarEndLog; segmentuj bieg (--stop-at co ~20–30 tur, slot zapisu po każdym odcinku), po awarii Chromium wznów ze slotu (do 4 prób na odcinek), bez run_in_background (krótkie wywołania ≤ 590 s, kolejne odcinki osobnymi wywołaniami).
3. Seed 4242 i 7, do tury 120 (jeśli nie dochodzi — zapisz ostatnią zmierzoną turę i powód).
4. Analiza (dyspozycje/analizy/WOJNY-EPOKI-Q2-2026-11-26.md): tabela wojen (para, typ naturalna/epoka, start, tura wejścia obu stron w epokę, opóźnienie, koniec, czas, powód końca, zmęczenie, miasta zmienione), wojny naraz per cywilizacja, udział gracza, sojusznicy; porównanie z regułami FALA 906/908 (werdykt ZGODNE/NIEZGODNE/NIE ZMIERZONO). Znalezione ewentualne błędy gry — tylko opis z odtworzeniem (UWAGI-DLA-ORKIESTRATORA), bez poprawek kodu gry.
5. Dane: jsonl.gz + SHA256SUMS w runs/…/dane/.
## Allowlista
gra/tools/war-duration-measure.cjs (tylko rozszerzenie pól), nowy gra/tools/era-war-q2-measure.cjs, dyspozycje/analizy/WOJNY-EPOKI-Q2-2026-11-26.md, dyspozycje/autobot/runs/R-WEB-MEASURE-ERA-WAR-Q2-Q1/** (dane). Zero zmian gra/src, gra/data.
## Zakazy
gra/src/**, gra/data/**, gra-robocza/, gra-kanon/, dyspozycje/WERSJE.md, manifest, rust-port/, npm run build/dev w gra/, git add -A, push, spawn_task/create_session/create_trigger/send_later (ZAKAZANE), run_in_background w Bash, --no-gpg-sign. Dysk >= 6 GB; usuń node_modules/tmp po pracy. Nie pytaj właściciela. Chromium z /opt/pw-browsers/chromium (NIE instaluj Playwright).
## Bramki ogólne
tsc 0 (bez zmian src); testy tematu: runner uruchamia się, rekordy zawierają pole epoki; dane z SHA256SUMS. Zacommituj i zwróć SHA.
## Binarne kryterium
Pomiar seed 4242 i 7 do t120 lub jawny powód przerwania; tabela z epoką i powodem końca; odpowiedzi na wszystkie pytania z GOAL albo NIE ZMIERZONO z przyczyną.
