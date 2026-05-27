#!/usr/bin/env bash
# Run this on your laptop to upload a Seek APK to a GitHub release and get a download link.
# Prerequisites: gh CLI installed and authenticated (https://cli.github.com)
#
# Usage:
#   ./scripts/upload-apk-to-github.sh /path/to/seek.apk
#   ./scripts/upload-apk-to-github.sh /path/to/seek.apk v2.18.0-test
#
# After uploading, the script prints a download URL you can open or send to your phone.

set -euo pipefail

APK="${1:-}"
TAG="${2:-seek-apk-$(date +%Y%m%d-%H%M%S)}"
REPO="bscheffbuch/seekreactnative"

if [[ -z "$APK" ]]; then
  echo "Usage: $0 /path/to/seek.apk [optional-tag]"
  exit 1
fi

if [[ ! -f "$APK" ]]; then
  echo "Error: APK not found at '$APK'"
  exit 1
fi

if ! command -v gh &>/dev/null; then
  echo "Error: GitHub CLI (gh) not found."
  echo "Install from https://cli.github.com and run 'gh auth login'"
  exit 1
fi

echo "Creating release '$TAG' on $REPO and uploading $APK ..."

gh release create "$TAG" "$APK" \
  --repo "$REPO" \
  --title "Seek APK $TAG" \
  --notes "APK build uploaded from local machine." \
  --prerelease

APK_FILENAME="$(basename "$APK")"
DOWNLOAD_URL="https://github.com/$REPO/releases/download/$TAG/$APK_FILENAME"

echo ""
echo "Done! Download link:"
echo "$DOWNLOAD_URL"
echo ""
echo "Open this URL on your phone or send it via text/email."
