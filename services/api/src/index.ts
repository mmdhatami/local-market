import { Hono } from "hono";

type Env = {
  DB?: D1Database;
  ASSETS?: Fetcher;
};

const app = new Hono<{ Bindings: Env }>();

/* =========================================================
   HOME
========================================================= */

app.get("/", async (c) => {
  if (c.env.ASSETS) {
    return c.env.ASSETS.fetch(c.req.raw);
  }

  return c.json({
    success: true,
    service: "local-market-api",
    message: "API دردونه با موفقیت فعال است",
    version: "1.4.0"
  });
});

/* =========================================================
   HEALTH
========================================================= */

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

/* =========================================================
   CATEGORIES
========================================================= */

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
    console.error("GET /api/categories error:", error);

    return c.json(
      {
        success: false,
        error: "Failed to load categories from database"
      },
      500
    );
  }
});

/* =========================================================
   REGISTER USER
========================================================= */

app.post("/api/register", async (c) => {
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
    const body = await c.req.json();

    const fullName =
      body.full_name !== undefined
        ? String(body.full_name).trim()
        : "";

    const mobile =
      body.mobile !== undefined
        ? String(body.mobile).trim()
        : "";

    const password =
      body.password !== undefined
        ? String(body.password)
        : "";

    /* -------------------------
       Validation
    ------------------------- */

    if (!fullName || fullName.length < 2) {
      return c.json(
        {
          success: false,
          error: "نام و نام خانوادگی الزامی است"
        },
        400
      );
    }

    if (!mobile || mobile.length < 8) {
      return c.json(
        {
          success: false,
          error: "شماره موبایل معتبر وارد کنید"
        },
        400
      );
    }

    if (!password || password.length < 6) {
      return c.json(
        {
          success: false,
          error: "رمز عبور باید حداقل ۶ کاراکتر باشد"
        },
        400
      );
    }

    /* -------------------------
       Check existing mobile
    ------------------------- */

    const existingUser = await c.env.DB
      .prepare(`
        SELECT
          id,
          mobile
        FROM app_users
        WHERE mobile = ?
        LIMIT 1
      `)
      .bind(mobile)
      .first();

    if (existingUser) {
      return c.json(
        {
          success: false,
          error: "این شماره موبایل قبلاً ثبت شده است"
        },
        409
      );
    }

    /* -------------------------
       Password hashing
       PBKDF2 + SHA-256
    ------------------------- */

    const encoder = new TextEncoder();

    const saltBytes = crypto.getRandomValues(
      new Uint8Array(16)
    );

    const passwordKey = await crypto.subtle.importKey(
      "raw",
      encoder.encode(password),
      {
        name: "PBKDF2"
      },
      false,
      ["deriveBits"]
    );

    const hashBuffer = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt: saltBytes,
        iterations: 100000,
        hash: "SHA-256"
      },
      passwordKey,
      256
    );

    const hashBytes = new Uint8Array(hashBuffer);

    function bytesToHex(bytes: Uint8Array) {
      return Array.from(bytes)
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");
    }

    const salt = bytesToHex(saltBytes);
    const passwordHash = bytesToHex(hashBytes);

    /*
      ذخیره به شکل:
      pbkdf2$salt$hash
    */

    const storedPassword =
      `pbkdf2$${salt}$${passwordHash}`;

    /* -------------------------
       Create user ID
    ------------------------- */

    const userId = crypto.randomUUID();

    /* -------------------------
       Insert user
    ------------------------- */

    await c.env.DB
      .prepare(`
        INSERT INTO app_users (
          id,
          full_name,
          mobile,
          password_hash,
          role,
          phone_verified,
          identity_verified,
          business_verified,
          is_blocked
        )
        VALUES (?, ?, ?, ?, 'user', 0, 0, 0, 0)
      `)
      .bind(
        userId,
        fullName,
        mobile,
        storedPassword
      )
      .run();

    /* -------------------------
       Response
    ------------------------- */

    return c.json(
      {
        success: true,
        message: "حساب کاربری با موفقیت ایجاد شد",
        user: {
          id: userId,
          full_name: fullName,
          mobile,
          role: "user",
          phone_verified: false,
          identity_verified: false,
          business_verified: false
        }
      },
      201
    );
  } catch (error) {
    console.error("POST /api/register error:", error);

    return c.json(
      {
        success: false,
        error: "ثبت‌نام انجام نشد"
      },
      500
    );
  }
});

