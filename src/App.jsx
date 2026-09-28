import React, { useEffect, useMemo, useState } from "react";
import {
  Film,
  LogIn,
  LogOut,
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  Check,
  Star,
  Clock3,
  Eye,
  Play,
  UserPlus,
  LoaderCircle,
  Clapperboard,
} from "lucide-react";
import { supabase } from "./supabase";

const emptyForm = {
  title: "",
  year: "",
  genre: "",
  status: "Want to Watch",
  rating: "",
  notes: "",
};

const statuses = ["All", "Want to Watch", "Watching", "Watched"];

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (mounted) {
        setSession(data.session);
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="center-screen">
        <LoaderCircle className="spinner" size={34} />
        <p>Loading MovieWatchlist...</p>
      </div>
    );
  }

  return session ? (
    <Watchlist session={session} />
  ) : (
    <AuthScreen />
  );
}

function AuthScreen() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");

    if (!email || !password) {
      setError("Please enter an email and password.");
      setBusy(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      setBusy(false);
      return;
    }

    if (mode === "signup") {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) {
        setError(signUpError.message);
      } else if (data.session) {
        setMessage("Account created. You're logged in!");
      } else {
        setMessage(
          "Account created! Check your email to confirm your account, then log in."
        );
      }
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) setError(signInError.message);
    }

    setBusy(false);
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="brand-mark">
          <Film size={30} />
        </div>
        <h1>MovieWatchlist</h1>
        <p className="muted">
          Keep track of movies you want to watch, are watching, and have
          watched.
        </p>

        <div className="auth-tabs">
          <button
            className={mode === "login" ? "active" : ""}
            onClick={() => {
              setMode("login");
              setError("");
              setMessage("");
            }}
          >
            <LogIn size={17} /> Log In
          </button>
          <button
            className={mode === "signup" ? "active" : ""}
            onClick={() => {
              setMode("signup");
              setError("");
              setMessage("");
            }}
          >
            <UserPlus size={17} /> Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            Email
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </label>

          <label>
            Password
            <input
              type="password"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />
          </label>

          {error && <div className="alert error">{error}</div>}
          {message && <div className="alert success">{message}</div>}

          <button className="primary full" disabled={busy}>
            {busy ? (
              <LoaderCircle className="spinner" size={18} />
            ) : mode === "login" ? (
              <>
                <LogIn size={18} /> Log In
              </>
            ) : (
              <>
                <UserPlus size={18} /> Create Account
              </>
            )}
          </button>
        </form>

        <p className="auth-footer">
          {mode === "login"
            ? "Don't have an account? "
            : "Already have an account? "}
          <button
            className="text-button"
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
          >
            {mode === "login" ? "Sign up" : "Log in"}
          </button>
        </p>
      </div>
    </div>
  );
}

