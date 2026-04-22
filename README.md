# 🤖 Smart Orientation AI

### 🎓 AI-powered platform for university orientation using RAG + LLM

An intelligent system that helps students choose their university path using Artificial Intelligence.

---
## 📸 Screenshots

### 🔐 Login Page
![Login](screenshots/login.png)

### 📊 Dashboard
![Dashboard](screenshots/dashboard.png)

### 🤖 AI Chatbot
![Chat](screenshots/chat.png)

---
## 🚀 Features

* 🤖 Smart AI chatbot for academic orientation
* 📊 RAG system powered by job database (`jobs.json`)
* 🌍 Multi-language support (Arabic / French)
* 👤 Student profile management (Bac type, average, field)
* 📈 Full dashboard with authentication system
* 🎨 Modern UI built with Next.js and Tailwind CSS

---

## 🏗️ Tech Stack

### Frontend

* **Next.js 16** – React framework for web apps
* **TypeScript** – Type-safe development
* **Tailwind CSS** – Modern responsive design
* **NextAuth** – Authentication system
* **Lucide React** – Icons library

### Backend

* **NestJS** – Node.js backend framework
* **TypeScript** – Type-safe backend
* **Prisma** – ORM for database
* **PostgreSQL** – Relational database
* **Passport.js** – Authentication strategies
* **JWT** – Secure authentication

### AI & Data

* **Ollama** – Local LLM server
* **Mistral** – Language model
* **RAG (Retrieval-Augmented Generation)** – Combines AI with structured job data

---

## 📦 Installation

### Requirements

* Node.js 18+
* npm or yarn
* PostgreSQL
* Ollama

---

### Setup Steps

#### 1. Clone repository

```bash
git clone https://github.com/Riahisamed/smart-orientation.git
cd smart-orientation
```

#### 2. Install dependencies

```bash
# Backend
cd smart-orientation-backend
npm install

# Frontend
cd ../orientation-frontend
npm install
```

#### 3. Setup database

```bash
npx prisma migrate dev
npx prisma db seed
```

#### 4. Install and run AI model

```bash
ollama pull mistral
ollama run mistral
```

---

## ⚡ Usage

#### Start backend

```bash
cd smart-orientation-backend
npm run start:dev
```

#### Start frontend

```bash
cd ../orientation-frontend
npm run dev
```

👉 Open: http://localhost:3000

---

## 🔐 Environment Variables

### Backend (.env)

```env
DATABASE_URL="postgresql://user:password@localhost:5432/smart_orientation"
JWT_SECRET="your-secret-key"
OLLAMA_URL="http://localhost:11434"
```

### Frontend (.env.local)

```env
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

---

## 🗂️ Project Structure

```
smart-orientation/
├── orientation-frontend/
│   ├── app/
│   ├── lib/
│   ├── public/
│   └── tailwind.config.js
├── smart-orientation-backend/
│   ├── src/
│   │   ├── auth/
│   │   ├── chatbot/
│   │   ├── student/
│   │   └── prisma/
│   ├── lib/data/jobs.json
│   └── prisma/
└── README.md
```

---

## 💡 Example

User:

```text
je veux dev
```

AI Response:

```text
Full-Stack Developer  
Practice coding every day.
```

---

## 🔮 Future Improvements

* [ ] Add English support
* [ ] Export recommendations as PDF
* [ ] Email notifications
* [ ] Dark mode
* [ ] Advanced analytics
* [ ] University integrations
* [ ] Offline mode
* [ ] Mobile app (React Native)

---

## 🤝 Contributing

Contributions are welcome! Please check the CONTRIBUTING.md file before submitting.

---



## 📧 Contact

* **Developer:** Riah Saadi
* **GitHub:** https://github.com/Riahisamed

---

⭐ If you like this project, don’t forget to star the repo!
