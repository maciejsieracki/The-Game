# Slack OUTBOX — MASTER dyspozycja PILNA (2026-07-02)

> **Master → wszystkie grupy** · kanon `de9b53e…` · plik: `dyspozycje/MASTER-PILNE-2026-07-02.md`  
> **Maciej:** wpisz **`slack`** w hubie Master — agent wysyła z MCP · lub skopiuj wiadomości poniżej.

**Kanały:** `#master` `C0BE1FDVAMB` · `#grupa-a` `C0BDYGW02JF` · `#grupa-b` `C0BEZ5S0U6L` · `#grupa-c` `C0BE6NGSYG1` · `#grupa-d` `C0BE6NGFKKK` · `#grupa-e` `C0BDPD5R5JB`

---

## → `#master` (ogłoszenie)

```
[MASTER] 🔴 DYSPOZYCJA PILNA — backlog lane po KANON-BATCH-3
Kanon: de9b53e43997d8ec195f209054f46d3a · F IDLE — czeka moduły od A–E
Plik: dyspozycje/MASTER-PILNE-2026-07-02.md
Reguły: OBOWIĄZ-PT (nie proś Macieja o playtest) · OBOWIĄZ-ZAKRES (raport tylko swój lane)
Trigger w czacie grupy: działaj
Priorytet: A P1 F-P1-01 (blokuje C) · B B1-Q3+Panel-B · E E2 kreator · D+E E-P0-06 victory
Maciej: nie wkleja — pliki = prawda
```

---

## → `#grupa-a`

```
[MASTER→A] 🔴 PILNE · trigger: działaj
P1: F-P1-01 — spec ataku wrogiego miasta z mapy (klik) → handoff do C · BLOKUJE Grupę C
P2: Panel-A checklist PANEL-AUDYT (drobne)
Plik: docs/obieg/A-mapa.md § 🔴 PILNE
Po P1: przekaż do Mastera + Slack #master
Kanon: de9b53e… · NIE main.ts · NIE playtest Macieja
```

---

## → `#grupa-b`

```
[MASTER→B] 🔴 PILNE · trigger: działaj
P1: B1-Q3 drzewko liniowe — decyzja Macieja B już jest → wdroż economy/tech
P2: Panel-B arkusze Budynki · Technologie · Surowce · eksportuj panel
P3: przekaż do Mastera + handoff EKONOMIA-do-MASTER_B1-Q3-panel-B
Plik: docs/obieg/B-ekonomia.md § 🔴 PILNE
Kanon: de9b53e… · NIE playtest Macieja
```

---

## → `#grupa-c`

```
[MASTER→C] 🔴 PILNE · trigger: działaj (po A)
P1: F-P1-01 atak miasta z mapy — CZEKA spec od Grupy A
P2: Panel-C balans opcjonalnie (JSON już w kanonie KANON-BATCH-3)
Plik: docs/obieg/C-walka.md § 🔴 PILNE
Lane IDLE do handoffu A→C · NIE playtest Macieja
```

---

## → `#grupa-d`

```
[MASTER→D] 🔴 PILNE · trigger: działaj
P1: E-P0-06 ekran zwycięstwa — wspólnie z Grupą E
P2: Panel-D pierwszy eksportuj panel (round-trip Excel→JSON)
Sojusz v1.2: ✅ kanon — nie powtarzaj
Plik: docs/obieg/D-cywilizacje.md § 🔴 PILNE
```

---

## → `#grupa-e`

```
[MASTER→E] 🔴 PILNE · trigger: działaj
P1: E2 kreator dopięcie — miasta-państwa · buildParams() · handoff UI-do-INTEGRATOR_E2
P2: E-P0-06 pełny ekran victory — z Grupą D
P3: przekaż do Mastera + Slack
Plik: docs/obieg/E-start.md § 🔴 PILNE
Kanon: de9b53e… · NIE main.ts
```

---

## → `#grupa-f` (informacja)

```
[MASTER→F] INFO — IDLE
Kolejka pusta · czeka batchy od A–E po przekaż do Mastera
Ostatni: KANON-BATCH-3 · md5 de9b53e…
```

---

**Status wysyłki MCP:** ✅ **WYSŁANE** 2026-07-02 (`slack` w hubie Master)
