# Analiza: epoki Klasyczna i Średniowieczna

Temat: R-DESIGN-EPOKI-KLASYCZNA-SREDNIOWIECZE-ANALIZA-Q1 (runda 1/5). Baza: origin/main `c80537eb0`. Zero zmian w `gra/**`.

## Pliki

- `EPOKI-KLASYCZNA-SREDNIOWIECZE-PROPOZYCJA.xlsx` — 14 arkuszy: audyt zależności (61 pozycji z plik:linia), technologie, budynki, jednostki (E4 i E5), ulepszenia, skalowanie (formuły Excela), surowce i cuda, cywilizacje, pytania do właściciela, plan prac.
- `PLAN-WDROZENIA-NOWEJ-EPOKI.md` — dokument bazowy dla każdej kolejnej epoki: checklista warstwowa, graf zależności, tematy z rozmiarem, bramki, ryzyka, szablon dispatchu, pytania ABC, załącznik miejsc zależnych od epoki.

## Najważniejsze ustalenia (fakty z kodu)

1. Koszty budowy, utrzymania i surowców mają płaski sufit ×4 od epoki 3 (`building-stock-cost.ts:72–81`). Bez zmiany E4/E5 nie rosną.
2. Błąd utajony: produkcja ulepszeń terenu spada do ×1 od epoki 4 (`terrain-improvements.ts:277–288`).
3. Nieznana nazwa epoki w jednostce traktowana jest jak Kamień (`production.ts:207–215`); w techu — brak bramki epoki (`research.ts:261–285`).
4. UI ma 3 epoki na sztywno; epoka 4 pokaże etykietę „Żelazo” (`sciencePicker.ts:518–525`).
5. Dwa budynki Żelaza mają `epokaWejscia=4` — konflikt numeracji z nową E4 (`buildings.json`).
6. Dane manpower już mają wiersze epok 4–5 (`epoka-ludnosc-manpower.json`).

## Propozycje (PROPOZYCJA, do decyzji)

- Mnożnik kosztu: wariant A ×8 / ×16 (podwajanie) lub B ×6 / ×9.
- Technologie: 12 na epokę, koszt 1100 × 1,15^(poziom−10) (E4), 2200 × 1,15^(poziom−13) (E5).
- Budynki i jednostki: 10 i 12 na epokę; po jednej super-jednostce.

## Status

Nieczytane w tej rundzie (NIE_ZMIERZONO): balans gospodarki i AI, czas tury, kontry w `counters.json`, pełne przeglądy `main.ts` i części UI. Pytania do właściciela: arkusz PYTANIA_DO_WLASCICIELA (14 pozycji). Nic nie jest wdrożone.
