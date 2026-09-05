# R-MAPA-ETYKIETA-STOLICY-NAZWA-MIASTA-Q1 — Operator, obrona rundy 4

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-MAPA-ETYKIETA-STOLICY-NAZWA-MIASTA-Q1
GOAL: odpowiedź na zarzut 1 Evaluatora (`08-evaluator-runda-4.md`) — margines do sufitu
tekstury i sufit bazy zawyżone o 148 px. Baza 305, praca rund 2–4 i allowlista bez zmian.
MODEL+EFFORT: Opus 5, effort high (Operator, obrona — nie zwiększa licznika rund)

## OBRONA

**1 → PRZYJMUJĘ. Zarzut trafny w każdej liczbie; zweryfikowałem go własnym pomiarem,
nie na słowo.**

DOWÓD A — algebra z układu pigułki (`cityMapStatChip.ts:813-819`). Przy nazwie
wypełniającej budżet `nameW = BASE − prodW − growthW − crownW`, a `midExtraW` wnosi
`gap+growthW+gap+prodW`, więc `growthW` i `prodW` **skracają się**:
`W = padX + (defenseW+gap) + civW + gap + (crownW+gap) + nameW + midExtraW + gap + circleD + padX`
`= BASE + civW + 120 = 305 + 38 + 120 = 463`. To jest dokładnie `SLOTY_POZA_NAZWA_PX = 158`
z asercji G5 — mój komentarz przeczył asercji z tego samego commita.

DOWÓD B — pomiar prawdziwym `makeCityMapBadgeSprite` w żywym Chromium, cała pula
(15×100 nazw), pełen komplet slotów z `defenseTier: 1`:

| przypadek | px CSS | tekstura | margines | sufit bazy |
|---|---|---|---|---|
| 15 stolic, `defenseTier: 0` (mój pomiar rundy 4) | 426 | 1704 | 344 | **391** |
| ta sama stolica + tarcza obrony | 456 | — | — | — |
| **najszersza OSIĄGALNA** (`Kartagena Hiszpańska`, 287,5 px > budżet 221 → przycięta; pełne sloty) | **463** | **1852** | **196** | **354** |

Sprawdzenie sensu: `(391+158)×4 = 2196 > 2048` — sufit 391 przepuszczałby bazę łamiącą
gwarantowany WebGL2 `MAX_TEXTURE_SIZE`; `(354+158)×4 = 2048` dokładnie. Mój błąd: próba
obejmowała tylko `miasta_cywilizacji[0]` i `defenseTier: 0`, a najdłuższa z nich
(`uMgungundlovu`, 213,9 px) jest KRÓTSZA od budżetu, więc nie wypełniała go ani razu.
Nazw z puli dłuższych niż budżet konfiguracji 3 jest 39/1500 — przypadek jest realny.

## POPRAWKI

- `gra/src/render/cityMapStatChip.ts` — **wyłącznie komentarze** (`git diff` bez linii kodu):
  oba bloki (`CITY_NAME_BUDGET_BASE`, `BADGE_MAX_TOTAL_SCALE`) podają 463 / 1852 / 196 /
  sufit 354, wiążą liczbę z `BASE + 158` z G5, usunięte „wszystkie sloty" z opisu 426 px
  wraz z jawną notą, czym te 426 px NIE jest.
- `dowody/pomiar-plakietki-runda-4.cjs` — sekcja (e): przemiata **całą pulę × pełen komplet
  slotów**, sufit i kolizje liczone z najgorszego osiągalnego przypadku. Bez tego komentarz
  cytowałby dowód, który drukuje inną liczbę. Wydruk: 463 px, margines 196, sufit 354,
  kolizje 0/45 i najgorszy przypadek bez kolizji, exit 0.
- `07-operator-runda-4.md` — pole „Margines do sufitu tekstury" przepisane; najszersza
  osiągalna plakietka w akapicie kolizji 5,02 j. (wniosek 0 kolizji przy 8,66 j. bez zmian);
  „combat OK" → **combat 6/6** (uwaga poboczna Evaluatora; wydruk: `COMBAT TEST: 6/6 pass`).

**Nietknięte:** `CITY_NAME_BUDGET_BASE = 305`, bramka tematu, praca rund 2–4, allowlista.

## TESTY

`tsc --noEmit` zielone (`node ./node_modules/typescript/bin/tsc --noEmit`).
`mapa-etykieta-stolicy` **47/0** (G5 nadal zielona); `city-map-badge` 62/0;
`city-badge-growth-percent` 38/0; `rozmiar-label` 13/0; `city-names-pool` 12/0;
`city-names-pools` 6/0; `display-names` 27/0; `combat` 6/6.
`git diff --check` czysty; 3 pliki, wszystkie w allowliście rundy 4.
Bez `npm run build`/`dev`, bez `git add -A` (C-001, §9).

## BLOKADY

Brak.

ZMIANY/COMMIT: `gra/src/render/cityMapStatChip.ts` (komentarze), `dowody/pomiar-plakietki-runda-4.cjs`,
`07-operator-runda-4.md`, `09-obrona-runda-4.md` — SHA w commicie tej obrony.
RUNDY: 4/5 (obrona nie zwiększa licznika)
NASTĘPNY KROK: Final Control (Sonnet 5, effort high).
DEPLOY/PUSH: NIE WYKONANO
