# Wiarygodność (dyplomacja)

## Metadane

| id | `wiarygodnosc` |
| tytuł | Wiarygodność |
| kategoria | Dyplomacja |
| poradnik_ref | Część XII §74 |
| json_ref | `diplomacy.json`, `diplomacy-credibility.ts` |

---

## Wiki‑S

**Wiarygodność (W)** to globalna reputacja twojego państwa (−100…+100). Wpływa na tempo budowania Zaufania u wszystkich nacji. Sojusz wymaga **W ≥ 0**, pakt o nieagresji **W ≥ −40**. Prezenty dają max **+5 Zaufania/turę** — ten sam limit dla każdego (bez bonusu od wysokiej W).

---

## Wiki‑M

### Czym jest Wiarygodność

W przeciwieństwie do **Zaufania** i **Respektu** (liczone per para dyplomatyczna), **Wiarygodność** jest **jedna na całe imperium** — widoczna dla wszystkich od razu. Mierzy historię dotrzymywania słowa: trwanie traktatów, złamanie paktu, nieautoryzowany przemarsz, pomoc sojusznikowi.

### Pasma (skala −100…+100)

| W | Pasmo |
|---|-------|
| +40…+100 | Wzór cnoty |
| 0…+39 | Uczciwy |
| −39…−1 | Chwiejny |
| −100…−40 | Wiarołomny |

Start: Łatwy **+40** · Normalny **+20** · Trudny **0**.

### Model relacji (FALA 206)

```
Wiarygodność → (tempo) Zaufanie per para
Zaufanie + Respekt = Relacja (0–200)
```

**Relacja** decyduje o progach handlu, NAP, sojuszu. **W** decyduje o twardych bramkach i szybkości wzrostu Zaufania.

### Twarde bramki

| Traktat | Min. W |
|---------|--------|
| Pakt o nieagresji (NAP) | **−40** |
| Sojusz wojskowy | **0** |

### Dary i limit Zaufania

Z nadwyżki PN (handel, dar) możesz zyskać **maks. +5 Zaufania na turę** — **stały sufit** dla wszystkich graczy (decyzja FALA 206: bez „Dźwigni 2" zależnej od W). UI pokazuje wiersz **„Wpływ Relacji na deal"** z procentową korektą akceptacji oferty.

### Wchłonięcie miasta-państwa

Osobna akcja dyplomatyczna (v1, tylko MP): wasal ≥ **10 tur**, Respekt ≥ **90**, opłata złotem, zgoda Relacji — patrz Część XII §77.2.

**Powiązane:** [[Handel surowcami (dyplomacja)]] · Część XII · `docs/decyzje/` WIAR-*

---

## Przykład liczbowy

Gracz z **W = +15** (Uczciwy) proponuje **sojusz** — bramka W≥0 **spełniona**. Przy **Relacji 140** i **Zaufaniu 85** (progi sojuszu: Relacja 151, Zaufanie 91) brakuje jeszcze kilku punktów — dar +100 PN da max **+1 Zaufania** w tej turze (limit 5/turę, nie 10).

---

## Poradnik‑L

→ `docs/PORADNIK-GRACZA/12-dyplomacja.md` §74

---

## Historia / decyzje

FALA 206 (2026-08-03): D3 progi W, tempo W→Z, usunięcie Dźwigni 2, UI „Wpływ Relacji na deal". Hasło dodane rev. G 2026-08-04.
