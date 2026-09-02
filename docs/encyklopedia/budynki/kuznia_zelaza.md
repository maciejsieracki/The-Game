# Kuźnia żelaza

## Metadane

| Pole | Wartość |
|------|---------|
| **id** | `kuznia_zelaza` |
| **tytuł** | Kuźnia żelaza |
| **kategoria** | Miasto — budowa |
| **poradnik_ref** | `docs/PORADNIK-GRACZA/45-katalog-budynkow.md` |
| **json_ref** | `buildings.json` |
| **status_v1** | ✅ |

---

## Wiki‑S

**Kuźnia żelaza** — budynek (Produkcja+Wojsko), epoka Żelazo. **Upgrade Kuźni brązu** (zastępuje ją w mieście). Koszt **60** pracy, utrzymanie **3** ¤/t. Technologia **Hutnictwo żelaza**. **Maks. 1 poziom.** **+8 Pracy/t**, **+2 Pieniądza/t**, **+15% Pancerza** (ścieżka A) po wizycie w mieście.

---

## Wiki‑M

### Co robi
Kuźnia żelaza **zastępuje** Kuźnię brązu w tym samym mieście (`upgradeFrom: kuznia`).

1. **Ekonomia:** **+8 Pracy/t**, **+2 Pieniądza/t**
2. **Ścieżka A — Pancerz:** **+15% Pancerza** dla jednostek, które **odwiedziły** miasto (kumuluje z poprzednim tierem łańcucha kuźni, max **+45%** gdy dostępna Wielka Kuźnia w przyszłej epoce)

**Maks. 1 poziom** — nie ma 10 poziomów ani bonusu „siły przy produkcji".

### Koszty
- **Budowa:** 60 pracy + 8× drewno, 10× cegła
- **Utrzymanie:** 3 ¤/turę
- Technologia **Hutnictwo żelaza**
- **Wymaganie:** upgrade Kuźni brązu + dostęp do **Żelaza** w imperium

### Strategia gracza
Awansuj kuźnię w mieście produkcyjnym wojska, zanim zaczniesz masową produkcję jednostek żelaznych. Przepuść armie przez miasto po ukończeniu.

### Typowe błędy
- Budowa bez Kuźni brązu w mieście — to upgrade, nie osobny slot obok.
- Brak żelaza w imperium — karta zablokowana.

**Powiązane:** Kuźnia brązu · Pancerz · Łańcuch kuźni

---

## Przykład liczbowy

| Etap | Koszt | Przyrost miasta | Pancerz (ścieżka A) |
|------|-------|-----------------|---------------------|
| Kuźnia brązu | 30 pracy | +6 Pracy, +1 ¤ | +15% |
| → Kuźnia żelaza | 60 pracy | +8 Pracy, +2 ¤ | +15% (tier żelaza) |

Koszt upgrade **60** pracy przy **10**/t ≈ **6 tur**.

---

## Poradnik‑L

→ `docs/PORADNIK-GRACZA/45-katalog-budynkow.md`

---

## Historia / decyzje

rev. G2 2026-08-04 — upgrade z Kuźni brązu, ścieżka A Pancerz po wizycie.

## Rys historyczny

Kuźnia żelaza to warsztat kowalski wyspecjalizowany w obróbce żelaza na potrzeby wojska — metalu, który wraz z upowszechnieniem technik hutniczych zaczął wypierać brąz jako podstawowy surowiec na broń i uzbrojenie ochronne. W przeciwieństwie do brązu żelazo wymagało znacznie wyższych temperatur wytopu, lecz było surowcem szerzej dostępnym geograficznie, co uniezależniało kowali od dalekosiężnego handlu cyną i miedzią charakterystycznego dla wcześniejszych epok. Kowale-zbrojmistrzy pracujący przy takich kuźniach musieli opanować sztukę nawęglania i hartowania żelaza, by uzyskać ostrza wystarczająco twarde do przecinania zbroi przeciwnika, jednocześnie zachowując elastyczność zapobiegającą pękaniu w walce. Celtyckie i germańskie plemiona słynęły z wysokiej jakości mieczy żelaznych, budząc respekt nawet wśród zorganizowanych legionów rzymskich, które musiały dostosować własne uzbrojenie do tej konkurencji. Rozprzestrzenienie się kuźni żelaza po Europie i Azji w I tysiącleciu p.n.e. zdemokratyzowało dostęp do solidnego oręża, zmieniając trwale charakter wojen prowadzonych przez ówczesne ludy.
