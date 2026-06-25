import hashlib
import json
import secrets
import sqlite3
from datetime import date, datetime, timedelta
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).parent
WEB_ROOT = ROOT / "web"
DB_PATH = ROOT / "fitness.db"


def json_response(handler, payload, status=HTTPStatus.OK):
    body = json.dumps(payload).encode("utf-8")
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json; charset=utf-8")
    handler.send_header("Content-Length", str(len(body)))
    handler.end_headers()
    handler.wfile.write(body)


def read_json(handler):
    length = int(handler.headers.get("Content-Length", "0"))
    raw = handler.rfile.read(length) if length else b"{}"
    return json.loads(raw.decode("utf-8") or "{}")


def connect_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def hash_password(password, salt=None):
    salt = salt or secrets.token_hex(16)
    digest = hashlib.sha256(f"{salt}:{password}".encode("utf-8")).hexdigest()
    return f"{salt}${digest}"


def verify_password(password, stored):
    salt, _ = stored.split("$", 1)
    return hash_password(password, salt) == stored


def estimate_steps(workout_type, minutes, intensity="Moderate"):
    steps_per_minute = {
        "Running": 165,
        "Walking": 110,
        "Cardio": 135,
        "Sports": 125,
        "Strength": 55,
        "Yoga": 35,
        "Mobility": 25,
    }
    intensity_multiplier = {
        "Low": 0.85,
        "Moderate": 1,
        "High": 1.15,
    }
    base_rate = steps_per_minute.get(workout_type, 70)
    multiplier = intensity_multiplier.get(intensity, 1)
    return max(round(int(minutes) * base_rate * multiplier), 0)


def calculate_calories(protein, carbs, fats):
    return max(round(int(protein) * 4 + int(carbs) * 4 + int(fats) * 9), 0)


def number_or_zero(value):
    try:
        if value in ("", None):
            return 0
        return float(value)
    except (TypeError, ValueError):
        return 0


def get_user_from_token(handler):
    auth = handler.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        return None

    token = auth.split(" ", 1)[1]
    with connect_db() as conn:
        row = conn.execute(
            """
            SELECT users.id, users.name, users.email
            FROM sessions
            JOIN users ON users.id = sessions.user_id
            WHERE sessions.token = ?
            """,
            (token,),
        ).fetchone()
        return dict(row) if row else None


