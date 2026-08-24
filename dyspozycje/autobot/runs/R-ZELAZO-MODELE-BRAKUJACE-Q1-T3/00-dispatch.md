# 00 — DISPATCH

STATUS: DISPATCHOWANE
DOMAIN: GAME
TEMAT: `R-ZELAZO-MODELE-BRAKUJACE-Q1-T3`
GOAL: Dać jednostce **Falanga** (epoka Żelazo, kultura Grecka) dedykowany dispatch PO
NAZWIE (nie tylko po kategorii) i uzupełnić dokumentację historyczną istniejącego modelu
do standardu serii Opus 5.

## Wyzwalacz

Kontynuacja `R-ZELAZO-MODELE-BRAKUJACE-Q1` po zamknięciu T1/T2. Pełny kontekst, ECHO
właściciela i podział na tematy: `docs/decyzje/R-ZELAZO-MODELE-BRAKUJACE-Q1.md`.

## Izolacja

Nowa gałąź `autobot/ZELAZO-T3-Q1`, odgałęziona od `origin/main` (zawiera już T1+T2),
osobny worktree per rola.

## Allowlista

- `gra/src/render/units.ts` — dodać rozpoznanie „Falanga" PO NAZWIE w `buildNamedUnit()`
  (obok innych `n.includes(...)` — wzorem reszty rodziny), wywołujące istniejący
  `newBuildFalangita()` (dziś importowany jako `buildFalangita` z `hastati-falangita.ts`,
  wołany WYŁĄCZNIE przez `case 'falanga'` w `buildCategoryModel()`, ok. `units.ts:2781-2783`
  — zostawić ten case jako fallback dla ewentualnych przyszłych jednostek tej kategorii,
  ale „Falanga" ma dostać JAWNY dispatch po nazwie jak reszta rodziny Opus 5).
- `gra/src/render/hastati-falangita.ts` — funkcja `buildFalangita()` (ok. linii 441-536):
  DOZWOLONE zmiany geometrii TYLKO jeśli audyt historyczny znajdzie realny problem;
  priorytet to DODANIE brakującej sekcji „ZGODNOŚĆ HISTORYCZNA" (styl K1-K7) na górze
  funkcji/pliku, nie przepisywanie działającej geometrii bez powodu. NIE ruszać
  `buildHastati()` w tym samym pliku (osobna jednostka, już wpięta, poza zakresem).
- `gra/tools/*` — nowy lub rozszerzony test regresji renderowania (real render).

Poza zakresem: `buildHastati()`, cokolwiek związane z Rzymem/Triari w tym samym pliku.

## Kontekst techniczny (z reconu orkiestratora, do potwierdzenia przez Operatora)

**Model już istnieje i jest solidny — to NIE jest „zbuduj od zera".** `buildFalangita()`
(`hastati-falangita.ts:441-536`) ma już: korpus linothorax (lniany pancerz), naramienniki,
helm koryncki (dzwon + szczelina na twarz + grzebień), dory (włócznia hoplicka) trzymana
nadręcznie z sauroterem (tylny kolec), aspis/hoplon (okrągła tarcza) z blazonem typu
LAMBDA (Λ) na polu tarczy. To geometrycznie dopracowany, wielowarstwowy model — ale:

1. **Brak dedykowanego dispatchu po nazwie** — dziś trafia tu WYŁĄCZNIE przez kategorię
   `'falanga'` w `buildCategoryModel()`. W praktyce to jedyny użytkownik tej kategorii
   w całym `units.json` (sprawdzone), więc wizualnie unikalny „z przypadku", nie z
   projektu — niespójne z resztą rodziny Opus 5, gdzie dispatch idzie po nazwie.
2. **Blazon LAMBDA (Λ) na tarczy jest historycznie SPARTAŃSKI** (Λ = Lakedaimon), nie
   ogólnogrecki — inne poleis miały własne godła (Ateny = sowa/Α, Teby = maczuga,
   Argos = A itd.). Jeśli „Falanga" w grze reprezentuje uogólnioną grecką jednostkę
   (nie konkretnie Spartę), to wybór Lambda wymaga świadomej decyzji i uzasadnienia —
   Operator ma to zweryfikować: sprawdzić czy w grze istnieje osobna jednostka/kultura
   „Sparta" (jeśli tak, Lambda tam byłaby trafniejsza niż na generycznej „Falandze"),
   i udokumentować wybór (zostaw Lambda z uzasadnieniem „czytelny skrót hoplity" ALBO
   zmień na neutralny wzór) w nowej sekcji historycznej.
3. **Brak sekcji „ZGODNOŚĆ HISTORYCZNA"** (styl K1-K7 z `braz-konnica-opus5.ts`) — do
   dodania, z realnym uzasadnieniem każdego elementu (linothorax, helm koryncki, dory,
   aspis, brak nagolenników — sprawdzić czy to świadome pominięcie czy luka).

## Kryteria sukcesu

1. Falanga ma jawny dispatch PO NAZWIE w `buildNamedUnit()`, nie tylko przez kategorię.
2. Sekcja „ZGODNOŚĆ HISTORYCZNA" (K-style) dodana, z rozstrzygniętą i uzasadnioną
   kwestią blazonu Lambda (pkt 2 wyżej).
3. Jeśli audyt znajdzie realny błąd geometrii/proporcji — naprawiony, z dowodem
   pomiaru względem `HEX_R`.
4. Zero regresji: `case 'falanga'` fallback nadal działa (dla ewentualnych przyszłych
   jednostek tej kategorii), Hastati/Rzym nietknięte.
5. Real render Playwright/Chromium (bezwarunkowy wymóg, `R-PROC-AUTOBOT.md` §9 poz. 6a).
6. `tsc --noEmit` i `vite build` (C-001) czyste; testy tematu + 5 bramek referencyjnych
   zielone.
7. Kwestia „czy w grze istnieje osobna Sparta" i ewentualna zmiana blazonu to decyzja
   implementacyjna/badawcza (§10) — Operator rozstrzyga i dokumentuje, nie pyta
   właściciela, chyba że znajdzie sprzeczność z treścią decyzji tego tematu.

## Pętla

Operator → Evaluator → Final Control → integracja orkiestratora, jedno ID, jedna
gałąź. Limit 5 rund. Model/effort: **Opus 5 High dla Operatora i Evaluatora**
(temat czysto wizualny, `R-PROC-AUTOBOT.md` §5a), Final Control Sonnet 5 High.

## Raport terminalny dispatchu

ZMIANY/COMMIT: jeszcze brak — dispatch.
TESTY: kryteria sukcesu 1–7 wyżej.
BLOKADY: brak.
RUNDY: 0/5 (dispatch).
NASTĘPNY KROK: Operator, runda 1 (po zamknięciu T1/T2).
DEPLOY/PUSH: NIE WYKONANO.
