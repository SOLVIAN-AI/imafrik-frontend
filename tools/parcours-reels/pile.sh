#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════════════
#  Pile des parcours réels : Supabase local, API du backend, stockage.
#
#  Démarre, sur la machine de CI, tout ce que les parcours réels
#  (playwright.reel.config.ts, e2e/reel/) exigent, et rien de distant :
#
#    supabase   le Supabase local du backend (CLI), migrations et jeu de
#               départ du backend appliqués ; ses clés de démonstration,
#               générées par la CLI, sont écrites dans pile.env. Peut
#               tourner en arrière-plan pendant les installations :
#               `attendre-supabase` en attend la fin ;
#    exporter   verse pile.env dans $GITHUB_ENV, secrets masqués ;
#    services   Redis, un stockage compatible S3 (MinIO, à la place de
#               R2) et un viewer factice, page statique sur 127.0.0.1:3100 ;
#    api        l'API, depuis son image de production (WeasyPrint, Pango
#               et Cairo compris), en réseau hôte ; attend sa sonde ;
#    arret-api  arrête l'API (parcours de panne) ;
#    journaux   recopie les journaux des conteneurs dans le répertoire
#               de la pile, pour l'artefact d'un échec.
#
#  Variables :
#    BACKEND_DIR  extraction du dépôt backend (obligatoire pour supabase) ;
#    PILE_DIR     répertoire de travail (défaut : $RUNNER_TEMP/pile) ;
#    API_IMAGE    image de l'API, construite au préalable (défaut :
#                 imafrik-api:parcours).
#
#  Les secrets (webhook, stockage, copies de secours) sont tirés au
#  hasard à chaque exécution : aucun n'existe ailleurs que sur la machine
#  de CI, le temps du travail.
#
#  Ne pas lancer sur un poste partagé : la commande démarre des conteneurs
#  sur les ports standard du Supabase local (54321 à 54324).
# ══════════════════════════════════════════════════════════════════════

set -euo pipefail

PILE_DIR="${PILE_DIR:-${RUNNER_TEMP:-/tmp}/pile}"
API_IMAGE="${API_IMAGE:-imafrik-api:parcours}"
ENV_FILE="$PILE_DIR/pile.env"
SECRETS_FILE="$PILE_DIR/pile.secrets"

#: Conteneurs démarrés hors de la CLI Supabase.
API_CONTAINER=imafrik-api-parcours
REDIS_CONTAINER=imafrik-redis-parcours
S3_CONTAINER=imafrik-s3-parcours

#: Images épinglées : un parcours qui change d'outil sans qu'on le décide
#: échouerait pour une raison étrangère à l'application.
REDIS_IMAGE=redis:7.4-alpine
S3_IMAGE=minio/minio:RELEASE.2025-04-22T22-12-26Z

#: Ports de la pile, tous sur 127.0.0.1.
API_PORT=8000
S3_PORT=9000
VIEWER_PORT=3100
SITE_URL=http://127.0.0.1:3000

#: Bucket des comptes-rendus signés.
REPORTS_BUCKET=imafrik-reports

#: Services du Supabase local inutiles aux parcours : moins d'images à
#: tirer, moins de mémoire. Restent la base, GoTrue, PostgREST, Kong et
#: Mailpit.
SUPABASE_EXCLUDED=studio,imgproxy,edge-runtime,logflare,vector,realtime,supavisor,postgres-meta,storage-api

mkdir -p "$PILE_DIR"

log() { printf '\033[1m▸ %s\033[0m\n' "$*"; }

# Inscrit une variable dans pile.env ; un secret est noté comme tel, pour
# être masqué quand `exporter` le verse aux étapes suivantes.
#   publier NOM VALEUR [secret]
publier() {
  local name="$1" value="$2"
  printf '%s=%q\n' "$name" "$value" >> "$ENV_FILE"
  if [ "${3:-}" = secret ]; then
    echo "$name" >> "$SECRETS_FILE"
  fi
}

# Valeur d'une variable déjà inscrite dans pile.env.
lire() {
  # shellcheck disable=SC1090
  (source "$ENV_FILE" && printf '%s' "${!1:-}")
}

# Attend qu'une adresse réponde, au plus N secondes.
#   attendre URL SECONDES LIBELLÉ
attendre() {
  local url="$1" deadline=$((SECONDS + $2))
  until curl -fsS -o /dev/null "$url"; do
    if [ "$SECONDS" -ge "$deadline" ]; then
      echo "$3 ne répond pas sur $url après $2 s" >&2
      return 1
    fi
    sleep 1
  done
}

