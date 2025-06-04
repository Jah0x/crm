import fs from "fs";

const pkg = JSON.parse(fs.readFileSync("package.json", "utf-8"));

console.log("Перечень зависимостей для установки:");

const deps = { ...pkg.dependencies, ...pkg.devDependencies } as Record<string, string>;
Object.entries(deps).forEach(([name, version]) => {
  console.log(`${name}@${version}`);
});
