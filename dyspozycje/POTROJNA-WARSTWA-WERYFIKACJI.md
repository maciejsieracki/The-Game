# Potrójna warstwa weryfikacji kodu

**Decyzja Maciej:** 2026-08-05  
**Reguła Cursor:** `.cursor/rules/potrojna-warstwa-weryfikacji.mdc` (alwaysApply)

## Po co

Czasem agent naprawia jedno, a psuje coś innego, co już działało — albo usuwa wcześniejsze usprawnienie. Poprawianie tego marnuje czas. Stąd **zawsze trzy warstwy**, nawet jeśli drożej w tokenach.

## Jak działa

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

## Hasło Macieja

Brak osobnego hasła — reguła jest **stała** przy każdej paczce kodu po `działaj`.
