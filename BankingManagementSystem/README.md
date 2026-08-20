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

