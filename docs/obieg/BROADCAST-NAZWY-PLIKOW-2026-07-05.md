# 📢 BROADCAST — nowe nazwy plików grywalnych (2026-07-05)

> **Obowiązuje natychmiast** wszystkich grup **A–E**, **Integratora F**, **Mastera**.  
> **Trigger odczytu:** Maciej **`ścieżka`** lub **`start`**.  
> **Stary `Gra-podglad.html` — nie istnieje.** Nie tworzyć duplikatów w root.

---

## Trzy wersie — trzy nazwy (nie mieszaj)

| Wersia | Plik | Kto publikuje | Kiedy |
|--------|------|---------------|--------|
| **Robocza** | **`gra-robocza/Gra-ROBOCZA.html`** | **Integrator F** | Po każdej bramce PASS |
| **Kanon** | **`gra-kanon/Gra-KANON.html`** | **Master** | Po OK Macieja + promocja |
| **Finalna** | **`Gra-FINALNA.html`** (root projektu) | **Master** | Ta sama promocja co kanon |

**Hub playtestów (Maciej):** `gra-robocza/START.html` → linki do `Gra-ROBOCZA*.html`  
**Playtesty auto-start:** `Gra-ROBOCZA-PLAYTEST-MAPA.html`, `-MIASTO`, `-WALKA`, itd. (tylko w `gra-robocza/`)

**Pieczętka w rogu ekranu:** `ROBOCZA` (złota) · `KANON` (niebieska) · `FINALNA` (zielona)

---

## Grupy A–E — gdzie pracujecie

| ✅ TAK | ⛔ NIE |
|--------|--------|
| **`gra/src/…`** (wasz moduł) | `gra-robocza/src/` — **skasowane, nie wracać** |
| **`gra/data/*.json`** (wasze dane) | `gra-kanon/` jako źródło kodu |
| Meldunek → Master → kolejka F | Publish HTML, `main.ts`, kanon, finalna |
| | Stare nazwy `Gra-podglad*.html` |

**Po gotowym module:** `→ MASTER: GOTOWE` + ścieżki w **`gra/src/`** — **nie** „wrzuciłem do roboczej”.

---

## Integrator F — gdzie pracujesz

| Krok | Ścieżka / skrypt |
|------|------------------|
| **Kod + main.ts** | **`gra/src/main.ts`** + moduły lane |
| **Bramka** | `gra/tools/bramka-test-publish.ps1` |
| **Publish roboczej** | **`gra/tools/publish-robocza-snapshot.ps1`** |
| **Wynik** | **`gra-robocza/Gra-ROBOCZA.html`** + `Gra-ROBOCZA-PLAYTEST-*.html` |
| **Manifest** | `gra-robocza/ROBOCZA-MANIFEST.json` (md5) |

**ZAKAZ F:**
- edycja / odtwarzanie **`gra-robocza/src/`**
- publish do **`gra-kanon/`** lub **`Gra-FINALNA.html`**
- kopiowanie bundli do root (oprócz buildu POLE-BITWY → `Gra-ROBOCZA-POLE-BITWY.html` w roboczej)

**Meldunek do Mastera (1. linia):**
`GOTOWE-ROBOCZA · md5=… · gra-robocza/Gra-ROBOCZA.html`

---

## Master — promocja (kanon + finalna)

| Skrypt | Efekt |
|--------|--------|
| `gra/tools/publish-kanon-snapshot.ps1` | `gra-robocza/` → **`gra-kanon/Gra-KANON*.html`** + root **`Gra-FINALNA.html`** |

**Playtest do Macieja (robocza):**  
`PLAYTEST: gra-robocza/Gra-ROBOCZA.html · md5=… · Ctrl+F5`

**Po akceptacji kanonu:**  
`KANON: gra-kanon/Gra-KANON.html · FINALNA: Gra-FINALNA.html · md5=…`

---

## Kasacja (2026-07-05 — nie odtwarzać)

Usunięte z repo: `gra-kanon-archiwum/`, `gra-robocza/src/`, `gra-kanon/src/`, `gra-robocza-kopia/`, root `Gra-podglad-*`.

---

## Potwierdzenie (agent — po `ścieżka` / tym broadcast)

```
POTWIERDZAM BROADCAST 2026-07-05 · Grupa <X>
Kod: gra/src/ · Publish F: Gra-ROBOCZA.html · Kanon/Finalna: Master
Przeczytałem: docs/obieg/BROADCAST-NAZWY-PLIKOW-2026-07-05.md
```
