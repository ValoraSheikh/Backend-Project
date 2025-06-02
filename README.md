# ⚡️ VideoTube Backend (Chai aur Backend Series)

A full-featured **video streaming backend** built with Node.js, Express, MongoDB, and JWT Auth. This project is the result of completing [@chaiwithcode](https://github.com/chaiaurcode)’s "Chai aur Backend" YouTube series, with added revisions and personal touches.

---

## 🚀 Features

- 🔐 **JWT Authentication** (access + refresh tokens)
- 🍪 **HTTP-Only Secure Cookies**
- 🔁 Token refresh flow
- 👤 User registration, login, logout, change password
- 📺 Video upload, delete, view count
- 🔔 Subscribe / unsubscribe channels
- 🧠 MongoDB Aggregations (watch history, channel profile, etc.)
- 📃 Custom error & response handlers
- 🧼 Clean, modular architecture

---

## 🛠️ Tech Stack

| Tech | Usage |
|------|-------|
| **Node.js** | Backend runtime |
| **Express.js** | Server framework |
| **MongoDB + Mongoose** | Database & ODM |
| **JWT** | Token-based auth |
| **bcryptjs** | Password hashing |
| **cookie-parser** | Cookie management |
| **dotenv** | Environment variable handling |
| **multer / Cloudinary (optional)** | File uploads |

---

## 🔐 Authentication Flow

- **Login**
  - Sends `accessToken` and `refreshToken` in HTTP-only cookies
- **Access Protected Routes**
  - Use `accessToken` via cookie or Authorization header
- **Refresh Tokens**
  - On access token expiry, client can use `refreshToken` to get a new one
- **Logout**
  - Tokens are cleared from cookies, refresh token is removed from DB

---

## 📁 Project Structure

Project Structure

backend/
controllers/
auth.controller.js
user.controller.js
video.controller.js


models/
user.models.js
video.models.js
subscription.models.js


middlewares/
auth.middleware.js
error.middleware.js
multer.middleware.js


routes/
auth.routes.js
user.routes.js
video.routes.js


utils/
ApiError.js
ApiResponse.js
asyncHandler.js
cloudinary.js


.env
server.js
README.md






---

## ⚙️ Environment Variables

Create a `.env` file in the root:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/videotube
ACCESS_TOKEN_SECRET=yourAccessSecret
REFRESH_TOKEN_SECRET=yourRefreshSecret
CLOUDINARY_API_KEY=xxx (if used)
```


## 🧪 API Endpoints

### 🔐 Auth

| Method | Route                     | Description                  |
|--------|---------------------------|------------------------------|
| `POST` | `/api/auth/register`      | Register a new user          |
| `POST` | `/api/auth/login`         | Login and receive tokens     |
| `POST` | `/api/auth/logout`        | Logout (clear cookies)       |
| `GET`  | `/api/auth/refresh-token` | Refresh access token         |
| `POST` | `/api/auth/change-password` | Change current password    |

### 👤 User

| Method | Route                     | Description                         |
|--------|---------------------------|-------------------------------------|
| `GET`  | `/api/users/history`      | Retrieve watch history for current user |
| `GET`  | `/api/users/c/:username`  | Get channel profile by username     |
| `GET`  | `/api/users/me`           | Get current logged-in user’s info   |

