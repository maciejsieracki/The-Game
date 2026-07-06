# Archiwum obiegu — backup przed migracją 2026-06-30

> Przed edycją reguł obiegu każdy plik ma kopię **`*.bak-OBIEG-2026-06-30`** obok oryginału.

## Źródło prawdy (NOWE)

| Plik | Rola |
|------|------|
| `docs/czaty/_DYSPOZYCJA-WSPOLNY-OBIEG.md` | Wspólny obieg A–E |
| `docs/czaty/DYSPOZYCJA-GRUPA-*.md` | Onboarding per grupa |
| `.cursor/rules/decyzje-echo.mdc` | ECHO · działaj · przekaż do Mastera · Slack |
| `docs/obieg/_ZASADY.md` §7 | Hasła Macieja |
| `docs/obieg/MACIEJ-ROLA-MINIMAL.md` | Co robi Maciej |

## Pliki zarchiwizowane (nagłówek ARCHIWUM, treść historyczna)

- `SCHEMAT-DWIE-WERSJE.md`
- `REGULA-PRZEPLYWU-2026-06-27.md` (treść skrócona; pełna w `.bak`)
- `SILNIK-MASTER-FLOW.md`

## Przywracanie

```powershell
Copy-Item plik.bak-OBIEG-2026-06-30 plik -Force
```
