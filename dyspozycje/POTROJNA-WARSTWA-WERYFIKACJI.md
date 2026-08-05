# Potrójna warstwa weryfikacji kodu

**Decyzja Maciej:** 2026-08-05 · **ID:** `R-PROC-POTROJNA-WARSTWA` · **Status: OBOWIĄZUJE**  
**Reguła Cursor:** `.cursor/rules/potrojna-warstwa-weryfikacji.mdc` (alwaysApply)  
**Decyzja:** `docs/decyzje/R-PROC-POTROJNA-WARSTWA.md`  
**Procedura:** `PROCEDURA-NUMER-ABC-COMMIT-DEPLOY.md` §4b

## Po co

Czasem agent naprawia jedno, a psuje coś innego, co już działało — albo usuwa wcześniejsze usprawnienie. Poprawianie tego marnuje czas. Stąd **zawsze trzy warstwy**, nawet jeśli drożej w tokenach.

## Jak działa (od tej pory — zawsze)

| Warstwa | Rola | Kto |
|---------|------|-----|
| **1** | Przygotowuje kod | Agent implementujący (`composer-2.5`) |
| **2** | Adwokat diabła — szuka błędów, regresji, ubocznych zepsuć | **Osobny** agent (`composer-2.5`) |
| **3** | Finalna kontrola całej paczki | Grok (agent główny) |

Dopiero po #2 i #3: meldunek „gotowe w kodzie” / hasło **`deploy`**.

## Co sprawdza adwokat diabła

- Czy decyzja ABC / AC jest naprawdę w kodzie?
- Czy nie wyłączono / nie usunięto wcześniejszej poprawki?
- Czy fix nie psuje innego miejsca (AI vs gracz, UI, zapis, koniec tury)?
- Czy testy łapią realny bug, nie tylko happy-path? → `R-PROC-AUTOBOT-EVAL-STRICT-EDGE` (FAIL #7)

### SCOPE + regresja (OBOWIĄZKOWE — Maciej 2026-08-05)

Adwokat diabła **zawsze** stosuje `R-PROC-AUTOBOT-EVAL-SCOPE` (playbook `rule_105`):

1. Czy każda zmiana w diffie wynika wprost z problemu/AC tematu? (nie „przy okazji”)
2. Czy paczka nie rusza niezwiązanych plików/funkcji?
3. Czy nie cofa wcześniejszych usprawnień / nie psuje innych tematów?
4. Przy NIE SCOPE → **FAIL** lub **PASS-WITH-NOTES** z listą ubocznych ryzyk (nie akceptuj cicho).
5. **STRICT** (`R-PROC-AUTOBOT-EVAL-STRICT`, `rule_106`): luki testów / brak asercji AC / czerwone testy tematu / `tsc≠0` → **FAIL** (nie NOTES).
6. **STRICT-EDGE** (`R-PROC-AUTOBOT-EVAL-STRICT-EDGE`, `rule_107`): testy tematu tylko happy-path bez edge/negacji/repro → **FAIL #7** (nie NOTES).
7. **STRICT-PARITY** (`R-PROC-AUTOBOT-EVAL-STRICT-PARITY`, `rule_108`): asymetria gracz/AI/MP bez decyzji ABC lub test tylko ownerId=0 → **FAIL #8** (nie NOTES).

Kanon: `docs/decyzje/R-PROC-AUTOBOT-EVAL-SCOPE.md` · twardość werdyktów: `docs/decyzje/R-PROC-AUTOBOT-EVAL-STRICT.md` · happy-path-only: `docs/decyzje/R-PROC-AUTOBOT-EVAL-STRICT-EDGE.md` · parytet ownerId: `docs/decyzje/R-PROC-AUTOBOT-EVAL-STRICT-PARITY.md`

## Punkty wejścia (każda sesja musi to znać)

| Plik | Gdzie |
|------|-------|
| `dyspozycje/START-TU.md` | żelazne zasady pkt 12 |
| `STAN-PRACY-HANDOFF.md` | baner procesu |
| `CLAUDE.md` | § zasady krytyczne 0a |
| `dyspozycje/PAMIEC-ROBOCZA-CIV.md` | §1a00 |
| `dyspozycje/REJESTR-PROSB-I-ZADAN.md` | wiersz + baner |
| `.cursor/rules/model-routing.mdc` | odnośnik po implementacji |

## Hasło Macieja

Brak osobnego hasła — reguła jest **stała** przy każdej paczce kodu po `działaj` / implementacji.
