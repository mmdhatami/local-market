import { Hono } from "hono";

type Env = {
  DB?: D1Database;
};

const app = new Hono<{ Bindings: Env }>();

app.get("/", (c) => {
  return c.json({
    success: true,
    service: "local-market-api",
    message: "API بازار با موفقیت فعال است",
    version: "1.1.0"
  });
});

app.get("/api/health", async (c) => {
  let database = "not-configured";

  if (c.env.DB) {
    try {
      await c.env.DB.prepare("SELECT 1").first();
      database = "connected";
    } catch {
      database = "error";
    }
  }

  return c.json({
    success: true,
    status: "ok",
    service: "local-market-api",
    database,
    timestamp: new Date().toISOString()
  });
});

app.get("/api/categories", async (c) => {
  if (!c.env.DB) {
    return c.json(
      {
        success: false,
        error: "Database is not configured"
      },
      500
    );
  }

  try {
    const result = await c.env.DB.prepare(`
      SELECT
        id,
        title,
        icon,
        description,
        parent_id,
        sort_order
      FROM market_categories
      WHERE is_active = 1
      ORDER BY sort_order ASC, created_at ASC
    `).all();

    return c.json({
      success: true,
      categories: result.results
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        error: "Failed to load categories from database"
      },
      500
    );
  }
});

app.get("/api", (c) => {
  return c.json({
    success: true,
    name: "بازار",
    description: "بازار هوشمند محلی"
  });
});

export default app;
