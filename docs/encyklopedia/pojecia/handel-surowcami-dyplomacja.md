# Handel surowcami (dyplomacja)

## Metadane

| id | `handel-surowcami-dyplomacja` |
| tytuł | Handel surowcami (dyplomacja) |
| kategoria | Dyplomacja |
| poradnik_ref | Część XII (Dyplomacja) |
| json_ref | `econ-params.json` (`handel_surowce`), `game/diplomacy-value-catalog.ts` |

---

## Wiki‑S

W koszyku negocjacji dyplomacji możesz wymieniać surowce **ilościowe** (drewno, kamień, glina, cegła, ceramika, ruda) w **pakietach po 10 sztuk**. Każdy surowiec ma cenę jednostkową w Punktach Negocjacji (PN) — wartość pozycji koszyka = liczba pakietów × 10 × cena jednostkowa.

---

## Wiki‑M

### Jak działa koszyk

Panel negocjacji (`diplomacyTradeBasket.ts`) pozwala dodać pozycję „surowiec (ilość)" — wybierasz surowiec i liczbę **pakietów**; każdy pakiet to **10 sztuk** (`pakiet_wielkosc`, domyślnie 10, strojenie w `econ-params.json` → `handel_surowce`). Gra pokazuje etykietę w stylu „Drewno ×10 (pakiet) × 3 = 30 szt.".

### Cennik jednostkowy (normal, placeholder do strojenia)

| Surowiec | Cena (¤/szt.) |
|----------|---------------|
| Drewno | 2 |
| Kamień | 3 |
| Glina | 2 |
| Cegła | 5 |
| Ceramika | 6 |
| Ruda | 4 |

Wartość PN pozycji = pakiety × **10** × cena jednostkowa. Np. **2 pakiety Cegły** = 20 szt. × 5 ¤/szt. = **100 PN** w koszyku.

### Warunek dostępności

Surowiec można wystawić do handlu dopiero gdy zapas (stock) w skarbcu ≥ **minimalny próg** (domyślnie **2 szt.** na wszystkich poziomach trudności) — 1 sztuka musi zawsze zostać jako „dostęp" (nie sprzedajesz się do zera).

### Handel z miastami-państwami (gracz↔MP i AI↔MP)

Miasta-państwa (Sparta, Kapua, Teby…) **nie mają** osobnego, uproszczonego handlu — korzystają z **dokładnie tego samego** silnika co pełnoprawne cywilizacje, w obu formach:

| Forma | Mechanizm | Różnica przy MP |
|-------|-----------|-------------------|
| **Jednorazowo** | Koszyk negocjacji (ten artykuł, §Wiki-M) w audiencji | Ten sam koszyk, ta sama cena PN — ale próg relacji do otwarcia handlu jest **o 20 pkt trudniejszy** niż z pełną cywilizacją (Część XII §76.5) |
| **Cyklicznie** | Szlak handlowy (Część VIII §53.3) — dochód/turę + dostęp do surowca (brąz/żelazo/koń) | Wymaga tej samej **Umowy Handlowej** i tych samych warunków odległości/portu co z każdą inną nacją — miasto-państwo nie jest wyłączone z żadnego z tych mechanizmów |

**Obie strony inicjują:** dotyczy to zarówno **gracz↔MP** (Ty proponujesz lub akceptujesz ofertę miasta-państwa w audiencji), jak i **AI↔MP** (dowolna cywilizacja AI zawiera Umowę Handlową i wymienia surowce z sąsiednim miastem-państwem tak samo automatycznie, jak robi to AI↔AI — silnik nie ma osobnej gałęzi dla miast-państw jako partnera handlowego, patrz Część VIII §53.3 „AI proponuje… i zawiera ją też AI↔AI"). Praktyczny skutek: nie licz, że sąsiednie miasto-państwo zostanie bez szlaków handlowych tylko dlatego, że nie handlujesz z nim Ty — silniejsza AI obok może je już oplatać siecią tras, zanim zdążysz zaproponować traktat.

**Powiązane:** [[Szlaki handlowe]] · Dyplomacja · Bogactwo · Część XII §75.2, §76.5 (miasta-państwa w liście dyplomatów i progi relacji)

---

## Przykład liczbowy

Chcesz kupić **30 sztuk Rudy** od AI: 3 pakiety × 10 szt. × 4 ¤/szt. = **120 PN** wartości w koszyku — dokładasz ekwiwalent (złoto, inny surowiec, ustępstwo) po drugiej stronie, aż koszyk się zrówna wg progu relacji (`PROG_HANDEL_REL`).

---

## Poradnik‑L

→ `docs/PORADNIK-GRACZA/12-dyplomacja.md`

---

## Historia / decyzje

Decyzja **C-DYP-SUROWCE-Q1=B** (2026-07-23): ceny jednostkowe surowców w koszyku PN, placeholder do strojenia przez właściciela w panelu Excel (`gen-panel-*.py`) — nie wartości finalne. Wielkość pakietu **10** — `handel_surowce.pakiet_wielkosc`. Hasło dodane 2026-07-23 (audyt CIVPEDII) — funkcja świeża, dotąd bez hasła. Dopisano 2026-07-24: sekcja „Handel z miastami-państwami" — silnik (`trade-routes.ts`, `diplomacy-pn-engine.ts`) nie ma osobnej gałęzi dla miast-państw jako partnera handlowego, więc jednorazowy koszyk i cykliczne szlaki handlowe działają z nimi identycznie jak z pełnymi cywilizacjami, tylko z trudniejszym progiem relacji (Część XII §76.5).
