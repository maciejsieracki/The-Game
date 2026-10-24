# Dyspozycja orkiestratora — R-WEB-RECRUIT-LIST-REGRESSION-Q1

- Final Control r3: FAIL z jedynym zarzutem NAPRAW = brak pliku raportu r3 w `runs/` (dokumentacja). Kod bez zastrzeżeń (wszystkie bramki zielone, mutacje czerwienią testy, zrzut panelu przy drewnie 0 potwierdza wyszarzenie z chipem „13 Drewno (brak)”).
- Zarzut domknięty administracyjnie: raport r3 zapisany jako `01-operator-r3.md` (treść Operatora bez zmian). Precedens: drobne poprawki dokumentacyjne orkiestratora.
- Allowlista poszerzona ex post: `gra/src/main.ts` (UI Zastąp), `gra/src/ui/unitReplacePicker.ts`, `gra/src/game/production.ts` (przyczyna), `gra/tools/.stubs/recruit-list-visibility-ui-brandAssets-stub.ts` (helper testu).
- Pre-existing czerwone na `origin/main`: `recruitment-no-upkeep-gate-test` 22/14, `deposit-building-gate-test` 46/1 (nie z tej zmiany).
- Kod do integracji: `7e1904de`, `3219ec2a`, `c95bef36` (+ docs `ebac01bb`).
- Zgodnie z danymi: Wojownik wg `gra/data/units.json` = 5 złota + 13 drewna (nie 10+50).
