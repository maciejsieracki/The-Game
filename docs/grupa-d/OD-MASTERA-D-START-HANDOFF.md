# OD MASTERA → Grupa D — D-START klaster + miasta-kopie typu

**Data:** 2026-06-27 · **Priorytet:** **P0** · **Decyzje Macieja:** **ZAMKNIĘTE** — nie pytaj ponownie o model.

---

## Wklej na start czatu Grupa D

```
Grupa D. Temat D-START (klaster startowy + miasta-kopie typu).
Obowiązuje docs/czaty/GRUPA-D-NAUKA-DYPLOMACJA.md + docs/grupa-d/MODELE-MIAST-TYPU.md.

START TU:
1. docs/decyzje/D-START-miasta-kopie-typu.md (kanon produktowy)
2. docs/decyzje/D-START-klaster-nazwy.md (nazwy + dyplomacja warstwowa)
3. dyspozycje/CYWILIZACJE.md § [2026-06-27] PRIORYTET P0
4. dyspozycje/_handoff/CYWILIZACJE-do-MASTER_miasta-kopie-typu.md

Twoje zadania (CYWILIZACJE lane):
- AI defensywne dla miast-kopii typu (ai.ts + AI-zachowanie Excel)
- Audyt bonusów/gospodarki per ikonaId
- Handoff do SILNIK po MAPA rozszerzy spawn obcych klastrów

NIE ruszaj main.ts. Meldunki append CYWILIZACJE-DO-MASTERA.md.
```

---

## Kontekst (skrót dla agenta)

Master + Maciej zamknęli model startu gry. **Miasto AI = kopia typu cywilizacji**, nie osobna nacja. Gracz ma rywali swojego typu w klastrze; obce typy (Chińczycy…) mają **symetrycznie** własny klaster chińskich nazw — **do podbicia**. AI **tylko obrona** (bez ekspansji, bez zakładania miast).

**Kod Master (SILNIK):** wpięty klaster gracza + nazwy + dyplomacja warstwowa UI. **Luka:** obcy typ = 1 miasto zamiast pełnego klastra; AI nadal ekspansyjne.

**Ty (Grupa D)** domykasz **runtime** po starcie (AI defensywne, pełny spawn obcych klastrów, Excel).  
**Kreator startu (wybór cywilizacji)** = **GOTOWY** — patrz `docs/decyzje/E1-START-KREATOR-KLASTR.md` · `start-preview.ts` · `newGameFlow.ts`.

**Ty (Grupa D)** domykasz semantykę cywilizacji w turze:

---

## Pliki referencyjne

| Plik | Co |
|------|-----|
| `docs/decyzje/D-START-miasta-kopie-typu.md` | Kanon |
| `docs/grupa-d/MODELE-MIAST-TYPU.md` | Charter lane D |
| `docs/decyzje/D-START-klaster-nazwy.md` | N-1A…N-5B, D-START-1B/2B/3A |
| `dyspozycje/_handoff/SILNIK-do-MASTER_D-START-klaster.md` | Co SILNIK już wpiął |
| `gra/src/game/civ-names.ts` | Nazwy klastra |
| `gra/src/game/cluster-start.ts` | Plan startu (SILNIK) |
| `gra/src/game/diplomacy-layers.ts` | Uproszczona vs pełna dyplomacja |

---

## DoD Grupa D (pierwszy meldunek)

- [ ] Profil `kopia_typu_obronna` opisany w AI-zachowanie (Excel lub propozycja wartości)
- [ ] Plan zmian `ai.ts` (gałąź defensywna) — handoff lub kod w lane
- [ ] Potwierdzenie: `civBonusyForOwnerId` = typ, nie nazwa miasta
- [ ] Wpis w `CYWILIZACJE-DO-MASTERA.md`
- [ ] Zależność MAPA: rozszerzyć spawn obcych typów — handoff `CYWILIZACJE-do-MAPA_…` jeśli potrzebny

**Review:** Master → potem SILNIK batch · Opus przed kanonem
