# AI Code Review — Automated Multi-Layered Intelligence

<p align="center">
  <img src="https://raw.githubusercontent.com/lucide-react/lucide/main/icons/sparkles.svg" width="60" height="60" alt="Intelligence Logo" />
</p>

**AI Code Review** is a high-performance, premium ecosystem designed to transform the way developers manage and analyze their source code. Built with the MERN stack and powered by state-of-the-art AI, the platform offers a "Command Center" experience that combines deep analysis, seamless collaboration, and industry-grade security.

---

## ⚡ The Intelligence Engine

Our core analysis hub provides more than just linting; it delivers autonomous, multi-layered intelligence for your code.

- **🚀 Smart Language Badge**: Instantly identifies over **20+ tech stacks** (Rust, Go, Python, Swift, etc.) via file extensions and AI-powered content analysis.
- **✨ Zero-Click AI Analysis**: Real-time logic error detection, security vulnerability identification, and performance optimization tips.
- **🧩 Monaco-Powered Editor**: A high-performance, browser-based coding environment with full syntax highlighting and responsive styling.
- **📈 Historical Versioning**: Every review is versioned (v1, v2, etc.), allowing you to track code improvements and AI feedback cycles over time.

---

## 🏗️ The Command Center

A high-efficiency, 70/30 split dashboard minimizes cognitive load and puts your most important actions front and center.

- **📍 Quick-Action Header**: Instant access to Paste-Code, Upload-File, and Repository-Sync directly from your dashboard's global header.
- **📂 Project Management Hub**: Organize complex codebases into logical projects with automated repository mapping and remote sync capabilities.
- **👥 Team Collaboration**: Form elite dev teams, manage member access, and collaborate on project workspaces in real-time.
- **🔍 Context-Aware Search**: A premium, expandable search interface accessible globally via `/` or `CMD + K` (optimized for Dashboard, Projects, and Teams).

---

## 🛡️ The Security Vault

Security isn't a feature; it's our foundation. The platform is hardened with multiple layers of proactive protection.

- **🔐 Mandatory 2FA**: All user sessions are protected by mandatory Email OTP (One-Time Password) verification at login.
- **🔑 Secure OTP Reset**: Industry-grade password rotation flows mediated by secure, time-sensitive token verification.
- **🛡️ Role-Based Access (RBAC)**: Granular control with distinct Admin and Member tiers. Admins gain exclusive access to platform-wide statistics and management hubs.
- **✨ Security Hub**: A dedicated Profile management center for renaming, credential rotation, and session monitoring.

---

## 🛠️ Technology Stack

| Ecosystem | Technologies |
| :--- | :--- |
| **Frontend** | React (Vite), Tailwind CSS, Lucide Icons, Glassmorphism UX |
| **Backend** | Node.js, Express.js |
| **Persistence** | MongoDB Atlas (Mongoose ODM) |
| **AI Layer** | Groq AI (Llama 3.3-70b-versatile) |
| **Real-Time** | Socket.io (Analysis Progress & Collaborative Events) |
| **Security** | JWT, Email OTP, Bcrypt Hashing |

---

## 📦 Installation & Setup

### 1. Prerequisites
- **Node.js** (v18+)
- **MongoDB Atlas** account
- **Groq AI** API Key (for analysis engine)
- **SMTP Server** (Gmail or choice provider for OTP delivery)

### 2. Backend Environment Setup (`backend/.env`)
```env
PORT=5001
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_random_hash
GROQ_API_KEY=your_groq_api_token
EMAIL_USER=your_smtp_email
EMAIL_PASS=your_smtp_app_password
FRONTEND_URL=http://localhost:5173
```

### 3. Execution Launch
```bash
# Clone the repository
git clone https://github.com/subhajitb7/ai-code-review.git
cd ai-code-review

# Launch Backend
cd backend && npm install && npm run dev

# Launch Frontend (New Terminal)
cd frontend && npm install && npm run dev
```

---

### **Maintainer — SUBHAJIT BAG**
*Built with precision for the next generation of software analysis.*
