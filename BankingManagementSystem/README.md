# Banking Management System

A professional, production-style **banking management system** built with:

- **Django 6.1** — web framework
- **Django REST Framework** — REST API
- **PostgreSQL** — database
- **JWT (SimpleJWT)** — stateless authentication
- **drf-spectacular** — auto-generated OpenAPI/Swagger docs

Customers can register, open bank accounts, deposit money, withdraw money and
transfer money between accounts. Every operation is atomic, permission-checked,
audited by an immutable transaction record, and covered by automated tests.

> **Learn while you build** — this README walks you through the entire project
> **Phase 1 → Phase 14**, teaching you how each piece was designed and built.
> Follow the phases in order and you will be able to rebuild this system
> yourself from scratch.

---

## Table of Contents

- [Quick start](#quick-start)
- [Project structure](#project-structure)
- [API overview](#api-overview)
- [Phase 1 — Environment setup](#phase-1--environment-setup)
- [Phase 2 — Django project & apps](#phase-2--django-project--apps)
- [Phase 3 — Configuration](#phase-3--configuration)
- [Phase 4 — Data models](#phase-4--data-models)
- [Phase 5 — Migrations](#phase-5--migrations)
- [Phase 6 — Business logic (service layer)](#phase-6--business-logic-service-layer)
- [Phase 7 — Django admin](#phase-7--django-admin)
- [Phase 8 — REST API: serializers](#phase-8--rest-api-serializers)
- [Phase 9 — REST API: views & actions](#phase-9--rest-api-views--actions)
- [Phase 10 — URL routing](#phase-10--url-routing)
- [Phase 11 — Authentication & permissions](#phase-11--authentication--permissions)
- [Phase 12 — API documentation](#phase-12--api-documentation)
- [Phase 13 — Testing](#phase-13--testing)
- [Phase 14 — Run & verify](#phase-14--run--verify)
- [Security notes](#security-notes)
- [License](#license)

---

## Quick start

```bash
# 1. Create & activate a virtual environment
python -m venv venv
venv\Scripts\activate          # Windows
source venv/bin/activate       # macOS / Linux

# 2. Install dependencies
pip install -r requirements.txt

# 3. Copy the env template and fill in your secrets
cp .env.example .env          # Windows:  Copy-Item .env.example .env

# 4. Create the PostgreSQL database (psql must be on PATH)
psql -U postgres -h localhost -c "CREATE DATABASE banking;"

# 5. Run migrations
python manage.py migrate

# 6. Create an admin user
python manage.py createsuperuser

# 7. Start the server
python manage.py runserver
```

Open:

| URL | What it is |
| --- | --- |
| `http://127.0.0.1:8000/api/` | API home |
| `http://127.0.0.1:8000/api/docs/` | Interactive Swagger docs |
| `http://127.0.0.1:8000/admin/` | Django admin |

---

## Project structure

```
BankingManagementSystem/
├── config/                  # Django project package (settings, root urls)
│   ├── settings.py          # All configuration, loaded from .env
│   └── urls.py              # Root URL configuration
├── customers/               # Customer profiles (1-to-1 with auth User)
│   ├── models.py
│   ├── serializers.py
│   └── views.py
├── accounts/                # Bank accounts + deposit/withdraw/transfer API
│   ├── models.py
│   ├── serializers.py
│   └── views.py
├── transactions/            # Transaction records + business-logic services
│   ├── models.py
│   ├── serializers.py
│   ├── services.py          # deposit(), withdraw(), transfer()
│   └── views.py
├── banking/                 # API composition + home endpoint
│   ├── urls.py              # Aggregates all app routers
│   └── views.py
├── .env                     # REAL secrets (git-ignored — never commit!)
├── .env.example             # Template of keys, committed to git
├── .gitignore
├── manage.py
└── requirements.txt
```

The **dependency flow** matters: `transactions` depends on `accounts`, which
depends on `customers`, which depends on Django's `auth`. Keeping dependencies
one-directional makes the code predictable.

```
auth  ──>  customers  ──>  accounts  ──>  transactions
```

---

## API overview

| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| POST | `/api/auth/register/` | Public: create a user + customer profile |
| POST | `/api/auth/login/` | Public: obtain JWT access + refresh tokens |
| POST | `/api/auth/refresh/` | Refresh an access token |
| POST | `/api/auth/logout/` | Blacklist a refresh token |
| GET | `/api/customers/` | List customers (staff) / own profile |
| GET | `/api/customers/me/` | Get your own profile |
| POST | `/api/accounts/` | Open a new bank account |
| GET | `/api/accounts/` | List your accounts |
| POST | `/api/accounts/{id}/deposit/` | Deposit money |
| POST | `/api/accounts/{id}/withdraw/` | Withdraw money |
| POST | `/api/accounts/{id}/transfer/` | Transfer to another account |
| GET | `/api/transactions/` | List transactions (filterable, searchable) |
| GET | `/api/schema/` | OpenAPI 3 schema |
| GET | `/api/docs/` | Swagger UI |

**Quick API walkthrough** (all JSON):

```bash
# 1. Register
curl -X POST http://127.0.0.1:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","password":"SecurePass123!","phone":"+1234567890"}'

# 2. Login → get a token
curl -X POST http://127.0.0.1:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","password":"SecurePass123!"}'

# 3. Open an account (use the token from step 2)
curl -X POST http://127.0.0.1:8000/api/accounts/ \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"account_type":"SAVINGS"}'

# 4. Deposit
curl -X POST http://127.0.0.1:8000/api/accounts/1/deposit/ \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"amount":"500.00"}'
```

---

# Phase 1 — Environment setup

Every professional project starts by isolating the environment and protecting
secrets.

### 1.1 Virtual environment

```bash
python -m venv venv
venv\Scripts\activate        # Windows
source venv/bin/activate     # macOS / Linux
pip install --upgrade pip
```

### 1.2 Install dependencies

```bash
pip install Django djangorestframework djangorestframework-simplejwt \
            django-filter drf-spectacular psycopg2-binary python-dotenv
pip freeze > requirements.txt
```

| Package | Purpose |
| ------- | ------- |
| `Django` | The web framework |
| `djangorestframework` | REST API toolkit |
| `djangorestframework-simplejwt` | JWT authentication |
| `django-filter` | API queryset filtering |
| `drf-spectacular` | OpenAPI schema + Swagger UI |
| `psycopg2-binary` | PostgreSQL driver for Django |
| `python-dotenv` | Load `.env` files |

### 1.3 Secrets: `.env` (git-ignored) + `.env.example` (committed)

Never hard-code secrets. Put them in `.env` and load them at runtime.

**.env** (created locally, **never** committed):

```ini
SECRET_KEY=django-insecure-change-me
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
DB_NAME=banking
DB_USER=postgres
DB_PASSWORD=YourRealPasswordHere
DB_HOST=localhost
DB_PORT=5432
```

**.env.example** (a template — committed to git so teammates know what to fill):

```ini
SECRET_KEY=change-me-to-a-long-random-string
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
DB_NAME=banking
DB_USER=postgres
DB_PASSWORD=your-db-password
DB_HOST=localhost
DB_PORT=5432
```

`.env` is already ignored by `.gitignore` (see Phase 1.4). Verify it is ignored:

```bash
git check-ignore .env        # prints .env → it IS ignored
git status                   # .env must NOT appear here
```

### 1.4 `.gitignore`

A professional repo ignores generated files, secrets, and virtual
environments. Key entries:

```gitignore
venv/
__pycache__/
*.py[cod]
db.sqlite3
.env
.env.*
!.env.example
*.log
```

> **Security rule:** your database password, `SECRET_KEY`, API keys and any
> other credentials live ONLY in `.env`, which is always git-ignored.

### 1.5 PostgreSQL

Create the database (the `postgres` user and its password are in your `.env`):

```bash
psql -U postgres -h localhost -c "CREATE DATABASE banking;"
```

---

# Phase 2 — Django project & apps

Django splits a system into *apps* (modules) so each piece has a single
responsibility. We use four apps:

```bash
django-admin startproject config .
django-admin startapp customers
django-admin startapp accounts
django-admin startapp transactions
django-admin startapp banking
```

| App | Responsibility |
| --- | -------------- |
| `customers` | A customer's profile, linked 1-to-1 to Django's auth `User` |
| `accounts` | Bank accounts (number, type, status, balance) |
| `transactions` | Immutable ledger records + deposit/withdraw/transfer logic |
| `banking` | Top-level API router + home endpoint |
| `config` | Project settings and root URL configuration |

**Why a separate `transactions` app?** Money movement is the heart of a bank.
Keeping the ledger model *and* the business logic in their own app makes the
system easy to test, audit and extend.

---

# Phase 3 — Configuration

`config/settings.py` is rewritten to be environment-driven.

### 3.1 Load `.env`

```python
from dotenv import load_dotenv
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")
```

### 3.2 Read values from the environment

```python
import os

def env_bool(key, default=False):
    return os.getenv(key, str(default)).lower() in ("1", "true", "yes", "on")

SECRET_KEY = os.getenv("SECRET_KEY", "django-insecure-development-key")
DEBUG = env_bool("DEBUG", True)
ALLOWED_HOSTS = [h.strip() for h in os.getenv("ALLOWED_HOSTS", "localhost,127.0.0.1").split(",")]
```

### 3.3 Register apps

```python
INSTALLED_APPS = [
    # Django built-ins...
    # Third party
    "rest_framework",
    "rest_framework_simplejwt.token_blacklist",
    "django_filters",
    "drf_spectacular",
    # Local
    "customers",
    "accounts",
    "transactions",
    "banking",
]
```

`token_blacklist` is required for JWT logout (token revocation).

### 3.4 PostgreSQL database

```python
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.getenv("DB_NAME", "banking"),
        "USER": os.getenv("DB_USER", "postgres"),
        "PASSWORD": os.getenv("DB_PASSWORD", ""),
        "HOST": os.getenv("DB_HOST", "localhost"),
        "PORT": os.getenv("DB_PORT", "5432"),
    }
}
```

### 3.5 DRF settings

```python
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",   # protected by default
    ),
    "DEFAULT_FILTER_BACKENDS": (
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ),
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 20,
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
}
```

Notice the **default permission is `IsAuthenticated`**. That is the
fail-safe choice: every new endpoint is locked until you explicitly open it.

### 3.6 JWT settings

```python
from datetime import timedelta

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=30),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=1),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "AUTH_HEADER_TYPES": ("Bearer",),
}
```

### 3.7 API docs settings

```python
SPECTACULAR_SETTINGS = {
    "TITLE": "Banking Management System API",
    "DESCRIPTION": "Manage customers, bank accounts and transactions.",
    "VERSION": "1.0.0",
}
```

---

# Phase 4 — Data models

### 4.1 `customers/models.py`

```python
class Customer(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="customer"
    )
    phone = models.CharField(max_length=20, unique=True)
    address = models.TextField(blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    is_verified = models.BooleanField(default=False, help_text="KYC status")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

**Why `OneToOneField` to `User`?** Django's built-in `User` handles login,
password hashing and groups. We extend it with banking-specific data instead of
replacing it, keeping authentication standard and safe.

### 4.2 `accounts/models.py`

```python
class AccountType(models.TextChoices):
    SAVINGS = "SAVINGS", "Savings"
    CHECKING = "CHECKING", "Checking"
    BUSINESS = "BUSINESS", "Business"

class AccountStatus(models.TextChoices):
    ACTIVE = "ACTIVE", "Active"
    FROZEN = "FROZEN", "Frozen"
    CLOSED = "CLOSED", "Closed"

class BankAccount(models.Model):
    customer = models.ForeignKey(Customer, on_delete=models.PROTECT, related_name="accounts")
    account_number = models.CharField(max_length=16, unique=True, editable=False)
    account_type = models.CharField(max_length=10, choices=AccountType.choices, default=AccountType.SAVINGS)
    status = models.CharField(max_length=10, choices=AccountStatus.choices, default=AccountStatus.ACTIVE)
    balance = models.DecimalField(max_digits=15, decimal_places=2, default=Decimal("0.00"))
```

**Key decisions:**

- **`DecimalField`, never `FloatField`** — money must be exact; floats introduce
  rounding errors.
- **`account_number` is `editable=False`** and generated automatically in
  `save()` using `secrets` (cryptographically random), retrying until unique.
- **`on_delete=models.PROTECT`** — you cannot accidentally delete a customer
  who still has accounts (a real bank never silently destroys a ledger).

```python
def save(self, *args, **kwargs):
    if not self.account_number:
        self.account_number = self._generate_account_number()
    super().save(*args, **kwargs)

@staticmethod
def _generate_account_number():
    while True:
        candidate = "".join(secrets.choice("0123456789") for _ in range(10))
        if not BankAccount.objects.filter(account_number=candidate).exists():
            return candidate
```

### 4.3 `transactions/models.py`

```python
class TransactionType(models.TextChoices):
    DEPOSIT = "DEPOSIT", "Deposit"
    WITHDRAWAL = "WITHDRAWAL", "Withdrawal"
    TRANSFER = "TRANSFER", "Transfer"

class Transaction(models.Model):
    account = models.ForeignKey(BankAccount, on_delete=models.PROTECT, related_name="transactions")
    related_account = models.ForeignKey(
        BankAccount, null=True, blank=True, on_delete=models.SET_NULL,
        related_name="related_transactions", help_text="Counter-party for transfers."
    )
    transaction_type = models.CharField(max_length=12, choices=TransactionType.choices)
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    balance_after = models.DecimalField(max_digits=15, decimal_places=2)
    status = models.CharField(max_length=10, choices=..., default=TransactionStatus.COMPLETED)
    reference = models.CharField(max_length=32, unique=True, editable=False)
    description = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
```

**Why is the ledger immutable?** `balance_after` is snapshotted on every record,
so history can be replayed and audited even if something changes later. This is
how real banking systems stay verifiable.

---

# Phase 5 — Migrations

```bash
python manage.py makemigrations
python manage.py migrate
```

- `makemigrations` builds migration files from your models.
- `migrate` applies them to the database.

Migrations should be **committed to git** — they are the history of your schema
and must be shared with the whole team.

---

# Phase 6 — Business logic (service layer)

Business rules live in `transactions/services.py`, **not** inside the views or
serializers. This keeps the rules testable and reusable.

### 6.1 Validation

```python
def _validate_amount(amount):
    amount = Decimal(str(amount))
    if amount <= 0:
        raise ValidationError("Amount must be greater than zero.")
    if amount.as_tuple().exponent < -2:
        raise ValidationError("Amount cannot have more than 2 decimal places.")
    return amount

def _ensure_account_active(account):
    if account.status != AccountStatus.ACTIVE:
        raise ValidationError(f"Account {account.account_number} is not active.")
```

### 6.2 Deposit & withdraw — atomic

```python
@transaction.atomic
def deposit(account, amount, description="Cash deposit"):
    amount = _validate_amount(amount)
    _ensure_account_active(account)

    account.refresh_from_db()          # re-read the latest balance (race safety)
    account.balance += amount
    account.save(update_fields=["balance", "updated_at"])

    return _log_transaction(account, TransactionType.DEPOSIT, amount,
                            account.balance, description)


@transaction.atomic
def withdraw(account, amount, description="Cash withdrawal"):
    amount = _validate_amount(amount)
    _ensure_account_active(account)

    account.refresh_from_db()
    if amount > account.balance:
        raise ValidationError("Insufficient funds.")

    account.balance -= amount
    account.save(update_fields=["balance", "updated_at"])

    return _log_transaction(account, TransactionType.WITHDRAWAL, amount,
                            account.balance, description)
```

### 6.3 Transfer — two accounts, one transaction

```python
@transaction.atomic
def transfer(from_account, to_account, amount, description="Account transfer"):
    amount = _validate_amount(amount)
    _ensure_account_active(from_account)
    _ensure_account_active(to_account)
    if from_account.pk == to_account.pk:
        raise ValidationError("Source and destination accounts must be different.")

    from_account.refresh_from_db()
    if amount > from_account.balance:
        raise ValidationError("Insufficient funds.")

    from_account.balance -= amount
    to_account.balance += amount
    from_account.save(update_fields=["balance", "updated_at"])
    to_account.save(update_fields=["balance", "updated_at"])

    return _log_transaction(from_account, TransactionType.TRANSFER, amount,
                            from_account.balance, description, related_account=to_account)
```

**Why `@transaction.atomic`?** If *any* part fails, the whole operation rolls
back. Money can never be debited without being credited — the guarantee is
enforced by the database, not by hope.

---

# Phase 7 — Django admin

`admin.py` gives your operations team a management UI. Key techniques:

```python
@admin.register(BankAccount)
class BankAccountAdmin(admin.ModelAdmin):
    list_display = ["account_number", "customer", "account_type", "status", "balance", "created_at"]
    list_filter = ["account_type", "status", "created_at"]
    search_fields = ["account_number", "customer__user__username"]
    readonly_fields = ["account_number", "balance", "created_at", "updated_at"]
    inlines = [TransactionInline]
```

- `list_display` / `list_filter` / `search_fields` make records easy to find.
- `readonly_fields` protect values that should never be edited by hand
  (account number, balance, timestamps).
- **Inline ledger** shows each account's transactions right on the account page.
- When a model has two FKs to the same table, inline needs `fk_name="account"`.

---

# Phase 8 — REST API: serializers

Serializers convert models ⇄ JSON and validate input.

### 8.1 `customers/serializers.py` — nested + write-only fields

```python
class CustomerSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)       # nested user info

    class Meta:
        model = Customer
        fields = ["id", "user", "phone", "address", "date_of_birth", "is_verified", ...]
        read_only_fields = ["is_verified", "created_at", "updated_at"]


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    def create(self, validated_data):
        phone = validated_data.pop("phone")
        user = User.objects.create_user(**validated_data)   # hashes the password!
        return Customer.objects.create(user=user, phone=phone)
```

**`create_user` not `create`** — this is critical. It hashes the password so
plaintext is never stored.

### 8.2 `accounts/serializers.py` — computed fields & operation bodies

```python
class BankAccountSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source="customer.user.get_full_name", read_only=True)

    class Meta:
        model = BankAccount
        fields = ["id", "customer", "customer_name", "account_number", ...]
        read_only_fields = ["customer", "account_number", "balance", "status", ...]


class TransferSerializer(serializers.Serializer):
    to_account_number = serializers.CharField(max_length=16)
    amount = serializers.DecimalField(max_digits=15, decimal_places=2)

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Amount must be greater than zero.")
        return value
```

`source=` lets you surface data from related models (`customer.user...`)
without adding database fields.

---

# Phase 9 — REST API: views & actions

### 9.1 Ownership filtering — the core security rule

Every viewset restricts its queryset to the **current user**, so customers can
only ever see their own data. Staff see everything.

```python
class BankAccountViewSet(viewsets.ModelViewSet):
    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return BankAccount.objects.select_related("customer__user").all()
        return BankAccount.objects.filter(customer__user=user).select_related("customer__user")
```

Filtering the **queryset** (not the serializer) means a customer who guesses
another account's ID gets a `404`, because the row is never visible to them.

### 9.2 Custom actions: deposit / withdraw / transfer

DRF `@action` decorators add methods to a detail route:

```python
@action(detail=True, methods=["post"])
def deposit(self, request, pk=None):
    account = self.get_object()
    serializer = AccountOperationSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    try:
        txn = services.deposit(account, serializer.validated_data["amount"], ...)
    except DjangoValidationError as exc:
        return Response({"detail": exc.messages}, status=status.HTTP_400_BAD_REQUEST)
    return Response(TransactionSerializer(txn).data)
```

`self.get_object()` already applies the ownership queryset — so a customer can
only operate on **their own** accounts.

### 9.3 Registration — a public endpoint

```python
class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]     # deliberately opened

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        customer = serializer.save()
        return Response(CustomerSerializer(customer).data, status=status.HTTP_201_CREATED)
```

This is the **only** open endpoint — everything else stays locked by default.

### 9.4 Filtering & searching transactions

```python
class TransactionFilter(filters.FilterSet):
    account_number = filters.CharFilter(field_name="account__account_number")

    class Meta:
        model = Transaction
        fields = ["transaction_type", "account_number"]


class TransactionViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = TransactionSerializer
    filterset_class = TransactionFilter
    search_fields = ["reference", "description"]
    ordering_fields = ["created_at", "amount"]
```

`filterset_class` enables `?transaction_type=DEPOSIT`, `search_fields` enables
`?search=TRX-...`, and `ordering_fields` enables `?ordering=-created_at`.

---

# Phase 10 — URL routing

### 10.1 Aggregate routers in `banking/urls.py`

```python
router = DefaultRouter()
router.register("customers", CustomerViewSet, basename="customer")
router.register("accounts", BankAccountViewSet, basename="account")
router.register("transactions", TransactionViewSet, basename="transaction")
urlpatterns = router.urls
```

The router automatically generates list + detail routes for every action.

### 10.2 Root URLs in `config/urls.py`

```python
urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", banking_views.HomeView.as_view()),
    path("api/auth/login/", TokenObtainPairView.as_view()),
    path("api/auth/refresh/", TokenRefreshView.as_view()),
    path("api/auth/logout/", TokenBlacklistView.as_view()),
    path("api/auth/register/", include("customers.urls")),
    path("api/", include("banking.urls")),
    path("api/schema/", SpectacularAPIView.as_view()),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema")),
]
```

The `banking` app is where app-level routers are **composed** into one API —
keeping the root URL file clean.

---

# Phase 11 — Authentication & permissions

### 11.1 JWT login/logout endpoints

Provided by `rest_framework_simplejwt` — zero code needed:

- `POST /api/auth/login/` → `{ "access": "...", "refresh": "..." }`
- `POST /api/auth/refresh/` → new access token from the refresh token
- `POST /api/auth/logout/` → blacklists (revokes) the refresh token

### 11.2 How a client uses it

```
Authorization: Bearer <access_token>
```

The access token is short-lived (30 min) and self-contained; the refresh token
(1 day) can be rotated and blacklisted on logout.

### 11.3 Permission model

| Layer | Setting | Effect |
| ----- | ------- | ------ |
| Global | `DEFAULT_PERMISSION_CLASSES = IsAuthenticated` | everything locked by default |
| Registration | `permission_classes = [AllowAny]` | only register + login are public |
| Queryset | `filter(customer__user=user)` | object-level ownership |

---

# Phase 12 — API documentation

`drf-spectacular` generates an OpenAPI 3 schema from your serializers and
viewsets automatically:

```bash
python manage.py spectacular --file schema.yml   # optional: export to file
```

Browse it live at **`http://127.0.0.1:8000/api/docs/`** — you can try every
endpoint directly from the Swagger UI.

---

# Phase 13 — Testing

Every app has a `tests.py`. Tests run against a temporary database:

```bash
python manage.py test
```

What the suite covers:

- **customers**: registration creates user + profile, duplicate username
  rejected, weak password rejected.
- **accounts**: account creation, deposit, withdraw, insufficient-funds rollback,
  negative amounts rejected, cross-customer access blocked, frozen accounts locked.
- **transactions** (service layer): deposit/transfer balance math, insufficient
  funds, same-account transfer, negative amounts.
- **banking** (integration): full register → login → access flow, transfer via
  API, unauthenticated requests rejected.

Example:

```python
class BankAccountAPITests(APITestCase):
    def setUp(self):
        self.customer = create_customer("alice", "+10000000001")
        self.client.force_authenticate(user=self.customer.user)

    def test_withdraw_insufficient_funds(self):
        account = BankAccount.objects.create(customer=self.customer)
        services.deposit(account, Decimal("10.00"))
        response = self.client.post(
            f"/api/accounts/{account.pk}/withdraw/", {"amount": "50.00"}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        account.refresh_from_db()
        self.assertEqual(account.balance, Decimal("10.00"))   # money untouched
```

**Testing golden rule:** always assert *the money moved correctly*, not just
that a request returned 200.

---

# Phase 14 — Run & verify

```bash
# System checks
python manage.py check

# Migrations
python manage.py migrate

# Create an admin
python manage.py createsuperuser

# Run the server
python manage.py runserver

# Run the test suite (21 tests)
python manage.py test
```

Manual smoke test:

```bash
# 1. Register
curl -X POST http://127.0.0.1:8000/api/auth/register/ -H "Content-Type: application/json" \
  -d '{"username":"alice","password":"SecurePass123!","phone":"+1234567890"}'

# 2. Login
curl -X POST http://127.0.0.1:8000/api/auth/login/ -H "Content-Type: application/json" \
  -d '{"username":"alice","password":"SecurePass123!"}'

# 3. Open account (paste your token)
curl -X POST http://127.0.0.1:8000/api/accounts/ \
  -H "Authorization: Bearer <ACCESS_TOKEN>" -H "Content-Type: application/json" \
  -d '{"account_type":"SAVINGS"}'

# 4. Deposit → withdraw → check transactions
curl -X POST http://127.0.0.1:8000/api/accounts/1/deposit/  -H "Authorization: Bearer <ACCESS_TOKEN>" -H "Content-Type: application/json" -d '{"amount":"500.00"}'
curl -X POST http://127.0.0.1:8000/api/accounts/1/withdraw/ -H "Authorization: Bearer <ACCESS_TOKEN>" -H "Content-Type: application/json" -d '{"amount":"50.00"}'
curl http://127.0.0.1:8000/api/transactions/ -H "Authorization: Bearer <ACCESS_TOKEN>"
```

---

## Security notes

- Secrets live only in `.env` (git-ignored); `.env.example` documents the keys.
- Passwords are hashed by Django's `create_user`.
- API is JWT-protected by default; only register/login are public.
- Every account operation runs in an atomic DB transaction with balance checks.
- The ledger is immutable — history can always be audited.
- Queryset filtering prevents any customer from reading another's data.
- Use HTTPS + a strong `SECRET_KEY` + `DEBUG=False` before deploying.

**Production checklist (next phases you could add):**

1. `DEBUG=False`, real `SECRET_KEY`, proper `ALLOWED_HOSTS`
2. Gunicorn + WhiteNoise for static files
3. PostgreSQL over TLS, restricted DB user
4. Rate limiting + brute-force protection on `/api/auth/login/`
5. Structured logging & observability
6. CI/CD with the test suite in the pipeline

---

## License

MIT — free to use, learn from, and build on.
