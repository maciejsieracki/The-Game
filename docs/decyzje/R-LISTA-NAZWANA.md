# R-LISTA-NAZWANA — biblioteka nazwanych list budowy

**Status:** ZDEPLOYOWANE FALA 214 `adefb5b8`  
**Data:** 2026-08-04 · **PR:** #74

## Decyzja Macieja (ECHO)

> *„po dodaniu listy własnej budynków to co już wybierzemy powinno znikać z listy do wyboru drugie nie powinno być graj A zapisz A, tylko po prostu stwórz listę i tworzymy nową listę. Potem dajemy nazwę, możemy zmienić tą nazwę i mamy nazwę listy.”*

Nadpisuje wcześniejsze **R-AUTO-V2-Q8=A** (szablony tylko A/B/C).

## Kryteria akceptacji

1. **Dropdown „+ dodaj…”** — budynki już na `budowaLista` nie pojawiają się w select; po dodaniu znikają (rerender); duplikaty zablokowane (`dedupeBudowaLista` + `lista.includes`).
2. **UI szablonów** — przycisk **Stwórz listę** (gdy lista niepusta) + `prompt` na nazwę; biblioteka z **Wgraj** / **Zmień nazwę** / **Usuń**; zachowany **Wgraj do wszystkich miast**; usunięte sloty A/B/C.
3. **Wyjście z Listy** — przycisk **Zamknij listę** w edytorze; ponowne kliknięcie **Lista**; ikona typu (→ Priorytet); **Ręczny**.
4. **Model danych** — `BudowaListaSzablon { id, nazwa, budynki }[]` w `meta.budowaListaBiblioteka`; migracja ze starego `budowaListaSzablony: {A,B,C}` → wpisy „Lista A” itd.
5. **Pliki** — `cities.ts`, `cityPanel.ts`, `main.ts`, test `budowa-lista-szablony-test.cjs`.
6. **Copy PL** — Stwórz listę · Zamknij listę · Wgraj · Zmień nazwę · Usuń · Wgraj do wszystkich miast.

*Koniec · 2026-08-04 (dopisek: wyjście z Listy).*
