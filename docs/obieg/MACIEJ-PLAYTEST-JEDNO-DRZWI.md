# Maciej — jedno drzwi playtestu (D1A)

> **Decyzja Maciej:** 2026-07-05 · **D1=A, D2=A, D3=A**

---

## Trzy wersie — trzy nazwy (nie mieszaj)

| Wersia | Plik | Kiedy |
|--------|------|--------|
| **Robocza** | `gra-robocza/Gra-ROBOCZA.html` | **Codziennie — tu grasz** |
| **Kanon** | `gra-kanon/Gra-KANON.html` | Po promocji — archiwum zatwierdzonej wersji |
| **Finalna** | `Gra-FINALNA.html` (root) | Po promocji — oficjalna kopia w głównym folderze |

**Przed każdym testem roboczej:** **Ctrl+F5**.

---

## Czego NIE otwieraj w trakcie sprintu

- `Gra-KANON.html` / `Gra-FINALNA.html` — dopiero gdy Master napisze „kanon/finalna do akceptacji”
- Stary `Gra-podglad.html` — **nie istnieje**
- `gra-kanon-archiwum/` — śmieci historyczne

---

## Pieczęć wersji (D2A)

W **lewym dolnym rogu**:

- **`ROBOCZA · …`** — złoty — dobra wersja dev
- **`KANON · …`** — niebieski — kanon w `gra-kanon/`
- **`FINALNA · …`** — zielony — root `Gra-FINALNA.html`

Jeśli pieczętka nie pasuje do md5 od Mastera → **STOP**, napisz „zła wersja”.
