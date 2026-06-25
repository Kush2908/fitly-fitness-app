const {
  useEffect,
  useMemo,
  useState
} = React;
const api = async (path, options = {}, token = localStorage.getItem("fitly-token")) => {
  const response = await fetch(path, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? {
        Authorization: `Bearer ${token}`
      } : {}),
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
const formatDate = value => new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
  month: "short",
  day: "numeric"
});
const formatCount = (value, singular, plural = `${singular}s`) => `${Number(value || 0).toLocaleString()} ${Number(value || 0) === 1 ? singular : plural}`;
const formatMetric = (value, unit) => {
  const formattedValue = Number(value || 0).toLocaleString();
  return unit ? `${formattedValue} ${unit}` : formattedValue;
};
const CUSTOM_FOOD = "Custom meal";
const FOOD_PRESETS = {
  "Oats with banana": {
    serving: "1 bowl",
    protein: 12,
    carbs: 62,
    fats: 8
  },
  "Eggs and toast": {
    serving: "2 eggs + 2 toast",
    protein: 22,
    carbs: 30,
    fats: 16
  },
  "Dal rice": {
    serving: "1 plate",
    protein: 14,
    carbs: 72,
    fats: 9
  },
  "Paneer roti meal": {
    serving: "1 plate",
    protein: 24,
    carbs: 48,
    fats: 22
  },
  "Chicken rice bowl": {
    serving: "1 bowl",
    protein: 38,
    carbs: 58,
    fats: 10
  },
  "Idli sambar": {
    serving: "3 idli + sambar",
    protein: 12,
    carbs: 64,
    fats: 5
  },
  "Poha with peanuts": {
    serving: "1 plate",
    protein: 9,
    carbs: 55,
    fats: 12
  },
  "Rajma chawal": {
    serving: "1 plate",
    protein: 16,
    carbs: 78,
    fats: 8
  },
  "Masala dosa": {
    serving: "1 dosa + sambar",
    protein: 11,
    carbs: 62,
    fats: 15
  },
  "Grilled fish meal": {
    serving: "1 plate",
    protein: 36,
    carbs: 34,
    fats: 12
  },
  "Sprouts chaat": {
    serving: "1 bowl",
    protein: 16,
    carbs: 32,
    fats: 5
  },
  "Greek yogurt bowl": {
    serving: "1 bowl",
    protein: 24,
    carbs: 32,
    fats: 6
  },
  "Protein shake": {
    serving: "1 shake",
    protein: 28,
    carbs: 10,
    fats: 4
  },
  "Chickpea salad": {
    serving: "1 bowl",
    protein: 18,
    carbs: 42,
    fats: 12
  }
};
const calculateMealCalories = ({
  protein,
  carbs,
  fats
}) => Math.max(Math.round(Number(protein || 0) * 4 + Number(carbs || 0) * 4 + Number(fats || 0) * 9), 0);
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
  steps: {
    label: "Steps",
    unit: "",
    color: "var(--orange)"
  },
  minutes: {
    label: "Training minutes",
    unit: "m",
    color: "var(--blue)"
  },
  nutrition_calories: {
    label: "Food calories",
    unit: " kcal",
    color: "var(--rose)"
  },
  protein: {
    label: "Protein",
    unit: "g",
    color: "var(--green)"
  },
  sleep_hours: {
    label: "Sleep",
    unit: "h",
    color: "var(--sand)"
  }
};
const formatTimer = seconds => {
  const mins = Math.floor(seconds / 60).toString().padStart(2, "0");
  const secs = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
};
function AuthScreen({
  onAuth
}) {
  const [mode, setMode] = useState("signup");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    setForm({
      name: "",
      email: "",
      password: ""
    });
    const timers = [100, 400, 900].map(delay => window.setTimeout(() => setForm({
      name: "",
      email: "",
      password: ""
    }), delay));
    return () => timers.forEach(timer => window.clearTimeout(timer));
  }, [mode]);
  const submit = async event => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const payload = mode === "signup" ? form : {
        email: form.email,
        password: form.password
      };
      const data = await api(`/api/auth/${mode === "signup" ? "register" : "login"}`, {
        method: "POST",
        body: JSON.stringify(payload)
      }, null);
      localStorage.setItem("fitly-token", data.token);
      onAuth(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "auth-shell"
  }, /*#__PURE__*/React.createElement("section", {
    className: "auth-hero"
  }, /*#__PURE__*/React.createElement("div", {
    className: "fitly-logo",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("div", {
    className: "fitly-logo-orbit orbit-one"
  }), /*#__PURE__*/React.createElement("div", {
    className: "fitly-logo-orbit orbit-two"
  }), /*#__PURE__*/React.createElement("div", {
    className: "fitly-logo-core"
  }, /*#__PURE__*/React.createElement("div", {
    className: "fitly-logo-mark"
  }, /*#__PURE__*/React.createElement("span", {
    className: "fitly-logo-stem"
  }), /*#__PURE__*/React.createElement("span", {
    className: "fitly-logo-arm top"
  }), /*#__PURE__*/React.createElement("span", {
    className: "fitly-logo-arm mid"
  }), /*#__PURE__*/React.createElement("span", {
    className: "fitly-logo-pulse"
  })))), /*#__PURE__*/React.createElement("p", {
    className: "eyebrow"
  }, "Fitness platform"), /*#__PURE__*/React.createElement("h1", null, "Fitly"), /*#__PURE__*/React.createElement("p", null, "Track workouts, plan routines, monitor recovery, and manage nutrition in one clean dashboard.")), /*#__PURE__*/React.createElement("section", {
    className: "auth-card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "mode-toggle"
  }, /*#__PURE__*/React.createElement("button", {
    className: mode === "signup" ? "active" : "",
    onClick: () => setMode("signup")
  }, "Create account"), /*#__PURE__*/React.createElement("button", {
    className: mode === "login" ? "active" : "",
    onClick: () => setMode("login")
  }, "Log in")), /*#__PURE__*/React.createElement("form", {
    className: "stack",
    onSubmit: submit,
    autoComplete: "off"
  }, mode === "signup" && /*#__PURE__*/React.createElement("label", null, "Full name", /*#__PURE__*/React.createElement("input", {
    name: "fitly-display-name",
    autoComplete: "off",
    value: form.name,
    onChange: e => setForm({
      ...form,
      name: e.target.value
    }),
    required: true
  })), /*#__PURE__*/React.createElement("label", null, "Email", /*#__PURE__*/React.createElement("input", {
    type: "email",
    name: "fitly-email",
    autoComplete: "off",
    inputMode: "email",
    value: form.email,
    onChange: e => setForm({
      ...form,
      email: e.target.value
    }),
    required: true
  })), /*#__PURE__*/React.createElement("label", null, "Password", /*#__PURE__*/React.createElement("input", {
    type: "password",
    name: "fitly-passcode",
    autoComplete: "new-password",
    value: form.password,
    onChange: e => setForm({
      ...form,
      password: e.target.value
    }),
    required: true
  })), error && /*#__PURE__*/React.createElement("div", {
    className: "error-banner"
  }, error), /*#__PURE__*/React.createElement("button", {
    type: "submit",
    className: "primary-button",
    disabled: loading
  }, loading ? "Please wait..." : mode === "signup" ? "Create your profile" : "Enter dashboard"))));
}
function Ring({
  label,
  value,
  max,
  tone
}) {
  const ratio = Math.min(value / max, 1);
  const circumference = 2 * Math.PI * 44;
  const offset = circumference * (1 - ratio);
  return /*#__PURE__*/React.createElement("div", {
    className: `ring ring-${tone}`
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 120 120"
  }, /*#__PURE__*/React.createElement("circle", {
    className: "ring-track",
    cx: "60",
    cy: "60",
    r: "44"
  }), /*#__PURE__*/React.createElement("circle", {
    className: "ring-progress",
    cx: "60",
    cy: "60",
    r: "44",
    style: {
      strokeDasharray: circumference,
      strokeDashoffset: offset
    }
  })), /*#__PURE__*/React.createElement("div", {
    className: "ring-content"
  }, /*#__PURE__*/React.createElement("span", null, label), /*#__PURE__*/React.createElement("strong", null, Math.round(value))));
}
function TrendChart({
  items,
  metric,
  compact = false
}) {
  const config = CHARTS[metric] || CHARTS.steps;
  const values = items.map(item => Number(item[metric] || 0));
  const max = Math.max(...values, 1);
  return /*#__PURE__*/React.createElement("div", {
    className: `trend-chart ${compact ? "trend-chart-compact" : ""}`
  }, items.map(item => {
    const value = Number(item[metric] || 0);
    const height = Math.max(value / max * 100, value > 0 ? 10 : 3);
    return /*#__PURE__*/React.createElement("div", {
      className: "trend-column",
      key: `${item.date}-${metric}`
    }, /*#__PURE__*/React.createElement("div", {
      className: "trend-bar-wrap"
    }, /*#__PURE__*/React.createElement("div", {
      className: "trend-bar",
      style: {
        height: `${height}%`,
        background: config.color
      },
      title: `${config.label}: ${value}${config.unit}`
    })), /*#__PURE__*/React.createElement("span", null, item.label));
  }));
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
      setSecondsLeft(current => {
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
        setRound(value => value + 1);
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
  return /*#__PURE__*/React.createElement("div", {
    className: "timer-tool"
  }, /*#__PURE__*/React.createElement("div", {
    className: "timer-display"
  }, /*#__PURE__*/React.createElement("span", null, phase), /*#__PURE__*/React.createElement("strong", null, formatTimer(secondsLeft)), /*#__PURE__*/React.createElement("small", null, "Round ", Math.min(round, rounds), " of ", rounds)), /*#__PURE__*/React.createElement("div", {
    className: "timer-controls-grid"
  }, /*#__PURE__*/React.createElement("label", null, "Work", /*#__PURE__*/React.createElement("input", {
    type: "number",
    value: workSeconds,
    onChange: e => setWorkSeconds(Number(e.target.value) || 1)
  })), /*#__PURE__*/React.createElement("label", null, "Rest", /*#__PURE__*/React.createElement("input", {
    type: "number",
    value: restSeconds,
    onChange: e => setRestSeconds(Number(e.target.value) || 1)
  })), /*#__PURE__*/React.createElement("label", null, "Rounds", /*#__PURE__*/React.createElement("input", {
    type: "number",
    value: rounds,
    onChange: e => setRounds(Number(e.target.value) || 1)
  }))), /*#__PURE__*/React.createElement("div", {
    className: "button-row"
  }, /*#__PURE__*/React.createElement("button", {
    className: "primary-button",
    type: "button",
    onClick: () => setRunning(value => !value)
  }, running ? "Pause" : "Start"), /*#__PURE__*/React.createElement("button", {
    className: "ghost-button",
    type: "button",
    onClick: resetTimer
  }, "Reset")));
}
function Dashboard({
  user,
  data,
  onRefresh,
  onLogout
}) {
  const hasWorkoutData = data.workouts.length > 0;
  const hasMealData = data.meals.length > 0;
  const hasWeeklyActivity = data.weekly.some(item => item.minutes > 0);
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
      return {
        ...DEFAULT_CARDS,
        ...JSON.parse(localStorage.getItem("fitly-dashboard-cards") || "{}")
      };
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
    const total = data.analytics.nutrition.protein + data.analytics.nutrition.carbs + data.analytics.nutrition.fats;
    if (!total) {
      return [];
    }
    return [{
      label: "Protein",
      value: data.analytics.nutrition.protein,
      tone: "orange"
    }, {
      label: "Carbs",
      value: data.analytics.nutrition.carbs,
      tone: "blue"
    }, {
      label: "Fats",
      value: data.analytics.nutrition.fats,
      tone: "green"
    }].map(item => ({
      ...item,
      percentage: Math.round(item.value / total * 100)
    }));
  }, [data.analytics.nutrition]);
  const mealCalories = useMemo(() => calculateMealCalories(mealForm), [mealForm]);
  const updateMealFood = food => {
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
  const updateMealServings = value => {
    const servings = Math.max(Number(value) || 0, 0);
    if (mealForm.food === CUSTOM_FOOD) {
      setMealForm({
        ...mealForm,
        servings
      });
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
  const exerciseGroups = ["All", ...Array.from(new Set(exercises.map(exercise => exercise.group)))];
  const filteredExercises = exercises.filter(exercise => {
    const matchesGroup = exerciseFilter === "All" || exercise.group === exerciseFilter;
    const haystack = `${exercise.name} ${exercise.group} ${exercise.equipment} ${exercise.difficulty}`.toLowerCase();
    return matchesGroup && haystack.includes(exerciseQuery.toLowerCase());
  });
  const quest = data.daily_quest || {
    title: "Daily quest",
    progress: 0,
    current: 0,
    target: 1,
    unit: "",
    description: ""
  };
  const coach = data.coach_feedback || {
    title: "Coach",
    message: "",
    focus: ""
  };
  const unlockedBadges = (data.achievements || []).filter(badge => badge.unlocked).length;
  const statsCards = [{
    key: "steps",
    className: "accent-orange",
    eyebrow: "Today",
    value: data.today.steps.toLocaleString(),
    label: "Steps auto-tracked"
  }, {
    key: "hydration",
    className: "accent-green",
    eyebrow: "Hydration",
    value: `${(data.today.water_glasses * 0.25).toFixed(1)} L`,
    label: `${formatCount(data.today.water_glasses, "glass", "glasses")} logged`
  }, {
    key: "load",
    className: "accent-blue",
    eyebrow: "Weekly load",
    value: `${data.analytics.weekly_minutes} min`,
    label: formatCount(data.analytics.weekly_workouts, "active day", "active days")
  }, {
    key: "streak",
    className: "accent-rose",
    eyebrow: "Streak",
    value: formatCount(data.analytics.streak, "day"),
    label: "Stay consistent"
  }];
  const post = async (path, payload) => {
    await api(path, {
      method: "POST",
      body: JSON.stringify(payload)
    });
    setNotice("Saved");
    await onRefresh();
    window.setTimeout(() => setNotice(""), 1400);
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "app-shell"
  }, /*#__PURE__*/React.createElement("aside", {
    className: "sidebar"
  }, /*#__PURE__*/React.createElement("div", {
    className: "brand"
  }, /*#__PURE__*/React.createElement("div", {
    className: "brand-mark"
  }, "F"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    className: "eyebrow"
  }, "Fitness dashboard"), /*#__PURE__*/React.createElement("h2", null, "Fitly"))), /*#__PURE__*/React.createElement("div", {
    className: "user-chip"
  }, /*#__PURE__*/React.createElement("strong", null, user?.name || "Athlete"), /*#__PURE__*/React.createElement("button", {
    className: "ghost-button",
    onClick: onLogout
  }, "Log out")), /*#__PURE__*/React.createElement("nav", {
    className: "nav-links"
  }, ["dashboard", "planner", "nutrition", "progress", "library", "history"].map(tab => /*#__PURE__*/React.createElement("button", {
    key: tab,
    className: activeTab === tab ? "active" : "",
    onClick: () => setActiveTab(tab)
  }, tab === "dashboard" && "Dashboard", tab === "planner" && "Programs", tab === "nutrition" && "Nutrition", tab === "progress" && "Progress", tab === "library" && "Library", tab === "history" && "History"))), /*#__PURE__*/React.createElement("div", {
    className: "sidebar-card"
  }, /*#__PURE__*/React.createElement("p", {
    className: "eyebrow"
  }, "Coach score"), /*#__PURE__*/React.createElement("h3", null, data.analytics.coach_score), /*#__PURE__*/React.createElement("strong", null, coach.title), /*#__PURE__*/React.createElement("p", null, coach.message)), /*#__PURE__*/React.createElement("div", {
    className: "challenge-list"
  }, data.challenges.map(challenge => /*#__PURE__*/React.createElement("div", {
    key: challenge.title,
    className: "challenge-item"
  }, /*#__PURE__*/React.createElement("strong", null, challenge.title), /*#__PURE__*/React.createElement("span", null, challenge.progress, "% complete"))))), /*#__PURE__*/React.createElement("main", {
    className: "main-content"
  }, /*#__PURE__*/React.createElement("section", {
    className: "hero"
  }, /*#__PURE__*/React.createElement("div", {
    className: "hero-copy"
  }, /*#__PURE__*/React.createElement("p", {
    className: "eyebrow"
  }, "Personal fitness tracker"), /*#__PURE__*/React.createElement("h1", null, "Track workouts, recovery, nutrition, and progress in one place."), /*#__PURE__*/React.createElement("p", null, "Log daily activity, follow training plans, and review your progress with simple account-based storage."), notice && /*#__PURE__*/React.createElement("div", {
    className: "notice-chip"
  }, notice)), /*#__PURE__*/React.createElement("div", {
    className: "hero-rings"
  }, /*#__PURE__*/React.createElement(Ring, {
    label: "Move",
    value: data.today.move_calories,
    max: data.goals.move_goal,
    tone: "orange"
  }), /*#__PURE__*/React.createElement(Ring, {
    label: "Recovery",
    value: data.analytics.coach_score,
    max: 100,
    tone: "green"
  }))), /*#__PURE__*/React.createElement("section", {
    className: "stats-grid"
  }, statsCards.filter(card => visibleCards[card.key]).map(card => /*#__PURE__*/React.createElement("article", {
    key: card.key,
    className: `stat-card ${card.className}`
  }, /*#__PURE__*/React.createElement("p", {
    className: "eyebrow"
  }, card.eyebrow), /*#__PURE__*/React.createElement("h3", null, card.value), /*#__PURE__*/React.createElement("span", null, card.label)))), activeTab === "dashboard" && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("section", {
    className: "content-grid"
  }, /*#__PURE__*/React.createElement("article", {
    className: "panel quest-panel"
  }, /*#__PURE__*/React.createElement("div", {
    className: "panel-header"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    className: "eyebrow"
  }, "Daily quest"), /*#__PURE__*/React.createElement("h3", null, quest.title)), /*#__PURE__*/React.createElement("span", {
    className: quest.completed ? "status-chip unlocked" : "status-chip"
  }, quest.completed ? "Complete" : `${quest.progress}%`)), /*#__PURE__*/React.createElement("p", null, quest.description), /*#__PURE__*/React.createElement("div", {
    className: "progress-track"
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: `${quest.progress}%`
    }
  })), /*#__PURE__*/React.createElement("div", {
    className: "quest-numbers"
  }, /*#__PURE__*/React.createElement("strong", null, formatMetric(quest.current, quest.unit)), /*#__PURE__*/React.createElement("span", null, "Target ", formatMetric(quest.target, quest.unit)))), /*#__PURE__*/React.createElement("article", {
    className: "panel coach-panel"
  }, /*#__PURE__*/React.createElement("p", {
    className: "eyebrow"
  }, "Coach feedback"), /*#__PURE__*/React.createElement("h3", null, coach.title), /*#__PURE__*/React.createElement("p", null, coach.message), /*#__PURE__*/React.createElement("div", {
    className: "coach-focus"
  }, /*#__PURE__*/React.createElement("span", null, "Focus"), /*#__PURE__*/React.createElement("strong", null, coach.focus)))), /*#__PURE__*/React.createElement("section", {
    className: "content-grid"
  }, /*#__PURE__*/React.createElement("article", {
    className: "panel panel-large"
  }, /*#__PURE__*/React.createElement("div", {
    className: "panel-header"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    className: "eyebrow"
  }, "Progress charts"), /*#__PURE__*/React.createElement("h3", null, CHARTS[chartMetric].label)), /*#__PURE__*/React.createElement("select", {
    className: "compact-select",
    value: chartMetric,
    onChange: e => setChartMetric(e.target.value)
  }, Object.entries(CHARTS).map(([key, config]) => /*#__PURE__*/React.createElement("option", {
    key: key,
    value: key
  }, config.label)))), /*#__PURE__*/React.createElement(TrendChart, {
    items: history,
    metric: chartMetric
  }), !hasWeeklyActivity && /*#__PURE__*/React.createElement("div", {
    className: "empty-state"
  }, "No workouts yet. Add your first workout and your weekly activity chart will appear here.")), /*#__PURE__*/React.createElement("article", {
    className: "panel"
  }, /*#__PURE__*/React.createElement("div", {
    className: "panel-header"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    className: "eyebrow"
  }, "Recovery inputs"), /*#__PURE__*/React.createElement("h3", null, "Update today"))), /*#__PURE__*/React.createElement("div", {
    className: "auto-step-summary"
  }, /*#__PURE__*/React.createElement("span", null, "Auto steps"), /*#__PURE__*/React.createElement("strong", null, data.today.steps.toLocaleString()), /*#__PURE__*/React.createElement("small", null, "Estimated from logged workouts")), /*#__PURE__*/React.createElement("form", {
    className: "stack",
    onSubmit: e => {
      e.preventDefault();
      post("/api/habits/today", habitForm);
    }
  }, /*#__PURE__*/React.createElement("label", null, "Water glasses", /*#__PURE__*/React.createElement("input", {
    type: "number",
    value: habitForm.water_glasses,
    onChange: e => setHabitForm({
      ...habitForm,
      water_glasses: Number(e.target.value)
    })
  })), /*#__PURE__*/React.createElement("label", null, "Sleep hours", /*#__PURE__*/React.createElement("input", {
    type: "number",
    step: "0.5",
    value: habitForm.sleep_hours,
    onChange: e => setHabitForm({
      ...habitForm,
      sleep_hours: Number(e.target.value)
    })
  })), /*#__PURE__*/React.createElement("label", null, "Move calories", /*#__PURE__*/React.createElement("input", {
    type: "number",
    value: habitForm.move_calories,
    onChange: e => setHabitForm({
      ...habitForm,
      move_calories: Number(e.target.value)
    })
  })), /*#__PURE__*/React.createElement("label", null, "Mood", /*#__PURE__*/React.createElement("select", {
    value: habitForm.mood,
    onChange: e => setHabitForm({
      ...habitForm,
      mood: e.target.value
    })
  }, /*#__PURE__*/React.createElement("option", null, "Focused"), /*#__PURE__*/React.createElement("option", null, "Energetic"), /*#__PURE__*/React.createElement("option", null, "Recovered"), /*#__PURE__*/React.createElement("option", null, "Fatigued"))), /*#__PURE__*/React.createElement("button", {
    className: "secondary-button",
    type: "submit"
  }, "Save recovery profile")))), /*#__PURE__*/React.createElement("section", {
    className: "content-grid"
  }, /*#__PURE__*/React.createElement("article", {
    className: "panel panel-large"
  }, /*#__PURE__*/React.createElement("div", {
    className: "panel-header"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    className: "eyebrow"
  }, "Recent workouts"), /*#__PURE__*/React.createElement("h3", null, "Session history"))), /*#__PURE__*/React.createElement("div", {
    className: "workout-list"
  }, hasWorkoutData ? data.workouts.map(workout => /*#__PURE__*/React.createElement("div", {
    key: workout.id,
    className: "workout-item"
  }, /*#__PURE__*/React.createElement("div", {
    className: "workout-badge"
  }, workout.workout_type[0]), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("strong", null, workout.name), /*#__PURE__*/React.createElement("div", {
    className: "workout-meta"
  }, workout.workout_type, " | ", workout.minutes, " min | ", workout.calories, " kcal |", " ", workout.estimated_steps.toLocaleString(), " steps - ", workout.intensity)), /*#__PURE__*/React.createElement("span", {
    className: "workout-meta"
  }, formatDate(workout.workout_date)))) : /*#__PURE__*/React.createElement("div", {
    className: "empty-state"
  }, "No workouts logged yet. Add your first session from the Programs tab."))), /*#__PURE__*/React.createElement("article", {
    className: "panel"
  }, /*#__PURE__*/React.createElement("div", {
    className: "panel-header"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    className: "eyebrow"
  }, "Goals"), /*#__PURE__*/React.createElement("h3", null, "Daily targets"))), /*#__PURE__*/React.createElement("form", {
    className: "stack",
    onSubmit: e => {
      e.preventDefault();
      post("/api/goals", goalForm);
    }
  }, /*#__PURE__*/React.createElement("label", null, "Move goal", /*#__PURE__*/React.createElement("input", {
    type: "number",
    value: goalForm.move_goal,
    onChange: e => setGoalForm({
      ...goalForm,
      move_goal: Number(e.target.value)
    })
  })), /*#__PURE__*/React.createElement("label", null, "Water goal (L)", /*#__PURE__*/React.createElement("input", {
    type: "number",
    step: "0.1",
    value: goalForm.water_goal,
    onChange: e => setGoalForm({
      ...goalForm,
      water_goal: Number(e.target.value)
    })
  })), /*#__PURE__*/React.createElement("label", null, "Step goal", /*#__PURE__*/React.createElement("input", {
    type: "number",
    value: goalForm.step_goal,
    onChange: e => setGoalForm({
      ...goalForm,
      step_goal: Number(e.target.value)
    })
  })), /*#__PURE__*/React.createElement("label", null, "Workout goal", /*#__PURE__*/React.createElement("input", {
    type: "number",
    value: goalForm.workout_goal,
    onChange: e => setGoalForm({
      ...goalForm,
      workout_goal: Number(e.target.value)
    })
  })), /*#__PURE__*/React.createElement("button", {
    className: "primary-button",
    type: "submit"
  }, "Update goals"))))), activeTab === "planner" && /*#__PURE__*/React.createElement("section", {
    className: "content-grid"
  }, /*#__PURE__*/React.createElement("article", {
    className: "panel panel-large"
  }, /*#__PURE__*/React.createElement("div", {
    className: "panel-header"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    className: "eyebrow"
  }, "Programs"), /*#__PURE__*/React.createElement("h3", null, "Structured training blocks"))), /*#__PURE__*/React.createElement("div", {
    className: "plan-grid"
  }, data.plans.map(plan => /*#__PURE__*/React.createElement("div", {
    key: plan.title,
    className: "plan-card"
  }, /*#__PURE__*/React.createElement("p", {
    className: "eyebrow"
  }, plan.subtitle), /*#__PURE__*/React.createElement("h4", null, plan.title), /*#__PURE__*/React.createElement("div", {
    className: "plan-meta"
  }, [plan.duration, plan.schedule, plan.level].filter(Boolean).map(item => /*#__PURE__*/React.createElement("span", {
    key: item
  }, item))), /*#__PURE__*/React.createElement("div", {
    className: "program-progress"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("strong", null, plan.completed_sessions || 0), /*#__PURE__*/React.createElement("span", null, " / ", plan.total_sessions, " sessions")), /*#__PURE__*/React.createElement("div", {
    className: "progress-track"
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: `${plan.progress || 0}%`
    }
  }))), /*#__PURE__*/React.createElement("p", null, plan.description), plan.workout && /*#__PURE__*/React.createElement("div", {
    className: "button-row"
  }, /*#__PURE__*/React.createElement("button", {
    className: "plan-template-button",
    type: "button",
    onClick: () => setWorkoutForm({
      name: plan.workout.name,
      workout_type: plan.workout.workout_type,
      minutes: plan.workout.minutes,
      calories: plan.workout.calories,
      intensity: plan.workout.intensity,
      notes: plan.title,
      program_title: plan.title
    })
  }, "Use template"), /*#__PURE__*/React.createElement("button", {
    className: "plan-template-button",
    type: "button",
    onClick: () => post("/api/program-progress", {
      program_title: plan.title,
      delta: 1
    })
  }, "Mark session")))))), /*#__PURE__*/React.createElement("article", {
    className: "panel"
  }, /*#__PURE__*/React.createElement("div", {
    className: "panel-header"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    className: "eyebrow"
  }, "Log a workout"), /*#__PURE__*/React.createElement("h3", null, "Add today's session"))), /*#__PURE__*/React.createElement("form", {
    className: "stack",
    onSubmit: e => {
      e.preventDefault();
      post("/api/workouts", workoutForm).then(() => setWorkoutForm({
        name: "",
        workout_type: "Strength",
        minutes: 45,
        calories: 320,
        intensity: "Moderate",
        notes: "",
        program_title: ""
      }));
    }
  }, /*#__PURE__*/React.createElement("label", null, "Workout name", /*#__PURE__*/React.createElement("input", {
    value: workoutForm.name,
    onChange: e => setWorkoutForm({
      ...workoutForm,
      name: e.target.value
    }),
    required: true
  })), /*#__PURE__*/React.createElement("label", null, "Type", /*#__PURE__*/React.createElement("select", {
    value: workoutForm.workout_type,
    onChange: e => setWorkoutForm({
      ...workoutForm,
      workout_type: e.target.value
    })
  }, /*#__PURE__*/React.createElement("option", null, "Strength"), /*#__PURE__*/React.createElement("option", null, "Walking"), /*#__PURE__*/React.createElement("option", null, "Running"), /*#__PURE__*/React.createElement("option", null, "Cardio"), /*#__PURE__*/React.createElement("option", null, "Yoga"), /*#__PURE__*/React.createElement("option", null, "Sports"), /*#__PURE__*/React.createElement("option", null, "Mobility"))), /*#__PURE__*/React.createElement("div", {
    className: "two-up"
  }, /*#__PURE__*/React.createElement("label", null, "Minutes", /*#__PURE__*/React.createElement("input", {
    type: "number",
    value: workoutForm.minutes,
    onChange: e => setWorkoutForm({
      ...workoutForm,
      minutes: Number(e.target.value)
    })
  })), /*#__PURE__*/React.createElement("label", null, "Calories", /*#__PURE__*/React.createElement("input", {
    type: "number",
    value: workoutForm.calories,
    onChange: e => setWorkoutForm({
      ...workoutForm,
      calories: Number(e.target.value)
    })
  }))), /*#__PURE__*/React.createElement("label", null, "Intensity", /*#__PURE__*/React.createElement("select", {
    value: workoutForm.intensity,
    onChange: e => setWorkoutForm({
      ...workoutForm,
      intensity: e.target.value
    })
  }, /*#__PURE__*/React.createElement("option", null, "Low"), /*#__PURE__*/React.createElement("option", null, "Moderate"), /*#__PURE__*/React.createElement("option", null, "High"))), /*#__PURE__*/React.createElement("label", null, "Notes", /*#__PURE__*/React.createElement("textarea", {
    value: workoutForm.notes,
    onChange: e => setWorkoutForm({
      ...workoutForm,
      notes: e.target.value
    })
  })), workoutForm.program_title && /*#__PURE__*/React.createElement("div", {
    className: "linked-program"
  }, /*#__PURE__*/React.createElement("span", null, "Linked program"), /*#__PURE__*/React.createElement("strong", null, workoutForm.program_title)), /*#__PURE__*/React.createElement("button", {
    className: "primary-button",
    type: "submit"
  }, "Save workout")))), activeTab === "nutrition" && /*#__PURE__*/React.createElement("section", {
    className: "content-grid"
  }, /*#__PURE__*/React.createElement("article", {
    className: "panel panel-large"
  }, /*#__PURE__*/React.createElement("div", {
    className: "panel-header"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    className: "eyebrow"
  }, "Macros"), /*#__PURE__*/React.createElement("h3", null, "Today's nutrition breakdown"))), /*#__PURE__*/React.createElement("div", {
    className: "macro-grid"
  }, nutritionSplit.map(item => /*#__PURE__*/React.createElement("div", {
    key: item.label,
    className: `macro-card tone-${item.tone}`
  }, /*#__PURE__*/React.createElement("strong", null, item.label), /*#__PURE__*/React.createElement("h4", null, item.value, " g"), /*#__PURE__*/React.createElement("span", null, item.percentage, "% of tracked macros"))), /*#__PURE__*/React.createElement("div", {
    className: "macro-card tone-neutral"
  }, /*#__PURE__*/React.createElement("strong", null, "Total calories"), /*#__PURE__*/React.createElement("h4", null, data.analytics.nutrition.calories), /*#__PURE__*/React.createElement("span", null, "Tracked today"))), /*#__PURE__*/React.createElement("div", {
    className: "meal-list"
  }, hasMealData ? data.meals.map(meal => /*#__PURE__*/React.createElement("div", {
    key: meal.id,
    className: "meal-item"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("strong", null, meal.title), /*#__PURE__*/React.createElement("span", null, formatDate(meal.meal_date))), /*#__PURE__*/React.createElement("div", {
    className: "meal-macros"
  }, /*#__PURE__*/React.createElement("span", null, "P ", meal.protein), /*#__PURE__*/React.createElement("span", null, "C ", meal.carbs), /*#__PURE__*/React.createElement("span", null, "F ", meal.fats), /*#__PURE__*/React.createElement("strong", null, meal.calories, " kcal")))) : /*#__PURE__*/React.createElement("div", {
    className: "empty-state"
  }, "No meals tracked yet. Add a meal entry to start building your nutrition summary."))), /*#__PURE__*/React.createElement("article", {
    className: "panel"
  }, /*#__PURE__*/React.createElement("div", {
    className: "panel-header"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    className: "eyebrow"
  }, "Meal log"), /*#__PURE__*/React.createElement("h3", null, "Add nutrition entry"))), /*#__PURE__*/React.createElement("form", {
    className: "stack",
    onSubmit: e => {
      e.preventDefault();
      post("/api/meals", {
        ...mealForm,
        calories: mealCalories
      }).then(() => setMealForm({
        title: "",
        food: CUSTOM_FOOD,
        servings: 1,
        protein: 25,
        carbs: 40,
        fats: 10
      }));
    }
  }, /*#__PURE__*/React.createElement("label", null, "Food", /*#__PURE__*/React.createElement("select", {
    value: mealForm.food,
    onChange: e => updateMealFood(e.target.value)
  }, /*#__PURE__*/React.createElement("option", null, CUSTOM_FOOD), Object.entries(FOOD_PRESETS).map(([name, preset]) => /*#__PURE__*/React.createElement("option", {
    key: name,
    value: name
  }, name, " (", preset.serving, ")")))), /*#__PURE__*/React.createElement("label", null, "Meal title", /*#__PURE__*/React.createElement("input", {
    value: mealForm.title,
    onChange: e => setMealForm({
      ...mealForm,
      title: e.target.value
    }),
    required: true
  })), /*#__PURE__*/React.createElement("label", null, "Servings", /*#__PURE__*/React.createElement("input", {
    type: "number",
    min: "0",
    step: "0.25",
    value: mealForm.servings,
    onChange: e => updateMealServings(e.target.value)
  })), /*#__PURE__*/React.createElement("div", {
    className: "two-up"
  }, /*#__PURE__*/React.createElement("label", null, "Protein", /*#__PURE__*/React.createElement("input", {
    type: "number",
    value: mealForm.protein,
    onChange: e => setMealForm({
      ...mealForm,
      food: CUSTOM_FOOD,
      protein: Number(e.target.value)
    })
  })), /*#__PURE__*/React.createElement("label", null, "Carbs", /*#__PURE__*/React.createElement("input", {
    type: "number",
    value: mealForm.carbs,
    onChange: e => setMealForm({
      ...mealForm,
      food: CUSTOM_FOOD,
      carbs: Number(e.target.value)
    })
  }))), /*#__PURE__*/React.createElement("label", null, "Fats", /*#__PURE__*/React.createElement("input", {
    type: "number",
    value: mealForm.fats,
    onChange: e => setMealForm({
      ...mealForm,
      food: CUSTOM_FOOD,
      fats: Number(e.target.value)
    })
  })), /*#__PURE__*/React.createElement("div", {
    className: "auto-calorie-summary"
  }, /*#__PURE__*/React.createElement("span", null, "Auto calories"), /*#__PURE__*/React.createElement("strong", null, mealCalories.toLocaleString(), " kcal"), /*#__PURE__*/React.createElement("small", null, "Protein and carbs count as 4 kcal/g. Fats count as 9 kcal/g.")), /*#__PURE__*/React.createElement("button", {
    className: "secondary-button",
    type: "submit"
  }, "Save meal")))), activeTab === "progress" && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("section", {
    className: "content-grid"
  }, /*#__PURE__*/React.createElement("article", {
    className: "panel panel-large"
  }, /*#__PURE__*/React.createElement("div", {
    className: "panel-header"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    className: "eyebrow"
  }, "Achievements"), /*#__PURE__*/React.createElement("h3", null, unlockedBadges, " badges unlocked"))), /*#__PURE__*/React.createElement("div", {
    className: "badge-grid"
  }, (data.achievements || []).map(badge => /*#__PURE__*/React.createElement("div", {
    key: badge.title,
    className: `badge-card ${badge.unlocked ? "unlocked" : ""}`
  }, /*#__PURE__*/React.createElement("strong", null, badge.title), /*#__PURE__*/React.createElement("span", null, badge.description))))), /*#__PURE__*/React.createElement("article", {
    className: "panel"
  }, /*#__PURE__*/React.createElement("div", {
    className: "panel-header"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    className: "eyebrow"
  }, "Dashboard"), /*#__PURE__*/React.createElement("h3", null, "Customize cards"))), /*#__PURE__*/React.createElement("div", {
    className: "toggle-list"
  }, statsCards.map(card => /*#__PURE__*/React.createElement("label", {
    key: card.key,
    className: "toggle-row"
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: Boolean(visibleCards[card.key]),
    onChange: () => setVisibleCards({
      ...visibleCards,
      [card.key]: !visibleCards[card.key]
    })
  }), /*#__PURE__*/React.createElement("span", null, card.eyebrow)))))), /*#__PURE__*/React.createElement("section", {
    className: "content-grid"
  }, /*#__PURE__*/React.createElement("article", {
    className: "panel panel-large"
  }, /*#__PURE__*/React.createElement("div", {
    className: "panel-header"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    className: "eyebrow"
  }, "Body metrics"), /*#__PURE__*/React.createElement("h3", null, "Track physical changes"))), /*#__PURE__*/React.createElement("div", {
    className: "metric-list"
  }, (data.body_metrics || []).length ? data.body_metrics.map(metric => /*#__PURE__*/React.createElement("div", {
    key: metric.id,
    className: "metric-row"
  }, /*#__PURE__*/React.createElement("strong", null, formatDate(metric.entry_date)), /*#__PURE__*/React.createElement("span", null, metric.weight, " kg"), /*#__PURE__*/React.createElement("span", null, metric.body_fat, "% fat"), /*#__PURE__*/React.createElement("span", null, metric.waist, " cm waist"))) : /*#__PURE__*/React.createElement("div", {
    className: "empty-state"
  }, "No body metrics yet. Add a baseline entry to start tracking."))), /*#__PURE__*/React.createElement("article", {
    className: "panel"
  }, /*#__PURE__*/React.createElement("div", {
    className: "panel-header"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    className: "eyebrow"
  }, "Metrics"), /*#__PURE__*/React.createElement("h3", null, "Add entry"))), /*#__PURE__*/React.createElement("form", {
    className: "stack",
    onSubmit: e => {
      e.preventDefault();
      post("/api/body-metrics", metricForm).then(() => setMetricForm({
        ...metricForm,
        notes: ""
      }));
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "two-up"
  }, /*#__PURE__*/React.createElement("label", null, "Weight (kg)", /*#__PURE__*/React.createElement("input", {
    type: "number",
    step: "0.1",
    value: metricForm.weight,
    onChange: e => setMetricForm({
      ...metricForm,
      weight: e.target.value
    }),
    required: true
  })), /*#__PURE__*/React.createElement("label", null, "Body fat (%)", /*#__PURE__*/React.createElement("input", {
    type: "number",
    step: "0.1",
    value: metricForm.body_fat,
    onChange: e => setMetricForm({
      ...metricForm,
      body_fat: e.target.value
    })
  }))), /*#__PURE__*/React.createElement("div", {
    className: "two-up"
  }, /*#__PURE__*/React.createElement("label", null, "Waist (cm)", /*#__PURE__*/React.createElement("input", {
    type: "number",
    step: "0.1",
    value: metricForm.waist,
    onChange: e => setMetricForm({
      ...metricForm,
      waist: e.target.value
    })
  })), /*#__PURE__*/React.createElement("label", null, "Chest (cm)", /*#__PURE__*/React.createElement("input", {
    type: "number",
    step: "0.1",
    value: metricForm.chest,
    onChange: e => setMetricForm({
      ...metricForm,
      chest: e.target.value
    })
  }))), /*#__PURE__*/React.createElement("label", null, "Arms (cm)", /*#__PURE__*/React.createElement("input", {
    type: "number",
    step: "0.1",
    value: metricForm.arms,
    onChange: e => setMetricForm({
      ...metricForm,
      arms: e.target.value
    })
  })), /*#__PURE__*/React.createElement("label", null, "Notes", /*#__PURE__*/React.createElement("textarea", {
    value: metricForm.notes,
    onChange: e => setMetricForm({
      ...metricForm,
      notes: e.target.value
    })
  })), /*#__PURE__*/React.createElement("button", {
    className: "secondary-button",
    type: "submit"
  }, "Save metrics"))))), activeTab === "library" && /*#__PURE__*/React.createElement("section", {
    className: "content-grid"
  }, /*#__PURE__*/React.createElement("article", {
    className: "panel panel-large"
  }, /*#__PURE__*/React.createElement("div", {
    className: "panel-header"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    className: "eyebrow"
  }, "Exercise library"), /*#__PURE__*/React.createElement("h3", null, "Find a movement"))), /*#__PURE__*/React.createElement("div", {
    className: "library-filters"
  }, /*#__PURE__*/React.createElement("input", {
    value: exerciseQuery,
    onChange: e => setExerciseQuery(e.target.value),
    placeholder: "Search exercise, muscle, equipment"
  }), /*#__PURE__*/React.createElement("select", {
    value: exerciseFilter,
    onChange: e => setExerciseFilter(e.target.value)
  }, exerciseGroups.map(group => /*#__PURE__*/React.createElement("option", {
    key: group
  }, group)))), /*#__PURE__*/React.createElement("div", {
    className: "exercise-grid"
  }, filteredExercises.map(exercise => /*#__PURE__*/React.createElement("div", {
    key: exercise.name,
    className: "exercise-card"
  }, /*#__PURE__*/React.createElement("p", {
    className: "eyebrow"
  }, exercise.group), /*#__PURE__*/React.createElement("h4", null, exercise.name), /*#__PURE__*/React.createElement("div", {
    className: "plan-meta"
  }, /*#__PURE__*/React.createElement("span", null, exercise.equipment), /*#__PURE__*/React.createElement("span", null, exercise.difficulty)), /*#__PURE__*/React.createElement("p", null, exercise.cue), /*#__PURE__*/React.createElement("button", {
    className: "plan-template-button",
    type: "button",
    onClick: () => {
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
    }
  }, "Add to workout"))))), /*#__PURE__*/React.createElement("article", {
    className: "panel"
  }, /*#__PURE__*/React.createElement("div", {
    className: "panel-header"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    className: "eyebrow"
  }, "Workout timer"), /*#__PURE__*/React.createElement("h3", null, "Intervals"))), /*#__PURE__*/React.createElement(WorkoutTimer, null))), activeTab === "history" && /*#__PURE__*/React.createElement("section", {
    className: "content-grid"
  }, /*#__PURE__*/React.createElement("article", {
    className: "panel panel-large"
  }, /*#__PURE__*/React.createElement("div", {
    className: "panel-header"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    className: "eyebrow"
  }, "Activity archive"), /*#__PURE__*/React.createElement("h3", null, "Last seven days"))), /*#__PURE__*/React.createElement("div", {
    className: "history-table"
  }, data.weekly.map(item => /*#__PURE__*/React.createElement("div", {
    key: item.date,
    className: "history-row"
  }, /*#__PURE__*/React.createElement("strong", null, formatDate(item.date)), /*#__PURE__*/React.createElement("span", null, item.minutes, " minutes"), /*#__PURE__*/React.createElement("span", null, item.calories, " kcal"))))), /*#__PURE__*/React.createElement("article", {
    className: "panel"
  }, /*#__PURE__*/React.createElement("div", {
    className: "panel-header"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    className: "eyebrow"
  }, "Highlights"), /*#__PURE__*/React.createElement("h3", null, "What's improving"))), /*#__PURE__*/React.createElement("div", {
    className: "insight-list"
  }, /*#__PURE__*/React.createElement("div", {
    className: "insight-card"
  }, /*#__PURE__*/React.createElement("strong", null, "Consistency"), /*#__PURE__*/React.createElement("p", null, data.analytics.streak, " active days in a row with at least 20 minutes of training.")), /*#__PURE__*/React.createElement("div", {
    className: "insight-card"
  }, /*#__PURE__*/React.createElement("strong", null, "Energy balance"), /*#__PURE__*/React.createElement("p", null, data.analytics.weekly_calories, " kcal burned this week from logged sessions.")), /*#__PURE__*/React.createElement("div", {
    className: "insight-card"
  }, /*#__PURE__*/React.createElement("strong", null, "Recovery"), /*#__PURE__*/React.createElement("p", null, "Sleep is currently ", data.today.sleep_hours, " hours and hydration is", " ", (data.today.water_glasses * 0.25).toFixed(1), " liters.")))))));
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
  const onAuth = async authedUser => {
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
    return /*#__PURE__*/React.createElement(AuthScreen, {
      onAuth: onAuth
    });
  }
  if (loading && !data) {
    return /*#__PURE__*/React.createElement("div", {
      className: "loading-state"
    }, "Loading your fitness dashboard...");
  }
  if (error && !data) {
    return /*#__PURE__*/React.createElement("div", {
      className: "loading-state"
    }, "Unable to load the app: ", error);
  }
  return /*#__PURE__*/React.createElement(Dashboard, {
    user: user,
    data: data,
    onRefresh: loadDashboard,
    onLogout: onLogout
  });
}
ReactDOM.createRoot(document.getElementById("root")).render(/*#__PURE__*/React.createElement(App, null));
