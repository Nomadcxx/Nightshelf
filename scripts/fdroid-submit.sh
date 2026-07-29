#!/usr/bin/env bash
#
# Drive the F-Droid submission end to end.
#
#   ./scripts/fdroid-submit.sh validate   lint the metadata against fdroiddata
#   ./scripts/fdroid-submit.sh build      build it the way F-Droid will
#   ./scripts/fdroid-submit.sh submit     fork, push and open the merge request
#   ./scripts/fdroid-submit.sh push       push only, open the request by hand
#   ./scripts/fdroid-submit.sh rfp        open a Request For Packaging issue
#
# validate and build need nothing but a local checkout and Docker.
#
# submit and rfp call the GitLab API, which needs a credential carrying the
# 'api' scope. It is taken from FDROID_GITLAB_TOKEN, or from whatever
# credential helper already handles gitlab.com. Helper tokens are commonly
# scoped to repository access only, which is enough to push and not enough to
# fork or to open a merge request; submit checks and says so rather than
# failing halfway. Use push in that case.
#
# Run build before submit. It uses F-Droid's own buildserver image, so a pass
# here means the recipe works on their infrastructure rather than only on a
# machine that happens to have the right JDK. It is slow and worth it: a
# submission that fails to build is the most common way a first merge request
# stalls.
set -euo pipefail

PACKAGE=com.nightshelf.app
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FDROIDDATA="${FDROIDDATA:-$HOME/fdroiddata}"
FDROIDSERVER="${FDROIDSERVER:-$HOME/fdroidserver}"
TOKEN_FILE="${FDROID_GITLAB_TOKEN_FILE:-$HOME/.config/nightshelf/gitlab-token}"
METADATA="$ROOT/docs/fdroid/$PACKAGE.yml"
UPSTREAM=fdroid%2Ffdroiddata
RFP=fdroid%2Frfp
API=https://gitlab.com/api/v4

die() { printf '\n%s\n' "$*" >&2; exit 1; }
have() { command -v "$1" >/dev/null 2>&1; }

need_fdroiddata() {
  [ -d "$FDROIDDATA/metadata" ] || die \
"No fdroiddata checkout at $FDROIDDATA

  git clone --depth=1 https://gitlab.com/fdroid/fdroiddata.git $FDROIDDATA

Set FDROIDDATA to point somewhere else."
}

# Falls back to whatever credential helper already handles gitlab.com, so a
# machine with Git Credential Manager set up may need no new token. Helper
# tokens are often scoped to repository access only, though, and forking plus
# opening a merge request needs 'api'. cmd_submit checks before relying on it.
gitlab_token() {
  if [ -n "${FDROID_GITLAB_TOKEN:-}" ]; then
    printf '%s' "$FDROID_GITLAB_TOKEN"
    return
  fi
  # A file is the safest of the three. An exported variable leaks into `ps` and
  # into shell history, and pasting a token into a chat or a terminal puts it
  # somewhere it cannot be taken back from.
  if [ -r "$TOKEN_FILE" ]; then
    tr -d '\r\n' < "$TOKEN_FILE"
    return
  fi
  printf 'protocol=https\nhost=gitlab.com\n\n' \
    | git credential fill 2>/dev/null \
    | sed -n 's/^password=//p'
}

need_token() {
  FDROID_GITLAB_TOKEN="$(gitlab_token)"
  [ -n "$FDROID_GITLAB_TOKEN" ] || die \
"No gitlab.com credential found.

Either let your credential helper supply one, or create a personal access
token with 'api' scope at
  https://gitlab.com/-/user_settings/personal_access_tokens
and run:
  export FDROID_GITLAB_TOKEN=...

Read from the environment or the helper, never written to disk by this script."

  # A repository-scoped token authenticates fine for pushing and then fails
  # opaquely on the fork call. Say so now instead.
  if ! api GET user >/dev/null 2>&1; then
    die "That gitlab.com credential cannot call the API, so it cannot fork
fdroiddata or open a merge request. It is probably scoped to repository access
only, which is what credential helpers usually request.

Two ways on:
  - create a token with 'api' scope and export FDROID_GITLAB_TOKEN, then
    rerun 'submit'
  - or run './scripts/fdroid-submit.sh push', fork fdroiddata once in the
    browser, and open the merge request from the link it prints"
  fi
}

# Regenerate from android/app/build.gradle, so the file under review can never
# claim a version the build does not produce.
stage_metadata() {
  python3 "$ROOT/scripts/fdroid-metadata.py"
}

