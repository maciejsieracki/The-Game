# MACIEJ — KARTA DECYZJI

> **Twoja lista decyzji gameplay.** Wybierz literę A/B/C dla każdej i wpisz datę.
> Prosty język, bez żargonu. Rekomendacja MASTERa to sugestia — decydujesz Ty.
> Gdy skończysz, napisz w czacie: „D1=_, D2=_, …" → MASTER rusza sprint.
> Pełny kontekst każdej decyzji: `docs/CURSOR-MASTER-PLAN-DOKONCZENIA.md` §8.

**Stan:** 9 decyzji P0/P1 + 6 dodatkowych = 15 do rozstrzygnięcia.
**Ostatnia aktualizacja:** 2026-06-26.

---

## Jak tego używać

1. Przeczytaj kontekst każdej decyzji (1-2 zdania).
2. Wybierz **A**, **B** lub **C** (lub napisz własną, jeśli żadna nie pasuje).
3. Wpisz literę + datę w kolumnie „Twoja decyzja".
4. Gdy rozstrzygniesz P0 (D1-D5), napisz w czacie → MASTER startuje Sprint 1.
5. Pozostałe (D6-D15) możesz rozstrzygać w miarę potrzeby (nie wszystkie blokują v1.0).

**Legenda priorytetów:** P0 = blokuje grywalność (rozstrzygnij najpierw) · P1 = wysoki · P2 = średni.

---

## Decyzje P0 — rozstrzygnij najpierw (odblokowują ~40% pracy)

### D1 — Widok główny / HUD (P0)
**Pytanie:** Jak ma wyglądać pasek na ekranie gry (zasoby, tura, minimapa)?
- **A:** Zostaw obecny prosty pasek (najszybciej).
- **B:** Nowy pasek od zera (pełny projekt).
- **C:** Obecny + doklejona minimapa i panel boczny (kompromis). ← rekomendacja MASTERa
- **Wpływ:** Jak szybko gra dostanie czytelny interfejs. C = szybko i pełno.
- **Twoja decyzja:** ______  **Data:** ______

### D2 — Plaster EKONOMIA+UI „idz" (P0)
**Pytanie:** Gotowa paczka poprawek ekonomii miasta czeka na wpiecie. Wpinamy teraz?
- **A:** Tak, wpinaj teraz. ← rekomendacja MASTERa
- **B:** Czekaj na decyzję Wealth.
- **C:** Wpiąć częściowo.
- **Wpływ:** Czy ekonomia miasta działa pełniej już w Sprint 1.
- **Twoja decyzja:** ______  **Data:** ______

### D3 — Wealth (bogactwo) w v1.0 (P0)
**Pytanie:** Ile zasobu „Wealth" (obok Pieniądza) w wersji 1.0?
- **A:** Pełny model (duży epik).
- **B:** Odłóż po v1.0 (gra grywalna bez niego).
- **C:** Minimalny (pula + 1 sposób zarabiania + 1 wydawania). ← rekomendacja MASTERa
- **Wpływ:** Głębokość ekonomii vs czas. C = balans.
- **Twoja decyzja:** ______  **Data:** ______

### D4 — Ulepszenia terenu + posterunki (P0)
**Pytanie:** Gracz buduje na mapie drogi/irygację/posterunki/forty. Akceptujesz listę i wartości?
- **A:** Tak, akceptuję obecną listę. ← rekomendacja MASTERa
- **B:** Pokaż mi Excel z wartościami do przeglądu.
- **C:** Skrócona lista na v1.0 (4 najważniejsze).
- **Wpływ:** Czy budowanie na mapie działa w Sprint 1.
- **Twoja decyzja:** ______  **Data:** ______

### D5 — UX bitwy Q2-Q7 (P0)
**Pytanie:** Detale interfejsu bitwy (minimapa w bitwie, tooltip, ekran przed-bitwą, styl, sterowanie). Kto proponuje odpowiedzi?
- **A:** Ja odpowiadam każde po kolei.
- **B:** UI proponuje domyślne (wzór Total War: Pharaoh), ja zatwierdzam. ← rekomendacja MASTERa
- **C:** Tylko minimum na v1.0, reszta po v1.0.
- **Wpływ:** Najszybsza ścieżka do grywalnej bitwy manualnej.
- **Twoja decyzja:** ______  **Data:** ______

---

## Decyzje P1 — rozstrzygnij przed Fazą C/D

