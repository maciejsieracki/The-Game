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
- Czy testy łapią realny bug, nie tylko happy-path?

### SCOPE + regresja (OBOWIĄZKOWE — Maciej 2026-08-05)

Adwokat diabła **zawsze** stosuje `R-PROC-AUTOBOT-EVAL-SCOPE` (playbook `rule_105`):

1. Czy każda zmiana w diffie wynika wprost z problemu/AC tematu? (nie „przy okazji”)
2. Czy paczka nie rusza niezwiązanych plików/funkcji?
3. Czy nie cofa wcześniejszych usprawnień / nie psuje innych tematów?
4. Przy NIE → **FAIL** lub **PASS-WITH-NOTES** z listą ubocznych ryzyk (nie akceptuj cicho).

Kanon: `docs/decyzje/R-PROC-AUTOBOT-EVAL-SCOPE.md`

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