function Watchlist({ session }) {
  const [movies, setMovies] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMovie, setEditingMovie] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [sort, setSort] = useState("newest");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const email = session.user.email || "User";

  async function loadMovies() {
    setFetching(true);
    setError("");

    const { data, error: fetchError } = await supabase
      .from("movies")
      .select("*")
      .order("created_at", { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setMovies(data || []);
    }

    setFetching(false);
  }

  useEffect(() => {
    loadMovies();
  }, []);

  const filteredMovies = useMemo(() => {
    let result = movies.filter((movie) => {
      const matchesFilter = filter === "All" || movie.status === filter;
      const term = search.toLowerCase().trim();
      const matchesSearch =
        !term ||
        movie.title.toLowerCase().includes(term) ||
        (movie.genre || "").toLowerCase().includes(term);

      return matchesFilter && matchesSearch;
    });

    if (sort === "title") {
      result = [...result].sort((a, b) => a.title.localeCompare(b.title));
    } else if (sort === "rating") {
      result = [...result].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sort === "year") {
      result = [...result].sort((a, b) => (b.year || 0) - (a.year || 0));
    }

    return result;
  }, [movies, filter, search, sort]);

  const stats = {
    total: movies.length,
    want: movies.filter((m) => m.status === "Want to Watch").length,
    watching: movies.filter((m) => m.status === "Watching").length,
    watched: movies.filter((m) => m.status === "Watched").length,
  };

  function openAdd() {
    setEditingMovie(null);
    setForm(emptyForm);
    setError("");
    setModalOpen(true);
  }

  function openEdit(movie) {
    setEditingMovie(movie);
    setForm({
      title: movie.title || "",
      year: movie.year || "",
      genre: movie.genre || "",
      status: movie.status || "Want to Watch",
      rating: movie.rating || "",
      notes: movie.notes || "",
    });
    setError("");
    setModalOpen(true);
  }

  async function saveMovie(e) {
    e.preventDefault();
    setError("");

    if (!form.title.trim()) {
      setError("Movie title is required.");
      return;
    }

    if (form.year && (Number(form.year) < 1888 || Number(form.year) > 2100)) {
      setError("Please enter a valid year.");
      return;
    }

    if (form.status === "Watched" && form.rating) {
      const rating = Number(form.rating);
      if (rating < 1 || rating > 5) {
        setError("Rating must be between 1 and 5.");
        return;
      }
    }

    setSaving(true);

    const movieData = {
      title: form.title.trim(),
      year: form.year ? Number(form.year) : null,
      genre: form.genre.trim() || null,
      status: form.status,
      rating:
        form.status === "Watched" && form.rating ? Number(form.rating) : null,
      notes: form.notes.trim() || null,
    };

    let response;

    if (editingMovie) {
      response = await supabase
        .from("movies")
        .update(movieData)
        .eq("id", editingMovie.id)
        .select()
        .single();
    } else {
      response = await supabase
        .from("movies")
        .insert({ ...movieData, user_id: session.user.id })
        .select()
        .single();
    }

    if (response.error) {
      setError(response.error.message);
    } else {
      if (editingMovie) {
        setMovies((current) =>
          current.map((movie) =>
            movie.id === editingMovie.id ? response.data : movie
          )
        );
      } else {
        setMovies((current) => [response.data, ...current]);
      }
      setModalOpen(false);
    }

    setSaving(false);
  }

  async function deleteMovie(movie) {
    const confirmed = window.confirm(
      `Delete "${movie.title}" from your watchlist?`
    );
    if (!confirmed) return;

    const { error: deleteError } = await supabase
      .from("movies")
      .delete()
      .eq("id", movie.id);

    if (deleteError) {
      setError(deleteError.message);
    } else {
      setMovies((current) => current.filter((m) => m.id !== movie.id));
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-small">
            <Film size={22} />
          </div>
          <span>MovieWatchlist</span>
        </div>

        <div className="user-area">
          <span className="user-email">{email}</span>
          <button className="secondary" onClick={signOut}>
            <LogOut size={17} /> Log Out
          </button>
        </div>
      </header>

      <main className="main-content">
        <section className="hero">
          <div>
            <p className="eyebrow">YOUR PERSONAL COLLECTION</p>
            <h2>My Movie Watchlist</h2>
            <p className="muted">
              Save movies, track your progress, and never forget what you want
              to watch.
            </p>
          </div>
          <button className="primary add-button" onClick={openAdd}>
            <Plus size={19} /> Add Movie
          </button>
        </section>

        {error && (
          <div className="alert error page-alert">
            <span>{error}</span>
            <button onClick={() => setError("")}>
              <X size={17} />
            </button>
          </div>
        )}

        <section className="stats-grid">
          <StatCard icon={<Clapperboard />} label="Total Movies" value={stats.total} />
          <StatCard icon={<Clock3 />} label="Want to Watch" value={stats.want} />
          <StatCard icon={<Play />} label="Watching" value={stats.watching} />
          <StatCard icon={<Check />} label="Watched" value={stats.watched} />
        </section>

        <section className="toolbar">
          <div className="search-box">
            <Search size={18} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search movies or genres..."
            />
          </div>

          <div className="filters">
            {statuses.map((status) => (
              <button
                key={status}
                className={filter === status ? "filter active" : "filter"}
                onClick={() => setFilter(status)}
              >
                {status}
              </button>
            ))}
          </div>

          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="newest">Newest</option>
            <option value="title">Title A–Z</option>
            <option value="year">Newest Release</option>
            <option value="rating">Highest Rating</option>
          </select>
        </section>

        {fetching ? (
          <div className="empty-state">
            <LoaderCircle className="spinner" size={30} />
            <p>Loading your movies...</p>
          </div>
        ) : filteredMovies.length === 0 ? (
          <div className="empty-state">
            <Film size={44} />
            <h3>{movies.length ? "No movies found" : "Your watchlist is empty"}</h3>
            <p>
              {movies.length
                ? "Try changing your search or filter."
                : "Add your first movie to get started."}
            </p>
            {!movies.length && (
              <button className="primary" onClick={openAdd}>
                <Plus size={18} /> Add Your First Movie
              </button>
            )}
          </div>
        ) : (
          <section className="movie-grid">
            {filteredMovies.map((movie) => (
              <MovieCard
                key={movie.id}
                movie={movie}
                onEdit={() => openEdit(movie)}
                onDelete={() => deleteMovie(movie)}
              />
            ))}
          </section>
        )}
      </main>

      {modalOpen && (
        <MovieModal
          form={form}
          setForm={setForm}
          editingMovie={editingMovie}
          saving={saving}
          error={error}
          setError={setError}
          onClose={() => setModalOpen(false)}
          onSubmit={saveMovie}
        />
      )}
    </div>
  );
}

function StatCard({ icon, label, value }) {
  return (
    <div className="stat-card">
      <div className="stat-icon">{icon}</div>
      <div>
        <strong>{value}</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}

function MovieCard({ movie, onEdit, onDelete }) {
  const statusClass =
    movie.status === "Watched"
      ? "watched"
      : movie.status === "Watching"
      ? "watching"
      : "want";

  return (
    <article className="movie-card">
      <div className="poster-placeholder">
        <Film size={42} />
      </div>

      <div className="movie-body">
        <div className="movie-heading">
          <div>
            <h3>{movie.title}</h3>
            <div className="movie-meta">
              {movie.year && <span>{movie.year}</span>}
              {movie.year && movie.genre && <span>•</span>}
              {movie.genre && <span>{movie.genre}</span>}
            </div>
          </div>
          <span className={`status-badge ${statusClass}`}>{movie.status}</span>
        </div>

        {movie.status === "Watched" && movie.rating && (
          <div className="rating">
            {Array.from({ length: 5 }, (_, i) => (
              <Star
                key={i}
                size={15}
                fill={i < movie.rating ? "currentColor" : "none"}
              />
            ))}
          </div>
        )}

        {movie.notes && <p className="movie-notes">{movie.notes}</p>}

        <div className="movie-actions">
          <button className="secondary small" onClick={onEdit}>
            <Pencil size={15} /> Edit
          </button>
          <button className="danger small" onClick={onDelete}>
            <Trash2 size={15} /> Delete
          </button>
        </div>
      </div>
    </article>
  );
}

function MovieModal({
  form,
  setForm,
  editingMovie,
  saving,
  error,
  setError,
  onClose,
  onSubmit,
}) {
  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    if (error) setError("");
  }

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <p className="eyebrow">WATCHLIST</p>
            <h2>{editingMovie ? "Edit Movie" : "Add Movie"}</h2>
          </div>
          <button className="icon-button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={onSubmit}>
          <div className="form-grid">
            <label className="span-2">
              Movie Title *
              <input
                autoFocus
                value={form.title}
                onChange={(e) => update("title", e.target.value)}
                placeholder="e.g. Interstellar"
              />
            </label>

            <label>
              Release Year
              <input
                type="number"
                min="1888"
                max="2100"
                value={form.year}
                onChange={(e) => update("year", e.target.value)}
                placeholder="2026"
              />
            </label>

            <label>
              Genre
              <input
                value={form.genre}
                onChange={(e) => update("genre", e.target.value)}
                placeholder="Sci-Fi"
              />
            </label>

            <label>
              Status
              <select
                value={form.status}
                onChange={(e) => update("status", e.target.value)}
              >
                <option>Want to Watch</option>
                <option>Watching</option>
                <option>Watched</option>
              </select>
            </label>

            <label>
              Rating
              <select
                value={form.rating}
                onChange={(e) => update("rating", e.target.value)}
                disabled={form.status !== "Watched"}
              >
                <option value="">No rating</option>
                <option value="1">1 / 5</option>
                <option value="2">2 / 5</option>
                <option value="3">3 / 5</option>
                <option value="4">4 / 5</option>
                <option value="5">5 / 5</option>
              </select>
            </label>

            <label className="span-2">
              Notes
              <textarea
                rows="4"
                value={form.notes}
                onChange={(e) => update("notes", e.target.value)}
                placeholder="Anything you want to remember about this movie..."
              />
            </label>
          </div>

          {error && <div className="alert error modal-error">{error}</div>}

          <div className="modal-actions">
            <button type="button" className="secondary" onClick={onClose}>
              Cancel
            </button>
            <button className="primary" disabled={saving}>
              {saving ? (
                <>
                  <LoaderCircle className="spinner" size={17} /> Saving...
                </>
              ) : (
                <>
                  <Check size={17} /> {editingMovie ? "Save Changes" : "Add Movie"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default App;