import { expect } from "expect";
import { createProduct, listProducts, createCategory } from "./api";

async function testCreateProduct() {
  try {
    // First create a category for testing
    const category = await createCategory({
      name: "Test Category",
      description: "Test Category Description"
    });
    
    // Test creating a product
    const product = await createProduct({
      name: "Test Product",
      description: "Test Description",
      price: 10.99,
      stock: 100,
      categoryId: category.id,
    });

    expect(product).toHaveProperty("id");
    expect(product.name).toBe("Test Product");
    expect(product.price).toBe(10.99);
    expect(product.stock).toBe(100);
    expect(product.categoryId).toBe(category.id);
    
    // Test successful
    return true;
  } catch (error) {
    console.error("Error in testCreateProduct:", error);
    throw error;
  }
}

export async function _runApiTests() {
  const result = {
    passedTests: [] as string[],
    failedTests: [] as { name: string; error: string }[],
  };

  try {
    await testCreateProduct();
    result.passedTests.push("testCreateProduct");
  } catch (error) {
    result.failedTests.push({
      name: "testCreateProduct",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }

  return result;
}
