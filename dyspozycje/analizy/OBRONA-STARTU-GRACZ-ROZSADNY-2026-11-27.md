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
Readback: w logu każdego przebiegu zapisany jest wysłany słownik `adv` oraz odczyt tury i skarbca po starcie;
pełnego readbacku ustawień z gry runner nie wykonuje (NIE ZMIERZONO).

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
1. Karta „Rekrutuj” w widoku miasta w tym harnessie nie pojawia się (w panelu miasta brak kart rekrutacji
   `.unit-recruit-submit`; sprawdzone w turach 1–3, runner zapisuje diagnostykę w `tries`).
2. Ścieżka `__empireRecruitTestDebug.order` wymaga wybranego generała rekrutującego; gracz na starcie ma tylko
   Zwiadowcę, więc generała nie ma (rekrutacja z panelu armii jest w grze wyłączona — to zgodne z regułą gry).
3. Hak `__siegeBlockTestDebug.tryPurchase(cityId)` (realne `purchaseRecruitmentUnit`) nie przyjmuje identyfikatora
   jednostki i kupuje PIERWSZĄ jednostkę z listy — w przebiegu próbnym była to Zwiadowca (cywilna), nie wojskowa.
   Wybór Łucznika (najtańszej wojskowej, koszt 12) wymagałby zmiany `gra/src/main.ts` (parametr hooka), co jest
   poza allowlistą tematu.
Pomiar czasu budowy (ile tur do pierwszej jednostki) jest więc niemożliwy do wykonania bez decyzji o rozszerzeniu
allowlisty. Obserwacja pomocnicza z próby (1 przebieg, seed 4242): skarbiec gracza na starcie to 0, przyrost
około +2 na turę; Łucznik (koszt 12) byłby możliwy do opłacenia dopiero około tury 6–7 (wartość z logu prób:
skarbiec 0,3,5,7,9,11,13 w turach 1–7). Ta obserwacja pochodzi z przebiegu, w którym kupiono Zwiadowcę, a nie
Łucznika, więc nie jest pomiarem czasu budowy jednostki wojskowej.

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
  baza porównania.
- Readback ustawień: tylko wysłane parametry i odczyt tury/skarbca.
- Bramki: `tsc` = 0 (surowe wyjście: exit 0). `logic 213` i `ai-test 297/0` NIE URUCHOMIONO: zmiany dotyczą
  wyłącznie `gra/tools/realdef-live.cjs` (nie kod gry), więc bramki logiki nie były zmieniane.