/* =========================================================
   GET USER
========================================================= */

app.get("/api/users/:id", async (c) => {
  if (!c.env.DB) {
    return c.json(
      {
        success: false,
        error: "Database is not configured"
      },
      500
    );
  }

  const userId = c.req.param("id");

  try {
    const user = await c.env.DB
      .prepare(`
        SELECT
          id,
          full_name,
          mobile,
          role,
          phone_verified,
          identity_verified,
          business_verified,
          avatar_url,
          bio,
          is_blocked,
          created_at,
          updated_at
        FROM app_users
        WHERE id = ?
        LIMIT 1
      `)
      .bind(userId)
      .first();

    if (!user) {
      return c.json(
        {
          success: false,
          error: "کاربر پیدا نشد"
        },
        404
      );
    }

    return c.json({
      success: true,
      user
    });
  } catch (error) {
    console.error("GET /api/users/:id error:", error);

    return c.json(
      {
        success: false,
        error: "خطا در دریافت اطلاعات کاربر"
      },
      500
    );
  }
});

/* =========================================================
   GET LISTINGS
========================================================= */

app.get("/api/listings", async (c) => {
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
    const categoryId = c.req.query("category_id");
    const search = c.req.query("search");
    const city = c.req.query("city");

    let query = `
      SELECT
        ml.id,
        ml.user_id,
        ml.category_id,
        ml.title,
        ml.description,
        ml.listing_type,
        ml.price,
        ml.price_type,
        ml.old_price,
        ml.discount_percent,
        ml.city,
        ml.location_id,
        ml.status,
        ml.condition,
        ml.view_count,
        ml.favorite_count,
        ml.message_count,
        ml.call_count,
        ml.created_at,
        ml.updated_at,

        mc.title AS category_title,
        mc.icon AS category_icon,

        (
          SELECT lp.file_url
          FROM listing_photos lp
          WHERE lp.listing_id = ml.id
          ORDER BY lp.sort_order ASC, lp.created_at ASC
          LIMIT 1
        ) AS image_url

      FROM market_listings ml

      LEFT JOIN market_categories mc
        ON mc.id = ml.category_id

      WHERE ml.status = 'active'
    `;

    const bindings: string[] = [];

    if (categoryId) {
      query += ` AND ml.category_id = ?`;
      bindings.push(categoryId);
    }

    if (search) {
      query += `
        AND (
          ml.title LIKE ?
          OR ml.description LIKE ?
        )
      `;

      const searchValue = `%${search}%`;

      bindings.push(searchValue);
      bindings.push(searchValue);
    }

    if (city) {
      query += ` AND ml.city = ?`;
      bindings.push(city);
    }

    query += `
      ORDER BY ml.created_at DESC
      LIMIT 100
    `;

    const result = await c.env.DB
      .prepare(query)
      .bind(...bindings)
      .all();

    return c.json({
      success: true,
      listings: result.results
    });
  } catch (error) {
    console.error("GET /api/listings error:", error);

    return c.json(
      {
        success: false,
        error: "Failed to load listings"
      },
      500
    );
  }
});

/* =========================================================
   GET SINGLE LISTING
========================================================= */

app.get("/api/listings/:id", async (c) => {
  if (!c.env.DB) {
    return c.json(
      {
        success: false,
        error: "Database is not configured"
      },
      500
    );
  }

  const id = c.req.param("id");

  try {
    const listing = await c.env.DB
      .prepare(`
        SELECT
          ml.id,
          ml.user_id,
          ml.category_id,
          ml.title,
          ml.description,
          ml.listing_type,
          ml.price,
          ml.price_type,
          ml.old_price,
          ml.discount_percent,
          ml.city,
          ml.location_id,
          ml.status,
          ml.condition,
          ml.view_count,
          ml.favorite_count,
          ml.message_count,
          ml.call_count,
          ml.created_at,
          ml.updated_at,

          mc.title AS category_title,
          mc.icon AS category_icon

        FROM market_listings ml

        LEFT JOIN market_categories mc
          ON mc.id = ml.category_id

        WHERE ml.id = ?
        LIMIT 1
      `)
      .bind(id)
      .first();

    if (!listing) {
      return c.json(
        {
          success: false,
          error: "Listing not found"
        },
        404
      );
    }

    const photos = await c.env.DB
      .prepare(`
        SELECT
          id,
          file_key,
          file_url,
          sort_order,
          created_at
        FROM listing_photos
        WHERE listing_id = ?
        ORDER BY sort_order ASC, created_at ASC
      `)
      .bind(id)
      .all();

    return c.json({
      success: true,
      listing,
      photos: photos.results
    });
  } catch (error) {
    console.error("GET /api/listings/:id error:", error);

    return c.json(
      {
        success: false,
        error: "Failed to load listing"
      },
      500
    );
  }
});

