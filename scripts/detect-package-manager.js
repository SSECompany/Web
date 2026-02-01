const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

// Detect package manager
const hasYarnLock = fs.existsSync(path.join(__dirname, "..", "yarn.lock"));
const hasPackageLock = fs.existsSync(
  path.join(__dirname, "..", "package-lock.json")
);

let packageManager = "npm";
if (hasYarnLock) {
  packageManager = "yarn";
} else if (hasPackageLock) {
  packageManager = "npm";
}

console.log(`📦 Detected package manager: ${packageManager}`);

// Get command from arguments
const command = process.argv[2] || "build";
const skipBump = process.argv.includes("--skip-bump");

let fullCommand;
switch (command) {
  case "build":
    if (skipBump) {
      if (packageManager === "yarn") {
        fullCommand = "yarn update-version && react-scripts build";
      } else {
        fullCommand = "npm run update-version && react-scripts build";
      }
    } else {
      console.log("🚀 Auto-bumping patch version before build...");
      fullCommand = `node scripts/bump-version.js patch && react-scripts build`;
    }
    break;
  case "start":
    fullCommand = `${packageManager} start`;
    break;
  default:
    fullCommand = `${packageManager} run ${command}`;
}

console.log(`🚀 Running: ${fullCommand}`);

exec(
  fullCommand,
  { cwd: path.join(__dirname, "..") },
  (error, stdout, stderr) => {
    if (error) {
      console.error(`❌ Error: ${error.message}`);
      process.exit(1);
    }
    if (stderr) {
      console.error(`⚠️ Warning: ${stderr}`);
    }
    console.log(stdout);
  }
);
