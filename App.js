import { useEffect, useRef, useState } from "react";
import StarRating from "./StarRating";
import { useKey } from "./useKey";
import { useLocalStorageState } from "./useLocalStorageState";
import { useMovies } from "./useMovies";
import image1 from "./image1.webp";
import image2 from "./image2.webp";

const average = (arr) =>
  arr.reduce((acc, cur, i, arr) => acc + cur / arr.length, 0);

const KEY = "f84fc31d";

export default function App() {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const { movies, isLoading, error } = useMovies(query);

  const [watched, setWatched] = useLocalStorageState([], "watched");
  const [groups, setGroups] = useLocalStorageState([], "groups");
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [user, setUser] = useLocalStorageState(null, "user");

  function handleSelectMovie(id) {
    setSelectedId((selectedId) => (id === selectedId ? null : id));
  }

  function handleCloseMovie() {
    setSelectedId(null);
  }

  function handleAddWatched(movie) {
    setWatched((watched) => [...watched, movie]);
  }

  function handleDeleteWatched(id) {
    setWatched((watched) => watched.filter((movie) => movie.imdbID !== id));
  }

  function handleCreateGroup(name) {
    setGroups((groups) => [
      ...groups,
      { id: Date.now(), name, movies: [], members: [] },
    ]);
  }

  function handleDeleteGroup(id) {
    setGroups((groups) => groups.filter((group) => group.id !== id));
    setSelectedGroup(null);
  }

  function handleShareToGroup(groupId, movieDetails) {
    setGroups((groups) =>
      groups.map((group) =>
        group.id === groupId
          ? { ...group, movies: [...group.movies, movieDetails] }
          : group
      )
    );
  }

  function handleDeleteGroupMovie(groupId, movieId) {
    setGroups((groups) =>
      groups.map((group) =>
        group.id === groupId
          ? {
              ...group,
              movies: group.movies.filter((movie) => movie.imdbID !== movieId),
            }
          : group
      )
    );
  }

  function handleSelectGroup(group) {
    setSelectedGroup(group);
  }

  function handleLike(movieId) {
    setWatched((watched) =>
      watched.map((movie) =>
        movie.imdbID === movieId
          ? { ...movie, likes: (movie.likes || 0) + 1 }
          : movie
      )
    );
  }

  function handleAddComment(movieId, comment) {
    setWatched((watched) =>
      watched.map((movie) =>
        movie.imdbID === movieId
          ? { ...movie, comments: [...(movie.comments || []), comment] }
          : movie
      )
    );
  }

  function handleRegister(username, password) {
    const users = JSON.parse(localStorage.getItem("users")) || [];
    const userExists = users.find((user) => user.username === username);
    if (userExists) {
      alert("User already exists!");
      return;
    }
    users.push({ username, password });
    localStorage.setItem("users", JSON.stringify(users));
    alert("User registered successfully!");
  }

  function handleLogin(username, password) {
    const users = JSON.parse(localStorage.getItem("users")) || [];
    const user = users.find(
      (user) => user.username === username && user.password === password
    );
    if (user) {
      setUser(user);
    } else {
      alert("Invalid credentials!");
    }
  }

  function handleLogout() {
    setUser(null);
  }

  return (
    <>
      {!user ? (
        <Auth onRegister={handleRegister} onLogin={handleLogin} />
      ) : (
        <div
          style={{
            backgroundImage: `url(${image2})`,
            backgroundSize: "cover",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center center",
            minHeight: "100vh",
            minWidth: "100vw",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <NavBar user={user} onLogout={handleLogout}>
            <Search query={query} setQuery={setQuery} />
            <NumResults movies={movies} />
          </NavBar>

          <Main>
            <Box>
              {isLoading && <Loader />}
              {!isLoading && !error && (
                <MovieList movies={movies} onSelectMovie={handleSelectMovie} />
              )}
              {error && <ErrorMessage message={error} />}
            </Box>

            <Box>
              {selectedId ? (
                <MovieDetails
                  selectedId={selectedId}
                  onCloseMovie={handleCloseMovie}
                  onAddWatched={handleAddWatched}
                  watched={watched}
                  onLike={handleLike}
                  onAddComment={handleAddComment}
                />
              ) : (
                <>
                  <WatchedSummary watched={watched} />
                  <WatchedMoviesList
                    watched={watched}
                    onDeleteWatched={handleDeleteWatched}
                    onLike={handleLike}
                    onAddComment={handleAddComment}
                  />
                </>
              )}
            </Box>

            <Box>
              <CreateGroup onCreateGroup={handleCreateGroup} />
              <GroupsList
                groups={groups}
                onSelectGroup={handleSelectGroup}
                onDeleteGroup={handleDeleteGroup}
              />
              {selectedGroup && (
                <GroupDetails
                  group={selectedGroup}
                  onShareMovie={handleShareToGroup}
                  onDeleteGroupMovie={handleDeleteGroupMovie}
                  movies={movies}
                />
              )}
            </Box>
          </Main>
        </div>
      )}
    </>
  );
}

function Loader() {
  return <p className="loader">Loading...</p>;
}

function ErrorMessage({ message }) {
  return (
    <p className="error">
      <span>⛔️</span> {message}
    </p>
  );
}

function NavBar({ user, children, onLogout }) {
  return (
    <nav className="nav-bar">
      <Logo />
      {children}
      <div className="user-info">
        <span>👤 {user.username}</span>
        <button className="btn-logout" onClick={onLogout}>
          Logout
        </button>
      </div>
    </nav>
  );
}

function Logo() {
  return (
    <div className="logo">
      <span role="img">🎬</span>
      <h1>What to watch?</h1>
    </div>
  );
}

function Search({ query, setQuery }) {
  const inputEl = useRef(null);

  useKey("Enter", function () {
    if (document.activeElement === inputEl.current) return;
    inputEl.current.focus();
    setQuery("");
  });

  return (
    <input
      className="search"
      type="text"
      placeholder="Search movies..."
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      ref={inputEl}
    />
  );
}

function NumResults({ movies }) {
  return (
    <p className="num-results">
      Found <strong>{movies.length}</strong> results
    </p>
  );
}

function Main({ children }) {
  return <main className="main">{children}</main>;
}

function Box({ children }) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="box">
      <button className="btn-toggle" onClick={() => setIsOpen((open) => !open)}>
        {isOpen ? "–" : "+"}
      </button>

      {isOpen && children}
    </div>
  );
}

