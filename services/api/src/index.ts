import { Hono } from "hono";

type Env = {
  DB: D1Database;
  ASSETS: Fetcher;
  IMAGEKIT_PRIVATE_KEY: string;
};

type Variables = {
  userId?: string;
};

const app = new Hono<{
  Bindings: Env;
  Variables: Variables;
}>();

/* =========================================================
   HELPERS
========================================================= */

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=UTF-8"
    }
  });
}

function generateId(prefix = "") {
  return `${prefix}${crypto.randomUUID()}`;
}

function base64FromBytes(bytes: Uint8Array) {
  let binary = "";

  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }

  return btoa(binary);
}

function bytesFromBase64(value: string) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes;
}

function normalizeMobile(value: unknown) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, "");
}

function cleanString(value: unknown) {
  const result = String(value ?? "").trim();
  return result || null;
}

function numberOrNull(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return null;
  }

  return number;
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods":
      "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400"
  };
}

function withCors(response: Response) {
  const headers = new Headers(response.headers);

  for (const [key, value] of Object.entries(corsHeaders())) {
    headers.set(key, value);
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

/* =========================================================
   PASSWORD HASH
   PBKDF2 + SHA-256
========================================================= */

async function hashPassword(password: string) {
  const salt = crypto.getRandomValues(
    new Uint8Array(16)
  );

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: 100000,
      hash: "SHA-256"
    },
    keyMaterial,
    256
  );

  const hash = new Uint8Array(derivedBits);

  return `pbkdf2$${base64FromBytes(
    salt
  )}$${base64FromBytes(hash)}`;
}

/* =========================================================
   IMAGEKIT SIGNATURE
========================================================= */

async function createImageKitSignature(
  privateKey: string,
  token: string,
  expire: number
) {
  const encoder = new TextEncoder();

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(privateKey),
    {
      name: "HMAC",
      hash: "SHA-1"
    },
    false,
    ["sign"]
  );

  const signatureBuffer =
    await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(`${token}${expire}`)
    );

  const bytes = new Uint8Array(
    signatureBuffer
  );

  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary);
}

/* =========================================================
   HEALTH
========================================================= */

app.get("/api/health", async (c) => {
  let database = "not-configured";

  try {
    if (c.env.DB) {
      await c.env.DB
        .prepare("SELECT 1 AS ok")
        .first();

      database = "connected";
    }
  } catch {
    database = "error";
  }

  return c.json({
    success: true,
    service: "local-market",
    name: "دردونه",
    database,
    time: new Date().toISOString()
  });
});

/* =========================================================
   IMAGEKIT AUTH
========================================================= */

app.post("/api/imagekit-auth", async (c) => {
  try {
    if (!c.env.IMAGEKIT_PRIVATE_KEY) {
      return c.json(
        {
          success: false,
          error:
            "IMAGEKIT_PRIVATE_KEY در Cloudflare تنظیم نشده است."
        },
        500
      );
    }

    const token = crypto.randomUUID();

    const expire =
      Math.floor(Date.now() / 1000) + 60 * 60;

    const signature =
      await createImageKitSignature(
        c.env.IMAGEKIT_PRIVATE_KEY,
        token,
        expire
      );

    return c.json({
      success: true,
      token,
      expire,
      signature,

      /*
       * این کلید عمومی است و اطلاعات محرمانه محسوب نمی‌شود.
       */
      publicKey:
        "public_W4QIebCncXt6i+kQa1XC7LAZH5M="
    });
  } catch (error) {
    console.error(
      "ImageKit auth error:",
      error
    );

    return c.json(
      {
        success: false,
        error:
          "ساخت مجوز آپلود تصویر ناموفق بود."
      },
      500
    );
  }
});

/* =========================================================
   CATEGORIES
========================================================= */

app.get("/api/categories", async (c) => {
  try {
    const result = await c.env.DB
      .prepare(
        `
        SELECT
          id,
          parent_id,
          title,
          slug,
          icon,
          description,
          sort_order,
          is_active,
          created_at,
          updated_at
        FROM market_categories
        WHERE is_active = 1
        ORDER BY sort_order ASC, created_at ASC
        `
      )
      .all();

    return c.json({
      success: true,
      categories: result.results ?? []
    });
  } catch (error) {
    console.error(
      "Categories error:",
      error
    );

    return c.json(
      {
        success: false,
        error:
          "دریافت دسته‌بندی‌ها ناموفق بود."
      },
      500
    );
  }
});

/* =========================================================
   REGISTER
========================================================= */

