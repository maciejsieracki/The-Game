# Backup projektu Civ — workflow dla Macieja

## Gdzie są kopie

Wszystkie kopie są **poza folderem Civ i poza drzewem synchronizacji OneDrive** (lokalny dysk):

| Lokalizacja | Znaczenie |
|-------------|-----------|
| `C:\Users\macie\Backups\Civ\snapshots\YYYY-MM-DD_HH-mm\` | Pełna kopia z danego uruchomienia (snapshot) |
| `C:\Users\macie\Backups\Civ\latest\` | Ostatnia udana kopia (lustrzane odbicie najnowszego backupu) |
| `C:\Users\macie\Backups\Civ\logs\backup-YYYY-MM-DD.log` | Log z danego dnia (robocopy + komunikaty skryptu) |

**Źródło (NIE kasuj masowo bez sprawdzenia):**  
`C:\Users\macie\OneDrive - NASTER S.A\_NOWA_STRUKTURA\06_Prywatne\Gry\Civ`

### Co jest w backupie

- Cały projekt: `docs`, `dyspozycje`, `gra\src`, `Gra-podglad.html`, `.git`, lane’y, Excel, itd.

### Co jest pomijane (oszczędność miejsca / pliki odtwarzalne)

- `node_modules`
- `gra\dist` (build — odtwarzalny)
- `.____dirprobe`
- pliki `*.tmp`, `*.temp`

**Retencja:** skrypt trzyma **14 ostatnich snapshotów** w `snapshots\`; starsze są usuwane tylko z folderu backupów (nigdy z Civ).

---

## Jak przywrócić pliki

1. **Zatrzymaj edycję** w Civ (zamknij Cursor / nie zapisuj na czas kopiowania).
2. Wybierz snapshot, np. `C:\Users\macie\Backups\Civ\snapshots\2026-06-26_22-22\`, albo użyj `latest\`.
3. Skopiuj **zawartość** snapshotu z powrotem do folderu Civ (Explorer lub robocopy).  
   Przykład (PowerShell — **najpierw sprawdź ścieżki**):

   ```powershell
   $src = 'C:\Users\macie\Backups\Civ\latest'
   $dst = 'C:\Users\macie\OneDrive - NASTER S.A\_NOWA_STRUKTURA\06_Prywatne\Gry\Civ'
   robocopy $src $dst /E /XJ /XD node_modules gra\dist
   ```

4. Po przywróceniu: w `gra\` uruchom `npm install` i ewentualnie build, jeśli potrzebujesz `dist`.

Przy poważnej awarii bezpieczniej przywracać **pojedyncze pliki/foldery** z snapshotu niż nadpisywać wszystko.

---

## Backup ręczny (od razu)

Z katalogu Civ:

```powershell
powershell -ExecutionPolicy Bypass -File tools\backup-civ-daily.ps1
```

Albo pełna ścieżka do skryptu:

`C:\Users\macie\OneDrive - NASTER S.A\_NOWA_STRUKTURA\06_Prywatne\Gry\Civ\tools\backup-civ-daily.ps1`

Kod wyjścia robocopy **0–7** = sukces (w tym „nic nowego do skopiowania”); **8 i wyżej** = błąd — sprawdź log w `logs\`.

---

## Backup automatyczny (Task Scheduler)

Zadanie Windows: **`Civ-Daily-Backup`** — codziennie o **03:00**.

Sprawdzenie w PowerShell:

```powershell
Get-ScheduledTask -TaskName 'Civ-Daily-Backup'
```

### Ręczna rejestracja (gdy automatyczna się nie uda)

1. Otwórz **Harmonogram zadań** (`taskschd.msc`).
2. **Utwórz zadanie…** (nie „Utwórz podstawowe zadanie”, jeśli chcesz pełną kontrolę).
3. **Ogólne:** nazwa `Civ-Daily-Backup`, uruchom tylko gdy użytkownik zalogowany (lub „niezależnie od logowania”, jeśli masz uprawnienia).
4. **Wyzwalacze:** codziennie, **03:00**.
5. **Akcje:** Uruchom program  
   - Program: `powershell.exe`  
   - Argumenty: `-NoProfile -ExecutionPolicy Bypass -File "C:\Users\macie\OneDrive - NASTER S.A\_NOWA_STRUKTURA\06_Prywatne\Gry\Civ\tools\backup-civ-daily.ps1"`
6. Zapisz. Przy pierwszym uruchomieniu zaakceptuj hasło użytkownika, jeśli Windows poprosi.

---

## Dlaczego backup poza OneDrive?

OneDrive może proponować **masowe usuwanie/setowanie sync** (np. komunikat o 232 plikach). Kopia na `C:\Users\macie\Backups\Civ\` nie jest „czyszczona” przez sync chmury.  
**Opcja dodatkowa:** raz na jakiś czas skopiuj `Backups\Civ\latest` na drugi dysk / pendrive (druga kopia offline).

---

## Zasada po incydencie z 232 plikami

**NIGDY nie zatwierdzaj masowego usuwania** w OneDrive ani w Explorerze bez:

1. Sprawdzenia listy plików (co dokładnie znika),
2. Upewnienia się, że jest świeży snapshot w `Backups\Civ\snapshots\`,
3. Świadomej decyzji (często to cache/temp — ale **zawsze** weryfikuj).

Skrypt backupu: `tools\backup-civ-daily.ps1`
