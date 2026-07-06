# Co Maciej wpisuje w czatach — broadcast ścieżki kodu (2026-07-05)

> Skopiuj odpowiedni blok do **jednego** czatu z grupą. Agent ma odczytać plik i **potwierdzić** formatem z końca wiadomości.

---

## Wszystkie grupy A–E (ten sam tekst — zmień tylko literę w nagłówku)

### Grupa A

```
ścieżka

OBOWIĄZEK od dziś — przeczytaj i potwierdź:
docs/obieg/OBOWIAZ-SCIEZKA-KODU.md

Kod mapy/HUD: TYLKO gra/src/ (map/, render/, ui/hud…).
ZAKAZ: gra-robocza/src/ i gra-kanon/src/ — to snapshoty, Maciej tego nie widzi po publish.

Potwierdź jednym blokiem POTWIERDZAM ŚCIEŻKĘ · Grupa A (wzór na końcu pliku).
```

### Grupa B

```
ścieżka

OBOWIĄZEK od dziś — przeczytaj i potwierdź:
docs/obieg/OBOWIAZ-SCIEZKA-KODU.md

Kod miasta/ekonomii: TYLKO gra/src/ (game/, ui/cityPanel…).
ZAKAZ: gra-robocza/src/ i gra-kanon/src/.

Potwierdź: POTWIERDZAM ŚCIEŻKĘ · Grupa B
```

### Grupa C

```
ścieżka

OBOWIĄZEK od dziś — przeczytaj i potwierdź:
docs/obieg/OBOWIAZ-SCIEZKA-KODU.md

Kod walki: TYLKO gra/src/ (battle/, combat.ts, siege.ts…).
ZAKAZ: gra-robocza/src/ i gra-kanon/src/.

Potwierdź: POTWIERDZAM ŚCIEŻKĘ · Grupa C
```

### Grupa D

```
ścieżka

OBOWIĄZEK od dziś — przeczytaj i potwierdź:
docs/obieg/OBOWIAZ-SCIEZKA-KODU.md

Kod danych/AI/dyplomacji: TYLKO gra/src/ + gra/data/.
ZAKAZ: gra-robocza/src/ i gra-kanon/src/.

Potwierdź: POTWIERDZAM ŚCIEŻKĘ · Grupa D
```

### Grupa E

```
ścieżka

OBOWIĄZEK od dziś — przeczytaj i potwierdź:
docs/obieg/OBOWIAZ-SCIEZKA-KODU.md

Wasze modale 2026-07-04 były w ZŁYM miejscu (gra-robocza/src/ui/) — od teraz TYLKO gra/src/ui/.
ZAKAZ: gra-robocza/src/ i gra-kanon/src/. Po zmianie → przekaż Master → F publish.

Potwierdź: POTWIERDZAM ŚCIEŻKĘ · Grupa E
```

---

## Grupa F (Integrator)

```
ścieżka

OBOWIĄZEK — handoff BLEDY był błędny (edycja gra-robocza/src). Od dziś:
1. Jedyne źródło: gra/src/
2. Publish: gra/tools/publish-robocza-snapshot.ps1 → gra-robocza/Gra-podglad.html
3. ZAKAZ edycji gra-robocza/src/ (deprecja publish-robocza-bundle z robocza/src)

Przeczytaj: docs/obieg/OBOWIAZ-SCIEZKA-KODU.md
Potwierdź: POTWIERDZAM ŚCIEŻKĘ · Grupa F
```

---

## Master (ten hub)

```
ścieżka

Przeczytaj docs/obieg/OBOWIAZ-SCIEZKA-KODU.md
Dyspozycje tylko na gra/src/ — nie gra-robocza/src.
Playtest do Macieja: gra-robocza/START.html + md5 w pierwszej linii.
```

---

## Kolejność u Macieja (zalecana)

1. **F** (publish) — najpierw, bo scala pipeline  
2. **E** (UX — najwięcej błędów w snapshot)  
3. **A** (mapa/render)  
4. **B, C, D** — ten sam krótki tekst  
5. **Master hub** — na końcu

**Alternatywa jednym hasłem:** we **wszystkich** czatach wpisz tylko:

```
reguły · ścieżka
```

Agent czyta `_ZASADY.md` + `OBOWIAZ-SCIEZKA-KODU.md` + plik swojej grupy.
