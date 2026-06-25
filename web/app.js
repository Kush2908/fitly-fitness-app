const { useEffect, useMemo, useState } = React;

const api = async (path, options = {}, token = localStorage.getItem("fitly-token")) => {
  const response = await fetch(path, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    },
    ...options
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "Request failed");
  }
  return data;
};

const formatDate = (value) =>
  new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric"
  });

const formatCount = (value, singular, plural = `${singular}s`) =>
  `${Number(value || 0).toLocaleString()} ${Number(value || 0) === 1 ? singular : plural}`;

const formatMetric = (value, unit) => {
  const formattedValue = Number(value || 0).toLocaleString();
  return unit ? `${formattedValue} ${unit}` : formattedValue;
};

const CUSTOM_FOOD = "Custom meal";

const FOOD_PRESETS = {
  "Oats with banana": { serving: "1 bowl", protein: 12, carbs: 62, fats: 8 },
  "Eggs and toast": { serving: "2 eggs + 2 toast", protein: 22, carbs: 30, fats: 16 },
  "Dal rice": { serving: "1 plate", protein: 14, carbs: 72, fats: 9 },
  "Paneer roti meal": { serving: "1 plate", protein: 24, carbs: 48, fats: 22 },
  "Chicken rice bowl": { serving: "1 bowl", protein: 38, carbs: 58, fats: 10 },
  "Idli sambar": { serving: "3 idli + sambar", protein: 12, carbs: 64, fats: 5 },
  "Poha with peanuts": { serving: "1 plate", protein: 9, carbs: 55, fats: 12 },
  "Rajma chawal": { serving: "1 plate", protein: 16, carbs: 78, fats: 8 },
  "Masala dosa": { serving: "1 dosa + sambar", protein: 11, carbs: 62, fats: 15 },
  "Grilled fish meal": { serving: "1 plate", protein: 36, carbs: 34, fats: 12 },
  "Sprouts chaat": { serving: "1 bowl", protein: 16, carbs: 32, fats: 5 },
  "Greek yogurt bowl": { serving: "1 bowl", protein: 24, carbs: 32, fats: 6 },
  "Protein shake": { serving: "1 shake", protein: 28, carbs: 10, fats: 4 },
  "Chickpea salad": { serving: "1 bowl", protein: 18, carbs: 42, fats: 12 }
};

const calculateMealCalories = ({ protein, carbs, fats }) =>
  Math.max(Math.round(Number(protein || 0) * 4 + Number(carbs || 0) * 4 + Number(fats || 0) * 9), 0);

const scaleFoodPreset = (preset, servings) => ({
  protein: Math.round(preset.protein * servings),
  carbs: Math.round(preset.carbs * servings),
  fats: Math.round(preset.fats * servings)
});

const DEFAULT_CARDS = {
  steps: true,
  hydration: true,
  load: true,
  streak: true
};

const CHARTS = {
  steps: { label: "Steps", unit: "", color: "var(--orange)" },
  minutes: { label: "Training minutes", unit: "m", color: "var(--blue)" },
  nutrition_calories: { label: "Food calories", unit: " kcal", color: "var(--rose)" },
  protein: { label: "Protein", unit: "g", color: "var(--green)" },
  sleep_hours: { label: "Sleep", unit: "h", color: "var(--sand)" }
};

const formatTimer = (seconds) => {
  const mins = Math.floor(seconds / 60).toString().padStart(2, "0");
  const secs = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
};

function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState("signup");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setForm({ name: "", email: "", password: "" });
    const timers = [100, 400, 900].map((delay) =>
      window.setTimeout(() => setForm({ name: "", email: "", password: "" }), delay)
    );
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [mode]);

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const payload = mode === "signup" ? form : { email: form.email, password: form.password };
      const data = await api(
        `/api/auth/${mode === "signup" ? "register" : "login"}`,
        {
          method: "POST",
          body: JSON.stringify(payload)
        },
        null
      );
      localStorage.setItem("fitly-token", data.token);
      onAuth(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <section className="auth-hero">
        <div className="fitly-logo" aria-hidden="true">
          <div className="fitly-logo-orbit orbit-one"></div>
          <div className="fitly-logo-orbit orbit-two"></div>
          <div className="fitly-logo-core">
            <div className="fitly-logo-mark">
              <span className="fitly-logo-stem"></span>
              <span className="fitly-logo-arm top"></span>
              <span className="fitly-logo-arm mid"></span>
              <span className="fitly-logo-pulse"></span>
            </div>
          </div>
        </div>
        <p className="eyebrow">Fitness platform</p>
        <h1>Fitly</h1>
        <p>
          Track workouts, plan routines, monitor recovery, and manage nutrition in one clean
          dashboard.
        </p>
      </section>
      <section className="auth-card">
        <div className="mode-toggle">
          <button className={mode === "signup" ? "active" : ""} onClick={() => setMode("signup")}>
            Create account
          </button>
          <button className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>
            Log in
          </button>
        </div>
        <form className="stack" onSubmit={submit} autoComplete="off">
          {mode === "signup" && (
            <label>
              Full name
              <input
                name="fitly-display-name"
                autoComplete="off"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </label>
          )}
          <label>
            Email
            <input
              type="email"
              name="fitly-email"
              autoComplete="off"
              inputMode="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              name="fitly-passcode"
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </label>
          {error && <div className="error-banner">{error}</div>}
          <button type="submit" className="primary-button" disabled={loading}>
            {loading ? "Please wait..." : mode === "signup" ? "Create your profile" : "Enter dashboard"}
          </button>
        </form>
      </section>
    </div>
  );
}

