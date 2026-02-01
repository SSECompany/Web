const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// Đọc package.json
const packagePath = path.join(__dirname, "..", "package.json");
const packageJson = JSON.parse(fs.readFileSync(packagePath, "utf8"));

// Parse version hiện tại
const currentVersion = packageJson.version;
const versionParts = currentVersion.split(".");
const major = parseInt(versionParts[0], 10) || 0;
const minor = parseInt(versionParts[1], 10) || 0;
const patch = parseInt(versionParts[2], 10) || 0;

// Lấy type bump từ command line arguments
const args = process.argv.slice(2);
const bumpType = args[0] || "patch"; // patch, minor, major

let newVersion;
switch (bumpType) {
  case "major":
    newVersion = `${major + 1}.0.0`;
    break;
  case "minor":
    newVersion = `${major}.${minor + 1}.0`;
    break;
  case "patch":
  default:
    newVersion = `${major}.${minor}.${patch + 1}`;
    break;
}

// Cập nhật package.json
packageJson.version = newVersion;
fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));

console.log(
  `🚀 Version bumped: ${currentVersion} → ${newVersion} (${bumpType})`
);

// ✅ GỘP LOGIC UPDATE VERSION.JSON VÀO ĐÂY LUÔN
try {
  const buildTime = new Date().toISOString();
  const buildHash = crypto
    .createHash("md5")
    .update(buildTime + newVersion)
    .digest("hex")
    .substring(0, 8);

  const versionData = {
    version: newVersion,
    buildTime: buildTime,
    buildHash: buildHash,
  };

  const versionPath = path.join(__dirname, "..", "public", "version.json");
  fs.writeFileSync(versionPath, JSON.stringify(versionData, null, 2));

  // Inject version vào index.html
  const indexPath = path.join(__dirname, "..", "public", "index.html");
  let indexContent = fs.readFileSync(indexPath, "utf8");
  indexContent = indexContent
    .replace(
      /window\.__BUILD_VERSION__\s*=\s*"[^"]*"/,
      `window.__BUILD_VERSION__ = "${newVersion}"`
    )
    .replace(
      /window\.__BUILD_HASH__\s*=\s*"[^"]*"/,
      `window.__BUILD_HASH__ = "${buildHash}"`
    );
  fs.writeFileSync(indexPath, indexContent);

  console.log("✅ Version.json updated successfully!");
  console.log(`📦 Version: ${newVersion}`);
  console.log(`🕒 Build time: ${buildTime}`);
  console.log(`🔨 Build hash: ${buildHash}`);
  console.log("");
  console.log(`✅ Ready! All done in one step. 🎉`);
} catch (error) {
  console.error("❌ Error updating version.json:", error);
  process.exit(1);
}
