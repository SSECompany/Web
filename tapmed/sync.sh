#!/bin/bash
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)

echo "🚀 ĐANG ĐẨY CODE LÊN REPO CŨ (huudat2903)..."
git push origin "$CURRENT_BRANCH"

echo ""
echo "🚀 ĐANG ĐẨY CODE LÊN REPO MỚI (SSECompany)..."
SYNC_DIR="$HOME/.sse_sync_web_tapmed"

# Clone repo SSE nếu chưa có để đồng bộ
if [ ! -d "$SYNC_DIR" ]; then
    echo "Đang tải repo SSE lần đầu..."
    git clone https://github.com/SSECompany/Web.git "$SYNC_DIR"
else
    # Nếu có rồi thì pull code mới nhất về
    cd "$SYNC_DIR" && git pull origin master && cd - > /dev/null
fi

# Copy toàn bộ code hiện tại (trừ thư mục .git và node_modules) sang thư mục SSE
echo "Đang copy các thay đổi..."
rsync -a --exclude='.git' --exclude='node_modules' ./ "$SYNC_DIR/tapmed/"

# Đẩy lên SSE
cd "$SYNC_DIR"
git add .
git commit -m "Auto sync tapmed từ nhánh $CURRENT_BRANCH của huudat2903"
git push origin master

echo ""
echo "✅ ĐÃ HOÀN TẤT! Code của bạn đã nằm trên cả 2 nơi."