function Ring({ label, value, max, tone }) {
  const ratio = Math.min(value / max, 1);
  const circumference = 2 * Math.PI * 44;
  const offset = circumference * (1 - ratio);
  return (
    <div className={`ring ring-${tone}`}>
      <svg viewBox="0 0 120 120">
        <circle className="ring-track" cx="60" cy="60" r="44"></circle>
        <circle
          className="ring-progress"
          cx="60"
          cy="60"
          r="44"
          style={{ strokeDasharray: circumference, strokeDashoffset: offset }}
        ></circle>
      </svg>
      <div className="ring-content">
        <span>{label}</span>
        <strong>{Math.round(value)}</strong>
      </div>
    </div>
  );
}

function TrendChart({ items, metric, compact = false }) {
  const config = CHARTS[metric] || CHARTS.steps;
  const values = items.map((item) => Number(item[metric] || 0));
  const max = Math.max(...values, 1);

  return (
    <div className={`trend-chart ${compact ? "trend-chart-compact" : ""}`}>
      {items.map((item) => {
        const value = Number(item[metric] || 0);
        const height = Math.max((value / max) * 100, value > 0 ? 10 : 3);
        return (
          <div className="trend-column" key={`${item.date}-${metric}`}>
            <div className="trend-bar-wrap">
              <div
                className="trend-bar"
                style={{ height: `${height}%`, background: config.color }}
                title={`${config.label}: ${value}${config.unit}`}
              ></div>
            </div>
            <span>{item.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function WorkoutTimer() {
  const [workSeconds, setWorkSeconds] = useState(40);
  const [restSeconds, setRestSeconds] = useState(20);
  const [rounds, setRounds] = useState(6);
  const [phase, setPhase] = useState("Work");
  const [round, setRound] = useState(1);
  const [secondsLeft, setSecondsLeft] = useState(40);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) {
      return undefined;
    }
    const timer = window.setInterval(() => {
      setSecondsLeft((current) => {
        if (current > 1) {
          return current - 1;
        }
        if (phase === "Work") {
          setPhase("Rest");
          return restSeconds;
        }
        if (round >= rounds) {
          setRunning(false);
          setPhase("Done");
          return 0;
        }
        setRound((value) => value + 1);
        setPhase("Work");
        return workSeconds;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [running, phase, round, rounds, workSeconds, restSeconds]);

  const resetTimer = () => {
    setRunning(false);
    setPhase("Work");
    setRound(1);
    setSecondsLeft(workSeconds);
  };

  useEffect(() => {
    if (!running && phase === "Work") {
      setSecondsLeft(workSeconds);
    }
  }, [workSeconds, running, phase]);

  return (
    <div className="timer-tool">
      <div className="timer-display">
        <span>{phase}</span>
        <strong>{formatTimer(secondsLeft)}</strong>
        <small>
          Round {Math.min(round, rounds)} of {rounds}
        </small>
      </div>
      <div className="timer-controls-grid">
        <label>
          Work
          <input type="number" value={workSeconds} onChange={(e) => setWorkSeconds(Number(e.target.value) || 1)} />
        </label>
        <label>
          Rest
          <input type="number" value={restSeconds} onChange={(e) => setRestSeconds(Number(e.target.value) || 1)} />
        </label>
        <label>
          Rounds
          <input type="number" value={rounds} onChange={(e) => setRounds(Number(e.target.value) || 1)} />
        </label>
      </div>
      <div className="button-row">
        <button className="primary-button" type="button" onClick={() => setRunning((value) => !value)}>
          {running ? "Pause" : "Start"}
        </button>
        <button className="ghost-button" type="button" onClick={resetTimer}>
          Reset
        </button>
      </div>
    </div>
  );
}

function Dashboard({ user, data, onRefresh, onLogout }) {
  const hasWorkoutData = data.workouts.length > 0;
  const hasMealData = data.meals.length > 0;
  const hasWeeklyActivity = data.weekly.some((item) => item.minutes > 0);
  const [workoutForm, setWorkoutForm] = useState({
    name: "",
    workout_type: "Strength",
    minutes: 45,
    calories: 320,
    intensity: "Moderate",
    notes: "",
    program_title: ""
  });
  const [habitForm, setHabitForm] = useState({
    water_glasses: data.today.water_glasses,
    sleep_hours: data.today.sleep_hours,
    move_calories: data.today.move_calories,
    mood: data.today.mood
  });
  const [mealForm, setMealForm] = useState({
    title: "",
    food: CUSTOM_FOOD,
    servings: 1,
    protein: 25,
    carbs: 40,
    fats: 10
  });
  const [goalForm, setGoalForm] = useState({
    move_goal: data.goals.move_goal,
    water_goal: data.goals.water_goal,
    step_goal: data.goals.step_goal,
    workout_goal: data.goals.workout_goal
  });
  const [metricForm, setMetricForm] = useState({
    weight: data.latest_metric?.weight || "",
    body_fat: data.latest_metric?.body_fat || "",
    waist: data.latest_metric?.waist || "",
    chest: data.latest_metric?.chest || "",
    arms: data.latest_metric?.arms || "",
    notes: ""
  });
  const [chartMetric, setChartMetric] = useState("steps");
  const [exerciseQuery, setExerciseQuery] = useState("");
  const [exerciseFilter, setExerciseFilter] = useState("All");
  const [visibleCards, setVisibleCards] = useState(() => {
    try {
      return { ...DEFAULT_CARDS, ...JSON.parse(localStorage.getItem("fitly-dashboard-cards") || "{}") };
    } catch {
      return DEFAULT_CARDS;
    }
  });
  const [notice, setNotice] = useState("");
  const [activeTab, setActiveTab] = useState("dashboard");

  useEffect(() => {
    setHabitForm({
      water_glasses: data.today.water_glasses,
      sleep_hours: data.today.sleep_hours,
      move_calories: data.today.move_calories,
      mood: data.today.mood
    });
    setGoalForm({
      move_goal: data.goals.move_goal,
      water_goal: data.goals.water_goal,
      step_goal: data.goals.step_goal,
      workout_goal: data.goals.workout_goal
    });
  }, [data]);

  useEffect(() => {
    localStorage.setItem("fitly-dashboard-cards", JSON.stringify(visibleCards));
  }, [visibleCards]);

  const nutritionSplit = useMemo(() => {
    const total =
      data.analytics.nutrition.protein +
      data.analytics.nutrition.carbs +
      data.analytics.nutrition.fats;
    if (!total) {
      return [];
    }
    return [
      { label: "Protein", value: data.analytics.nutrition.protein, tone: "orange" },
      { label: "Carbs", value: data.analytics.nutrition.carbs, tone: "blue" },
      { label: "Fats", value: data.analytics.nutrition.fats, tone: "green" }
    ].map((item) => ({ ...item, percentage: Math.round((item.value / total) * 100) }));
  }, [data.analytics.nutrition]);

  const mealCalories = useMemo(() => calculateMealCalories(mealForm), [mealForm]);

  const updateMealFood = (food) => {
    if (food === CUSTOM_FOOD) {
      setMealForm({
        title: "",
        food: CUSTOM_FOOD,
        servings: 1,
        protein: 25,
        carbs: 40,
        fats: 10
      });
      return;
    }

    const preset = FOOD_PRESETS[food];
    setMealForm({
      ...mealForm,
      title: food,
      food,
      servings: 1,
      ...scaleFoodPreset(preset, 1)
    });
  };

  const updateMealServings = (value) => {
    const servings = Math.max(Number(value) || 0, 0);
    if (mealForm.food === CUSTOM_FOOD) {
      setMealForm({ ...mealForm, servings });
      return;
    }

    setMealForm({
      ...mealForm,
      servings,
      ...scaleFoodPreset(FOOD_PRESETS[mealForm.food], servings)
    });
  };

  const history = data.history || data.weekly || [];
  const exercises = data.exercises || [];
  const exerciseGroups = ["All", ...Array.from(new Set(exercises.map((exercise) => exercise.group)))];
  const filteredExercises = exercises.filter((exercise) => {
    const matchesGroup = exerciseFilter === "All" || exercise.group === exerciseFilter;
    const haystack = `${exercise.name} ${exercise.group} ${exercise.equipment} ${exercise.difficulty}`.toLowerCase();
    return matchesGroup && haystack.includes(exerciseQuery.toLowerCase());
  });
  const quest = data.daily_quest || { title: "Daily quest", progress: 0, current: 0, target: 1, unit: "", description: "" };
  const coach = data.coach_feedback || { title: "Coach", message: "", focus: "" };
  const unlockedBadges = (data.achievements || []).filter((badge) => badge.unlocked).length;
  const statsCards = [
    {
      key: "steps",
      className: "accent-orange",
      eyebrow: "Today",
      value: data.today.steps.toLocaleString(),
      label: "Steps auto-tracked"
    },
    {
      key: "hydration",
      className: "accent-green",
      eyebrow: "Hydration",
      value: `${(data.today.water_glasses * 0.25).toFixed(1)} L`,
      label: `${formatCount(data.today.water_glasses, "glass", "glasses")} logged`
    },
    {
      key: "load",
      className: "accent-blue",
      eyebrow: "Weekly load",
      value: `${data.analytics.weekly_minutes} min`,
      label: formatCount(data.analytics.weekly_workouts, "active day", "active days")
    },
    {
      key: "streak",
      className: "accent-rose",
      eyebrow: "Streak",
      value: formatCount(data.analytics.streak, "day"),
      label: "Stay consistent"
    }
  ];

  const post = async (path, payload) => {
    await api(path, { method: "POST", body: JSON.stringify(payload) });
    setNotice("Saved");
    await onRefresh();
    window.setTimeout(() => setNotice(""), 1400);
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">F</div>
          <div>
            <p className="eyebrow">Fitness dashboard</p>
            <h2>Fitly</h2>
          </div>
        </div>
        <div className="user-chip">
          <strong>{user?.name || "Athlete"}</strong>
          <button className="ghost-button" onClick={onLogout}>
            Log out
          </button>
        </div>
        <nav className="nav-links">
          {["dashboard", "planner", "nutrition", "progress", "library", "history"].map((tab) => (
            <button key={tab} className={activeTab === tab ? "active" : ""} onClick={() => setActiveTab(tab)}>
              {tab === "dashboard" && "Dashboard"}
              {tab === "planner" && "Programs"}
              {tab === "nutrition" && "Nutrition"}
              {tab === "progress" && "Progress"}
              {tab === "library" && "Library"}
              {tab === "history" && "History"}
            </button>
          ))}
        </nav>
        <div className="sidebar-card">
          <p className="eyebrow">Coach score</p>
          <h3>{data.analytics.coach_score}</h3>
          <strong>{coach.title}</strong>
          <p>{coach.message}</p>
        </div>
        <div className="challenge-list">
          {data.challenges.map((challenge) => (
            <div key={challenge.title} className="challenge-item">
              <strong>{challenge.title}</strong>
              <span>{challenge.progress}% complete</span>
            </div>
          ))}
        </div>
      </aside>

      <main className="main-content">
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">Personal fitness tracker</p>
            <h1>Track workouts, recovery, nutrition, and progress in one place.</h1>
            <p>
              Log daily activity, follow training plans, and review your progress with simple
              account-based storage.
            </p>
            {notice && <div className="notice-chip">{notice}</div>}
          </div>
          <div className="hero-rings">
            <Ring label="Move" value={data.today.move_calories} max={data.goals.move_goal} tone="orange" />
            <Ring label="Recovery" value={data.analytics.coach_score} max={100} tone="green" />
          </div>
        </section>

        <section className="stats-grid">
          {statsCards
            .filter((card) => visibleCards[card.key])
            .map((card) => (
              <article key={card.key} className={`stat-card ${card.className}`}>
                <p className="eyebrow">{card.eyebrow}</p>
                <h3>{card.value}</h3>
                <span>{card.label}</span>
              </article>
            ))}
        </section>

        {activeTab === "dashboard" && (
          <>
            <section className="content-grid">
              <article className="panel quest-panel">
                <div className="panel-header">
                  <div>
                    <p className="eyebrow">Daily quest</p>
                    <h3>{quest.title}</h3>
                  </div>
                  <span className={quest.completed ? "status-chip unlocked" : "status-chip"}>
                    {quest.completed ? "Complete" : `${quest.progress}%`}
                  </span>
                </div>
                <p>{quest.description}</p>
                <div className="progress-track">
                  <span style={{ width: `${quest.progress}%` }}></span>
                </div>
                <div className="quest-numbers">
                  <strong>{formatMetric(quest.current, quest.unit)}</strong>
                  <span>Target {formatMetric(quest.target, quest.unit)}</span>
                </div>
              </article>
              <article className="panel coach-panel">
                <p className="eyebrow">Coach feedback</p>
                <h3>{coach.title}</h3>
                <p>{coach.message}</p>
                <div className="coach-focus">
                  <span>Focus</span>
                  <strong>{coach.focus}</strong>
                </div>
              </article>
            </section>
            <section className="content-grid">
              <article className="panel panel-large">
                <div className="panel-header">
                  <div>
                    <p className="eyebrow">Progress charts</p>
                    <h3>{CHARTS[chartMetric].label}</h3>
                  </div>
                  <select className="compact-select" value={chartMetric} onChange={(e) => setChartMetric(e.target.value)}>
                    {Object.entries(CHARTS).map(([key, config]) => (
                      <option key={key} value={key}>
                        {config.label}
                      </option>
                    ))}
                  </select>
                </div>
                <TrendChart items={history} metric={chartMetric} />
                {!hasWeeklyActivity && (
                  <div className="empty-state">
                    No workouts yet. Add your first workout and your weekly activity chart will appear here.
                  </div>
                )}
              </article>
              <article className="panel">
                <div className="panel-header">
                  <div>
                    <p className="eyebrow">Recovery inputs</p>
                    <h3>Update today</h3>
                  </div>
                </div>
                <div className="auto-step-summary">
                  <span>Auto steps</span>
                  <strong>{data.today.steps.toLocaleString()}</strong>
                  <small>Estimated from logged workouts</small>
                </div>
                <form
                  className="stack"
                  onSubmit={(e) => {
                    e.preventDefault();
                    post("/api/habits/today", habitForm);
                  }}
                >
                  <label>
                    Water glasses
                    <input
                      type="number"
                      value={habitForm.water_glasses}
                      onChange={(e) => setHabitForm({ ...habitForm, water_glasses: Number(e.target.value) })}
                    />
                  </label>
                  <label>
                    Sleep hours
                    <input
                      type="number"
                      step="0.5"
                      value={habitForm.sleep_hours}
                      onChange={(e) => setHabitForm({ ...habitForm, sleep_hours: Number(e.target.value) })}
                    />
                  </label>
                  <label>
                    Move calories
                    <input
                      type="number"
                      value={habitForm.move_calories}
                      onChange={(e) => setHabitForm({ ...habitForm, move_calories: Number(e.target.value) })}
                    />
                  </label>
                  <label>
                    Mood
                    <select value={habitForm.mood} onChange={(e) => setHabitForm({ ...habitForm, mood: e.target.value })}>
                      <option>Focused</option>
                      <option>Energetic</option>
                      <option>Recovered</option>
                      <option>Fatigued</option>
                    </select>
                  </label>
                  <button className="secondary-button" type="submit">
                    Save recovery profile
                  </button>
                </form>
              </article>
            </section>

            <section className="content-grid">
              <article className="panel panel-large">
                <div className="panel-header">
                  <div>
                    <p className="eyebrow">Recent workouts</p>
                    <h3>Session history</h3>
                  </div>
                </div>
                <div className="workout-list">
                  {hasWorkoutData ? (
                    data.workouts.map((workout) => (
                      <div key={workout.id} className="workout-item">
                        <div className="workout-badge">{workout.workout_type[0]}</div>
                        <div>
                          <strong>{workout.name}</strong>
                          <div className="workout-meta">
                            {workout.workout_type} | {workout.minutes} min | {workout.calories} kcal |{" "}
                            {workout.estimated_steps.toLocaleString()} steps - {workout.intensity}
                          </div>
                        </div>
                        <span className="workout-meta">{formatDate(workout.workout_date)}</span>
                      </div>
                    ))
                  ) : (
                    <div className="empty-state">No workouts logged yet. Add your first session from the Programs tab.</div>
                  )}
                </div>
              </article>
              <article className="panel">
                <div className="panel-header">
                  <div>
                    <p className="eyebrow">Goals</p>
                    <h3>Daily targets</h3>
                  </div>
                </div>
                <form
                  className="stack"
                  onSubmit={(e) => {
                    e.preventDefault();
                    post("/api/goals", goalForm);
                  }}
                >
                  <label>
                    Move goal
                    <input
                      type="number"
                      value={goalForm.move_goal}
                      onChange={(e) => setGoalForm({ ...goalForm, move_goal: Number(e.target.value) })}
                    />
                  </label>
                  <label>
                    Water goal (L)
                    <input
                      type="number"
                      step="0.1"
                      value={goalForm.water_goal}
                      onChange={(e) => setGoalForm({ ...goalForm, water_goal: Number(e.target.value) })}
                    />
                  </label>
                  <label>
                    Step goal
                    <input
                      type="number"
                      value={goalForm.step_goal}
                      onChange={(e) => setGoalForm({ ...goalForm, step_goal: Number(e.target.value) })}
                    />
                  </label>
                  <label>
                    Workout goal
                    <input
                      type="number"
                      value={goalForm.workout_goal}
                      onChange={(e) => setGoalForm({ ...goalForm, workout_goal: Number(e.target.value) })}
                    />
                  </label>
                  <button className="primary-button" type="submit">
                    Update goals
                  </button>
                </form>
              </article>
            </section>
          </>
        )}

        {activeTab === "planner" && (
          <section className="content-grid">
            <article className="panel panel-large">
              <div className="panel-header">
                <div>
                  <p className="eyebrow">Programs</p>
                  <h3>Structured training blocks</h3>
                </div>
              </div>
              <div className="plan-grid">
                {data.plans.map((plan) => (
                  <div key={plan.title} className="plan-card">
                    <p className="eyebrow">{plan.subtitle}</p>
                    <h4>{plan.title}</h4>
                    <div className="plan-meta">
                      {[plan.duration, plan.schedule, plan.level].filter(Boolean).map((item) => (
                        <span key={item}>{item}</span>
                      ))}
                    </div>
                    <div className="program-progress">
                      <div>
                        <strong>{plan.completed_sessions || 0}</strong>
                        <span> / {plan.total_sessions} sessions</span>
                      </div>
                      <div className="progress-track">
                        <span style={{ width: `${plan.progress || 0}%` }}></span>
                      </div>
                    </div>
                    <p>{plan.description}</p>
                    {plan.workout && (
                      <div className="button-row">
                        <button
                          className="plan-template-button"
                          type="button"
                          onClick={() =>
                            setWorkoutForm({
                              name: plan.workout.name,
                              workout_type: plan.workout.workout_type,
                              minutes: plan.workout.minutes,
                              calories: plan.workout.calories,
                              intensity: plan.workout.intensity,
                              notes: plan.title,
                              program_title: plan.title
                            })
                          }
                        >
                          Use template
                        </button>
                        <button
                          className="plan-template-button"
                          type="button"
                          onClick={() => post("/api/program-progress", { program_title: plan.title, delta: 1 })}
                        >
                          Mark session
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </article>
            <article className="panel">
              <div className="panel-header">
                <div>
                  <p className="eyebrow">Log a workout</p>
                  <h3>Add today's session</h3>
                </div>
              </div>
              <form
                className="stack"
                onSubmit={(e) => {
                  e.preventDefault();
                  post("/api/workouts", workoutForm).then(() =>
                    setWorkoutForm({
                      name: "",
                      workout_type: "Strength",
                      minutes: 45,
                      calories: 320,
                      intensity: "Moderate",
                      notes: "",
                      program_title: ""
                    })
                  );
                }}
              >
                <label>
                  Workout name
                  <input
                    value={workoutForm.name}
                    onChange={(e) => setWorkoutForm({ ...workoutForm, name: e.target.value })}
                    required
                  />
                </label>
                <label>
                  Type
                  <select
                    value={workoutForm.workout_type}
                    onChange={(e) => setWorkoutForm({ ...workoutForm, workout_type: e.target.value })}
                  >
                    <option>Strength</option>
                    <option>Walking</option>
                    <option>Running</option>
                    <option>Cardio</option>
                    <option>Yoga</option>
                    <option>Sports</option>
                    <option>Mobility</option>
                  </select>
                </label>
                <div className="two-up">
                  <label>
                    Minutes
                    <input
                      type="number"
                      value={workoutForm.minutes}
                      onChange={(e) => setWorkoutForm({ ...workoutForm, minutes: Number(e.target.value) })}
                    />
                  </label>
                  <label>
                    Calories
                    <input
                      type="number"
                      value={workoutForm.calories}
                      onChange={(e) => setWorkoutForm({ ...workoutForm, calories: Number(e.target.value) })}
                    />
                  </label>
                </div>
                <label>
                  Intensity
                  <select
                    value={workoutForm.intensity}
                    onChange={(e) => setWorkoutForm({ ...workoutForm, intensity: e.target.value })}
                  >
                    <option>Low</option>
                    <option>Moderate</option>
                    <option>High</option>
                  </select>
                </label>
                <label>
                  Notes
                  <textarea
                    value={workoutForm.notes}
                    onChange={(e) => setWorkoutForm({ ...workoutForm, notes: e.target.value })}
                  ></textarea>
                </label>
                {workoutForm.program_title && (
                  <div className="linked-program">
                    <span>Linked program</span>
                    <strong>{workoutForm.program_title}</strong>
                  </div>
                )}
                <button className="primary-button" type="submit">
                  Save workout
                </button>
              </form>
            </article>
          </section>
        )}

        {activeTab === "nutrition" && (
          <section className="content-grid">
            <article className="panel panel-large">
              <div className="panel-header">
                <div>
                  <p className="eyebrow">Macros</p>
                  <h3>Today's nutrition breakdown</h3>
                </div>
              </div>
              <div className="macro-grid">
                {nutritionSplit.map((item) => (
                  <div key={item.label} className={`macro-card tone-${item.tone}`}>
                    <strong>{item.label}</strong>
                    <h4>{item.value} g</h4>
                    <span>{item.percentage}% of tracked macros</span>
                  </div>
                ))}
                <div className="macro-card tone-neutral">
                  <strong>Total calories</strong>
                  <h4>{data.analytics.nutrition.calories}</h4>
                  <span>Tracked today</span>
                </div>
              </div>
              <div className="meal-list">
                {hasMealData ? (
                  data.meals.map((meal) => (
                    <div key={meal.id} className="meal-item">
                      <div>
                        <strong>{meal.title}</strong>
                        <span>{formatDate(meal.meal_date)}</span>
                      </div>
                      <div className="meal-macros">
                        <span>P {meal.protein}</span>
                        <span>C {meal.carbs}</span>
                        <span>F {meal.fats}</span>
                        <strong>{meal.calories} kcal</strong>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-state">No meals tracked yet. Add a meal entry to start building your nutrition summary.</div>
                )}
              </div>
            </article>
            <article className="panel">
              <div className="panel-header">
                <div>
                  <p className="eyebrow">Meal log</p>
                  <h3>Add nutrition entry</h3>
                </div>
              </div>
              <form
                className="stack"
                onSubmit={(e) => {
                  e.preventDefault();
                  post("/api/meals", { ...mealForm, calories: mealCalories }).then(() =>
                    setMealForm({
                      title: "",
                      food: CUSTOM_FOOD,
                      servings: 1,
                      protein: 25,
                      carbs: 40,
                      fats: 10
                    })
                  );
                }}
              >
                <label>
                  Food
                  <select value={mealForm.food} onChange={(e) => updateMealFood(e.target.value)}>
                    <option>{CUSTOM_FOOD}</option>
                    {Object.entries(FOOD_PRESETS).map(([name, preset]) => (
                      <option key={name} value={name}>
                        {name} ({preset.serving})
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Meal title
                  <input
                    value={mealForm.title}
                    onChange={(e) => setMealForm({ ...mealForm, title: e.target.value })}
                    required
                  />
                </label>
                <label>
                  Servings
                  <input
                    type="number"
                    min="0"
                    step="0.25"
                    value={mealForm.servings}
                    onChange={(e) => updateMealServings(e.target.value)}
                  />
                </label>
                <div className="two-up">
                  <label>
                    Protein
                    <input
                      type="number"
                      value={mealForm.protein}
                      onChange={(e) => setMealForm({ ...mealForm, food: CUSTOM_FOOD, protein: Number(e.target.value) })}
                    />
                  </label>
                  <label>
                    Carbs
                    <input
                      type="number"
                      value={mealForm.carbs}
                      onChange={(e) => setMealForm({ ...mealForm, food: CUSTOM_FOOD, carbs: Number(e.target.value) })}
                    />
                  </label>
                </div>
                <label>
                  Fats
                  <input
                    type="number"
                    value={mealForm.fats}
                    onChange={(e) => setMealForm({ ...mealForm, food: CUSTOM_FOOD, fats: Number(e.target.value) })}
                  />
                </label>
                <div className="auto-calorie-summary">
                  <span>Auto calories</span>
                  <strong>{mealCalories.toLocaleString()} kcal</strong>
                  <small>Protein and carbs count as 4 kcal/g. Fats count as 9 kcal/g.</small>
                </div>
                <button className="secondary-button" type="submit">
                  Save meal
                </button>
              </form>
            </article>
          </section>
        )}

        {activeTab === "progress" && (
          <>
            <section className="content-grid">
              <article className="panel panel-large">
                <div className="panel-header">
                  <div>
                    <p className="eyebrow">Achievements</p>
                    <h3>{unlockedBadges} badges unlocked</h3>
                  </div>
                </div>
                <div className="badge-grid">
                  {(data.achievements || []).map((badge) => (
                    <div key={badge.title} className={`badge-card ${badge.unlocked ? "unlocked" : ""}`}>
                      <strong>{badge.title}</strong>
                      <span>{badge.description}</span>
                    </div>
                  ))}
                </div>
              </article>
              <article className="panel">
                <div className="panel-header">
                  <div>
                    <p className="eyebrow">Dashboard</p>
                    <h3>Customize cards</h3>
                  </div>
                </div>
                <div className="toggle-list">
                  {statsCards.map((card) => (
                    <label key={card.key} className="toggle-row">
                      <input
                        type="checkbox"
                        checked={Boolean(visibleCards[card.key])}
                        onChange={() => setVisibleCards({ ...visibleCards, [card.key]: !visibleCards[card.key] })}
                      />
                      <span>{card.eyebrow}</span>
                    </label>
                  ))}
                </div>
              </article>
            </section>

            <section className="content-grid">
              <article className="panel panel-large">
                <div className="panel-header">
                  <div>
                    <p className="eyebrow">Body metrics</p>
                    <h3>Track physical changes</h3>
                  </div>
                </div>
                <div className="metric-list">
                  {(data.body_metrics || []).length ? (
                    data.body_metrics.map((metric) => (
                      <div key={metric.id} className="metric-row">
                        <strong>{formatDate(metric.entry_date)}</strong>
                        <span>{metric.weight} kg</span>
                        <span>{metric.body_fat}% fat</span>
                        <span>{metric.waist} cm waist</span>
                      </div>
                    ))
                  ) : (
                    <div className="empty-state">No body metrics yet. Add a baseline entry to start tracking.</div>
                  )}
                </div>
              </article>
              <article className="panel">
                <div className="panel-header">
                  <div>
                    <p className="eyebrow">Metrics</p>
                    <h3>Add entry</h3>
                  </div>
                </div>
                <form
                  className="stack"
                  onSubmit={(e) => {
                    e.preventDefault();
                    post("/api/body-metrics", metricForm).then(() =>
                      setMetricForm({ ...metricForm, notes: "" })
                    );
                  }}
                >
                  <div className="two-up">
                    <label>
                      Weight (kg)
                      <input
                        type="number"
                        step="0.1"
                        value={metricForm.weight}
                        onChange={(e) => setMetricForm({ ...metricForm, weight: e.target.value })}
                        required
                      />
                    </label>
                    <label>
                      Body fat (%)
                      <input
                        type="number"
                        step="0.1"
                        value={metricForm.body_fat}
                        onChange={(e) => setMetricForm({ ...metricForm, body_fat: e.target.value })}
                      />
                    </label>
                  </div>
                  <div className="two-up">
                    <label>
                      Waist (cm)
                      <input
                        type="number"
                        step="0.1"
                        value={metricForm.waist}
                        onChange={(e) => setMetricForm({ ...metricForm, waist: e.target.value })}
                      />
                    </label>
                    <label>
                      Chest (cm)
                      <input
                        type="number"
                        step="0.1"
                        value={metricForm.chest}
                        onChange={(e) => setMetricForm({ ...metricForm, chest: e.target.value })}
                      />
                    </label>
                  </div>
                  <label>
                    Arms (cm)
                    <input
                      type="number"
                      step="0.1"
                      value={metricForm.arms}
                      onChange={(e) => setMetricForm({ ...metricForm, arms: e.target.value })}
                    />
                  </label>
                  <label>
                    Notes
                    <textarea value={metricForm.notes} onChange={(e) => setMetricForm({ ...metricForm, notes: e.target.value })}></textarea>
                  </label>
                  <button className="secondary-button" type="submit">
                    Save metrics
                  </button>
                </form>
              </article>
            </section>
          </>
        )}

        {activeTab === "library" && (
          <section className="content-grid">
            <article className="panel panel-large">
              <div className="panel-header">
                <div>
                  <p className="eyebrow">Exercise library</p>
                  <h3>Find a movement</h3>
                </div>
              </div>
              <div className="library-filters">
                <input
                  value={exerciseQuery}
                  onChange={(e) => setExerciseQuery(e.target.value)}
                  placeholder="Search exercise, muscle, equipment"
                />
                <select value={exerciseFilter} onChange={(e) => setExerciseFilter(e.target.value)}>
                  {exerciseGroups.map((group) => (
                    <option key={group}>{group}</option>
                  ))}
                </select>
              </div>
              <div className="exercise-grid">
                {filteredExercises.map((exercise) => (
                  <div key={exercise.name} className="exercise-card">
                    <p className="eyebrow">{exercise.group}</p>
                    <h4>{exercise.name}</h4>
                    <div className="plan-meta">
                      <span>{exercise.equipment}</span>
                      <span>{exercise.difficulty}</span>
                    </div>
                    <p>{exercise.cue}</p>
                    <button
                      className="plan-template-button"
                      type="button"
                      onClick={() => {
                        setWorkoutForm({
                          name: exercise.name,
                          workout_type: exercise.workout_type,
                          minutes: exercise.minutes,
                          calories: exercise.calories,
                          intensity: exercise.difficulty === "Advanced" ? "High" : "Moderate",
                          notes: exercise.cue,
                          program_title: ""
                        });
                        setActiveTab("planner");
                      }}
                    >
                      Add to workout
                    </button>
                  </div>
                ))}
              </div>
            </article>
            <article className="panel">
              <div className="panel-header">
                <div>
                  <p className="eyebrow">Workout timer</p>
                  <h3>Intervals</h3>
                </div>
              </div>
              <WorkoutTimer />
            </article>
          </section>
        )}

        {activeTab === "history" && (
          <section className="content-grid">
            <article className="panel panel-large">
              <div className="panel-header">
                <div>
                  <p className="eyebrow">Activity archive</p>
                  <h3>Last seven days</h3>
                </div>
              </div>
              <div className="history-table">
                {data.weekly.map((item) => (
                  <div key={item.date} className="history-row">
                    <strong>{formatDate(item.date)}</strong>
                    <span>{item.minutes} minutes</span>
                    <span>{item.calories} kcal</span>
                  </div>
                ))}
              </div>
            </article>
            <article className="panel">
              <div className="panel-header">
                <div>
                  <p className="eyebrow">Highlights</p>
                  <h3>What's improving</h3>
                </div>
              </div>
              <div className="insight-list">
                <div className="insight-card">
                  <strong>Consistency</strong>
                  <p>
                    {data.analytics.streak} active days in a row with at least 20 minutes of
                    training.
                  </p>
                </div>
                <div className="insight-card">
                  <strong>Energy balance</strong>
                  <p>{data.analytics.weekly_calories} kcal burned this week from logged sessions.</p>
                </div>
                <div className="insight-card">
                  <strong>Recovery</strong>
                  <p>
                    Sleep is currently {data.today.sleep_hours} hours and hydration is{" "}
                    {(data.today.water_glasses * 0.25).toFixed(1)} liters.
                  </p>
                </div>
              </div>
            </article>
          </section>
        )}
      </main>
    </div>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isAuthed, setIsAuthed] = useState(Boolean(localStorage.getItem("fitly-token")));

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const dashboard = await api("/api/dashboard");
      setData(dashboard);
      if (dashboard.user) {
        setUser(dashboard.user);
      }
      setError("");
      setIsAuthed(true);
    } catch (err) {
      if (String(err.message).toLowerCase().includes("unauthorized")) {
        localStorage.removeItem("fitly-token");
        setIsAuthed(false);
        setUser(null);
        setData(null);
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!localStorage.getItem("fitly-token")) {
      setLoading(false);
      return;
    }
    loadDashboard();
  }, []);

  const onAuth = async (authedUser) => {
    setUser(authedUser);
    setIsAuthed(true);
    await loadDashboard();
  };

  const onLogout = () => {
    localStorage.removeItem("fitly-token");
    setIsAuthed(false);
    setUser(null);
    setData(null);
  };

  if (!isAuthed) {
    return <AuthScreen onAuth={onAuth} />;
  }

  if (loading && !data) {
    return <div className="loading-state">Loading your fitness dashboard...</div>;
  }

  if (error && !data) {
    return <div className="loading-state">Unable to load the app: {error}</div>;
  }

  return <Dashboard user={user} data={data} onRefresh={loadDashboard} onLogout={onLogout} />;
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
