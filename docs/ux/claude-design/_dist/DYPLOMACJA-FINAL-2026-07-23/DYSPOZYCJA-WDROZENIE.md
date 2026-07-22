# DYSPOZYCJA — WDROŻENIE PACZKI „DYPLOMACJA v1.1" (2026-07-23)

## Co to jest
Panel dyplomacji (adaptacja TW:WH3 · styl 1E) — **ZATWIERDZONY DO KANONU** (Maciej, 2026-07-23).
Wersja v1.1 = mockup v1 od Macieja + poprawki logiczne i stylistyczne.
W paczce dwie formy: `.html` (robocza, samodzielna) i `.dc.html` (KANON, wymaga support.js obok).

## KROK 1 — Wgranie do repo (Maciej)
Rozpakuj ZIP i wgraj do repo `maciejsieracki/The-Game`, ścieżka docelowa:

```
docs/ux/claude-design/01-propozycje-z-design/brand-book/
```

| Plik w paczce | Dokąd | Uwaga |
|---|---|---|
| `brand-book/KANON/mockupy/The Game - Dyplomacja panel negocjacji v1.1 -1E-.dc.html` | `.../brand-book/KANON/mockupy/` | NOWY — KANON |
| `brand-book/KANON/mockupy/support.js` | `.../brand-book/KANON/mockupy/` | tylko jeśli brak w repo |
| `brand-book/KANON/CANON.md` | `.../brand-book/KANON/` | NADPISZ (nowy wiersz: panel negocjacji) |
| `brand-book/KANON/START - KANON aktualny (1E).dc.html` | `.../brand-book/KANON/` | NADPISZ (karta ★ w hubie) |
| `brand-book/Makieta DYPLOMACJA v1.1 -TW-adapt- 1E-.html` | `.../brand-book/` | robocza wersja .html (opcjonalnie) |
| `WYMIANA-UI-DESIGN.md` | katalog statusu (jak dotychczas) | NADPISZ (wpis w logu) |

Commit: `DYPLOMACJA panel negocjacji v1.1 → KANON (makieta + CANON + hub)`

**Status kanonu:** ZATWIERDZONE — kanoniczny plik to `.dc.html` w `KANON/mockupy/`.
Stara „Ekran Dyplomacja" zostaje w kanonie jako **lista frakcji** (panel negocjacji jej nie zastępuje).

## KROK 2 — Weryfikacja po wgraniu
Otwórz plik w przeglądarce: baner „PAKT O NIEAGRESJI" na górze, karta Greków (ze Skarbcem) po lewej,
Rzymian (z „Relacje z Tobą") po prawej, stół negocjacji 3-kolumnowy w środku, rozbicie relacji pod nim,
pasek szybkich akcji + „Szybka Umowa" na dole. Hover na kafelkach umów = złoty glow.

## KROK 3 — Zlecenie dla integratora (makieta ZATWIERDZONA)
Źródło prawdy: ta makieta. Zakres vs obecny ekran dyplomacji:
1. **Układ dwustronny**: karta gracza (z medalionem, atrybutami, SKARBCEM, dobrami) po lewej — lustrzana
   do karty rozmówcy po prawej; środek = stół negocjacji.
2. **Status formalny** (baner na górze) odrębny od nastawienia — nazwa traktatu + od ilu tur + kara zerwania.
3. **Stół negocjacji, 3 kolumny**: Możliwe umowy (12) · Aktywne traktaty (z karą zerwania i „Zerwij") ·
   Żądania/Oferty z bilansem (Zyskujesz / Oddajesz / werdykt) i „Zaakceptuj ofertę".
4. **Logika blokad** (KRYTYCZNE — naprawiona w v1.1, tak ma działać w grze):
   - format notki: „zablokowana — wymaga [Zaufania|Respektu] N (masz M)" + kłódka + opacity .48
   - umowa zawarta = stan `active` (niebieska ramka + check + „już zawarta") w Możliwych ORAZ wpis w Aktywnych
   - Propozycja pokoju niedostępna, gdy nie trwa wojna; Wypowiedzenie wojny z notą „zrywa [traktat]"
5. **Relacje (Zaufanie/Respekt) renderowane RAZ** — na karcie rozmówcy („Relacje z Tobą").
   U gracza zamiast tego Skarbiec (złoto + dochód/turę — dane do ofert ze złotem).
6. **Rozbicie relacji** „Za co Cię lubią / nie lubią" z wartościami z DIPLOMACY_PARAMS + wiersz stanu
   (Zaufanie · Respekt · nastawienie) — wartości muszą pochodzić z tych samych źródeł co paski.
7. **Bilans oferty**: pozycje jednorazowe vs /turę rozdzielone; werdykt z uzasadnieniem („zwrot po N turach").
8. **Pasek szybkich akcji — SAME IKONY** (46 px, bez podpisów): wojna · pokój · sojusz · pakt · handel · dar · wasal;
   pełna nazwa TYLKO na hover (pigułka 1E nad ikoną) + złota „Szybka Umowa" (jedyny tekstowy CTA paska).
   „Zerwij" przy traktatach = ikona rozerwanego ogniwa + podpis na hover. Teksty zostają tylko na:
   „Szybka Umowa", „Zaakceptuj ofertę" i zakładkach nawigacji. Hovery: złoty glow; wojna czerwony, pokój zielony.
9. **Styl 1E**: tło granatowe (#111722→#070a0f), złoty primary `linear-gradient(180deg,#f0dc88,#b99a28)`
   + border #6a5212 / top #f8eea8, tekst #2e2708. Tokeny relacji: zaufanie #5ad07a · respekt #e8d88a ·
   wróg #c84040 · nieufny #d08030 · pakt #8ec5ff.

## KROK 4 — Po wdrożeniu
Screenshot z gry → porównanie z makietą; pytania w `WYMIANA-UI-DESIGN.md` sekcja 5.

---
## CHANGELOG v1 → v1.1 (co poprawiono i dlaczego)
- Sojusz obronny: „dostępny · wymaga Zaufania 45+" przy Zaufaniu 34 → ZABLOKOWANY (sprzeczność).
- Żądanie trybutu: wymaga Respektu 70 (masz 61), było klikalne → ZABLOKOWANE.
- Umowa handlowa: „możliwa" i jednocześnie aktywna od 8 tur → oznaczona „już zawarta" ✓.
- Oferta „Umowa handlowa Żelazo" dublowała istniejący traktat → „Rozszerzenie handlu + Żelazo".
- Bilans: „opłacalna" przy koszcie −40 zł/TURĘ → trybut zamieniony na dopłatę JEDNORAZOWĄ,
  wiersze Zyskujesz/Oddajesz, werdykt „opłacalna (zwrot po 5 turach)".
- Relacje zdublowane 1:1 na obu kartach → raz, u rozmówcy; u gracza Skarbiec.
- Ujednolicone notki blokad; Zaufanie 91→90; „nie ma stanu wojny"→„nie trwa wojna".
- Rozbicie relacji + wiersz stanu bieżącego (34/61/Nieufny) — spójny z paskami.
- Tło brązowe → granat 1E; złote CTA na gradiencie kanonu; hovery kafelków i akcji.
- Pasek akcji i „Zerwij" → same ikony z podpisem na hover (redukcja batonów); w kanonicznym .dc.html
  usunięte media-queries (stała szerokość 1792 px) — responsywność została w roboczym .html.
