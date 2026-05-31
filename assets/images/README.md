# JPTS Institute - Computerized Grade Evaluation System

A complete, production-ready academic result management web application that automates student result processing, GPA/CGPA computation, transcript generation, and academic record management.

## 📋 Table of Contents
- [System Overview](#system-overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Installation Guide](#installation-guide)
- [Firebase Setup](#firebase-setup)
- [Database Structure](#database-structure)
- [Grading System](#grading-system)
- [User Roles](#user-roles)
- [Usage Guide](#usage-guide)
- [Troubleshooting](#troubleshooting)
- [Deployment](#deployment)
- [Support](#support)

## System Overview

The Computerized Grade Evaluation System eliminates traditional manual grading limitations including:
- Calculation errors
- Delayed result processing  
- Poor record management
- Unauthorized result modification
- Loss of student records
- Difficulty generating academic reports

## Features

### Core Functionality
- ✅ **Automated Grade Computation** - Instant grade calculation based on institutional grading system
- ✅ **GPA/CGPA Calculation** - Automatic semester and cumulative GPA calculation  
- ✅ **Transcript Generation** - PDF transcript generation with QR verification
- ✅ **Result Management** - Single and bulk result entry with approval workflow
- ✅ **Student Management** - Complete student profile management
- ✅ **Course Management** - Course creation with credit unit allocation
- ✅ **Analytics Dashboard** - Real-time performance metrics and charts

### User Roles & Access
| Role | Access Level |
|------|--------------|
| Administrator | Full system access, user management, analytics |
| Lecturer | Upload scores, manage assigned courses |
| Student | View results, download transcripts, track GPA |
| Examination Officer | Review and approve results |

### Security Features
- Firebase Authentication with email verification
- Role-Based Access Control (RBAC)
- Firestore Security Rules
- Audit logging for all actions
- Session management with auto-logout

## Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | HTML5, CSS3, Bootstrap 5, JavaScript ES6+ |
| Backend | Firebase Authentication, Firebase Firestore |
| Libraries | Chart.js, html2pdf.js, jQuery, DataTables |
| Hosting | Firebase Hosting (recommended) |

## Installation Guide

### Prerequisites
- A Firebase account (free tier works)
- Web browser (Chrome/Firefox/Edge)
- Text editor (VS Code recommended)

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **Create Project**
3. Name it `JPTS Grade System`
4. Click **Continue** (disable Google Analytics if not needed)
5. Click **Create Project**

### Step 2: Register Web Application

1. In Firebase Console, click the web icon `</>`
2. Register app name: `JPTS System`
3. Copy the **firebaseConfig** object - you'll need this!
4. Click **Continue to console**

### Step 3: Enable Authentication

1. Left menu: **Authentication** → **Get Started**
2. **Sign-in methods** tab → Enable **Email/Password**
3. Toggle ON → Click **Save**

### Step 4: Create Firestore Database

1. Left menu: **Firestore Database** → **Create Database**
2. Select **Start in test mode**
3. Choose your region (e.g., `us-central1` or `europe-west1`)
4. Click **Create**

### Step 5: Configure Firebase in Project

Open `js/firebase-config.js` and replace with your copied config:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};