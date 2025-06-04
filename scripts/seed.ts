import { _seedInitialData, _seedTestProducts } from "../api";

async function main() {
  try {
    await _seedInitialData();
    await _seedTestProducts();
    console.log("Database seeded successfully");
  } catch (err) {
    console.error("Failed to seed database", err);
    process.exit(1);
  }
}

main();