# A workspace holding only our metadata, plus fdroiddata's config so category
# and anti-feature names resolve. `fdroid readmeta` parses every app in the
# checkout, and an unrelated app with a malformed field takes the whole run
# down with it; at the time of writing a bad Bitcoin address in
# app.michaelwuensch.bitbanana did exactly that. Validating one file in
# isolation keeps this about our submission.
WORKSPACE="${TMPDIR:-/tmp}/nightshelf-fdroid-validate"

cmd_validate() {
  need_fdroiddata
  have fdroid || die "fdroidserver is not installed. Try: pipx install fdroidserver"
  stage_metadata

  rm -rf "$WORKSPACE"
  mkdir -p "$WORKSPACE/metadata"
  cp -r "$FDROIDDATA/config" "$WORKSPACE/config"
  [ -f "$FDROIDDATA/config.yml" ] && install -m 600 "$FDROIDDATA/config.yml" "$WORKSPACE/config.yml"
  cp "$METADATA" "$WORKSPACE/metadata/$PACKAGE.yml"

  cd "$WORKSPACE"
  echo "==> readmeta"
  fdroid readmeta
  echo "==> rewritemeta"
  fdroid rewritemeta "$PACKAGE"
  # The generator emits F-Droid's canonical form, so rewritemeta should be a
  # no-op. If it is not, the generator has drifted and needs updating rather
  # than the output being patched by hand.
  if ! diff -u "$METADATA" "$WORKSPACE/metadata/$PACKAGE.yml"; then
    die "rewritemeta changed the file. Update render() in scripts/fdroid-metadata.py
to match the canonical form above, then run validate again."
  fi
  echo "    unchanged, already canonical"
  echo "==> lint"
  fdroid lint "$PACKAGE"
  echo
  echo "Metadata is valid."
}

cmd_build() {
  need_fdroiddata
  have docker || die "Docker is needed to run F-Droid's buildserver image."
  stage_metadata
  mkdir -p "$FDROIDDATA/metadata"
  cp "$METADATA" "$FDROIDDATA/metadata/$PACKAGE.yml"
  local version_code
  version_code=$(grep -oP 'versionCode\s+\K\d+' "$ROOT/android/app/build.gradle")

  # The buildserver image carries the toolchain but not fdroidserver itself;
  # the documented flow mounts a checkout in. Same as the quick start guide.
  [ -d "$FDROIDSERVER" ] || \
    git clone --depth=1 https://gitlab.com/fdroid/fdroidserver "$FDROIDSERVER"

  echo "==> building $PACKAGE:$version_code in the F-Droid buildserver"
  echo "    the first run pulls a multi-gigabyte image"
  # --on-server is what makes the recipe's sudo block actually run. Without it
  # fdroid prints "these commands were skipped because fdroid build is not
  # running on a dedicated build server" and carries on, so the build dies
  # later on a missing toolchain and the recipe looks broken when it is not.
  # Fine to pass here because the container is disposable.
  docker run --rm -u vagrant --entrypoint /bin/bash \
    -v "$FDROIDDATA":/build:z \
    -v "$FDROIDSERVER":/home/vagrant/fdroidserver:Z \
    registry.gitlab.com/fdroid/fdroidserver:buildserver \
    -lc '. /etc/profile
         export PATH="$fdroidserver:$PATH" PYTHONPATH="$fdroidserver"
         export JAVA_HOME=$(java -XshowSettings:properties -version 2>&1 >/dev/null \
           | grep "java.home" | awk -F= "{print \$2}" | tr -d " ")
         cd /build && fdroid build --verbose --on-server '"$PACKAGE:$version_code"
}

api() {
  local method=$1 path=$2; shift 2
  curl -sS --fail-with-body -X "$method" \
    -H "PRIVATE-TOKEN: $FDROID_GITLAB_TOKEN" \
    -H 'Content-Type: application/json' \
    "$API/$path" "$@"
}

