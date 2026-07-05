# Decyzja UX — kolory stron w bitwie (Grupa C)

**Data:** 2026-07-03  
**Status:** ✅ **ZATWIERDZONE** (Maciej, po poprawce Design)  
**Źródło mockupu:** `docs/ux/claude-design/The Game - C06 Deployment v3 (1E).dc.html`

---

## Reguła (kanon 1E)

| Strona | Kto | Kolor główny | Tekst pomocniczy |
|--------|-----|--------------|------------------|
| **Ty (gracz)** | Atakujący w typowym flow | **`#3a6ad0`** (niebieski) | `ATK · Ty` · `Atakujący (Ty)` |
| **Wróg** | Obrońca / przeciwnik | **`#c84040`** (czerwony) | `OBR · wróg` · `Obrońca` |

**Nie używać zieleni** jako akcentu strony / paska HP gracza — myli z „sukces / morale OK”.

---

## Gdzie stosować

- Strefa deploymentu (lewa = Ty, niebieski pas)
- Etykiety górne pola: `ATK · Ty` / `OBR · wróg`
- Górny pasek HUD: liczniki + medaliony stron
- Pionowe paski morale **boków** ekranu (L = Ty niebieski, P = wróg czerwony)
- Panel zaznaczonych jednostek (obwódka + HP bar **niebieski** dla własnych)
- Minimapa: pasek L niebieski / P czerwony (orientacja stron)

**Morale jednostki** (spadek jako zagrożenie): nadal gradient zielony→czerwony **jako stan**, nie jako kolor frakcji.

---

## Odchylenie od kodu dziś

`gra/src/battle/battleScene.ts`:

```ts
const FACTION_ATK = '#c84040';  // czerwony — odwrotnie niż Design
const FACTION_DEF = '#4090c8';  // błękit
```

Paski boków: ATK `#e53935`, OBR `#1e88e5` — też odwrócone względem „Ty = niebieski”.

**Przy porcie mockupów C-06/C-07:** kolor = **gracz vs wróg** (`isPlayerSide`), nie ślepo `side === 'atk'`.

---

## Powiązane mockupy

| Plik | Uwaga |
|------|-------|
| C-06 v3 | ✅ kolory poprawione |
| C-01 Pre-bitwa v2 | Atakujący (Rzym) nadal złoty medalion — **opcjonalna harmonizacja** niebieskim rantem Ty |
| C-07 brief | brief zaktualizowany pod tę decyzję |

---

## Handoff lane UNITS/UI

Kontrakt: `dyspozycje/_handoff/DESIGN-do-UNITS_kolory-stron-bitwa.md` (krótki)
