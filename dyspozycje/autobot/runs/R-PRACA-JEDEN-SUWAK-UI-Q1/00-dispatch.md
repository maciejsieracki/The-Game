# AutoBot dispatch — R-PRACA-JEDEN-SUWAK-UI-Q1

TEMAT: R-PRACA-JEDEN-SUWAK-UI-Q1
GOAL: Usunąć dolny, niezależny suwak lokalnego podziału „Budynki / Pula Pracy”, pozostawić dokładnie jeden nadrzędny suwak i opisać go kontraktem „Budynki (0–100%)” oraz „Pula Pracy (0–50%)”. Jeden stan i jeden event handler mają sterować relacją bez możliwości sprzecznych wartości.

BAZA/IZOLACJA: C:\Users\macie\OneDrive - NASTER S.A\_NOWA_STRUKTURA\06_Prywatne\Gry\Civ-clean-main-2026-08-20; oczekiwany HEAD 47cdca15; README.md obecny; Fala 300 obecna w dyspozycje/WERSJE.md. Jeśli izolacja nie spełnia tych warunków: STATUS BLOCK, bez edycji.

ALLOWLISTA:
- gra/src/ui/empireDetailPanel.ts
- ewentualnie jeden celowany test regresyjny w gra/tools/ wyłącznie jeśli konieczny i jawnie opisany
- dyspozycje/autobot/runs/R-PRACA-JEDEN-SUWAK-UI-Q1/*

ZAKAZY: bez git pull, push, deploy, aktualizacji WERSJE.md/numeracji Fali; bez npm run build/dev; bez zmian poza allowlistą; Operator nie ocenia własnej pracy i nie integruje.

PLAN/AKCEPTACJA:
1. Recon renderowania obu suwaków i event wiring; potwierdzić rolę renderPracaSplitSection() oraz nadrzędnego splitu.
2. Usunąć tylko render dolnego bloku, zachować wspólną logikę nadrzędnego splitu.
3. Jeden suwak ma jasno pokazywać Budynki 0–100% ↔ Pula Pracy 0–50%, z jedną wartością stanu i handlerem; brak ukrytego/alternatywnego UI w tym widoku.
4. Uruchomić proporcjonalne testy/checki bez npm run build/dev; przy UI wykonać możliwy render/static HTML check i odnotować ograniczenia.

RAPORT: zapisać 01-operator.md z dokładnym diffem, plikami, testami, blokadami i statusem kontraktu.
DEPLOY/PUSH: NIE WYKONANO
