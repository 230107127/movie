const API_KEY = '0fe65c0e78309b20a859abe90de957de';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_URL = 'https://image.tmdb.org/t/p/w500';

const searchBar = document.getElementById('search-bar');
const moviesGrid = document.getElementById('movies-grid');
const movieModal = document.getElementById('movie-modal');
const movieDetails = document.getElementById('movie-details');
const closeModal = document.getElementById('close-modal');
const watchlistButton = document.getElementById('watchlist-button');
const genreFilter = document.getElementById('genre-filter');
const ratingFilter = document.getElementById('rating-filter');

localStorage.clear();
let watchlist = JSON.parse(localStorage.getItem('watchlist')) || [];

async function fetchGenres() {
    const response = await fetch(`${BASE_URL}/genre/movie/list?api_key=${API_KEY}`);
    const data = await response.json();
    data.genres.forEach(genre => {
    const option = document.createElement('option');
    option.value = genre.id;
    option.textContent = genre.name;
    genreFilter.appendChild(option);
});
}

async function fetchRandomMovies() {
    const response = await fetch(`${BASE_URL}/movie/popular?api_key=${API_KEY}&page=1`);
    const data = await response.json();
    displayMovies(data.results);
}

async function fetchMoviesByFilter() {
    let genre = genreFilter.value;
    let rating = ratingFilter.value;

    const response = await fetch(`${BASE_URL}/movie/popular?api_key=${API_KEY}`);
    const data = await response.json();
    const filteredMovies = data.results.filter(movie => {
    return (!genre || movie.genre_ids.includes(parseInt(genre))) &&
            (!rating || movie.vote_average >= parseFloat(rating));
    });
    displayMovies(filteredMovies);
}

async function fetchMoviesBySearch(query) {
    const response = await fetch(`${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}`);
    const data = await response.json();
    displayMovies(data.results);
}

function displayMovies(movies) {
    localStorage.setItem('currentMovies', JSON.stringify(movies));
    moviesGrid.innerHTML = '';
    movies.forEach(movie => {
    const movieCard = document.createElement('div');
    movieCard.classList.add('movie-card');
    movieCard.innerHTML = `
        <img src="${movie.poster_path ? IMAGE_URL + movie.poster_path : ''}" alt="${movie.title}">
        <h3>${movie.title}</h3>
        <div class="rating">⭐ ${movie.vote_average}</div>
        <div class="buttons-container">
        <button class="details-btn" onclick="openModal(${movie.id})">More Info</button>
        <button class="add-watchlist ${watchlist.includes(movie.id) ? 'in-watchlist' : ''}" onclick="toggleWatchlist(${movie.id})">❤️</button>
        </div>
    `;
    moviesGrid.appendChild(movieCard);
    });
}

function toggleWatchlist(movieId) {
    if (watchlist.includes(movieId)) {
    watchlist = watchlist.filter(id => id !== movieId);
    } else {
    watchlist.push(movieId);
    }
    localStorage.setItem('watchlist', JSON.stringify(watchlist));
    displayMovies(JSON.parse(localStorage.getItem('currentMovies')) || []);
}

async function openModal(movieId) {
    const response = await fetch(`${BASE_URL}/movie/${movieId}?api_key=${API_KEY}&append_to_response=credits,videos`);
    const movie = await response.json();

movieDetails.innerHTML = `
    <h2>${movie.title}</h2>
    <p>${movie.overview}</p>
    <p><strong>Rating:</strong> ⭐ ${movie.vote_average}</p>
    <p><strong>Runtime:</strong> ${movie.runtime} mins</p>
    <h3>Cast:</h3>
    <ul>
        ${movie.credits.cast.slice(0, 5).map(actor => `<li>${actor.name}</li>`).join('')}
    </ul>
    <h3>Trailer:</h3>
    ${movie.videos.results.length > 0 ? `<iframe width="100%" height="315" src="https://www.youtube.com/embed/${movie.videos.results[0].key}" frameborder="0" allowfullscreen></iframe>` : '<p>No trailer available</p>'}
    `;
    movieModal.classList.add('visible');
}

function closeModalFunction() {
    movieModal.classList.remove('visible');
}

window.addEventListener('click', (event) => {
    if (event.target == movieModal) {
    closeModalFunction();
    }
});

window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
    closeModalFunction();
    }
});

closeModal.addEventListener('click', closeModalFunction);

watchlistButton.addEventListener('click', () => {
    const watchlistMovies = JSON.parse(localStorage.getItem('watchlist')) || [];
    const promises = watchlistMovies.map(id => fetch(`${BASE_URL}/movie/${id}?api_key=${API_KEY}`).then(response => response.json()));

    Promise.all(promises).then(movies => {
    displayMovies(movies);
    });
});

searchBar.addEventListener('input', () => {
    const query = searchBar.value.trim();
    if (query) {
    fetchMoviesBySearch(query);
    } else {
    fetchRandomMovies();
    }
});

fetchGenres();
fetchRandomMovies();

genreFilter.addEventListener('change', fetchMoviesByFilter);
ratingFilter.addEventListener('change', fetchMoviesByFilter);
