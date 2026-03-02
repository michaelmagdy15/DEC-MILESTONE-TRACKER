# DEC Milestone Tracker - Comprehensive System Guide

## Table of Contents
1. [Introduction](#1-introduction)
2. [System Architecture](#2-system-architecture)
3. [User Roles and Permissions](#3-user-roles-and-permissions)
4. [Core Features](#4-core-features)
   - [Dashboard](#dashboard)
   - [Project Management](#project-management)
   - [Time & Work Logging](#time--work-logging)
   - [Financial Management](#financial-management)
   - [Team & HR Management](#team--hr-management)
   - [Communication & Meetings](#communication--meetings)
   - [Reporting](#reporting)
5. [Client Portal](#5-client-portal)
6. [Desktop Companion App](#6-desktop-companion-app)
7. [Technical Stack & Setup](#7-technical-stack--setup)

---

## 1. Introduction

The **DEC Milestone Tracker** is a comprehensive internal management system engineered for DEC Engineering Consultant. It streamlines project management, financial tracking, timesheet logging, team collaboration, and client communication into a single, cohesive platform. 

The system enables management to have a bird's-eye view of all operations across the Abu Dhabi and Cairo branches, while giving engineers the tools they need to track tasks, log hours, and collaborate effectively.

---

## 2. System Architecture

The tracker is built as a modern web application paired with a desktop companion tool:

- **Frontend Application:** A React-based Single Page Application (SPA) providing a fast, responsive user interface.
- **Backend Infrastructure:** Powered by **Supabase**, handling secure authentication, real-time database updates, and file storage.
- **Security & Authorization:** Row Level Security (RLS) is extensively used on the database to ensure users only access data permitted by their assigned role.
- **Desktop Companion App:** An optional desktop utility that tracks application usage (active windows) to provide automated time-tracking capabilities.

---

## 3. User Roles and Permissions

The system operates strictly on a Role-Based Access Control (RBAC) model. There are three primary roles:

### 👑 Administrator (`admin`)
- **Access Level:** Unrestricted.
- **Capabilities:**
  - View financial data, office expenses, and generate invoices.
  - Manage engineer profiles, hourly rates, and system access.
  - View all advanced managerial dashboards and compliance reports.
  - Full CRUD (Create, Read, Update, Delete) rights on all system entities.

### 👷 Engineer/Employee (`engineer`)
- **Access Level:** Restricted to operational modules.
- **Capabilities:**
  - View assigned projects and tasks.
  - Log daily work entries, software used, and time spent.
  - Request leaves and log daily attendance (check-in/check-out).
  - Interact with project milestones and documentation.
  - *Restricted from:* Financial data, other engineers' private data, and administrative reports.

### 🤝 Client (`client`)
- **Access Level:** Highly restricted (Client Portal only).
- **Capabilities:**
  - Access the dedicated **Client Dashboard**.
  - Track the progress of their specific projects and milestones.
  - View approved deliverables and milestone statuses.
  - *Restricted from:* Internal work logs, internal financial data, and other clients' projects.

---

## 4. Core Features

### Dashboard
The central hub for all users. 
- **Admins** see high-level statistics: active projects, pending tasks, recent activities, team attendance status, and financial summaries.
- **Engineers** see their specific pending tasks, recent notifications, quick-actions to log time, and their weekly hour goals.

### Project Management
- **Projects & Milestones:** Track project phases (e.g., Concept, Schematic, Construction Documents). Each project is broken down into milestones with percentage completions.
- **Task Management:** Kanban-style task tracking (Todo, In Progress, Done) with priority levels (Low, Medium, High, Critical). Can flag tasks as RFIs or Revisions.
- **Document Storage:** Securely upload, store, and share project files (PDF, DWF).

### Time & Work Logging
- **Work Entries:** Engineers submit daily logs detailing the tasks completed, software used (e.g., AutoCAD, Revit), and time spent.
- **App Usage Tracking:** Integrated with the desktop app to log active window durations, helping automate accurate timesheets.
- **Session Tracking:** Native clock-in and clock-out functionality.

### Financial Management
*Admin strictly.*
- **Project Budgets & Costs:** Track project budgets vs. actual spending (calculated via team hourly rates × time spent).
- **Office Expenses:** Manage overhead costs separately for Abu Dhabi and Cairo locations (Rent, Utilities, Software, etc.).
- **Invoicing:** Generate automated PDF invoices based on completed milestones or logged hours.

### Team & HR Management
- **Directory:** Manage employee details, roles, skills, branch locations (Abu Dhabi/Cairo).
- **Attendance & Leaves:** 
  - Track everyday presence (Present, Absent, Half-Day).
  - Engineers can submit Leave Requests; Admins can approve/reject them.

### Communication & Meetings
- **Zoho Mail Integration:** View and send emails directly within the system via OAuth integration.
- **Meeting Scheduler:** Plan online or in-house meetings, generate meeting links or specify locations, and notify attendees.

### Reporting
- **Data Export:** Generate comprehensive reports in **PDF** or **Excel** formats.
- **Audit Logs:** The system maintains an immutable audit log of all crucial actions (Created, Updated, Deleted) to ensure accountability.

---

## 5. Client Portal

When a user logs in with the `client` role, they bypass the internal system and are securely routed to the **Client Dashboard**. 

- Represents transparency with the client.
- Displays visual progress bars for their projects.
- Grants read-only access to specific project files or milestones that have been marked as client-ready.

---

## 6. Desktop Companion App

To ensure accurate billing and productivity tracking, DEC integrates a native desktop application. 
- Runs quietly in the background on Windows machines.
- Logs active software windows (e.g., detecting when 'Autodesk Revit' is active).
- Syncs directly to the `app_usage_logs` table via Supabase securely.
- Allows the system to cross-reference manual time logs with actual software usage time.

---

## 7. Technical Stack & Setup

For IT & Developers managing the system:

- **Frontend:** React 19, TypeScript, Vite, TailwindCSS.
- **State Management:** React Context (`DataContext`, `AuthContext`).
- **Icons & UI:** Lucide React, Framer Motion (animations), Recharts (data visualization).
- **Report Generation:** `jspdf`, `jspdf-autotable`, `exceljs`.
- **Backend Services:** Supabase (PostgreSQL, GoTrue Auth, Storage).
- **Commands:**
  - `npm run dev`: Starts local development server.
  - `npm run build`: Compiles TypeScript and builds for production.

---
*Generated for DEC Engineering Consultant.* 
*This document can be printed or exported directly to PDF using your browser's print functionality (Ctrl+P / Cmd+P -> Save as PDF).*
