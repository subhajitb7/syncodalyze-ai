# AI Code Review — Automated Multi-Layered Intelligence

An AI-powered Code Review Platform built using the MERN stack. It assists developers by automatically reviewing code, detecting bugs, identifying vulnerabilities, and providing high-speed suggestions using advanced AI models.

## 🚀 Key Features

1.  **User Authentication System**: Secure registration, login, and JWT-based session management with role-based access (RBAC).
2.  **Email OTP Verification**: Mandatory verification via Nodemailer for account activation and secure 2FA logins.
3.  **User & Admin Management**: Distinct Admin and User dashboards with conditional UI for granular data control.
4.  **Project Management System**: Create, track, and manage complex coding projects with real-time status monitoring.
5.  **Team Collaboration System**: Form dev teams, manage member invites, and share project workspaces.
6.  **Code Analysis Monitoring**: Visual tracking of code health, syntax issues, and cross-file vulnerabilities.
7.  **Version Control System**: Automatic versioning (v1, v2, etc.) for every code modification with historical diff tracking.
8.  **Code Upload System**: Secure MERN-based upload protocols with local or AWS S3 cloud storage support.
9.  **AI Code Insight Detection**: Deep analysis of source code to detect logic errors, leaks, and security flaws.
10. **AI Coding Assistant**: Integrated Groq AI Chatbot (Llama 3.3-70b) for real-time debugging and refactoring tips.
11. **Notification & Alert System**: Instant system alerts for review completions, team invites, and security updates.
12. **Dashboard Analytics**: Rich data visualization using EvilCharts (Recharts) for performance and bug tracking.
13. **Git Repository Mapping**: Link remote GitHub/GitLab repositories with automated provider identification.
14. **Real-Time Monitoring System**: Socket.io powered live updates for AI analysis progress and collaborative events.
15. **Security Features**: Industry-standard Bcrypt hashing, JWT protection, and OTP-based verification layers.
16. **Cloud Deployment & Storage**: Scalable backend ready for AWS EC2 and binary storage on AWS S3.
17. **Project Structure**: Rigorous Git-based version control with a clean, structured MERN architecture.

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React (Vite), Tailwind CSS, Lucide Icons, Recharts |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB Atlas (Mongoose ODM) |
| **AI Integration** | Groq AI (Llama 3.3-70b-versatile) |
| **Real-Time** | Socket.io |
| **Cloud** | AWS EC2 (Hosting), AWS S3 (Storage) |

## 📐 System Architecture

### Frontend (React + Vite)
-   **Context API**: Global state management for Auth and Theme (Dark/Light).
-   **Monaco Editor**: High-performance code viewing and editing.
-   **Tailwind CSS**: Modern glassmorphic UI design.

### Backend (Node.js + Express)
-   **Security**: JWT and Bcrypt middleware.
-   **AI Controller**: Seamless bridge to the Groq Cloud API.
-   **Socket Handler**: Real-time progress broadcasting.

### Database (MongoDB Atlas)
-   **Schemas**: Optimized collections for Users, Projects, Reviews, and AI Logs.

## 📦 Installation & Setup

### Prerequisites
- Node.js (v18 or higher)
- MongoDB Atlas Account
- Groq AI API Key

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file and add your credentials:
   ```env
   PORT=5001
   MONGODB_URI=your_mongodb_uri
   JWT_SECRET=your_jwt_secret
   GROQ_API_KEY=your_groq_key
   EMAIL_USER=your_email
   EMAIL_PASS=your_email_password
   ```
4. Start the server:
   ```bash
   npm run dev
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

---

### **Team — SUBHAJIT BAG**