### D6 — Zaokrętowanie (wchodzenie na statek) (P1)
**Pytanie:** Mechanika wchodzenia jednostek na statek po wynalezieniu Żeglarstwa.
- **A:** Zostaw robocze rozwiązanie, dopieć po v1.0. ← rekomendacja MASTERa
- **B:** Zdecydować teraz.
- **C:** Usunąć z v1.0 (statki = tylko transport).
- **Wpływ:** Nie blokuje v1.0 (ruch lądowy działa bez tego).
- **Twoja decyzja:** ______  **Data:** ______

### D7 — Pełny panel armii (Total War) (P2)
**Pytanie:** Zaawansowany panel armii (przeciąganie kart jednostek, scalanie rannych). Dziś jest proste okno „połącz/nie połącz".
- **A:** Zrób mockup, akceptuję, implementuj.
- **B:** Pomiń na v1.0 (okno połącz-armie wystarcza), pełny panel po v1.0. ← rekomendacja MASTERa
- **C:** Tylko scalanie rannych na v1.0.
- **Wpływ:** Czas vs funkcjonalność. B = szybciej do v1.0.
- **Twoja decyzja:** ______  **Data:** ______

### D8 — Posiłki w bitwie (P1)
**Pytanie:** Czy sąsiednie armie (do 1 heksa) dołączają do bitwy? (Już rozstrzygnięte wcześniej B.)
- **A:** Potwierdzam B (1 heks sąsiedztwa). ← rekomendacja MASTERa
- **B:** Tylko ten sam heks (0 sąsiedztwa).
- **C:** 2 heksy sąsiedztwa.
- **Wpływ:** Rozmiar bitew zbiorowych. Kontrakt UNITS już gotowy dla A.
- **Twoja decyzja:** ______  **Data:** ______

### D10 — Katapulta: która epoka? (P1) — KONFLIKT
**Pytanie:** UNITS i Ty mówicie Katapulta=Żelazo; dziennik MASTERa mówi Średniowiecze. Rozstrzygnij.
- **A:** Katapulta=Żelazo (spójne z Taran=Kamień, Wieża=Brąz). ← rekomendacja MASTERa
- **B:** Katapulta=Średniowiecze (po v1.0, z Lazaretem).
- **C:** Dwie katapulty: lekka=Żelazo, ciężka=Średniowiecze.
- **Wpływ:** Które machiny oblężnicze w v1.0.
- **Twoja decyzja:** ______  **Data:** ______

### D11 — Drzewko technologii układ (P1)
**Pytanie:** UI zrobiło makieta drzewka bez przecięć linii. Akceptujesz układ przed portem do gry?
- **A:** Akceptuję układ, portuj do gry. ← rekomendacja MASTERa
- **B:** Chcę poprawki.
- **C:** Zostaw obecny picker na v1.0.
- **Wpływ:** Czytelność drzewka tech w grze. Zobacz `Makieta-drzewko-uklad-bez-przeciec.html`.
- **Twoja decyzja:** ______  **Data:** ______

### D12 — Miasta BRAZU — podgląd 4 nacji (P1)
**Pytanie:** MAPA ma modele miast BRAZU dla 4 nacji (Sumer/Egipt/Inkowie/Zulusi). Chcesz zobaczyć podgląd przed wpieciem?
- **A:** Pokaż podgląd, akceptuję, wpnij. ← rekomendacja MASTERa
- **B:** Tylko nazwy miast na mapie (bez modeli BRAZU).
- **C:** Wszystkie 9 nacji modele BRAZU (większy epik).
- **Wpływ:** Różnorodność wizualna miast. Nazwy miast = TAK (już zdecydowane 8B).
- **Twoja decyzja:** ______  **Data:** ______

### D13 — Defaulty startu gry (P1)
**Pytanie:** Gdy gracz nie wybierze cywilizacji/trudności/tempa/epoki w menu — jakie defaulty?
- **A:** MASTER proponuje rozsądne defaulty (np. Rzym/Normal/Normal/Kamień), ja zatwierdzam. ← rekomendacja MASTERa
- **B:** Brak defaultów — gracz musi wybrać wszystko.
- **C:** Tylko epoka=Kamień, reszta bez defaultu.
- **Wpływ:** UX nowej gry (czy gracz może szybko START).
- **Twoja decyzja:** ______  **Data:** ______

### D15 — Minimapa wariant (P1)
**Pytanie:** Minimapa w HUD: MAPA renderuje obrazek (A) czy UI rysuje siatkę z danych (B)?
- **A:** MAPA renderuje (cięższe — duplikacja sceny).
- **B:** UI rysuje siatkę z danych od MAPY (lżejsze). ← rekomendacja MASTERa
- **C:** Bez minimapy na v1.0.
- **Wpływ:** Wydajność + prostota. B = lżej.
- **Twoja decyzja:** ______  **Data:** ______

