# DODATEK orkiestratora (R-WEB-BATTLE-BARB-UNIT-OVERPOWER-AUDIT-Q1, 2026-11-12)
BAZA: origin/main 81e357dee. MODEL: Operator HAIKU 5.5, Obrona HAIKU, Evaluator/FC SONNET. Audyt bez zmian kodu gry. Wskazówki: silnik bitwy w gra/src/battle/**; obrażenia i mnożniki szukaj grep-em po "damage|dmg|mnoz|mult|bonus" w battle/ i game/combat*; sprawdź osobno ścieżkę dystansową (strzelcy) i wręcz. Ciężkie testy bitew z limitem 280 s. ŚRODOWISKO: worktree, npm ci --ignore-scripts, zakaz npm run build/dev, tsc --noEmit.

## DODATEK 2 (właściciel, 2026-11-12): typ i hipoteza zwiadowcy
Typ jednostki potwierdzony przez właściciela: WOJOWNIK (strona barbarzyńców i strona gracza — zweryfikuj, czy typy były identyczne).
Hipoteza właściciela do sprawdzenia: barbarzyńca stał w towarzystwie ZWIADOWCY i to „płynęło” na bitwę; późniejsze starcia wygrane normalnie. Kryteria dodatkowe:
(i) ustal, czy zwiadowca (jednostka cywilna/rozpoznawcza, FALA 509 ARMY-SCOUT-NOT-LEADER: zwiadowca ostatni w armii, nie wiedzie) WCHODZI do bitwy i czy jego obecność zmienia obrażenia, wybór jednostki wiodącej, kolejność ruchu lub liczbę jednostek po stronie barbarzyńców;
(j) odtwórz oba warianty: wojownik sam vs wojownik + zwiadowca w tym samym heksie/armii; zmierz rozbieżność wyniku;
(k) jeśli zwiadowca nie wnosi nic do bitwy — napisz to z dowodem i szukaj przyczyny w innych modyfikatorach (pkt 1 dispatchu).
