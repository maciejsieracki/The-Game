# Obrona startu gracza „rozsądnego” — pomiar REALDEF (2026-11-27)

Status: **częściowy** (BLOCK dla kryterium P1; P0 zmierzone w pełnej liczbie). Tag: R-WEB-EARLY-DEFENSE-REALISTIC-Q1.
Baza kodu: origin/main acd4d774b (DEFEAT r1). Zero zmian w logice gry, balansie, `gra/data/**` i `gra/src/**`.

## Pytanie
DEFEAT (dyspozycje/analizy/PRZEGRANA-GRACZA-PRZYCZYNA-2026-11-27.md) zmierzył: pasywny gracz na maksimum
(Trudny, dyplomacja trudna, Wysoki ×4, kultura trudny, barbarzyńcy TRUDNY) traci jedyne miasto w 92% przebiegów
w turach 8–15. Nieznane było, czy 92% jest artefaktem pasywnego harnessu, czy uważny gracz (buduje jednostkę
obronną) przeżywa pierwsze 20 tur.

## Ustawienia (maksimum)
Start: `__settingsLive.startNewGame` z parametrami maksimum (jak w DEFEAT r2), barbarzyńcy `trudny`,
wymuszony fort przy mieście gracza (jak w DEFEAT — wspólna baza porównania). Seedy 4242 i 7. Maksimum poziomów
wg zasady testowania właściciela (26.11): wszystkie suwaki ustawione na najwyższy poziom dostępny w kreatorze
(barbarzyńcy trudny, dyplomacja trudna, kultura trudny, Koszty jednostek Wysoki ×4, Wzrost ludności Wysoki).
Readback: runner od tej rundy zapisuje w linii `start` wysłany słownik `adv` ORAZ odczyt faktycznych ustawień z gry
(`__settingsLive.getSettings`, pole `settingsReadback`). Serie P0 zebrane w r1 (40 wierszy) NIE mają pola `settingsReadback`
— ich readback jest tylko wysłany słownik i tura/skarbiec po starcie (NIE ZMIERZONO dla tych przebiegów).

## Wyniki P0 (pasywny — kontrola), 20 przebiegów na seed, 20 tur
Dane: `dyspozycje/autobot/runs/R-WEB-EARLY-DEFENSE-REALISTIC-Q1/dane/dane-p0-s4242-s7.jsonl` (40 wierszy).

| Polityka | Seed | Przebiegi | Miasto utracone | Odsetek przeżytych miast po 20 turach | Tura utraty (mediana, zakres) | Zdobywca |
|---|---|---|---|---|---|---|
| P0 pasywny | 4242 | 20 | 20 | 0% | 9,5 (8–14) | barbarzyńcy (cityOwnerAfter −1) |
| P0 pasywny | 7 | 20 | 19 | 5% | 9 (8–17) | barbarzyńcy (−1); 1 przebieg: miasto zostało (0) |
| P0 razem | — | 40 | 39 | 2,5% | — | — |

Wnioski (opisowe): kontrola reprodukuje DEFEAT (DEFEAT: 34/37 = 92% utraty; tu 39/40 = 97,5%, różnica w granicach
losowości przy tych liczebnościach; nie ma podstaw do twierdzenia o różnicy). Pasywny gracz traci jedyne miasto
w pierwszych 8–17 turach. Błędów pageerror: 0.

## P1 — „budowa jednostki obronnej” — NIE ZMIERZONO (BLOCK)
Przyczyna (udokumentowana próba):
1. Karta „Rekrutuj” w widoku miasta nie pojawiła się w próbie (brak `.unit-recruit-submit` w turach 1–3).
   Diagnostyka prób (pole `tries`) NIE została zacommitowana: w `gra/tools/realdef-live.cjs` tego pola nie ma,
   więc liczba prób i sprawdzanych kart nie jest dowiedziona w repo. Kod gry podaje możliwą przyczynę:
   `gra/src/ui/cityPanel.ts` (~9604–9660) przy pustej liście kupowalnych jednostek pokazuje komunikat
   „(brak jednostek do kupienia — zbadaj technologie / Koszary)”, czyli karta może nie istnieć, dopóki gracz nie ma
   technologii lub Koszar. To wskazanie z kodu, NIE ZMIERZONO na żywo (nie sprawdzono, co widzi gracz w turze 1).
2. Ścieżka `__empireRecruitTestDebug.order` wymaga wybranego generała rekrutującego; gracz na starcie ma tylko
   Zwiadowcę, więc generała nie ma (rekrutacja z panelu armii jest w grze wyłączona — to zgodne z regułą gry).
