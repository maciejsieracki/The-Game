# POLE-BITWY — checklist review Macieja (przed Design v4)

**Cel:** werdykt **Hak 1 (treść)** + **Hak 2 (wygląd)** zanim designer dostanie ZIP.  
**Wzorzec:** jak `A-06-REVIEW-MACIEJ.md`  
**Build:** `Gra-podglad-POLE-BITWY.html` · marker `POLE-BITWY-20260704-manual-polish` (Ctrl+F5)

---

## 3 stany do oceny

| # | Stan | Jak wejść | Review pack |
|---|------|-----------|-------------|
| 1 | **Deploy** | Dwuklik POLE-BITWY → faza rozstawiania | wireframe stan 1 |
| 2 | **Walka AUTO** | Start walki · bez **R** | wireframe stan 2 |
| 3 | **Walka RĘCZNY** | **R** → roster lewy + Taktyka/Strategia | wireframe stan 3 |

**Otwórz w przeglądarce (lane UI krok 1):**

- `docs/ux/export/C-POLE-BITWY-review-3stany.html` — 3 stany obok siebie (układ z kodu)
- `docs/ux/export/C-POLE-BITWY-review-stary-vs-kod.html` — **v3/v2 przestarzałe** vs kod (target v4)
- **Live:** `Gra-podglad-POLE-BITWY.html` (Ctrl+F5) — weryfikacja w grze

**Porównaj obok:** mockup `C06 Deployment v3 (1E).dc.html` · `C09 Karty v2 (1E).dc.html` — **oba przestarzałe** względem kodu.

---

## Hak 1 — treść (co musi zostać)

| Element | W kodzie (fakt) | Twoja odpowiedź |
|---------|-----------------|-----------------|
| Taktyka / Strategia | **Dolny pasek** · widoczne **deploy + tryb R** · ukryte w AUTO | OK / zmień: … |
| Filtry rosteru | Konnica · Piechota · Łucznicy · Wszystkie · Grupa 1–3 · Generał | OK / zmień: … |
| ◆ Grupuj / Rozgrupuj | Pasek zaznaczenia w lewym panelu | OK / zmień: … |
| Komendy walki | **Prawy pionowy rail:** P · V · R · M · MUZ · H · >> · WYCOF | OK / uprość: … |
| Deploy toolbar | Formacja · Konnica · Linie · Taktyka · Strategia · Reset · Start | OK / zmień: … |
| Top HUD | Tura · ×N · VS · skład K/P/Ł · Wycofaj się | OK / zmień: … |
| Roster | **Lewy panel pionowy** · siatka **6×5** · scroll | OK / zmień: … |

**Odpowiedź skrót:** `POLE-BITWY treść OK` · albo lista zmian

---

## Hak 2 — wygląd

| Pytanie | Opcje |
|---------|--------|
| Mockup v3 | **A** = tylko polish 1E · **B** = za stary, **v4 od zera** (rekomendacja MASTER) |
| Roster | **A** = dopasuj skin do obecnego 6×5 lewy · **B** = przeprojektuj layout |
| Paczka Design | **A** = osobne pliki C06 v4 + C09 v4 · **B** = jeden wielki HUD |

**Odpowiedź skrót:** np. `POLE-BITWY wygląd B · roster A · paczka A`

---

## Zakres paczki 1 (Design)

- ✅ Deploy + walka (pole + roster + top + rail + toolbar)
- ❌ C-01 pre-bitwa · C-12 koniec · C-19/C-20 oblężenie → **później**

**ZLECENIE-ID:** `POLE-BITWY-HUD-v4-2026-07-04`

---

## Werdykt Macieja ✅ (2026-07-04 ~20:52)

**Hak 1 — treść OK**

| Element | Werdykt |
|---------|---------|
| Lewy panel | **Roster jednostek** (karty, filtry, Grupuj) — **ZOSTAJE** · to **nie** formacje z mockupu |
| Formacje F1/F2/F3 | **Dolny toolbar** (Formacja/Konnica/Linie) · **nie** lewy panel |
| Deploy dolny pasek | Formacja · Konnica · Linie · Taktyka · Strategia · Reset · **Start walki** — TAK |
| LOGI / USTAWIENIA na deploy | **NIE** · log osobno · dźwięk = prawy rail |
| Start walki | Główny CTA — OK |
| Oblężenie C-19/C-20 | Później · nie paczka 1 |

**Hak 2 — wygląd A:** szkic funkcjonalny OK · Design robi **v4 (1E)** · mockupy v2/v3 za stare

**Paczka 1:** tylko pole bitwy + roster (deploy + AUTO + R)  
**ZLECENIE-ID:** `POLE-BITWY-HUD-v4-2026-07-04`

---

## Po werdykcie

1. ✅ Review zamknięty → **Design → ZIP v4** (krok 2 **ACTIVE**)  
2. Lane UI → port skin **dopiero po ZIP v4**  
3. Master → review → F → kanon
