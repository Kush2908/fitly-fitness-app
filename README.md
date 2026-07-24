# 🏋️ Fitly – Full-Stack Fitness Tracking Application

Fitly is a modern full-stack fitness tracking application inspired by platforms like Google Fit and Cult Fitness. It enables users to monitor workouts, nutrition, daily health metrics, and fitness goals through an intuitive and responsive interface.

This project was developed to demonstrate full-stack development skills, including frontend development, backend API design, database management, and user authentication.

---

## 🚀 Features

### 🔐 User Authentication

* Secure user registration
* Login and logout functionality
* Session-based authentication

### 💪 Workout Tracking

* Log daily workouts
* View workout history
* Track exercise progress over time

### 🥗 Nutrition Tracking

* Record meals and calorie intake
* Monitor protein, carbohydrates, and fats
* Daily nutrition summaries

### 📊 Daily Activity Tracking

* Steps tracking
* Water intake tracking
* Sleep monitoring
* Calorie tracking

### 🎯 Goal Management

* Set personalized fitness goals
* Monitor progress
* Daily streak tracking
* Coach Score dashboard
* Personalized training plans

### 💾 Database

* Persistent data storage using SQLite
* Automatic database creation on first launch

---

## 🛠️ Tech Stack

| Category        | Technologies                   |
| --------------- | ------------------------------ |
| Frontend        | React, JavaScript, HTML5, CSS3 |
| Backend         | Python                         |
| Database        | SQLite                         |
| API             | Python HTTP Server             |
| Version Control | Git & GitHub                   |

---

## 📂 Project Structure

```text
fitly-fitness-app/
│
├── server.py                 # Backend API and web server
├── fitness.db                # SQLite database
├── build-frontend.js         # Frontend build script
├── run-fitly.bat             # Windows launcher
├── run-fitly.ps1             # PowerShell launcher
│
├── web/
│   ├── index.html            # Main HTML page
│   ├── app.js                # React source code
│   ├── app.compiled.js       # Compiled React application
│   └── styles.css            # Application styling
│
└── README.md
```

---

## ⚙️ Installation

### 1. Clone the Repository

```bash
git clone https://github.com/Kush2908/fitly-fitness-app.git
cd fitly-fitness-app
```

### 2. Start the Application

Run the backend server:

```powershell
python server.py
```

Or simply launch:

```powershell
.\run-fitly.ps1
```

or double-click:

```text
run-fitly.bat
```

### 3. Open the Application

Visit:

```text
http://127.0.0.1:8000
```

---

## 🔨 Frontend Development

After making changes to:

```text
web/app.js
```

Rebuild the frontend using:

```powershell
node build-frontend.js
```

The application serves:

```text
web/app.compiled.js
```

---

## 📸 Application Screenshots

> Add screenshots of the following pages for a better GitHub presentation.

* Login Page
* Registration Page
* Dashboard
* Workout Tracker
* Nutrition Tracker
* Goals Dashboard
* Daily Activity Tracker
* Training Plans

---

## 🎯 Future Enhancements

* AI-powered workout recommendations
* Cloud database integration
* Mobile application
* Wearable device synchronization
* Dark mode
* Progress charts and analytics
* Social fitness challenges

---

## 👨‍💻 About the Project

Fitly was built as a personal portfolio project to strengthen full-stack development skills by combining frontend development, backend API implementation, database management, and responsive UI design into a complete fitness tracking solution.

---

## 📜 License

This project is created for educational and portfolio purposes.

---

## 👤 Author

**Kush Sharma**

* GitHub: https://github.com/Kush2908
* LinkedIn: *(www.linkedin.com/in/kush-sharma-a12568370)*