cmd_supabase() {
  : "${BACKEND_DIR:?BACKEND_DIR manquant}"
  rm -f "$PILE_DIR/supabase.ok" "$PILE_DIR/supabase.ko"
  trap '[ -f "$PILE_DIR/supabase.ok" ] || touch "$PILE_DIR/supabase.ko"' EXIT
  # Plafond d'envoi de courriels relevé, sur l'extraction de CI seulement :
  # celui du développement (deux par heure) ne suffit pas aux parcours, qui
  # reçoivent une invitation et les avis d'enrôlement de chaque second
  # facteur. Un courriel refusé ferait échouer l'invitation, pour une
  # raison étrangère à l'application.
  if [ -n "${CI:-}" ]; then
    sed -i.orig 's/^email_sent = [0-9]*/email_sent = 100/' "$BACKEND_DIR/supabase/config.toml"
    grep -q '^email_sent = 100$' "$BACKEND_DIR/supabase/config.toml"
  fi

  log "Supabase local (migrations et jeu de départ du backend)"
  local started=$SECONDS
  (cd "$BACKEND_DIR" && supabase start --exclude "$SUPABASE_EXCLUDED")
  log "Supabase démarré en $((SECONDS - started)) s"

  local status
  status="$(cd "$BACKEND_DIR" && supabase status -o env)"
  local api_url anon_key service_key jwt_secret db_url mailpit_url
  api_url="$(sed -n 's/^API_URL="\(.*\)"$/\1/p' <<< "$status")"
  anon_key="$(sed -n 's/^ANON_KEY="\(.*\)"$/\1/p' <<< "$status")"
  service_key="$(sed -n 's/^SERVICE_ROLE_KEY="\(.*\)"$/\1/p' <<< "$status")"
  jwt_secret="$(sed -n 's/^JWT_SECRET="\(.*\)"$/\1/p' <<< "$status")"
  db_url="$(sed -n 's/^DB_URL="\(.*\)"$/\1/p' <<< "$status")"
  mailpit_url="$(sed -n 's/^\(MAILPIT\|INBUCKET\)_URL="\(.*\)"$/\2/p' <<< "$status" | head -n1)"
  mailpit_url="${mailpit_url:-http://127.0.0.1:54324}"
  for name in api_url anon_key service_key jwt_secret db_url; do
    if [ -z "${!name}" ]; then
      echo "supabase status : $name introuvable" >&2
      echo "$status" | sed 's/=.*/=…/' >&2
      return 1
    fi
  done

  : > "$ENV_FILE"
  : > "$SECRETS_FILE"
  # Clés de démonstration du Supabase local, générées par la CLI. Masquées
  # quand même : rien n'oblige une future version à les rendre fixes.
  publier E2E_SUPABASE_URL "$api_url"
  publier E2E_SUPABASE_ANON_KEY "$anon_key" secret
  publier E2E_SUPABASE_SERVICE_ROLE_KEY "$service_key" secret
  publier E2E_SUPABASE_JWT_SECRET "$jwt_secret" secret
  publier E2E_DATABASE_URL "$db_url"
  publier E2E_MAILPIT_URL "$mailpit_url"
  publier E2E_API_URL "http://127.0.0.1:$API_PORT"
  publier E2E_WEBHOOK_SECRET "$(openssl rand -hex 24)" secret
  publier E2E_S3_ACCESS_KEY "parcours$(openssl rand -hex 6)"
  publier E2E_S3_SECRET_KEY "$(openssl rand -hex 24)" secret
  publier E2E_ARRET_API "docker stop $API_CONTAINER"

  # Compilation et service de l'application, en mode réel.
  publier NEXT_PUBLIC_SUPABASE_URL "$api_url"
  publier NEXT_PUBLIC_SUPABASE_ANON_KEY "$anon_key"
  publier NEXT_PUBLIC_API_URL "http://127.0.0.1:$API_PORT"
  publier NEXT_PUBLIC_SITE_URL "$SITE_URL"
  publier NEXT_PUBLIC_VIEWER_URL "http://127.0.0.1:$VIEWER_PORT/viewer"
  publier REPORT_BACKUP_SECRET "$(openssl rand -base64 48)" secret
  touch "$PILE_DIR/supabase.ok"
}

# Attend la fin d'un `supabase` lancé en arrière-plan, au plus dix minutes.
cmd_attendre_supabase() {
  local deadline=$((SECONDS + 600))
  until [ -f "$PILE_DIR/supabase.ok" ] || [ -f "$PILE_DIR/supabase.ko" ]; do
    if [ "$SECONDS" -ge "$deadline" ]; then
      echo "Supabase n'a pas démarré en dix minutes" >&2
      return 1
    fi
    sleep 2
  done
  if [ -f "$PILE_DIR/supabase.ko" ]; then
    echo "Le démarrage de Supabase a échoué :" >&2
    cat "$PILE_DIR/supabase.log" >&2 || true
    return 1
  fi
}

# Verse pile.env dans $GITHUB_ENV, en masquant d'abord chaque secret.
cmd_exporter() {
  : "${GITHUB_ENV:?exporter ne sert que sous GitHub Actions}"
  local name value
  while IFS= read -r name; do
    value="$(lire "$name")"
    [ -n "$value" ] && echo "::add-mask::$value"
  done < "$SECRETS_FILE"
  while IFS= read -r line; do
    name="${line%%=*}"
    printf '%s=%s\n' "$name" "$(lire "$name")" >> "$GITHUB_ENV"
  done < "$ENV_FILE"
}