---

## Decyzje P2 — można odłożyć

### D9 — Subagenci na Sonnet (P2)
**Pytanie:** Stare pytanie o koszty subagentów. W Cursor mapujemy na GLM/Composer/Opus.
- **A:** Zbierz odpowiedzi działów, decyduję budżet.
- **B:** W Cursor: GLM/Composer/Opus wg playbooka (pytanie bez przedmiotu). ← rekomendacja MASTERa
- **C:** Odpuść po v1.0.
- **Twoja decyzja:** ______  **Data:** ______

### D14 — Surowce żelazo/stal (P2)
**Pytanie:** Po Żelazo GO potrzebne surowce żelazo/stal w danych. Kto definiuje?
- **A:** DANE/MAPA definiują (złoża + łańcuch ruda→stal), EKONOMIA flaguje dostęp. ← rekomendacja MASTERa
- **B:** Tylko żelazo (bez stali) na v1.0.
- **C:** Odłóż po v1.0.
- **Twoja decyzja:** ______  **Data:** ______

---

## Podsumowanie — tabela szybkiego rozstrzygania

Skopiuj tę tabelę, wpisz litery, wklej w czacie:

| ID | Pytanie (skrót) | Rekom. | Twoja |
|---|---|---|---|
| D1 | HUD układ | C | ___ |
| D2 | Plaster ekonomii „idz" | A | ___ |
| D3 | Wealth scope | C | ___ |
| D4 | Ulepszenia terenu | A | ___ |
| D5 | UX bitwy Q2-Q7 | B | ___ |
| D6 | Zaokrętowanie | A | ___ |
| D7 | Panel armii | B | ___ |
| D8 | Posiłki 1-heks | A | ___ |
| D9 | Subagenci Sonnet | B | ___ |
| D10 | Katapulta epoka | A | ___ |
| D11 | Drzewko układ | A | ___ |
| D12 | Miasta BRAZU | A | ___ |
| D13 | Defaulty startu | A | ___ |
| D14 | Surowce żelazo/stal | A | ___ |
| D15 | Minimapa wariant | B | ___ |

**Przykładowa wiadomość do czatu:**
```
Jestem Maciej. Rozstrzygam decyzje:
D1=C, D2=A, D3=C, D4=A, D5=B, D6=A, D7=B, D8=A, D9=B,
D10=A, D11=A, D12=A, D13=A, D14=A, D15=B.
Zapisz w docs/MACIEJ-KARTA-DECYZJI.md z datą 2026-06-26
i otwórz nowy chat jako MASTER, zaplanuj Sprint 1.
```

---

## Wpływ każdej decyzji na grę (skrót)

| Decyzja | Co odblokowuje | Co jeśli odłożysz |
|---|---|---|
| D1 (HUD) | Czytelny interfejs, BLK-01 | Gra działa, ale HUD ubogi |
| D2 (plaster) | Pełniejsza ekonomia miasta, BLK-02 | Ekonomia mniej grywalna |
| D3 (Wealth) | Zasób Wealth, BLK-03 | Ekonomia bez Wealth (grywalna) |
| D4 (ulepszenia) | Budowanie na mapie, BLK-04 | Brak dróg/posterunków |
| D5 (bitwa UX) | Bitwa manualna grywalna, BLK-05 | Tylko auto-bitwa (fallback) |
| D8 (posiłki) | Bitwy zbiorowe, RDY-02 | Tylko 1v1 |
| D10 (Katapulta) | Machiny oblężnicze v1.0 | Katapulta po v1.0 |
| D11 (drzewko) | Czytelne drzewko tech | Drzewko z przecięciami |
| D12 (miasta BRAZU) | Różnorodne modele miast | Tylko modele kamienia |
| D13 (defaulty) | Szybki START nowej gry | Gracz klika wszystko |
| D15 (minimapa) | Minimapa w HUD | Brak minimapy |

---

*Powiązane: `docs/CURSOR-MASTER-PLAN-DOKONCZENIA.md` (główny plan, §8 pełny kontekst decyzji), `docs/CURSOR-BACKLOG.md` (ID zadań BLK-*/RDY-*), `docs/CURSOR-WORKFLOW-SCHEMAT.md` (jak MASTER realizuje po Twojej decyzji).*
