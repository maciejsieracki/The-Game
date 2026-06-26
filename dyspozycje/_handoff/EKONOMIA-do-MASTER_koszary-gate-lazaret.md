# EKONOMIA -> MASTER: Koszary gate + Lazaret parking

Data: 2026-06-25  
Lane: EKONOMIA (Maciej)

---

## Zmiana 1 — Koszary bramkują jednostki Brązu

**Plik:** `gra/src/game/production.ts`, linia ~359 (w pętli jednostek `availableProduction`)

**Reguła:** Jednostki z `epochNumber(u.Epoka) === 2` (Brąz) są oferowane w `availableProduction`
tylko wtedy, gdy miasto ma wybudowane Koszary (id = `'koszary'`).

```typescript
// Koszary gate (decyzja Maciej 2026-06-25): jednostki epoki Brazu wymagaja
// wybudowanych Koszar (id='koszary') w miescie. Inne epoki bez zmian.
if (epochNumber(u.Epoka) === 2 && !built.has('koszary')) continue;
```

**Id Koszar:** `"koszary"` (z `gra/data/buildings.json`, epokaWejscia=2, techUnlock="Wojskowosc")

**Scope:**
- Dotyczy `availableProduction` i przez nią `purchasableUnits` (filtr jednostek).
- Jednostki epoki Kamień (1) i Żelazo (3) — bez zmian, nie wymagają Koszar.
- Civ-specific replacements (`W zamian za != '-'`) filtrowane wcześniej — nie zmieniono.
- Sygnatura `availableProduction(city, data, unlockedTechs, ctx)` — bez zmian.
- `built` pochodzi z `ctx.builtBuildingIds` (Set wewnątrz funkcji).

**Czy UI/main.ts wymaga zmian?**
- Brak — gate jest czystą logiką w `availableProduction`. UI dostaje już przefiltrowaną listę.
- Jeśli gdzieś w UI jest hardcoded lista jednostek (nie przez `availableProduction`) — MAPA/SILNIK/UI powinna sprawdzić i dostosować, ale w v0.1 nie ma takiego miejsca wg EKONOMIA-lane.

---

## Zmiana 2 — Lazaret → epoka Średniowiecze (parking)

**Plik:** `gra/data/buildings.json`, budynek `id="lazaret"`

**Zmiana:** `epokaWejscia: 3 → 4`

**Uzasadnienie:** Lazaret to budynek przyszłej epoki Średniowiecze. Cap v0.1 = epoka 3 (Żelazo),
więc Lazaret jest poza zasięgiem gracza w v0.1 — ale zostaje w pliku, nie usuwamy.
Aktywuje się automatycznie gdy gra dotrze do epoki 4.

**techUnlock:** Pozostaje `"Medycyna"` jako placeholder.
Docelowo powinna być tech średniowieczna — nie wymyślamy nowej przed decyzją Macieja.
Może być zmienione na `null` lub właściwą technikę przy rozszerzeniu na epokę 4.

**Czy Lazaret pojawia się w v0.1?** NIE — `availableProduction` pomija budynki z
`epokaWejscia > epoch`, a max epoch w v0.1 = 3.

---

## Testy

Nowy plik: `gra/tools/koszary-gate-test.cjs`  
Uruchomienie: `node tools/koszary-gate-test.cjs` (z katalogu `gra/`)

Pokrycie (18 asercji):
- epochNumber sanity (Kamień/Brąz/Żelazo + warianty z ogonkami)
- (A) Jednostka Brązu NIE w `availableProduction` bez Koszar
- (B) Jednostka Brązu JEST po dodaniu Koszar do `built`
- (C) Jednostka Kamienia dostępna bez/z Koszarami — bez zmian
- (D) Jednostka Żelaza dostępna bez/z Koszarami przy epoch=3 — bez zmian
- (E) Civ-specific replacement nigdy nie pojawia się (niezależnie od Koszar)
- (F) `purchasableUnits` też respektuje gate
- (G) Lazaret niedostępny przy epoch=3, dostępny przy epoch=4 + tech Medycyna — real buildings.json

Wynik: **WSZYSTKIE ZIELONE (18/18)**  
Regresja `logic-test.cjs`: **LOGIC OK (180/180)**  
Regresja `split-output-test.cjs`: **SPLIT-OUTPUT OK (46/46)**

---

## Backupy

- `gra/src/game/production.ts.bak-EKONOMIA`
- `gra/data/buildings.json.bak-EKONOMIA`
