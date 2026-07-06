# Szablon — pytania do Master Silnika (per temat)

> **Plik per temat:** `docs/decyzje/<ID>-PYTANIA-DO-SILNIKA.md`  
> **NIE mylić z:** pytaniami ABC do Macieja (gameplay → czat + `docs/decyzje/<ID>-*.md`).

---

## Kiedy pisać tutaj (do Silnika)

- Wpięcie `main.ts`, kanon, bramka test/build
- Konflikt cross-lane, własność pliku, niejasny handoff
- Blokada techniczna **bez** decyzji gameplay (Maciej nie wybiera A/B/C)
- Potrzebujesz routingu, priorytetu, lub decyzji inżynierskiej Silnika

## Kiedy NIE pisać tutaj

- Decyzja gameplay → **Maciej**, format ABC w czacie
- Raport wykonania lane → `dyspozycje/<LANE>-DO-MASTERA.md`
- Kontrakt cross-lane → `dyspozycje/_handoff/…`

---

## Format wpisu (append na dole)

```markdown
## [YYYY-MM-DD HH:MM] <ID>-S<n> — krótki tytuł

**Lane / pliki:** UI, MAPA · `gra/src/ui/hud.ts`
**Kontekst:** (2–4 zdania — co robisz, co odkryłeś)
**Pytanie do Silnika:** (jedno konkretne pytanie)
**Co blokuje:** (implementacja / test / handoff / wpięcie)
**→ SILNIK:** CZEKA NA ODPOWIEDŹ
```

Po odpowiedzi Silnika (Silnik dopisuje pod wpisem):

```markdown
### Odpowiedź Silnika [YYYY-MM-DD HH:MM]
(treść decyzji / routing / dyspozycja)
**Status:** ROZWIĄZANE | CZEKA NA MACIEJA | BLOKADA
```

Numeracja: `<ID>-S1`, `<ID>-S2`, … (S = Silnik).

---

## Zasady

- **Append-only** — nie kasuj historii
- **Jedno pytanie = jeden wpis** (nie pakuj wielu tematów)
- Po odpowiedzi Silnika: kontynuuj pracę; jeśli to gameplay → przenieś do ABC dla Macieja
- Silnik czyta ten plik przy `weryfikuj` i komendzie `pytania <ID>`