3. Hak `__siegeBlockTestDebug.tryPurchase(cityId)` (realne `purchaseRecruitmentUnit`) nie przyjmuje identyfikatora
   jednostki i kupuje PIERWSZĄ jednostkę z listy — w przebiegu próbnym była to Zwiadowca (cywilna), nie wojskowa.
   Wybór Łucznika (najtańszej wojskowej, koszt 12) wymagałby zmiany `gra/src/main.ts` (parametr hooka), co jest
   poza allowlistą tematu.
Pomiar czasu budowy (ile tur do pierwszej jednostki) jest więc niemożliwy do wykonania bez decyzji o rozszerzeniu
allowlisty. Obserwacji skarbca z próby NIE podaję: próba używała haku zakupu, który przed zakupem ustawia skarbiec
na 999999 i manpower na 99999 (`gra/src/main.ts` ~30276–30290), więc wartości skarbca z tej próby nie są pomiarem
gry bez zmian. Czas budowy jednostki wojskowej: NIE ZMIERZONO.

## Test istotności (Fisher, dwustronny) — P0 r1 vs DEFEAT r2
Tabela 2×2 (utrata / przeżycie miasta): P0 r1 = 39/40 (1 przeżycie), DEFEAT r2 = 34/37 (3 przeżycia).
Wynik: p = 0,346 (obliczone stdlib, python `comb`, dwustronnie). Różnica NIE jest istotna przy α = 0,05.
Zgodnie z tym wnioskiem P0 r1 nie wskazuje na różnicę względem DEFEAT r2.
Uwaga: test porównuje dwa pomiary P0 tej samej polityki, a nie P0 z P1 — dla oceny wpływu budowy jednostki potrzebny
jest P1, który NIE został zmierzony.

## Metryki wymagane dispatchem, których NIE zebrano w P0
- liczba jednostek barbarzyńców w pobliżu miasta w turze utraty (pole `barb` przy wierszu `turn` z haka cityThreatProbe):
  NIE ZMIERZONO w wierszach result — runner zapisał `tracked` tylko w logach `realdef-*.txt`, poza repo;
- tura pojawienia się pierwszej jednostki gracza (turn-to-first-defender): runner liczy `firstDefender`, ale nie zapisuje
  go do wiersza result — NIE ZMIERZONO w danych;
- siły (log bitew): NIE ZMIERZONO.

## P2 — „P1 + bitwy rozstrzygane przez gracza” — NIE ZMIERZONO
Runner nie ma ścieżki ręcznej bitwy (`clearBattles` klika wyłącznie `data-act="auto"`). Próba nie została
podjęta, ponieważ zależy od P1. Wniosek: NIE ZMIERZONO.

## P3 — „P1 + mury” — NIE ZMIERZONO
Zależy od P1; dostępność murów w pierwszych 20 turach nie została sprawdzona. NIE ZMIERZONO.

## Wniosek dla decyzji o balansie
- Kontrola P0 potwierdza DEFEAT: bez jednostki wojskowej gracz traci jedyne miasto w 8–17 turach (39/40).
- Pytanie „czy rozsądny gracz przeżywa” pozostaje OTWARTE: pomiar P1 wymaga decyzji orkiestratora o minimalnym
  rozszerzeniu hooka zakupu (wybór typu jednostki) albo o innej ścieżce realnej produkcji wojskowej w widoku miasta.
- Nie formułuję oceny „za trudne” (decyzja właściciela).

## Odchylenia od dispatchu
- P1 zablokowany (patrz wyżej); P2/P3 NIE ZMIERZONO.
- Wymuszony fort (`forceFortLive`) zostaje jako baza, jak w DEFEAT — to nie jest zachowanie gracza, lecz wspólna
  baza porównania. Hak `forceFortLive` ZMIENIA stan gry (stawia fort), więc wnioski dotyczą gry z wymuszonym fortem,
  nie zwykłej gry bez tego zabiegu. Ograniczenie zakresu wniosków.
- Runner przyjmuje tylko politykę p0 (walidacja argv) — konsekwencja blokady P1.
- Readback ustawień: w r1 tylko wysłane parametry i odczyt tury/skarbca (patrz wyżej; poprawka w runnerze na przyszłe biegi).
- Bramki: `tsc` = 0 (surowe wyjście: exit 0). `logic 213` i `ai-test 297/0` NIE URUCHOMIONO: zmiany dotyczą
  wyłącznie `gra/tools/realdef-live.cjs` (nie kod gry), więc bramki logiki nie były zmieniane.
