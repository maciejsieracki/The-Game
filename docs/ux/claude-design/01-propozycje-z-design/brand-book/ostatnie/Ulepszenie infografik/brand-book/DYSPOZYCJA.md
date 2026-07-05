# DYSPOZYCJA — wymiana informacji

Plik do dwustronnej komunikacji: **Agent / Maciej ⇄ Claude (projektant UI)**.
Zasada: **append-only w sekcji „Log"** — nie nadpisujemy historii. Nowe polecenia dopisuj w „Dyspozycje przychodzące", ja odpowiadam w „Odpowiedzi / status".

- Projekt: **The Game — Design System v1 · Painted Imperial (1E)**
- Katalog roboczy: `brand-book-1E/` (dokumenty + ekrany), `brand-book-1E/eksport/` (tokeny, SVG, handoff)
- Aktualizacja: 2026-07-01
- **Protokół**: Maciej jest pośrednikiem. Gdy UX coś dopisze — Maciej mówi Claude **START**. Gdy Claude skończy — informuje Macieja, ten daje znać UX, by odczytał.

---

## 1. Status ogólny

| Obszar | Stan |
|--------|------|
| Kierunek stylu | ✅ zatwierdzony: **1E** |
| Brand Book v1 | ✅ gotowy |
| Biblioteka ikon (Tier 1–5, 50 szt.) | ✅ gotowa |
| Ekrany (menu → koniec) | ✅ gotowe |
| Komponenty + Motion | ✅ gotowe |
| Prototyp (klikalny przepływ) | ✅ podstawowy |
| Eksport (tokeny + 14 SVG + HANDOFF) | ✅ gotowy |

Wejście do przeglądu: `brand-book-1E/The Game — Przegląd (1E).dc.html`

## 2. Decyzje zamknięte (NIE zmieniać bez nowej dyspozycji)
`1B` ciepłe złoto · `2C` Georgia+Segoe · `3C` ikony line w medalionach · `4C` przycisk outline/bevel · `5C` panel premium · `6C` chip + etykieta PL.
Semantyka ikon: Praca=młotek · Żywność=kłos · Skarbiec=moneta · Nauka=sowa · Dyplomacja=pergamin+pióro · Porządek=waga · Zdrowie=kaduceusz · Bonus=prezent+gwiazda · Pokój=gołąb.

## 3. Do zrobienia (backlog — priorytet malejąco)
- [ ] Wariant **porażki** na ekranie końca gry
- [ ] Domknięcie hubu: kafelki dla Kreator Kroki / Walka Warianty / Motion
- [ ] Dokończenie linków prototypu (Dyplomacja→HUD, banery miast→Miasto)
- [ ] Ujednolicenie ikony dyplomacji (HUD ⇄ biblioteka)
- [ ] Eksport SVG Tier 3–5
- [ ] Brand Book → PDF
- [ ] Ekrany dodatkowe: badania (drzewko), wojsko (lista armii), handel, pauza/opcje

## 4. Pytania otwarte (czekają na decyzję)
- (brak — dopisz tutaj)

---

## 5. Dyspozycje przychodzące (od Agenta / Macieja)
> Dopisuj nowe polecenia na górze, z datą. Format: `- [DATA] treść`

- [2026-07-01] (przykład) „Zrób wariant porażki + domknij hub."

## 6. Odpowiedzi / status (od Claude)
> Odpowiadam pod każdą dyspozycją, z datą i statusem (przyjęte / w toku / zrobione).

- [2026-07-01] Utworzono ten plik dyspozycji. Czekam na polecenia.
- [2026-07-01] **Do Agenta UX:** Cześć. Design System **1E (Painted Imperial)** jest gotowy — Brand Book, 50 ikon (Tier 1–5), komplet ekranów (menu→koniec), komponenty, motion, eksport (tokeny + 14 SVG + HANDOFF). Wszystko w `brand-book-1E/`, wejście: `The Game — Przegląd (1E).dc.html`. Backlog w sekcji 3. Pisz dyspozycje w sekcji 5 — odpowiadam tutaj.

---

## 7. Log zmian (append-only)
- 2026-07-01 · Na prośbę UX: folder `brand-book-1E/` → `brand-book/` (jeden folder). Wejście: `brand-book/The Game — Przegląd (1E).dc.html`.
- 2026-07-01 · Utworzono `brand-book-1E/` i przeniesiono wszystkie pliki 1E + eksport.
- 2026-07-01 · Zbudowano A–E: prototyp, kroki kreatora, warianty walki, eksport, motion.
- 2026-07-01 · Komplet ekranów + Brand Book + biblioteka 50 ikon (1E).
