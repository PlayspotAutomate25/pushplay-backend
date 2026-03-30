const TMDB_BASE_URL = "https://api.themoviedb.org/3";

/**
 * Service to interact with TMDB API.
 * Uses the Read Access Token (Bearer) for authentication.
 */
class TMDBService {
  constructor() {
    this.token = process.env.TMDB_READ_ACCESS_TOKEN;
    this.genres = {};
  }

  /**
   * Initializes genre mapping.
   */
  async initGenres() {
    try {
      const movieGenresUrl = `${TMDB_BASE_URL}/genre/movie/list?language=en-US`;
      const tvGenresUrl = `${TMDB_BASE_URL}/genre/tv/list?language=en-US`;

      const [movieRes, tvRes] = await Promise.all([
        this.fetchTMDB(movieGenresUrl),
        this.fetchTMDB(tvGenresUrl)
      ]);

      const allGenres = [...(movieRes.genres || []), ...(tvRes.genres || [])];
      allGenres.forEach(g => {
        this.genres[g.id] = g.name;
      });
    } catch (error) {
      console.error("Failed to fetch genres from TMDB:", error.message);
    }
  }

  /**
   * Helper to fetch data from TMDB.
   */
  async fetchTMDB(url) {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        accept: "application/json",
        Authorization: `Bearer ${this.token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.status_message || `TMDB API error: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Search for movies or TV shows.
   */
  async search(query, type = "movie") {
    if (Object.keys(this.genres).length === 0) {
      await this.initGenres();
    }

    const endpoint = type === "movie" ? "/search/movie" : "/search/tv";
    const url = `${TMDB_BASE_URL}${endpoint}?query=${encodeURIComponent(query)}&language=en-US&page=1`;
    
    const data = await this.fetchTMDB(url);
    
    return data.results.map((item) => this.normalize(item, type));
  }

  /**
   * Normalizes TMDB result to our catalog schema.
   */
  normalize(item, type) {
    const genres = (item.genre_ids || [])
      .map(id => this.genres[id])
      .filter(Boolean)
      .join(", ");

    return {
      title: item.title || item.name,
      year: (item.release_date || item.first_air_date || "").split("-")[0],
      genre: genres || "Unknown",
      description: item.overview,
      poster_url: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
      rating: parseFloat(item.vote_average.toFixed(1)),
      type: type === "movie" ? "Movie" : "TV Show",
    };
  }
}

module.exports = new TMDBService();
