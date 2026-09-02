# Baszta

## Metadane

| Pole | Wartość |
|------|---------|
| **id** | `baszta` |
| **tytuł** | Baszta |
| **kategoria** | Miasto — budowa |
| **poradnik_ref** | `docs/PORADNIK-GRACZA/45-katalog-budynkow.md` |
| **json_ref** | `buildings.json` |
| **status_v1** | ✅ |

---

## Wiki‑S

**Baszta** — trzeci budynek obronny miasta (Obrona), epoka Żelazo. **Niezależna** obok Murów i Cytadeli (nie zastępuje żadnego). Koszt **70** pracy + **10× drewno, 20× kamień**, utrzymanie **3** ¤/t. Technologia **Inżynieria**. Wymaga **Murów w tym mieście**. Daje **+100% Obrony** dodatkowo (komplet Mury+Cytadela+Baszta = **+400%**). Budowalna w **stolicy i regionach**.

---

## Wiki‑M

### Co robi
**Baszta** to **trzeci, niezależny budynek obronny** — stoi obok **Murów** i **Cytadeli** (awans „w bok", nie zastępuje poprzedników).

Obrona miasta jest **wyłącznie procentowa**:
- **Mury:** +200% Obrony
- **Cytadela:** +100% dodatkowo
- **Baszta:** +100% **dodatkowo** (komplet trzech = **+400%**)

**Maks. 1 poziom.** Baszta sama (bez Murów) daje tylko własne +100% — nie aktywuje bazy muru (+200%).

### Koszty
- **Budowa:** 70 pracy + 10× drewno, 20× kamień (budowla obronna epoki Żelaza — kamień, nie cegła)
- **Utrzymanie:** 3 ¤/turę
- Technologia **Inżynieria**
- **Wymaganie:** wybudowane **Mury w tym samym mieście** (kolejność budowy; DECYZJA 54a)

### Strategia gracza
Po **Murach** i opcjonalnie **Cytadeli** — Baszta przed spodziewanym oblężeniem w epoce Żelaza. Działa tak samo w stolicy i miastach regionalnych.

### Typowe błędy
- Budowa Baszty **bez** Murów w tym mieście — karta nie wejdzie do kolejki.
- Mylenie z **Fortem terenowym** na mapie (inny byt).
- Oczekiwanie, że Baszta **zastąpi** Mury lub Cytadelę.

**Powiązane:** Mury · Cytadela (fort) · Obrona miasta · Fort terenowy (mapa)

---

## Przykład liczbowy

**Scenariusz:** miasto z **Murami**, **Cytadelą** i **Basztą**, jednostka **50** pkt Obrony na murze.

| Budynki obronne | Łączny bonus | Efektywna Obrona |
|-----------------|--------------|------------------|
| Tylko Baszta | +100% | **100** |
| Mury + Cytadela + Baszta | +400% | **250** |

---

## Poradnik‑L

→ `docs/PORADNIK-GRACZA/45-katalog-budynkow.md` (sekcja Mury / Cytadela)

---

## Historia / decyzje

Decyzja 41B (Maciej 2026-07-25) — nazwa **Baszta** zatwierdzona; +100% Obrony obok Murów (+200%) i Cytadeli (+100%). Wdrożenie: `buildings.json`, `miasto-params.json`, `city-defense.ts`, `building-resource-gate.ts` (prereq Mury).

## Rys historyczny

Baszta to wysunięta wieża obronna wbudowana w linię murów miejskich, pozwalająca obrońcom razić nieprzyjaciela ogniem bocznym wzdłuż całej kurtyny muru, a nie tylko wprost przed sobą. Średniowieczne miasta europejskie otaczały się wieńcami baszt rozmieszczonych w regularnych odstępach, każda zdolna do niezależnej obrony nawet po przełamaniu sąsiednich odcinków muru. Wewnątrz baszt często mieściły się cechy rzemieślnicze odpowiedzialne za ich utrzymanie i obronę w razie ataku, co widać do dziś w nazwach zachowanych wież, takich jak baszta krawiecka czy baszta rzeźnicza. Strzelnice, dostosowane najpierw do łuków, a później do broni palnej, ewoluowały wraz z rozwojem uzbrojenia oblężniczego. Wraz z upowszechnieniem artylerii prochowej wysokie, wąskie baszty straciły przewagę na rzecz niższych, grubszych bastionów zdolnych wchłonąć uderzenie kul armatnich.
