# `plot code` — workflow (Maciej → kod z dyspozycji)

> **Hasło Macieja:** **`plot code`** (w czacie **Master**).  
> **Sens:** „Masz dyspozycje — sprawdź kolejkę i **przygotuj kod** (albo oddaj lane z jasnym handoffem).”  
> **Nazwa:** nawiązanie do wczesnego **PlotCode** — Ty decydujesz kierunek, agenci wykonują z plików.

---

## Maciej — co robisz

| Krok | Ty |
|------|-----|
| 1 | W hubie Master wpisujesz: **`plot code`** |
| 2 | **Nic nie wklejasz** — agent czyta repo |
| 3 | Czekasz na czacie: **`✅ Gotowe:`** / **`⏸️ Czeka:`** |
| 4 | Opcjonalnie otwierasz **[`docs/MACIEJ-GOTOWE.md`](../MACIEJ-GOTOWE.md)** — ten sam wpis, pełniejszy |
| 5 | Opcjonalnie: **`playtest OK`** / **`BUG:`** tylko gdy Master poprosi |

**Nie musisz** otwierać Slacka ani śledzić 6 czatów.

---

## Agent (Master / lane) — co robi po `plot code`

### 1. Skan kolejki (kolejność)

1. `docs/master/MASTER-HANDOFF-INBOX.md`
2. `dyspozycje/DZIENNIK-MASTERA.md` (ostatnie wpisy)
3. `dyspozycje/<LANE>.md` → sekcja **DO ZROBIENIA TERAZ**
4. `dyspozycje/_handoff/*-do-MASTER*.md` bez ACK
5. `docs/ux/claude-design/.../brand-book-1E/DYSPOZYCJA.md` (Design/UI)
6. `docs/obieg/ROADMAP-UX-UI-WDROZENIE.md` — aktualny etap W*

### 2. Wykonanie

- Bierz **najwyższy priorytet** bez otwartego ABC Macieja.
- **Lane UI/B/E…:** kod tylko w swoim lane · **Integrator F:** tylko po dyspozycji Master · **Design:** pliki w `brand-book-1E/`.
- **Bez kanonu** (`Gra-podglad.html`) bez review — chyba że Master już zamknął batch.

### 3. OBOWIĄZEK — czat + plik MD

**Gdy skończysz batch LUB utkniesz na blokerze:**

1. **Czat** — w tej samej odpowiedzi napisz Maciejowi wprost (nie tylko dziennik):
2. **Plik** — dopisz wpis na górze [`docs/MACIEJ-GOTOWE.md`](../MACIEJ-GOTOWE.md) (szablon na dole pliku).

#### Sukces

```
✅ Gotowe: [1 zdanie — co przygotowano]

📁 [ścieżki plików / handoff]
🧪 [testy: smoke OK / …]
⏭️ Od Ciebie: [nic | wrzuć folder | playtest | ABC …]
```

#### Bloker

```
⏸️ Czeka: [1 zdanie — czego brakuje]

📁 Co już jest w repo
🔓 Od Ciebie: [np. brand-book w repo · decyzja ABC · …]
```

**Zakaz:** kończyć turę samym „zapisano w DZIENNIKU" **bez** linii **Gotowe:** / **Czeka:** na czacie **i bez** wpisu w **`MACIEJ-GOTOWE.md`**.

---

## Przykłady

| Sytuacja | Maciej widzi |
|----------|----------------|
| W1-PREP menu tokeny | `✅ Gotowe: tokeny Warstwa 1 w menu i kreatorze · smoke OK` |
| Brak plików Design | `⏸️ Czeka: eksport SVG w brand-book-1E/eksport/ · Od Ciebie: wrzuć folder` |
| Handoff do F | `✅ Gotowe: batch UI oddany · F może wpiąć game over` |

---

## Powiązane

- [`KOMENDY-MACIEJA.md`](KOMENDY-MACIEJA.md) — hasła
- [`OBOWIAZ-POWIADOM-MACIEJA.md`](OBOWIAZ-POWIADOM-MACIEJA.md) — reguła powiadomień (wszystkie agenci)
- [`MACIEJ-GOTOWE.md`](../MACIEJ-GOTOWE.md) — **log gotowych paczek** (czytasz Ty)
- [`MACIEJ-ROLA-MINIMAL.md`](MACIEJ-ROLA-MINIMAL.md) — Twoja rola

---

*Master · 2026-06-26*
