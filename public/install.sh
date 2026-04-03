#!/usr/bin/env bash
# OpenSearch Doctor Agent — One-line installer for Linux
# Usage: curl -sSL https://opensearchdoctor.com/install.sh | bash
#
# The script will download the agent binary and launch the interactive
# setup wizard (--init) which guides you through the full configuration.

set -euo pipefail

REPO="opensearch-doctor/agent"
INSTALL_DIR="/usr/local/bin"
BINARY_NAME="opensearch-doctor-agent"
BINARY_PATH="${INSTALL_DIR}/${BINARY_NAME}"
SERVICE_NAME="opensearch-doctor-agent"

# ── Colours ───────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BOLD='\033[1m'; RESET='\033[0m'

info()    { echo -e "  ${GREEN}›${RESET} $*"; }
warn()    { echo -e "  ${YELLOW}!${RESET} $*"; }
error()   { echo -e "  ${RED}✗${RESET} $*" >&2; }
success() { echo -e "  ${GREEN}✓${RESET} $*"; }

# ── Banner ────────────────────────────────────────────────────────────────────
echo
echo -e "${BOLD}┌─────────────────────────────────────────────────┐${RESET}"
echo -e "${BOLD}│   OpenSearch Doctor Agent — Linux Installer     │${RESET}"
echo -e "${BOLD}└─────────────────────────────────────────────────┘${RESET}"
echo

# ── OS check ─────────────────────────────────────────────────────────────────
OS="$(uname -s)"
if [ "$OS" != "Linux" ]; then
  error "This installer only supports Linux."
  echo
  echo "  For macOS or Windows, download the binary manually:"
  echo "  https://opensearchdoctor.com/docs/installation"
  echo
  exit 1
fi

# ── Root / sudo check ─────────────────────────────────────────────────────────
if [ "$EUID" -ne 0 ]; then
  error "This installer needs sudo to install the binary to ${INSTALL_DIR}."
  echo
  echo "  Run with sudo:"
  echo "    curl -sSL https://opensearchdoctor.com/install.sh | sudo bash"
  echo
  exit 1
fi

# ── Architecture detection ────────────────────────────────────────────────────
ARCH="$(uname -m)"
case "$ARCH" in
  x86_64)          ARCH_SUFFIX="amd64" ;;
  aarch64|arm64)   ARCH_SUFFIX="arm64" ;;
  *)
    error "Unsupported architecture: ${ARCH}"
    echo "  Supported: x86_64, aarch64/arm64"
    exit 1
    ;;
esac

# ── Dependency check ──────────────────────────────────────────────────────────
for cmd in curl sha256sum; do
  if ! command -v "$cmd" &>/dev/null; then
    error "Required command not found: ${cmd}"
    echo "  Install it with: apt-get install ${cmd}  or  yum install ${cmd}"
    exit 1
  fi
done

# ── Fetch latest release version ─────────────────────────────────────────────
info "Fetching latest release version..."
LATEST_URL="https://api.github.com/repos/${REPO}/releases/latest"
VERSION="$(curl -fsSL "$LATEST_URL" | grep '"tag_name"' | sed -E 's/.*"([^"]+)".*/\1/')"

if [ -z "$VERSION" ]; then
  error "Could not determine latest release version."
  echo "  Check your internet connection or visit:"
  echo "  https://github.com/${REPO}/releases/latest"
  exit 1
fi

info "Latest version: ${VERSION}"

# ── Download binary ───────────────────────────────────────────────────────────
BINARY_FILENAME="agent-linux-${ARCH_SUFFIX}"
DOWNLOAD_URL="https://github.com/${REPO}/releases/download/${VERSION}/${BINARY_FILENAME}"
CHECKSUM_URL="https://github.com/${REPO}/releases/download/${VERSION}/checksums.txt"

TMP_DIR="$(mktemp -d)"
TMP_BINARY="${TMP_DIR}/${BINARY_NAME}"
TMP_CHECKSUMS="${TMP_DIR}/checksums.txt"

cleanup() { rm -rf "$TMP_DIR"; }
trap cleanup EXIT

info "Downloading agent binary (linux/${ARCH_SUFFIX})..."
if ! curl -fsSL --retry 3 --retry-delay 2 -o "$TMP_BINARY" "$DOWNLOAD_URL"; then
  error "Download failed: ${DOWNLOAD_URL}"
  echo "  Check your internet connection or visit:"
  echo "  https://github.com/${REPO}/releases/latest"
  exit 1
fi

# ── Checksum verification ─────────────────────────────────────────────────────
info "Verifying checksum..."
if curl -fsSL --retry 3 -o "$TMP_CHECKSUMS" "$CHECKSUM_URL" 2>/dev/null; then
  EXPECTED="$(grep "${BINARY_FILENAME}" "$TMP_CHECKSUMS" | awk '{print $1}')"
  ACTUAL="$(sha256sum "$TMP_BINARY" | awk '{print $1}')"
  if [ -n "$EXPECTED" ] && [ "$EXPECTED" != "$ACTUAL" ]; then
    error "Checksum mismatch — download may be corrupted."
    echo "  Expected: ${EXPECTED}"
    echo "  Actual:   ${ACTUAL}"
    exit 1
  fi
  success "Checksum verified"
else
  warn "Could not fetch checksums.txt — skipping verification"
fi

# ── Install binary ────────────────────────────────────────────────────────────
chmod +x "$TMP_BINARY"

UPDATING=false
if [ -f "$BINARY_PATH" ]; then
  UPDATING=true
  info "Updating existing installation at ${BINARY_PATH}..."
  # Stop service if running so the binary can be replaced
  if systemctl is-active --quiet "$SERVICE_NAME" 2>/dev/null; then
    systemctl stop "$SERVICE_NAME" || true
  fi
else
  info "Installing to ${BINARY_PATH}..."
fi

mv "$TMP_BINARY" "$BINARY_PATH"
success "Binary installed: ${BINARY_PATH}"

# ── Update mode: restart service and exit ────────────────────────────────────
if [ "$UPDATING" = true ]; then
  echo
  success "Agent updated to ${VERSION}"
  if systemctl is-enabled --quiet "$SERVICE_NAME" 2>/dev/null; then
    systemctl start "$SERVICE_NAME"
    success "Service restarted"
    echo
    echo "  Check status:"
    echo "    sudo systemctl status ${SERVICE_NAME}"
    echo "    sudo journalctl -u ${SERVICE_NAME} -f"
  else
    echo
    echo "  Start the agent manually:"
    echo "    ${BINARY_PATH} --config /etc/opensearch-doctor/config.yaml"
  fi
  echo
  exit 0
fi

# ── Fresh install: run interactive setup ──────────────────────────────────────
echo
success "Binary ready. Launching setup wizard..."
echo
echo "────────────────────────────────────────────────────────────────────────"
echo

exec "$BINARY_PATH" --init --config /etc/opensearch-doctor/config.yaml
