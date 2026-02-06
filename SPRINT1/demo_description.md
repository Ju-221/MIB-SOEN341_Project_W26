# Sprint 1 Demo – MealMajor

**Date:** February 6, 2026

## What We're Demonstrating

User authentication with React frontend and ASP.NET Core backend using SQLite database.

## Demo Flow

### 1. Sign Up
- Open the app and go to the Sign Up page
- Enter email and password
- Submit and show successful registration
- Show error when using duplicate email

### 2. Login
- Go to Login page
- Enter credentials from new account
- Submit and show successful login
- Show error with wrong password

## Data Flow

### Sign Up (`POST /auth/signup`)
1. User enters email + password in React form
2. Frontend sends POST request to `/auth/signup`
3. Backend validates input and checks for duplicate email
4. Password is hashed with SHA256
5. User record saved to SQLite database
6. JWT token generated and returned to frontend

### Login (`POST /auth/login`)
1. User enters credentials in React form
2. Frontend sends POST request to `/auth/login`
3. Backend looks up user by email in database
4. Password hash is compared securely
5. If valid, JWT token returned to frontend

## Tech Stack
- **Frontend:** React
- **Backend:** ASP.NET Core
- **Database:** SQLite
- **Auth:** JWT tokens
- **Hashing:** SHA256
