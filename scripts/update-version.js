const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const packagePath = path.join(__dirname, "..", "package.json");
const versionPath = path.join(__dirname, "..", "public", "version.json");

try {
  const packageJson = JSON.parse(fs.readFileSync(packagePath, "utf8"));
  const currentVersion = packageJson.version;
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

  fs.writeFileSync(versionPath, JSON.stringify(versionData, null, 2));
  console.log("✅ Version updated successfully!");
  console.log(`📦 Version: ${currentVersion}`);
  console.log(`🕒 Build time: ${buildTime}`);
  console.log(`🔨 Build hash: ${buildHash}`);
} catch (error) {
  console.error("❌ Error updating version:", error);
  process.exit(1);
}
