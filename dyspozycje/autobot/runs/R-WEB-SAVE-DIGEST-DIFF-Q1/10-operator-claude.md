STATUS: PASS-WITH-NOTES
DOMAIN: GAME (integralność zapisu)
TEMAT: R-WEB-SAVE-DIGEST-DIFF-Q1 (tag SAVEDIGEST)
GOAL: ustalić, co dokładnie różni się w digeście po wczytaniu zapisu, i czy to błąd integralności. Zero zmian gra/src i gra/data.
ZMIANY-COMMIT: nowe pliki: gra/tools/savedigest-run.cjs (runner live: tryby rt/A/B, konfiguracje max/default/aionly), gra/tools/savedigest-diff.cjs (strukturalny diff zrzutów full() dopasowany po id), dyspozycje/analizy/ZAPIS-DIGEST-ROZNICA-2026-11-27.md (wynik, tabela, klasyfikacja), dyspozycje/autobot/runs/R-WEB-SAVE-DIGEST-DIFF-Q1/ (ten raport, dane/ 48 KB: podsumowania diffów i surowe rekordy runów). Baza: 5ea1cc362. Commit: patrz sekcja DEPLOY/PUSH. SHA: wpisany przez orkiestratora po commicie (commit z kodem/raportem to czubek pracy).
TESTY:
- tsc --noEmit (gra/): exit 0 (gra/src bez zmian).
- Build live: npx vite build --outDir <scratchpad>/savedigest/dist (poza repo; bez npm run build). Wynik: index.html 15 045 104 B.
- Konfiguracje (seed 4242; maksimum = MAX_PARAMS z CAPREBEL2):
  * max, tryb rt (tura 3): digest surowy len 41659 → 44389 (różny); po odfiltrowaniu 3 pól domyślnych miast (budowaLista, magazynZywnosci, postepBudynkowUsuniete) zrzut full() IDENTYCZNY (41594 = 41594).
  * default, tryb A/B (K=3, tury 4–6): restore vs snap po odfiltrowaniu IDENTYCZNY (41720 = 41720); B ≠ A od tury 4 (po odfiltrowaniu: 43430 vs 43440, 45279 vs 45398, 46410 vs 46844 znaków).
  * max, tryb A/B (K=3): B ≠ A od tury 4 (43428 vs 43468 bez odfiltrowania; po odfiltrowaniu także różne).
  * aionly, tryb rt (tura 3): digest surowy 41785 → 44515 (różny); po odfiltrowaniu IDENTYCZNY (41720 = 41720). Tryb A/B NIE ZMIERZONO.
  * max + bunt stolicy AI: NIE ZMIERZONO (brak w tej rundzie).
- Diff strukturalny (dane/*-diff.txt): tylko w miastach; 42 miasta × 65 znaków = 2730 znaków różnicy surowego digestu pochodzi z trzech kluczy domyślnych (budowaLista: [], magazynZywnosci: 0, postepBudynkowUsuniete: {}) dodawanych przy wczytaniu (ensureCitySaveDefaults, readCityFoodBuffer, leniwa inicjalizacja w production.ts).
- B ≠ A po turze 4 (max i default): pula skarbca i drewno w stolicach AI city16 i city25, manpower city17/city26, rekrutowane jednostki rec_5_city25_*/rec_6_city16_* (typeId, category, q/r, hpMax, stackGroupId, stockPaid różne). Liczba jednostek i miast i kolejność zgodne.
- Wykluczone: detIdSeq/licznik akcji identyczne przed i po wczytaniu; combat/siege rng nieseedowany w ścieżce tury nie występuje (sprawdzone wywołania); brak niekomentowanego Math.random w modułach tury.
- Bramki logic 213, ai-test 297/0: NIE ZMIERZONO w tej rundzie (brak zmian w gra/src, nie uruchamiano).
- pageErrors: 0 w każdym biegu (rt max, A/B max, A/B default, rt aionly).
BLOKADY:
- Przyczyna rozbieżności B ≠ A (realny błąd integralności) NIE ZIDENTYFIKOWANA; hipotezy w dokumencie (pole nieobjęte zapisem albo kolejność iteracji Map/Set po restore; ekonomia stolic AI).
- Konfiguracja max + bunt NIE ZMIERZONO.
- Test B==A tylko na jednym ziarnie i jednym punkcie zapisu (tura 3), 3 tury po wczytaniu.
- Maksimum: przyjęte wg CAPREBEL2 (Trudny, dyplomacja trudna, Wysoki ×4, kultura trudny, kultura AI trudny, flagi ON). Nie ma wyższego poziomu dla tych pól.
RUNDY: 1/5
NASTĘPNY KROK: osobny temat naprawczy (nie ten): odtworzyć minimalnie w tym samym runnerze (seed 4242, default, zapis po turze 3, wczytanie, tura 4) i znaleźć pole stolic AI, które nie trafia do zapisu albo zależy od kolejności; poprawka w gra/src dopiero po odtworzeniu. Dodatkowo: ustalić, czy trzy pola domyślne zmieniają zachowanie (obecnie wynik równoważny dla odczytów, nie dowiedziony przebiegiem).
UWAGI-DLA-ORKIESTRATORA:
- Dispatch zakładał, że digest surowy po restore powinien być identyczny. Pierwszy powód (3 pola domyślne) jest już wyjaśniony i nie jest błędem. Drugi powód (B ≠ A po turze 4) jest realny w obu konfiguracjach. To jest właściwa informacja dla kolejnego tematu.
- Rozmiar w savedigest-diff.cjs liczy wartość bez nazwy klucza (zaniża dla dodanych kluczy). Nie wpływa na wnioski, bo pełne różnice podano jako liczby kluczy.
- Runner savedigest-run.cjs i diff są w gra/tools/ i nie zmieniają gry; do użycia przez kolejny temat.
- Czas biegu: ok. 3–4,5 min na run (3 tury + start). 
- DECISION_REQUIRED: brak (naprawa techniczna, bez pytania do właściciela).
DEPLOY/PUSH: NIE WYKONANO
