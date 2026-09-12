<div align="center">
  <img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/scale.svg" width="80" alt="MetroGuard AI Logo" style="filter: invert(40%) sepia(85%) saturate(1478%) hue-rotate(200deg) brightness(97%) contrast(92%); margin-bottom: 10px;" />
  <h1 style="margin: 0;">MetroGuard AI</h1>
  <p><strong>SIH 26034 &mdash; Legal Metrology (Packaged Commodities) Compliance AI</strong></p>

  <p>
    <a href="https://reactjs.org/"><img src="https://img.shields.io/badge/React-18-blue?style=for-the-badge&logo=react" alt="React" /></a>
    <a href="https://spring.io/projects/spring-boot"><img src="https://img.shields.io/badge/Spring_Boot-3.1-6DB33F?style=for-the-badge&logo=spring" alt="Spring Boot" /></a>
    <a href="https://fastapi.tiangolo.com/"><img src="https://img.shields.io/badge/FastAPI-0.104-009688?style=for-the-badge&logo=fastapi" alt="FastAPI" /></a>
    <a href="https://deepmind.google/technologies/gemini/"><img src="https://img.shields.io/badge/Gemini-AI-8E75B2?style=for-the-badge&logo=google" alt="Gemini AI" /></a>
    <a href="https://www.postgresql.org/"><img src="https://img.shields.io/badge/PostgreSQL-Neon-336791?style=for-the-badge&logo=postgresql" alt="PostgreSQL" /></a>
    <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css" alt="Tailwind" /></a>
  </p>
  
  <p><em>An intelligent, vision-based enforcement tool for the Ministry of Consumer Affairs to automatically assess packaged commodity labels for compliance with the LMPC Rules, 2011.</em></p>
</div>

<br />

## 🎯 The Problem
Packaged commodities are required by law (Legal Metrology Act, 2009 & LMPC Rules, 2011) to bear mandatory declarations (MRP, Net Quantity, Manufacturer details, etc.). Due to the massive volume of goods in Indian markets, manual inspection is extremely time-consuming and resource-intensive, leading to undetected violations such as missing declarations or improper formatting.

## 💡 Our Solution: MetroGuard AI
We built a tri-service software architecture that leverages state-of-the-art vision-language models to **automatically detect, extract, and validate** mandatory declarations on packaged goods. It calculates dynamic compliance scores, highlights violations, and routes ambiguous labels to a human-in-the-loop Review Queue for Enforcement Officers.

---

## ⭐ Key Features

- 🔍 **AI-Powered OCR Label Analysis:** Uses Google Gemini (with an automated fallback chain `3.5-flash` → `3-flash-preview` → `2.5-flash`) to contextually extract label text, even on curved or distorted packages.
- 🛡️ **Automated Compliance Engine:** Evaluates extracted fields directly against the strict statutory logic of the **LMPC Rules, 2011**, identifying violations instantly.
- 🔐 **3-Tier Role-Based Access Control (RBAC):**
  - **Viewer (Consumers):** Scan products, view personal scan history.
  - **Enforcement Officer:** Access the Review Queue, approve/reject flags, view district-wide analytics.
  - **System Admin:** Manage user accounts, suspend users, monitor system health.
- 📊 **Real-time Analytics Dashboard:** Beautiful, interactive Recharts-powered dashboard for officers to monitor compliance trends and violation severities.
- 📄 **Dynamic Report Generation:** Instantly generates official compliance inspection certificates in **PDF** and **DOCX** formats with exact rule citations.
- 🤖 **Vectorless RAG Chatbot:** A globally docked AI assistant grounded entirely on the original LMPC 2011 law PDF, ready to answer complex statutory queries.

---

## 🏗️ Architecture & Tech Stack

<div align="center">
  <img src="./architecture.drawio.png" alt="System Architecture Diagram" width="800" />
</div>
<br />

This repository is structured as a unified monorepo containing three microservices:

| Component | Technology | Description | Port |
| :--- | :--- | :--- | :--- |
| **Frontend** | React 18, Vite, TypeScript, TailwindCSS, Framer Motion | Sleek, responsive, animated SPA. | `5173` |
| **Backend** | Java 26, Spring Boot 4.1.1, Spring Security, Hibernate | Robust REST API, JWT auth, database operations. | `8080` |
| **OCR Service** | Python 3.13, FastAPI, `google-genai` SDK, OpenCV | AI processing, image enhancement, compliance logic. | `8000` |
| **Database** | PostgreSQL (Neon Cloud) | Highly relational schema with cascading constraints. | `5432` |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18+)
- **Java JDK 26**
- **Python 3.13**
- **Maven** (`mvnw` wrapper included)

### 1. Database Setup
The system is configured to connect to a Neon Cloud PostgreSQL instance. Provide your credentials in the backend `.env` file:
```ini
# backend/.env
SPRING_DATASOURCE_URL=jdbc:postgresql://<your-neon-host>/<db>?sslmode=require
SPRING_DATASOURCE_USERNAME=your_username
SPRING_DATASOURCE_PASSWORD=your_password
```

### 2. Run the Python OCR Service
```bash
cd ocr-service
# Activate your virtual environment and install requirements
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

### 3. Run the Spring Boot Backend
```bash
cd backend
# Set your JAVA_HOME if necessary
./mvnw spring-boot:run
```

### 4. Run the React Frontend
```bash
cd frontend
npm install
npm run dev
```
Navigate to `http://localhost:5173` in your browser.

---

## 🔑 Demo Credentials
To explore the role-based functionality, you can log in using these pre-seeded accounts:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@metroguard.gov.in` | `Admin@2026` |
| **Enforcement Officer** | `officer@metroguard.gov.in` | `Officer@2026` |
| **Normal User** | `user@metroguard.gov.in` | `User@2026` |

*(Note: The login page also features quick-fill buttons for demo purposes).*

---

## 📚 Documentation
- Check out the `database/` directory for the raw DDL schema and seeded compliance constraints.

<div align="center">
  <p>Built for the <strong>Smart India Hackathon (SIH)</strong></p>
</div>
