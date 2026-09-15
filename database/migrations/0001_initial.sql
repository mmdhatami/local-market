PRAGMA foreign_keys = ON;

-- =========================
-- USERS
-- =========================

CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    password_hash TEXT,
    role TEXT NOT NULL DEFAULT 'user',
    verification_status TEXT NOT NULL DEFAULT 'unverified',
    avatar_url TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_phone
ON users(phone);

-- =========================
-- CATEGORIES
-- =========================

CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    icon TEXT,
    parent_id TEXT,
    active INTEGER NOT NULL DEFAULT 1,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,

    FOREIGN KEY (parent_id)
        REFERENCES categories(id)
        ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_categories_parent
ON categories(parent_id);

-- =========================
-- LISTINGS
-- =========================

CREATE TABLE IF NOT EXISTS listings (
    id TEXT PRIMARY KEY,
    owner_id TEXT NOT NULL,
    type TEXT NOT NULL,
    category_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    price INTEGER,
    negotiable INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'draft',
    latitude REAL,
    longitude REAL,
    address TEXT,
    city TEXT,
    district TEXT,
    views INTEGER NOT NULL DEFAULT 0,
    saves INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,

    FOREIGN KEY (owner_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    FOREIGN KEY (category_id)
        REFERENCES categories(id)
        ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_listings_owner
ON listings(owner_id);

CREATE INDEX IF NOT EXISTS idx_listings_category
ON listings(category_id);

CREATE INDEX IF NOT EXISTS idx_listings_status
ON listings(status);

CREATE INDEX IF NOT EXISTS idx_listings_location
ON listings(latitude, longitude);

-- =========================
-- LISTING IMAGES
-- =========================

CREATE TABLE IF NOT EXISTS listing_images (
    id TEXT PRIMARY KEY,
    listing_id TEXT NOT NULL,
    image_url TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,

    FOREIGN KEY (listing_id)
        REFERENCES listings(id)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_listing_images_listing
ON listing_images(listing_id);

-- =========================
-- BUSINESSES
-- =========================

CREATE TABLE IF NOT EXISTS businesses (
    id TEXT PRIMARY KEY,
    owner_id TEXT,
    name TEXT NOT NULL,
    description TEXT,
    phone TEXT,
    address TEXT,
    latitude REAL,
    longitude REAL,
    city TEXT,
    district TEXT,
    hours TEXT,
    verification_status TEXT NOT NULL DEFAULT 'unverified',
    claimed INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,

    FOREIGN KEY (owner_id)
        REFERENCES users(id)
        ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_businesses_owner
ON businesses(owner_id);

CREATE INDEX IF NOT EXISTS idx_businesses_location
ON businesses(latitude, longitude);

-- =========================
-- BUSINESS IMAGES
-- =========================

CREATE TABLE IF NOT EXISTS business_images (
    id TEXT PRIMARY KEY,
    business_id TEXT NOT NULL,
    image_url TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,

    FOREIGN KEY (business_id)
        REFERENCES businesses(id)
        ON DELETE CASCADE
);

-- =========================
-- SERVICE REQUESTS
-- =========================

CREATE TABLE IF NOT EXISTS service_requests (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    latitude REAL,
    longitude REAL,
    address TEXT,
    city TEXT,
    district TEXT,
    preferred_time TEXT,
    status TEXT NOT NULL DEFAULT 'open',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_service_requests_user
ON service_requests(user_id);

CREATE INDEX IF NOT EXISTS idx_service_requests_location
ON service_requests(latitude, longitude);

-- =========================
-- SERVICE REQUEST IMAGES
-- =========================

CREATE TABLE IF NOT EXISTS service_request_images (
    id TEXT PRIMARY KEY,
    request_id TEXT NOT NULL,
    image_url TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,

    FOREIGN KEY (request_id)
        REFERENCES service_requests(id)
        ON DELETE CASCADE
);

-- =========================
-- SERVICE OFFERS
-- =========================

CREATE TABLE IF NOT EXISTS service_offers (
    id TEXT PRIMARY KEY,
    request_id TEXT NOT NULL,
    provider_id TEXT NOT NULL,
    price INTEGER,
    description TEXT,
    available_time TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT NOT NULL,

    FOREIGN KEY (request_id)
        REFERENCES service_requests(id)
        ON DELETE CASCADE,

    FOREIGN KEY (provider_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_service_offers_request
ON service_offers(request_id);

CREATE INDEX IF NOT EXISTS idx_service_offers_provider
ON service_offers(provider_id);

-- =========================
-- CAMPAIGNS
-- =========================

CREATE TABLE IF NOT EXISTS campaigns (
    id TEXT PRIMARY KEY,
    business_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    image_url TEXT,
    discount_percent INTEGER,
    start_at TEXT NOT NULL,
    end_at TEXT NOT NULL,
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,

    FOREIGN KEY (business_id)
        REFERENCES businesses(id)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_campaigns_business
ON campaigns(business_id);

CREATE INDEX IF NOT EXISTS idx_campaigns_active
ON campaigns(active);

-- =========================
-- FAVORITES
-- =========================

CREATE TABLE IF NOT EXISTS favorites (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    listing_id TEXT NOT NULL,
    created_at TEXT NOT NULL,

    UNIQUE(user_id, listing_id),

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    FOREIGN KEY (listing_id)
        REFERENCES listings(id)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_favorites_user
ON favorites(user_id);

-- =========================
-- REVIEWS
-- =========================

CREATE TABLE IF NOT EXISTS reviews (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    business_id TEXT,
    listing_id TEXT,
    rating INTEGER NOT NULL,
    comment TEXT,
    created_at TEXT NOT NULL,

    CHECK (rating >= 1 AND rating <= 5),

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    FOREIGN KEY (business_id)
        REFERENCES businesses(id)
        ON DELETE CASCADE,

    FOREIGN KEY (listing_id)
        REFERENCES listings(id)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_reviews_business
ON reviews(business_id);

CREATE INDEX IF NOT EXISTS idx_reviews_listing
ON reviews(listing_id);

-- =========================
-- CONVERSATIONS
-- =========================

CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- =========================
-- CONVERSATION MEMBERS
-- =========================

CREATE TABLE IF NOT EXISTS conversation_members (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    created_at TEXT NOT NULL,

    UNIQUE(conversation_id, user_id),

    FOREIGN KEY (conversation_id)
        REFERENCES conversations(id)
        ON DELETE CASCADE,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

-- =========================
-- MESSAGES
-- =========================

CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL,
    sender_id TEXT NOT NULL,
    message_type TEXT NOT NULL DEFAULT 'text',
    body TEXT,
    attachment_url TEXT,
    created_at TEXT NOT NULL,
    read_at TEXT,

    FOREIGN KEY (conversation_id)
        REFERENCES conversations(id)
        ON DELETE CASCADE,

    FOREIGN KEY (sender_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation
ON messages(conversation_id);

-- =========================
-- NOTIFICATIONS
-- =========================

CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT,
    data_json TEXT,
    read_at TEXT,
    created_at TEXT NOT NULL,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_notifications_user
ON notifications(user_id);

-- =========================
-- REPORTS
-- =========================

CREATE TABLE IF NOT EXISTS reports (
    id TEXT PRIMARY KEY,
    reporter_id TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id TEXT NOT NULL,
    reason TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'open',
    created_at TEXT NOT NULL,
    resolved_at TEXT,

    FOREIGN KEY (reporter_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_reports_status
ON reports(status);

-- =========================
-- VERIFICATION REQUESTS
-- =========================

CREATE TABLE IF NOT EXISTS verification_requests (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    document_reference TEXT,
    created_at TEXT NOT NULL,
    reviewed_at TEXT,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_verification_user
ON verification_requests(user_id);

-- =========================
-- AUDIT LOG
-- =========================

CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    actor_user_id TEXT,
    action TEXT NOT NULL,
    target_type TEXT,
    target_id TEXT,
    metadata_json TEXT,
    created_at TEXT NOT NULL,

    FOREIGN KEY (actor_user_id)
        REFERENCES users(id)
        ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor
ON audit_logs(actor_user_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_target
ON audit_logs(target_type, target_id);
