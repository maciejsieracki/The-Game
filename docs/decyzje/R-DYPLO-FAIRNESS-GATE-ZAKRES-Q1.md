# R-DYPLO-FAIRNESS-GATE-ZAKRES-Q1 — rozszerzenie naprawy handlu na wszystkie akcje z `PROPOSER_PW_FAIRNESS_ACTIONS`

**Status:** 🟢 **ZAPISANA — A** (2026-08-07)

## Sytuacja

Batch AutoBot (`wgjvwhy88`, temat `dip-proposal-fairness-msg`) zbadał, czy wada naprawiona dla
`'handel'` (`R-DYPLOMACJA-HANDEL-BRAMKA-PRIORYTET-Q1`, commit `9fc3821`) dotyczy innych akcji.
**Tak — dotyczy wszystkich 8 akcji z `basePn>0`** w `PROPOSER_PW_FAIRNESS_ACTIONS`
(`gra/src/game/diplomacy-proposals.ts`): `nap` (200 PN), `sojusz_defensywny` (420), `sojusz_pełny`
(500), `granice` (60), `pokój` (500), `wasal` (350), `umowa_szlaków` (80), `umowa_handlowa` (80).

`proposerUnfairToPartnerGate()` odpala się bezwarunkowo PRZED case-ową logiką i przy niskiej
Relacji ZAWSZE generuje ten sam komunikat „Przewaga u Ciebie — oferta nieuczciwa dla partnera
(N PN)" — nawet bez żadnego koszyka — maskując dedykowane, przyczynowo trafne komunikaty (np.
„Relacja zbyt niska na traktat przemarszu (wymagana ≥ X)" dla `granice`). Zweryfikowane
bezpośrednio (Operator+Evaluator, wartości PN odtworzone co do jednostki) dla 6 z 8 akcji,
poprawnie przewidziane dla pozostałych 2 (`sojusz_pełny`, `umowa_handlowa`).

**To bug komunikatu (UX), nie logiki akceptacji** — testy sąsiednie dowodzą, że samo odrzucenie
przy niskiej Relacji jest zamierzone (np. `umowa_handlowa` @ niska Rel bez koszyka: test
oczekuje odrzucenia). Systemowy problem od `b47a2e8` (FALA 216-220, 2026-08-04), nie regresja
z dziś.

**Wariant odrzucony w toku analizy (opcja C z ABC):** wąska łatka `if (!hasBasket) return null;`
na początku bramki — dowiedzione empirycznie przez Evaluatora, że otwiera exploit „darmowy pokój
podczas wojny" (`treatyPnGate` dla `pokój` ma samospełniający się warunek przy pustym koszyku;
jedyną rzeczą wymuszającą zapłatę bazowych 500 PN jest dziś właśnie `proposerUnfairToPartnerGate`).

## ECHO

**Odpowiedź Macieja:** „a"

| ID | Odpowiedź | Skutek wdrożenia |
|----|-----------|------------------|
| **R-DYPLO-FAIRNESS-GATE-ZAKRES-Q1** | **A** | Rozszerzyć wzorzec naprawy handlu (usunięcie akcji z generycznej bramki + dedykowana bramka per-akcja z prawdziwym komunikatem) na wszystkich 8 akcji, jedną skoordynowaną sesją AutoBot. |

## Wymogi wdrożenia (wiążące dla Operatora)

1. **8 akcji, nie 2.** `nap`, `sojusz_defensywny`, `sojusz_pełny`, `granice`, `pokój`, `wasal`,
   `umowa_szlaków`, `umowa_handlowa` — każda dostaje dedykowaną bramkę z realnym, przyczynowym
   komunikatem (wzorzec z naprawy `'handel'`), zamiast generycznego „Przewaga u Ciebie".
2. **`pokój` wymaga szczególnej ostrożności.** NIE wolno tylko usunąć go z
   `PROPOSER_PW_FAIRNESS_ACTIONS` bez zastąpienia — `treatyPnGate` dla pokoju ma samospełniający
   się warunek przy pustym koszyku, więc bez osobnej bramki wymuszającej bazowe 500 PN otwiera się
   exploit „darmowy pokój w trakcie wojny". Nowa bramka dla `pokój` musi wymuszać zapłatę bazy
   niezależnie od koszyka, tak jak dziś robi to (przypadkiem) `proposerUnfairToPartnerGate`.
3. **Wymóg brzegowy dla `umowa_szlaków`/`umowa_handlowa`:** dwa istniejące testy oczekują
   sprzecznych fragmentów tekstu dla identycznego scenariusza („Brakuje" vs „nieuczciwa") — nowy
   komunikat musi spełniać oba jednocześnie (np. „Brakuje 40 PN do uczciwej oferty @ Relacji —
   oferta nieuczciwa dla partnera"), albo oba testy trzeba świadomie ujednolicić w tym samym
   zleceniu (nie zostawiać rozjazdu).
4. **Testy pokrywające WSZYSTKIE 8 akcji**, nie tylko te 2, które dziś mają czerwone asercje —
   pozostałe 6 nie mają dziś żadnego testu na treść komunikatu (tylko na `accepted`/`!accepted`),
   więc regresja w nich przeszłaby niezauważona bez nowych asercji.
5. Wzorować się na 4-rundowej naprawie handlu (`R-DYPLOMACJA-HANDEL-BRAMKA-PRIORYTET-Q1`,
   `9fc3821`) — ten sam plik, ten sam mechanizm, znane pułapki (fałszywe przypisanie kierunku,
   luka „skimowania" bez podłogi parytetu).

## Wdrożenie

AutoBot Operator→Evaluator, osobna sesja skoordynowana dla wszystkich 8 akcji naraz (nie
fragmentami po jednej), zgodnie z `R-PROC-ABC-BALANS` (zmiana mechaniki akceptacji ofert =
balans, ale sama forma naprawy jest już zatwierdzona literą A — kod może wejść po zielonych
bramkach Evaluatora, bez kolejnego pytania ABC, chyba że Evaluator znajdzie kolejny realny
exploit analogiczny do „darmowego pokoju").
