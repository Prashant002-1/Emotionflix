# Third-party notices

## TMDB

Moodie uses the TMDB API for non-commercial purposes and is not endorsed or certified by TMDB.

The Express server sends catalog, search, film-detail, and related-film requests to TMDB using the `TMDB_API_KEY` stored in the server environment. The key is not included in the frontend bundle and is never sent to the browser. The browser receives only the film metadata and artwork paths needed by the product.

Film metadata, poster art, backdrop art, logos, and other TMDB-supplied content remain subject to TMDB's terms. They are not covered by Moodie's MIT License.
