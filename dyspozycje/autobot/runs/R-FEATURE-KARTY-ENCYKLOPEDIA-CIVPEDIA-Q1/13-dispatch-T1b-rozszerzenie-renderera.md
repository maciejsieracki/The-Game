# 13-dispatch-T1b-rozszerzenie-renderera — R-FEATURE-KARTY-ENCYKLOPEDIA-CIVPEDIA-Q1

TEMAT: R-FEATURE-KARTY-ENCYKLOPEDIA-CIVPEDIA-Q1, podtemat T1b „ROZSZERZENIE KONTRAKTU RENDERERA"
(nowy krok, wstawiony między T1 a T3 po tym, że T3 zablokował się na realnych brakach —
pełny opis: `12-operator-T3.md`).

**To NIE jest pytanie ABC.** Wszystkie 6 zachowań niżej to już dziś istniejące, świadome
decyzje produktowe (accordion, ikony per wiersz, paginacja, kolorowane odznaki, pigułki
wymagań) — pinowane przez istniejący, niezmieniany test `technology-discovery-card-visual-
test.cjs` (48 asercji). Zadanie jest czysto techniczne: dopisać do WSPÓLNEGO kontraktu
(`entityCards/types.ts` + `renderer.ts`) obsługę tego, co dzisiejsza karta już robi — nie
zmieniamy żadnego zachowania widocznego dla gracza, tylko rozszerzamy fundament.

GOAL: `renderer.ts` faktycznie obsługuje wszystkie pola już zarezerwowane/potrzebne w
`types.ts`, żeby T3 (migracja karty technologii) mogło zacząć bez utraty funkcjonalności.

## Zakres — 6 luk z `12-operator-T3.md` (pełne uzasadnienie i plik:linia tam)

1. **Akordeon działający.** `EntityCardSection.collapsible`/`openDefault` (już w `types.ts`)
   muszą być realnie obsłużone w `renderer.ts` — przycisk nagłówka sekcji, chevron,
   `aria-expanded`, zwijanie/rozwijanie, wzorem `accordionSection()` w
   `techDiscoveryNotice.ts:158-177`/`wireInteractions():449-462`. Dodaj też
   `EntityCardSection.highlighted?: boolean` (brakujące pole, wzorem `tdn-sec--hi`).
2. **Ikona per wiersz.** Dodaj `EntityCardRow.icon?: {kind:'svg'; svg:string}` (lub podobny
   kształt) do `types.ts`; `renderer.ts` renderuje ją jako kafelek obok label/value, wzorem
   `unlockItemRow()` w `techDiscoveryNotice.ts:179-187`. Renderer MUSI wstawiać SVG jako
   markup (nie `.textContent`) — sprawdź istniejące bezpieczne wzorce wstawiania SVG w tym
   samym repo (np. jak to robi `unitInfoCard.ts`/`cityPanel.ts` dziś) zamiast wymyślać nowy.
3. **Pole „trailing".** Dodaj `EntityCardRow.trailing?: string` (tekst po prawej, osobny od
   `value`), wzorem `unlockItemRow()` opts.trailing.
4. **Kolorowane odznaki per wiersz.** Dziś `EntityCardRow` nie ma miejsca na pojedynczy,
   kolorowany badge (ok/warn/muted) + dowolny tekst na wiersz — dodaj
   `EntityCardRow.badge?: {kind:'ok'|'warn'|'muted'; label:string}` (kształt do dopasowania
   do rzeczywistego `actionItemRow(kind, label, text)`, `techDiscoveryNotice.ts:189-191`).
5. **Paginacja „Pokaż pozostałe N".** Dodaj do `EntityCardSection` pole typu
   `previewLimit?: number` (ile wierszy pokazać domyślnie) + renderer generuje przycisk
   „Pokaż pozostałe N" analogicznie do `techDiscoveryNotice.ts:373-386`. Sprzężenie z
   wariantem kompaktowym nagłówka KARTY (nie tylko sekcji, `tdn-card--compact`) — sprawdź
   czy to wymaga nowego pola na poziomie `EntityCardData` (np. `compactHeaderOnExpand?:
   boolean`) czy da się to rozwiązać lokalnie w obrębie sekcji; jeśli okaże się że to
   wymaga więcej niż jednego nowego pola/mechanizmu, opisz to jawnie w raporcie zamiast
   robić to po cichu w sposób niespójny z resztą kontraktu.
6. **Layout pigułek-z-checkmarkiem.** Nowy typ sekcji lub tryb renderowania wiersza
   (`EntityCardSection.layout?: 'grid' | 'pills'`, domyślnie `'grid'` jak dziś) — w trybie
   `'pills'` renderer rysuje zawijaną listę pigułek z trailing `✓`, wzorem
   `techDiscoveryNotice.ts:435-438`.

## Ograniczenia

- **Nie zmieniaj `techDiscoveryNotice.ts` ani żadnego z 4 adapterów w tym kroku** — to
  WYŁĄCZNIE rozszerzenie `entityCards/types.ts` + `entityCards/renderer.ts`. T3 (migracja
  faktycznej karty) zostaje osobnym, kolejnym dispatchem PO tym kroku.
- Rozszerzaj kontrakt w sposób WSTECZNIE KOMPATYBILNY — wszystkie nowe pola muszą być
  opcjonalne (`?`), żeby istniejący test `entity-card-contract-test.cjs` (z T1, 47 asercji)
  nadal przechodził bez zmian.
- Dodaj NOWE asercje do `entity-card-contract-test.cjs` (lub nowy plik testu) pokrywające
  każdą z 6 nowych funkcjonalności renderera na przykładowych danych fixture — nie tylko
  „typy się kompilują".
- Kryterium ukończenia: `tsc --noEmit` czysty; `entity-card-contract-test.cjs` (rozszerzony)
  zielony; ZERO zmian w `techDiscoveryNotice.ts`/adapterach/`scienceHubHud.ts`/
  `techTreeView.ts`/`cityPanel.ts` — nic jeszcze nie woła tych nowych możliwości renderera,
  dokładnie jak T1.

## Branch

`autobot/R-FEATURE-KARTY-ENCYKLOPEDIA-CIVPEDIA-Q1` (kontynuacja po T1 zintegrowanym do
`main` i BLOCK T3 na tym samym branchu).
