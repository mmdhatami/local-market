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
    version: "1.0.0"
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

app.get("/api/categories", (c) => {
  return c.json({
    success: true,
    categories: [
      {
        id: "buy-sell",
        title: "خرید و فروش",
        icon: "🛒"
      },
      {
        id: "services",
        title: "خدمات",
        icon: "🛠️"
      },
      {
        id: "businesses",
        title: "کسب‌وکارها",
        icon: "🏪"
      },
      {
        id: "jobs",
        title: "کار و استخدام",
        icon: "💼"
      },
      {
        id: "real-estate",
        title: "ملک",
        icon: "🏠"
      },
      {
        id: "vehicles",
        title: "خودرو",
        icon: "🚗"
      },
      {
        id: "agriculture",
        title: "کشاورزی",
        icon: "🌱"
      },
      {
        id: "rent",
        title: "اجاره",
        icon: "🔑"
      }
    ]
  });
});

app.get("/api", (c) => {
  return c.json({
    success: true,
    name: "بازار",
    description: "بازار هوشمند محلی"
  });
});

export default app;
