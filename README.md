# RK ENTERPRICES DELHI — Website & Catalogue Admin

Wholesale car accessories website (React + Vite) backed by a Django REST API
with a Django Unfold admin panel for managing categories and products.

```
RK/
├── src/                     React frontend (Vite)
│   ├── services/            api.js, categoryService.js, productService.js, enquiry.js
│   ├── hooks/               useAsync, useCategories, useProductList, …
│   └── …
├── backend/                 Django project
│   ├── config/              settings, urls, API router, admin theme
│   ├── apps/core/           validators, shared helpers
│   ├── apps/categories/     Category model, API, admin
│   ├── apps/products/       Product model (incl. stock), API, admin, seed_catalog command
│   ├── apps/accounts/       customer sign-up / sign-in (password + Google), profiles
│   ├── apps/orders/         orders placed from the website, admin, stock reservation
│   ├── static/rk/           admin logo, favicon and stylesheet
│   ├── media/               uploaded images (git-ignored)
│   ├── requirements.txt
│   └── .env.example
├── .env.example             frontend env (VITE_API_BASE_URL)
└── .env.development         frontend dev defaults (no secrets)
```

## Requirements

- Python 3.10+ (developed on 3.12)
- Node.js 20+

Backend packages (pinned in `backend/requirements.txt`):

| Package | Version |
| --- | --- |
| Django | 5.2.18 (LTS) |
| djangorestframework | 3.18.3 |
| django-unfold | 0.108.0 |
| django-cors-headers | 4.9.0 |
| Pillow | 12.3.0 |
| python-dotenv | 1.2.4 |
| google-auth | 2.62.0 |
| requests | 2.34.2 |

## Running locally

### 1. Backend (Django)

```bash
cd backend

# Create and activate a virtual environment
python -m venv .venv
# Windows (PowerShell):  .venv\Scripts\Activate.ps1
# Windows (Git Bash):    source .venv/Scripts/activate
# macOS / Linux:         source .venv/bin/activate

pip install -r requirements.txt

# Local settings — then set DJANGO_SECRET_KEY in .env
cp .env.example .env

python manage.py migrate
python manage.py seed_catalog        # optional: starter categories & products
python manage.py createsuperuser     # your own admin login
python manage.py runserver           # http://127.0.0.1:8000
```

- Admin: http://127.0.0.1:8000/admin/
- API root: http://127.0.0.1:8000/api/v1/

### 2. Frontend (React)

```bash
# from the repository root
npm install
npm run dev                          # http://localhost:5173
```

The API URL comes from `VITE_API_BASE_URL` (`.env.development` points at
`http://127.0.0.1:8000/api/v1`). Override it in `.env.development.local` if needed.

### 3. Production frontend build

```bash
VITE_API_BASE_URL=https://api.your-domain.com/api/v1 npm run build   # output in dist/
```

If `VITE_API_BASE_URL` is not set, the frontend calls `/api/v1` on its own
domain (useful when Django is served behind the same domain).

### Tests

```bash
cd backend
python manage.py test
python manage.py check
```

## API — catalogue (read-only, public)

| Endpoint | Description |
| --- | --- |
| `GET /api/v1/categories/` | All categories (plain array, display order) |
| `GET /api/v1/categories/<slug>/` | One category |
| `GET /api/v1/products/` | Products, paginated: `{count, next, previous, results}` |
| `GET /api/v1/products/?category=wheels-tyres` | Filter by category slug |
| `GET /api/v1/products/?search=led` | Search name, description, category |
| `GET /api/v1/products/?featured=true` | Homepage featured products |
| `GET /api/v1/products/?slugs=a,b` | Specific products (refreshes the Order List) |
| `GET /api/v1/products/?page=2&page_size=12` | Pagination (max page size 100) |
| `GET /api/v1/products/<slug>/` | One product |

Filters combine, e.g. `?category=car-lighting&search=led`. Unknown slugs return
`404 {"detail": …}`. Write methods return `405` — all catalogue changes happen in
the authenticated admin.

**Prices:** `price_per_piece` is returned as an exact decimal string (`"850.00"`)
and shown on the website. The frontend converts it to integer paise, so line
totals and the order total are exact.

**Minimum order (per product):** each product has a “Minimum order” checkbox. When
ticked, “Minimum quantity” appears and is required; the API returns
`has_minimum_order: true` and `min_order_quantity: <n>`. When unticked, the API
returns `min_order_quantity: 1` and customers can order from 1 piece. The quantity
selector starts at that minimum and never goes below it (steps of 10 when the
minimum is 10 or more, otherwise steps of 1). `apps/products/serializers.OrderLineSerializer`
enforces the same rule server-side for any future order endpoint.

## Customer accounts & orders

**Sign-in.** The navbar profile icon opens `/signin` (sign in / create account)
when signed out and `/account` (details + order history) when signed in.
Customers can:

- create an account with name, email, mobile number and password, then sign in
  with **email or mobile number** + password;
