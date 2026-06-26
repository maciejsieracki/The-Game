# PACZKA: MIASTO -> MASTER : decyzje projektowe v0.1 (Q1–Q4)
Data: 2026-06-24. Maciej rozstrzygnął 4 kwestie projektowe (pytania zadane w oknie MIASTO). Poniżej: co zmienia się
w MOIM kodzie (zaimplementuję z backupem + logic-test 163/163, potem zgłoszę „moduł gotowy") i co jest CROSS-LANE
(master rozdziela do EKONOMIA / MAPA / UI / playerState). UWAGA: dotyka JUŻ WPIĘTEJ produkcji/miasta → potrzebna
re-integracja przez mastera.

## Q1 — koszt jednostek: Kamień=Praca, Brąz+=Pieniądz
DECYZJA: epoka Kamień (epoka 1) → jednostki w kolejce za PRACĘ; epoki Brąz+ (≥2) → tylko za PIENIĄDZ (zakup
natychmiastowy ze skarbca). Oba: −1 ludność (min 1).
MOJA CZĘŚĆ (production.ts): rozróżnienie trybu wg epoki (unitCostMode(u) = 'praca'|'pieniadz'); availableProduction
zwraca jednostki Kamienia do kolejki, a Brąz+ do osobnej listy „do kupienia"; helper unitPurchaseCost (Pieniądz).
CROSS-LANE: zakup natychmiastowy (zdejmij Pieniądz ze skarbca, spawn jednostki, −1 ludność) = pętla tury (master);
UI = dwie sekcje w panelu (Buduj za Pracę / Kup za Pieniądz).
DoD: logic-test zielone; jednostki Kamienia idą kolejką, Brąz+ kupowane za Pieniądz; −1 ludność oba.

## Q2 — utrzymanie budynku: COMPOUND
DECYZJA: utrzymanie budynku rośnie compound ×1,10^(poziom−1) (jak efekt i koszt). Jedna reguła dla wszystkich
skalarów budynku. `przyrostUtrzymania` → legacy.
MOJA CZĘŚĆ: brak zmian kodu (utrzymania nie liczę). Helper gotowy: production.buildingEffectAtLevel.
CROSS-LANE (EKONOMIA): player-economy.ts ma liczyć utrzymanie compound (utrzymanie × 1,10^(poziom−1)) zamiast
liniowego przyrostUtrzymania. To samo dotyczy efektu ekonomicznego (economy.ts buildingValue) i obrony murów
(siege.ts) — patrz wcześniejszy handoff do EKONOMIA.
DoD: utrzymanie/efekt budynku skaluje się compound; testy EKONOMII zielone.

## Q3 — zakładanie miasta z MAPY GLOBALNEJ (ZMIANA, ustalone z Master) + zasięg okolicy 5
DECYZJA (ZASTĘPUJE wcześniejszy pomysł „z lokalnej mapki miasta"): nowe miasta buduje się z poziomu GLOBALNEJ mapy
świata (lane MAPA/SILNIK), NIE z poziomu miasta. Lokalizacja dozwolona TYLKO gdy ŁĄCZNIE: (a) w ZASIĘGU TERYTORIUM
obecnych miast (granica) LUB po wybudowaniu STRAŻNICY rozszerzającej zasięg; (b) nie bliżej niż 5 pól od obecnego
miasta; (c) teren OK (nie morze/góry).
ZASIĘG okolicy roboczej (pola na plony) = 5 pól z KAŻDEJ strony (≈11×11; Schemat §7.3) — OSOBNE od zasięgu zakładania.
MOJA CZĘŚĆ (mała): cities.canFoundCity zostaje walidacją (teren + dystans ≥5); MOGĘ dodać OPCJONALNY warunek
„w terytorium" (predykat/zbiór kontrolowanych pól dostarcza MAPA/SILNIK) — addytywnie. Param `zasieg_okolicy_miasta`=5.
DO USTALENIA (Maciej/Master): Strażnica = budynek w Budynki.xlsx (mój panel, atrybut „rozszerza zasięg") CZY struktura MAPY?
CROSS-LANE: flow zakładania na mapie świata + terytorium/granice + Strażnica = MAPA/SILNIK; workedTilesForCity promień 5
(EKONOMIA/turn-economy); UI = przycisk/wskazanie na mapie świata.
DoD: miasto można założyć TYLKO w terytorium (lub po Strażnicy) i ≥5 od miasta; okolica robocza = promień 5; logic-test zielone.

## Q4 — suwak %Pracy (budynki vs pula) + Praca jako globalny surowiec w skarbcu
DECYZJA: w mieście SUWAK dzieli Pracę: część → kolejka budynków, reszta → GLOBALNA PULA „odłożonej Pracy" w skarbcu.
Skarbiec (na mapie świata) trzyma odłożona Praca + odłożony Pieniądz. Praca = surowiec wydawany na zmiany terenu i inne.
MOJA CZĘŚĆ (miasto-params + production split): param `praca_udzial_budynki` (domyślnie np. 0,7); split liczony w
pętli tury: pracaDoBudynkow = cityPraca×udzial → advanceProduction; pracaDoPuli = cityPraca×(1−udzial).
CROSS-LANE: pula Pracy w playerState/skarbcu (nowe pole, np. skarbiecPraca) + wydawanie = master/SILNIK; zmiany
terenu za Pracę = MAPA; suwak + wyświetlanie skarbca (Praca+Pieniądz) na mapie = UI.
DoD: suwak dzieli Pracę; pula Pracy rośnie w skarbcu; widoczna na mapie obok Pieniądza; da się wydać na teren.

## PODSUMOWANIE — co robię JA, co CROSS-LANE
JA (production.ts, cities.ts, miasto-params.json; backup + logic-test 163/163, potem „moduł gotowy"):
- Q1 tryb jednostek wg epoki + lista „do kupienia”.
- Q3 canFoundCity zostaje (teren + dystans ≥5), OPCJONALNY check „w terytorium" + param zasięgu okolicy = 5. (Flow zakładania = MAPA/SILNIK, NIE mój.)
- Q4 param udziału Pracy + split do advanceProduction.
CROSS-LANE (master rozdziela): Q2 utrzymanie/efekt compound (EKONOMIA + siege); Q3 render okolicy 11×11 + przycisk/klik
(UI/MAPA) + workedTiles promień 5 (EKONOMIA); Q4 pula Pracy w skarbcu + wydawanie (playerState/master) + teren (MAPA)
+ suwak/wyświetlanie (UI); Q1 zakup natychmiastowy (pętla tury) + dwie sekcje panelu (UI).
RE-INTEGRACJA: po moim kodzie zgłoszę „moduły gotowe” osobnym wpisem — master wpina i rozdziela cross-lane.