function MovieList({ movies, onSelectMovie }) {
  return (
    <ul className="list list-movies">
      {movies?.map((movie) => (
        <Movie movie={movie} key={movie.imdbID} onSelectMovie={onSelectMovie} />
      ))}
    </ul>
  );
}

function Movie({ movie, onSelectMovie }) {
  return (
    <li onClick={() => onSelectMovie(movie.imdbID)}>
      <img src={movie.Poster} alt={`${movie.Title} poster`} />
      <h3>{movie.Title}</h3>
      <div>
        <p>
          <span>🗓</span>
          <span>{movie.Year}</span>
        </p>
      </div>
    </li>
  );
}

function MovieDetails({ selectedId, onCloseMovie, onAddWatched, watched }) {
  const [movie, setMovie] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [userRating, setUserRating] = useState("");

  const countRef = useRef(0);

  useEffect(
    function () {
      if (userRating) countRef.current++;
    },
    [userRating]
  );

  const isWatched = watched.map((movie) => movie.imdbID).includes(selectedId);
  const watchedUserRating = watched.find(
    (movie) => movie.imdbID === selectedId
  )?.userRating;

  const {
    Title: title,
    Year: year,
    Poster: poster,
    Runtime: runtime,
    imdbRating,
    Plot: plot,
    Released: released,
    Actors: actors,
    Director: director,
    Genre: genre,
  } = movie;

  const isTop = imdbRating > 8;
  console.log(isTop);

  function handleAdd() {
    const newWatchedMovie = {
      imdbID: selectedId,
      title,
      year,
      poster,
      imdbRating: Number(imdbRating),
      runtime: Number(runtime.split(" ").at(0)),
      userRating,
      countRatingDecisions: countRef.current,
      likes: 0,
      comments: [],
      link: "",
      message: "",
      viewedAt: "",
    };

    onAddWatched(newWatchedMovie);
    onCloseMovie();
  }

  useKey("Escape", onCloseMovie);

  useEffect(
    function () {
      async function getMovieDetails() {
        setIsLoading(true);
        const res = await fetch(
          `http://www.omdbapi.com/?apikey=${KEY}&i=${selectedId}`
        );
        const data = await res.json();
        setMovie(data);
        setIsLoading(false);
      }
      getMovieDetails();
    },
    [selectedId]
  );

  useEffect(
    function () {
      if (!title) return;
      document.title = `Movie | ${title}`;

      return function () {
        document.title = "What to watch?";
      };
    },
    [title]
  );

  return (
    <div className="details">
      {isLoading ? (
        <Loader />
      ) : (
        <>
          <header>
            <button className="btn-back" onClick={onCloseMovie}>
              &larr;
            </button>
            <img src={poster} alt={`Poster of ${movie} movie`} />
            <div className="details-overview">
              <h2>{title}</h2>
              <p>
                {released} &bull; {runtime}
              </p>
              <p>{genre}</p>
              <p>
                <span>⭐️</span>
                {imdbRating} IMDb rating
              </p>
            </div>
          </header>

          <section>
            <div className="rating">
              {!isWatched ? (
                <>
                  <StarRating
                    maxRating={10}
                    size={24}
                    onSetRating={setUserRating}
                  />
                  {userRating > 0 && (
                    <button className="btn-add" onClick={handleAdd}>
                      + Add to list
                    </button>
                  )}
                </>
              ) : (
                <p>
                  You rated this movie {watchedUserRating} <span>⭐️</span>
                </p>
              )}
            </div>
            <p>
              <em>{plot}</em>
            </p>
            <p>Starring {actors}</p>
            <p>Directed by {director}</p>
          </section>
          <Comments comments={movie.comments || []} />
        </>
      )}
    </div>
  );
}

