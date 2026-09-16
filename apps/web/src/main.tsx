```tsx
import React, {
  useEffect,
  useRef,
  useState,
} from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const API_BASE_URL = "";

const MAX_PHOTOS = 8;
const MAX_FILE_SIZE = 10 * 1024 * 1024;

type Category = {
  id: string;
  parent_id?: string | null;
  title: string;
  slug?: string;
  icon?: string | null;
  description?: string | null;
  sort_order?: number;
  is_active?: number;
};

type User = {
  id: string;
  full_name: string;
  mobile: string;
  role?: string;
  phone_verified?: number;
  identity_verified?: number;
  business_verified?: number;
  avatar_url?: string | null;
  bio?: string | null;
};

type ListingPhoto = {
  id: string;
  listing_id: string;
  file_key: string;
  file_url: string;
  sort_order: number;
  created_at?: string;
};

type Listing = {
  id: string;
  user_id: string;
  category_id: string;
  title: string;
  description?: string | null;
  listing_type?: string;
  price?: number | null;
  price_type?: string | null;
  old_price?: number | null;
  discount_percent?: number | null;
  city?: string | null;
  location_id?: string | null;
  status?: string;
  condition?: string | null;
  view_count?: number;
  favorite_count?: number;
  message_count?: number;
  call_count?: number;
  expires_at?: string | null;
  created_at?: string;
  updated_at?: string;
  category_title?: string | null;
  category_icon?: string | null;
  image_url?: string | null;
  photos?: ListingPhoto[];
};

type ImageKitAuth = {
  success: boolean;
  token: string;
  expire: number;
  signature: string;
  publicKey: string;
};

type Page =
  | "home"
  | "category"
  | "listing"
  | "account"
  | "create";

/* =========================================================
   HELPERS
========================================================= */

function formatPrice(
  price?: number | null
) {
  if (
    price === null ||
    price === undefined ||
    !Number.isFinite(Number(price)) ||
    Number(price) <= 0
  ) {
    return "توافقی";
  }

 return (
  Number(price).toLocaleString("fa-IR") +
  " تومان"
);
}

function formatCondition(
  condition?: string | null
) {
  if (!condition) return "";

  const values: Record<string, string> = {
    new: "نو",
    used: "کارکرده",
    like_new: "در حد نو",
  };

  return (
    values[condition] ||
    condition
  );
}

function truncateText(
  text?: string | null,
  length = 90
) {
  if (!text) return "";

  return text.length > length
    ? `${text.slice(0, length)}…`
    : text;
}

function getStoredUser(): User | null {
  try {
    const raw =
      localStorage.getItem(
        "dardone_user"
      );

    if (!raw) return null;

    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveUser(user: User) {
  localStorage.setItem(
    "dardone_user",
    JSON.stringify(user)
  );
}

function clearUser() {
  localStorage.removeItem(
    "dardone_user"
  );
}

/* =========================================================
   API
========================================================= */

async function apiFetch<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(
    `${API_BASE_URL}${url}`,
    {
      ...options,
      headers: {
        "Content-Type":
          "application/json",
        ...(options?.headers || {}),
      },
    }
  );

  const text =
    await response.text();

  let data: any = {};

  try {
    data = text
      ? JSON.parse(text)
      : {};
  } catch {
    data = {
      success: false,
      error:
        text ||
        "پاسخ نامعتبر از سرور",
    };
  }

  if (!response.ok) {
    throw new Error(
      data?.error ||
        data?.message ||
        `خطای سرور ${response.status}`
    );
  }

  return data as T;
}

/* =========================================================
   IMAGEKIT
========================================================= */

async function getImageKitAuth() {
  return apiFetch<ImageKitAuth>(
    "/api/imagekit-auth",
    {
      method: "POST",
      body: JSON.stringify({}),
    }
  );
}

async function uploadImageToImageKit(
  file: File,
  auth: ImageKitAuth
) {
  const formData =
    new FormData();

  formData.append(
    "file",
    file
  );

  formData.append(
    "fileName",
    file.name
  );

  formData.append(
    "publicKey",
    auth.publicKey
  );

  formData.append(
    "signature",
    auth.signature
  );

  formData.append(
    "expire",
    String(auth.expire)
  );

  formData.append(
    "token",
    auth.token
  );

  formData.append(
    "folder",
    "/dardone/listings"
  );

  const response =
    await fetch(
      "https://upload.imagekit.io/api/v1/files/upload",
      {
        method: "POST",
        body: formData,
      }
    );

  const text =
    await response.text();

  let data: any = {};

  try {
    data = text
      ? JSON.parse(text)
      : {};
  } catch {
    throw new Error(
      "پاسخ نامعتبر از ImageKit دریافت شد."
    );
  }

  if (
    !response.ok ||
    !data?.url
  ) {
    throw new Error(
      data?.message ||
        data?.error?.message ||
        "آپلود تصویر انجام نشد."
    );
  }

  return {
    fileId:
      data.fileId || "",
    filePath:
      data.filePath || "",
    url: data.url,
  };
}

/* =========================================================
   APP
========================================================= */

function App() {
  const [page, setPage] =
    useState<Page>("home");

  const [categories, setCategories] =
    useState<Category[]>([]);

  const [
    selectedCategory,
    setSelectedCategory,
  ] =
    useState<Category | null>(
      null
    );

  const [
    selectedListing,
    setSelectedListing,
  ] =
    useState<Listing | null>(
      null
    );

  const [user, setUser] =
    useState<User | null>(
      getStoredUser()
    );

  const [
    loadingCategories,
    setLoadingCategories,
  ] = useState(true);

  const [
    categoryListings,
    setCategoryListings,
  ] = useState<Listing[]>([]);

  const [
    loadingListings,
    setLoadingListings,
  ] = useState(false);

  const [
    listingLoading,
    setListingLoading,
  ] = useState(false);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  /* ACCOUNT */

  const [
    accountMode,
    setAccountMode,
  ] =
    useState<
      "register" | "login"
    >("register");

  const [fullName, setFullName] =
    useState("");

  const [mobile, setMobile] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [
    repeatPassword,
    setRepeatPassword,
  ] = useState("");

  const [
    accountLoading,
    setAccountLoading,
  ] = useState(false);

  const [
    accountMessage,
    setAccountMessage,
  ] = useState("");

  /* CREATE LISTING */

  const [title, setTitle] =
    useState("");

  const [
    description,
    setDescription,
  ] = useState("");

  const [price, setPrice] =
    useState("");

  const [
    priceType,
    setPriceType,
  ] = useState("fixed");

  const [city, setCity] =
    useState("شهرکرد");

  const [
    condition,
    setCondition,
  ] = useState("new");

  const [
    createLoading,
    setCreateLoading,
  ] = useState(false);

  const [
    createMessage,
    setCreateMessage,
  ] = useState("");

  /* PHOTOS */

  const [
    selectedFiles,
    setSelectedFiles,
  ] = useState<File[]>([]);

  const [
    previewUrls,
    setPreviewUrls,
  ] = useState<string[]>([]);

  const galleryInputRef =
    useRef<HTMLInputElement | null>(
      null
    );

  const cameraInputRef =
    useRef<HTMLInputElement | null>(
      null
    );

  useEffect(() => {
    loadCategories();
  }, []);

  /* =======================================================
     LOAD CATEGORIES
  ======================================================= */

  async function loadCategories() {
    try {
      setLoadingCategories(true);
      setError("");

      const data =
        await apiFetch<{
          success: boolean;
          categories: Category[];
        }>("/api/categories");

      setCategories(
        data.categories || []
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "دریافت دسته‌بندی‌ها انجام نشد."
      );
    } finally {
      setLoadingCategories(false);
    }
  }

  /* =======================================================
     NAVIGATION
  ======================================================= */

  function goHome() {
    setPage("home");
    setSelectedCategory(null);
    setSelectedListing(null);
    setError("");
  }

  function openAccount() {
    setPage("account");
    setAccountMessage("");
    setError("");
  }

  function closeAccount() {
    goHome();
  }

  function openCreateListing() {
    if (!user) {
      setPage("account");

      setAccountMessage(
        "برای ثبت آگهی ابتدا وارد حساب کاربری شوید."
      );

      return;
    }

    setCreateMessage("");
    setError("");
    setPage("create");
  }

  function closeCreateListing() {
    goHome();
  }

  /* =======================================================
     CATEGORY
  ======================================================= */

  async function openCategory(
    category: Category
  ) {
    setSelectedCategory(
      category
    );

    setSelectedListing(null);

    setSearch("");

    setPage("category");

    await loadListings(
      category.id
    );
  }

  async function loadListings(
    categoryId?: string,
    searchValue = ""
  ) {
    try {
      setLoadingListings(true);
      setError("");

      const params =
        new URLSearchParams();

      if (categoryId) {
        params.set(
          "category_id",
          categoryId
        );
      }

      if (
        searchValue.trim()
      ) {
        params.set(
          "search",
          searchValue.trim()
        );
      }

      const query =
        params.toString();

      const url = query
        ? `/api/listings?${query}`
        : "/api/listings";

      const data =
        await apiFetch<{
          success: boolean;
          listings: Listing[];
        }>(url);

      setCategoryListings(
        data.listings || []
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "دریافت آگهی‌ها انجام نشد."
      );

      setCategoryListings([]);
    } finally {
      setLoadingListings(false);
    }
  }

  /* =======================================================
     LISTING DETAIL
  ======================================================= */

  async function openListing(
    listing: Listing
  ) {
    setSelectedListing(
      listing
    );

    setPage("listing");

    setListingLoading(true);

    try {
      const data =
        await apiFetch<{
          success: boolean;
          listing: Listing;
          photos: ListingPhoto[];
        }>(
          `/api/listings/${listing.id}`
        );

      const photos =
        data.photos || [];

      setSelectedListing({
        ...data.listing,
        photos,
        image_url:
          photos[0]?.file_url ||
          data.listing.image_url ||
          null,
      });
    } catch (err) {
      console.error(
        "Listing detail:",
        err
      );
    } finally {
      setListingLoading(false);
    }
  }

  function closeListing() {
    if (selectedCategory) {
      setPage("category");
    } else {
      goHome();
    }
  }

  /* =======================================================
     ACCOUNT
  ======================================================= */

  function handleRegisteredUser(
    registeredUser: User
  ) {
    setUser(
      registeredUser
    );

    saveUser(
      registeredUser
    );

    setAccountMessage("");

    setPage("home");
  }

  function logout() {
    clearUser();

    setUser(null);

    setPage("home");
  }

  async function register(
    event: React.FormEvent
  ) {
    event.preventDefault();

    setAccountMessage("");

    if (!fullName.trim()) {
      setAccountMessage(
        "نام و نام خانوادگی را وارد کنید."
      );
      return;
    }

    if (!mobile.trim()) {
      setAccountMessage(
        "شماره موبایل را وارد کنید."
      );
      return;
    }

    if (password.length < 6) {
      setAccountMessage(
        "رمز عبور باید حداقل ۶ کاراکتر باشد."
      );
      return;
    }

    if (
      password !==
      repeatPassword
    ) {
      setAccountMessage(
        "تکرار رمز عبور صحیح نیست."
      );
      return;
    }

    try {
      setAccountLoading(true);

      const data =
        await apiFetch<{
          success: boolean;
          user: User;
        }>("/api/register", {
          method: "POST",
          body: JSON.stringify({
            full_name:
              fullName.trim(),
            mobile:
              mobile.trim(),
            password,
          }),
        });

      handleRegisteredUser(
        data.user
      );
    } catch (err) {
      setAccountMessage(
        err instanceof Error
          ? err.message
          : "ثبت‌نام انجام نشد."
      );
    } finally {
      setAccountLoading(false);
    }
  }

  function login() {
    setAccountMessage(
      "ورود با شماره موبایل در مرحله بعدی تکمیل می‌شود."
    );
  }

  /* =======================================================
     SEARCH
  ======================================================= */

  async function submitSearch(
    event: React.FormEvent
  ) {
    event.preventDefault();

    const value =
      search.trim();

    if (!value) {
      if (selectedCategory) {
        await loadListings(
          selectedCategory.id
        );
      }

      return;
    }

    if (selectedCategory) {
      setPage("category");

      await loadListings(
        selectedCategory.id,
        value
      );

      return;
    }

    setPage("category");

    await loadListings(
      undefined,
      value
    );

    setSelectedCategory(
      null
    );
  }

  /* =======================================================
     PHOTO SELECTION
  ======================================================= */

  function addSelectedFiles(
    files: FileList | null
  ) {
    if (!files) return;

    const incoming =
      Array.from(files);

    if (
      selectedFiles.length +
        incoming.length >
      MAX_PHOTOS
    ) {
      setCreateMessage(
        `حداکثر ${MAX_PHOTOS} عکس می‌توانید انتخاب کنید.`
      );

      return;
    }

    const validFiles: File[] =
      [];

    for (const file of incoming) {
      if (
        !file.type.startsWith(
          "image/"
        )
      ) {
        setCreateMessage(
          "فقط فایل‌های تصویری قابل انتخاب هستند."
        );

        continue;
      }

      if (
        file.size >
        MAX_FILE_SIZE
      ) {
        setCreateMessage(
          `حجم عکس «${file.name}» بیشتر از ۱۰ مگابایت است.`
        );

        continue;
      }

      validFiles.push(file);
    }

    if (!validFiles.length) {
      return;
    }

    const combinedFiles = [
      ...selectedFiles,
      ...validFiles,
    ];

    const combinedUrls =
      combinedFiles.map(
        (file) =>
          URL.createObjectURL(
            file
          )
      );

    setSelectedFiles(
      combinedFiles
    );

    setPreviewUrls(
      combinedUrls
    );

    setCreateMessage("");
  }

  function removeSelectedFile(
    index: number
  ) {
    const files =
      selectedFiles.filter(
        (_, i) =>
          i !== index
      );

    const urls =
      files.map((file) =>
        URL.createObjectURL(
          file
        )
      );

    setSelectedFiles(files);

    setPreviewUrls(urls);
  }

  /* =======================================================
     CREATE LISTING
  ======================================================= */

  async function submitListing(
    event: React.FormEvent
  ) {
    event.preventDefault();

    if (!user) {
      setCreateMessage(
        "ابتدا وارد حساب کاربری شوید."
      );

      return;
    }

    if (!selectedCategory) {
      setCreateMessage(
        "یک دسته‌بندی انتخاب کنید."
      );

      return;
    }

    if (!title.trim()) {
      setCreateMessage(
        "عنوان آگهی را وارد کنید."
      );

      return;
    }

    if (
      title.trim().length <
      3
    ) {
      setCreateMessage(
        "عنوان آگهی باید حداقل ۳ کاراکتر باشد."
      );

      return;
    }

    if (!description.trim()) {
      setCreateMessage(
        "توضیحات آگهی را وارد کنید."
      );

      return;
    }

    let createdListing:
      | Listing
      | null = null;

    try {
      setCreateLoading(true);

      setCreateMessage(
        "در حال ثبت آگهی..."
      );

      const listingResponse =
        await apiFetch<{
          success: boolean;
          listing: Listing;
        }>("/api/listings", {
          method: "POST",
          body: JSON.stringify({
            user_id:
              user.id,

            category_id:
              selectedCategory.id,

            title:
              title.trim(),

            description:
              description.trim(),

            listing_type:
              "product",

            price:
              price.trim()
                ? Number(price)
                : null,

            price_type:
              priceType,

            city:
              city.trim(),

            condition,
          }),
        });

      createdListing =
        listingResponse.listing;

      /* ===================================================
         UPLOAD PHOTOS

         IMPORTANT:
         ImageKit token is single-use.
         Therefore a NEW auth token is requested
         for EVERY individual photo.
      =================================================== */

      if (
        selectedFiles.length >
        0
      ) {
        setCreateMessage(
          "در حال آماده‌سازی آپلود عکس‌ها..."
        );

        for (
          let index = 0;
          index <
          selectedFiles.length;
          index++
        ) {
          setCreateMessage(
            `در حال آماده‌سازی عکس ${index + 1} از ${selectedFiles.length}...`
          );

          const auth =
            await getImageKitAuth();

          setCreateMessage(
            `در حال آپلود عکس ${index + 1} از ${selectedFiles.length}...`
          );

          const uploaded =
            await uploadImageToImageKit(
              selectedFiles[index],
              auth
            );

          await apiFetch(
            `/api/listings/${createdListing.id}/photos`,
            {
              method:
                "POST",

              body:
                JSON.stringify({
                  file_key:
                    uploaded.filePath ||
                    uploaded.fileId,

                  file_url:
                    uploaded.url,

                  sort_order:
                    index,
                }),
            }
          );
        }
      }

      setCreateMessage(
        selectedFiles.length >
          0
          ? "آگهی و عکس‌ها با موفقیت ثبت شدند."
          : "آگهی با موفقیت ثبت شد."
      );

      /* ===================================================
         GET FINAL LISTING
      =================================================== */

      const finalData =
        await apiFetch<{
          success: boolean;
          listing: Listing;
          photos: ListingPhoto[];
        }>(
          `/api/listings/${createdListing.id}`
        );

      const photos =
        finalData.photos ||
        [];

      setSelectedListing({
        ...finalData.listing,
        photos,
        image_url:
          photos[0]?.file_url ||
          null,
      });

      /* RESET FORM */

      setTitle("");
      setDescription("");
      setPrice("");
      setPriceType("fixed");
      setCondition("new");

      setSelectedFiles([]);
      setPreviewUrls([]);

      setPage("listing");
    } catch (err) {
      console.error(
        "Create listing:",
        err
      );

      setCreateMessage(
        err instanceof Error
          ? err.message
          : "ثبت آگهی انجام نشد."
      );
    } finally {
      setCreateLoading(false);
    }
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div
      className="app-shell"
      dir="rtl"
    >
      <Header
        user={user}
        goHome={goHome}
        openAccount={
          openAccount
        }
      />

      <main>
        {page === "home" && (
          <HomePage
            search={search}
            setSearch={
              setSearch
            }
            onSearch={
              submitSearch
            }
            categories={
              categories
            }
            loadingCategories={
              loadingCategories
            }
            openCategory={
              openCategory
            }
            openCreateListing={
              openCreateListing
            }
          />
        )}

        {page ===
          "category" && (
          <CategoryPage
            category={
              selectedCategory
            }
            listings={
              categoryListings
            }
            loading={
              loadingListings
            }
            search={search}
            setSearch={
              setSearch
            }
            onSearch={
              submitSearch
            }
            onBack={goHome}
            openListing={
              openListing
            }
            openCreateListing={
              openCreateListing
            }
          />
        )}

        {page ===
          "listing" &&
          selectedListing && (
            <ListingDetailPage
              listing={
                selectedListing
              }
              loading={
                listingLoading
              }
              onBack={
                closeListing
              }
            />
          )}

        {page ===
          "account" && (
          <AccountPage
            user={user}
            mode={
              accountMode
            }
            setMode={
              setAccountMode
            }
            fullName={
              fullName
            }
            setFullName={
              setFullName
            }
            mobile={
              mobile
            }
            setMobile={
              setMobile
            }
            password={
              password
            }
            setPassword={
              setPassword
            }
            repeatPassword={
              repeatPassword
            }
            setRepeatPassword={
              setRepeatPassword
            }
            loading={
              accountLoading
            }
            message={
              accountMessage
            }
            onRegister={
              register
            }
            onLogin={
              login
            }
            onLogout={
              logout
            }
            onBack={
              closeAccount
            }
          />
        )}

        {page ===
          "create" && (
          <CreateListingPage
            selectedCategory={
              selectedCategory
            }
            categories={
              categories
            }
            title={title}
            setTitle={
              setTitle
            }
            description={
              description
            }
            setDescription={
              setDescription
            }
            price={price}
            setPrice={
              setPrice
            }
            priceType={
              priceType
            }
            setPriceType={
              setPriceType
            }
            city={city}
            setCity={
              setCity
            }
            condition={
              condition
            }
            setCondition={
              setCondition
            }
            selectedFiles={
              selectedFiles
            }
            previewUrls={
              previewUrls
            }
            galleryInputRef={
              galleryInputRef
            }
            cameraInputRef={
              cameraInputRef
            }
            onFilesSelected={
              addSelectedFiles
            }
            onRemoveFile={
              removeSelectedFile
            }
            loading={
              createLoading
            }
            message={
              createMessage
            }
            onSubmit={
              submitListing
            }
            onBack={
              closeCreateListing
            }
            onCategoryChange={(
              category
            ) =>
              setSelectedCategory(
                category
              )
            }
          />
        )}
      </main>

      <BottomNav
        page={page}
        goHome={goHome}
        openAccount={
          openAccount
        }
        openCreateListing={
          openCreateListing
        }
      />

      {error && (
        <div className="toast-error">
          <span>
            {error}
          </span>

          <button
            type="button"
            onClick={() =>
              setError("")
            }
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   HEADER
========================================================= */

function Header({
  user,
  goHome,
  openAccount,
}: {
  user: User | null;
  goHome: () => void;
  openAccount: () => void;
}) {
  return (
    <header className="topbar">
      <button
        className="brand"
        onClick={goHome}
        type="button"
      >
        <span className="brand-mark">
          د
        </span>

        <span>
          <strong>
            دردونه
          </strong>

          <small>
            بازار محلی شما
          </small>
        </span>
      </button>

      <div className="topbar-actions">
        <button
          className="location-button"
          type="button"
        >
          📍 شهرکرد
        </button>

        <button
          className="account-button"
          onClick={
            openAccount
          }
          type="button"
        >
          {user
            ? `👤 ${user.full_name}`
            : "👤 حساب من"}
        </button>
      </div>
    </header>
  );
}

/* =========================================================
   HOME
========================================================= */

function HomePage({
  search,
  setSearch,
  onSearch,
  categories,
  loadingCategories,
  openCategory,
  openCreateListing,
}: {
  search: string;
  setSearch: (
    value: string
  ) => void;
  onSearch: (
    event: React.FormEvent
  ) => void;
  categories: Category[];
  loadingCategories: boolean;
  openCategory: (
    category: Category
  ) => void;
  openCreateListing: () => void;
}) {
  return (
    <div className="page">
      <section className="hero-card">
        <div className="hero-content">
          <span className="hero-badge">
            ✨ بازار محلی هوشمند
          </span>

          <h1>
            هر چیزی که می‌خواهی،
            <br />
            همین نزدیکی پیدا کن.
          </h1>

          <p>
            خرید، فروش، خدمات و
            کسب‌وکارهای شهر خودت را
            در دردونه پیدا کن.
          </p>

          <form
            className="search-box"
            onSubmit={
              onSearch
            }
          >
            <span>
              🔎
            </span>

            <input
              value={search}
              onChange={(
                event
              ) =>
                setSearch(
                  event.target
                    .value
                )
              }
              placeholder="چی می‌خوای پیدا کنی؟"
            />

            <button type="submit">
              جستجو
            </button>
          </form>

          <button
            className="primary-button hero-action"
            type="button"
            onClick={
              openCreateListing
            }
          >
            ➕ ثبت آگهی رایگان
          </button>
        </div>

        <div className="hero-illustration">
          🛍️
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <div>
            <span>
              دسته‌بندی‌ها
            </span>

            <h2>
              چی می‌خوای؟
            </h2>
          </div>
        </div>

        {loadingCategories ? (
          <div className="loading-box">
            در حال دریافت
            دسته‌بندی‌ها...
          </div>
        ) : (
          <div className="category-grid">
            {categories.map(
              (
                category
              ) => (
                <button
                  className="category-card"
                  key={
                    category.id
                  }
                  onClick={() =>
                    openCategory(
                      category
                    )
                  }
                  type="button"
                >
                  <span className="category-icon">
                    {category.icon ||
                      "📦"}
                  </span>

                  <strong>
                    {
                      category.title
                    }
                  </strong>

                  <span className="category-arrow">
                    ←
                  </span>
                </button>
              )
            )}
          </div>
        )}
      </section>

      <section className="feature-grid">
        <Feature
          icon="📍"
          title="نزدیک شما"
          text="مشاغل و آگهی‌های اطراف خودت را پیدا کن."
        />

        <Feature
          icon="💬"
          title="ارتباط آسان"
          text="با فروشنده و صاحب کسب‌وکار ارتباط بگیر."
        />

        <Feature
          icon="🛡️"
          title="امن و مطمئن"
          text="امکانات امنیتی و احراز هویت در مسیر توسعه."
        />
      </section>
    </div>
  );
}

/* =========================================================
   CATEGORY PAGE
========================================================= */

function CategoryPage({
  category,
  listings,
  loading,
  search,
  setSearch,
  onSearch,
  onBack,
  openListing,
  openCreateListing,
}: {
  category: Category | null;
  listings: Listing[];
  loading: boolean;
  search: string;
  setSearch: (
    value: string
  ) => void;
  onSearch: (
    event: React.FormEvent
  ) => void;
  onBack: () => void;
  openListing: (
    listing: Listing
  ) => void;
  openCreateListing: () => void;
}) {
  return (
    <div className="page">
      <div className="page-top">
        <button
          className="back-button"
          onClick={onBack}
          type="button"
        >
          → بازگشت
        </button>

        <button
          className="primary-button small"
          onClick={
            openCreateListing
          }
          type="button"
        >
          + ثبت آگهی
        </button>
      </div>

      <section className="category-header">
        <span className="big-icon">
          {category?.icon ||
            "📦"}
        </span>

        <div>
          <span>
            دسته‌بندی
          </span>

          <h1>
            {category?.title ||
              "نتایج جستجو"}
          </h1>
        </div>
      </section>

      <form
        className="search-box compact"
        onSubmit={
          onSearch
        }
      >
        <span>
          🔎
        </span>

        <input
          value={search}
          onChange={(
            event
          ) =>
            setSearch(
              event.target
                .value
            )
          }
          placeholder="جستجو در آگهی‌ها..."
        />

        <button type="submit">
          جستجو
        </button>
      </form>

      {loading ? (
        <div className="loading-box">
          در حال دریافت
          آگهی‌ها...
        </div>
      ) : listings.length ===
        0 ? (
        <div className="empty-box">
          <span>
            📭
          </span>

          <h3>
            هنوز آگهی‌ای ثبت نشده
          </h3>

          <p>
            اولین آگهی این بخش را
            شما ثبت کنید.
          </p>

          <button
            className="primary-button"
            onClick={
              openCreateListing
            }
            type="button"
          >
            ثبت اولین آگهی
          </button>
        </div>
      ) : (
        <div className="listing-grid">
          {listings.map(
            (
              listing
            ) => (
              <ListingCard
                key={
                  listing.id
                }
                listing={
                  listing
                }
                onClick={() =>
                  openListing(
                    listing
                  )
                }
              />
            )
          )}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   LISTING CARD
========================================================= */

function ListingCard({
  listing,
  onClick,
}: {
  listing: Listing;
  onClick: () => void;
}) {
  return (
    <button
      className="listing-card"
      onClick={onClick}
      type="button"
    >
      <div className="listing-image">
        {listing.image_url ? (
          <img
            src={
              listing.image_url
            }
            alt={
              listing.title
            }
            loading="lazy"
          />
        ) : (
          <span>
            📦
          </span>
        )}
      </div>

      <div className="listing-body">
        <div className="listing-category">
          {listing.category_icon ||
            "📦"}{" "}
          {listing.category_title ||
            "آگهی"}
        </div>

        <h3>
          {listing.title}
        </h3>

        <p>
          {truncateText(
            listing.description
          )}
        </p>

        <div className="listing-bottom">
          <strong>
            {formatPrice(
              listing.price
            )}
          </strong>

          {listing.city && (
            <span>
              📍{" "}
              {
                listing.city
              }
            </span>
          )}
        </div>

        {listing.condition && (
          <small className="condition">
            {formatCondition(
              listing.condition
            )}
          </small>
        )}
      </div>
    </button>
  );
}

/* =========================================================
   LISTING DETAIL
========================================================= */

function ListingDetailPage({
  listing,
  loading,
  onBack,
}: {
  listing: Listing;
  loading: boolean;
  onBack: () => void;
}) {
  const photos =
    listing.photos &&
    listing.photos.length >
      0
      ? listing.photos
      : listing.image_url
      ? [
          {
            id: "single",
            listing_id:
              listing.id,
            file_key: "",
            file_url:
              listing.image_url,
            sort_order: 0,
          },
        ]
      : [];

  const [
    activePhoto,
    setActivePhoto,
  ] = useState(0);

  useEffect(() => {
    setActivePhoto(0);
  }, [listing.id]);

  return (
    <div className="page">
      <button
        className="back-button"
        onClick={onBack}
        type="button"
      >
        → بازگشت
      </button>

      {loading && (
        <div className="loading-inline">
          در حال دریافت اطلاعات...
        </div>
      )}

      <section className="listing-detail">
        <div className="detail-gallery">
          {photos.length >
          0 ? (
            <>
              <div className="main-photo">
                <img
                  src={
                    photos[
                      activePhoto
                    ]?.file_url ||
                    photos[0]
                      .file_url
                  }
                  alt={
                    listing.title
                  }
                />

                {photos.length >
                  1 && (
                  <span className="photo-count">
                    📷{" "}
                    {activePhoto +
                      1}{" "}
                    /{" "}
                    {
                      photos.length
                    }
                  </span>
                )}
              </div>

              {photos.length >
                1 && (
                <div className="thumbnail-grid">
                  {photos.map(
                    (
                      photo,
                      index
                    ) => (
                      <button
                        type="button"
                        key={
                          photo.id
                        }
                        className={
                          index ===
                          activePhoto
                            ? "thumbnail active"
                            : "thumbnail"
                        }
                        onClick={() =>
                          setActivePhoto(
                            index
                          )
                        }
                      >
                        <img
                          src={
                            photo.file_url
                          }
                          alt={`${listing.title} ${index + 1}`}
                        />
                      </button>
                    )
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="detail-placeholder">
              📦
            </div>
          )}
        </div>

        <div className="detail-info">
          <div className="listing-category">
            {listing.category_icon ||
              "📦"}{" "}
            {listing.category_title ||
              "آگهی"}
          </div>

          <h1>
            {listing.title}
          </h1>

          <div className="detail-price">
            {formatPrice(
              listing.price
            )}
          </div>

          {listing.city && (
            <div className="detail-meta">
              📍{" "}
              {
                listing.city
              }
            </div>
          )}

          {listing.condition && (
            <div className="detail-meta">
              🏷️{" "}
              {formatCondition(
                listing.condition
              )}
            </div>
          )}

          <div className="detail-description">
            <h3>
              توضیحات
            </h3>

            <p>
              {listing.description ||
                "توضیحی برای این آگهی ثبت نشده است."}
            </p>
          </div>

          <div className="detail-actions">
            <button
              className="primary-button"
              type="button"
            >
              💬 پیام به فروشنده
            </button>

            <button
              className="secondary-button"
              type="button"
            >
              📞 تماس
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

/* =========================================================
   CREATE LISTING PAGE
========================================================= */

function CreateListingPage({
  selectedCategory,
  categories,
  title,
  setTitle,
  description,
  setDescription,
  price,
  setPrice,
  priceType,
  setPriceType,
  city,
  setCity,
  condition,
  setCondition,
  selectedFiles,
  previewUrls,
  galleryInputRef,
  cameraInputRef,
  onFilesSelected,
  onRemoveFile,
  loading,
  message,
  onSubmit,
  onBack,
  onCategoryChange,
}: {
  selectedCategory: Category | null;
  categories: Category[];
  title: string;
  setTitle: (
    value: string
  ) => void;
  description: string;
  setDescription: (
    value: string
  ) => void;
  price: string;
  setPrice: (
    value: string
  ) => void;
  priceType: string;
  setPriceType: (
    value: string
  ) => void;
  city: string;
  setCity: (
    value: string
  ) => void;
  condition: string;
  setCondition: (
    value: string
  ) => void;
  selectedFiles: File[];
  previewUrls: string[];
  galleryInputRef: React.RefObject<HTMLInputElement | null>;
  cameraInputRef: React.RefObject<HTMLInputElement | null>;
  onFilesSelected: (
    files: FileList | null
  ) => void;
  onRemoveFile: (
    index: number
  ) => void;
  loading: boolean;
  message: string;
  onSubmit: (
    event: React.FormEvent
  ) => void;
  onBack: () => void;
  onCategoryChange: (
    category: Category
  ) => void;
}) {
  return (
    <div className="page">
      <div className="page-top">
        <button
          className="back-button"
          onClick={onBack}
          type="button"
        >
          → بازگشت
        </button>
      </div>

      <section className="form-card">
        <div className="form-heading">
          <span>
            📢
          </span>

          <div>
            <span>
              رایگان
            </span>

            <h1>
              ثبت آگهی
            </h1>
          </div>
        </div>

        <form
          onSubmit={
            onSubmit
          }
        >
          <label className="field">
            <span>
              دسته‌بندی
            </span>

            <select
              value={
                selectedCategory?.id ||
                ""
              }
              onChange={(
                event
              ) => {
                const category =
                  categories.find(
                    (
                      item
                    ) =>
                      item.id ===
                      event
                        .target
                        .value
                  );

                if (
                  category
                ) {
                  onCategoryChange(
                    category
                  );
                }
              }}
            >
              <option value="">
                انتخاب دسته‌بندی
              </option>

              {categories.map(
                (
                  category
                ) => (
                  <option
                    key={
                      category.id
                    }
                    value={
                      category.id
                    }
                  >
                    {category.icon ||
                      "📦"}{" "}
                    {
                      category.title
                    }
                  </option>
                )
              )}
            </select>
          </label>

          <label className="field">
            <span>
              عنوان آگهی
            </span>

            <input
              value={title}
              onChange={(
                event
              ) =>
                setTitle(
                  event.target
                    .value
                )
              }
              placeholder="مثلاً گوشی سامسونگ..."
            />
          </label>

          <label className="field">
            <span>
              توضیحات
            </span>

            <textarea
              value={
                description
              }
              onChange={(
                event
              ) =>
                setDescription(
                  event.target
                    .value
                )
              }
              placeholder="توضیحات کامل آگهی را بنویسید..."
              rows={5}
            />
          </label>

          <div className="two-fields">
            <label className="field">
              <span>
                قیمت
              </span>

              <input
                value={price}
                onChange={(
                  event
                ) =>
                  setPrice(
                    event.target
                      .value
                  )
                }
                inputMode="numeric"
                placeholder="مثلاً 25000000"
              />
            </label>

            <label className="field">
              <span>
                نوع قیمت
              </span>

              <select
                value={
                  priceType
                }
                onChange={(
                  event
                ) =>
                  setPriceType(
                    event.target
                      .value
                  )
                }
              >
                <option value="fixed">
                  قیمت ثابت
                </option>

                <option value="negotiable">
                  قابل مذاکره
                </option>
              </select>
            </label>
          </div>

          <div className="two-fields">
            <label className="field">
              <span>
                شهر
              </span>

              <input
                value={city}
                onChange={(
                  event
                ) =>
                  setCity(
                    event.target
                      .value
                  )
                }
                placeholder="شهر"
              />
            </label>

            <label className="field">
              <span>
                وضعیت
              </span>

              <select
                value={
                  condition
                }
                onChange={(
                  event
                ) =>
                  setCondition(
                    event.target
                      .value
                  )
                }
              >
                <option value="new">
                  نو
                </option>

                <option value="like_new">
                  در حد نو
                </option>

                <option value="used">
                  کارکرده
                </option>
              </select>
            </label>
          </div>

          {/* =================================================
              PHOTOS
          ================================================= */}

          <div className="photo-upload-section">
            <div className="photo-heading">
              <div>
                <strong>
                  📸 عکس‌های آگهی
                </strong>

                <small>
                  حداکثر{" "}
                  {MAX_PHOTOS}{" "}
                  عکس، هر عکس تا ۱۰ مگابایت
                </small>
              </div>

              <span>
                {
                  selectedFiles.length
                }
                /
                {MAX_PHOTOS}
              </span>
            </div>

            <div className="photo-buttons">
              <button
                type="button"
                className="photo-button"
                disabled={
                  loading ||
                  selectedFiles.length >=
                    MAX_PHOTOS
                }
                onClick={() =>
                  cameraInputRef.current?.click()
                }
              >
                <span>
                  📷
                </span>

                <strong>
                  دوربین
                </strong>

                <small>
                  گرفتن عکس جدید
                </small>
              </button>

              <button
                type="button"
                className="photo-button"
                disabled={
                  loading ||
                  selectedFiles.length >=
                    MAX_PHOTOS
                }
                onClick={() =>
                  galleryInputRef.current?.click()
                }
              >
                <span>
                  🖼️
                </span>

                <strong>
                  گالری
                </strong>

                <small>
                  انتخاب از گوشی
                </small>
              </button>
            </div>

            <input
              ref={
                cameraInputRef
              }
              type="file"
              accept="image/*"
              capture="environment"
              hidden
              onChange={(
                event
              ) => {
                onFilesSelected(
                  event.currentTarget
                    .files
                );

                event.currentTarget.value =
                  "";
              }}
            />

            <input
              ref={
                galleryInputRef
              }
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(
                event
              ) => {
                onFilesSelected(
                  event.currentTarget
                    .files
                );

                event.currentTarget.value =
                  "";
              }}
            />

            {previewUrls.length >
              0 && (
              <div className="preview-grid">
                {previewUrls.map(
                  (
                    url,
                    index
                  ) => (
                    <div
                      className="preview-item"
                      key={`${url}-${index}`}
                    >
                      <img
                        src={url}
                        alt={`پیش‌نمایش ${index + 1}`}
                      />

                      {index ===
                        0 && (
                        <span className="main-photo-label">
                          عکس اصلی
                        </span>
                      )}

                      <button
                        type="button"
                        className="remove-photo"
                        onClick={() =>
                          onRemoveFile(
                            index
                          )
                        }
                        aria-label="حذف عکس"
                      >
                        ×
                      </button>
                    </div>
                  )
                )}
              </div>
            )}
          </div>

          {message && (
            <div className="form-message">
              {
                message
              }
            </div>
          )}

          <button
            className="primary-button submit-listing"
            type="submit"
            disabled={
              loading
            }
          >
            {loading
              ? "در حال ثبت..."
              : "🚀 ثبت آگهی"}
          </button>
        </form>
      </section>
    </div>
  );
}

/* =========================================================
   ACCOUNT
========================================================= */

function AccountPage({
  user,
  mode,
  setMode,
  fullName,
  setFullName,
  mobile,
  setMobile,
  password,
  setPassword,
  repeatPassword,
  setRepeatPassword,
  loading,
  message,
  onRegister,
  onLogin,
  onLogout,
  onBack,
}: {
  user: User | null;
  mode:
    | "register"
    | "login";
  setMode: (
    mode:
      | "register"
      | "login"
  ) => void;
  fullName: string;
  setFullName: (
    value: string
  ) => void;
  mobile: string;
  setMobile: (
    value: string
  ) => void;
  password: string;
  setPassword: (
    value: string
  ) => void;
  repeatPassword: string;
  setRepeatPassword: (
    value: string
  ) => void;
  loading: boolean;
  message: string;
  onRegister: (
    event: React.FormEvent
  ) => void;
  onLogin: () => void;
  onLogout: () => void;
  onBack: () => void;
}) {
  return (
    <div className="page">
      <button
        className="back-button"
        onClick={onBack}
        type="button"
      >
        → بازگشت
      </button>

      {user ? (
        <section className="account-card">
          <div className="avatar">
            {user.full_name?.charAt(
              0
            ) || "د"}
          </div>

          <h1>
            {
              user.full_name
            }
          </h1>

          <p>
            {user.mobile}
          </p>

          <div className="account-status">
            <div>
              <span>
                حساب کاربری
              </span>

              <strong>
                فعال
              </strong>
            </div>

            <div>
              <span>
                شماره موبایل
              </span>

              <strong>
                {user.phone_verified
                  ? "تأیید شده"
                  : "تأیید نشده"}
              </strong>
            </div>
          </div>

          <button
            className="secondary-button full"
            onClick={
              onLogout
            }
            type="button"
          >
            خروج از حساب
          </button>
        </section>
      ) : (
        <section className="account-card">
          <div className="account-icon">
            👤
          </div>

          <h1>
            حساب کاربری
          </h1>

          <p>
            برای ثبت آگهی و استفاده
            از امکانات بیشتر، حساب
            خودت را بساز.
          </p>

          <div className="account-tabs">
            <button
              type="button"
              className={
                mode ===
                "register"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setMode(
                  "register"
                )
              }
            >
              ثبت‌نام
            </button>

            <button
              type="button"
              className={
                mode ===
                "login"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setMode(
                  "login"
                )
              }
            >
              ورود
            </button>
          </div>

          {mode ===
          "register" ? (
            <form
              className="account-form"
              onSubmit={
                onRegister
              }
            >
              <label className="field">
                <span>
                  نام و نام خانوادگی
                </span>

                <input
                  value={
                    fullName
                  }
                  onChange={(
                    event
                  ) =>
                    setFullName(
                      event
                        .target
                        .value
                    )
                  }
                  placeholder="مثلاً محمد حاتمی"
                />
              </label>

              <label className="field">
                <span>
                  شماره موبایل
                </span>

                <input
                  value={
                    mobile
                  }
                  onChange={(
                    event
                  ) =>
                    setMobile(
                      event
                        .target
                        .value
                    )
                  }
                  inputMode="tel"
                  placeholder="09xxxxxxxxx"
                />
              </label>

              <label className="field">
                <span>
                  رمز عبور
                </span>

                <input
                  type="password"
                  value={
                    password
                  }
                  onChange={(
                    event
                  ) =>
                    setPassword(
                      event
                        .target
                        .value
                    )
                  }
                  placeholder="حداقل ۶ کاراکتر"
                />
              </label>

              <label className="field">
                <span>
                  تکرار رمز عبور
                </span>

                <input
                  type="password"
                  value={
                    repeatPassword
                  }
                  onChange={(
                    event
                  ) =>
                    setRepeatPassword(
                      event
                        .target
                        .value
                    )
                  }
                  placeholder="رمز عبور را تکرار کنید"
                />
              </label>

              {message && (
                <div className="form-message">
                  {
                    message
                  }
                </div>
              )}

              <button
                className="primary-button full"
                type="submit"
                disabled={
                  loading
                }
              >
                {loading
                  ? "در حال ثبت..."
                  : "ساخت حساب"}
              </button>
            </form>
          ) : (
            <div className="account-form">
              <label className="field">
                <span>
                  شماره موبایل
                </span>

                <input
                  value={
                    mobile
                  }
                  onChange={(
                    event
                  ) =>
                    setMobile(
                      event
                        .target
                        .value
                    )
                  }
                  inputMode="tel"
                  placeholder="09xxxxxxxxx"
                />
              </label>

              <label className="field">
                <span>
                  رمز عبور
                </span>

                <input
                  type="password"
                  value={
                    password
                  }
                  onChange={(
                    event
                  ) =>
                    setPassword(
                      event
                        .target
                        .value
                    )
                  }
                  placeholder="رمز عبور"
                />
              </label>

              {message && (
                <div className="form-message">
                  {
                    message
                  }
                </div>
              )}

              <button
                className="primary-button full"
                type="button"
                onClick={
                  onLogin
                }
              >
                ورود
              </button>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

/* =========================================================
   FEATURE
========================================================= */

function Feature({
  icon,
  title,
  text,
}: {
  icon: string;
  title: string;
  text: string;
}) {
  return (
    <div className="feature-card">
      <span>
        {icon}
      </span>

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
   BOTTOM NAV
========================================================= */

function BottomNav({
  page,
  goHome,
  openAccount,
  openCreateListing,
}: {
  page: Page;
  goHome: () => void;
  openAccount: () => void;
  openCreateListing: () => void;
}) {
  return (
    <nav className="bottom-nav">
      <button
        type="button"
        className={
          page === "home"
            ? "active"
            : ""
        }
        onClick={
          goHome
        }
      >
        <span>
          ⌂
        </span>

        <small>
          خانه
        </small>
      </button>

      <button
        type="button"
        onClick={
          goHome
        }
      >
        <span>
          ▦
        </span>

        <small>
          دسته‌ها
        </small>
      </button>

      <button
        type="button"
        className="add-button"
        onClick={
          openCreateListing
        }
      >
        <span>
          ＋
        </span>

        <small>
          ثبت آگهی
        </small>
      </button>

      <button
        type="button"
        onClick={
          goHome
        }
      >
        <span>
          ⚡
        </span>

        <small>
          خدمات
        </small>
      </button>

      <button
        type="button"
        className={
          page ===
          "account"
            ? "active"
            : ""
        }
        onClick={
          openAccount
        }
      >
        <span>
          ♙
        </span>

        <small>
          حساب من
        </small>
      </button>
    </nav>
  );
}

/* =========================================================
   START
========================================================= */

createRoot(
  document.getElementById(
    "root"
  )!
).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```