cmd_services() {
  log "Redis"
  docker run -d --name "$REDIS_CONTAINER" -p "127.0.0.1:6379:6379" "$REDIS_IMAGE" > /dev/null

  log "Stockage compatible S3 (MinIO, région « auto » comme R2)"
  docker run -d --name "$S3_CONTAINER" -p "127.0.0.1:$S3_PORT:9000" \
    -e MINIO_ROOT_USER="$(lire E2E_S3_ACCESS_KEY)" \
    -e MINIO_ROOT_PASSWORD="$(lire E2E_S3_SECRET_KEY)" \
    -e MINIO_SITE_REGION=auto \
    "$S3_IMAGE" server /data > /dev/null

  log "Viewer factice sur 127.0.0.1:$VIEWER_PORT"
  mkdir -p "$PILE_DIR/viewer/viewer"
  printf '<!doctype html><html lang="fr"><meta charset="utf-8"><title>Viewer</title><p>Viewer factice des parcours.</p></html>\n' \
    > "$PILE_DIR/viewer/viewer/index.html"
  nohup python3 -m http.server "$VIEWER_PORT" --bind 127.0.0.1 \
    --directory "$PILE_DIR/viewer" > "$PILE_DIR/viewer.log" 2>&1 &

  attendre "http://127.0.0.1:$S3_PORT/minio/health/live" 60 "MinIO"
}

# Environnement de l'API : celui d'un déploiement, pointé sur la pile.
api_env() {
  cat <<EOF
ENV=dev
LOG_LEVEL=INFO
SUPABASE_URL=$(lire E2E_SUPABASE_URL)
SUPABASE_DB_URL=$(lire E2E_DATABASE_URL)
SUPABASE_JWT_SECRET=$(lire E2E_SUPABASE_JWT_SECRET)
SUPABASE_SERVICE_ROLE_KEY=$(lire E2E_SUPABASE_SERVICE_ROLE_KEY)
REDIS_URL=redis://127.0.0.1:6379/0
ORTHANC_URL=http://127.0.0.1:8042
ORTHANC_WEBHOOK_SECRET=$(lire E2E_WEBHOOK_SECRET)
ORTHANC_SERVICE_TOKEN=parcours
RECONCILE_INTERVAL=0
RETENTION_INTERVAL=0
REVOCATION_INTERVAL=0
R2_ENDPOINT_URL=http://127.0.0.1:$S3_PORT
R2_REPORTS_BUCKET=$REPORTS_BUCKET
R2_REPORTS_ACCESS_KEY=$(lire E2E_S3_ACCESS_KEY)
R2_REPORTS_SECRET_KEY=$(lire E2E_S3_SECRET_KEY)
PUBLIC_API_URL=http://127.0.0.1:$API_PORT
APP_URL=$SITE_URL
VIEWER_URL=http://127.0.0.1:$VIEWER_PORT
CORS_ORIGINS=["$SITE_URL"]
EOF
}

cmd_api() {
  api_env > "$PILE_DIR/api.env"
  chmod 600 "$PILE_DIR/api.env"

  log "Bucket des comptes-rendus"
  docker run --rm --network host --env-file "$PILE_DIR/api.env" "$API_IMAGE" python -c "
from app.infra import storage
from app.config import get_settings
storage._client().create_bucket(Bucket=get_settings().r2_reports_bucket)
print('bucket créé')
"

  log "API ($API_IMAGE)"
  docker run -d --name "$API_CONTAINER" --network host \
    --env-file "$PILE_DIR/api.env" "$API_IMAGE" > /dev/null
  if ! attendre "http://127.0.0.1:$API_PORT/health" 60 "L'API"; then
    docker logs "$API_CONTAINER" >&2 || true
    return 1
  fi
  curl -fsS "http://127.0.0.1:$API_PORT/health/deep" || true
  echo
}

cmd_arret_api() {
  docker stop "$API_CONTAINER"
}

cmd_journaux() {
  mkdir -p "$PILE_DIR/journaux"
  for container in $(docker ps -a --format '{{.Names}}'); do
    docker logs "$container" > "$PILE_DIR/journaux/$container.log" 2>&1 || true
  done
  # Fichiers d'environnement retirés : ils portent les secrets de la pile.
  rm -f "$PILE_DIR/api.env"
}

case "${1:-}" in
  supabase) cmd_supabase ;;
  attendre-supabase) cmd_attendre_supabase ;;
  exporter) cmd_exporter ;;
  services) cmd_services ;;
  api) cmd_api ;;
  arret-api) cmd_arret_api ;;
  journaux) cmd_journaux ;;
  *)
    echo "usage : $0 {supabase|attendre-supabase|exporter|services|api|arret-api|journaux}" >&2
    exit 2
    ;;
esac
