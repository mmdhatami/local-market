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

function App() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

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

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">د</div>

          <div>
            <strong>دردونه</strong>
            <span>بازار هوشمند محلی</span>
          </div>
        </div>

        <div className="top-actions">
          <button className="location-btn">📍 اطراف من</button>
          <button className="profile-btn">حساب کاربری</button>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="hero-content">
            <span className="badge">دردونه | بازار هوشمند محلی</span>

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
              <strong>چیزهای نزدیک شما را پیدا کنید</strong>

              <p>
                با فعال کردن موقعیت مکانی، آگهی‌ها و خدمات نزدیک خودتان را
                سریع‌تر پیدا کنید.
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
                />
              ))
            ) : (
              <div className="category-error">
                <strong>دسته‌بندی‌ها بارگذاری نشدند</strong>
                <p>لطفاً صفحه را دوباره باز کنید.</p>
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
      </main>

      <button className="floating-add">＋ ثبت</button>

      <nav className="bottom-nav">
        <button className="active">
          <span>⌂</span>
          خانه
        </button>

        <button>
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

        <button>
          <span>☻</span>
          حساب من
        </button>
      </nav>
    </div>
  );
}

function Category({
  icon,
  title
}: {
  icon: string;
  title: string;
}) {
  return (
    <button className="category-card">
      <span className="category-icon">{icon}</span>
      <strong>{title}</strong>
      <span className="arrow">←</span>
    </button>
  );
}

function CategorySkeleton() {
  return (
    <div className="category-card category-skeleton">
      <span className="category-icon">◌</span>
      <strong>در حال بارگذاری...</strong>
    </div>
  );
}

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

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
