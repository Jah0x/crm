import { expect } from "expect";
import {
  createProduct,
  listProducts,
  createCategory,
  createBrand,
} from "./api";

async function testCreateProduct() {
  try {
    // Create brand and category required for the product
    const brand = await createBrand({
      name: "Test Brand",
      description: "Test Brand Description",
    });

    const category = await createCategory({
      name: "Test Category",
      description: "Test Category Description",
    });

    // Test creating a product
    const product = await createProduct({
      name: "Test Product",
      description: "Test Description",
      costPrice: 5.5,
      retailPrice: 10.99,
      stock: 100,
      brandId: brand.id,
      categoryId: category.id,
    });

    expect(product).toHaveProperty("id");
    expect(product.name).toBe("Test Product");
    expect(product.retailPrice).toBe(10.99);
    expect(product.costPrice).toBe(5.5);
    expect(product.stock).toBe(100);
    expect(product.brandId).toBe(brand.id);
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