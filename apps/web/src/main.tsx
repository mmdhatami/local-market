import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const API_BASE_URL = "";

type Category = {
  id: string;
  title: string;
  icon: string;
  description: string | null;
  parent_id: string | null;
  sort_order: number;
};

type User = {
  id: string;
  full_name: string;
  mobile: string;
  role: string;
  phone_verified: boolean;
  identity_verified: boolean;
  business_verified: boolean;
};

function App() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] =
    useState<Category | null>(null);

  const [showAccount, setShowAccount] = useState(false);

  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem("dardone_user");

      if (!saved) {
        return null;
      }

      return JSON.parse(saved);
    } catch {
      return null;
    }
  });

  useEffect(() => {
    let cancelled = false;

    async function loadCategories() {
      try {
        const response = await fetch(`${API_BASE_URL}/api/categories`);

        if (!response.ok) {
          throw new Error(`Failed to load categories: ${response.status}`);
        }

        const data = await response.json();

        if (!cancelled && data.success && Array.isArray(data.categories)) {
          setCategories(data.categories);
        }
      } catch (error) {
        console.error("Categories API error:", error);
      } finally {
        if (!cancelled) {
          setCategoriesLoading(false);
        }
      }
    }

    loadCategories();

    return () => {
      cancelled = true;
    };
  }, []);

  function openCategory(category: Category) {
    setSelectedCategory(category);
    setShowAccount(false);

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }

  function closeCategory() {
    setSelectedCategory(null);

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }

  function openAccount() {
    setSelectedCategory(null);
    setShowAccount(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }

  function closeAccount() {
    setShowAccount(false);

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }

  function handleRegisteredUser(newUser: User) {
    setUser(newUser);

    localStorage.setItem(
      "dardone_user",
      JSON.stringify(newUser)
    );
  }

  function logout() {
    localStorage.removeItem("dardone_user");
    setUser(null);
  }

  return (
    <div className="app">
      <header className="topbar">
        <button
          className="brand"
          onClick={() => {
            setSelectedCategory(null);
            setShowAccount(false);
            window.scrollTo({
              top: 0,
              behavior: "smooth"
            });
          }}
        >
          <div className="brand-mark">د</div>

          <div>
            <strong>دردونه</strong>
            <span>بازار هوشمند محلی</span>
          </div>
        </button>

        <div className="top-actions">
          <button className="location-btn">
            📍 اطراف من
          </button>

          <button
            className="profile-btn"
            onClick={openAccount}
          >
            {user ? "حساب من" : "حساب کاربری"}
          </button>
        </div>
      </header>

      <main>
        {showAccount ? (
          <AccountPage
            user={user}
            onRegistered={handleRegisteredUser}
            onLogout={logout}
            onBack={closeAccount}
          />
        ) : selectedCategory ? (
          <CategoryPage
            category={selectedCategory}
            onBack={closeCategory}
          />
        ) : (
          <HomePage
            categories={categories}
            categoriesLoading={categoriesLoading}
            onCategoryClick={openCategory}
          />
        )}
      </main>

      <button
        className="floating-add"
        onClick={openAccount}
      >
        ＋ ثبت
      </button>

      <nav className="bottom-nav">
        <button
          className={
            !selectedCategory && !showAccount
              ? "active"
              : ""
          }
          onClick={() => {
            setSelectedCategory(null);
            setShowAccount(false);

            window.scrollTo({
              top: 0,
              behavior: "smooth"
            });
          }}
        >
          <span>⌂</span>
          خانه
        </button>

        <button
          className={selectedCategory ? "active" : ""}
          onClick={() => {
            if (selectedCategory) {
              closeCategory();
            }

            setShowAccount(false);

            setTimeout(() => {
              document
                .querySelector(".categories")
                ?.scrollIntoView({
                  behavior: "smooth"
                });
            }, 50);
          }}
        >
          <span>▦</span>
          دسته‌ها
        </button>

        <button>
          <span>⚡</span>
          خدمات
        </button>

        <button>
          <span>🎁</span>
          کمپین‌ها
        </button>

        <button
          className={showAccount ? "active" : ""}
          onClick={openAccount}
        >
          <span>☻</span>
          حساب من
        </button>
      </nav>
    </div>
  );
}

