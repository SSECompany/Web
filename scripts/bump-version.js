#!/usr/bin/env node

/**
 * Script để bump version tự động
 * Usage:
 *   node scripts/bump-version.js patch  -> 0.1.0 -> 0.1.1
 *   node scripts/bump-version.js minor  -> 0.1.0 -> 0.2.0
 *   node scripts/bump-version.js major  -> 0.1.0 -> 1.0.0
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Colors for console
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.cyan}ℹ️  ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
};

// Đọc arguments
const bumpType = process.argv[2] || "patch";
const releaseNote = process.argv[3] || "";

if (!["patch", "minor", "major"].includes(bumpType)) {
  log.error(
    `Invalid bump type: ${bumpType}. Use: patch, minor, or major`
  );
  process.exit(1);
}

try {
  log.info("Starting version bump...");

  // Đọc package.json hiện tại
  const packageJsonPath = path.join(__dirname, "../package.json");
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  const currentVersion = packageJson.version;

  log.info(`Current version: ${currentVersion}`);

  // Tính version mới
  const versionParts = currentVersion.split(".").map(Number);
  let [major, minor, patch] = versionParts;

  switch (bumpType) {
    case "major":
      major += 1;
      minor = 0;
      patch = 0;
      break;
    case "minor":
      minor += 1;
      patch = 0;
      break;
    case "patch":
      patch += 1;
      break;
  }

  const newVersion = `${major}.${minor}.${patch}`;
  log.info(`New version: ${newVersion}`);

  // Update package.json
  packageJson.version = newVersion;
  fs.writeFileSync(
    packageJsonPath,
    JSON.stringify(packageJson, null, 2) + "\n",
    "utf8"
  );
  log.success(`Updated package.json to v${newVersion}`);

  // Generate version.json với buildHash
  const crypto = require("crypto");
  const buildTime = new Date().toISOString();
  const buildHash = crypto
    .createHash("md5")
    .update(buildTime + newVersion)
    .digest("hex")
    .substring(0, 8);

  const versionInfo = {
    version: newVersion,
    buildTime: buildTime,
    buildHash: buildHash,
    releaseNotes: releaseNote || `Version ${newVersion}`,
    previousVersion: currentVersion,
  };

  fs.writeFileSync(
    path.join(__dirname, "../public/version.json"),
    JSON.stringify(versionInfo, null, 2) + "\n",
    "utf8"
  );
  log.success(`Generated version.json with buildHash: ${buildHash}`);

  // Update CHANGELOG.md nếu có (bỏ qua nếu không tồn tại)
  const changelogPath = path.join(__dirname, "../CHANGELOG.md");
  if (fs.existsSync(changelogPath)) {
    const changelog = fs.readFileSync(changelogPath, "utf8");
    const today = new Date().toISOString().split("T")[0];
    const newEntry = `\n## [${newVersion}] - ${today}\n\n${
      releaseNote || "- Version bump"
    }\n`;
    fs.writeFileSync(changelogPath, newEntry + changelog, "utf8");
    log.success("Updated CHANGELOG.md");
  }

  // Git commit (nếu có git)
  try {
    execSync("git rev-parse --git-dir", { stdio: "ignore" });
    execSync(`git add package.json public/version.json`);
    
    if (fs.existsSync(changelogPath)) {
      execSync(`git add CHANGELOG.md`);
    }
    
    execSync(`git commit -m "chore: bump version to ${newVersion}"`, {
      stdio: "inherit",
    });
    log.success(`Git commit created`);

    // Tạo git tag
    execSync(`git tag -a v${newVersion} -m "Release version ${newVersion}"`, {
      stdio: "inherit",
    });
    log.success(`Git tag v${newVersion} created`);

    log.warning("Don't forget to push: git push && git push --tags");
  } catch (e) {
    log.info("Skipping git commit (not a git repository or no changes)");
  }

  console.log("\n");
  log.success(`Version bumped from ${currentVersion} to ${newVersion}`);
  console.log("\n");
  log.info("Next steps:");
  console.log("  1. Review the changes");
  console.log("  2. Run: yarn build");
  console.log("  3. Deploy to production");
  console.log("  4. Push git: git push && git push --tags");
  console.log("\n");
} catch (error) {
  log.error(`Failed to bump version: ${error.message}`);
  process.exit(1);
}

