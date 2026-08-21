# 00-dispatch — R-UI-POPUP-ODKRYCIE-OVERFLOW-Q1

TEMAT: R-UI-POPUP-ODKRYCIE-OVERFLOW-Q1
GOAL: komunikat o nowym odkryciu (popup karty odkrycia technologii) nigdy nie wychodzi
poza obrys ekranu — twardy margines od góry i od dołu viewportu; jeśli treść karty jest
dłuższa niż dostępna wysokość, wewnątrz karty pojawia się scrollowalny obszar ze złotym
(nie systemowym szarym) paskiem przewijania.

## Zgłoszenie właściciela (2026-08-21, zrzut ekranu)

Karta odkrycia „Obróbka drewna" (i analogiczne dla innych technologii) renderuje się bez
ograniczenia wysokości do viewportu — przy dłuższej treści (dużo sekcji: Budynki, Jednostki,
Ulepszenia terenu, Kolejne technologie, Zmiany ekonomiczne) karta wychodzi poza dolną (i
potencjalnie górną) krawędź ekranu, część treści jest nieosiągalna/przycięta.

## Prawdopodobny zakres (do potwierdzenia w recon)

`gra/src/ui/techDiscoveryNotice.ts` — ten sam moduł co `P-TECHNOLOGIA-POPUP-KARTA-ODKRYCIA-Q1`
i `R-TECH-ULEPSZENIA-TERENU-SYNC-Q1` (już wcześniej naprawiane w tej sesji, INNY problem —
tam chodziło o treść/ikony, nie o overflow). Sprawdzić:
- Czy kontener karty ma `max-height` powiązany z viewportem (np. `calc(100vh - 2 * margines)`)
  i `overflow-y: auto`/`scroll` na wewnętrznym scrollowalnym obszarze (nie na całym oknie).
- Czy istnieje już gdzieś w UI wzorzec „złotego" paska przewijania (custom `::-webkit-scrollbar`
  lub podobny) do ponownego użycia dla spójności stylu — sprawdzić np. `sidePanelHud.ts`,
  `wikiHubHud.ts`, `cityPanel.ts` pod kątem istniejących custom scrollbarów.
- Twardy margines górny/dolny — konkretna wartość px do ustalenia względem istniejących
  wzorców w tym samym pliku/module (nie wprowadzać nowej, niespójnej wartości bez uzasadnienia).

## Ograniczenia

Nie zmieniać treści/danych karty (to już naprawione w poprzednich tematach tej sesji) — tylko
layout/overflow/scroll. Nie dotykać innych popupów bez potwierdzenia że mają ten sam problem.

## Branch

`autobot/R-UI-POPUP-ODKRYCIE-OVERFLOW-Q1` (utworzony z `main`/FALA 303, `acd40380`).
