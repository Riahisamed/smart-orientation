# Smart Orientation Platform

Decision Support System for academic and professional orientation.

## Requirements

* Node.js (v20+)
* PostgreSQL

## Installation

```bash
git remote add origin https://github.com/Riahisamed/smart-orientation-platform.git
cd smart-orientation-platform
npm install
```

## Database

Create a PostgreSQL database named:

```
orientation_db
```

Then create a `.env` file in the root directory:

```
DATABASE_URL="postgresql://postgres:1234@localhost:5432/orientation_db"
JWT_SECRET="supersecretkey"

# Frontend URL used in reset link
FRONTEND_URL="http://localhost:3000"

# SMTP config (Gmail, Mailtrap, etc.)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@example.com"
SMTP_PASS="your-app-password"
SMTP_FROM="no-reply@smart-orientation.local"
```

## Run the project

```
npm run start:dev
```

Server runs on:

```
http://localhost:3000
```

## Test API

### Add student

POST /student

Body (JSON):

```
{
  "name": "Test Student",
  "bacAverage": 14.5,
  "interests": "AI"
}
```

### Get students

GET /student

## Forgot / Reset Password APIs

- `POST /auth/forgot-password` with body:

```json
{ "email": "user@example.com" }
```

- `POST /auth/reset-password` with body:

```json
{ "token": "RESET_TOKEN", "newPassword": "new-password" }
```
