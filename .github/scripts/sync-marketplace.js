#!/usr/bin/env node
/**
 * Sync marketplace.json with skills directory.
 *
 * Scans the skills/ directory for valid skills (directories containing SKILL.md)
 * and updates marketplace.json to match.
 */

const fs = require("fs");
const path = require("path");

const SKILLS_DIR = "skills";
const MARKETPLACE_FILE = ".claude-plugin/marketplace.json";

function getSkillsFromDirectory() {
  if (!fs.existsSync(SKILLS_DIR)) {
    return [];
  }

  return fs
    .readdirSync(SKILLS_DIR, { withFileTypes: true })
    .filter((entry) => {
      if (!entry.isDirectory()) return false;
      const skillFile = path.join(SKILLS_DIR, entry.name, "SKILL.md");
      return fs.existsSync(skillFile);
    })
    .map((entry) => `./${SKILLS_DIR}/${entry.name}`)
    .sort();
}

function updateSkillCount(description, count) {
  return description.replace(/\d+ marketing skills/, `${count} marketing skills`);
}

function main() {
  const currentSkills = getSkillsFromDirectory();

  const marketplace = JSON.parse(fs.readFileSync(MARKETPLACE_FILE, "utf8"));
  const plugin = marketplace.plugins[0];
  const existingSkills = plugin.skills || [];

  // Check if update needed
  if (JSON.stringify(currentSkills) === JSON.stringify(existingSkills)) {
    console.log("marketplace.json is already in sync");
    return;
  }

  // Update skills list
  plugin.skills = currentSkills;

  // Update description with new count
  plugin.description = updateSkillCount(plugin.description, currentSkills.length);

  // Write updated marketplace.json
  fs.writeFileSync(MARKETPLACE_FILE, JSON.stringify(marketplace, null, 2) + "\n");

  // Report changes
  const added = currentSkills.filter((s) => !existingSkills.includes(s));
  const removed = existingSkills.filter((s) => !currentSkills.includes(s));

  if (added.length) console.log(`Added: ${added.join(", ")}`);
  if (removed.length) console.log(`Removed: ${removed.join(", ")}`);

  console.log(`Updated marketplace.json (${currentSkills.length} skills)`);
}

main();
