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

type Listing = {
  id: string;
  user_id: string;
  category_id: string;
  title: string;
  description: string | null;
  listing_type: string;
  price: number | null;
  price_type: string;
  old_price: number | null;
  discount_percent: number | null;
  city: string | null;
  location_id: string | null;
  status: string;
  condition: string | null;
  view_count: number;
  favorite_count: number;
  message_count: number;
  call_count: number;
  created_at: string;
  updated_at: string;
  category_title: string | null;
  category_icon: string | null;
  image_url?: string | null;
};

function App() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] =
    useState(true);

  const [selectedCategory, setSelectedCategory] =
    useState<Category | null>(null);

  const [selectedListing, setSelectedListing] =
    useState<Listing | null>(null);

  const [showAccount, setShowAccount] =
    useState(false);

  const [showCreateListing, setShowCreateListing] =
    useState(false);

  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved =
        localStorage.getItem("dardone_user");

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
        const response = await fetch(
          `${API_BASE_URL}/api/categories`
        );

        if (!response.ok) {
          throw new Error(
            `Failed to load categories: ${response.status}`
          );
        }

        const data = await response.json();

        if (
          !cancelled &&
          data.success &&
          Array.isArray(data.categories)
        ) {
          setCategories(data.categories);
        }
      } catch (error) {
        console.error(
          "Categories API error:",
          error
        );
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

  function goHome() {
    setSelectedCategory(null);
    setSelectedListing(null);
    setShowAccount(false);
    setShowCreateListing(false);

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }

  function openCategory(category: Category) {
    setSelectedCategory(category);
    setSelectedListing(null);
    setShowAccount(false);
    setShowCreateListing(false);

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }

  function closeCategory() {
    setSelectedCategory(null);
    setSelectedListing(null);

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }

  function openListing(listing: Listing) {
    setSelectedListing(listing);

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }

  function closeListing() {
    setSelectedListing(null);

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }

  function openAccount() {
    setSelectedCategory(null);
    setSelectedListing(null);
    setShowAccount(true);
    setShowCreateListing(false);

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

  function openCreateListing() {
    setSelectedCategory(null);
    setSelectedListing(null);
    setShowAccount(false);
    setShowCreateListing(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }

  function closeCreateListing() {
    setShowCreateListing(false);

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
    setShowAccount(true);
  }

  return (
    <div className="app">
      <header className="topbar">
        <button
          className="brand"
          onClick={goHome}
        >
          <div className="brand-mark">
            د
          </div>

          <div>
            <strong>دردونه</strong>
            <span>
              بازار هوشمند محلی
            </span>
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
            {user
              ? "حساب من"
              : "حساب کاربری"}
          </button>
        </div>
      </header>

      <main>
        {showCreateListing ? (
          <CreateListingPage
            user={user}
            categories={categories}
            onBack={closeCreateListing}
            onNeedAccount={openAccount}
          />
        ) : showAccount ? (
          <AccountPage
            user={user}
            onRegistered={handleRegisteredUser}
            onLogout={logout}
            onBack={closeAccount}
          />
        ) : selectedListing ? (
          <ListingDetailPage
            listing={selectedListing}
            onBack={closeListing}
          />
        ) : selectedCategory ? (
          <CategoryPage
            category={selectedCategory}
            onBack={closeCategory}
            onListingClick={openListing}
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
        onClick={openCreateListing}
      >
        ＋ ثبت
      </button>

      <nav className="bottom-nav">
        <button
          className={
            !selectedCategory &&
            !selectedListing &&
            !showAccount &&
            !showCreateListing
              ? "active"
              : ""
          }
          onClick={goHome}
        >
          <span>⌂</span>
          خانه
        </button>

        <button
          className={
            selectedCategory
              ? "active"
              : ""
          }
          onClick={() => {
            setShowAccount(false);
            setShowCreateListing(false);
            setSelectedListing(null);

            if (selectedCategory) {
              closeCategory();
            }

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
          className={
            showAccount
              ? "active"
              : ""
          }
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
  onCategoryClick: (
    category: Category
  ) => void;
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
            <span>
              دنبالش هستی،
            </span>
            <br />
            همین اطرافه.
          </h1>

          <p>
            خرید، فروش، خدمات، کسب‌وکارها،
            کار، ملک و خودرو؛ همه در یک بازار
            هوشمند و نزدیک به شما.
          </p>

          <div className="search-box">
            <span>⌕</span>

            <input
              type="text"
              placeholder="چی می‌خوای پیدا کنی؟"
              aria-label="جستجو"
            />

            <button>
              جستجو
            </button>
          </div>
        </div>
      </section>

      <section className="nearby">
        <div className="section-heading">
          <div>
            <span>
              موقعیت شما
            </span>

            <h2>
              اطراف من
            </h2>
          </div>

          <button>
            مشاهده همه ←
          </button>
        </div>

        <div className="nearby-card">
          <div className="nearby-icon">
            📍
          </div>

          <div>
            <strong>
              چیزهای نزدیک شما را پیدا کنید
            </strong>

            <p>
              با فعال کردن موقعیت مکانی،
              آگهی‌ها و خدمات نزدیک خودتان
              را سریع‌تر پیدا کنید.
            </p>
          </div>

          <button>
            فعال کردن موقعیت
          </button>
        </div>
      </section>

      <section className="categories">
        <div className="section-heading">
          <div>
            <span>
              دسته‌بندی‌ها
            </span>

            <h2>
              چی می‌خوای پیدا کنی؟
            </h2>
          </div>

          <button>
            همه دسته‌ها ←
          </button>
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
            categories.map(
              (category) => (
                <Category
                  key={category.id}
                  icon={
                    category.icon ||
                    "📦"
                  }
                  title={
                    category.title
                  }
                  onClick={() =>
                    onCategoryClick(
                      category
                    )
                  }
                />
              )
            )
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
   CATEGORY PAGE
========================================================= */

function CategoryPage({
  category,
  onBack,
  onListingClick
}: {
  category: Category;
  onBack: () => void;
  onListingClick: (
    listing: Listing
  ) => void;
}) {
  const [listings, setListings] =
    useState<Listing[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadListings() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/listings?category_id=${encodeURIComponent(
            category.id
          )}`
        );

        const data =
          await response.json();

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.error ||
              "خطا در دریافت آگهی‌ها"
          );
        }

        if (!cancelled) {
          setListings(
            Array.isArray(
              data.listings
            )
              ? data.listings
              : []
          );
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "خطا در دریافت آگهی‌ها"
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadListings();

    return () => {
      cancelled = true;
    };
  }, [category.id]);

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
          <span>
            دسته‌بندی
          </span>

          <h1>
            {category.title}
          </h1>
        </div>
      </div>

      {category.description && (
        <p className="category-description">
          {category.description}
        </p>
      )}

      <div className="listings-section">
        <div className="listings-heading">
          <div>
            <span>
              آگهی‌های واقعی
            </span>

            <h2>
              جدیدترین آگهی‌ها
            </h2>
          </div>

          {!loading && (
            <strong>
              {listings.length} آگهی
            </strong>
          )}
        </div>

        {loading ? (
          <div className="listings-loading">
            <div className="loading-spinner">
              ◌
            </div>

            <p>
              در حال دریافت آگهی‌ها...
            </p>
          </div>
        ) : error ? (
          <div className="listings-error">
            <div>
              ⚠️
            </div>

            <strong>
              دریافت آگهی‌ها ناموفق بود
            </strong>

            <p>
              {error}
            </p>
          </div>
        ) : listings.length === 0 ? (
          <div className="category-empty">
            <div className="category-empty-icon">
              {category.icon ||
                "📦"}
            </div>

            <h2>
              هنوز آگهی‌ای در این دسته نیست
            </h2>

            <p>
              اولین نفر باش که در این دسته
              آگهی ثبت می‌کند.
            </p>
          </div>
        ) : (
          <div className="listing-grid">
            {listings.map(
              (listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  onClick={() =>
                    onListingClick(
                      listing
                    )
                  }
                />
              )
            )}
          </div>
        )}
      </div>
    </section>
  );
}

/* =========================================================
   LISTING CARD
========================================================= */

function ListingCard({
  listing,
  onClick
}: {
  listing: Listing;
  onClick: () => void;
}) {
  return (
    <button
      className="listing-card"
      onClick={onClick}
    >
      <div className="listing-image">
        {listing.image_url ? (
          <img
            src={listing.image_url}
            alt={listing.title}
          />
        ) : (
          <div className="listing-image-placeholder">
            {listing.category_icon ||
              "📦"}
          </div>
        )}
      </div>

      <div className="listing-content">
        <div className="listing-top">
          <span className="listing-category">
            {listing.category_title ||
              "آگهی"}
          </span>

          {listing.condition && (
            <span className="listing-condition">
              {formatCondition(
                listing.condition
              )}
            </span>
          )}
        </div>

        <h3>
          {listing.title}
        </h3>

        {listing.description && (
          <p>
            {truncateText(
              listing.description,
              95
            )}
          </p>
        )}

        <div className="listing-bottom">
          <div className="listing-price">
            {formatPrice(
              listing.price,
              listing.price_type
            )}
          </div>

          {listing.city && (
            <span className="listing-city">
              📍 {listing.city}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

/* =========================================================
   LISTING DETAIL
========================================================= */

function ListingDetailPage({
  listing,
  onBack
}: {
  listing: Listing;
  onBack: () => void;
}) {
  return (
    <section className="listing-detail-page">
      <button
        className="back-button"
        onClick={onBack}
      >
        → بازگشت به آگهی‌ها
      </button>

      <div className="listing-detail-card">
        <div className="listing-detail-image">
          {listing.image_url ? (
            <img
              src={listing.image_url}
              alt={listing.title}
            />
          ) : (
            <div>
              {listing.category_icon ||
                "📦"}
            </div>
          )}
        </div>

        <div className="listing-detail-content">
          <span className="listing-category">
            {listing.category_title ||
              "آگهی"}
          </span>

          <h1>
            {listing.title}
          </h1>

          <div className="detail-meta">
            {listing.city && (
              <span>
                📍 {listing.city}
              </span>
            )}

            {listing.condition && (
              <span>
                وضعیت:{" "}
                {formatCondition(
                  listing.condition
                )}
              </span>
            )}
          </div>

          <div className="detail-price">
            {formatPrice(
              listing.price,
              listing.price_type
            )}
          </div>

          {listing.description && (
            <div className="detail-description">
              <h2>
                توضیحات
              </h2>

              <p>
                {listing.description}
              </p>
            </div>
          )}

          <div className="detail-actions">
            <button>
              💬 پیام به فروشنده
            </button>

            <button>
              ❤️ علاقه‌مندی
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   CREATE LISTING
========================================================= */

function CreateListingPage({
  user,
  categories,
  onBack,
  onNeedAccount
}: {
  user: User | null;
  categories: Category[];
  onBack: () => void;
  onNeedAccount: () => void;
}) {
  const [categoryId, setCategoryId] =
    useState("");

  const [title, setTitle] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [price, setPrice] =
    useState("");

  const [city, setCity] =
    useState("شهرکرد");

  const [condition, setCondition] =
    useState("used");

  const [priceType, setPriceType] =
    useState("fixed");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  async function submitListing() {
    setError("");
    setSuccess("");

    if (!user) {
      setError(
        "برای ثبت آگهی ابتدا وارد حساب کاربری شوید."
      );
      return;
    }

    if (!categoryId) {
      setError(
        "لطفاً یک دسته‌بندی انتخاب کنید."
      );
      return;
    }

    if (!title.trim()) {
      setError(
        "عنوان آگهی را وارد کنید."
      );
      return;
    }

    if (title.trim().length < 3) {
      setError(
        "عنوان آگهی باید حداقل ۳ کاراکتر باشد."
      );
      return;
    }

    if (!description.trim()) {
      setError(
        "توضیحات آگهی را وارد کنید."
      );
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/listings`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json"
          },
          body: JSON.stringify({
            user_id: user.id,
            category_id: categoryId,
            title: title.trim(),
            description:
              description.trim(),
            listing_type: "product",
            price:
              price.trim() !== ""
                ? Number(
                    price.replace(
                      /,/g,
                      ""
                    )
                  )
                : null,
            price_type: priceType,
            city:
              city.trim() || null,
            condition:
              condition || null
          })
        }
      );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.error ||
            "ثبت آگهی انجام نشد."
        );
      }

      setSuccess(
        "آگهی شما با موفقیت ثبت شد."
      );

      setTitle("");
      setDescription("");
      setPrice("");
      setCategoryId("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "خطایی در ثبت آگهی رخ داد."
      );
    } finally {
      setLoading(false);
    }
  }

  if (!user) {
    return (
      <section className="create-listing-page">
        <button
          className="back-button"
          onClick={onBack}
        >
          → بازگشت به دردونه
        </button>

        <div className="create-listing-card account-required-card">
          <div className="create-listing-icon">
            🔐
          </div>

          <span className="account-label">
            ثبت آگهی
          </span>

          <h1>
            ابتدا وارد حساب کاربری شوید
          </h1>

          <p>
            برای ثبت آگهی و مدیریت آن،
            لازم است یک حساب کاربری داشته باشید.
          </p>

          <button
            className="primary-account-button"
            onClick={onNeedAccount}
          >
            ورود / ساخت حساب
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="create-listing-page">
      <button
        className="back-button"
        onClick={onBack}
      >
        → بازگشت به دردونه
      </button>

      <div className="create-listing-card">
        <div className="create-listing-icon">
          ＋
        </div>

        <span className="account-label">
          آگهی جدید
        </span>

        <h1>
          ثبت آگهی
        </h1>

        <p className="create-listing-description">
          اطلاعات آگهی را وارد کنید تا در
          دسته‌بندی مربوطه نمایش داده شود.
        </p>

        <label className="form-label">
          دسته‌بندی
        </label>

        <select
          className="form-input form-select"
          value={categoryId}
          onChange={(event) =>
            setCategoryId(
              event.target.value
            )
          }
        >
          <option value="">
            انتخاب دسته‌بندی
          </option>

          {categories.map(
            (category) => (
              <option
                key={category.id}
                value={category.id}
              >
                {category.icon ||
                  "📦"}{" "}
                {category.title}
              </option>
            )
          )}
        </select>

        <label className="form-label">
          عنوان آگهی
        </label>

        <input
          className="form-input"
          type="text"
          value={title}
          onChange={(event) =>
            setTitle(
              event.target.value
            )
          }
          placeholder="مثلاً فروش گوشی سامسونگ"
        />

        <label className="form-label">
          توضیحات
        </label>

        <textarea
          className="form-textarea"
          value={description}
          onChange={(event) =>
            setDescription(
              event.target.value
            )
          }
          placeholder="توضیحات کامل آگهی را بنویسید..."
          rows={5}
        />

        <label className="form-label">
          قیمت
        </label>

        <input
          className="form-input"
          type="text"
          inputMode="numeric"
          value={price}
          onChange={(event) =>
            setPrice(
              event.target.value
            )
          }
          placeholder="مثلاً ۱۵۰۰۰۰۰۰"
          dir="ltr"
        />

        <label className="form-label">
          نوع قیمت
        </label>

        <select
          className="form-input form-select"
          value={priceType}
          onChange={(event) =>
            setPriceType(
              event.target.value
            )
          }
        >
          <option value="fixed">
            قیمت ثابت
          </option>

          <option value="negotiable">
            توافقی
          </option>
        </select>

        <label className="form-label">
          شهر
        </label>

        <input
          className="form-input"
          type="text"
          value={city}
          onChange={(event) =>
            setCity(
              event.target.value
            )
          }
          placeholder="مثلاً شهرکرد"
        />

        <label className="form-label">
          وضعیت کالا
        </label>

        <select
          className="form-input form-select"
          value={condition}
          onChange={(event) =>
            setCondition(
              event.target.value
            )
          }
        >
          <option value="new">
            نو
          </option>

          <option value="used">
            کارکرده
          </option>

          <option value="like_new">
            در حد نو
          </option>

          <option value="unknown">
            مشخص نشده
          </option>
        </select>

        {error && (
          <div className="form-error">
            {error}
          </div>
        )}

        {success && (
          <div className="form-success">
            {success}
          </div>
        )}

        <button
          className="primary-account-button"
          onClick={submitListing}
          disabled={loading}
        >
          {loading
            ? "در حال ثبت آگهی..."
            : "ثبت آگهی"}
        </button>
      </div>
    </section>
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
  onRegistered: (
    user: User
  ) => void;
  onLogout: () => void;
  onBack: () => void;
}) {
  const [mode, setMode] =
    useState<"login" | "register">(
      "register"
    );

  const [fullName, setFullName] =
    useState("");

  const [mobile, setMobile] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [
    repeatPassword,
    setRepeatPassword
  ] = useState("");

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  async function register() {
    setError("");
    setMessage("");

    if (!fullName.trim()) {
      setError(
        "نام و نام خانوادگی را وارد کنید."
      );
      return;
    }

    if (!mobile.trim()) {
      setError(
        "شماره موبایل را وارد کنید."
      );
      return;
    }

    if (password.length < 6) {
      setError(
        "رمز عبور باید حداقل ۶ کاراکتر باشد."
      );
      return;
    }

    if (
      password !== repeatPassword
    ) {
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
            "Content-Type":
              "application/json"
          },
          body: JSON.stringify({
            full_name:
              fullName.trim(),
            mobile:
              mobile.trim(),
            password
          })
        }
      );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.error ||
            "ثبت‌نام انجام نشد."
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

          <h1>
            {user.full_name}
          </h1>

          <p className="account-mobile">
            📱 {user.mobile}
          </p>

          <div className="account-status">
            <div>
              <span>
                تأیید شماره
              </span>

              <strong>
                {user.phone_verified
                  ? "✓ تأیید شده"
                  : "در انتظار تأیید"}
              </strong>
            </div>

            <div>
              <span>
                احراز هویت
              </span>

              <strong>
                {user.identity_verified
                  ? "✓ تأیید شده"
                  : "هنوز انجام نشده"}
              </strong>
            </div>

            <div>
              <span>
                تأیید کسب‌وکار
              </span>

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
          برای استفاده از امکانات کامل
          دردونه حساب کاربری خودت را داشته
          باش.
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
                setFullName(
                  event.target.value
                )
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
                setMobile(
                  event.target.value
                )
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
                setPassword(
                  event.target.value
                )
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
                setRepeatPassword(
                  event.target.value
                )
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
              در مراحل بعدی تأیید شماره
              موبایل، احراز هویت و امکانات
              امنیتی تکمیل می‌شوند.
            </p>
          </>
        ) : (
          <div className="login-coming">
            <div>🔐</div>

            <h2>
              ورود به‌زودی فعال می‌شود
            </h2>

            <p>
              زیرساخت حساب کاربری آماده شده
              و در مرحله بعد سیستم ورود امن
              را به آن متصل می‌کنیم.
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

      <strong>
        {title}
      </strong>

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
        <strong>
          {title}
        </strong>

        <p>
          {text}
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   HELPERS
========================================================= */

function formatPrice(
  price: number | null,
  priceType: string
) {
  if (
    priceType === "negotiable"
  ) {
    return "توافقی";
  }

  if (
    price === null ||
    price === undefined ||
    Number.isNaN(Number(price))
  ) {
    return "قیمت اعلام نشده";
  }

  return `${Number(price).toLocaleString(
    "fa-IR"
  )} تومان`;
}

function formatCondition(
  condition: string
) {
  switch (condition) {
    case "new":
      return "نو";

    case "used":
      return "کارکرده";

    case "like_new":
      return "در حد نو";

    case "unknown":
      return "مشخص نشده";

    default:
      return condition;
  }
}

function truncateText(
  text: string,
  maxLength: number
) {
  if (text.length <= maxLength) {
    return text;
  }

  return (
    text.slice(0, maxLength).trim() +
    "..."
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
