# R-DYPLO-CLAMP-PLATNOSC-PROPORCJONALNA-Q1 — dispatch

TEMAT: `R-DYPLO-CLAMP-PLATNOSC-PROPORCJONALNA-Q1`
RUNDA: 1/5
DOMAIN: GAME (naprawa błędu ekonomii dyplomacji — kierunek naprawy jednoznaczny z reconu,
nie wymaga dodatkowego ABC)
ŚCIEŻKA: A (Workflow)
MODEL+EFFORT: Operator — Sonnet 5, effort medium; Evaluator — Sonnet 5, effort high;
Final Control — Sonnet 5, effort high (`R-PROC-AUTOBOT.md` §5a; nie wizualny).

## GENEZA

Bug znaleziony podczas rozstrzygania zjawiska „Oferują: —" ze zrzutu właściciela przy
temacie `P-DYPLO-KARTA-DECYZJI-BILANS-SKROT-Q1` (nie osobne zgłoszenie, ale realny defekt
potwierdzony żywo). Operator i niezależnie Evaluator tamtego tematu wywołali realną,
wyeksportowaną `clampBasketItemsToAffordable` (`gra/src/game/diplomacy-ai-balance.ts:536`,
wołaną przez `main.ts:8830` wewnątrz `clampNegotiationPayloadToRealResources`) i potwierdzili:
gdy skarbiec proponenta < wymagana rezerwa na PEŁNY czas trwania umowy (per_turn × turns),
funkcja usuwa CAŁĄ pozycję płatności (`[]`), zamiast redukować ją proporcjonalnie do tego, na
co skarbiec faktycznie starcza.

**Skutek:** miasto-państwo/AI może żądać pełnej ilości surowca, płacąc realnie 0 — dokładnie
to, co właściciel zobaczył jako „Oferują: —".

## GOAL

1. Znajdź `clampBasketItemsToAffordable` (`gra/src/game/diplomacy-ai-balance.ts:536`) i
   `clampNegotiationPayloadToRealResources` (wołająca ją z `main.ts:8830`) — przeczytaj
   dokładną logikę usuwania pozycji, nie zgaduj.
2. Zmień logikę na redukcję PROPORCJONALNĄ: gdy skarbiec nie starcza na pełną kwotę
   (per_turn × turns), przelicz ilość na maksymalną, na jaką skarbiec faktycznie starcza
   (floor lub round zgodnie z konwencją reszty kodu ekonomii dyplomacji — sprawdź istniejący
   wzorzec zaokrąglania w tym samym pliku), zamiast usuwać pozycję w całości. Zero ilości
   (skarbiec = 0) nadal usuwa pozycję — to jest poprawne zachowanie brzegowe, nie regresja.
3. Zastosuj identycznie dla OBU stron transakcji (proponent i odbiorca) i dla OBU kierunków
   (gracz↔AI, AI↔AI jeśli dotyczy) — sprawdź wszystkie miejsca wywołania tej funkcji.
4. Sprawdź, czy zmiana wymaga dopasowania UI (np. czy „Oferują: —" powinno teraz pokazać
   realną, zredukowaną ilość zamiast pustki) — jeśli tak, to jest w zakresie tego tematu
   (spójność komunikatu z realną, przeliczoną ofertą); jeśli wymaga zmiany plików UI poza
   allowlistą — zgłoś to explicite w raporcie, nie milcz.

## BINARNE KRYTERIUM SUKCESU

- `clampBasketItemsToAffordable` redukuje PROPORCJONALNIE zamiast usuwać całą pozycję, gdy
  skarbiec > 0 ale < pełna wymagana kwota — potwierdzone REALNYM wywołaniem funkcji w nowej
  bramce (nie ręcznie przeliczonym wzorem), z co najmniej jednym scenariuszem liczbowym
  pokazującym konkretną redukcję (np. skarbiec starcza na 60% kwoty → oferta 60% ilości, nie
  zero).
  Zero ilości (skarbiec = 0) nadal poprawnie usuwa pozycję.
- Zero regresji na `diplomacy-ai-balance-*`/`diplomacy-negotiation-*`/pokrewnych testach —
  jeśli któryś zakładał stare zachowanie "usuń całość", zaktualizuj z jawnym uzasadnieniem
  (nowe zachowanie jest poprawką błędu, nie zmianą arbitralną).
- `tsc --noEmit`, 5 bramek referencyjnych (logic-test, tech-tree-test, research-test,
  unit-replace-test, combat-test) zielone.

## ALLOWLISTA

- `gra/src/game/diplomacy-ai-balance.ts`
- `gra/src/main.ts` (tylko wywołanie `clampNegotiationPayloadToRealResources`, jeśli
  wymaga dostosowania do nowego kształtu wyniku — nie zmieniaj logiki niezwiązanej)
- Testy bezpośrednio dotknięte: `diplomacy-ai-balance-*-test.cjs`,
  `diplomacy-negotiation-*-test.cjs` i pokrewne w `gra/tools/`
- `dyspozycje/autobot/runs/R-DYPLO-CLAMP-PLATNOSC-PROPORCJONALNA-Q1/**`

Zakazane bezwzględnie: `gra/data/**`, pliki z sekretami, `docs/decyzje/**`, `.git/**`,
`dyspozycje/WERSJE.md`, `gra-robocza/**`, `ROBOCZA-MANIFEST.json`, `playbook.json`. Zakaz
`git add -A` i `git add .`. Zmiana plików UI (np. `diplomacyAudience.ts`) poza tą allowlistą
wymaga STOP + DECISION_REQUIRED, nie samodzielnego rozszerzenia zakresu.

## IZOLACJA

Worktree `/home/user/wt-dyplo-clamp-platnosc`, gałąź
`autobot/R-DYPLO-CLAMP-PLATNOSC-PROPORCJONALNA-Q1`, baza jawnie `origin/main` (commit
`a153d4fc` w chwili założenia, może być nowszy przy starcie pracy — potwierdź `git log -1`
PRZED pracą, SS2b).

C-001: zakaz `npm run build`/`dev` w `gra/`; jedyna dozwolona kompilacja `tsc --noEmit`;
bramki `node tools/*-test.cjs` nie są objęte zakazem.

## PROCEDURA NAPRAWCZA PRZY FAIL

Evaluator wskazuje konkretny defekt i poprawkę; runda N+1 na TYM SAMYM ID i TEJ SAMEJ gałęzi.
Po 5 rundach: `LIMIT-5-EXCEEDED`.

## GRANICE

- Zero zmian formuły wyceny samej w sobie (ile kosztuje co) — tylko sposób redukcji przy
  niewystarczających środkach.
- Nie integrujesz, nie deployujesz, nie pushujesz.
- Zmiana wykraczająca poza allowlistę (np. UI karty decyzji) → zawsze DECISION_REQUIRED.

## OBIEG

Operator → Evaluator (ponumerowane zarzuty) → Obrona (gdy lista niepusta) → koniec skryptu.
Final Control osobno (Workflow, Sonnet 5 effort high), integracja allowlist-only ręką
orkiestratora.
