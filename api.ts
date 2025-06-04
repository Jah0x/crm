import { db } from "@/server/db";
import { getAuth, upload } from "@/server/actions";
import * as bcrypt from "bcryptjs";

// Auth functions
export async function login({
  email,
  password,
}: {
  email: string;
  password: string;
}) {
  // Search by lowercased email for SQLite compatibility
  const user = await db.user.findFirst({
    where: {
      email: email.toLowerCase(),
    },
  });

  if (!user) throw new Error("User not found");

  if (!user.password)
    throw new Error("User account uses Adaptive authentication");

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) throw new Error("Invalid password");

  return {
    id: user.id,
    name: user.name,
    email: user.email || null,
    role: user.role,
  };
}

export async function getCurrentUser() {
  try {
    const { userId } = await getAuth();
    if (!userId) return null;

    let user = await db.user.findUnique({ where: { id: userId } });

    // If user doesn't exist in local DB but is authenticated via Adaptive,
    // create a local user record automatically
    if (!user) {
      try {
        user = await db.user.create({
          data: {
            id: userId,
            role: "CASHIER", // Default role for Adaptive users
          },
        });

        await logActivity({
          action: "AUTO_CREATE_USER",
          details: "Automatically created user from Adaptive authentication",
        });
      } catch (createError) {
        console.error("Error creating user:", createError);
        return null;
      }
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email || null,
      role: user.role,
    };
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
}

// User management functions
export async function createUser({
  name,
  email,
  password,
  role,
}: {
  name: string;
  email: string;
  password: string;
  role: string;
}) {
  const { userId } = await getAuth();
  if (!userId) throw new Error("Not authenticated");

  const currentUser = await db.user.findUnique({ where: { id: userId } });
  if (!currentUser) throw new Error("User not found");

  // Check permissions
  if (
    role === "MAIN_ADMIN" ||
    (role === "ADMIN" && currentUser.role !== "MAIN_ADMIN") ||
    (role === "CASHIER" && currentUser.role === "CASHIER")
  ) {
    throw new Error("Insufficient permissions");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = await db.user.create({
    data: {
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
      createdBy: userId,
    },
  });

  await logActivity({
    action: "CREATE_USER",
    details: `Created user ${newUser.name} with role ${newUser.role}`,
  });

  return {
    id: newUser.id,
    name: newUser.name,
    email: newUser.email || null,
    role: newUser.role,
  };
}

export async function listUsers() {
  const { userId } = await getAuth();
  if (!userId) throw new Error("Not authenticated");

  const currentUser = await db.user.findUnique({ where: { id: userId } });
  if (!currentUser) throw new Error("User not found");

  // Cashiers can't list users
  if (currentUser.role === "CASHIER") {
    throw new Error("Insufficient permissions");
  }

  // Admins can only see cashiers
  let where = {};
  if (currentUser.role === "ADMIN") {
    where = { role: "CASHIER" };
  }

  const users = await db.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  return users;
}

export async function deleteUser({ userId }: { userId: string }) {
  const { userId: currentUserId } = await getAuth();
  if (!currentUserId) throw new Error("Not authenticated");

  const currentUser = await db.user.findUnique({
    where: { id: currentUserId },
  });
  if (!currentUser) throw new Error("User not found");

  const targetUser = await db.user.findUnique({ where: { id: userId } });
  if (!targetUser) throw new Error("Target user not found");

  // Check permissions
  if (
    targetUser.role === "MAIN_ADMIN" ||
    (targetUser.role === "ADMIN" && currentUser.role !== "MAIN_ADMIN") ||
    (targetUser.role === "CASHIER" && currentUser.role === "CASHIER")
  ) {
    throw new Error("Insufficient permissions");
  }

  await db.user.delete({ where: { id: userId } });

  await logActivity({
    action: "DELETE_USER",
    details: `Deleted user ${targetUser.name} with role ${targetUser.role}`,
  });

  return { success: true };
}

// Category functions
export async function createCategory({
  name,
  description,
  parentId,
}: {
  name: string;
  description?: string;
  parentId?: string;
}) {
  const { userId } = await getAuth();
  if (!userId) throw new Error("Not authenticated");

  const currentUser = await db.user.findUnique({ where: { id: userId } });
  if (!currentUser) {
    throw new Error("User not found");
  }
  // All authenticated users can create categories

  const category = await db.category.create({
    data: { name, description, parentId },
  });

  await logActivity({
    action: "CREATE_CATEGORY",
    details: `Created category ${category.name}`,
  });

  return category;
}

export async function listCategories() {
  return await db.category.findMany({
    where: { isActive: true },
    include: {
      subcategories: {
        where: { isActive: true },
        include: {
          products: {
            where: { isActive: true, stock: { gt: 0 } },
          },
        },
      },
      products: {
        where: { isActive: true, stock: { gt: 0 } },
      },
      parent: true,
    },
    orderBy: { sortOrder: "asc" },
  });
}

// Get categories with available products only
export async function listAvailableCategories() {
  const categories = await db.category.findMany({
    where: {
      isActive: true,
      parentId: null, // Only main categories
    },
    include: {
      subcategories: {
        where: {
          isActive: true,
          products: {
            some: {
              isActive: true,
              stock: { gt: 0 },
            },
          },
        },
        include: {
          products: {
            where: { isActive: true, stock: { gt: 0 } },
            include: {
              brand: true,
            },
          },
        },
      },
      products: {
        where: { isActive: true, stock: { gt: 0 } },
        include: {
          brand: true,
        },
      },
    },
  });

  // Filter out categories that have no products in stock
  return categories.filter(
    (category) =>
      category.products.length > 0 ||
      category.subcategories.some((sub) => sub.products.length > 0),
  );
}

// Get products by category for POS
export async function getProductsByCategory({
  categoryId,
  subcategoryId,
}: {
  categoryId?: string;
  subcategoryId?: string;
}) {
  const where: any = {
    isActive: true,
    stock: { gt: 0 },
  };

  if (subcategoryId) {
    where.categoryId = subcategoryId;
  } else if (categoryId) {
    where.categoryId = categoryId;
  }

  return await db.product.findMany({
    where,
    include: {
      brand: true,
      category: true,
    },
    orderBy: { name: "asc" },
  });
}

export async function updateCategory({
  id,
  name,
  description,
  isActive,
  sortOrder,
}: {
  id: string;
  name?: string;
  description?: string;
  isActive?: boolean;
  sortOrder?: number;
}) {
  const { userId } = await getAuth();
  if (!userId) throw new Error("Not authenticated");

  const currentUser = await db.user.findUnique({ where: { id: userId } });
  if (!currentUser) {
    throw new Error("User not found");
  }
  // All authenticated users can update categories

  const category = await db.category.update({
    where: { id },
    data: { name, description, isActive, sortOrder },
  });

  await logActivity({
    action: "UPDATE_CATEGORY",
    details: `Updated category ${category.name}`,
  });

  return category;
}

// Product functions
export async function createProduct({
  name,
  description,
  costPrice,
  retailPrice,
  imageUrl,
  puffCount,
  stock,
  minStock = 5,
  brandId,
  categoryId,
}: {
  name: string;
  description?: string;
  costPrice: number;
  retailPrice: number;
  imageUrl?: string;
  puffCount?: number;
  stock: number;
  minStock?: number;
  brandId: string;
  categoryId: string;
}) {
  const { userId } = await getAuth();
  if (!userId) throw new Error("Not authenticated");

  const currentUser = await db.user.findUnique({ where: { id: userId } });
  if (!currentUser) {
    throw new Error("User not found");
  }
  // All authenticated users can create products
  // Cashiers can add products when new stock arrives

  const product = await db.product.create({
    data: {
      name,
      description,
      costPrice,
      retailPrice,
      imageUrl,
      puffCount,
      stock,
      minStock,
      brandId,
      categoryId,
      createdBy: userId,
    },
  });

  // Create initial stock movement
  await db.stockMovement.create({
    data: {
      type: "IN",
      quantity: stock,
      reason: "INITIAL_STOCK",
      productId: product.id,
      createdBy: userId,
    },
  });

  await logActivity({
    action: "CREATE_PRODUCT",
    details: `Created product ${product.name}`,
    productId: product.id,
  });

  return product;
}

export async function listProducts() {
  return await db.product.findMany({
    where: { isActive: true },
    include: {
      category: true,
      brand: true,
    },
    orderBy: { name: "asc" },
  });
}

export async function getProduct({ id }: { id: string }) {
  return await db.product.findUnique({
    where: { id },
    include: {
      category: true,
      brand: true,
      stockMovements: {
        take: 10,
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

export async function updateProduct({
  id,
  name,
  description,
  costPrice,
  retailPrice,
  imageUrl,
  puffCount,
  minStock,
  brandId,
  categoryId,
  isActive,
}: {
  id: string;
  name?: string;
  description?: string;
  costPrice?: number;
  retailPrice?: number;
  imageUrl?: string;
  puffCount?: number;
  minStock?: number;
  brandId?: string;
  categoryId?: string;
  isActive?: boolean;
}) {
  const { userId } = await getAuth();
  if (!userId) throw new Error("Not authenticated");

  const currentUser = await db.user.findUnique({ where: { id: userId } });
  if (!currentUser || currentUser.role === "CASHIER") {
    throw new Error("Insufficient permissions");
  }

  const product = await db.product.update({
    where: { id },
    data: {
      name,
      description,
      costPrice,
      retailPrice,
      imageUrl,
      puffCount,
      minStock,
      brandId,
      categoryId,
      isActive,
    },
  });

  await logActivity({
    action: "UPDATE_PRODUCT",
    details: `Updated product ${product.name}`,
    productId: product.id,
  });

  return product;
}

export async function deleteProduct({ id }: { id: string }) {
  const { userId } = await getAuth();
  if (!userId) throw new Error("Not authenticated");

  const currentUser = await db.user.findUnique({ where: { id: userId } });
  if (!currentUser || currentUser.role === "CASHIER") {
    throw new Error("Insufficient permissions");
  }

  const product = await db.product.update({
    where: { id },
    data: { isActive: false },
  });

  await logActivity({
    action: "DELETE_PRODUCT",
    details: `Deleted product ${product.name}`,
    productId: product.id,
  });

  return { success: true };
}

export async function updateStock({
  id,
  quantity,
  reason,
  notes,
}: {
  id: string;
  quantity: number;
  reason: string;
  notes?: string;
}) {
  const { userId } = await getAuth();
  if (!userId) throw new Error("Not authenticated");

  const product = await db.product.findUnique({ where: { id } });
  if (!product) throw new Error("Product not found");

  const updatedProduct = await db.product.update({
    where: { id },
    data: {
      stock: {
        increment: quantity,
      },
    },
  });

  // Create stock movement record
  await db.stockMovement.create({
    data: {
      type: quantity > 0 ? "IN" : "OUT",
      quantity: Math.abs(quantity),
      reason,
      notes,
      productId: id,
      createdBy: userId,
    },
  });

  await logActivity({
    action: "UPDATE_STOCK",
    details: `Updated stock for ${product.name} by ${quantity}`,
    productId: product.id,
  });

  return updatedProduct;
}

// Get low stock products
export async function getLowStockProducts() {
  const products = await db.product.findMany({
    where: {
      isActive: true,
    },
    include: {
      category: true,
      brand: true,
    },
    orderBy: { stock: "asc" },
  });

  // Filter products where stock is less than or equal to minStock
  return products.filter(
    (product) => product.stock <= product.minStock || product.stock === 0,
  );
}

// Activity logging
export async function logActivity({
  action,
  details,
  productId,
}: {
  action: string;
  details: string;
  productId?: string;
}) {
  try {
    const { userId } = await getAuth();
    if (!userId) return;

    await db.activity.create({
      data: {
        action,
        details,
        userId,
        productId,
      },
    });
  } catch (error) {
    console.error("Error logging activity:", error);
  }
}

export async function getRecentActivities() {
  const { userId } = await getAuth();
  if (!userId) throw new Error("Not authenticated");

  const currentUser = await db.user.findUnique({ where: { id: userId } });
  if (!currentUser) throw new Error("User not found");

  return await db.activity.findMany({
    take: 10,
    orderBy: {
      createdAt: "desc",
    },
    include: {
      user: {
        select: {
          name: true,
          role: true,
        },
      },
      product: {
        select: {
          name: true,
        },
      },
    },
  });
}

// Dashboard data
export async function getDashboardData() {
  const { userId } = await getAuth();
  if (!userId) throw new Error("Not authenticated");

  const currentUser = await db.user.findUnique({ where: { id: userId } });
  if (!currentUser) throw new Error("User not found");

  const today = new Date();
  const startOfDay = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const [
    productsCount,
    categoriesCount,
    lowStockCount,
    todaySales,
    monthSales,
    totalRevenue,
  ] = await Promise.all([
    db.product.count({ where: { isActive: true } }),
    db.category.count({ where: { isActive: true, parentId: null } }),
    db.product.count({
      where: {
        isActive: true,
        OR: [{ stock: { lte: 5 } }, { stock: { equals: 0 } }],
      },
    }),
    db.sale.aggregate({
      where: { createdAt: { gte: startOfDay } },
      _sum: { finalAmount: true },
      _count: true,
    }),
    db.sale.aggregate({
      where: { createdAt: { gte: startOfMonth } },
      _sum: { finalAmount: true },
      _count: true,
    }),
    db.sale.aggregate({
      _sum: { finalAmount: true },
    }),
  ]);

  let usersCount = 0;
  if (currentUser.role === "MAIN_ADMIN") {
    usersCount = await db.user.count();
  } else if (currentUser.role === "ADMIN") {
    usersCount = await db.user.count({ where: { role: "CASHIER" } });
  }

  return {
    productsCount,
    categoriesCount,
    lowStockCount,
    usersCount,
    todaySales: {
      amount: todaySales._sum.finalAmount || 0,
      count: todaySales._count || 0,
    },
    monthSales: {
      amount: monthSales._sum.finalAmount || 0,
      count: monthSales._count || 0,
    },
    totalRevenue: totalRevenue._sum.finalAmount || 0,
  };
}

// Brand management
export async function createBrand({
  name,
  description,
  logoUrl,
}: {
  name: string;
  description?: string;
  logoUrl?: string;
}) {
  const { userId } = await getAuth();
  if (!userId) throw new Error("Not authenticated");

  const currentUser = await db.user.findUnique({ where: { id: userId } });
  if (!currentUser) {
    throw new Error("User not found");
  }
  // All authenticated users can create brands

  const brand = await db.brand.create({
    data: { name, description, logoUrl },
  });

  await logActivity({
    action: "CREATE_BRAND",
    details: `Created brand ${brand.name}`,
  });

  return brand;
}

export async function listBrands() {
  return await db.brand.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
}

export async function updateBrand({
  id,
  name,
  description,
  logoUrl,
  isActive,
}: {
  id: string;
  name?: string;
  description?: string;
  logoUrl?: string;
  isActive?: boolean;
}) {
  const { userId } = await getAuth();
  if (!userId) throw new Error("Not authenticated");

  const currentUser = await db.user.findUnique({ where: { id: userId } });
  if (!currentUser) {
    throw new Error("User not found");
  }
  // All authenticated users can update brands

  const brand = await db.brand.update({
    where: { id },
    data: { name, description, logoUrl, isActive },
  });

  await logActivity({
    action: "UPDATE_BRAND",
    details: `Updated brand ${brand.name}`,
  });

  return brand;
}

// Sales management
export async function createSale({
  items,
  discount = 0,
  paymentMethod = "CASH",
}: {
  items: { productId: string; quantity: number; unitPrice: number }[];
  discount?: number;
  paymentMethod?: "CASH" | "CARD" | "TRANSFER" | "SBP";
}) {
  const { userId } = await getAuth();
  if (!userId) throw new Error("Not authenticated");

  const totalAmount = items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0,
  );
  const finalAmount = totalAmount - discount;

  const sale = await db.sale.create({
    data: {
      totalAmount,
      discount,
      finalAmount,
      paymentMethod,
      userId,
      items: {
        create: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.quantity * item.unitPrice,
        })),
      },
    },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  // Update stock for each item
  for (const item of items) {
    await db.product.update({
      where: { id: item.productId },
      data: {
        stock: {
          decrement: item.quantity,
        },
      },
    });

    // Create stock movement
    await db.stockMovement.create({
      data: {
        type: "OUT",
        quantity: -item.quantity,
        reason: "SALE",
        productId: item.productId,
        createdBy: userId,
      },
    });
  }

  await logActivity({
    action: "CREATE_SALE",
    details: `Created sale for ${finalAmount} руб.`,
  });

  return sale;
}

export async function getSalesAnalytics({
  startDate,
  endDate,
}: {
  startDate?: string;
  endDate?: string;
} = {}) {
  const { userId } = await getAuth();
  if (!userId) throw new Error("Not authenticated");

  const currentUser = await db.user.findUnique({ where: { id: userId } });
  if (!currentUser || currentUser.role === "CASHIER") {
    throw new Error("Insufficient permissions");
  }

  const whereClause: any = {};
  if (startDate || endDate) {
    whereClause.createdAt = {};
    if (startDate) whereClause.createdAt.gte = new Date(startDate);
    if (endDate) whereClause.createdAt.lte = new Date(endDate);
  }

  const [totalSales, salesCount, topProducts, salesByDay] = await Promise.all([
    // Total sales amount
    db.sale.aggregate({
      where: whereClause,
      _sum: { finalAmount: true },
    }),

    // Sales count
    db.sale.count({ where: whereClause }),

    // Top selling products
    db.saleItem.groupBy({
      by: ["productId"],
      where: {
        sale: whereClause,
      },
      _sum: {
        quantity: true,
        totalPrice: true,
      },
      orderBy: {
        _sum: {
          quantity: "desc",
        },
      },
      take: 10,
    }),

    // Sales by day
    db.sale.findMany({
      where: whereClause,
      select: {
        createdAt: true,
        finalAmount: true,
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  // Get product details for top products
  const topProductsWithDetails = await Promise.all(
    topProducts.map(async (item) => {
      const product = await db.product.findUnique({
        where: { id: item.productId },
        include: { brand: true, category: true },
      });
      return {
        product,
        totalQuantity: item._sum.quantity || 0,
        totalRevenue: item._sum.totalPrice || 0,
      };
    }),
  );

  return {
    totalRevenue: totalSales._sum.finalAmount || 0,
    totalSales: salesCount,
    topProducts: topProductsWithDetails,
    salesByDay,
  };
}

// Upload product image
export async function uploadProductImage({
  imageBase64,
  fileName,
}: {
  imageBase64: string;
  fileName: string;
}) {
  const { userId } = await getAuth();
  if (!userId) throw new Error("Not authenticated");

  const currentUser = await db.user.findUnique({ where: { id: userId } });
  if (!currentUser) {
    throw new Error("User not found");
  }
  // All authenticated users can upload product images

  const imageUrl = await upload({
    bufferOrBase64: imageBase64,
    fileName,
  });

  return { imageUrl };
}

// Work session management
export async function createWorkSession({
  date,
  hours,
}: {
  date: string;
  hours: number;
}) {
  const { userId } = await getAuth();
  if (!userId) throw new Error("Not authenticated");

  // Get user's hourly rate
  let userSettings = await db.userSettings.findUnique({
    where: { userId },
  });

  if (!userSettings) {
    userSettings = await db.userSettings.create({
      data: {
        userId,
        hourlyRate: 200, // Default rate
      },
    });
  }

  const totalPay = hours * userSettings.hourlyRate;

  // Check if session already exists for this date
  const existingSession = await db.workSession.findFirst({
    where: {
      userId,
      date: new Date(date),
    },
  });

  if (existingSession) {
    // Update existing session
    const updatedSession = await db.workSession.update({
      where: { id: existingSession.id },
      data: {
        hours,
        hourlyRate: userSettings.hourlyRate,
        totalPay,
      },
    });

    await logActivity({
      action: "UPDATE_WORK_SESSION",
      details: `Обновлена рабочая смена на ${date}: ${hours} часов`,
    });

    return updatedSession;
  } else {
    // Create new session
    const workSession = await db.workSession.create({
      data: {
        userId,
        date: new Date(date),
        hours,
        hourlyRate: userSettings.hourlyRate,
        totalPay,
      },
    });

    await logActivity({
      action: "CREATE_WORK_SESSION",
      details: `Добавлена рабочая смена на ${date}: ${hours} часов`,
    });

    return workSession;
  }
}

export async function listWorkSessions({
  userId,
  startDate,
  endDate,
}: {
  userId?: string;
  startDate?: string;
  endDate?: string;
} = {}) {
  const { userId: currentUserId } = await getAuth();
  if (!currentUserId) throw new Error("Not authenticated");

  const currentUser = await db.user.findUnique({
    where: { id: currentUserId },
  });
  if (!currentUser) throw new Error("User not found");

  // Cashiers can only see their own sessions
  const targetUserId =
    currentUser.role === "CASHIER" ? currentUserId : userId || currentUserId;

  const whereClause: any = { userId: targetUserId };
  if (startDate || endDate) {
    whereClause.date = {};
    if (startDate) whereClause.date.gte = new Date(startDate);
    if (endDate) whereClause.date.lte = new Date(endDate);
  }

  return await db.workSession.findMany({
    where: whereClause,
    include: {
      user: {
        select: {
          name: true,
          role: true,
        },
      },
    },
    orderBy: { date: "desc" },
  });
}

export async function updateUserHourlyRate({
  userId,
  hourlyRate,
}: {
  userId: string;
  hourlyRate: number;
}) {
  const { userId: currentUserId } = await getAuth();
  if (!currentUserId) throw new Error("Not authenticated");

  const currentUser = await db.user.findUnique({
    where: { id: currentUserId },
  });
  if (!currentUser || currentUser.role === "CASHIER") {
    throw new Error("Insufficient permissions");
  }

  const userSettings = await db.userSettings.upsert({
    where: { userId },
    update: { hourlyRate },
    create: {
      userId,
      hourlyRate,
    },
  });

  await logActivity({
    action: "UPDATE_HOURLY_RATE",
    details: `Обновлена почасовая ставка для пользователя: ${hourlyRate} руб/час`,
  });

  return userSettings;
}

export async function getUserSettings({ userId }: { userId?: string } = {}) {
  const { userId: currentUserId } = await getAuth();
  if (!currentUserId) throw new Error("Not authenticated");

  const targetUserId = userId || currentUserId;

  let userSettings = await db.userSettings.findUnique({
    where: { userId: targetUserId },
  });

  if (!userSettings) {
    userSettings = await db.userSettings.create({
      data: {
        userId: targetUserId,
        hourlyRate: 200,
      },
    });
  }

  return userSettings;
}

// Seed function to create initial data
export async function _seedInitialData() {
  // Create main admin if doesn't exist
  const existingAdmin = await db.user.findFirst({
    where: { role: "MAIN_ADMIN" },
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash("admin123", 10);
    await db.user.create({
      data: {
        name: "Main Admin",
        email: "admin@vapestore.com".toLowerCase(),
        password: hashedPassword,
        role: "MAIN_ADMIN",
      },
    });
  }

  // Create brands
  const brandNames = [
    "Lost Mary",
    "Insta Bar",
    "Laiska",
    "Inflave",
    "Fumo",
    "Waka",
    "Rick and Morty",
  ];
  for (const brandName of brandNames) {
    await db.brand.upsert({
      where: { name: brandName },
      update: {},
      create: { name: brandName },
    });
  }

  // Create main categories
  const mainCategories = [
    { name: "Одноразки", description: "Одноразовые электронные сигареты" },
    { name: "Испары/Картриджи", description: "Испарители и картриджи" },
    { name: "Жижа", description: "Жидкости для электронных сигарет" },
    { name: "Снюс", description: "Бестабачные снюсы" },
  ];

  for (const category of mainCategories) {
    await db.category.upsert({
      where: { name: category.name },
      update: {},
      create: category,
    });
  }

  // Create subcategories for Одноразки (brands)
  const disposableCategory = await db.category.findUnique({
    where: { name: "Одноразки" },
  });
  if (disposableCategory) {
    const disposableBrands = [
      "Lost Mary",
      "Insta Bar",
      "Laiska",
      "Inflave",
      "Fumo",
      "Waka",
    ];
    for (const brandName of disposableBrands) {
      await db.category.upsert({
        where: { name: `${disposableCategory.name} - ${brandName}` },
        update: {},
        create: {
          name: `${disposableCategory.name} - ${brandName}`,
          parentId: disposableCategory.id,
        },
      });
    }
  }

  // Create subcategories for Жижа
  const liquidCategory = await db.category.findUnique({
    where: { name: "Жижа" },
  });
  if (liquidCategory) {
    const liquidBrands = ["Fumo", "Inflave", "Rick and Morty"];
    for (const brandName of liquidBrands) {
      await db.category.upsert({
        where: { name: `${liquidCategory.name} - ${brandName}` },
        update: {},
        create: {
          name: `${liquidCategory.name} - ${brandName}`,
          parentId: liquidCategory.id,
        },
      });
    }
  }

  // Create subcategories for Снюс
  const snusCategory = await db.category.findUnique({
    where: { name: "Снюс" },
  });
  if (snusCategory) {
    const snusTypes = ["Ватки", "Шайбы"];
    for (const type of snusTypes) {
      await db.category.upsert({
        where: { name: `${snusCategory.name} - ${type}` },
        update: {},
        create: {
          name: `${snusCategory.name} - ${type}`,
          parentId: snusCategory.id,
        },
      });
    }
  }

  console.log("Initial data seeded successfully");
}

// Seed test products
export async function _seedTestProducts() {
  // Get brands and categories
  const lostMaryBrand = await db.brand.findUnique({
    where: { name: "Lost Mary" },
  });
  const instaBarBrand = await db.brand.findUnique({
    where: { name: "Insta Bar" },
  });
  const laiskaBrand = await db.brand.findUnique({ where: { name: "Laiska" } });
  const fumoBrand = await db.brand.findUnique({ where: { name: "Fumo" } });

  const disposableCategory = await db.category.findUnique({
    where: { name: "Одноразки" },
  });
  const liquidCategory = await db.category.findUnique({
    where: { name: "Жижа" },
  });
  const snusCategory = await db.category.findUnique({
    where: { name: "Снюс" },
  });

  if (!disposableCategory || !liquidCategory || !snusCategory) {
    throw new Error("Required categories not found");
  }

  // Create admin user for products
  let adminUser = await db.user.findFirst({ where: { role: "MAIN_ADMIN" } });
  if (!adminUser) {
    const hashedPassword = await bcrypt.hash("admin123", 10);
    adminUser = await db.user.create({
      data: {
        name: "Main Admin",
        email: "admin@vapestore.com".toLowerCase(),
        password: hashedPassword,
        role: "MAIN_ADMIN",
      },
    });
  }

  // Test products data
  const testProducts = [
    // Lost Mary одноразки
    {
      name: "Lost Mary BM600 Яблоко",
      description: "Одноразовая электронная сигарета со вкусом яблока",
      costPrice: 250,
      retailPrice: 450,
      puffCount: 600,
      stock: 50,
      minStock: 10,
      brandId: lostMaryBrand?.id,
      categoryId: disposableCategory.id,
    },
    {
      name: "Lost Mary BM600 Виноград",
      description: "Одноразовая электронная сигарета со вкусом винограда",
      costPrice: 250,
      retailPrice: 450,
      puffCount: 600,
      stock: 45,
      minStock: 10,
      brandId: lostMaryBrand?.id,
      categoryId: disposableCategory.id,
    },
    {
      name: "Lost Mary OS5000 Манго",
      description: "Одноразовая электронная сигарета со вкусом манго",
      costPrice: 400,
      retailPrice: 650,
      puffCount: 5000,
      stock: 30,
      minStock: 5,
      brandId: lostMaryBrand?.id,
      categoryId: disposableCategory.id,
    },
    // Insta Bar одноразки
    {
      name: "Insta Bar IC7000 Арбуз",
      description: "Одноразовая электронная сигарета со вкусом арбуза",
      costPrice: 350,
      retailPrice: 550,
      puffCount: 7000,
      stock: 25,
      minStock: 5,
      brandId: instaBarBrand?.id,
      categoryId: disposableCategory.id,
    },
    {
      name: "Insta Bar IC7000 Ледяная мята",
      description: "Одноразовая электронная сигарета со вкусом ледяной мяты",
      costPrice: 350,
      retailPrice: 550,
      puffCount: 7000,
      stock: 20,
      minStock: 5,
      brandId: instaBarBrand?.id,
      categoryId: disposableCategory.id,
    },
    // Laiska одноразки
    {
      name: "Laiska Zero Персик",
      description: "Одноразовая электронная сигарета со вкусом персика",
      costPrice: 200,
      retailPrice: 350,
      puffCount: 800,
      stock: 60,
      minStock: 15,
      brandId: laiskaBrand?.id,
      categoryId: disposableCategory.id,
    },
    {
      name: "Laiska Zero Клубника",
      description: "Одноразовая электронная сигарета со вкусом клубники",
      costPrice: 200,
      retailPrice: 350,
      puffCount: 800,
      stock: 55,
      minStock: 15,
      brandId: laiskaBrand?.id,
      categoryId: disposableCategory.id,
    },
    // Жидкости Fumo
    {
      name: "Fumo Salt Яблоко 20мг",
      description: "Солевая жидкость со вкусом яблока, 30мл",
      costPrice: 180,
      retailPrice: 320,
      stock: 40,
      minStock: 10,
      brandId: fumoBrand?.id,
      categoryId: liquidCategory.id,
    },
    {
      name: "Fumo Salt Виноград 20мг",
      description: "Солевая жидкость со вкусом винограда, 30мл",
      costPrice: 180,
      retailPrice: 320,
      stock: 35,
      minStock: 10,
      brandId: fumoBrand?.id,
      categoryId: liquidCategory.id,
    },
    {
      name: "Fumo Classic Табак 6мг",
      description: "Классическая жидкость со вкусом табака, 60мл",
      costPrice: 250,
      retailPrice: 420,
      stock: 25,
      minStock: 8,
      brandId: fumoBrand?.id,
      categoryId: liquidCategory.id,
    },
  ];

  // Create products
  const validProducts = testProducts.filter(
    (product) => product.brandId && product.categoryId,
  );

  for (const productData of validProducts) {
    const product = await db.product.create({
      data: {
        name: productData.name,
        description: productData.description,
        costPrice: productData.costPrice,
        retailPrice: productData.retailPrice,
        puffCount: productData.puffCount,
        stock: productData.stock,
        minStock: productData.minStock,
        brandId: productData.brandId!,
        categoryId: productData.categoryId,
        createdBy: adminUser.id,
      },
    });

    // Create initial stock movement
    await db.stockMovement.create({
      data: {
        type: "IN",
        quantity: productData.stock,
        reason: "INITIAL_STOCK",
        productId: product.id,
        createdBy: adminUser.id,
      },
    });
  }

  console.log("Test products seeded successfully");
}

// Get stock movements for a product
export async function getStockMovements({ productId }: { productId: string }) {
  return await db.stockMovement.findMany({
    where: { productId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
}

// Get payment methods statistics
export async function getPaymentMethodsStats({
  period = "today",
}: {
  period?: "today" | "week" | "month";
} = {}) {
  const now = new Date();
  let startDate: Date;

  switch (period) {
    case "today":
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case "week":
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "month":
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  const salesByPaymentMethod = await db.sale.groupBy({
    by: ["paymentMethod"],
    where: {
      createdAt: { gte: startDate },
    },
    _sum: {
      finalAmount: true,
    },
    _count: true,
  });

  return salesByPaymentMethod.map((item) => ({
    paymentMethod: item.paymentMethod,
    totalAmount: item._sum.finalAmount || 0,
    count: item._count,
  }));
}

// Active shift management
export async function startShift() {
  const { userId } = await getAuth();
  if (!userId) throw new Error("Not authenticated");

  const now = new Date();
  const currentHour = now.getHours();

  // Check if it's after 23:00
  if (currentHour >= 23) {
    throw new Error("Смена не может быть начата после 23:00");
  }

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Check if there's already an active shift today
  const existingShift = await db.workSession.findFirst({
    where: {
      userId,
      date: today,
    },
  });

  if (existingShift && existingShift.hours === 0) {
    throw new Error("У вас уже есть активная смена сегодня");
  }

  if (existingShift) {
    throw new Error("Смена на сегодня уже завершена");
  }

  // Get user's hourly rate
  let userSettings = await db.userSettings.findUnique({
    where: { userId },
  });

  if (!userSettings) {
    userSettings = await db.userSettings.create({
      data: {
        userId,
        hourlyRate: 200,
      },
    });
  }

  const workSession = await db.workSession.create({
    data: {
      userId,
      date: today,
      hours: 0, // 0 indicates active shift
      hourlyRate: userSettings.hourlyRate,
      totalPay: 0,
    },
  });

  await logActivity({
    action: "START_SHIFT",
    details: `Начата рабочая смена`,
  });

  return {
    shiftId: workSession.id,
    startTime: now.toISOString(),
    hourlyRate: userSettings.hourlyRate,
  };
}

export async function endShift({ hours }: { hours: number }) {
  const { userId } = await getAuth();
  if (!userId) throw new Error("Not authenticated");

  const today = new Date();
  const todayStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );

  const activeShift = await db.workSession.findFirst({
    where: {
      userId,
      date: todayStart,
      hours: 0, // Active shift
    },
  });

  if (!activeShift) {
    throw new Error("Нет активной смены для завершения");
  }

  const totalPay = hours * activeShift.hourlyRate;

  const updatedSession = await db.workSession.update({
    where: { id: activeShift.id },
    data: {
      hours,
      totalPay,
    },
  });

  await logActivity({
    action: "END_SHIFT",
    details: `Завершена рабочая смена: ${hours.toFixed(2)} часов, ${totalPay.toFixed(2)} руб.`,
  });

  return updatedSession;
}

export async function getActiveShift() {
  const { userId } = await getAuth();
  if (!userId) throw new Error("Not authenticated");

  const today = new Date();
  const todayStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );

  const activeShift = await db.workSession.findFirst({
    where: {
      userId,
      date: todayStart,
      hours: 0, // Active shift
    },
  });

  return activeShift;
}

// Get sales summary
export async function getSalesSummary({
  period = "today",
}: {
  period?: "today" | "week" | "month";
} = {}) {
  const now = new Date();
  let startDate: Date;

  switch (period) {
    case "today":
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case "week":
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "month":
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  const sales = await db.sale.findMany({
    where: {
      createdAt: { gte: startDate },
    },
    include: {
      items: {
        include: {
          product: {
            include: {
              brand: true,
              category: true,
            },
          },
        },
      },
    },
  });

  const totalRevenue = sales.reduce((sum, sale) => sum + sale.finalAmount, 0);
  const totalSales = sales.length;

  // Get top selling products
  const productSales = new Map<
    string,
    { product: any; quantity: number; revenue: number }
  >();

  sales.forEach((sale) => {
    sale.items.forEach((item) => {
      const existing = productSales.get(item.productId);
      if (existing) {
        existing.quantity += item.quantity;
        existing.revenue += item.totalPrice;
      } else {
        productSales.set(item.productId, {
          product: item.product,
          quantity: item.quantity,
          revenue: item.totalPrice,
        });
      }
    });
  });

  const topProducts = Array.from(productSales.values())
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  return {
    totalRevenue,
    totalSales,
    topProducts,
    period,
  };
}

// Quick sale function for POS
export async function createQuickSale({
  productId,
  quantity = 1,
  discount = 0,
  paymentMethod = "CASH",
}: {
  productId: string;
  quantity?: number;
  discount?: number;
  paymentMethod?: "CASH" | "CARD" | "TRANSFER" | "SBP";
}) {
  const { userId } = await getAuth();
  if (!userId) throw new Error("Not authenticated");

  const product = await db.product.findUnique({ where: { id: productId } });
  if (!product) throw new Error("Product not found");

  if (product.stock < quantity) {
    throw new Error("Insufficient stock");
  }

  const totalAmount = product.retailPrice * quantity;
  const finalAmount = totalAmount - discount;

  const sale = await db.sale.create({
    data: {
      totalAmount,
      discount,
      finalAmount,
      paymentMethod,
      userId,
      items: {
        create: {
          productId,
          quantity,
          unitPrice: product.retailPrice,
          totalPrice: product.retailPrice * quantity,
        },
      },
    },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  // Update stock
  await db.product.update({
    where: { id: productId },
    data: {
      stock: {
        decrement: quantity,
      },
    },
  });

  // Create stock movement
  await db.stockMovement.create({
    data: {
      type: "OUT",
      quantity: quantity,
      reason: "SALE",
      productId,
      createdBy: userId,
    },
  });

  await logActivity({
    action: "QUICK_SALE",
    details: `Quick sale: ${product.name} x${quantity} for ${finalAmount} руб.`,
    productId,
  });

  return sale;
}