cmd_submit() {
  need_token; need_fdroiddata
  have jq || die "jq is needed to read GitLab's responses."
  cmd_validate

  local user fork_path branch
  user=$(api GET user | jq -r .username)
  branch="$PACKAGE"
  fork_path="$user%2Ffdroiddata"

  echo "==> forking fdroiddata as $user"
  if ! api GET "projects/$fork_path" >/dev/null 2>&1; then
    api POST "projects/$UPSTREAM/fork" >/dev/null
    echo -n "    waiting for the fork to import"
    for _ in $(seq 1 60); do
      if api GET "projects/$fork_path" 2>/dev/null | jq -e '.import_status=="finished" or .import_status=="none"' >/dev/null; then
        echo; break
      fi
      echo -n .; sleep 5
    done
  else
    echo "    fork already exists"
  fi

  echo "==> pushing $branch"
  cd "$FDROIDDATA"
  # Branch before committing, so a rerun does not leave the local default
  # branch sitting ahead of upstream with our commit on it.
  git checkout -q -B "$branch"
  cp "$METADATA" "metadata/$PACKAGE.yml"
  git add "metadata/$PACKAGE.yml"
  git -c user.email=noreply@localhost -c user.name="$user" \
    commit -q -m "New App: $PACKAGE" || echo "    nothing new to commit"
  # Token goes in the URL for this one push and is not stored as a remote.
  # git echoes the remote URL in its progress and hint output, token and all,
  # so that is filtered rather than shown. It ends up in terminal scrollback,
  # CI logs and pasted output otherwise.
  git push -f \
    "https://oauth2:$FDROID_GITLAB_TOKEN@gitlab.com/$user/fdroiddata.git" \
    "$branch" 2>&1 | sed "s|$FDROID_GITLAB_TOKEN|***|g"

  echo "==> opening the merge request"
  local target_id target_branch body url
  target_id=$(api GET "projects/$UPSTREAM" | jq .id)
  # Read rather than assume: fdroiddata is on master today, and a project that
  # renames its default branch would otherwise break this silently.
  target_branch=$(api GET "projects/$UPSTREAM" | jq -r .default_branch)
  body=$(jq -n --arg d "$(cat "$ROOT/docs/fdroid/merge-request.md")" '$d')
  url=$(api POST "projects/$fork_path/merge_requests" -d "$(jq -n \
      --arg sb "$branch" --arg tb "$target_branch" \
      --arg t "New App: NightShelf ($PACKAGE)" \
      --argjson tid "$target_id" --argjson desc "$body" \
      '{source_branch:$sb, target_branch:$tb, title:$t,
        description:$desc, target_project_id:$tid,
        remove_source_branch:true}')" | jq -r .web_url)
  echo
  echo "Merge request: $url"
}

# For when the available credential can push but not call the API. Does the
# repository half and leaves the two clicks to a browser.
cmd_push() {
  need_fdroiddata
  have git || die "git is missing."
  cmd_validate
  local token user
  token="$(gitlab_token)"
  [ -n "$token" ] || die "No gitlab.com credential found for pushing."
  read -rp "Your gitlab.com username: " user
  [ -n "$user" ] || die "Need the username to know where to push."

  cd "$FDROIDDATA"
  git checkout -q -B "$PACKAGE"
  cp "$METADATA" "metadata/$PACKAGE.yml"
  git add "metadata/$PACKAGE.yml"
  git -c user.email=noreply@localhost -c user.name="$user" \
    commit -q -m "New App: $PACKAGE" || echo "    nothing new to commit"
  # Filtered: git prints the remote URL, token included, in its own output.
  git push -f \
    "https://oauth2:$token@gitlab.com/$user/fdroiddata.git" "$PACKAGE" 2>&1 \
    | sed "s|$token|***|g" || die \
"Push failed. Fork https://gitlab.com/fdroid/fdroiddata to $user first, then
rerun this."

  cat <<EOF

Pushed metadata/$PACKAGE.yml to $user/fdroiddata on branch $PACKAGE.

Open the merge request here, targeting fdroid/fdroiddata master:
  https://gitlab.com/$user/fdroiddata/-/merge_requests/new?merge_request%5Bsource_branch%5D=$PACKAGE

Paste docs/fdroid/merge-request.md as the description.
EOF
}

cmd_rfp() {
  need_token
  have jq || die "jq is needed to read GitLab's responses."
  local url
  url=$(api POST "projects/$RFP/issues" -d "$(jq -n \
      --arg t "NightShelf" \
      --arg d "$(cat "$ROOT/docs/fdroid/merge-request.md")" \
      '{title:$t, description:$d}')" | jq -r .web_url)
  echo "Request For Packaging: $url"
}

case "${1:-}" in
  validate) cmd_validate ;;
  build)    cmd_build ;;
  submit)   cmd_submit ;;
  push)     cmd_push ;;
  rfp)      cmd_rfp ;;
  *) sed -n '3,12p' "${BASH_SOURCE[0]}" | sed 's/^# \?//'; exit 1 ;;
esac
