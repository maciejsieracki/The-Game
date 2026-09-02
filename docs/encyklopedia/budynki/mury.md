# Mury

## Metadane

| Pole | Wartość |
|------|---------|
| **id** | `mury` |
| **tytuł** | Mury |
| **kategoria** | Miasto — budowa |
| **poradnik_ref** | `docs/PORADNIK-GRACZA/45-katalog-budynkow.md` |
| **json_ref** | `buildings.json` |
| **status_v1** | ✅ |

---

## Wiki‑S

**Mury** — budynek obronny (Obrona), epoka Brąz. Koszt od **35** pracy + **8× drewno, 16× kamień**, utrzymanie **2** ¤/t. Technologia **Budownictwo**. Maks. **2** poziomy. Daje **+200% Obrony** broniącym się jednostkom (bonus procentowy, nie płaski).

---

## Wiki‑M

### Co robi
Obrona miasta jest **wyłącznie procentowa** — Mury dają **+200% Obrony** jednostkom broniącym miasta (obligacja / bitwa). To **nie** jest płaski bonus „+5 obrony" ani 10 poziomów flat.

**Maks. 2 poziomy** (nie 10). Każdy poziom kosztuje więcej pracy (+**12** od poprzedniego). Po ukończeniu Murów **Palisada drewniana** jest usuwana z miasta (jej +100% nie stackuje się z murami).

**Cytadela** i **Baszta** to **osobne** budynki obok Murów (nie upgrade tego samego slotu) — mogą dokładać kolejne +100% każda (razem z murami do **+400%**).

### Koszty
- **Budowa poz. 1:** 35 pracy + 8× drewno, 16× kamień
- **Poziom 2:** +12 pracy (łącznie 47)
- **Utrzymanie:** 2 ¤/turę (+1 ¤ na poziom 2)
- Technologia **Budownictwo**.

### Strategia gracza
Przed wojną z sąsiadem: **Mury** (lub wcześniej Palisada w Kamieniu) **przed** masową rekrutacją. Oblężenie bez fortyfikacji kończy się szybciej. W Żelazie rozważ **Cytadelę** i **Basztę** obok murów — każda dokłada +100%.

### Typowe błędy
- Szukanie „+5 obrony" w panelu — liczy się **% Obrony**, nie płaski bonus.
- Myślenie, że Cytadela **zastępuje** Mury — oba stoją obok siebie (Cytadela wymaga Murów w tym mieście).
- Ignorowanie utrzymania przy kilku miastach obronnych.

**Powiązane:** Palisada drewniana · Cytadela · Baszta · Obrona miasta

---

## Przykład liczbowy

**Scenariusz:** miasto ma **10 pracy/t** na budynki.

| Etap | Koszt pracy | Czas (~) | Efekt obronny |
|------|-------------|----------|---------------|
| Poziom 1 | 35 | **4 tur** | **+200% Obrony** |
| Poziom 2 | 47 | **5 tur** | nadal +200% (poziom nie zwiększa % — tylko koszt/utrzymanie w danych) |

Jednostka z **50** pkt Obrony na murze z Mury → efektywnie **150** pkt (×3) w obronie miasta.

---

## Poradnik‑L

→ `docs/PORADNIK-GRACZA/45-katalog-budynkow.md`

---

## Historia / decyzje

rev. G2 2026-08-04 — model procentowy (+200%), max 2 poz., Cytadela/Baszta obok (nie upgrade).

## Rys historyczny

Mury obronne z kamienia lub cegły zastępowały drewniane palisady tam, gdzie osada rosła na tyle, by uzasadnić kosztowną, lecz znacznie trwalszą inwestycję w kamienną fortyfikację. Legendarne mury Babilonu, opisywane przez greckich historyków jako jeden z cudów świata, czy potężne mury Konstantynopola, które przez tysiąc lat odpierały najeźdźców, pokazują, jak decydującą rolę odgrywały fortyfikacje miejskie w przetrwaniu cywilizacji. Budowa takich murów angażowała tysiące robotników przez lata, a ich grubość i wysokość musiały nadążać za rozwojem technik oblężniczych — od taranów i wież oblężniczych po katapulty i machiny miotające kamienie. Miasta otoczone solidnymi murami mogły wytrzymać długotrwałe oblężenia, gromadząc zapasy żywności i wody, podczas gdy wróg tracił czas, zasoby i morale pod ich murami. Upadek wielu murów obronnych w erze prochu strzelniczego, gdy artyleria zaczęła kruszyć nawet najgrubsze kamienne bastiony, symbolicznie zamknął epokę, w której wysokie mury gwarantowały bezpieczeństwo miasta.
