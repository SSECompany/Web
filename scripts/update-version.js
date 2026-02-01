const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// Đọc package.json để lấy version
const packagePath = path.join(__dirname, "..", "package.json");
const versionPath = path.join(__dirname, "..", "public", "version.json");

try {
  const packageJson = JSON.parse(fs.readFileSync(packagePath, "utf8"));
  const currentVersion = packageJson.version;

  // Tạo hash dựa trên thời gian build
  const buildTime = new Date().toISOString();
  const buildHash = crypto
    .createHash("md5")
    .update(buildTime + currentVersion)
    .digest("hex")
    .substring(0, 8);

  const versionData = {
    version: currentVersion,
    buildTime: buildTime,
    buildHash: buildHash,
  };

  // Ghi vào version.json
  fs.writeFileSync(versionPath, JSON.stringify(versionData, null, 2));

  // Inject version vào index.html để client biết version đang chạy (phân biệt bản cũ chưa có)
  const indexPath = path.join(__dirname, "..", "public", "index.html");
  let indexContent = fs.readFileSync(indexPath, "utf8");
  indexContent = indexContent
    .replace(
      /window\.__BUILD_VERSION__\s*=\s*"[^"]*"/,
      `window.__BUILD_VERSION__ = "${currentVersion}"`
    )
    .replace(
      /window\.__BUILD_HASH__\s*=\s*"[^"]*"/,
      `window.__BUILD_HASH__ = "${buildHash}"`
    );
  fs.writeFileSync(indexPath, indexContent);

  console.log("✅ Version updated successfully!");
  console.log(`📦 Version: ${currentVersion}`);
  console.log(`🕒 Build time: ${buildTime}`);
  console.log(`🔨 Build hash: ${buildHash}`);
} catch (error) {
  console.error("❌ Error updating version:", error);
  process.exit(1);
}
