# C-OBCE-JEDN-Q2 — Znak właściciela nad żetonem jednostki

**Status:** 🟢 **ZAMKNIĘTE** — Maciej **A + doprecyzowanie Total War** (2026-07-27)  
**Grupa:** C + render (`gra/src/render/`)  
**Ekran:** [EKRAN: Mapa świata — żeton jednostki]

## Odpowiedź Macieja

> Wzorzec **Total War**: po **lewej stronie tabliczki** mały symbol frakcji.  
> - **Pełna cywilizacja** → **głowa władcy** (portret)  
> - **Miasto-państwo** → **sygnet państwa**  
> - **U góry** symbol generała — **na razie nie mamy generałów; można kiedyś**, poza zakresem v1 tego pakietu.

Barbarzyńcy: ikona frakcji (jak w oryginalnej opcji A) — do doprecyzowania przy wdrożeniu renderu.

## Layout żetonu na mapie (Maciej 2026-07-27)

```
        [generał — PRZYSZŁOŚĆ, nie teraz]

[portret/sygnet]  [★ weteran ★]     ← wiersz nad głową
 [koszary]    ★ ★ ★    [kuźnia]     ← symbole po bokach gwiazdek (gdy występują)

              [figurka]
```

- **Lewy róg tabliczki / żetonu:** portret władcy lub sygnet miasta-państwa  
- **Nad głową, między gwiazdkami:** ikona koszar (lewo) i kuźni (prawo) — tylko skrót poziomu (brąz/srebro/złoto)  
- **Szczegóły** (pełne % pancerza/parametrów, wszystkie statusy) → **tylko w karcie jednostki** (Q1)

## Uwaga techniczna

Dziś `render/unitUpgradeBadges.ts` łączy obie ścieżki w **kropki przy podstawie** żetonu. Decyzja Macieja wymaga **osobnych ikon koszar/kuźnia** po bokach gwiazdek — przy wdrożeniu dostosować lub zastąpić obecny układ kropek (patrz `C-OBCE-JEDN-KARTA.md`).

## Status wdrożenia

| Etap | Stan |
|------|------|
| **Właściciel** | 👷 **subagent (inna sesja)** — render → Opus |
| **Portret/sygnet po lewej** | ❌ brak |
| **Ikony koszar/kuźnia przy gwiazdkach** | ❌ brak (są kropki u podstawy) |
| **Generał u góry** | ⏸ poza zakresem |
| **Deploy** | czeka `działaj` · render 3D → subagent Opus (`gra/src/render/**`) |
