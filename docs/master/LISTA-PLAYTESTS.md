# LISTA PLAYTESTÓW — Master (scenariusze batchy)

> **Maciej:** czytaj **[`REJESTR-PLAYTESTOW.md`](REJESTR-PLAYTESTOW.md) §1** — jedna lista + eksport końcowy.  
> **Ten plik:** szczegóły scenariuszy per batch (Master). **Kandydaci → dopisuj też §2 rejestru.**  
> **Brama v1.0:** ⏸ **ZAMKNIĘTA** — Maciej testuje dopiero przy ~100% gry (decyzja 2026-07-02).

**Ostatnia aktualizacja:** 2026-07-02 (brama v1.0 · wszystko ⏸ KOLEJKA)

---

## Kanon do testu

| Pole | Wartość |
|------|---------|
| **Plik** | `Gra-podglad.html` · `gra-kanon/START.html` |
| **md5** | **`e2be159f457ded870e198d0e0eaa847d`** |
| **Sync** | root = `gra-kanon/` = `gra-robocza/` ✅ |

---

## Legenda statusu

| Status | Znaczenie |
|--------|-----------|
| ▶ **OTWARTY** | Master prosi Macieja — aktywny teraz |
| ⏸ **KOLEJKA** | wdrożone w kanonie · czeka na otwarcie |
| ✅ **ZAMKNIĘTY** | `playtest OK` / REJESTR ✅ |
| 🟡 **CZĘŚCIOWY** | np. `2 OK` (E2 smoke) |

**Sygnały Macieja:** `playtest OK` · `1 OK` (tylko aktywny ID) · `BUG: …`

---

## ▶ OTWARTY (priorytet Mastera)

> **§0 rejestru ZAMKNIĘTA** — sekcja pusta do dnia v1.0. Batchy poniżej → **⏸ KOLEJKA**.

---

## ⏸ KOLEJKA (wdrożone w kanonie · test po otwarciu §0)

### PT-F01 — F-P1-01 atak wrogiego miasta z mapy

| Pole | Wartość |
|------|---------|
| **Batch** | F-P1-01 · promocja 2026-07-02 |
| **Handoff** | `dyspozycje/_handoff/F-do-MASTER_F-P1-01-2026-07-02.md` |
| **Status** | ⏸ **KOLEJKA** |
| **REJESTR** | §2 · po OK → §3 |

| # | Scenariusz | ☐ |
|---|------------|---|
| F01-1 | Miasto **bez muru** + obrońcy + jednostka obok → **preBattle** → wygrana → **capture** | ☐ |
| F01-2 | preBattle → **Wycofaj** → jednostka **zachowuje ruch** | ☐ |
| F01-3 | Miasto **z murem** → nadal **Oblężaj / Szturm** (bez regresji C3) | ☐ |
| F01-4 | **Dokładnie 1** sąsiednia jednostka (bez zaznaczenia) → **auto-atak** | ☐ |
| F01-5 | Klik **wrogie** miasto → **nie** otwiera panelu miasta gracza | ☐ |

---

### PT-V06 — E-P0-06 ekran zwycięstwa

| Pole | Wartość |
|------|---------|
| **Batch** | E-P0-06 · w kanonie od `188437eb…` (w bundle `e2be159f…`) |
| **Handoff** | `dyspozycje/_handoff/F-do-MASTER_VICTORY-E-P0-06-2026-07-02.md` |
| **Status** | ⏸ **KOLEJKA** (łączyć z PT-F01 w jednej sesji po §0) |

| # | Scenariusz | ☐ |
|---|------------|---|
| V06-1 | Wygrana **dominacją** (Power >50%, epoka Żelazo) — stat Power % + opis progu | ☐ |
| V06-2 | Wygrana **naukowa** (rakieta) — opis rakiety, złoty tytuł | ☐ |
| V06-3 | **Przegrana** (zero miast + zero osadników) — czerwony wariant + **Nowa gra** → reload | ☐ |

