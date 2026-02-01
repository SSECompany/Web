const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

const hasYarnLock = fs.existsSync(path.join(__dirname, "..", "yarn.lock"));
const pkg = hasYarnLock ? "yarn" : "npm";
const command = process.argv[2] || "build";
const skipBump = process.argv.includes("--skip-bump");

let fullCommand;
if (command === "build") {
  fullCommand = skipBump
    ? `${pkg} run update-version && react-scripts build`
    : `node scripts/bump-version.js patch && react-scripts build`;
} else {
  fullCommand = `${pkg} run ${command}`;
}

console.log(`📦 ${pkg} | 🚀 ${fullCommand}`);
exec(fullCommand, { cwd: path.join(__dirname, "..") }, (err, stdout, stderr) => {
  if (err) process.exit(1);
  console.log(stdout);
});
