const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const packagePath = path.join(__dirname, "..", "package.json");
const packageJson = JSON.parse(fs.readFileSync(packagePath, "utf8"));

const currentVersion = packageJson.version;
const versionParts = currentVersion.split(".");
const major = parseInt(versionParts[0], 10) || 0;
const minor = parseInt(versionParts[1], 10) || 0;
const patch = parseInt(versionParts[2], 10) || 0;

const args = process.argv.slice(2);
const bumpType = args[0] || "patch";

let newVersion;
switch (bumpType) {
  case "major":
    newVersion = `${major + 1}.0.0`;
    break;
  case "minor":
    newVersion = `${major}.${minor + 1}.0`;
    break;
  default:
    newVersion = `${major}.${minor}.${patch + 1}`;
}

packageJson.version = newVersion;
fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
console.log(`🚀 Version bumped: ${currentVersion} → ${newVersion} (${bumpType})`);

try {
  const buildTime = new Date().toISOString();
  const buildHash = crypto
    .createHash("md5")
    .update(buildTime + newVersion)
    .digest("hex")
    .substring(0, 8);
  const versionData = { version: newVersion, buildTime, buildHash };
  const versionPath = path.join(__dirname, "..", "public", "version.json");
  fs.writeFileSync(versionPath, JSON.stringify(versionData, null, 2));
  console.log("✅ version.json updated!");
} catch (error) {
  console.error("❌ Error:", error);
  process.exit(1);
}
