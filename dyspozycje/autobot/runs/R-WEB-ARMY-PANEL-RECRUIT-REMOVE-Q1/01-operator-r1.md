STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB)
TEMAT: R-WEB-ARMY-PANEL-RECRUIT-REMOVE-Q1
GOAL: W panelu armii (Imperium -> Armia) pod każdym miastem ta sama „Kolejka rekrutacji:" co w panelu miasta, z ✕ (zwrot jak w mieście), ↑ ↓ i przeciąganiem; jedna logika, odświeżenie obu paneli.
ZMIANY/COMMIT: SHA w komunikacie zwrotnym orkiestratora (commit zawiera ten raport; SHA nie da się wpisać w plik, który wchodzi do własnego commitu). Pliki: `gra/src/ui/cityPanel.ts` (+49/-16), NOWY `gra/tools/army-panel-recruit-remove-test.cjs`, artefakty w `dyspozycje/autobot/runs/R-WEB-ARMY-PANEL-RECRUIT-REMOVE-Q1/`. Baza `origin/main` 89b3ee5db. Zero zmian w main.ts, empireDetailPanel.ts, gra-robocza, WERSJE.md, rust-port.

## Interpretacja (ustalona doprecyzowaniem właściciela)
„Panel armii" = panel Imperium, zakładka Armia, sekcja „Rekrutacja" (`empireDetailPanel.ts:2756` renderMassRecruitmentSection; karty per miasto montowane przez `mountCityRecruitmentCardsForArmy`, `cityPanel.ts` ~8335, wołane z `main.ts:24705`). Dowód stanu przed: te karty dopisywały do `prod.rekrutacja` (`main.ts:4137` purchaseRecruitmentUnit), a kolejka z ✕/↑/↓ była renderowana wyłącznie w panelu miasta (`appendRecruitmentQueue`, wołane `cityPanel.ts` renderProd ~8705). W panelu armii był tylko licznik „kolejka: N". Pliki `armyListHud/armyStackHud/armyMerge*/armySplit*` nie mają żadnej ścieżki rekrutacji (grep recruit|rekrut: jedno trafienie, komunikat pustej listy) — nie zmieniane. Brak drugiej interpretacji do DECYZJI_WYMAGANEJ.

## Implementacja (`cityPanel.ts`)
- Wspólne funkcje mutacji `cancelRecruitmentQueueItem` (cfg.onCancelRecruitment -> dequeueRecruitment -> setProd -> rerender) i `moveRecruitmentQueueItemBy`; panel miasta i armii używają ich i tego samego `appendRecruitmentQueue` oraz `bindRecruitQueueDragReorder` (zero duplikacji; zwrot kosztu = istniejący `cancelRecruitmentPurchase` w main.ts:4382 przez onCancelRecruitment).
- `mountCityRecruitmentCardsForArmy` dopina pod kartami miasta `.civ-army-recruit-queue` (pusta kolejka = brak sekcji, jak w panelu miasta). Miasta obce: funkcja i tak zwraca false (isMeCity).
- Odświeżenie: setProd -> cfg.onChange -> updateHud -> refreshEmpireDetailPanel (main.ts:24813) + rerender() panelu miasta. Dodatkowo opcjonalny `onMutated` (lokalny re-render kolejki, tylko gdy host nadal w DOM) jako zabezpieczenie.
- Dostępność: `aria-label` na ↑ ↓ ✕ (dotyczy też panelu miasta — drobna zmiana wspólna).
- Zakończona rekrutacja: pozycja znika z `rekrutacja` przy ukończeniu, więc nie ma jej na liście do usunięcia (mechanika silnika bez zmian).

## TESTY
- Nowy `node tools/army-panel-recruit-remove-test.cjs`: PRAWDZIWY Chromium + prawdziwy cityPanel.ts + prawdziwe funkcje kolejki z production.ts. RED na kodzie bazowym (V1 FAIL, timeout na braku przycisku ✕; `gate-test-RED.txt`, EXIT=1), GREEN po zmianie 21/21 (`gate-test-GREEN.txt`, EXIT=0). Pokrywa: widok per miasto (3 miasta, jedno bez kolejki), nagłówek, wiersz (uchwyt/ikona/koszt/„nast. tura"/3 przyciski), aria-label, brak overflow 360 px, ✕ zmienia stan i skarbiec (+koszt) i nie rusza innego miasta, ↑/↓, przeciągnięcie (DragEvent) zmienia stan, fallback bez onChange.
- Ograniczenie: `cancelRecruitmentPurchase` to domknięcie w main.ts (nieimportowalne); test weryfikuje kontrakt callbacku (cityId,itemId,koszt, raz na ✕) i zwrot w silniku testowym, nie samą implementację zwrotu MP/surowców (NIE_ZMIERZONO w e2e na pełnej grze).
- tsc `--noEmit`: EXIT=0 (`gate-tsc.txt`).
- Regresje `*recruit* *army* *unit-replace* *citypanel*` (47 plików): PRZED i PO IDENTYCZNE (`gate-reg-PRZED.txt` = `gate-reg-PO.txt`; 16 pada w obu: m.in. unit-replace 3/15, a bez `PLAYWRIGHT_CHROMIUM_EXECUTABLE=/opt/pw-browsers/chromium` testy Chromium). Z tą zmienną PO: recruit-card-quantity, empire-mass-recruitment, recruit-list-visibility-ui, army-merge-panel-production-mount EXIT=0; era-recruit-panel-refresh, army-merge-panel-scroll-real-render, unit-info-card-army-interaction EXIT=1 także na bazie (baseline zmierzony). Pozostałe z 16 nie sprawdzane z tą zmienną (NIE_ZMIERZONO) — porównanie PRZED/PO bez zmiennej identyczne.
- Dowód wizualny (Chromium 360 px, z prawdziwym CSS hosta z empireDetailPanel.ts): `shot-PRZED-panel-armii-bez-kolejki.png` (baza, brak kolejki), `shot-PO-panel-armii-z-kolejka.png`, `shot-PO-po-operacjach.png` (każdy ≤ 106 KB). Wiersze mieszczą się bez poziomego przewijania.

## BLOKADY: brak. Uwaga: testy regresyjne nadpisały śledzony PNG innego runu (R-ARMY-MERGE-PANEL-INNER-SCROLL-Q1/06-...png) — przywrócony `git checkout`, nie w commicie.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (niezależny re-run testu + ocena zrzutów; weryfikacja w pełnej grze zwrotu MP/surowców przy ✕ w panelu armii).
DEPLOY/PUSH: NIE WYKONANO