function WatchedSummary({ watched }) {
  const avgImdbRating = average(watched.map((movie) => movie.imdbRating));
  const avgUserRating = average(watched.map((movie) => movie.userRating));
  const avgRuntime = average(watched.map((movie) => movie.runtime));

  return (
    <div className="summary">
      <h2>Movies Recommendations</h2>
      <div>
        <p>
          <span>#️⃣</span>
          <span>{watched.length} movies</span>
        </p>
        <p>
          <span>⭐️</span>
          <span>{avgImdbRating.toFixed(2)}</span>
        </p>
        <p>
          <span>🌟</span>
          <span>{avgUserRating.toFixed(2)}</span>
        </p>
        <p>
          <span>⏳</span>
          <span>{avgRuntime} min</span>
        </p>
      </div>
    </div>
  );
}

function WatchedMoviesList({ watched, onDeleteWatched, onLike, onAddComment }) {
  return (
    <ul className="list">
      {watched.map((movie) => (
        <WatchedMovie
          movie={movie}
          key={movie.imdbID}
          onDeleteWatched={onDeleteWatched}
          onLike={onLike}
          onAddComment={onAddComment}
        />
      ))}
    </ul>
  );
}

function WatchedMovie({ movie, onDeleteWatched, onLike, onAddComment }) {
  const [showComments, setShowComments] = useState(false);

  return (
    <li>
      <img src={movie.poster} alt={`${movie.title} poster`} />
      <h3>{movie.title}</h3>
      <div>
        <p>
          <span>⭐️</span>
          <span>{movie.imdbRating}</span>
        </p>
        <p>
          <span>🌟</span>
          <span>{movie.userRating}</span>
        </p>
        <p>
          <span>⏳</span>
          <span>{movie.runtime} min</span>
        </p>
        <p>
          <span>👍</span>
          <span>{movie.likes || 0}</span>
        </p>
        <div className="buttons">
          <button className="btn-like" onClick={() => onLike(movie.imdbID)}>
            Like
          </button>
          <button
            className="btn-delete"
            onClick={() => onDeleteWatched(movie.imdbID)}
          >
            Delete
          </button>
          <button
            className="btn-toggle-comments"
            onClick={() => setShowComments(!showComments)}
          >
            {showComments ? "Hide Comments" : "Show Comments"}
          </button>
        </div>
        {showComments && <Comments comments={movie.comments || []} />}
        {showComments && (
          <AddComment movieId={movie.imdbID} onAddComment={onAddComment} />
        )}
      </div>
    </li>
  );
}

