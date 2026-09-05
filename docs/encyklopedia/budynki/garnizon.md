# Garnizon

## Metadane

| Pole | Wartość |
|------|---------|
| **id** | `garnizon` |
| **tytuł** | Garnizon |
| **kategoria** | Miasto — budowa |
| **poradnik_ref** | `docs/PORADNIK-GRACZA/45-katalog-budynkow.md` |
| **json_ref** | `buildings.json` |
| **status_v1** | ✅ |

---

## Wiki‑S

**Garnizon** — budynek administracyjny (Administracja), epoka Kamień. **Tylko miasta regionalne** (nie stolica). **Bez wymogu technologii** — dostępny od pierwszej tury. Koszt **60** pkt Pracy + **60** drewna z magazynu, utrzymanie **4** ¤/t i **5** drewna/t. **Maks. 1 poziom.** Stała straż porządkowa: budynek **Prawa**, nie wojska.

---

## Wiki‑M

### Co robi
Garnizon to **stała załoga porządkowa** miasta regionalnego — quasi-policja. Wojsko stacjonujące w mieście jest tymczasowe i przeznaczone do prowadzenia wojen; garnizon zostaje na miejscu i odpowiada za to, żeby prawo obowiązywało również wtedy, gdy armii nie ma w pobliżu.

**Plony na turę: żadne.** Garnizon nie daje Pracy, Pieniądza, Żywności, Nauki ani Kultury i **nie daje szczęścia** — jest formacją porządkową, nie kulturową. Jego jedyną wartością jest **Prawo** miasta.

> **Uwaga o kolejności wersji:** wkład Garnizonu w Prawo wchodzi wraz z przebudową skali Prawa. Dopóki ta zmiana nie jest wydana, Garnizon jest **kosztem bez korzyści** — buduj go dopiero wtedy, gdy Prawo faktycznie liczy się w Twojej wersji gry.

**Poza łańcuchem ulepszeń.** Garnizon niczego nie zastępuje i nie jest przez nic zastępowany — stoi w mieście **obok** Domu Starszyzny, Dworu Zarządcy i Pretorium, i nie znika po ich awansie. Przy podboju miasta zdobywca dziedziczy go jak każdy inny budynek.

### Koszty
- **Budowa:** **60** pkt Pracy (w danych `buildings.json`: 30 — ekran pokazuje wartość po globalnym mnożniku ×2)
- **Z magazynu państwa:** **60** drewna (w danych: 30)
- **Utrzymanie:** **4** ¤/turę (w danych: 2) oraz **5** drewna/turę
- **Technologia:** brak wymogu (budynek startowy)
- **Lokalizacja:** miasto **regionalne** — w stolicy niedostępny
- **Maks. poziom:** 1 (wartość Garnizonu jest stała per epoka; skalowanie idzie tablicą epok, nie poziomem budynku)
- Tempo „Koszty budynków" z kreatora mapy mnoży koszt Pracy dodatkowo: Niski ×1, Normalny ×2, Wysoki ×4.

### Strategia gracza
Garnizon jest **najtańszym budynkiem Prawa dostępnym od startu** poza stolicą — droższy od Domu Starszyzny (kwatery i posterunek kosztują więcej niż izba obrad), ale tańszy od każdego urzędu epoki Brązu. W mieście regionalnym stawiaj go, gdy Prawo zaczyna ograniczać porządek publiczny, a na Dwór Zarządcy jeszcze Cię nie stać.

### Typowe błędy
- Budowa w **stolicy** — Garnizon jest wyłącznie dla miast regionalnych (stolica ma Pałac).
- Mylenie z **Koszarami**: Garnizon nie rekrutuje jednostek, nie daje bonusów bojowych i nie broni miasta w oblężeniu.
- Oczekiwanie plonu na turę — Garnizon nie daje ani ¤, ani Kultury; płacisz utrzymanie za **Prawo**.
- Liczenie na wzrost wartości przez poziomy — budynek ma **1 poziom**.

**Powiązane:** Prawo · Dom Starszyzny · Dwór Zarządcy · Pretorium · Administracja regionalna

---

## Przykład liczbowy

**Scenariusz:** miasto regionalne ma **10 pracy/t** na budynki.

| Etap | Koszt | Czas budowy (~) | Co daje | Utrzymanie |
|------|-------|-----------------|---------|------------|
| Budowa | 60 pkt Pracy + 60 drewna | **6 tur** | Prawo miasta (bez plonów na turę) | 4 ¤/t + 5 drewna/t |
| Poziom 2 | — | — | **nie istnieje** (maks. 1 poziom) | — |

Dla porównania Dom Starszyzny kosztuje 50 pkt Pracy przy utrzymaniu 2 ¤/t, a Dwór Zarządcy (epoka Brąz) 90 pkt Pracy przy 4 ¤/t.

---

## Poradnik‑L

→ `docs/PORADNIK-GRACZA/45-katalog-budynkow.md`

---

## Historia / decyzje

R-BUDYNEK-GARNIZON-NOWY-Q1 (2026-09-05) — nowy budynek. Liczby balansu (koszt 30, przyrost kosztu 6, utrzymanie 2, przyrost utrzymania 1, drewno 30, maks. poziom 1 — wartości `buildings.json`) zatwierdzone przez właściciela bez zmian; zamrożone asercjami w `gra/tools/budynek-garnizon-test.cjs`. Wartość Prawa (25/35/47) wprowadza osobny temat `R-PRAWO-PRZEBUDOWA-SKALI-Q1`.

## Rys historyczny

Straż pilnująca porządku w mieście jest niemal tak stara jak samo miasto — w Mezopotamii i Egipcie oddziały wartownicze strzegły bram, spichlerzy i świątynnych skarbców, a ich obecność bywała warunkiem, by kupiec odważył się zostawić towar na noc. Egipscy Medżaj, początkowo nubijscy zwiadowcy, z czasem przekształcili się w formację pilnującą nekropolii i osad, jedną z pierwszych znanych służb porządkowych oddzielonych od armii polowej. W Atenach porządku na agorze pilnowali scytyjscy łucznicy, publiczni niewolnicy podlegli urzędnikom, a nie dowódcom wojskowym, co miało chronić obywateli przed samowolą uzbrojonych rodaków. Rzym doczekał się cohortes urbanae oraz vigiles — oddziałów, które gasiły pożary, rozdzielały bijatyki i pilnowały nocnych ulic, podlegając prefektowi miasta, nie legionowi. Wspólną cechą tych formacji było to, że stacjonowały na stałe: wojsko odchodziło na wojnę, a garnizon zostawał i odpowiadał za to, żeby prawo obowiązywało również wtedy, gdy armii nie było w pobliżu.