---

## ⏸ KOLEJKA (ciąg dalszy — wdrożone · test po §0)

### PT-Z05 — B2-D18 balans trudności

| # | Scenariusz | ☐ |
|---|------------|---|
| Z05-1 | **Easy:** stolica +1/+1 przy założeniu | ☐ |
| Z05-2 | Immunitet bogactwa **10 / 5 / 3** tur (T1–T3) | ☐ |
| Z05-3 | Progi revolt **5 / 8 / 10** · stolica easy bonus T1–10 | ☐ |

**Decyzja:** B2-D18 · **REJESTR:** 🟢 → ✅ po OK

---

### PT-P7 — Prezent / dar (G3-B)

| # | Scenariusz | ☐ |
|---|------------|---|
| P7-1 | Dyplomacja → audiencja → akcja **13 Prezent** widoczna przy Rel ≥ 30 | ☐ |
| P7-2 | Prezent działa (PN / relacja) · nie w wojnie | ☐ |

**Decyzja:** P7-G3-B

---

### PT-A5 — Miasta Roblox + ghost założenia

| # | Scenariusz | ☐ |
|---|------------|---|
| A5-1 | Miasta na mapie — styl Roblox (kamień ep.1 / brąz ep.2+) | ☐ |
| A5-2 | Ghost przy **założeniu** miasta = ten sam styl co miasta | ☐ |

**Decyzja:** A5-Roblox-MURY

---

### PT-D3 — D3 v1.1 dyplomacja (silnik)

| # | Scenariusz | ☐ |
|---|------------|---|
| D3-1 | **Sojusz defensywny** sojusznika **ofiary** wchodzi przy ataku gracza | ☐ |
| D3-2 | **Sojusz pełny** sojusznika **agresora** wchodzi przy wojnie | ☐ |
| D3-3 | **Trybut** zerwany (brak ¤) → relacja / casus gdy dotyczy gracza | ☐ |
| D3-4 | **Load save** z legacy `sojusz_wojskowy` → normalizacja | ☐ |

**Decyzja:** MACIEJ-ABC-2026-06-30 (D3 v1.1)

---

## ✅ ZAMKNIĘTE / CZĘŚCIOWE

| ID | Batch | Wynik | Data | md5 era |
|----|-------|-------|------|---------|
| **PT-E2** | E2-PARAMS smoke (Mało vs Dużo gęstość) | ✅ Maciej **`2 OK`** | 2026-07-02 | `01490681…` |
| B2-D16/D17 | łagodny start · woda | ✅ wcześniej | 2026-07-01 | `7edba9ca…` |

---

## Kolejność rekomendowana (po otwarciu §0 rejestru)

```
1. Pełna checklista v1.0 — MACIEJ-PLAYTEST-CHECKLIST §4 (MUST najpierw)
2. PT-F01 + PT-V06 — batchy już w kanonie
3. PT-Z05 · PT-P7 · PT-A5 · PT-D3
4. Eksport → REJESTR-PLAYTESTOW §4
```

---

## Dla Mastera — aktualizacja tego pliku

1. Po **promocji kanonu:** uzupełnij **md5** + dopisz **REJESTR §2** + szczegóły tutaj (⏸ KOLEJKA).  
2. Po **otwarciu §0 (v1.0):** Master ustawia ▶ OTWARTY w rejestrze — dopiero wtedy prosi Macieja.  
3. Po **`playtest OK`** / **`BUG:`:** §3 rejestru · wpis w `REJESTR-DECYZJI.md`.  
4. Jedna linia w `dyspozycje/DZIENNIK-MASTERA.md`: `PLAYTEST: PT-… → OK/BUG`.

---

*Powiązane:* [`MASTER-HANDOFF-INBOX.md`](MASTER-HANDOFF-INBOX.md) · [`MASTER-SESJA-START.md`](MASTER-SESJA-START.md) · [`../obieg/PANEL-MASTER.md`](../obieg/PANEL-MASTER.md)
