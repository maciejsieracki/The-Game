STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB, gra/)
TEMAT: R-WEB-SAVELOAD-PRACA-POOL-Q1
GOAL: wczytanie zapisu zachowuje pule Pracy gracza (ABC A); ograniczana tylko wartosc nierealna.
ZMIANY/COMMIT: tylko dokumentacja runu (ten plik + evidence/pre/INDEKS.md). Kod bez zmian wzgledem 7c0b3a3c1.

ODPOWIEDZI NA ZARZUTY (wszystkie nieblokujace):
1. Per fotel hot-seat: PRZYJMUJE jako luke, ODRZUCAM jako poprawke w tym temacie. Pole pracaPoolByHuman nie trafia do meta
   zapisu; asercja dla fotela 1 po round-trip nie ma sensu bez zmiany formatu zapisu (poza allowlista, osobny temat,
   wymaga ABC). Fotel 0 asertowany (405). Fotel 1+ NIE_ZMIERZONO po swiezym zaladowaniu strony.
2. Prog 1_000_000: ODRZUCAM jako defekt, przyjmuje jako uwage. Uzasadnienie jest w komentarzu nad
   PRACA_POOL_LOAD_SANITY_MAX (main.ts ok. 12696-12706): 3 rzedy wielkosci nad zmierzonym maks. 405, przyciecie do progu a nie
   zerowanie. Obnizanie progu bez pomiaru pul po 300+ turach byloby zgadywaniem (ryzyko powrotu buga); historia
   buga map-total NIE_ZMIERZONO. Zalozenie: lepiej zachowac niz skasowac pule gracza.
3. Hak __pracaPoolSaveLoadTestDebug poza miejscem odczytu: ODRZUCAM jako naruszenie, przyjmuje jako formalne rozszerzenie
   zakresu. Hak jest wylacznie testowy (wzorzec jak __eraTestDebug), bez wplywu na logike gry, niezbedny do live-testu
   round-trip na realnym buildSaveGameSnapshot/restoreGameFromSave. Jego usuniecie = brak testu live.
4. Niepelne PRZED/PO i szum w evidence/pre: PRZYJMUJE czesciowo. Dodano evidence/pre/INDEKS.md oznaczajacy, ktore logi
   sa dowodem tematu, a ktore szumem (logow nie usuwam, zeby nie kasowac dowodow). Evaluator odtworzyl niezaleznie
   auto-improvements 46/0 i diplomacy 148/0 oraz live 13/0 i mutacje 6 pass/7 fail. Szesc padajacych testow save/load pada
   tak samo PRZED (nie regresja); dwa testy hotseat live to INFRA.

TESTY: bez nowych uruchomien (zmiana wylacznie dokumentacyjna); kod = 7c0b3a3c1, wyniki jak w 01-operator-r1.md i u Evaluatora.
BLOKADY: brak
RUNDY: 1/5 (obrona)
NASTEPNY KROK: Final Control, to samo ID.
DEPLOY/PUSH: NIE WYKONANO