app.post("/api/register", async (c) => {
  try {
    const body = await c.req.json();

    const fullName = String(
      body.full_name ?? ""
    ).trim();

    const mobile = normalizeMobile(
      body.mobile
    );

    const password = String(
      body.password ?? ""
    );

    if (!fullName) {
      return c.json(
        {
          success: false,
          error:
            "نام و نام خانوادگی را وارد کنید."
        },
        400
      );
    }

    if (!mobile) {
      return c.json(
        {
          success: false,
          error: "شماره موبایل را وارد کنید."
        },
        400
      );
    }

    if (!password) {
      return c.json(
        {
          success: false,
          error: "رمز عبور را وارد کنید."
        },
        400
      );
    }

    if (password.length < 6) {
      return c.json(
        {
          success: false,
          error:
            "رمز عبور باید حداقل ۶ کاراکتر باشد."
        },
        400
      );
    }

    const existing = await c.env.DB
      .prepare(
        `
        SELECT id
        FROM app_users
        WHERE mobile = ?
        LIMIT 1
        `
      )
      .bind(mobile)
      .first();

    if (existing) {
      return c.json(
        {
          success: false,
          error:
            "این شماره موبایل قبلاً ثبت شده است."
        },
        409
      );
    }

    const id = generateId("usr_");

    const passwordHash =
      await hashPassword(password);

    await c.env.DB
      .prepare(
        `
        INSERT INTO app_users (
          id,
          full_name,
          mobile,
          password_hash,
          role,
          phone_verified,
          identity_verified,
          business_verified
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `
      )
      .bind(
        id,
        fullName,
        mobile,
        passwordHash,
        "user",
        0,
        0,
        0
      )
      .run();

    const user = await c.env.DB
      .prepare(
        `
        SELECT
          id,
          full_name,
          mobile,
          role,
          phone_verified,
          identity_verified,
          business_verified
        FROM app_users
        WHERE id = ?
        LIMIT 1
        `
      )
      .bind(id)
      .first();

    return c.json({
      success: true,
      user
    });
  } catch (error) {
    console.error(
      "Register error:",
      error
    );

    return c.json(
      {
        success: false,
        error:
          "ثبت‌نام انجام نشد."
      },
      500
    );
  }
});

/* =========================================================
   USER
========================================================= */

app.get("/api/users/:id", async (c) => {
  try {
    const id = c.req.param("id");

    const user = await c.env.DB
      .prepare(
        `
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
        `
      )
      .bind(id)
      .first();

    if (!user) {
      return c.json(
        {
          success: false,
          error: "کاربر پیدا نشد."
        },
        404
      );
    }

    return c.json({
      success: true,
      user
    });
  } catch (error) {
    console.error(
      "User error:",
      error
    );

    return c.json(
      {
        success: false,
        error:
          "دریافت اطلاعات کاربر ناموفق بود."
      },
      500
    );
  }
});

/* =========================================================
   LISTINGS - LIST
========================================================= */

app.get("/api/listings", async (c) => {
  try {
    const categoryId =
      c.req.query("category_id");

    const search =
      c.req.query("search");

    const city =
      c.req.query("city");

    const conditions: string[] = [
      "l.status = 'active'"
    ];

    const bindings: unknown[] = [];

    if (categoryId) {
      conditions.push(
        "l.category_id = ?"
      );

      bindings.push(categoryId);
    }

    if (city) {
      conditions.push(
        "l.city = ?"
      );

      bindings.push(city);
    }

    if (search) {
      conditions.push(
        `
        (
          l.title LIKE ?
          OR l.description LIKE ?
          OR l.city LIKE ?
        )
        `
      );

      const searchValue = `%${search}%`;

      bindings.push(
        searchValue,
        searchValue,
        searchValue
      );
    }

    const where =
      conditions.length > 0
        ? `WHERE ${conditions.join(" AND ")}`
        : "";

    const query = `
      SELECT
        l.id,
        l.user_id,
        l.category_id,
        l.title,
        l.description,
        l.listing_type,
        l.price,
        l.price_type,
        l.old_price,
        l.discount_percent,
        l.city,
        l.location_id,
        l.status,
        l.condition,
        l.view_count,
        l.favorite_count,
        l.message_count,
        l.call_count,
        l.expires_at,
        l.created_at,
        l.updated_at,

        c.title AS category_title,
        c.icon AS category_icon,

        (
          SELECT lp.file_url
          FROM listing_photos lp
          WHERE lp.listing_id = l.id
            AND lp.file_url IS NOT NULL
          ORDER BY lp.sort_order ASC, lp.created_at ASC
          LIMIT 1
        ) AS image_url

      FROM market_listings l

      LEFT JOIN market_categories c
        ON c.id = l.category_id

      ${where}

      ORDER BY l.created_at DESC
      LIMIT 100
    `;

    const result = await c.env.DB
      .prepare(query)
      .bind(...bindings)
      .all();

    return c.json({
      success: true,
      listings: result.results ?? []
    });
  } catch (error) {
    console.error(
      "Listings error:",
      error
    );

    return c.json(
      {
        success: false,
        error:
          "دریافت آگهی‌ها ناموفق بود."
      },
      500
    );
  }
});

