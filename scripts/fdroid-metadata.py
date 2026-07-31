#!/usr/bin/env python3
"""
Generate the F-Droid metadata file for the initial submission.

Writes docs/fdroid/com.nightshelf.app.yml, which is what gets copied into a
fork of gitlab.com/fdroid/fdroiddata as metadata/com.nightshelf.app.yml.

Version numbers come from android/app/build.gradle rather than being typed
here, because a metadata file claiming a version the build does not produce is
the failure this script exists to prevent.

Scope, so nobody expects more of this than it does: F-Droid appends new Builds
entries itself once the app is listed, driven by the UpdateCheckMode and
AutoUpdateMode fields below. Regenerating after that point tells you what a
first submission would look like today, not what is in fdroiddata. The file
that matters after the merge lives in fdroiddata, not here.

  ./scripts/fdroid-metadata.py            write the file
  ./scripts/fdroid-metadata.py --check    fail if the committed copy is stale
"""
import os
import pathlib
import re
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
GRADLE = ROOT / 'android' / 'app' / 'build.gradle'
OUT = ROOT / 'docs' / 'fdroid' / 'com.nightshelf.app.yml'
FASTLANE = ROOT / 'fastlane' / 'metadata' / 'android' / 'en-US'

PACKAGE = 'com.nightshelf.app'
REPO = 'https://github.com/Nomadcxx/Nightshelf'

# SHA-256 of the release signing certificate, from
#   apksigner verify --print-certs <apk>
# Binaries plus this is what makes the build reproducible in F-Droid's sense:
# they build from source, compare against the APK released here, and ship ours
# under this signature if the two match. It is not a secret. It also cannot
# change without every installed user having to uninstall first, so losing the
# keystore ends the app.
SIGNING_KEY = 'dc0cb43a701f85bfd81654aeb0dec815ca860a044f13a5fc84f21485356bf550'

# The buildserver image ships JDK 21 but no Node at all, so the recipe installs
# it from Debian. The image is trixie, which carries nodejs 20.19 and npm 9.2;
# npm 9 reads this repo's lockfileVersion 3 lockfile, so `npm ci` is happy. An
# earlier revision downloaded a tarball from nodejs.org with a pinned checksum,
# which F-Droid asked us not to do: apt is already trusted by the image, and a
# third-party download is one more thing for them to audit.


def gradle_value(pattern):
    text = GRADLE.read_text()
    match = re.search(pattern, text)
    if not match:
        sys.exit(f'could not find {pattern!r} in {GRADLE.relative_to(ROOT)}')
    return match.group(1)


def git(*args):
    return subprocess.run(args, cwd=ROOT, capture_output=True, text=True,
                          check=True).stdout.strip()


def build_commit():
    """The full commit hash F-Droid builds from.

    A hash and not a tag, at F-Droid's request: a tag can be moved after review
    and a hash cannot, so the thing they audited is the thing they build. It
    also has to be the commit rather than the tag object, since annotated tags
    resolve to their own hash under rev-parse and F-Droid needs a revision git
    will check out as a tree.

    NIGHTSHELF_FDROID_COMMIT overrides it with any commit-ish, which is how a
    recipe gets verified through `fdroid build` before a tag exists. F-Droid
    clones the named revision, so without this the only way to test a recipe
    change would be to publish a tag and hope.
    """
    override = os.environ.get('NIGHTSHELF_FDROID_COMMIT')
    if override:
        return git('git', 'rev-list', '-n1', override)
    try:
        tag = git('git', 'describe', '--tags', '--abbrev=0')
    except subprocess.CalledProcessError:
        return None
    return git('git', 'rev-list', '-n1', tag)


def render(version_name, version_code, commit):
    """Emit exactly what `fdroid rewritemeta` produces.

    AutoName has to equal what `fdroid checkupdates` derives from the app's
    manifest label, which is the app_name string resource: "Nightshelf", with a
    lowercase s, unlike the "NightShelf" used everywhere else. Their CI runs
    checkupdates and fails on any diff it produces, so a mismatch here is a red
    pipeline. The name users see comes from fastlane title.txt, not from this.

    Field order, the scalar-versus-list choices and the line fold in prebuild
    are all F-Droid's canonical form, not preferences. Matching it byte for
    byte means `fdroid-submit.sh validate` can assert the file survives
    rewritemeta untouched, which is a real check rather than a diff to squint
    at. YAML comments are absent for the same reason: rewritemeta strips them.
    """
    return f"""\
Categories:
  - Multimedia
License: GPL-3.0-only
AuthorName: Nomadcxx
SourceCode: {REPO}
IssueTracker: {REPO}/issues
Changelog: {REPO}/releases

AutoName: Nightshelf

RepoType: git
Repo: {REPO}.git
Binaries: {REPO}/releases/download/v%v/nightshelf-v%v.apk

Builds:
  - versionName: {version_name}
    versionCode: {version_code}
    commit: {commit}
    subdir: android/app
    sudo:
      - apt-get update
      - apt-get install -y npm
    init:
      - cd ../..
      - npm ci
    gradle:
      - yes
    prebuild:
      - cd ../..
      - ./node_modules/.bin/nuxt generate
      - npx cap sync android
    scandelete:
      - node_modules

AllowedAPKSigningKeys: {SIGNING_KEY}

AutoUpdateMode: Version
UpdateCheckMode: Tags
CurrentVersion: {version_name}
CurrentVersionCode: {version_code}
"""


def main():
    version_name = gradle_value(r'versionName\s+"([^"]+)"')
    version_code = gradle_value(r'versionCode\s+(\d+)')
    commit = build_commit() or f'v{version_name}'

    # package.json drives the version string the drawer shows. It drifted from
    # build.gradle once already, so the app reported 0.1.1-beta while the APK
    # was 0.1.2-beta. Checked here because this script already runs in CI
    # before a tag is allowed to release.
    package_json = (ROOT / 'package.json').read_text()
    declared = re.search(r'"version":\s*"([^"]+)"', package_json).group(1)
    if declared != version_name:
        sys.exit(f'package.json says {declared!r} but build.gradle says '
                 f'{version_name!r}. They are shown in different places in the '
                 f'app, so they have to agree.')

    changelog = FASTLANE / 'changelogs' / f'{version_code}.txt'
    if not changelog.exists():
        sys.exit(f'missing {changelog.relative_to(ROOT)}: F-Droid reads the '
                 f'changelog from the tag it builds, so version code '
                 f'{version_code} needs one before release')

    rendered = render(version_name, version_code, commit)

    if '--check' in sys.argv:
        # The commit field names the revision being released, which cannot be
        # known inside the commit it points at. Comparing it would demand the
        # impossible, and did: the v0.1.3-beta release run failed on exactly
        # that. Everything else has to match.
        def without_commit(text):
            return re.sub(r'^\s*commit:.*$', '', text, flags=re.M)

        current = OUT.read_text() if OUT.exists() else ''
        if without_commit(current) != without_commit(rendered):
            sys.exit(f'{OUT.relative_to(ROOT)} is stale, ignoring the commit '
                     f'field. Run ./scripts/fdroid-metadata.py')
        print(f'  {OUT.relative_to(ROOT)} is current '
              f'({version_name}, code {version_code}); changelog and '
              f'package.json agree')
        return

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(rendered)
    print(f'  {OUT.relative_to(ROOT)}  {version_name}  '
          f'code {version_code}  commit {commit}')


if __name__ == '__main__':
    main()
