# Dowód retroaktywny — zgodność `The_Smiths_Measure.mp3` z archiwum źródłowym

Zapisane 2026-08-30 w odpowiedzi na Zarzut #4 z `P-AUDYT-RETRO-MUZYKA-BRAZ-KROK10-Q1`
(Final Control: DO_DECYZJI_CZŁOWIEKA — właściciel potwierdził dostęp do oryginalnego
archiwum i zlecił ponowne sprawdzenie).

## `unrar lb` na oryginalnym archiwum (ponownie przesłanym przez właściciela)

```
muzyka braz/A_Kingdom_s_Final_Rite.mp3
muzyka braz/Before_the_Bronze_Wall.mp3
muzyka braz/Before_the_Forge.mp3
muzyka braz/Beneath_the_Cairn.mp3
muzyka braz/Breath_of_the_Bone_Flute.mp3
muzyka braz/Bronze_and_Brine.mp3
muzyka braz/Copper_Weight_of_Noon.mp3
muzyka braz/Fields_of_Copper_Bells.mp3
muzyka braz/First_Light_on_River_Stone.mp3
muzyka braz/First_Light_on_Stone.mp3
muzyka braz/Forge_at_Dusk.mp3
muzyka braz/Rites_of_the_Bronze_Throne.mp3
muzyka braz/Spears_Against_Timber.mp3
muzyka braz/Sunlight_on_Bronze.mp3
muzyka braz/The_Copper_Vanguard.mp3
muzyka braz/The_Merchant_s_Quay.mp3
muzyka braz/The_Silent_Accord.mp3
muzyka braz/The_Smith's_Measure.mp3
muzyka braz/Throne_of_Bronze.mp3
muzyka braz/Tracking_The_Herd.mp3
muzyka braz/Valley_of_First_Light.mp3
muzyka braz/Watching_the_Stone_Gate.mp3
muzyka braz/When_the_River_Took.mp3
```

Potwierdza: plik `muzyka braz/The_Smith's_Measure.mp3` istnieje w archiwum pod dokładnie
tą nazwą (apostrof w nazwie).

## Dowód mocniejszy niż nazwa/rozmiar — md5 bajt-w-bajt

`unrar x` na tym pliku ponownie ucina nazwę do `The_Smith` (ten sam błąd/limitacja
`unrar 7.00` co przy pierwotnym imporcie — prawdopodobnie apostrof w nazwie pliku
wewnątrz archiwum). Zawartość jednak wyekstrahowana poprawnie:

```
$ md5sum "/tmp/verify-braz-full/muzyka braz/The_Smith"
eef36d8c60e750e655cf2a43bb258579

$ md5sum gra/src/audio/utwory/braz/The_Smiths_Measure.mp3
eef36d8c60e750e655cf2a43bb258579
```

**Md5 identyczne.** Plik zacommitowany do repo jako `The_Smiths_Measure.mp3` jest
bajt-w-bajt tym samym plikiem co `muzyka braz/The_Smith's_Measure.mp3` z oryginalnego
archiwum właściciela — nie tylko zgodny nazwą/rozmiarem (jak w pierwotnym, słabszym
dowodzie), tylko kryptograficznie identyczny.

**Zarzut #4 zamknięty jako w pełni zweryfikowany, zero rozbieżności.**
