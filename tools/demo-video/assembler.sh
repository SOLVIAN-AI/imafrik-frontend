#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════════════
#  Assemblage de la vidéo de démonstration.
#
#  Reprend la prise de Playwright (playwright.demo.config.ts,
#  e2e/demo/video.spec.ts) et en tire les livrables :
#
#    imafrik-demo.mp4   H.264 (profil High), 1440 × 900, 25 images/s,
#                       coupé aux repères de montage (carton d'ouverture,
#                       carton de fin), fondu d'entrée et de sortie,
#                       piste audio silencieuse (certaines plateformes de
#                       partage refusent une vidéo sans son), lecture
#                       progressive (`+faststart`) ;
#    imafrik-demo.webm  la prise brute de Playwright (VP9), non coupée ;
#    NN-*.png           les captures clés prises pendant le tournage.
#
#  Usage :
#    tools/demo-video/assembler.sh [PRISE] [DESTINATION]
#
#    PRISE        répertoire de sortie de Playwright (défaut :
#                 $DEMO_VIDEO_OUT, sinon test-results/demo-video) ;
#    DESTINATION  répertoire des livrables (défaut :
#                 test-results/demo-video-livrables, ignoré par git).
#
#  ffmpeg : $FFMPEG s'il est défini, sinon le premier qui sait encoder
#  en H.264 (libx264) parmi celui du système et ceux de Playwright
#  (/opt/pw-browsers/ffmpeg-*, ~/.cache/ms-playwright/ffmpeg-*). Les
#  ffmpeg de Playwright n'encodent que le VP8 et le VP9 : à défaut d'un
#  ffmpeg système, installer `ffmpeg-static` hors du dépôt et passer
#  FFMPEG=<chemin>/node_modules/ffmpeg-static/ffmpeg.
# ══════════════════════════════════════════════════════════════════════

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
TAKE="${1:-${DEMO_VIDEO_OUT:-$ROOT/test-results/demo-video}}"
DEST="${2:-$ROOT/test-results/demo-video-livrables}"

#: Fondus d'entrée et de sortie, en secondes.
FADE_IN=0.6
FADE_OUT=0.9

#: Qualité de l'encodage : CRF 18 est visuellement sans perte pour une
#: interface (texte fin, aplats) ; `slow` gagne en taille à qualité égale.
CRF=18
PRESET=slow

die() {
  echo "assembler : $*" >&2
  exit 1
}

#: Premier ffmpeg disponible qui sait encoder en H.264.
find_ffmpeg() {
  local candidate
  local -a candidates=()
  [[ -n "${FFMPEG:-}" ]] && candidates+=("$FFMPEG")
  command -v ffmpeg >/dev/null 2>&1 && candidates+=("$(command -v ffmpeg)")
  for candidate in /opt/pw-browsers/ffmpeg-*/ffmpeg-linux \
    "$HOME"/.cache/ms-playwright/ffmpeg-*/ffmpeg-linux; do
    [[ -x "$candidate" ]] && candidates+=("$candidate")
  done
  for candidate in "${candidates[@]}"; do
    # Sortie lue en entier : `grep -q` fermerait le tube trop tôt, et
    # `pipefail` prendrait l'interruption de ffmpeg pour un échec.
    if [[ "$("$candidate" -hide_banner -encoders 2>/dev/null)" == *" libx264 "* ]]; then
      echo "$candidate"
      return 0
    fi
  done
  return 1
}

FFMPEG_BIN="$(find_ffmpeg)" ||
  die "aucun ffmpeg capable d'encoder en H.264 (voir l'en-tête du script)"
FFPROBE_BIN="$(dirname "$FFMPEG_BIN")/ffprobe"
[[ -x "$FFPROBE_BIN" ]] || FFPROBE_BIN="$(command -v ffprobe || true)"

VIDEO="$(find "$TAKE" -name video.webm -print -quit 2>/dev/null)"
[[ -n "$VIDEO" ]] || die "aucune prise (video.webm) dans $TAKE"
SHOT_DIR="$(dirname "$VIDEO")"
MONTAGE="$SHOT_DIR/montage.json"
[[ -f "$MONTAGE" ]] ||
  die "repères de montage absents ($MONTAGE) : la prise a-t-elle abouti ?"

# Repères en millisecondes depuis le début de la prise.
read -r START_MS END_MS < <(
  node -e '
    const m = JSON.parse(require("fs").readFileSync(process.argv[1], "utf8"));
    console.log(m.debutMs, m.finMs);
  ' "$MONTAGE"
)
START="$(awk -v ms="$START_MS" 'BEGIN { printf "%.3f", ms / 1000 }')"
END="$(awk -v ms="$END_MS" 'BEGIN { printf "%.3f", ms / 1000 }')"
if [[ -n "$FFPROBE_BIN" ]]; then
  # La prise peut finir un peu avant le repère (fermeture de la page).
  TAKE_LENGTH="$("$FFPROBE_BIN" -v error -show_entries format=duration \
    -of default=noprint_wrappers=1:nokey=1 "$VIDEO")"
  END="$(awk -v a="$END" -v b="$TAKE_LENGTH" 'BEGIN { printf "%.3f", (a < b ? a : b) }')"
fi
LENGTH="$(awk -v a="$START" -v b="$END" 'BEGIN { printf "%.3f", b - a }')"
FADE_OUT_AT="$(awk -v l="$LENGTH" -v f="$FADE_OUT" 'BEGIN { printf "%.3f", l - f }')"

mkdir -p "$DEST"
echo "assembler : $FFMPEG_BIN, de ${START} s à ${END} s (${LENGTH} s)"

"$FFMPEG_BIN" -hide_banner -loglevel error -y \
  -i "$VIDEO" \
  -f lavfi -i anullsrc=channel_layout=stereo:sample_rate=48000 \
  -filter_complex "[0:v]trim=start=${START}:end=${END},setpts=PTS-STARTPTS,fps=25,fade=t=in:st=0:d=${FADE_IN},fade=t=out:st=${FADE_OUT_AT}:d=${FADE_OUT},format=yuv420p[v]" \
  -map "[v]" -map 1:a -shortest \
  -c:v libx264 -preset "$PRESET" -crf "$CRF" -profile:v high -level:v 4.0 \
  -color_primaries bt709 -color_trc bt709 -colorspace bt709 \
  -c:a aac -b:a 64k \
  -movflags +faststart \
  -metadata title="IMAFRIK, démonstration" \
  -metadata language=fra \
  "$DEST/imafrik-demo.mp4"

cp "$VIDEO" "$DEST/imafrik-demo.webm"
find "$SHOT_DIR" -maxdepth 1 -name '[0-9][0-9]-*.png' -exec cp {} "$DEST/" \;

echo "assembler : livrables dans $DEST"
ls -1 "$DEST"