- or use **Sign in with Google** (once the client ID is configured).

Sign-in returns a token (DRF token auth) that the frontend sends only on account
and order requests. Sign-in/sign-up attempts are rate limited (`API_AUTH_RATE`,
default 10/minute per IP). Signing out deletes the token on the server.

**Ordering.** Customers must be signed in to send an order. From the Order List
(or “Order now on WhatsApp” on a product page) they confirm their mobile number
and an optional note; the backend then:

1. re-reads prices from the database (browser prices are ignored),
2. checks each product's minimum order and available stock (with row locks),
3. saves the order with its items and reduces stock,
4. returns the order (e.g. `RK-1001`), which the site sends to WhatsApp.

Orders appear in the admin under **Sales → Orders** with a badge for new orders.
Staff can update the status (New → Confirmed → Dispatched → Delivered), add the
LR number, and call/WhatsApp the customer. Cancelling an order returns its stock;
a cancelled order can't be reopened.

| Endpoint | Description |
| --- | --- |
| `POST /api/v1/auth/register/` | `{name, email, phone, password}` → `{token, user}` |
| `POST /api/v1/auth/login/` | `{identifier: email or phone, password}` → `{token, user}` |
| `POST /api/v1/auth/google/` | `{credential: Google ID token}` → `{token, user}` |
| `POST /api/v1/auth/logout/` | Invalidates the token |
| `GET/PATCH /api/v1/auth/me/` | Profile (`name`, `phone`) |
| `POST /api/v1/orders/` | `{items: [{product: slug, quantity}], phone, notes}` |
| `GET /api/v1/orders/` | The signed-in customer's orders |
| `GET /api/v1/orders/<number>/` | One of their orders |

Account and order endpoints need `Authorization: Token <token>`.

### Setting up Google Sign-In

1. Google Cloud Console → APIs & Services → **OAuth consent screen**: configure it.
2. **Credentials → Create credentials → OAuth client ID → Web application.**
3. Under **Authorised JavaScript origins** add every site address, e.g.
   `http://localhost:5173` and your live domain (`https://your-domain.com`).
4. Copy the **Client ID** into:
   - `backend/.env` → `GOOGLE_CLIENT_ID=...`
   - frontend `.env.development` / production env → `VITE_GOOGLE_CLIENT_ID=...`
5. Restart Django and Vite. The Google button appears on the sign-in page.

The client secret is not needed for this flow (the browser receives a signed ID
token that the backend verifies against the client ID). If you store it in
`backend/.env` as `GOOGLE_CLIENT_SECRET`, never put it in the frontend.

## Managing the catalogue (admin)

- **Categories:** name, slug (auto-generated, kept unique), description, image,
  display order (lower numbers appear first on the website; ties sort by name).
  A category that still has products cannot be deleted.
- **Products:** name, slug, category, price per piece (₹, never negative),
  minimum order (checkbox + quantity), stock (pieces available; reduced when
  orders are placed — 0 shows “Out of stock”), description, optional features (one per
  line) and specifications (`Label: Value` per line), image, and “featured on homepage”.
- Images: JPG, PNG or WebP up to 5 MB (`MAX_IMAGE_UPLOAD_MB`), stored under
  `media/categories/` and `media/products/`. Items without an image show the
  site's dark placeholder.

`seed_catalog` loads the starter catalogue the site was designed with. It never
overwrites existing records. Seeded prices are `0.00` and the copy is placeholder
text — replace both with the real catalogue.

## Production notes

- Set `DJANGO_DEBUG=False`, a strong `DJANGO_SECRET_KEY`, `DJANGO_ALLOWED_HOSTS`,
  `CORS_ALLOWED_ORIGINS` (the real website origin only) and `CSRF_TRUSTED_ORIGINS`.
  CORS is restricted to `/api/` and to GET requests.
- Consider moving the admin with `DJANGO_ADMIN_URL`, and use strong, unique
  staff passwords. Only staff accounts can access the admin.
- Run behind a production WSGI server (e.g. gunicorn/uWSGI) and HTTPS.
  `python manage.py check --deploy` should only report the optional HSTS
  `includeSubDomains`/`preload` flags, which depend on your domain setup.
- Static files: `python manage.py collectstatic` (into `backend/staticfiles/`) and
  serve them from the web server or a CDN.
- **Media uploads are not served by Django when DEBUG is off.** Configure the web
  server (e.g. Nginx `location /media/ { alias /path/to/backend/media/; }`) or use
  object storage (S3-compatible) for `MEDIA_ROOT`, and back the folder up.
- SQLite suits development and light use; switch `DATABASES` to PostgreSQL for
  production traffic.

## Contact form

`src/services/enquiry.js` validates the form locally and does not send anything
yet (`ENQUIRY_ENDPOINT = null`). The success screen offers WhatsApp / call so
enquiries still reach the team. Connect it to a Django endpoint later by setting
the endpoint and adding the view.
