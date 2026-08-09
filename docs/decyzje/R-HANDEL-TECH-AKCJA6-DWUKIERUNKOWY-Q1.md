# R-HANDEL-TECH-AKCJA6-DWUKIERUNKOWY-Q1 — akcja „6” dostaje pełny handel dwukierunkowy

**Data:** 2026-08-09 · **Decyzja:** Maciej, ABC = **A**

## Sytuacja
Akcja dyplomatyczna „6” blokowała się całkowicie, gdy gracz nie miał własnych technologii do
zaoferowania (`sellableTechCount === 0`), nawet jeśli po stronie „dostaję” były poprawne
pozycje. Subagent naprawił samą blokadę (dodał `buyableTechCount` do warunku), ale Evaluator
odrzucił scalenie: komentarz w `main.ts:15122-15125` (z commita `82bdbd92`) dokumentuje, że
akcja „6” jest dziś w kodzie zaimplementowana WYŁĄCZNIE jednokierunkowo — gracz zawsze sprzedaje
(`techOptions = getSellableTechForPlayer`), `getBuyableTechFromOwner` zasila tylko koszyk ogólny
(akcja „14”), nie formularz akcji „6”. Odblokowanie samego przycisku bez zmiany formularza i
walidacji prowadziłoby gracza do ślepego zaułka: przycisk aktywny, ale formularz nadal pokazuje
„Brak technologii do sprzedaży” i walidacja blokuje wysyłkę.

Dane gry (`diplomacy.json`) opisują akcję „6” jako dwutrybową od początku: „Sprzedaż: 50-300
Pieniędzy … Wymiana: technologia o zbliżonej wartości” — implementacja nigdy nie dogoniła tego
opisu.

## Decyzja
**A — dociągnąć implementację do specyfikacji.** Akcja „6” ma wspierać oba tryby:
- **Sprzedaż** (istniejący, działający tryb): gracz oddaje technologię, dostaje gotówkę.
- **Wymiana** (nowy tryb do zbudowania): gracz może też otrzymać technologię od AI, płacąc
  gotówką LUB oddając inną technologię — zgodnie z opisem w `diplomacy.json`.

## Zakres wdrożenia (dla Operatora)
1. Formularz akcji „6” (`gra/src/ui/diplomacyTradeBasket.ts` / `diplomacyNegotiationModal.ts`)
   musi pokazać obie strony: co gracz oddaje (opcjonalnie, może być puste/gotówka) i co dostaje.
2. `getNegotiationContext('6', ...)` w `main.ts` musi przekazywać `receiveTechOptions` do
   formularza akcji „6” (dziś zasila tylko akcję „14”).
3. Walidacja (`validateTreatyForm` czy odpowiednik) nie może wymagać wyboru technologii do
   SPRZEDAŻY, jeśli gracz wybrał tryb kupna za gotówkę.
4. Payload wykonania (transferu) musi obsłużyć oba kierunki symetrycznie, korzystając z już
   istniejącej, przetestowanej ścieżki `grantTechToOwner` (STRICT-PARITY, prerekwizyty/epoka/tier
   już tam są).
5. Blokada `diplomacy-locks.ts:201` — po dociągnięciu formularza, warunek
   `sellableTechCount === 0 && buyableTechCount === 0` (praca już wykonana i odrzucona wcześniej
   z powodu formularza — teraz formularz nadąża, więc ten fragment prawdopodobnie można
   przywrócić z tamtej próby, PO potwierdzeniu że formularz faktycznie obsługuje obie strony).

## Status
Do wdrożenia — dispatch subagenta Operator→Evaluator (AutoBot). Kod z pierwszej, odrzuconej
próby (`98cfe36c`, sama blokada bez formularza) zostaje w worktree jako punkt odniesienia, nie
do bezpośredniego scalenia (rozwiązywał tylko fragment problemu).