/* =========================================================
   HOME
========================================================= */

function HomePage({
  categories,
  categoriesLoading,
  onCategoryClick
}: {
  categories: Category[];
  categoriesLoading: boolean;
  onCategoryClick: (category: Category) => void;
}) {
  return (
    <>
      <section className="hero">
        <div className="hero-content">
          <span className="badge">
            دردونه | بازار هوشمند محلی
          </span>

          <h1>
            هر چیزی که
            <br />
            <span>دنبالش هستی،</span>
            <br />
            همین اطرافه.
          </h1>

          <p>
            خرید، فروش، خدمات، کسب‌وکارها، کار، ملک و خودرو؛
            همه در یک بازار هوشمند و نزدیک به شما.
          </p>

          <div className="search-box">
            <span>⌕</span>

            <input
              type="text"
              placeholder="چی می‌خوای پیدا کنی؟"
              aria-label="جستجو"
            />

            <button>جستجو</button>
          </div>
        </div>
      </section>

      <section className="nearby">
        <div className="section-heading">
          <div>
            <span>موقعیت شما</span>
            <h2>اطراف من</h2>
          </div>

          <button>مشاهده همه ←</button>
        </div>

        <div className="nearby-card">
          <div className="nearby-icon">📍</div>

          <div>
            <strong>
              چیزهای نزدیک شما را پیدا کنید
            </strong>

            <p>
              با فعال کردن موقعیت مکانی، آگهی‌ها و خدمات
              نزدیک خودتان را سریع‌تر پیدا کنید.
            </p>
          </div>

          <button>فعال کردن موقعیت</button>
        </div>
      </section>

      <section className="categories">
        <div className="section-heading">
          <div>
            <span>دسته‌بندی‌ها</span>
            <h2>چی می‌خوای پیدا کنی؟</h2>
          </div>

          <button>همه دسته‌ها ←</button>
        </div>

        <div className="category-grid">
          {categoriesLoading ? (
            <>
              <CategorySkeleton />
              <CategorySkeleton />
              <CategorySkeleton />
              <CategorySkeleton />
            </>
          ) : categories.length > 0 ? (
            categories.map((category) => (
              <Category
                key={category.id}
                icon={category.icon || "📦"}
                title={category.title}
                onClick={() =>
                  onCategoryClick(category)
                }
              />
            ))
          ) : (
            <div className="category-error">
              <strong>
                دسته‌بندی‌ها بارگذاری نشدند
              </strong>

              <p>
                لطفاً صفحه را دوباره باز کنید.
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="features">
        <Feature
          icon="⚡"
          title="سریع و ساده"
          text="آگهی و درخواستت را در چند مرحله کوتاه ثبت کن."
        />

        <Feature
          icon="📍"
          title="واقعاً محلی"
          text="خدمات و پیشنهادهای نزدیک خودت را پیدا کن."
        />

        <Feature
          icon="🛡️"
          title="اعتماد بیشتر"
          text="احراز هویت، نشان‌های تأیید و سیستم امتیازدهی."
        />

        <Feature
          icon="🤖"
          title="هوشمند"
          text="جستجو و ساخت آگهی با کمک هوش مصنوعی."
        />
      </section>
    </>
  );
}

/* =========================================================
   ACCOUNT
========================================================= */

function AccountPage({
  user,
  onRegistered,
  onLogout,
  onBack
}: {
  user: User | null;
  onRegistered: (user: User) => void;
  onLogout: () => void;
  onBack: () => void;
}) {
  const [mode, setMode] = useState<"login" | "register">(
    "register"
  );

  const [fullName, setFullName] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] =
    useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function register() {
    setError("");
    setMessage("");

    if (!fullName.trim()) {
      setError("نام و نام خانوادگی را وارد کنید.");
      return;
    }

    if (!mobile.trim()) {
      setError("شماره موبایل را وارد کنید.");
      return;
    }

    if (password.length < 6) {
      setError(
        "رمز عبور باید حداقل ۶ کاراکتر باشد."
      );
      return;
    }

    if (password !== repeatPassword) {
      setError(
        "رمز عبور و تکرار آن یکسان نیستند."
      );
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            full_name: fullName.trim(),
            mobile: mobile.trim(),
            password
          })
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "ثبت‌نام انجام نشد."
        );
      }

      onRegistered(data.user);

      setPassword("");
      setRepeatPassword("");

      setMessage(
        "حساب کاربری شما با موفقیت ساخته شد."
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "خطایی در ثبت‌نام رخ داد."
      );
    } finally {
      setLoading(false);
    }
  }

  if (user) {
    return (
      <section className="account-page">
        <button
          className="back-button"
          onClick={onBack}
        >
          → بازگشت به دردونه
        </button>

        <div className="account-card">
          <div className="account-avatar">
            {user.full_name
              ? user.full_name.charAt(0)
              : "د"}
          </div>

          <span className="account-label">
            حساب کاربری
          </span>

          <h1>{user.full_name}</h1>

          <p className="account-mobile">
            📱 {user.mobile}
          </p>

          <div className="account-status">
            <div>
              <span>تأیید شماره</span>
              <strong>
                {user.phone_verified
                  ? "✓ تأیید شده"
                  : "در انتظار تأیید"}
              </strong>
            </div>

            <div>
              <span>احراز هویت</span>
              <strong>
                {user.identity_verified
                  ? "✓ تأیید شده"
                  : "هنوز انجام نشده"}
              </strong>
            </div>

            <div>
              <span>تأیید کسب‌وکار</span>
              <strong>
                {user.business_verified
                  ? "✓ تأیید شده"
                  : "هنوز انجام نشده"}
              </strong>
            </div>
          </div>

          <div className="account-actions">
            <button>
              📋 آگهی‌های من
            </button>

            <button>
              ❤️ علاقه‌مندی‌ها
            </button>

            <button>
              💬 پیام‌ها
            </button>

            <button>
              ⚙️ تنظیمات حساب
            </button>
          </div>

          <button
            className="logout-button"
            onClick={onLogout}
          >
            خروج از حساب
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="account-page">
      <button
        className="back-button"
        onClick={onBack}
      >
        → بازگشت به دردونه
      </button>

      <div className="account-card">
        <div className="account-logo">
          د
        </div>

        <span className="account-label">
          خوش آمدید
        </span>

        <h1>
          {mode === "register"
            ? "ساخت حساب کاربری"
            : "ورود به دردونه"}
        </h1>

        <p className="account-description">
          برای استفاده از امکانات کامل دردونه حساب
          کاربری خودت را داشته باش.
        </p>

        <div className="account-tabs">
          <button
            className={
              mode === "register"
                ? "active"
                : ""
            }
            onClick={() => {
              setMode("register");
              setError("");
              setMessage("");
            }}
          >
            ثبت‌نام
          </button>

          <button
            className={
              mode === "login"
                ? "active"
                : ""
            }
            onClick={() => {
              setMode("login");
              setError("");
              setMessage("");
            }}
          >
            ورود
          </button>
        </div>

        {mode === "register" ? (
          <>
            <label className="form-label">
              نام و نام خانوادگی
            </label>

            <input
              className="form-input"
              type="text"
              value={fullName}
              onChange={(event) =>
                setFullName(event.target.value)
              }
              placeholder="مثلاً محمد حاتمی"
            />

            <label className="form-label">
              شماره موبایل
            </label>

            <input
              className="form-input"
              type="tel"
              value={mobile}
              onChange={(event) =>
                setMobile(event.target.value)
              }
              placeholder="09xxxxxxxxx"
              dir="ltr"
            />

            <label className="form-label">
              رمز عبور
            </label>

            <input
              className="form-input"
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              placeholder="حداقل ۶ کاراکتر"
              dir="ltr"
            />

            <label className="form-label">
              تکرار رمز عبور
            </label>

            <input
              className="form-input"
              type="password"
              value={repeatPassword}
              onChange={(event) =>
                setRepeatPassword(event.target.value)
              }
              placeholder="رمز عبور را دوباره وارد کنید"
              dir="ltr"
            />

            {error && (
              <div className="form-error">
                {error}
              </div>
            )}

            {message && (
              <div className="form-success">
                {message}
              </div>
            )}

            <button
              className="primary-account-button"
              onClick={register}
              disabled={loading}
            >
              {loading
                ? "در حال ساخت حساب..."
                : "ساخت حساب کاربری"}
            </button>

            <p className="form-note">
              در مراحل بعدی تأیید شماره موبایل، احراز هویت
              و امکانات امنیتی تکمیل می‌شوند.
            </p>
          </>
        ) : (
          <div className="login-coming">
            <div>🔐</div>

            <h2>
              ورود به‌زودی فعال می‌شود
            </h2>

            <p>
              زیرساخت حساب کاربری آماده شده و در مرحله
              بعد سیستم ورود امن را به آن متصل می‌کنیم.
            </p>

            <button
              className="primary-account-button"
              onClick={() =>
                setMode("register")
              }
            >
              ساخت حساب جدید
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

/* =========================================================
   CATEGORY PAGE
========================================================= */

function CategoryPage({
  category,
  onBack
}: {
  category: Category;
  onBack: () => void;
}) {
  return (
    <section className="category-page">
      <button
        className="back-button"
        onClick={onBack}
      >
        → بازگشت به دردونه
      </button>

      <div className="category-page-header">
        <div className="category-page-icon">
          {category.icon || "📦"}
        </div>

        <div>
          <span>دسته‌بندی</span>
          <h1>{category.title}</h1>
        </div>
      </div>

      {category.description && (
        <p className="category-description">
          {category.description}
        </p>
      )}

      <div className="category-empty">
        <div className="category-empty-icon">
          {category.icon || "📦"}
        </div>

        <h2>
          آگهی‌های {category.title}
        </h2>

        <p>
          به‌زودی آگهی‌های این دسته در اینجا نمایش
          داده می‌شوند.
        </p>

        <button className="empty-add-button">
          ＋ ثبت آگهی در {category.title}
        </button>
      </div>
    </section>
  );
}

/* =========================================================
   CATEGORY
========================================================= */

function Category({
  icon,
  title,
  onClick
}: {
  icon: string;
  title: string;
  onClick: () => void;
}) {
  return (
    <button
      className="category-card"
      onClick={onClick}
    >
      <span className="category-icon">
        {icon}
      </span>

      <strong>{title}</strong>

      <span className="arrow">
        ←
      </span>
    </button>
  );
}

/* =========================================================
   SKELETON
========================================================= */

function CategorySkeleton() {
  return (
    <div className="category-card category-skeleton">
      <span className="category-icon">
        ◌
      </span>

      <strong>
        در حال بارگذاری...
      </strong>
    </div>
  );
}

/* =========================================================
   FEATURE
========================================================= */

function Feature({
  icon,
  title,
  text
}: {
  icon: string;
  title: string;
  text: string;
}) {
  return (
    <div className="feature-card">
      <span>{icon}</span>

      <div>
        <strong>{title}</strong>

        <p>{text}</p>
      </div>
    </div>
  );
}

/* =========================================================
   RENDER
========================================================= */

createRoot(
  document.getElementById("root")!
).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
