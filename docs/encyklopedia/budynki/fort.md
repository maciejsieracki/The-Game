# Fort (Cytadela)

## Metadane

| Pole | Wartość |
|------|---------|
| **id** | `fort` |
| **tytuł** | Fort (Cytadela) |
| **kategoria** | Miasto — budowa |
| **poradnik_ref** | `docs/PORADNIK-GRACZA/45-katalog-budynkow.md` |
| **json_ref** | `buildings.json` |
| **status_v1** | ✅ |

---

## Wiki‑S

**Cytadela** (w danych `id: fort`) — budynek obronny (Obrona), epoka Żelazo. **Niezależny** obok Murów (nie zastępuje ich). Koszt **70** pracy + **10× drewno, 20× kamień**, utrzymanie **3** ¤/t. Technologia **Inżynieria**. Wymaga **Murów w tym mieście**. Daje **+100% Obrony** dodatkowo (razem z murami **+300%**).

---

## Wiki‑M

### Co robi
**Cytadela** to **osobny budynek obronny** obok kamiennych **Murów** — **nie** upgrade tego samego slotu i **nie** zastępuje murów. Oba mogą stać w mieście jednocześnie.

Obrona miasta jest **wyłącznie procentowa**:
- **Mury:** +200% Obrony
- **Cytadela:** +100% **dodatkowo** (z murami = **+300%**)
- **Baszta:** +100% **dodatkowo** (komplet trzech = **+400%**)

To **nie** są płaskie „+15 obrony" ani 10 poziomów. **Maks. 1 poziom** Cytadeli.

**Uwaga:** Osobny **Fort terenowy** na mapie (ulepszenie heksu) to inny obiekt — bonus dla obozujących jednostek w polu, nie budynek miasta.

### Koszty
- **Budowa:** 70 pracy + 10× drewno, 20× kamień
- **Utrzymanie:** 3 ¤/turę
- Technologia **Inżynieria**
- **Wymaganie:** wybudowane **Mury w tym samym mieście** (kolejność budowy; Cytadela nie zastępuje Murów w liście budynków)

### Strategia gracza
Miasto graniczne w epoce Żelaza: najpierw **Mury**, potem **Cytadela** (i opcjonalnie **Baszta**) przed oczekiwanym oblężeniem.

### Typowe błędy
- Budowa Cytadeli **bez** Murów w tym mieście — karta nie wejdzie do kolejki.
- Mylenie z **Fortem terenowym** na mapie.
- Szukanie płaskiego bonusu obrony zamiast **% Obrony**.

**Powiązane:** Mury · Baszta · Obrona miasta · Fort terenowy (mapa)

---

## Przykład liczbowy

**Scenariusz:** miasto z **Murami** i **Cytadelą**, jednostka **50** pkt Obrony na murze.

| Budynki obronne | Łączny bonus | Efektywna Obrona |
|-----------------|--------------|------------------|
| Tylko Mury | +200% | **150** |
| Mury + Cytadela | +300% | **200** |
| Mury + Cytadela + Baszta | +400% | **250** |

Koszt **70** pracy przy **10**/t ≈ **7 tur** budowy (bez surowców).

---

## Poradnik‑L

→ `docs/PORADNIK-GRACZA/45-katalog-budynkow.md`

---

## Historia / decyzje

rev. G2 2026-08-04 — niezależny budynek obok Murów, obrona % (+100% dodatkowo).
