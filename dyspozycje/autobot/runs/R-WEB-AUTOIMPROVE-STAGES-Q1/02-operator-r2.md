STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB, `gra/`)
TEMAT: R-WEB-AUTOIMPROVE-STAGES-Q1
RUNDY: 2/5 (Operator, obrona zarzutow FC R1; baza: bc045cf22)

ODPOWIEDZI NA ZARZUTY
1. PRZYJMUJE. `keyBlockedOnHex` limitowal tartak/oboz we wszystkich przebiegach. Teraz limit `ceil(pop/10)` wlacza
   wylacznie flaga `limitForestKeysToMinimum` ustawiana w przebiegach K1/K2/K3 (krok niedoboru, etapy E1..E6, fallback
   miast zywnosciowych) — auto-improvements.ts (opcja ~404, uzycie ~1226, ustawienia ~616/638/679). Profile „surowce” (S)
   i „infrastruktura” (I) = zachowanie bazy 4d1916f2c. Dowod: test (k) [S] tartak 6 == 6 (kod R1: 2 -> CZERWONE),
   [I] tylko infrastruktura. Mutacje: MUT-A (limit nigdzie) zabita przez 4 asercje (k2), MUT-B (limit wszedzie = R1)
   zabita przez (k).
2. ODRZUCAM CZESCIOWO. „1 na 10 obywateli” NIE jest nowa regula operatora: to istniejace ECHO 2026-08-27 (`lesneMin`,
   auto-improvements.ts ~1170, baza 4d1916f2c ~966), stosowane juz w bazie do bramki wyrebu. Limit w przebiegach K1/K2/K3
   egzekwuje te sama stara regule i jest potrzebny, zeby krok niedoboru drewna nie stawial tartaku na kazdym lesie przed
   wyrebem (ai2-heks-po-heksie scenariusz I: bez limitu 30 tartakow, 0 wyrebow — zmierzone, 31/5). Zakres zawezony (zarzut 1).
   Pytanie ABC-B zostaje otwarte do odpowiedzi wlasciciela (kontekst K2/K3).
3. PRZYJMUJE — NAPRAWIONE. `ai-ulepszenia-malo-budowane-test`: PO R2 13/0 (R1: 12/1). Przyczyna: limit dzialal w przebiegach
   poza K1/K2/K3. Po zawezeniu flagi nie ma regresji (log po-r2-ai-ulepszenia-malo-budowane-test.txt, EXIT=0).
4. ODRZUCAM jako poza zakresem R2: Z1a/Z1d/Z1g/Q2o czerwone tez na bazie. Zrodlo: `ULEPSZENIA_FOCUS_ZYWNOSC` zawiera
   `tartak` (auto-improvements.ts:73) — to dokladnie pytanie ABC-A/ABC-B (decyzja wlasciciela, stara regula zostaje).
   Po R2 Z1a pokazuje 10 tartakow (sciezka bez etapow: test wola picker bez `foodImprovementStages`, brak limitu = baza).
5. ODRZUCAM. ai.ts: import `IMPROVEMENT_FOR_DEFICIT` zamiast duplikatu tablicy (zero zmiany wartosci) — jedno zrodlo
   prawdy dla K2=K3 (parytet, test (j)); plik w allowliscie, reszta zmian to argumenty wywolania pickera.
6. PRZYJMUJE JAKO NOTE: NIE_ZMIERZONO na zywej grze (brak Chromium, build w gra/ zabroniony). Hipoteza „niedobor prawie
   stale prawdziwy” nadal niezweryfikowana; pomiar wymaga srodowiska z `PLAYWRIGHT_CHROMIUM_EXECUTABLE`. Zostaje
   jako warunek dla Evaluatora/orkiestratora.
7. ODRZUCAM jako brak poprawki, DODAJE POMIAR. Dodano w tescie (k3) pomiar informacyjny: picker (K2 i K3) stawia tartak
   (K2 takze oboz) na heksie centrum miasta z lasem przy niedoborze drewna: [tartak,oboz_lowiecki]/[tartak]. To wlasciwosc
   pickera niezalezna od zmian R1 (brak wykluczenia heksu centrum w `candidateHexes`, auto-improvements.ts:908) —
   NIE naprawiam bez decyzji (poza zakresem), zglaszam jako pytanie ABC-F (K2/K3): czy wykluczyc heks centrum miasta.
   Obejscie w ai2 scenariusz I zostaje, ale teraz jest jawnie udokumentowane pomiarem.

PYTANIA ABC DO ORKIESTRATORA (stare reguly zostawione)
A (K1) tartak/oboz w profilu „Zywnosc”; B (K2/K3) kiedy tartak: „1 na 10” czy tylko przy niedoborze; C (K2/K3) prog <10;
D (K2 vs K3) `maxItemsPerCity: 1` AI; E lama na lesie; F (K2/K3) wykluczenie heksu centrum miasta z tartaku/obozu.

TESTY (kod R2, logi gate-r2-*.txt / po-r2-*.txt, kazdy z jedna linia EXIT=)
tsc EXIT=0; wyrab-rzeka-krok0 3/0; wyrab-rzeka-r2 10/0; wyrab-rzeka-d1 2/0; auto-improvements 45/0; ai-improvements 53/0;
ai-food-stages 13/0; ai2-heks-po-heksie 36/0; hodowla-las 113/0; diplomacy 148/0; war-era-counter 82/0; ring 15/0;
autoimprove-stages-q1 111/0 (nowe: (k) S/I bez zmian, (k2) limit K2/K3, (k3) pomiar); ai-ulepszenia-malo-budowane 13/0;
ai4-popyt-obywatele 46/4 (Z1a/Z1d/Z1g/Q2o — czerwone tez na bazie, poza zakresem).
Mutacje R2: mutacje-r2-autoimprove-stages-q1-test.txt (2/2 zabite).

BLOKADY: pomiar na zywej grze NIE_ZMIERZONO (brak Chromium); zywy tick wieloturowej wycinki NIE_ZMIERZONO.
NASTEPNY KROK: Evaluator R2, potem Final Control i integracja orkiestratora.
DEPLOY-PUSH: NIE WYKONANO
