import { execSync } from "child_process";

async function main() {
  let token = "";
  try {
    const credOutput = execSync("git credential fill", {
      input: "protocol=https\nhost=github.com\n",
      encoding: "utf8",
    });
    const match = credOutput.match(/password=(.+)/);
    if (match) token = match[1].trim();
  } catch (err) {
    console.error("Failed to retrieve git credentials:", err.message);
    process.exit(1);
  }

  if (!token) {
    console.error("No GitHub token found in git credential manager.");
    process.exit(1);
  }

  const repoName = "adarsh-habit-tracker";
  console.log(`Attempting to create GitHub repository '${repoName}' under sharathcx...`);

  const res = await fetch("https://api.github.com/user/repos", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "NodeJS",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: repoName,
      private: false,
      description: "Adarsh Habit Tracker",
    }),
  });

  const data = await res.json();
  if (res.status === 201) {
    console.log(`✓ Repository created: ${data.html_url}`);
  } else if (res.status === 422 && data.message?.includes("already exists")) {
    console.log(`✓ Repository already exists: https://github.com/sharathcx/${repoName}`);
  } else {
    console.error("GitHub API response:", res.status, data);
    process.exit(1);
  }

  console.log("Initializing local git repository...");
  execSync("git init", { stdio: "inherit" });
  execSync("git config user.name sharathcx", { stdio: "inherit" });
  execSync("git config user.email sharathpournami@gmail.com", { stdio: "inherit" });
  execSync("git branch -M main", { stdio: "inherit" });

  console.log("Staging files...");
  execSync("git add .", { stdio: "inherit" });

  console.log("Committing files...");
  try {
    execSync('git commit -m "Initial commit: Adarsh Habit Tracker"', { stdio: "inherit" });
  } catch {
    console.log("No new changes to commit.");
  }

  try {
    execSync("git remote remove origin", { stdio: "ignore" });
  } catch {}

  const remoteUrl = `https://github.com/sharathcx/${repoName}.git`;
  console.log(`Setting remote origin: ${remoteUrl}`);
  execSync(`git remote add origin ${remoteUrl}`, { stdio: "inherit" });

  console.log("Pushing to GitHub...");
  execSync("git push -u origin main", { stdio: "inherit" });

  console.log("\n Successfully pushed to GitHub:");
  console.log(`https://github.com/sharathcx/${repoName}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