/* =========================================================
   LISTING - SINGLE
========================================================= */

app.get("/api/listings/:id", async (c) => {
  try {
    const id = c.req.param("id");

    const listing = await c.env.DB
      .prepare(
        `
        SELECT
          l.id,
          l.user_id,
          l.category_id,
          l.title,
          l.description,
          l.listing_type,
          l.price,
          l.price_type,
          l.old_price,
          l.discount_percent,
          l.city,
          l.location_id,
          l.status,
          l.condition,
          l.view_count,
          l.favorite_count,
          l.message_count,
          l.call_count,
          l.expires_at,
          l.created_at,
          l.updated_at,

          c.title AS category_title,
          c.icon AS category_icon

        FROM market_listings l

        LEFT JOIN market_categories c
          ON c.id = l.category_id

        WHERE l.id = ?
        LIMIT 1
        `
      )
      .bind(id)
      .first();

    if (!listing) {
      return c.json(
        {
          success: false,
          error: "آگهی پیدا نشد."
        },
        404
      );
    }

    const photos = await c.env.DB
      .prepare(
        `
        SELECT
          id,
          listing_id,
          file_key,
          file_url,
          sort_order,
          created_at
        FROM listing_photos
        WHERE listing_id = ?
        ORDER BY sort_order ASC, created_at ASC
        `
      )
      .bind(id)
      .all();

    await c.env.DB
      .prepare(
        `
        UPDATE market_listings
        SET view_count = view_count + 1
        WHERE id = ?
        `
      )
      .bind(id)
      .run();

    return c.json({
      success: true,
      listing,
      photos: photos.results ?? []
    });
  } catch (error) {
    console.error(
      "Single listing error:",
      error
    );

    return c.json(
      {
        success: false,
        error:
          "دریافت آگهی ناموفق بود."
      },
      500
    );
  }
});

/* =========================================================
   CREATE LISTING
========================================================= */

app.post("/api/listings", async (c) => {
  try {
    const body = await c.req.json();

    const userId = cleanString(
      body.user_id
    );

    const categoryId = cleanString(
      body.category_id
    );

    const title = String(
      body.title ?? ""
    ).trim();

    const description =
      cleanString(body.description);

    const listingType =
      cleanString(body.listing_type) ||
      "product";

    const price =
      numberOrNull(body.price);

    const priceType =
      cleanString(body.price_type) ||
      "fixed";

    const city =
      cleanString(body.city);

    const condition =
      cleanString(body.condition);

    if (!userId) {
      return c.json(
        {
          success: false,
          error:
            "کاربر مشخص نشده است."
        },
        400
      );
    }

    if (!categoryId) {
      return c.json(
        {
          success: false,
          error:
            "دسته‌بندی مشخص نشده است."
        },
        400
      );
    }

    if (!title || title.length < 3) {
      return c.json(
        {
          success: false,
          error:
            "عنوان آگهی باید حداقل ۳ کاراکتر باشد."
        },
        400
      );
    }

    if (!description) {
      return c.json(
        {
          success: false,
          error:
            "توضیحات آگهی الزامی است."
        },
        400
      );
    }

    const user = await c.env.DB
      .prepare(
        `
        SELECT id, is_blocked
        FROM app_users
        WHERE id = ?
        LIMIT 1
        `
      )
      .bind(userId)
      .first<{
        id: string;
        is_blocked: number;
      }>();

    if (!user) {
      return c.json(
        {
          success: false,
          error:
            "کاربر پیدا نشد."
        },
        404
      );
    }

    if (Number(user.is_blocked) === 1) {
      return c.json(
        {
          success: false,
          error:
            "حساب کاربری شما مسدود است."
        },
        403
      );
    }

    const category =
      await c.env.DB
        .prepare(
          `
          SELECT id
          FROM market_categories
          WHERE id = ?
            AND is_active = 1
          LIMIT 1
          `
        )
        .bind(categoryId)
        .first();

    if (!category) {
      return c.json(
        {
          success: false,
          error:
            "دسته‌بندی معتبر نیست."
        },
        400
      );
    }

    const id =
      generateId("lst_");

    await c.env.DB
      .prepare(
        `
        INSERT INTO market_listings (
          id,
          user_id,
          category_id,
          title,
          description,
          listing_type,
          price,
          price_type,
          city,
          status,
          condition
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)
        `
      )
      .bind(
        id,
        userId,
        categoryId,
        title,
        description,
        listingType,
        price,
        priceType,
        city,
        condition
      )
      .run();

    const listing =
      await c.env.DB
        .prepare(
          `
          SELECT
            l.*,
            c.title AS category_title,
            c.icon AS category_icon
          FROM market_listings l
          LEFT JOIN market_categories c
            ON c.id = l.category_id
          WHERE l.id = ?
          LIMIT 1
          `
        )
        .bind(id)
        .first();

    return c.json(
      {
        success: true,
        listing
      },
      201
    );
  } catch (error) {
    console.error(
      "Create listing error:",
      error
    );

    return c.json(
      {
        success: false,
        error:
          "ثبت آگهی انجام نشد."
      },
      500
    );
  }
});

