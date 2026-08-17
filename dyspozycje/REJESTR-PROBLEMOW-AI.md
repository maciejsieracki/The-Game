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
| **P-AI-006** | 2026-07-26 | `ekspansywnosc` w `civ-ai.json` = **0 wszędzie** — pole martwe | **ZAMKNIĘTE (stale)** | Dane mają 2–5; `ai.ts` czyta `civAiProfile.ekspansywnosc` (2026-08-05) |
| **P-AI-007** | 2026-07-26 | `priorytetEkonomia` / `priorytetNauka` / `priorytetMilitarny` — **nieczytane** w `ai.ts` | **NAPRAWIONE (kod)** częściowo | `P-AI-007=A` — nauka w puli; panelBoost z profilu |
| **P-AI-008** | 2026-07-26 | Zagrożenie wroga (5 hex) → **mury zamiast rozwoju** | **WDROŻONE (kod)** · jednostki+rozwój major AI, MP mury zostają | `docs/decyzje/P-AI-008.md` |
| **P-AI-009** | 2026-07-26 | Próg ulepszeń terenu AI = **30 Pracy** — rzadkie farmy | **ŚWIADOMIE-ZOSTAJE** | C-AI-MOC-Q3=A; ewent. dynamiczny próg 20 gdy nie #1 |
| **P-AI-010** | 2026-07-26 | Poradnik gracza: „konkuruj **osadnikiem**" | **ZAMKNIĘTE** | Poradnik rev.G: Załóż miasto, bez osadnika |
| **P-AI-011** | 2026-07-26 | AI **nie proponuje handlu** gdy brakuje surowców (gracz + AI) | **NAPRAWIONE (kod)** | deficyt (`needsResource` + kolejka budowy) → zakup; `zaproponuj_audiencje`; margines `handlowosc`; hint AI↔AI; cooldown deficyt |
| **P-AI-012** | 2026-07-26 | Pełne cywilizacje **nie produkują zwiadowców** na starcie — brak wyścigu o wioski | **NAPRAWIONE (kod)** | `ai.ts`: min. 2× Zwiadowca, ruch na wioski; `defensiveCopy` wyłączone |
| **P-AI-013** | 2026-07-26 | Dyplomacja AI **jednakowa** dla wszystkich typów cywilizacji (stuby grecy/rzym) | **NAPRAWIONE (kod)** | `resolveDiplomacyCivBias` + `civ-ai.json`; pakt/handlu vs haracz/wojna; `ai-test` T12 |
| **P-AI-015** | 2026-08-02 | **BUG-DYP-GIFT-WAR** — dar 50¤ od miasta-państwa widoczny i akceptowalny podczas wojny | **NAPRAWIONE (kod)** | `pruneInvalidNegotiations` po DOW; filtr UI + bramka Accept; `resolvePlayerAcceptsAiPending` + `isGift` · branch `cursor/fix-gift-during-war-63a1` |
| **P-AI-016** | 2026-08-17 | AI nie uwzględnia mgły wojny przy wyborze i egzekucji celów | **OTWARTE** | Decyzja `P-AI-BRAK-POJECIA-MGLY-Q1=A+C`; implementacja widoczności per owner, pamięci celów i ponownego wykrycia przed atakiem |

---

## Jak używać w czacie

- „**P-AI-005** deploy" → publikuję do `gra-robocza/`
- „**P-AI-006** napraw" → uzupełniam dane + kod
- „**P-AI-008** zostaw" → status → ŚWIADOMIE-ZOSTAJE

**Następny wolny numer:** P-AI-017
