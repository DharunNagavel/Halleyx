# Workflow Engine 🚀
### The Next-Gen Automation Platform

This is a powerful, full-stack workflow automation platform designed to streamline business processes through a robust rule engine, real-time execution tracking, and a premium developer-centric UI. Built with scalability and security in mind, this engine empowers teams to build, manage, and monitor complex workflows with ease.

---

## ✨ Key Features

- ⚡ **Workflow Engine**: Design complex workflows with multiple steps and conditional logic.
- 🎯 **Rule Engine**: Define granular rules to trigger actions based on specific data patterns.
- 📊 **Execution Tracking**: Monitor the real-time status of every workflow execution.
- 🛡️ **Secure by Design**: Integrated with **Arcjet** for intelligent bot protection and security.
- 🔑 **Next-Gen Auth**: Secure authentication flow with JWT and bcrypt password hashing.
- 📅 **Audit Logs**: Full visibility into workflow changes and execution history.
- 🎨 **Premium UI**: Modern, dark-themed dashboard featuring GSAP animations and Tailwind CSS for a seamless experience.

---

## 🧪 Testing & Credentials

> [!IMPORTANT]
> To create and manage workflows, you must be logged in as an **Admin**. For testing purposes, you can use the following pre-configured admin account:
>
> **Email:** `admin@gmail.com`  
> **Password:** `admin@1234`

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: [Next.js 15 (App Router)](https://nextjs.org/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Animations**: [GSAP](https://gsap.com/)
- **Form Handling**: React Hook Form + Zod
- **Icons**: Lucide React

### Backend
- **Runtime**: Node.js (Express.js)
- **Database**: [PostgreSQL (Neon DB)](https://neon.tech/)
- **Security**: [Arcjet](https://arcjet.com/) (Rate limiting, Bot protection)
- **Email**: Nodemailer
- **Caching**: Redis

---

## 📂 Project Structure

```bash
workflow-engine/
├── backend/            # Express server and Core Logic
│   ├── controller/     # Request handlers
│   ├── routes/         # API Route definitions
│   ├── middleware/     # Custom auth & protection filters
│   ├── db.js           # Neon DB connection (PostgreSQL)
│   └── server.js       # Entry point
├── frontend/           # Next.js Application
│   ├── app/            # Next.js App Router (Dashboard, Auth, Workflows)
│   ├── components/     # Reusable UI components
│   └── lib/            # Utility functions and API clients
└── README.md           # Documentation
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- PostgreSQL (Neon DB recommended)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd <project-directory>
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   ```
   Create a `.env` file in the `backend` directory:
   ```env
   PORT=5000
   DB_URL=your_postgresql_url
   JWT_SECRET=your_jwt_secret
   ARCJET=your_arcjet_key
   ARCJET_ENV=development
   ```

3. **Frontend Setup**
   ```bash
   cd ../frontend
   npm install
   ```
   Create a `.env` file in the `frontend` directory:
   ```env
   NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
   ```

### Running Locally

- **Start Backend**: `cd backend && npm run dev`
- **Start Frontend**: `cd frontend && npm run dev`

---

## 🛡️ Security

The engine is protected by **Arcjet**, ensuring that your automation processes are shielded from:
- Bot attacks
- SQL Injection attempts
- Excessive rate-limiting bypasses

---

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the ISC License.

---

<p align="center">Built with 💚 by <a href="https://github.com/DharunNagavel">Dharun Nagavel</a></p>
