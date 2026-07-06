# Charter — Grupa B — Miasto / Ekonomia / Technologia

> **Zakładka Cursor:** `Grupa B — Miasto / Ekonomia / Technologia`  
> **Ten czat = panel miasta + ekonomia imperium (produkcja, Wealth, społeczeństwo, żywność) + drzewko technologii i nauka.**  
> Obowiązuje: `docs/decyzje/DYSPOZYCJA-STALA.md` + ten plik.

## Przepływ i raportowanie

**Obieg:** `docs/czaty/_DYSPOZYCJA-WSPOLNY-OBIEG.md` · `docs/obieg/_ZASADY.md`

1. Implementacja modułów Grupy B — **bez** `main.ts`, **bez** `Gra-podglad.html`.
2. Raport: `docs/obieg/B-ekonomia.md` · `REJESTR-DECYZJI.md`.
3. Maciej: **`przekaż do Mastera`** → handoff + Slack → Master → Integrator F → kanon → **REJESTR §2** (lane milczy · playtest = Master).

**Hasła Macieja:** `działaj` · `przekaż do Mastera` · A/B/C · `format`

---

## Za co odpowiadacie

| Obszar | Odpowiedzialność |
|--------|------------------|
| **Panel budowa** | Kolejka, budynki, rush, worked tiles, okolica miasta |
| **Społeczeństwo** | Zadowolenie per miasto, porządek, bunt, zdrowie, 3 koszyki |
| **Suwaki** | Podatek 70/20/10, plaster, kupno jednostek, auto-zarządca |
| **Wealth** | Pula W, próg, mnożnik — **≠ złoto na HUD mapy** |
| **Żywność** | Split miasto/państwo/wojsko, suwak, zapasy (model Q1) |
| **Nauka** | Drzewko tech, tempo, koszty, UI overlay nauki |

**Moduły:** `economy.ts`, `cities.ts`, `production.ts`, `wealth.ts`, `ui/cityPanel` (+ handoff do Grupy C przy wojsku/żywności).

**Mockup:** `UI/Gra-podglad-MIASTO.html`

---

## Tematy w tym czacie (B1–B5)

| ID | Nazwa | Plik decyzji | Pytania do Macieja | Status |
|----|-------|--------------|-------------------|--------|
| **B1** | Panel budowa | `B1-panel-budowa.md` | **B1.1–B1.4** | CZĘŚCIOWO |
| **B2** | Społeczeństwo | `B2-spoleczenstwo.md` | **B2.1–B2.5** | CZĘŚCIOWO |
| **B3** | Suwaki miasto | `B3-suwaki.md` | — (zamknięte) | ZAMKNIĘTE |
| **B4** | Wealth | `B4-wealth.md` | B4.1–B4.2 jeśli otwarte | ZAMKNIĘTE |
| **B5** | Żywność | `B5-zywnosc.md` | **B5.1–B5.2** (UI) | implementacja |

**Pełna lista pytań otwartych:** `docs/decyzje/B-OTWARTE-PYTANIA.md`  
**Katalog roboczy:** `docs/grupa-b/` (audyt, STAN, handoff index)

**Numeracja:** `B1.2A`, `B2.1B` (temat.podpytanie + litera) **lub** `B1-Q1` w formacie ABC z DYSPOZYCJI — **spójnie w obrębie tematu**.

**Ekran w pytaniu:** `[EKRAN: Panel miasta]` lub `[EKRAN: Overlay]` (Wealth na HUD — wtedy napisz „panel + pasek mapy").

---

## Jakie pytania ABC wolno Maciejowi (tylko ta grupa)

**Format obowiązkowy:** numer + litera **`1A … 11C`** — pełna treść: [`docs/grupa-b/MACIEJ-PYTANIA-ABC.md`](../grupa-b/MACIEJ-PYTANIA-ABC.md)  
**Reguła agentów:** [`docs/grupa-b/REGULA-ABC.md`](../grupa-b/REGULA-ABC.md)  
Max **5 pytań** na jedną wiadomość. Kolejność paczek: **1–3** → **4–6** (+11 przy okolici) → **7–10**.

**WOLNO pytać o:** (mapowanie na numery 1–11)
- Produkcja, kolejka, wykup, auto-zarządca, pola pracy (B1)
- Mieszkańcy, porządek, bunt, zdrowie — **per miasto** (B2)
- Suwaki, plaster, kupno (B3 — głównie implementacja)
- Wealth, kultura/religia w panelu (B4)
- Suwak żywności, wyświetlanie zapasów państwa w panelu (B5)
- Drzewko nauki, tempo, widoczność tech (D1 — implementacja w Grupie B)
- Q3 zadowolenie = **B2**, nie mapa świata

**ZAKAZ pytań w tym czacie:**

| Temat | Gdzie |
|-------|--------|
| HUD mapy, minimapa, jednostka na heksie (Q4–Q10) | **Grupa A** |
| Bitwa, oblężenie, UX pola bitwy | **Grupa C** |
| Dyplomacja tier, bonusy JSON, AI rywali | **Grupa D** |
| Nowa gra, zwycięstwo (meta), domyślne surowce startu | **Grupa E** |
| Ulepszenia **tylko z mapy** vs panel — jeśli dotyczy klika na heksie | uzgodnij z **A4**, nie pytaj w B bez kontekstu |

---

## Pytania do Mastera

`docs/decyzje/B1-PYTANIA-DO-SILNIKA.md` … (per aktywny temat Bx).

Raport: `dyspozycje/EKONOMIA-DO-MASTERA.md`, `dyspozycje/UI-DO-MASTERA.md`.

---

## Uwaga: B5 a Grupa A

Decyzja **Q1 żywność** (hybryda) jest zapisana — **implementacja** B5 + fragment HUD na mapie (A1).  
Pytanie gameplay o **split** → już zamknięte. Pytanie o **gdzie pokazać zapasy na mapie** → eskaluj do **A1** lub Integratora, nie wymyślaj w B.

---

## Kolejność pracy

1. **B1** → **B2** → **B5** (kod) → domknięcie B4.1/B4.2 jeśli trzeba  
2. **B3/B4** — decyzje zamknięte → tylko kod + testy
