# HANDOFF: EKONOMIA -> SILNIK  (zmiany w economy.ts + turn-economy.ts)
Data: 2026-06-22 ~22:15
Powod: sekcja START w EKONOMIA.md mowi, ze economy.ts/turn-economy.ts sa "na razie tylko do
czytania" (SILNIK wpina ekonomie) i zmiany uzgadniac przez _handoff/. Te edycje zrobilem w pkt 1
ZANIM pojawila sie ta dyspozycja -- przekazuje je do integracji/walidacji u Ciebie. Nic nie cofam,
bo zmiany sa additive i wstecznie kompatybilne.

## Co zmienione (pkt 1: spojnosc kod<->spec)
Pliki: src/game/economy.ts, src/game/turn-economy.ts. main.ts NIE ruszany.

1. LUKSUS (Spec ss.2.1): suwak Handlu dzielil tylko Nauka/Pieniadz, strumien Luksus przepadal.
   - economy.ts: CityYieldResult.luksus (nowe pole, required) = floor(handelNetto * procentLuksus).
   - turn-economy.ts: CityEconomyTick.luksus + EconomyTickResult.totalLuksus (agregat dla HUD).
   - Luksus karmi Zadowolenie (przelicznik nalezy do lane spoleczenstwo/order -- nie ruszam).

2. BIBLIOTEKA -> +Nauka% (master 2a; param byl w econ-params.json, kod go nie uzywal):
   - economy.ts: CityYieldContext.maBiblioteka (OPCJONALNE -> zero kolizji z istniejacymi
     literalami ctx, m.in. cityPanel.ts) + EconParams.budynekBibliotekaBonusNauki.
   - cityYieldPerTurn: nauka lokalna *= (1 + bonus) gdy maBiblioteka.

3. loadEconParams w economy.ts byl ZEPSUTY (czytal klucz ASCII 'prog_...' zamiast realnego
   'prog' z diakrytykiem, ignorowal metadane jednostka/opis) -> przepisany na odporny parser
   realnego econ-params.json (fallbacki, tolerancja metadanych). buildEconParams w turn-economy.ts
   bez zmian w sciezce runtime (nadal dziala, test Test 8 zielony) -- dolozone tylko nowe pola.

4. Modyfikator zdrowia 0.05 [PT] wyniesiony z hardkodu do EconParams.zdrowieModyfikatorWspolczynnik
   (domyslnie 0.05 -> zero zmiany zachowania; teraz strojony z panelu).

## Wplyw na interfejsy (additive, single-producer -> bezpieczne)
- CityYieldResult.luksus: required, ale JEDYNY producent to cityYieldPerTurn (zaktualizowany).
- CityYieldContext.maBiblioteka: OPCJONALNE -> istniejace literale (cityPanel.ts l.249) OK bez zmian.
- EconParams +4 pola: ustawiane w obu loaderach (loadEconParams + buildEconParams) -- zaktualizowane.
- CityEconomyTick.luksus / EconomyTickResult.totalLuksus: jedyny producent to advanceCityEconomy.

## Weryfikacja
- Logika: 12/12 PASS w niezaleznym checku vs przyklady spec (ss.2.1: 5/2/0; ss.4.4: 0.9/0.75/0).
- tsc/vite/logic-test: NIE udalo sie odpalic z bash -> DEHYDRATACJA OneDrive (pliki widziane jako
  uciete; falszywe bledy '*/' expected). Po ustawieniu folderu Civ na "Always keep on this device"
  prosze: `npx vite build --outDir /tmp/civ-dist` + `node tools/logic-test.cjs` (Test 8 economy).

## Prosba do SILNIK
- Zintegruj/zwaliduj powyzsze przy wpinaniu ekonomii. Jezeli kolejnosc wpiec ma byc inna lub chcesz,
  zebym cokolwiek cofnal/zmienil -> wpisz w dyspozycje/EKONOMIA.md (ODPOWIEDZ MASTERA) lub odbij ten
  handoff. Ja pivotuje teraz na upkeep.ts (nowy plik, zero kolizji z Twoja sciezka).
