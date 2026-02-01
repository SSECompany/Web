const { exec } = require("child_process");
const path = require("path");

// Get bump type from arguments: patch (default), minor, major
const args = process.argv.slice(2);
const bumpType =
  args.find((arg) => ["patch", "minor", "major"].includes(arg)) || "patch";
const skipBump = args.includes("--skip-bump");

console.log(`🚀 Auto Build Script`);

if (skipBump) {
  console.log(`📦 Skipping version bump, building with current version...`);

  const updateCommand = "node scripts/update-version.js";

  exec(
    updateCommand,
    { cwd: path.join(__dirname, "..") },
    (error, stdout, stderr) => {
      if (error) {
        console.error(`❌ Error updating version: ${error.message}`);
        process.exit(1);
      }
      if (stderr) {
        console.error(`⚠️ Warning during version update: ${stderr}`);
      }
      console.log(stdout);

      console.log("🏗️ Starting React build...");
      const buildCommand = "react-scripts build";

      exec(
        buildCommand,
        { cwd: path.join(__dirname, "..") },
        (buildError, buildStdout, buildStderr) => {
          if (buildError) {
            console.error(`❌ Error during build: ${buildError.message}`);
            process.exit(1);
          }
          if (buildStderr) {
            console.error(`⚠️ Warning during build: ${buildStderr}`);
          }
          console.log(buildStdout);
          console.log(`✅ Build completed without version bump! 🎉`);
        }
      );
    }
  );
} else {
  console.log(`📈 Auto-bumping ${bumpType} version and building...`);

  const bumpCommand = `node scripts/bump-version.js ${bumpType}`;

  exec(
    bumpCommand,
    { cwd: path.join(__dirname, "..") },
    (error, stdout, stderr) => {
      if (error) {
        console.error(`❌ Error bumping version: ${error.message}`);
        process.exit(1);
      }
      if (stderr) {
        console.error(`⚠️ Warning during version bump: ${stderr}`);
      }
      console.log(stdout);

      console.log("🏗️ Starting React build...");
      const buildCommand = "react-scripts build";

      exec(
        buildCommand,
        { cwd: path.join(__dirname, "..") },
        (buildError, buildStdout, buildStderr) => {
          if (buildError) {
            console.error(`❌ Error during build: ${buildError.message}`);
            process.exit(1);
          }
          if (buildStderr) {
            console.error(`⚠️ Warning during build: ${buildStderr}`);
          }
          console.log(buildStdout);
          console.log(
            `✅ Auto build completed with ${bumpType} version bump! 🎉`
          );
        }
      );
    }
  );
}
