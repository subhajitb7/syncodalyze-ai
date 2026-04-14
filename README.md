# Syncodalyze AI — Sovereign Engineering Command Center

<p align="center">
  <img src="frontend/public/logo.svg" width="120" alt="Syncodalyze Logo" />
</p>

**Syncodalyze AI** is an elite, high-fidelity AI code auditing and workspace collaboration platform engineered for modern technical teams. Built with a deeply custom **Sovereign V2 "Command Center"** design language, it bridges the gap between ultra-low-latency AI static analysis and real-time multiplayer code repositories. 

It completely automates structural reviews, enforces robust security matrices, and orchestrates live project feedback within a secure, multi-tenant ecosystem.

---

## 🔥 Key Technical Capabilities

### 1. Ultra-Low-Latency AI Core (Groq + Llama 3)
- **Zero-Shot Vulnerability Mapping**: Leverages the power of `llama-3.3-70b-versatile` to instantly scan files for deep architectural flaws, syntax errors, and security anti-patterns.
- **Automated Scorecards**: AI mathematically ranks the Health Score, Risk Factor, and Maintainability of your repositories, reducing manual code-review overhead by ~60%.
- **Contextual Persistence**: Full Deep Trace Telemetry logs exactly what prompts were passed, token consumption, and response delays to guarantee AI accountability.

### 2. Multi-Provider Git-Sync Engine
- **Automated Recursive Indexing**: Feed the engine a GitHub or GitLab repository URL, and Syncodalyze will securely traverse your default branch, filter dependency bloat (e.g., `node_modules`), and map all operational code into its internal Virtual File System.
- **Version Control Mapping**: Instantly track iterations of scanned scripts with native rollback capabilities tied to every AI review.

### 3. Contextual Role-Based Access Control (RBAC)
- **Multi-Tenant Workspaces**: An enterprise-grade hierarchy that enforces security at the socket level.
- **3-Tier Permission Matrix**: 
   - 👑 **Owner**: Root control over the workspace, capable of global purges and repository deletion.
   - 🛡️ **Admin**: Operational supervisors authorized to manage team members and lock environments.
   - ⚙️ **Operator (Member)**: Standard engineers running AI queries, uploading code, and collaborating via WebSockets.
- **Master Admin Override**: Environment-variable-secured `MASTER_ADMIN_EMAIL` ensuring ultimate system sovereignty over all child organizations.

### 4. Real-Time Multiplayer Telemetry (Socket.io)
- **Live Pulse Feeds**: See code reviews and analysis status changes happening instantly across your team without page refreshes.
- **Context Rooms**: Dive into a specific file version and see live, real-time presence indicators when other engineers are auditing the same logic block.

### 5. Sovereign V2 Aesthetic Architecture
- **Command Center Design**: A radical departure from standard "SaaS White" dashboards. Syncodalyze is built with extremely dark themes, heavy glassmorphism (`backdrop-blur-3xl`), and precise micro-animations powered by **Framer Motion**.
- **Dynamic Data Vis**: Integrates **Recharts** to plot Code Health radars, Uptime metrics, and Performance area charts right on the user's dashboard.

---

## 🛠️ Technology Stack

| Layer | Technology | Function |
| :--- | :--- | :--- |
| **Frontend Runtime** | React 18 + Vite | Lightning-fast HMR and optimized production bundles |
| **Styling & UI** | Tailwind CSS + Framer Motion | High-performance CSS rendering & layout animations |
| **Visualization** | Recharts + Lucide Icons | Complex data graphing and scalable vector UI |
| **Backend API** | Node.js + Express.js | Highly-concurrent, event-driven REST architecture |
| **Database** | MongoDB Atlas (Mongoose) | Scalable Document Storage for complex repo trees |
| **Real-Time Engine** | Socket.io | Persistent WebSocket connections for live collaboration |
| **AI Inference** | Groq API | Sub-second Llama 3 generation for instant scanning |

---

## 📦 Local Deployment Node

### 1. Environment Preparation
Ensure you have **Node.js (v18+)**, a **MongoDB Atlas** connection string, and a valid **Groq API key**.

### 2. Configure the Command Center (`backend/.env`)
```env
# CORE SERVER SETTINGS
PORT=5007
MONGODB_URI=your_secure_mongo_uri
JWT_SECRET=your_high_entropy_secret_key

# AI & GOVERNANCE PIPELINES
GROQ_API_KEY=your_groq_api_token
MASTER_ADMIN_EMAIL=your_primary_admin_email

# SMTP COMMUNICATION (OTP & Alerts)
EMAIL_USER=your_smtp_email
EMAIL_PASS=your_smtp_app_password
FRONTEND_URL=http://localhost:5173
```

### 3. Rapid Boot Sequence
```bash
# Pull down the repository
git clone https://github.com/subhajitb7/syncodalyze-ai.git
cd syncodalyze-ai

# Initialize the Backend Engine
cd backend 
npm install 
npm run dev

# Initialize the Frontend Interface (In a new terminal)
cd frontend
npm install 
npm run dev
```

---

<p align="center">
  <b>Developed by SUBHAJIT BAG</b><br/>
  <i>Engineered for the next generation of precise, AI-accelerated code sovereignty.</i>
</p>
