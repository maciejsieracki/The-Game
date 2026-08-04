# Pretorium

## Metadane

| Pole | Wartość |
|------|---------|
| **id** | `pretorium` |
| **tytuł** | Pretorium |
| **kategoria** | Miasto — budowa |
| **poradnik_ref** | `docs/PORADNIK-GRACZA/45-katalog-budynkow.md` |
| **json_ref** | `buildings.json` |
| **status_v1** | ✅ |

---

## Wiki‑S

**Pretorium** — budynek administracyjny (Administracja), epoka Żelazo. **Tylko miasta regionalne** (nie stolica). Upgrade **Dworu Zarządcy**. Koszt **75** pracy + surowce, utrzymanie **3** ¤/t. Technologia **Prawo**. **Maks. 1 poziom.** **Prawo, Pieniądz, Kultura, Praca** — **bez** bonusu obrony i bez mnożnika podatkowego.

---

## Wiki‑M

### Co robi
Pretorium to **koniec łańcucha administracji** w mieście regionalnym (zastępuje Dwór Zarządcy, jak Pałac III w stolicy).

**Przyrost (poz. 1):**
- **+2 Pracy/t**
- **+3 Pieniądza/t**
- **+5 Kultury/t**

**Główne źródło Prawa** miasta regionalnego (`prawo_pretorium`). Garnizon liczy się do Prawa osobno — Pretorium **nie** daje mu dodatkowego bonusu.

**Brak efektu obronnego** — pole `obrona` w danych = 0; dawny „+2 obrony" i „mnożnik podatkowy" były martwe i nie działają w silniku.

### Koszty
- **Budowa:** 75 pracy + 8× drewno, 10× cegła
- **Utrzymanie:** 3 ¤/turę
- Technologia **Prawo**
- **Lokalizacja:** miasto **regionalne** (poza stolicą)
- **Wymaganie:** upgrade **Dworu Zarządcy**

### Strategia gracza
Po podboju lub rozrostie miasta regionalnego: Pretorium podnosi **Prawo** i stabilizuje prowincję. Buduj **przed** progiem zagęszczenia lub po integracji obcego miasta.

### Typowe błędy
- Budowa w **stolicy** — Pretorium jest tylko dla regionalnych.
- Oczekiwanie bonusu obrony lub % podatków — liczy się **Prawo + ¤ + Kultura**.

**Powiązane:** Dwór Zarządcy · Prawo · Administracja regionalna

---

## Przykład liczbowy

| Statystyka | Pretorium poz. 1 |
|------------|------------------|
| Praca/t | +2 |
| Pieniądz/t | +3 |
| Kultura/t | +5 |
| Obrona | **brak** |

Koszt **75** pracy przy 10/t ≈ **8 tur**.

---

## Poradnik‑L

→ `docs/PORADNIK-GRACZA/45-katalog-budynkow.md`

---

## Historia / decyzje

rev. G2 2026-08-04 — usunięto fałszywą obronę i mnożnik podatkowy; Prawo regionalne.
