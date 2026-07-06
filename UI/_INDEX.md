# Civ/UI/ — katalog działu Civ-UI (interfejs)

## Gra (Maciej 2026-06-29)

**Jeden plik:** [`../Gra-podglad.html`](../Gra-podglad.html) — menu w silniku, kreator TS, ikony HUD, mapa 3D.

Stary flow mockupów (MENU HTML → kreator HTML) **wycofany** — pliki przekierowują na silnik; oryginały w `_archiwum/`.

| Plik | Rola |
|------|------|
| **../Gra-podglad.html** | **gra** (jedyny build) |
| **../Gra-podglad-ROBOCZA.html** | redirect → kanon (stare bookmarki) |
| **Makieta-START.html** | hub linków |
| **mockup-embed.js** | pasek ← Mapa (panele embed) |

## Pojedyncze mockupy paneli (design only)

**Nauka / drzewko:** w silniku (`scienceHubHud` + `sciencePicker`) — `Gra-podglad.html` → 🦉.  
Archiwum layoutu N=0: `Makieta-drzewko-uklad-bez-przeciec.html`. ~~`Gra-podglad-NAUKA.html`~~ usunięty.

**Panel miasta:** tylko w silniku — `../Gra-podglad-OKOLICA-UX.html` lub klik miasto w `Gra-podglad.html`.  
Stary `Gra-podglad-MIASTO.html` (3 kolumny) **usunięty** 2026-06-26.

## Przekierowania (stare bookmarki)

| Stary plik | → |
|------------|---|
| `Gra-podglad-MENU.html` | `../Gra-podglad.html` |
| `Makieta-flow-nowa-gra.html` | `../Gra-podglad.html` |
| `Makieta-HUD-mapa-swiata.html` | `../Gra-podglad.html` |
