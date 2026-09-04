# 🌿 AyurSutra – Therapy Scheduling System

AyurSutra is a web-based **Therapy Scheduling and Management System** designed to simplify and automate the scheduling of Ayurvedic therapies, particularly **Panchakarma treatments**.

The system helps administrators and therapists manage patients, therapies, schedules, appointments, and treatment progress through a centralized platform.

---

## 📌 Problem Statement

Traditional therapy scheduling can involve manual registers, phone calls, spreadsheets, and repeated coordination between patients and therapists.

This can lead to:

- Double booking of therapists
- Scheduling conflicts
- Difficulty tracking patient therapy sessions
- Manual record maintenance
- Delays in updating schedules
- Difficulty monitoring treatment progress

AyurSutra aims to solve these problems by providing a **centralized digital therapy scheduling system**.

---

## 🎯 Objectives

The main objectives of the project are:

- Automate therapy scheduling
- Reduce scheduling conflicts
- Manage patient information digitally
- Manage therapists and their availability
- Track therapy sessions
- Provide an organized appointment management system
- Improve efficiency of Ayurvedic therapy centers
- Provide a user-friendly interface for managing operations

---

## ✨ Features

### 👤 Patient Management
- Add and manage patient information
- View patient details
- Maintain patient therapy history
- Track assigned therapies

### 🩺 Therapy Management
- Create and manage different therapies
- Assign therapies to patients
- Define therapy duration
- Track therapy sessions

### 📅 Therapy Scheduling
- Schedule therapy sessions
- Manage therapist availability
- Prevent scheduling conflicts
- View upcoming sessions
- Update or cancel scheduled sessions

### 👨‍⚕️ Therapist Management
- Manage therapist information
- Assign therapists to therapy sessions
- Track therapist schedules
- Avoid overlapping appointments

### 📊 Dashboard
- View important system information
- Monitor scheduled therapies
- Track patients and therapists
- Display scheduling information in an organized manner

### 🔔 Notifications
- Notify users about upcoming therapy sessions
- Provide important scheduling updates

---

## 🛠️ Tech Stack

### Frontend
- React.js
- HTML5
- CSS3
- JavaScript
- Bootstrap / Material UI
- Chart.js

### Backend
- Node.js
- Express.js

### Database
- MongoDB

### Authentication
- JWT / Passport.js

### APIs & Services
- REST APIs
- Cloudinary
- Mapbox
- Twilio (if enabled)

### Development Tools
- Git
- GitHub
- VS Code
- Postman

---

## 🏗️ Project Architecture

```text
Therapy-Scheduling-System
│
├── backend
│   ├── models
│   ├── routes
│   ├── controllers
│   ├── middleware
│   ├── utils
│   ├── app.js
│   └── package.json
│
├── frontend
│   ├── src
│   │   ├── components
│   │   ├── pages
│   │   ├── services
│   │   ├── context
│   │   └── App.jsx
│   │
│   ├── public
│   └── package.json
│
├── README.md
└── package-lock.json
