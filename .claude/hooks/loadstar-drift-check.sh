#!/bin/bash
# loadstar-drift-check.sh
# PostToolUse hook: 소스코드 수정 시 LOADSTAR 메타데이터 갱신 리마인더

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

if [[ -z "$FILE_PATH" ]]; then
  exit 0
fi

# 메타데이터/설정 파일은 무시
if [[ "$FILE_PATH" == *".loadstar"* || "$FILE_PATH" == *".claude"* ]]; then
  exit 0
fi

BASENAME=$(basename "$FILE_PATH")
case "$BASENAME" in
  go.mod|go.sum|pom.xml|package.json|package-lock.json|*.json|*.yaml|*.yml|*.toml|*.md|*.txt|*.css|LICENSE|.gitignore)
    exit 0
    ;;
esac

echo "[LOADSTAR] 소스 파일 수정됨: $FILE_PATH"
echo "[LOADSTAR] 작업 착수 전 대상 WayPoint TODO에 작업 항목을 [ ]로 등록했는지 확인하세요."
echo "[LOADSTAR] 작업 완료 후 [x] YYYY-MM-DD로 체크하고, 필요 시 STATUS를 갱신하세요."

exit 0