/* =========================================================
   ADD LISTING PHOTO
========================================================= */

app.post(
  "/api/listings/:id/photos",
  async (c) => {
    try {
      const listingId =
        c.req.param("id");

      const body = await c.req.json();

      const fileKey =
        String(body.file_key ?? "").trim();

      const fileUrl =
        String(body.file_url ?? "").trim();

      const sortOrder =
        Number(body.sort_order ?? 0);

      if (!fileKey || !fileUrl) {
        return c.json(
          {
            success: false,
            error:
              "اطلاعات تصویر ناقص است."
          },
          400
        );
      }

      const listing =
        await c.env.DB
          .prepare(
            `
            SELECT id
            FROM market_listings
            WHERE id = ?
            LIMIT 1
            `
          )
          .bind(listingId)
          .first();

      if (!listing) {
        return c.json(
          {
            success: false,
            error:
              "آگهی پیدا نشد."
          },
          404
        );
      }

      const photoId =
        generateId("photo_");

      await c.env.DB
        .prepare(
          `
          INSERT INTO listing_photos (
            id,
            listing_id,
            file_key,
            file_url,
            sort_order
          )
          VALUES (?, ?, ?, ?, ?)
          `
        )
        .bind(
          photoId,
          listingId,
          fileKey,
          fileUrl,
          Number.isFinite(sortOrder)
            ? sortOrder
            : 0
        )
        .run();

      return c.json(
        {
          success: true,
          photo: {
            id: photoId,
            listing_id: listingId,
            file_key: fileKey,
            file_url: fileUrl,
            sort_order: sortOrder
          }
        },
        201
      );
    } catch (error) {
      console.error(
        "Add listing photo error:",
        error
      );

      return c.json(
        {
          success: false,
          error:
            "ذخیره تصویر آگهی انجام نشد."
        },
        500
      );
    }
  }
);

/* =========================================================
   DELETE LISTING PHOTO
========================================================= */

app.delete(
  "/api/listings/:listingId/photos/:photoId",
  async (c) => {
    try {
      const listingId =
        c.req.param("listingId");

      const photoId =
        c.req.param("photoId");

      const result =
        await c.env.DB
          .prepare(
            `
            DELETE FROM listing_photos
            WHERE id = ?
              AND listing_id = ?
            `
          )
          .bind(
            photoId,
            listingId
          )
          .run();

      if (!result.success) {
        return c.json(
          {
            success: false,
            error:
              "حذف تصویر انجام نشد."
          },
          500
        );
      }

      return c.json({
        success: true
      });
    } catch (error) {
      console.error(
        "Delete listing photo error:",
        error
      );

      return c.json(
        {
          success: false,
          error:
            "حذف تصویر ناموفق بود."
        },
        500
      );
    }
  }
);

/* =========================================================
   GENERIC API INFO
========================================================= */

app.get("/api", (c) => {
  return c.json({
    success: true,
    name: "دردونه",
    service: "local-market-api",
    version: "1.0.0"
  });
});

/* =========================================================
   ROOT
========================================================= */

app.get("/", async (c) => {
  try {
    return await c.env.ASSETS.fetch(
      c.req.raw
    );
  } catch {
    return c.html(`
      <!doctype html>
      <html lang="fa" dir="rtl">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>دردونه</title>
        </head>
        <body>
          <h1>دردونه</h1>
          <p>بازار هوشمند محلی</p>
        </body>
      </html>
    `);
  }
});

/* =========================================================
   404
========================================================= */

app.notFound((c) => {
  return c.json(
    {
      success: false,
      error: "مسیر پیدا نشد."
    },
    404
  );
});

/* =========================================================
   ERROR HANDLER
========================================================= */

app.onError((error, c) => {
  console.error(
    "Unhandled API error:",
    error
  );

  return c.json(
    {
      success: false,
      error:
        "خطای داخلی سرور."
    },
    500
  );
});

/* =========================================================
   CORS / OPTIONS
========================================================= */

app.options("*", (c) => {
  return new Response(null, {
    status: 204,
    headers: corsHeaders()
  });
});

/* =========================================================
   EXPORT
========================================================= */

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ) {
    const response =
      await app.fetch(
        request,
        env,
        ctx
      );

    return withCors(response);
  }
};
