# R-WEB-DIPLO-WAR-DECLARE-ZERO-TRUST-Q1 — DODATEK orkiestratora (runda 1)

## Decyzje właściciela (2026-11-13), dosłownie lub w sensie
- „Przyczyną wypowiadania wojny jest utrata zaufania.” Próg możliwości: zaufanie poniżej 30.
- Silniejsza = o co najmniej 20% większa SIŁA MILITARNA (armia + rekruci + wygrane bitwy z tej wojny + bonus trybutu; gospodarki NIE liczymy). Cywilizacja słabsza o ponad 20% nie wypowiada wojny sama nigdy (poza wojną epoki). Przy różnicy poniżej 20% i zaufaniu powyżej zera nikt nie wypowiada.
- Przy zaufaniu 0 silniejsza strona wypowiada wojnę „bez względu na poziom zaufania”, nawet jeśli jest silniejsza o włos. Decyzja ABC (B): nie od razu, tylko po N kolejnych turach zaufania 0 (N jak dziś w hamulcu relacji: clamp(round(8−0,5·dip_prog_wojny),3,7)), z ostrzeżeniem dla gracza.
- „Czy skorzysta z możliwości” (zaufanie <30 i przewaga ≥20%): decyduje charakter cywilizacji (ABC A): zostają dotychczasowe bramki gotowości AI (effAgresja ≥ 0,5, willingnessWar > 0, brak pokoju/paktu/okna wczesnej fazy).
- Gracz NIGDY nie wypowiada wojny automatycznie (decyzja D7). Gdy silniejszą stroną przy zerze zaufania jest gracz — nic się nie dzieje, decyduje sam (ABC A).
- Wojna epoki i bramki R1 (tura ≥ 40) i R2 (Kamień: 1 wojna) zostają bez zmian.

## Zmiany do wykonania
1. Pomocnik siły militarnej narodu (main.ts lub nowy pomocnik w diplomacy-military-strength.ts + adapter w main.ts): zbiera armiaPkt i rekrutPkt tak, jak Power (computeObjectivePower, flaga military w power-params.json; patrz też 10-operator-claude.md z R-WEB-DIPLO-WAR-MILITARY-RATIO-SPEC-Q1, sekcja 2a), punkty wygranych bitew z bieżącej wojny z pary (pomocniki z kroku „licznik bitew”, poza wojną 0) i aktywność bonusu trybutu. Zwraca liczbę dla funkcji computeMilitaryStrength / compareMilitaryStrength z kroku 2.
2. Reguła „może wypowiedzieć” w ai.ts: zastąp dotychczasowy próg siły względnej rw ≥ PROG_WOJNA_SILA (0,6, pełny Power) i warunek „relacja < progMinimalnyRelacja (30)” warunkami: zaufanie pary < 30 ORAZ compareMilitaryStrength pokazuje przewagę AI ≥ 20% (próg z gra/data/diplomacy-military-strength-params.json). Pozostałe bramki bez zmian.
3. Hamulec zerowego zaufania w processDiploCrisisQueue: zastąp licznik oparty na relacji licznikiem kolejnych tur, w których zaufanie pary = 0 i para nie jest w wojnie. Po N turach wypowiada silniejsza strona wg computeMilitaryStrength (z deterministyczną regułą remisu z kroku 2), o ile jest AI; jeśli silniejsza jest strona gracza — brak akcji. Obowiązują dotychczasowe blokady (karencja, rozejm, pakt/NAP, okno wczesnej fazy, R1, R2).
4. Ostrzeżenie dla gracza: gdy zaufanie pary z AI spada do 0 i AI jest silniejsza, jedno powiadomienie (zakładka Dyplomacja/Ważne według istniejących konwencji) „zaufanie spadło do zera — grozi wojna za N tur”; bez spamu (raz na epizod zerowego zaufania).
5. Parametry w JSON (nie w kodzie); zachowaj nazwy N z dotychczasowego JSON, nowe klucze opisane po polsku.
6. Wszystkie odwołania do starego progu rw i relacji w tym bloku wylistuj w raporcie z plik:linia: co zastąpiono, co zostało.

## Kryteria końca (binarne)
- tsc --noEmit exit 0; pięć bramek: logic 213/213, tech-tree 20/0, research 33/0, unit-replace 21/21, combat 6/6; diplomacy-test, diplo-military-strength-test, diplo-war-battle-counter-test, diplo-war-trust-only-test, diplo-respect-military-events-test bez regresji; diplo-war-peace-sim-test (jeśli istnieje) porównany z bazą.
- Nowy test gra/tools/diplo-war-declare-zero-trust-test.cjs, scenariusze: (a) zaufanie 25, AI silniejsze o 25% → wypowiedzenie dozwolone przy gotowości AI; (b) zaufanie 25, silniejsze o 19% → brak; (c) słabsze o >20% → brak niezależnie od zaufania <30 (poza wojną epoki); (d) zaufanie 0 przez N tur, AI silniejsze o włos → wypowiada; N−1 tur → nie; (e) zaufanie 0, silniejszy gracz → brak automatycznej wojny; (f) ostrzeżenie raz na epizod; (g) karencja/rozejm blokuje; (h) mutacja (przywrócenie starego progu rw lub licznika relacji) czerwieni test.
- Testy wymagające wywołania kodu z main.ts: jeśli nie da się uruchomić silnika w node, użyj wzorca z istniejących testów (kontrole strukturalne + czyste funkcje), ale każdą bramkę egzekwującą regułę w main.ts/ai.ts pokryj mutacją, która czerwieni test (lekcja z W45: usunięcie bramki w kodzie musi zmieniać wynik).
- Raport 10-operator-claude.md: lista zmian, tabela „stare → nowe”, opis wpływu na istniejące etykiety (nie zmieniaj ich).

## Środowisko i zakazy
Worktree, w gra/ npm ci --ignore-scripts; ZAKAZ npm run build/dev; tsc --noEmit wolno. Dysk: sprzątaj node_modules po zakończeniu; wolne miejsce bywa < 5 GB. Nie integrujesz, nie deployujesz, nie pushujesz na main. Bez git add -A.
