# Targowisko (Rynek)

## Metadane

| Pole | Wartość |
|------|---------|
| **id** | `targowisko` |
| **tytuł** | Targowisko (Rynek) |
| **kategoria** | Miasto — budowa |
| **poradnik_ref** | `docs/PORADNIK-GRACZA/45-katalog-budynkow.md` |
| **json_ref** | `buildings.json` |
| **status_v1** | ✅ |

---

## Wiki‑S

**Targowisko (Rynek)** — budynek (Pieniądz), epoka Kamień. Koszt od **25** pracy, utrzymanie **1** ¤/t. Technologia **Wymiana**. **Maks. 3 poziomy** (nazwy: Targowisko → Rynek → Giełda). Daje **Pieniądz na turę** — **nie** mnożnik handlu ani Daniny.

---

## Wiki‑M

### Co robi
Targowisko generuje **Pieniądz (¤) na turę** w mieście:

| Poziom | Pieniądz/t |
|--------|------------|
| 1 (Targowisko) | **+5** |
| 2 (Rynek) | **+8** (+3) |
| 3 (Giełda) | **+11** (+3) |

**Brak mnożnika %** — dawny wpis „mnożnik handlu/Daniny" nie był czytany przez silnik i został usunięty z efektu (naprawa 2026-07-26). Planuj ekonomię po **stałym przyroście ¤**, nie po procencie handlu.

### Koszty
- **Budowa poz. 1:** 25 pracy + 6× drewno
- **Każdy kolejny poziom:** +10 pracy
- **Utrzymanie:** 1 ¤/turę (+1 ¤ na wyższych poziomach w danych)
- Technologia **Wymiana**

### Strategia gracza
Wczesne miasto: Targowisko finansuje utrzymanie wojska i rush budowy. Awansuj do Rynek/Giełda, gdy masz nadwyżkę pracy — netto **+4/+7/+10 ¤** po utrzymaniu na poz. 1–3.

### Typowe błędy
- Szukanie „% handlu" lub „mnożnika Daniny" — efekt to **tylko ¤/turę**.
- Porównywanie z Portem — Port to handel morski, Targowisko to lokalny przychód miejski.

**Powiązane:** Pieniądz · Danina miasta · Port handlowy

---

## Przykład liczbowy

**Scenariusz:** Targowisko poz. 1, utrzymanie 1 ¤/t.

- Przyrost: **+5 ¤/t** → netto **+4 ¤/t**
- Koszt 25 pracy przy 10/t ≈ **3 tur** — zwrot z netto po ~**7 turach**

---

## Poradnik‑L

→ `docs/PORADNIK-GRACZA/45-katalog-budynkow.md`

---

## Historia / decyzje

rev. G2 2026-08-04 — efekt = pieniadz baza/przyrost, bez martwego mnożnika.

## Rys historyczny

Targowisko to serce gospodarcze każdej dawnej osady — otwarty plac lub ulica, gdzie kupcy, rzemieślnicy i rolnicy spotykali się, by wymieniać towary jeszcze zanim powstał pieniądz w dzisiejszej postaci. Od starożytnych agor greckich, przez rzymskie fora, po średniowieczne rynki miast europejskich, targowisko pełniło funkcję nie tylko handlową, lecz i społeczną — tu ogłaszano ważne wieści, rozstrzygano spory, a czasem wymierzano publiczną sprawiedliwość. Regularne dni targowe, często wyznaczane co tydzień, przyciągały handlarzy z okolicznych wsi i dalekich krajów, czyniąc miasto węzłem wymiany dóbr i informacji. Wraz z rozwojem handlu targowiska ewoluowały w stałe hale targowe i giełdy, a wokół nich powstawały banki i domy kupieckie. Tętniący życiem rynek miejski był zwykle najlepszym wskaźnikiem dobrobytu i witalności całego miasta.
