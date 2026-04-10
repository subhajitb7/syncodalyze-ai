# Syncodalyze AI — The Specialized Synchronization Platform

<p align="center">
  <img src="https://raw.githubusercontent.com/lucide-react/lucide/main/icons/sparkles.svg" width="60" height="60" alt="Syncodalyze Logo" />
</p>

**Syncodalyze AI** is a high-performance, premium ecosystem designed to synchronize AI-powered code intelligence with real-time team collaboration. Built with a specialized, decoupled architecture on the MERN stack, the platform provides a professional "Command Center" for modern development teams.

---

## ⚡ The Intelligence Engine

Our core analysis hub provides more than just linting; it delivers autonomous, multi-layered intelligence for your code.

- **🚀 Smart Language Badge**: Instantly identifies over **20+ tech stacks** (Rust, Go, Python, Swift, etc.) via file extensions and AI-powered content analysis.
- **✨ Context-Aware Parsing**: Intelligent logic that automatically strips brand headers and metadata from AI feedback for a clean, professional UI presentation.
- **📈 Historical Versioning**: Every review is versioned (v1, v2, etc.), allowing teams to track code improvements and AI feedback cycles over time.
- **🧩 Monaco-Powered Editor**: A high-performance coding environment with full syntax highlighting and responsive styling.

---

## 👥 The Specialized Collaboration Hub

We have implemented a specialized, context-aware messaging architecture that separates technical documentation from team coordination.

- **📬 Decoupled Messaging**: An isolated system where **Project Comments** serve as technical documentation, while the **Team Chat** handles high-speed collaboration.
- **🎙️ Voice-to-Text Interface**: Real-time microphone integration in Team Chat with instant transcription for hands-free developer coordination.
- **💬 Professional Messaging UI**: High-fidelity, bubble-based chat system with dynamic alignment (Self: Right/Primary, Others: Left/Glass-Translucent).
- **🔄 Real-Time Synchronization**: Powered by Socket.io, enabling instant communication and live analysis progress across the entire team.

---

## 🛡️ The Security Vault

Security is the foundation of **Syncodalyze AI**. The platform is hardened with multiple layers of proactive protection.

- **🔐 Mandatory 2FA**: All user sessions are protected by mandatory Email OTP (One-Time Password) verification at login.
- **🛡️ Role-Based Access (RBAC)**: Granular control with distinct Admin and Member tiers for secure team and project management.
- **🔑 Secure Session Management**: Industry-grade password rotation and credential monitoring via the dedicated Security Hub.

---

## 🛠️ Technology Stack

| Ecosystem | Technologies |
| :--- | :--- |
| **Frontend** | React (Vite), Tailwind CSS, Socket.io-client, Lucide Icons |
| **Backend** | Node.js, Express.js, Socket.io |
| **Persistence** | MongoDB Atlas (Mongoose ODM) |
| **AI Layer** | Groq AI (Llama 3.3-70b-versatile) |
| **Real-Time** | Specialized Message Model & Socket Events |

---

## 📦 Installation & Setup

### 1. Prerequisites
- **Node.js** (v18+)
- **MongoDB Atlas** account
- **Groq AI** API Key
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
git clone https://github.com/subhajitb7/syncodalyze-ai.git
cd syncodalyze-ai

# Launch Backend
cd backend && npm install && npm run dev

# Launch Frontend
cd frontend && npm install && npm run dev
```

---

### **Maintainer — SUBHAJIT BAG**
*Built with precision for the next generation of software synchronization.*
