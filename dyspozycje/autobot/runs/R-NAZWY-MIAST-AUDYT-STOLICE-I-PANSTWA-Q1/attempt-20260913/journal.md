# Journal — R-NAZWY-MIAST-AUDYT-STOLICE-I-PANSTWA-Q1

2026-09-13 — Orientacja
- Potwierdzono aktualny HEAD `0b95694b73c429d01d8b65942235f2863947f986`, branch `hermes/R-NAZWY-MIAST-AUDYT-STOLICE-I-PANSTWA-Q1` i czysty stan przed edycją.
- Przeczytano bieżący dispatch próby oraz prześledzono loader, pule nazw, funkcje wyboru nazw, klaster startowy i testy.

2026-09-13 — Audyt danych
- Skrypt na `city-names-pools.json` policzył 15 cywilizacji; każda ma 100 nazw `miasta_cywilizacji` i 10 nazw `miasta_panstwa`.
- W każdej liście: 0 pustych wpisów i 0 duplikatów; przecięcie obu list w obrębie każdej cywilizacji: 0.
- `civs.json:nazwyMiast` ma 15 pełnych luster po 100 nazw. Wykryto i naprawiono dwa rozjazdy lustra: Asyria (`Aszur`) i Fenicjanie (`Byblos`).
- Powtórzenia między różnymi pulami regularnymi oraz trzy globalne kolizje między typami cywilizacji pozostawiono bez zmian, bo kontrakt testowy wymaga rozłączności per cywilizacja, a dispatch zabrania usuwać niepotwierdzone kolizje.

2026-09-13 — Reprodukcja i poprawka
- Najpierw rozszerzono ukierunkowany test o kapitały bez argumentu `pools`; stara implementacja zwróciła niezerowy exit zamiast regularnych stolic (`nazwyKlastra[0]` było pulą państw-miast).
- Minimalna poprawka w `civ-names.ts`: ścieżki bez puli czytają `nazwyMiast[0]`, z zachowaniem fallbacku do `nazwyKlastra[0]` przy braku eksportu.
- Zsynchronizowano dwa wpisy `nazwyMiast` w `civs.json`; rozszerzono ten sam test na wszystkie 15 cywilizacji i oba typy stolicy.

2026-09-13 — Weryfikacja
- Zielone: test pul rozłącznych, test puli, test synchronizacji puli, test nazw cywilizacji/fallbacków, test etykiet i test mapy.
- `tsc --noEmit` zakończył się exit 0 przy czasowym, nieinstalującym symlinku do istniejących lokalnych zależności; symlink usunięto.
- Nie wykonano build/dev, push, PR, merge ani deploy; build/dev są objęte zakazem procedury dla `gra/`.
