# REJESTR PROBLEMÓW — AI (numeracja P-AI-###)

> **Zasada (Maciej 2026-07-26):** każdy błąd/propozycja dostaje **od razu** numer `P-AI-###`.
> W czacie odpowiadasz np. „napraw **P-AI-005**" — bez szukania kontekstu.
> Aktualizuj STATUS przy każdej zmianie. Nowe numery = kolejny wolny (nie recykling).

**Format STATUS:** `OTWARTE` · `NAPRAWIONE (kod)` · `ZDEPLOYOWANE` · `ODŁOŻONE` · `ŚWIADOMIE-ZOSTAJE`

---

| ID | Data | Problem (krótko) | STATUS | Uwagi / pliki |
|----|------|------------------|--------|----------------|
| **P-AI-001** | 2026-07-26 | AI produkuje **Osadnika** i zakłada miasto jednostką — w grze nie ma osadników | **NAPRAWIONE (kod)** | Usunięte z `ai.ts`; `planCityFounding` → `foundCityAt` |
| **P-AI-002** | 2026-07-26 | AI atakuje AI **bez wypowiedzenia wojny** | **NAPRAWIONE (kod)** | `canEngageOwner` + dyplomacja przed ruchem; `ai-war-gate-test.cjs` |
| **P-AI-003** | 2026-07-26 | AI **nie ekspanduje** (brak founding z panelu budowy) | **NAPRAWIONE (kod)** | C-AI-EKSP-Q1/Q2; max 1 miasto/turę |
| **P-AI-004** | 2026-07-26 | AI **wolno się rozwija** — brak celu „#1 Mocy", pasywna armia | **NAPRAWIONE (kod)** | C-AI-PAKIET/MOC; co 3 tury boost; sąsiad ≤8 hex |
| **P-AI-005** | 2026-07-26 | Pakiet C-AI **nie w grze** — kod w `gra/src`, brak build `gra-robocza/` | **OTWARTE** | Czeka **deploy** |
| **P-AI-006** | 2026-07-26 | `ekspansywnosc` w `civ-ai.json` = **0 wszędzie** — pole martwe | **OTWARTE** | Propozycja: wartości z `civ-matrix.json` |
| **P-AI-007** | 2026-07-26 | `priorytetEkonomia` / `priorytetNauka` / `priorytetMilitarny` — **nieczytane** w `ai.ts` | **OTWARTE** | Propozycja: podpiąć do `chooseCityProduction` |
| **P-AI-008** | 2026-07-26 | Zagrożenie wroga (5 hex) → **mury zamiast rozwoju** | **OTWARTE** | Propozycja: próg 7 hex lub wyjątek gdy nie #1 Mocy |
| **P-AI-009** | 2026-07-26 | Próg ulepszeń terenu AI = **30 Pracy** — rzadkie farmy | **ŚWIADOMIE-ZOSTAJE** | C-AI-MOC-Q3=A; ewent. dynamiczny próg 20 gdy nie #1 |
| **P-AI-010** | 2026-07-26 | Poradnik gracza: „konkuruj **osadnikiem**" | **OTWARTE** | `docs/PORADNIK-GRACZA/14-ai-zagrozenia.md` |
| **P-AI-011** | 2026-07-26 | AI **nie proponuje handlu** gdy brakuje surowców (gracz + AI) | **NAPRAWIONE (kod)** | deficyt (`needsResource` + kolejka budowy) → zakup; `zaproponuj_audiencje`; margines `handlowosc`; hint AI↔AI; cooldown deficyt |
| **P-AI-012** | 2026-07-26 | Pełne cywilizacje **nie produkują zwiadowców** na starcie — brak wyścigu o wioski | **NAPRAWIONE (kod)** | `ai.ts`: min. 2× Zwiadowca, ruch na wioski; `defensiveCopy` wyłączone |
| **P-AI-013** | 2026-07-26 | Dyplomacja AI **jednakowa** dla wszystkich typów cywilizacji (stuby grecy/rzym) | **NAPRAWIONE (kod)** | `resolveDiplomacyCivBias` + `civ-ai.json`; pakt/handlu vs haracz/wojna; `ai-test` T12 |
| **P-AI-014** | 2026-08-02 | Po eliminacji AI **zostają jednostki-sieroty** na mapie („AI bez miasta", etykieta „AI 32") | **NAPRAWIONE (kod)** | `disbandOwnerUnits` + `eliminateOwner` usuwa jednostki; `capital-capture-test.cjs` §11 |

---

## Jak używać w czacie

- „**P-AI-005** deploy" → publikuję do `gra-robocza/`
- „**P-AI-006** napraw" → uzupełniam dane + kod
- „**P-AI-008** zostaw" → status → ŚWIADOMIE-ZOSTAJE

**Następny wolny numer:** P-AI-015
