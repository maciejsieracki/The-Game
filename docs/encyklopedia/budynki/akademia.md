# Akademia

## Metadane

| Pole | Wartość |
|------|---------|
| **id** | `akademia` |
| **tytuł** | Akademia |
| **kategoria** | Miasto — budowa |
| **poradnik_ref** | `docs/PORADNIK-GRACZA/45-katalog-budynkow.md` |
| **json_ref** | `buildings.json` |
| **status_v1** | ✅ |

---

## Wiki‑S

**Akademia** — budynek (Nauka), epoka Żelazo. Koszt **70** pracy + **8× drewno, 14× cegła**, utrzymanie **3** ¤/t. Technologia **Filozofia**. **Maks. 1 poziom.** **Niezależna** obok Biblioteki. Daje **Naukę, Kulturę i Zadowolenie** w mieście — **nie** globalny mnożnik nauki.

---

## Wiki‑M

### Co robi
Akademia to **osobny budynek** obok **Biblioteki** (nie zastępuje jej, nie merge w 1 slot). Wkład rozdzielony, żeby Biblioteka nie liczyła się podwójnie.

**Przyrost w mieście (poz. 1):**
- **+6 Nauki/t**
- **+5 Kultury/t**
- **+3 Zadowolenia** (pkt)

Efekt to **lokalna produkcja miasta** na suwakach Daniny — **nie** „mnożnik globalnej puli nauki". Teatr jest w danych ukryty z produkcji i wliczony w Akademię (merge bez zmiany slotu).

### Koszty
- **Budowa:** 70 pracy + 8× drewno, 14× cegła
- **Utrzymanie:** 3 ¤/turę
- Technologia **Filozofia**
- **Wymaganie:** wybudowana **Biblioteka w tym mieście**

### Strategia gracza
Miasto naukowe: Biblioteka → Akademia, suwak Daniny więcej na **naukę (20%)**, suwak pracy **70% budynki**.

### Typowe błędy
- Budowa bez Biblioteki w mieście.
- Oczekiwanie globalnego ×% nauki imperium — liczy się **Nauka/t w tym mieście**.

**Powiązane:** Biblioteka · Nauka · Kultura

---

## Przykład liczbowy

| Budynek | Nauka/t | Kultura/t |
|---------|---------|-----------|
| Biblioteka (poz. 1) | +3 | +1 |
| + Akademia | +6 | +5 |
| **Razem w mieście** | **+9** | **+6** |

Koszt Akademii **70** pracy przy 10/t ≈ **7 tur**.

---

## Poradnik‑L

→ `docs/PORADNIK-GRACZA/45-katalog-budynkow.md`

---

## Historia / decyzje

rev. G2 2026-08-04 — Nauka/Kultura lokalnie, niezależny obok Biblioteki.