/* =========================================================
   CREATE LISTING
========================================================= */

app.post("/api/listings", async (c) => {
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
    const body = await c.req.json();

    const {
      user_id,
      category_id,
      title,
      description,
      listing_type = "product",
      price = null,
      price_type = "fixed",
      old_price = null,
      discount_percent = null,
      city = null,
      location_id = null,
      condition = null,
      expires_at = null
    } = body;

    if (!user_id) {
      return c.json(
        {
          success: false,
          error: "user_id is required"
        },
        400
      );
    }

    if (!category_id) {
      return c.json(
        {
          success: false,
          error: "category_id is required"
        },
        400
      );
    }

    if (!title || String(title).trim().length < 2) {
      return c.json(
        {
          success: false,
          error: "عنوان آگهی الزامی است"
        },
        400
      );
    }

    const user = await c.env.DB
      .prepare(`
        SELECT
          id,
          is_blocked
        FROM app_users
        WHERE id = ?
        LIMIT 1
      `)
      .bind(String(user_id))
      .first<{
        id: string;
        is_blocked: number;
      }>();

    if (!user) {
      return c.json(
        {
          success: false,
          error: "کاربر پیدا نشد"
        },
        400
      );
    }

    if (Number(user.is_blocked) === 1) {
      return c.json(
        {
          success: false,
          error: "این حساب کاربری مسدود است"
        },
        403
      );
    }

    const category = await c.env.DB
      .prepare(`
        SELECT
          id,
          title
        FROM market_categories
        WHERE id = ?
          AND is_active = 1
        LIMIT 1
      `)
      .bind(String(category_id))
      .first<{
        id: string;
        title: string;
      }>();

    if (!category) {
      return c.json(
        {
          success: false,
          error: "دسته‌بندی پیدا نشد"
        },
        400
      );
    }

    const listingId = crypto.randomUUID();

    await c.env.DB
      .prepare(`
        INSERT INTO market_listings (
          id,
          user_id,
          category_id,
          title,
          description,
          listing_type,
          price,
          price_type,
          old_price,
          discount_percent,
          city,
          location_id,
          status,
          condition,
          expires_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)
      `)
      .bind(
        listingId,
        String(user_id),
        String(category_id),
        String(title).trim(),
        description ? String(description).trim() : null,
        String(listing_type),
        price !== null && price !== ""
          ? Number(price)
          : null,
        String(price_type),
        old_price !== null && old_price !== ""
          ? Number(old_price)
          : null,
        discount_percent !== null &&
        discount_percent !== ""
          ? Number(discount_percent)
          : null,
        city ? String(city).trim() : null,
        location_id ? String(location_id) : null,
        condition ? String(condition).trim() : null,
        expires_at ? String(expires_at) : null
      )
      .run();

    return c.json(
      {
        success: true,
        message: "آگهی با موفقیت ثبت شد",
        listing: {
          id: listingId,
          user_id: String(user_id),
          category_id: String(category_id),
          category_title: category.title,
          title: String(title).trim(),
          description: description
            ? String(description).trim()
            : null,
          price:
            price !== null && price !== ""
              ? Number(price)
              : null,
          city: city ? String(city).trim() : null,
          status: "active"
        }
      },
      201
    );
  } catch (error) {
    console.error("POST /api/listings error:", error);

    return c.json(
      {
        success: false,
        error: "Failed to create listing"
      },
      500
    );
  }
});

/* =========================================================
   API INFO
========================================================= */

app.get("/api", (c) => {
  return c.json({
    success: true,
    name: "دردونه",
    description: "بازار هوشمند محلی",
    version: "1.4.0",
    endpoints: {
      health: "/api/health",
      categories: "/api/categories",
      register: "/api/register",
      users: "/api/users/:id",
      listings: "/api/listings"
    }
  });
});

/* =========================================================
   NOT FOUND
========================================================= */

app.notFound(async (c) => {
  if (c.env.ASSETS) {
    return c.env.ASSETS.fetch(c.req.raw);
  }

  return c.json(
    {
      success: false,
      error: "Not found"
    },
    404
  );
});

export default app;
