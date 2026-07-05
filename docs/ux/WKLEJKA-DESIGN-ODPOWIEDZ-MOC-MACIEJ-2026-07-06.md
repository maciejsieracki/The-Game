# WKLEJKA — odpowiedź Design · Panel Moc (Maciej → Design)

**GitHub (Design czyta stąd):**  
https://github.com/maciejsieracki/The-Game/blob/main/docs/ux/GITHUB-ISSUE-IMP-01-ODPOWIEDZ-DESIGN-2026-07-06.md  
**Hasło:** `IMP-01-MOC-ODPOWIEDZ-2026-07-06`

Alternatywa: skopiuj blok poniżej do czatu Design.

---

```
ODPOWIEDŹ UI/MASTER — Panel Moc imperium (IMP-01)

Dzięki za mockup v1 — model 6 filarów (Wojsko/Gospodarka/…) NIE jest w silniku.
Pełna odpowiedź na GitHub (main):
  docs/ux/GITHUB-ISSUE-IMP-01-ODPOWIEDZ-DESIGN-2026-07-06.md
Hasło w repo: IMP-01-MOC-ODPOWIEDZ-2026-07-06

══════════════════════════════════════
1) SKĄD WCHODZI PANEL?
══════════════════════════════════════
· Klik ŚRODEK górnego paska: medalion + liczba MOC → slide-in, sekcja Moc
· Klik chipów LEWO: Skarbiec · Praca · Nauka · Kultura · Ludność · Rekruci → TEN SAM slide-in, scroll do sekcji
· Klik liczby rekrutów pod Mocą → sekcja Rekruci
· Skrót klawiaturowy: BRAK (v1.0)
· Forma: SLIDE-IN z prawej · min(420px, 94vw) — NIE 460px · NIE modal centrum
  (modal centrum = stary powerOverlayHud — wycofujemy)

Decyzja Macieja D16 = opcja A (slide-in imperium)

══════════════════════════════════════
2) SKŁADNIKI — NIE 6 FILARÓW · TABELA 9 WIERSZY
══════════════════════════════════════
Moc = round(suma ilość × współczynnik) · kanon P-A

| Składnik UI          | × wsp. | Skąd liczba |
|----------------------|--------|-------------|
| Armia                | 25     | Suma M_pole jednostek na mapie |
| Wygrane bitwy        | 1      | Suma M_pole pokonanego wroga przed walką |
| Ludki                | 5      | Suma slotów populacji (ludki) w miastach |
| Rekruci (ekw. jedn.) | 5      | floor(rekruci / koszt_werbu[epoka]) |
| Miasta               | 50     | Liczba miast |
| Terytorium (heksy)   | 0.5    | Heks w zasięgu miast |
| Infrastruktura       | 5      | Liczba budynków |
| Odkrycia / tech      | 20     | Zbadane technologie |
| Ulepszenia terenu    | 5      | Ulepszenia w terytorium |

Gospodarka / Kultura / Religia = OSOBNE sekcje tego samego panelu (chipy HUD),
NIE wchodzą do sumy Mocy. Religia = osobny overlay — poza IMP-01.

Kolumny tabeli w mockupie:
  Składnik | Ilość | × wsp. | = pkt | % udziału | pasek | (opcj.) Skąd

══════════════════════════════════════
3) RANKING — TAK
══════════════════════════════════════
Pod tabelą: Ranking Moc — wszystkie cywilizacje na mapie, sort malejąco.
Format: #rank Nazwa — Moc N · gracz z ▸
+ linia Respekt wobec pierwszego znanego AI:
  round(100 × powerSelf / (powerSelf + powerPartner))

══════════════════════════════════════
4) TREND ▲/▼ — NIE (v1.0)
══════════════════════════════════════
Brak historii Mocy w silniku. Prosimy USUNĄĆ z mockupu.

══════════════════════════════════════
5) SCREENY PRZED
══════════════════════════════════════
Panel JUŻ JEST w grze (slide-in empireDetailPanel):
  gra-kanon/START.html → kilka tur → klik Moc / Skarbiec
GAP (GitHub):
  docs/ux/export/IMP-01-MOC-PANEL-GAP-DLA-DESIGN.html

══════════════════════════════════════
DELIVERABLE PO KOREKCIE
══════════════════════════════════════
The Game - Panel Moc imperium v2 2026-07-06 (1E).dc.html
· 4 klatki: Moc (9 wierszy) · Skarbiec · Praca · Rekruci
· zero emoji · slide-in 420px · bez trend ▲/▼

Reszta paczki B-P0 (A-08, HEX, C23, C12) — portujemy niezależnie.
```
