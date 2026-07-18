# Moodie product specification

## Product idea

Moodie is a social film diary where people record what a film meant to them and how it felt. Those responses connect people through films they have both seen. The connection then becomes a path to other films.

The product does not predict taste from genre. It does not ask for ratings. A horror film can lead someone toward joy if another real person experienced it that way.

The shortest version of the product loop is:

1. Watch a film.
2. Save what stayed with you.
3. Meet someone through a film you both responded to.
4. Find another film through that person.
5. Respond again.

The product gets stronger as more responses, people, and shared films enter that loop.

## Product entities

### Person

A person has a profile, a diary, public responses, saved films, followers, and people they follow.

### Film

A film is catalog metadata plus the responses people attach to it. Film art gives the interface its visual material. TMDB ratings never appear as product judgment.

### Viewing

A viewing is one occurrence of watching a film. Rewatches stay separate.

### Response

A response belongs to one viewing. It contains:

- the film;
- watched date;
- first-person note;
- a reviewed feeling mix;
- private or public visibility;
- an optional photo;
- reactions from other people.

### Connection

A connection exists when two people have responded to the same film. The closeness of their feeling mixes helps order possible paths, but the interface never turns that into a compatibility score.

### Film path

A film path contains:

- the person who created the path;
- the shared film that connected both people;
- the feelings both people recorded on that film;
- another film that person responded to;
- the feelings that person recorded after the recommended film;
- that person's response to the recommended film.

The interface can reveal both written responses to the shared film for comparison. It never exposes the internal similarity score.

### Reaction

A reaction means that another person's response resonated. It is not a film rating.

### Saved film

A saved film is a private reminder to return to a film later.

## Primary loops

### Record and continue

The person searches for a film, writes what it meant, sets the feelings, chooses visibility, and saves. The saved state immediately shows a film path when one exists. There is no separate recommendation utility to visit first.

### Return through people

The person opens Moodie and sees responses from people they follow, reactions to their own responses, new followers, and films moving through their circle. Any event can lead to a person, response, or film.

### Explore a path

The person receives a film through someone else. They can open the film, read more responses, save it, visit the source person, or follow the path into more films from connected people.

### Build a circle

The person discovers people through shared films and recent responses. They follow people whose writing or film history they want to keep seeing. Following changes the home stream and future return activity.

### Revisit the diary

The person searches and filters their own viewings, edits a response, changes visibility, notices rewatches, opens a saved film, or returns to a film that produced a strong response.

## Signed-in information architecture

The application has no header. The only persistent navigation is a narrow left rail.

The rail stays collapsed by default. Hovering or focusing within it opens a temporary menu beside the icons. It cannot be pinned open. The rail shares the canvas background and grain, so the collapsed state reads as icons placed directly on the page.

Navigation order:

1. Home
2. Search
3. People
4. Activity
5. Diary
6. Add response
7. Account

Recommendations never appear as a primary navigation item.

## Surface specification

### Home

Home is the return surface. It has three local views.

#### For you

- one leading film path;
- recommended films from connected people;
- recent responses from the person's circle;
- people connected through shared films;
- films moving through the community;
- saved films that have not been watched yet.

The leading film path owns the strongest hierarchy. The remaining modules are dense and interactive, not full-width explanatory blocks.

#### Following

A chronological stream of complete responses from followed people. Each response keeps the person, poster, note, feelings, optional photo, reaction, and film action together.

#### Everyone

The same response format across the public community. Following and reaction actions work in place.

### Search

Search supports films, feelings, and people without becoming a streaming catalog.

Before a query:

- films with recent community responses;
- people connected through shared films;
- saved films to return to.

After a query:

- film results with save and response actions;
- feeling results from connected people's real responses, with genre left open;
- people results with shared-film and latest-response context.

### People

People has Following and Discover views.

Every person item shows:

- identity and bio;
- the shared film when one exists;
- their latest film;
- an excerpt from their latest response;
- response and follower counts;
- follow state.

The person page adds their public responses, films, shared-film context, and follow action.

### Activity

Activity is a chronological return trail. It includes:

- reactions to the person's responses;
- new followers;
- recent responses from followed people.

Each event links to the exact person, response context, or film that caused it. There are no invented notification categories or unread claims without persisted read state.

### Diary

Diary has Viewings and Saved views.

Viewings supports:

- search by film title or response text;
- public and private filters;
- chronological grouping;
- rewatch markers;
- editing;
- deletion;
- visibility state;
- a recent-feelings summary that describes a time window, not the person.

Saved supports opening a film, removing it, and adding a response after watching.

### Add response

The response flow has three states:

1. Find and choose a film.
2. Record the date, note, optional photo, visibility, and feelings.
3. Confirm the saved response and show the next film path when available.

### Film

The film page contains:

- film art, title, year, runtime, and synopsis;
- save and add-response actions;
- the person and shared film when reached through a path;
- public responses;
- related films as a secondary catalog tool.

### Account

Account contains profile, account, and password views. Profile includes diary counts, public bio, public-profile link, and sign out. It does not become a dashboard.

## Journeys

### First response

1. Enter the demo or create an account.
2. Choose Add response from the rail.
3. Search for the last film watched.
4. Write what stayed.
5. Set the feelings directly.
6. Save privately or publicly.
7. If the response connects with someone, receive one film path immediately.
8. Open the film or return home.

### Daily return

1. Open Home.
2. See the strongest current film path.
3. Read responses from followed people.
4. React to one response.
5. Open the person's profile or the film.
6. Save the film for later.

### Find something happy without asking for comedy

1. Follow a film path into focused exploration.
2. Choose Joy as the desired feeling.
3. Keep genre open.
4. Receive films that real connected people experienced with joy.
5. Read the response behind the result.
6. Save or open the film.

### Discover a person

1. Open People.
2. See a shared film beside a person's latest response.
3. Open the shared film or the person's profile.
4. Read several responses.
5. Follow the person.
6. Their next public response enters Following and Activity.

### Return after someone reacts

1. Open Activity.
2. See who reacted and which film response caused it.
3. Open that response's film.
4. Visit the reacting person.
5. Follow them or discover another film through their responses.

### Rewatch

1. Open Diary.
2. Search for the film.
3. Compare earlier viewings by date, words, and feelings.
4. Add another response instead of overwriting the first.
5. Let the new response create new connections.

## Interaction rules

- Every film path names a person and shared film.
- Every social event has a destination.
- Follow, react, save, and remove actions update in place.
- Film art never replaces the human response.
- Photos remain optional and are never analyzed.
- Ratings, stars, compatibility scores, and genre-based emotional claims never appear.
- Empty states offer the next real action without explaining the whole product.
- Page titles appear only when the content itself cannot establish location.

## Current delivery boundary

This application includes the complete prototype loop: account access, film search, response capture, diary management, public responses, follows, reactions, people discovery, people-led film paths, saved films, film pages, member pages, and return activity.

Future work can add comments, private sharing, invitations, blocks, moderation, notification read state, custom lists, collaborative lists, import, and richer feeling language. Those features should extend the same response-to-person-to-film loop rather than sit beside it as unrelated social furniture.
