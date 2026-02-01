const { exec } = require("child_process");
const path = require("path");

const args = process.argv.slice(2);
const bumpType = args.find((a) => ["patch", "minor", "major"].includes(a)) || "patch";
const skipBump = args.includes("--skip-bump");

console.log("🚀 Auto Build Script");

const runBuild = () => {
  exec(
    "react-scripts build",
    { cwd: path.join(__dirname, "..") },
    (err, stdout, stderr) => {
      if (err) {
        console.error("❌ Build error:", err.message);
        process.exit(1);
      }
      console.log(stdout);
      console.log(`✅ Build completed! 🎉`);
    }
  );
};

if (skipBump) {
  console.log("📦 Skip version bump...");
  exec(
    "node scripts/update-version.js",
    { cwd: path.join(__dirname, "..") },
    (err, stdout) => {
      if (err) process.exit(1);
      console.log(stdout);
      runBuild();
    }
  );
} else {
  console.log(`📈 Bumping ${bumpType} and building...`);
  exec(
    `node scripts/bump-version.js ${bumpType}`,
    { cwd: path.join(__dirname, "..") },
    (err, stdout) => {
      if (err) process.exit(1);
      console.log(stdout);
      runBuild();
    }
  );
}
