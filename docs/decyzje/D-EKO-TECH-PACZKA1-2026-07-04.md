# Decyzje Macieja — Paczka 1/3 (miasto · ekonomia · technologia)

> **Data:** 2026-07-04 · **Status:** 🟡 ZAPISANA  
> **Źródło:** formularz + cytaty Macieja (sesja MASTER, po utracie wcześniejszej odpowiedzi)

---

## T-TECH-4 — Tarasy Inków

**Decyzja:** **Wariant własny** (blisko A, nie C)

**Cytat Macieja:** „Tarasy powinny mieć możliwość budowania po odnalezieniu **Rolnictwa**."

**Kanon:**
- Badanie **Rolnictwo** odblokowuje ulepszenie terenu **Tarasy** (dla Inków / zgodnie z regułą cywilizacji).
- Nie zostają wyłącznie na „epoka + cywilizacja" bez tech.

---

## T-TECH-5 — Irygacja / Plantacja

**Decyzja:** **Wariant własny** (blisko B)

**Cytat Macieja:** „Powinno wystarczyć tylko **Gospodarka wodna** bez Matematyki."

**Kanon:**
- **Irygacja** wymaga wyłącznie **Gospodarki wodnej** — alias przez Matematykę **usunąć**.
- Plantacja — bez zmiany w tej paczce (do doprecyzowania w paczce 2 jeśli potrzeba).

---

## T-TECH-6 — Mennica i Akwedukt

**Decyzja:** **A** — dodać budynki teraz (v1.0)

---

## T-TECH-7 — Wymagany budynek przy badaniu

**Decyzja:** **A** — twarda bramka (bez budynku nie badasz)

---

## T-TECH-8 — Religia vs Mistycyzm

**Decyzja:** **Wariant własny** — model **upgrade** (zgodny z zasadą upgrade budynków)

**Cytat Macieja:** „Kręgi są **upgrade'owane** do świątyni, zachowując stare bonusy i dokładając nowe. Do ustalenia: jak to pokazać w polu wybudowanych budynków."

**Kanon:**
- **Mistycyzm** → budujesz **Kamienne kręgi** (pierwszy poziom).
- **Religia** → **upgrade** kręgów → **Świątynia** (nie drugi slot): bonusy = **suma** kręgów + świątyni.
- UI: w liście zbudowanych pokazujemy **Świątynię** (id po upgrade), tooltip z sumą bonusów — szczegóły prezentacji → **ABC-UI-KULT** lub paczka 2.

---

## T-TECH-9 — Drogi brukowane

**Decyzja:** **A** — teraz: tech „Drogi brukowane" + ulepszenie **Droga brukowana** na mapie (+2 ruch, upgrade z Drogi)

---

## ABC-6 — Nazwa garncarni

**Decyzja:** **A** — **Garncarnia**

---

## ABC-7 — Budynek produkcji brązu

**Decyzja:** **Wariant własny** (nie A Piec hutniczy)

**Cytat Macieja:** „**Odlewnia brązu**, później upgrade w **odlewnię żelaza**."

**Kanon:**
- Epoka Brąz: budynek **Odlewnia brązu** (stop ruda+paliwo→brąz).
- Późniejszy upgrade (Obróbka żelaza / Hutnictwo żelaza): **Odlewnia brązu → Odlewnia żelaza** (suma bonusów).
- **Kuźnia** osobno = bonus wojskowy (bez merge z odlewnią).

---

## ABC-8 — Pismo — prereq

**Decyzja:** **A** — wymaga **Cegielni** (twardo, bez LUB Garncarnia)

---

## ABC-9 — Mielerz

**Decyzja:** **A** — **Obróbka drewna** (razem ze Stolarnią)

---

## Otwarte z tej paczki (follow-up)

| ID | Temat |
|----|--------|
| T-TECH-8-UI | Jak pokazać upgrade kręgi→świątynia w panelu „Zbudowane" |
| ABC-7-chain | Parametry Odlewnia brązu → Odlewnia żelaza (stats, tech gate) |
| **UPGRADE-BUDYNKI** | **Cały temat odłożony** → `docs/decyzje/ODLOZONE-UPGRADE-BUDYNKOW-2026-07-04.md` (plan budowy, wybudowane, bonusy, ABC-20…24) |

---

## Handoff (po „wdrażaj")

- **CYWILIZACJE/DANE:** tech.json (T-TECH-4,5,9), buildings.json (Mennica, Akwedukt, kręgi, odlewnie)
- **EKONOMIA:** upgradeFrom + suma bonusów, canResearch bramka T-TECH-7/8
- **MAPA:** droga brukowana
- **UI:** prezentacja upgrade kultu (T-TECH-8-UI)