function CreateGroup({ onCreateGroup }) {
  const [groupName, setGroupName] = useState("");

  function handleCreateGroup() {
    if (groupName) {
      onCreateGroup(groupName);
      setGroupName("");
    }
  }

  return (
    <div className="create-group">
      <h2>Create a New Group</h2>
      <input
        type="text"
        placeholder="Group name"
        value={groupName}
        onChange={(e) => setGroupName(e.target.value)}
      />
      <button onClick={handleCreateGroup}>Create Group</button>
    </div>
  );
}

function GroupsList({ groups, onSelectGroup, onDeleteGroup }) {
  return (
    <div className="groups-list">
      <h2>Your Groups</h2>
      <ul>
        {groups.map((group) => (
          <li key={group.id}>
            <span onClick={() => onSelectGroup(group)}>{group.name}</span>
            <button
              className="btn-delete-group"
              onClick={() => onDeleteGroup(group.id)}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function GroupDetails({ group, onShareMovie, movies }) {
  const [selectedMovie, setSelectedMovie] = useState("");
  const [link, setLink] = useState("");
  const [message, setMessage] = useState("");
  const [viewedAt, setViewedAt] = useState("");
  const [rating, setRating] = useState(0);

  function handleShare() {
    if (selectedMovie) {
      const movie = movies.find((m) => m.imdbID === selectedMovie);
      const movieDetails = {
        ...movie,
        link,
        message,
        viewedAt,
        rating,
      };
      onShareMovie(group.id, movieDetails);
      setSelectedMovie("");
      setLink("");
      setMessage("");
      setViewedAt("");
      setRating(0);
    }
  }

  return (
    <div className="group-details">
      <h2>{group.name}</h2>
      <ul>
        {group.movies.map((movie) => (
          <li key={movie.imdbID} className="group-movie">
            🎬 {movie.Title}
            <p>Link: {movie.link}</p>
            <p>Message: {movie.message}</p>
            <p>Viewed At: {movie.viewedAt}</p>
            <p>Rating: {movie.rating} ⭐️</p>
          </li>
        ))}
      </ul>
      <select
        onChange={(e) => setSelectedMovie(e.target.value)}
        value={selectedMovie}
      >
        <option value="">Select a movie to share</option>
        {movies.map((movie) => (
          <option key={movie.imdbID} value={movie.imdbID}>
            {movie.Title}
          </option>
        ))}
      </select>
      <input
        type="text"
        placeholder="Link"
        value={link}
        onChange={(e) => setLink(e.target.value)}
      />
      <input
        type="text"
        placeholder="Message"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <input
        type="text"
        placeholder="Viewed At"
        value={viewedAt}
        onChange={(e) => setViewedAt(e.target.value)}
      />
      <StarRating maxRating={10} size={24} onSetRating={setRating} />
      <button onClick={handleShare}>Share Movie</button>
    </div>
  );
}

function AddComment({ movieId, onAddComment }) {
  const [comment, setComment] = useState("");

  function handleAddComment() {
    if (comment) {
      onAddComment(movieId, comment);
      setComment("");
    }
  }

  return (
    <div className="add-comment">
      <input
        type="text"
        placeholder="Add a comment"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />
      <button className="btn-add-comment" onClick={handleAddComment}>
        Add Comment
      </button>
    </div>
  );
}

function Comments({ comments }) {
  return (
    <ul className="comments-list">
      {comments.map((comment, index) => (
        <li key={index} className="comment">
          {comment}
        </li>
      ))}
    </ul>
  );
}

function Auth({ onRegister, onLogin }) {
  const [isRegister, setIsRegister] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (isRegister) {
      onRegister(username, password);
    } else {
      onLogin(username, password);
    }
  }

  return (
    <div
      style={{
        backgroundImage: `url(${image2})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        color: "white",
      }}
    >
      <div className="auth">
        <img src={image1} alt="Login" className="auth-image" />
        <h2>{isRegister ? "Register" : "Login"}</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit">{isRegister ? "Register" : "Login"}</button>
        </form>
        <button onClick={() => setIsRegister(!isRegister)}>
          {isRegister ? "Switch to Login" : "Switch to Register"}
        </button>
      </div>
    </div>
  );
}