def init_db():
    with connect_db() as conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS sessions (
                token TEXT PRIMARY KEY,
                user_id INTEGER NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY(user_id) REFERENCES users(id)
            );

            CREATE TABLE IF NOT EXISTS habits (
                user_id INTEGER NOT NULL,
                entry_date TEXT NOT NULL,
                steps INTEGER NOT NULL DEFAULT 0,
                water_glasses INTEGER NOT NULL DEFAULT 0,
                sleep_hours REAL NOT NULL DEFAULT 0,
                move_calories INTEGER NOT NULL DEFAULT 0,
                mood TEXT NOT NULL DEFAULT 'Focused',
                PRIMARY KEY(user_id, entry_date),
                FOREIGN KEY(user_id) REFERENCES users(id)
            );

            CREATE TABLE IF NOT EXISTS workouts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                workout_type TEXT NOT NULL,
                minutes INTEGER NOT NULL,
                calories INTEGER NOT NULL,
                estimated_steps INTEGER NOT NULL DEFAULT 0,
                intensity TEXT NOT NULL,
                workout_date TEXT NOT NULL,
                notes TEXT NOT NULL DEFAULT '',
                FOREIGN KEY(user_id) REFERENCES users(id)
            );

            CREATE TABLE IF NOT EXISTS meals (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                protein INTEGER NOT NULL,
                carbs INTEGER NOT NULL,
                fats INTEGER NOT NULL,
                calories INTEGER NOT NULL,
                meal_date TEXT NOT NULL,
                FOREIGN KEY(user_id) REFERENCES users(id)
            );

            CREATE TABLE IF NOT EXISTS goals (
                user_id INTEGER PRIMARY KEY,
                move_goal INTEGER NOT NULL DEFAULT 650,
                water_goal REAL NOT NULL DEFAULT 3.0,
                step_goal INTEGER NOT NULL DEFAULT 10000,
                workout_goal INTEGER NOT NULL DEFAULT 5,
                FOREIGN KEY(user_id) REFERENCES users(id)
            );

            CREATE TABLE IF NOT EXISTS program_progress (
                user_id INTEGER NOT NULL,
                program_title TEXT NOT NULL,
                completed_sessions INTEGER NOT NULL DEFAULT 0,
                updated_at TEXT NOT NULL,
                PRIMARY KEY(user_id, program_title),
                FOREIGN KEY(user_id) REFERENCES users(id)
            );

            CREATE TABLE IF NOT EXISTS body_metrics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                entry_date TEXT NOT NULL,
                weight REAL NOT NULL,
                body_fat REAL NOT NULL DEFAULT 0,
                waist REAL NOT NULL DEFAULT 0,
                chest REAL NOT NULL DEFAULT 0,
                arms REAL NOT NULL DEFAULT 0,
                notes TEXT NOT NULL DEFAULT '',
                FOREIGN KEY(user_id) REFERENCES users(id)
            );
            """
        )
        columns = [
            row["name"]
            for row in conn.execute("PRAGMA table_info(workouts)").fetchall()
        ]
        if "estimated_steps" not in columns:
            conn.execute(
                "ALTER TABLE workouts ADD COLUMN estimated_steps INTEGER NOT NULL DEFAULT 0"
            )

        workouts = conn.execute(
            """
            SELECT id, workout_type, minutes, intensity
            FROM workouts
            WHERE estimated_steps = 0
            """
        ).fetchall()
        for workout in workouts:
            conn.execute(
                "UPDATE workouts SET estimated_steps = ? WHERE id = ?",
                (
                    estimate_steps(
                        workout["workout_type"],
                        workout["minutes"],
                        workout["intensity"],
                    ),
                    workout["id"],
                ),
            )

        step_totals = conn.execute(
            """
            SELECT user_id, workout_date, COALESCE(SUM(estimated_steps), 0) AS steps
            FROM workouts
            GROUP BY user_id, workout_date
            """
        ).fetchall()
        for total in step_totals:
            conn.execute(
                """
                INSERT INTO habits (user_id, entry_date, steps, water_glasses, sleep_hours, move_calories, mood)
                VALUES (?, ?, ?, 0, 0, 0, 'Focused')
                ON CONFLICT(user_id, entry_date)
                DO UPDATE SET steps = MAX(steps, excluded.steps)
                """,
                (total["user_id"], total["workout_date"], total["steps"]),
            )
        conn.commit()


def ensure_user_defaults(user_id):
    today = date.today().isoformat()
    with connect_db() as conn:
        conn.execute(
            """
            INSERT OR IGNORE INTO habits (user_id, entry_date, steps, water_glasses, sleep_hours, move_calories, mood)
            VALUES (?, ?, 0, 0, 0, 0, 'Focused')
            """,
            (user_id, today),
        )
        conn.execute(
            """
            INSERT OR IGNORE INTO goals (user_id, move_goal, water_goal, step_goal, workout_goal)
            VALUES (?, 650, 3.0, 10000, 5)
            """,
            (user_id,),
        )
        conn.commit()


def get_today_habit(conn, user_id):
    today = date.today().isoformat()
    row = conn.execute(
        "SELECT * FROM habits WHERE user_id = ? AND entry_date = ?",
        (user_id, today),
    ).fetchone()
    return dict(row) if row else None


def get_programs(progress_map=None):
    progress_map = progress_map or {}
    programs = [
        {
            "title": "Strength Builder",
            "subtitle": "Upper/lower split",
            "duration": "4 weeks",
            "schedule": "4 days/week",
            "level": "Intermediate",
            "total_sessions": 16,
            "description": "Progressive upper and lower body strength sessions with recovery day spacing.",
            "workout": {"name": "Strength Builder Session", "workout_type": "Strength", "minutes": 55, "calories": 420, "intensity": "High"},
        },
        {
            "title": "Fat Loss Engine",
            "subtitle": "Hybrid conditioning",
            "duration": "6 weeks",
            "schedule": "5 days/week",
            "level": "Intermediate",
            "total_sessions": 30,
            "description": "Mix intervals, zone 2 cardio, and high-protein meals to drive consistency.",
            "workout": {"name": "Fat Loss Conditioning", "workout_type": "Cardio", "minutes": 45, "calories": 460, "intensity": "High"},
        },
        {
            "title": "Mobility Restore",
            "subtitle": "Daily 20-minute flow",
            "duration": "3 weeks",
            "schedule": "Daily",
            "level": "Beginner",
            "total_sessions": 21,
            "description": "Hips, thoracic rotation, and hamstring work designed for desk-heavy weeks.",
            "workout": {"name": "Mobility Restore Flow", "workout_type": "Mobility", "minutes": 20, "calories": 90, "intensity": "Low"},
        },
        {
            "title": "Beginner Foundation",
            "subtitle": "Full-body reset",
            "duration": "4 weeks",
            "schedule": "3 days/week",
            "level": "Beginner",
            "total_sessions": 12,
            "description": "Simple full-body training to build form, confidence, and a reliable weekly routine.",
            "workout": {"name": "Beginner Foundation Workout", "workout_type": "Strength", "minutes": 35, "calories": 240, "intensity": "Moderate"},
        },
        {
            "title": "Home Dumbbell Fit",
            "subtitle": "Minimal equipment",
            "duration": "5 weeks",
            "schedule": "3 days/week",
            "level": "Beginner",
            "total_sessions": 15,
            "description": "Dumbbell circuits for strength, conditioning, and consistency without a gym setup.",
            "workout": {"name": "Home Dumbbell Circuit", "workout_type": "Strength", "minutes": 40, "calories": 300, "intensity": "Moderate"},
        },
        {
            "title": "5K Run Base",
            "subtitle": "Run/walk build",
            "duration": "8 weeks",
            "schedule": "4 days/week",
            "level": "Beginner",
            "total_sessions": 32,
            "description": "Gradually move from run/walk intervals to steady aerobic runs with one recovery day.",
            "workout": {"name": "5K Run Base Session", "workout_type": "Running", "minutes": 35, "calories": 360, "intensity": "Moderate"},
        },
        {
            "title": "Push Pull Legs",
            "subtitle": "Hypertrophy block",
            "duration": "6 weeks",
            "schedule": "6 days/week",
            "level": "Advanced",
            "total_sessions": 36,
            "description": "High-volume muscle building with push, pull, leg rotation and tracked progressive overload.",
            "workout": {"name": "Push Pull Legs Session", "workout_type": "Strength", "minutes": 65, "calories": 520, "intensity": "High"},
        },
        {
            "title": "Core and Posture",
            "subtitle": "Stability focus",
            "duration": "3 weeks",
            "schedule": "4 days/week",
            "level": "Beginner",
            "total_sessions": 12,
            "description": "Core stability, glute activation, and posture work for stronger daily movement.",
            "workout": {"name": "Core and Posture Session", "workout_type": "Mobility", "minutes": 25, "calories": 130, "intensity": "Low"},
        },
        {
            "title": "Athletic Conditioning",
            "subtitle": "Speed and power",
            "duration": "5 weeks",
            "schedule": "4 days/week",
            "level": "Advanced",
            "total_sessions": 20,
            "description": "Explosive drills, sprints, agility work, and strength circuits for sport-ready fitness.",
            "workout": {"name": "Athletic Conditioning Session", "workout_type": "Sports", "minutes": 50, "calories": 500, "intensity": "High"},
        },
    ]

    for program in programs:
        completed = progress_map.get(program["title"], 0)
        program["completed_sessions"] = completed
        program["progress"] = min(round(completed / program["total_sessions"] * 100), 100)
    return programs


def get_exercises():
    return [
        {"name": "Goblet Squat", "group": "Legs", "equipment": "Dumbbell", "difficulty": "Beginner", "workout_type": "Strength", "minutes": 20, "calories": 150, "cue": "Keep chest tall and push knees out."},
        {"name": "Push-up", "group": "Chest", "equipment": "Bodyweight", "difficulty": "Beginner", "workout_type": "Strength", "minutes": 15, "calories": 110, "cue": "Brace abs and lower in one line."},
        {"name": "Dumbbell Row", "group": "Back", "equipment": "Dumbbell", "difficulty": "Beginner", "workout_type": "Strength", "minutes": 18, "calories": 120, "cue": "Pull elbow toward your back pocket."},
        {"name": "Romanian Deadlift", "group": "Hamstrings", "equipment": "Dumbbell", "difficulty": "Intermediate", "workout_type": "Strength", "minutes": 22, "calories": 160, "cue": "Hinge from hips and keep lats tight."},
        {"name": "Plank", "group": "Core", "equipment": "Bodyweight", "difficulty": "Beginner", "workout_type": "Mobility", "minutes": 10, "calories": 45, "cue": "Squeeze glutes and breathe slowly."},
        {"name": "Burpee Intervals", "group": "Full Body", "equipment": "Bodyweight", "difficulty": "Advanced", "workout_type": "Cardio", "minutes": 15, "calories": 190, "cue": "Move fast but land softly."},
        {"name": "Jump Rope", "group": "Cardio", "equipment": "Rope", "difficulty": "Intermediate", "workout_type": "Cardio", "minutes": 20, "calories": 240, "cue": "Stay light on the balls of your feet."},
        {"name": "Sun Salutation", "group": "Mobility", "equipment": "Mat", "difficulty": "Beginner", "workout_type": "Yoga", "minutes": 20, "calories": 90, "cue": "Match each movement to your breath."},
        {"name": "Hip Flexor Flow", "group": "Mobility", "equipment": "Mat", "difficulty": "Beginner", "workout_type": "Mobility", "minutes": 15, "calories": 55, "cue": "Keep ribs down and glute squeezed."},
        {"name": "Sprint Strides", "group": "Speed", "equipment": "Outdoor", "difficulty": "Advanced", "workout_type": "Running", "minutes": 25, "calories": 280, "cue": "Build speed smoothly, then walk back."},
    ]


def build_history(conn, user_id, days=14):
    start = (date.today() - timedelta(days=days - 1)).isoformat()
    habits = {
        row["entry_date"]: dict(row)
        for row in conn.execute(
            "SELECT * FROM habits WHERE user_id = ? AND entry_date >= ?",
            (user_id, start),
        ).fetchall()
    }
    workouts = {
        row["workout_date"]: dict(row)
        for row in conn.execute(
            """
            SELECT workout_date, COALESCE(SUM(minutes), 0) AS minutes,
                   COALESCE(SUM(calories), 0) AS calories,
                   COALESCE(SUM(estimated_steps), 0) AS estimated_steps,
                   COUNT(*) AS workouts
            FROM workouts
            WHERE user_id = ? AND workout_date >= ?
            GROUP BY workout_date
            """,
            (user_id, start),
        ).fetchall()
    }
    meals = {
        row["meal_date"]: dict(row)
        for row in conn.execute(
            """
            SELECT meal_date, COALESCE(SUM(protein), 0) AS protein,
                   COALESCE(SUM(carbs), 0) AS carbs,
                   COALESCE(SUM(fats), 0) AS fats,
                   COALESCE(SUM(calories), 0) AS calories
            FROM meals
            WHERE user_id = ? AND meal_date >= ?
            GROUP BY meal_date
            """,
            (user_id, start),
        ).fetchall()
    }

    history = []
    for offset in range(days - 1, -1, -1):
        day = date.today() - timedelta(days=offset)
        key = day.isoformat()
        habit = habits.get(key, {})
        workout = workouts.get(key, {})
        meal = meals.get(key, {})
        history.append(
            {
                "date": key,
                "label": day.strftime("%a"),
                "steps": habit.get("steps", workout.get("estimated_steps", 0)),
                "water_glasses": habit.get("water_glasses", 0),
                "sleep_hours": habit.get("sleep_hours", 0),
                "move_calories": habit.get("move_calories", workout.get("calories", 0)),
                "minutes": workout.get("minutes", 0),
                "workouts": workout.get("workouts", 0),
                "nutrition_calories": meal.get("calories", 0),
                "protein": meal.get("protein", 0),
            }
        )
    return history


def build_daily_quest(habit, goals, nutrition):
    day_index = date.today().toordinal() % 4
    quests = [
        {
            "title": "Step charge",
            "description": "Hit a focused movement block today.",
            "current": habit["steps"],
            "target": min(goals["step_goal"], 8000),
            "unit": "steps",
        },
        {
            "title": "Hydration lock",
            "description": "Keep water intake steady through the day.",
            "current": round(habit["water_glasses"] * 0.25, 1),
            "target": goals["water_goal"],
            "unit": "L",
        },
        {
            "title": "Protein anchor",
            "description": "Give recovery enough raw material.",
            "current": nutrition["protein"],
            "target": 90,
            "unit": "g",
        },
        {
            "title": "Recovery buffer",
            "description": "Protect sleep so training adapts.",
            "current": habit["sleep_hours"],
            "target": 7.5,
            "unit": "h",
        },
    ]
    quest = quests[day_index]
    quest["progress"] = min(round(quest["current"] / quest["target"] * 100), 100) if quest["target"] else 0
    quest["completed"] = quest["progress"] >= 100
    return quest


def build_achievements(habit, goals, analytics, total_workouts, total_meals, program_sessions, latest_metric):
    water_liters = habit["water_glasses"] * 0.25
    definitions = [
        ("First Workout", "Log your first workout.", total_workouts >= 1),
        ("3 Day Streak", "Train for 3 active days in a row.", analytics["streak"] >= 3),
        ("10K Steps", "Reach 10,000 steps in a day.", habit["steps"] >= 10000),
        ("Hydration Hero", "Hit today's water goal.", water_liters >= goals["water_goal"]),
        ("Protein Goal Hit", "Log at least 90g protein today.", analytics["nutrition"]["protein"] >= 90),
        ("Program Starter", "Complete a program template session.", program_sessions >= 1),
        ("Meal Logger", "Log 3 meals in Fitly.", total_meals >= 3),
        ("Body Baseline", "Add your first body metric entry.", latest_metric is not None),
    ]
    return [
        {"title": title, "description": description, "unlocked": unlocked}
        for title, description, unlocked in definitions
    ]


def build_coach_feedback(habit, goals, analytics):
    water_liters = habit["water_glasses"] * 0.25
    if habit["sleep_hours"] and habit["sleep_hours"] < 6:
        return {
            "title": "Recovery first",
            "message": "Sleep is low today. Keep intensity controlled and choose mobility or zone 2 work.",
            "focus": "Sleep and mobility",
        }
    if analytics["nutrition"]["protein"] < 60 and analytics["weekly_minutes"] > 90:
        return {
            "title": "Fuel the work",
            "message": "Training volume is building. Add a protein-forward meal to support recovery.",
            "focus": "Protein",
        }
    if water_liters < goals["water_goal"] * 0.5:
        return {
            "title": "Hydration gap",
            "message": "Hydration is behind pace. Bring water up before stacking more intensity.",
            "focus": "Water",
        }
    if analytics["coach_score"] >= 80:
        return {
            "title": "Green light",
            "message": "Recovery and movement look strong. A harder session fits today.",
            "focus": "Progression",
        }
    return {
        "title": "Build momentum",
        "message": "Keep the next action small: log a workout, hit water, or close today's quest.",
        "focus": "Consistency",
    }


def build_dashboard(user_id):
    ensure_user_defaults(user_id)
    with connect_db() as conn:
        user = dict(
            conn.execute(
                "SELECT id, name, email FROM users WHERE id = ?",
                (user_id,),
            ).fetchone()
        )
        habit = get_today_habit(conn, user_id)
        goals = dict(
            conn.execute("SELECT * FROM goals WHERE user_id = ?", (user_id,)).fetchone()
        )
        workouts = [
            dict(row)
            for row in conn.execute(
                """
                SELECT id, name, workout_type, minutes, calories, estimated_steps, intensity, workout_date, notes
                FROM workouts
                WHERE user_id = ?
                ORDER BY workout_date DESC, id DESC
                LIMIT 8
                """,
                (user_id,),
            ).fetchall()
        ]
        meals = [
            dict(row)
            for row in conn.execute(
                """
                SELECT id, title, protein, carbs, fats, calories, meal_date
                FROM meals
                WHERE user_id = ?
                ORDER BY meal_date DESC, id DESC
                LIMIT 6
                """,
                (user_id,),
            ).fetchall()
        ]
        metrics = [
            dict(row)
            for row in conn.execute(
                """
                SELECT id, entry_date, weight, body_fat, waist, chest, arms, notes
                FROM body_metrics
                WHERE user_id = ?
                ORDER BY entry_date DESC, id DESC
                LIMIT 8
                """,
                (user_id,),
            ).fetchall()
        ]
        progress_map = {
            row["program_title"]: row["completed_sessions"]
            for row in conn.execute(
                """
                SELECT program_title, completed_sessions
                FROM program_progress
                WHERE user_id = ?
                """,
                (user_id,),
            ).fetchall()
        }
        total_workouts = conn.execute(
            "SELECT COUNT(*) AS total FROM workouts WHERE user_id = ?",
            (user_id,),
        ).fetchone()["total"]
        total_meals = conn.execute(
            "SELECT COUNT(*) AS total FROM meals WHERE user_id = ?",
            (user_id,),
        ).fetchone()["total"]

        weekly_rows = conn.execute(
            """
            SELECT
                workout_date,
                COALESCE(SUM(minutes), 0) AS minutes,
                COALESCE(SUM(calories), 0) AS calories,
                COALESCE(SUM(estimated_steps), 0) AS estimated_steps
            FROM workouts
            WHERE user_id = ? AND workout_date >= ?
            GROUP BY workout_date
            """,
            (user_id, (date.today() - timedelta(days=6)).isoformat()),
        ).fetchall()
        weekly_map = {row["workout_date"]: dict(row) for row in weekly_rows}

        weekly = []
        streak = 0
        for offset in range(6, -1, -1):
            day = date.today() - timedelta(days=offset)
            label = day.strftime("%a")
            item = weekly_map.get(day.isoformat(), {"minutes": 0, "calories": 0, "estimated_steps": 0})
            weekly.append(
                {
                    "date": day.isoformat(),
                    "label": label,
                    "minutes": item["minutes"],
                    "calories": item["calories"],
                    "estimated_steps": item["estimated_steps"],
                }
            )

        for item in reversed(weekly):
            if item["minutes"] >= 20:
                streak += 1
            else:
                break

        total_minutes = sum(item["minutes"] for item in weekly)
        total_calories = sum(item["calories"] for item in weekly)
        protein = sum(item["protein"] for item in meals if item["meal_date"] == date.today().isoformat())
        carbs = sum(item["carbs"] for item in meals if item["meal_date"] == date.today().isoformat())
        fats = sum(item["fats"] for item in meals if item["meal_date"] == date.today().isoformat())
        nutrition_calories = sum(item["calories"] for item in meals if item["meal_date"] == date.today().isoformat())

        move_ratio = min(habit["move_calories"] / goals["move_goal"], 1)
        sleep_ratio = min(habit["sleep_hours"] / 8, 1)
        water_ratio = min((habit["water_glasses"] * 0.25) / goals["water_goal"], 1)
        step_ratio = min(habit["steps"] / goals["step_goal"], 1)
        score = round((move_ratio * 0.35 + sleep_ratio * 0.25 + water_ratio * 0.15 + step_ratio * 0.25) * 100)
        analytics = {
            "weekly_minutes": total_minutes,
            "weekly_calories": total_calories,
            "weekly_workouts": len([item for item in weekly if item["minutes"] > 0]),
            "streak": streak,
            "coach_score": score,
            "nutrition": {
                "protein": protein,
                "carbs": carbs,
                "fats": fats,
                "calories": nutrition_calories,
            },
        }
        latest_metric = metrics[0] if metrics else None

        return {
            "user": user,
            "today": habit,
            "goals": goals,
            "workouts": workouts,
            "weekly": weekly,
            "history": build_history(conn, user_id),
            "meals": meals,
            "body_metrics": metrics,
            "latest_metric": latest_metric,
            "analytics": analytics,
            "daily_quest": build_daily_quest(habit, goals, analytics["nutrition"]),
            "achievements": build_achievements(
                habit,
                goals,
                analytics,
                total_workouts,
                total_meals,
                sum(progress_map.values()),
                latest_metric,
            ),
            "coach_feedback": build_coach_feedback(habit, goals, analytics),
            "exercises": get_exercises(),
            "plans": get_programs(progress_map),
            "challenges": [
                {"title": "10K Every Day", "progress": min(round(habit["steps"] / 10000 * 100), 100)},
                {"title": "Hydration Reset", "progress": min(round((habit["water_glasses"] * 0.25) / goals["water_goal"] * 100), 100)},
                {"title": "5 Workouts This Week", "progress": min(round(len([item for item in weekly if item["minutes"] > 0]) / goals["workout_goal"] * 100), 100)},
            ],
        }


class FitnessHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(WEB_ROOT), **kwargs)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == "/api/health":
            return json_response(self, {"ok": True, "timestamp": datetime.now().isoformat()})

        if parsed.path == "/api/dashboard":
            user = get_user_from_token(self)
            if not user:
                return json_response(self, {"error": "Unauthorized"}, HTTPStatus.UNAUTHORIZED)
            return json_response(self, build_dashboard(user["id"]))

        if parsed.path == "/api/workouts":
            user = get_user_from_token(self)
            if not user:
                return json_response(self, {"error": "Unauthorized"}, HTTPStatus.UNAUTHORIZED)
            dashboard = build_dashboard(user["id"])
            return json_response(self, dashboard["workouts"])

        if parsed.path == "/api/plans":
            user = get_user_from_token(self)
            if not user:
                return json_response(self, {"error": "Unauthorized"}, HTTPStatus.UNAUTHORIZED)
            return json_response(self, build_dashboard(user["id"])["plans"])

        if parsed.path == "/api/exercises":
            user = get_user_from_token(self)
            if not user:
                return json_response(self, {"error": "Unauthorized"}, HTTPStatus.UNAUTHORIZED)
            return json_response(self, get_exercises())

        return super().do_GET()

    def do_POST(self):
        parsed = urlparse(self.path)
        payload = read_json(self)

        if parsed.path == "/api/auth/register":
            name = payload.get("name", "").strip()
            email = payload.get("email", "").strip().lower()
            password = payload.get("password", "")
            if not name or not email or len(password) < 6:
                return json_response(self, {"error": "Enter a name, valid email, and 6+ character password."}, HTTPStatus.BAD_REQUEST)

            with connect_db() as conn:
                try:
                    cursor = conn.execute(
                        """
                        INSERT INTO users (name, email, password_hash, created_at)
                        VALUES (?, ?, ?, ?)
                        """,
                        (name, email, hash_password(password), datetime.now().isoformat()),
                    )
                    user_id = cursor.lastrowid
                    conn.commit()
                except sqlite3.IntegrityError:
                    return json_response(self, {"error": "An account with that email already exists."}, HTTPStatus.CONFLICT)
            ensure_user_defaults(user_id)
            token = secrets.token_urlsafe(32)
            with connect_db() as conn:
                conn.execute(
                    "INSERT INTO sessions (token, user_id, created_at) VALUES (?, ?, ?)",
                    (token, user_id, datetime.now().isoformat()),
                )
                conn.commit()
            return json_response(self, {"token": token, "user": {"id": user_id, "name": name, "email": email}}, HTTPStatus.CREATED)

        if parsed.path == "/api/auth/login":
            email = payload.get("email", "").strip().lower()
            password = payload.get("password", "")
            with connect_db() as conn:
                row = conn.execute(
                    "SELECT id, name, email, password_hash FROM users WHERE email = ?",
                    (email,),
                ).fetchone()
            if not row or not verify_password(password, row["password_hash"]):
                return json_response(self, {"error": "Invalid email or password."}, HTTPStatus.UNAUTHORIZED)

            token = secrets.token_urlsafe(32)
            with connect_db() as conn:
                conn.execute(
                    "INSERT INTO sessions (token, user_id, created_at) VALUES (?, ?, ?)",
                    (token, row["id"], datetime.now().isoformat()),
                )
                conn.commit()
            ensure_user_defaults(row["id"])
            return json_response(self, {"token": token, "user": {"id": row["id"], "name": row["name"], "email": row["email"]}})

        user = get_user_from_token(self)
        if not user:
            return json_response(self, {"error": "Unauthorized"}, HTTPStatus.UNAUTHORIZED)

        if parsed.path == "/api/workouts":
            workout_date = payload.get("workout_date") or date.today().isoformat()
            workout_type = payload.get("workout_type", "Strength")
            minutes = int(payload.get("minutes", 30))
            calories = int(payload.get("calories", 250))
            intensity = payload.get("intensity", "Moderate")
            estimated_steps = estimate_steps(workout_type, minutes, intensity)
            program_title = payload.get("program_title", "").strip()
            with connect_db() as conn:
                conn.execute(
                    """
                    INSERT INTO workouts (user_id, name, workout_type, minutes, calories, estimated_steps, intensity, workout_date, notes)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        user["id"],
                        payload.get("name", "Workout").strip() or "Workout",
                        workout_type,
                        minutes,
                        calories,
                        estimated_steps,
                        intensity,
                        workout_date,
                        payload.get("notes", "").strip(),
                    ),
                )
                conn.execute(
                    """
                    INSERT INTO habits (user_id, entry_date, steps, water_glasses, sleep_hours, move_calories, mood)
                    VALUES (?, ?, ?, 0, 0, ?, 'Focused')
                    ON CONFLICT(user_id, entry_date)
                    DO UPDATE SET
                      steps = steps + excluded.steps,
                      move_calories = move_calories + excluded.move_calories
                    """,
                    (user["id"], workout_date, estimated_steps, calories),
                )
                if program_title:
                    program = next(
                        (item for item in get_programs() if item["title"] == program_title),
                        None,
                    )
                    total_sessions = program["total_sessions"] if program else 999
                    conn.execute(
                        """
                        INSERT INTO program_progress (user_id, program_title, completed_sessions, updated_at)
                        VALUES (?, ?, 1, ?)
                        ON CONFLICT(user_id, program_title)
                        DO UPDATE SET
                          completed_sessions = MIN(program_progress.completed_sessions + 1, ?),
                          updated_at = excluded.updated_at
                        """,
                        (user["id"], program_title, datetime.now().isoformat(), total_sessions),
                    )
                conn.commit()
            return json_response(self, {"ok": True, "estimated_steps": estimated_steps})

        if parsed.path == "/api/program-progress":
            program_title = payload.get("program_title", "").strip()
            if not program_title:
                return json_response(self, {"error": "Program title is required."}, HTTPStatus.BAD_REQUEST)
            program = next(
                (item for item in get_programs() if item["title"] == program_title),
                None,
            )
            total_sessions = program["total_sessions"] if program else int(payload.get("total_sessions", 999))
            delta = int(payload.get("delta", 1))
            with connect_db() as conn:
                current = conn.execute(
                    """
                    SELECT completed_sessions
                    FROM program_progress
                    WHERE user_id = ? AND program_title = ?
                    """,
                    (user["id"], program_title),
                ).fetchone()
                next_count = max(min((current["completed_sessions"] if current else 0) + delta, total_sessions), 0)
                conn.execute(
                    """
                    INSERT INTO program_progress (user_id, program_title, completed_sessions, updated_at)
                    VALUES (?, ?, ?, ?)
                    ON CONFLICT(user_id, program_title)
                    DO UPDATE SET
                      completed_sessions = excluded.completed_sessions,
                      updated_at = excluded.updated_at
                    """,
                    (user["id"], program_title, next_count, datetime.now().isoformat()),
                )
                conn.commit()
            return json_response(self, {"ok": True, "completed_sessions": next_count})

        if parsed.path == "/api/habits/today":
            today = date.today().isoformat()
            with connect_db() as conn:
                conn.execute(
                    """
                    INSERT INTO habits (user_id, entry_date, steps, water_glasses, sleep_hours, move_calories, mood)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    ON CONFLICT(user_id, entry_date)
                    DO UPDATE SET
                      steps = excluded.steps,
                      water_glasses = excluded.water_glasses,
                      sleep_hours = excluded.sleep_hours,
                      move_calories = excluded.move_calories,
                      mood = excluded.mood
                    """,
                    (
                        user["id"],
                        today,
                        int(payload.get("steps", get_today_habit(conn, user["id"])["steps"])),
                        int(payload.get("water_glasses", 0)),
                        float(payload.get("sleep_hours", 0)),
                        int(payload.get("move_calories", 0)),
                        payload.get("mood", "Focused"),
                    ),
                )
                conn.commit()
            return json_response(self, {"ok": True})

        if parsed.path == "/api/goals":
            with connect_db() as conn:
                conn.execute(
                    """
                    INSERT INTO goals (user_id, move_goal, water_goal, step_goal, workout_goal)
                    VALUES (?, ?, ?, ?, ?)
                    ON CONFLICT(user_id)
                    DO UPDATE SET
                      move_goal = excluded.move_goal,
                      water_goal = excluded.water_goal,
                      step_goal = excluded.step_goal,
                      workout_goal = excluded.workout_goal
                    """,
                    (
                        user["id"],
                        int(payload.get("move_goal", 650)),
                        float(payload.get("water_goal", 3.0)),
                        int(payload.get("step_goal", 10000)),
                        int(payload.get("workout_goal", 5)),
                    ),
                )
                conn.commit()
            return json_response(self, {"ok": True})

        if parsed.path == "/api/meals":
            protein = int(payload.get("protein", 0))
            carbs = int(payload.get("carbs", 0))
            fats = int(payload.get("fats", 0))
            calories = calculate_calories(protein, carbs, fats)
            with connect_db() as conn:
                conn.execute(
                    """
                    INSERT INTO meals (user_id, title, protein, carbs, fats, calories, meal_date)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        user["id"],
                        payload.get("title", "Meal").strip() or "Meal",
                        protein,
                        carbs,
                        fats,
                        calories,
                        payload.get("meal_date") or date.today().isoformat(),
                    ),
                )
                conn.commit()
            return json_response(self, {"ok": True, "calories": calories})

        if parsed.path == "/api/body-metrics":
            entry_date = payload.get("entry_date") or date.today().isoformat()
            with connect_db() as conn:
                conn.execute(
                    """
                    INSERT INTO body_metrics (user_id, entry_date, weight, body_fat, waist, chest, arms, notes)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        user["id"],
                        entry_date,
                        number_or_zero(payload.get("weight", 0)),
                        number_or_zero(payload.get("body_fat", 0)),
                        number_or_zero(payload.get("waist", 0)),
                        number_or_zero(payload.get("chest", 0)),
                        number_or_zero(payload.get("arms", 0)),
                        payload.get("notes", "").strip(),
                    ),
                )
                conn.commit()
            return json_response(self, {"ok": True})

        return json_response(self, {"error": "Not found"}, HTTPStatus.NOT_FOUND)

    def log_message(self, format, *args):
        return


if __name__ == "__main__":
    init_db()
    server = ThreadingHTTPServer(("0.0.0.0", 8000), FitnessHandler)
    print("Fitly running at http://0.0.0.0:8000")
    server.serve_forever()
