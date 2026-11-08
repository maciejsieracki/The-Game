#!/usr/bin/env bash
# Przekodowanie 19 plikow PACK2 (konwencja R-WEB-DIPLO-CIV-MUSIC-Q1 obrona R1, commit 5651fbb35).
# Uzycie: transcode-pack2.sh <katalog paczki muzyka-cywilizacji> <gra/src/audio/utwory/dyplomacja/_civ>
# negocjacje 64k, przywitania 96k, silenceremove -50 dB / 50 ms na obu koncach, bez metadanych.
set -euo pipefail
SRC="$1"; DST="$2"
F='silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.05,areverse,silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.05,areverse'
enc() { # in out kbps
  mkdir -p "$(dirname "$2")"
  ffmpeg -nostdin -loglevel error -y -i "$1" -vn -map_metadata -1 -af "$F" -c:a libmp3lame -b:a "$3" -joint_stereo 1 "$2"
}
for c in asyria babilonia celtowie fenicjanie germanie harappa hetyci slowianie; do
  enc "$SRC/$c/${c}_przywitanie.mp3" "$DST/$c/${c}_przywitanie.mp3" 96k
  enc "$SRC/$c/${c}_negocjacje.mp3"  "$DST/$c/${c}_negocjacje.mp3"  64k
done
enc "$SRC/sumerowie/sumerowie_negocjacje.mp3" "$DST/sumer/sumer_negocjacje.mp3" 64k
enc "$SRC/inkowie/inkowie_przywitanie.mp3"    "$DST/inkowie/inkowie_przywitanie.mp3" 96k
enc "$SRC/zulusi/zulusi_przywitanie_2.mp3"    "$DST/zulusi/zulusi_przywitanie_2.mp3" 96k
