#!/usr/bin/env bash
#
# Creates a least-privilege IAM user for the photo upload scripts and writes
# its access key into .env — the secret is never printed to the terminal.
#
# Requires an AWS CLI profile with IAM admin permissions:
#   ./scripts/aws/setup-uploader.sh <admin-profile-name>
#
# What it does:
#   1. Creates IAM user "travel-photos-uploader" (no-op if it exists)
#   2. Attaches the inline policy from uploader-policy.json
#      (PutObject/GetObject on global-travel/*, ListBucket + read bucket config)
#   3. Creates an access key and swaps it into .env in place (.env.bak kept)
#   4. Verifies the new key can list the bucket
set -euo pipefail

PROFILE="${1:?usage: setup-uploader.sh <admin-profile-name>}"
USER_NAME="travel-photos-uploader"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
ENV_FILE="$ROOT/.env"
POLICY_FILE="$SCRIPT_DIR/uploader-policy.json"

echo "==> using admin identity:"
aws --profile "$PROFILE" sts get-caller-identity --query Arn --output text

echo "==> creating IAM user $USER_NAME (ok if it already exists)"
aws --profile "$PROFILE" iam create-user --user-name "$USER_NAME" >/dev/null 2>&1 \
  || echo "    user already exists"

echo "==> attaching least-privilege policy"
aws --profile "$PROFILE" iam put-user-policy \
  --user-name "$USER_NAME" \
  --policy-name travel-photos-s3-upload \
  --policy-document "file://$POLICY_FILE"

# IAM users max out at 2 access keys — clear old ones so re-runs don't fail.
for old_key in $(aws --profile "$PROFILE" iam list-access-keys --user-name "$USER_NAME" \
    --query 'AccessKeyMetadata[].AccessKeyId' --output text); do
  echo "==> deleting previous access key ${old_key:0:8}..."
  aws --profile "$PROFILE" iam delete-access-key --user-name "$USER_NAME" --access-key-id "$old_key"
done

echo "==> creating access key (secret is written to .env, never displayed)"
CREDS_JSON="$(aws --profile "$PROFILE" iam create-access-key --user-name "$USER_NAME" --output json)"

cp "$ENV_FILE" "$ENV_FILE.bak"
NEW_ID="$CREDS_JSON" python3 - "$ENV_FILE" <<'PY'
import json, os, re, sys
creds = json.loads(os.environ["NEW_ID"])["AccessKey"]
path = sys.argv[1]
text = open(path).read()
text = re.sub(r"(?m)^AWS_ACCESS_KEY_ID=.*$", f"AWS_ACCESS_KEY_ID={creds['AccessKeyId']}", text)
text = re.sub(r"(?m)^AWS_SECRET_ACCESS_KEY=.*$", f"AWS_SECRET_ACCESS_KEY={creds['SecretAccessKey']}", text)
open(path, "w").write(text)
print("    .env updated (backup at .env.bak)")
PY
unset CREDS_JSON

echo "==> verifying new key against the bucket (keys can take ~10s to propagate)"
for attempt in 1 2 3 4 5 6; do
  if env -i PATH="$PATH" HOME="$HOME" bash -c \
      "set -a; source '$ENV_FILE' >/dev/null 2>&1; set +a; unset AWS_PROFILE; \
       aws s3api list-objects-v2 --bucket global-travel --max-items 1 --query 'KeyCount' --output text" \
      >/dev/null 2>&1; then
    echo "==> SUCCESS: new key works. npm run add-photos is back in business."
    exit 0
  fi
  sleep 5
done

echo "==> key created and written to .env, but verification failed after 30s."
echo "    Try: npm run add-photos -- --help  (or node scripts/verify-s3-access.js)"
exit 1
