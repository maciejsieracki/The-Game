# P-BARBARZYNCY-USUWANIE-SEMANTYKA-Q1

## ECHO A — 2026-08-17

**Cytat właściciela:** „po wejściu jednostki cywilizacji na heks obozu
barbarzyńskiego heks ma być trwale wykluczony z przyszłego tworzenia obozów w
tej rozgrywce. Istniejące jednostki barbarzyńskie pozostają; zatrzymuje się
tylko spawner.”

**Decyzja:** A — wejście jednostki cywilizacji na heks aktywnego obozu:

1. usuwa aktywny obóz z `barbCamps`;
2. zapisuje klucz heksu (`q,r`) na trwałej czarnej liście tej rozgrywki;
3. wyklucza ten heks z każdej przyszłej losowej ścieżki tworzenia obozów;
4. nie usuwa ani nie modyfikuje istniejących jednostek barbarzyńskich,
   w szczególności ich `campId`;
5. zachowuje identyczne zachowanie dla gracza i AI.

Czarna lista jest częścią save/load. Stary save bez pola otrzymuje bezpieczny
default `[]`. Przy rozpoczęciu nowej gry lista jest pusta.

**Status:** ECHO A zapisane; implementacja i testy w toku. Bez deployu.
