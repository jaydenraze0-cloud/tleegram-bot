# Implementation Plan: Smart Cover Photo Resolution & Top 15 Fresh English News

Implement the user's confirmed choices:
1. **Cover Photo Logic**: Prioritize the original article cover photo from the news feed. If the news does not have a photo (or only has a generic logo/favicon), automatically search Google Images for matching photos and inject into the canvas. Provide a 1-click "Cari di Google Image" button and candidate preview gallery in the editor.
2. **Intelligence Radar Scope**: Limit strictly to the **Top 15 newest stories**, sorted strictly newest first (`publishedAt` descending), 100% in English.

---

## Proposed Changes

### 1. Backend (`server.ts`)
- **Top 15 Newest English Stories**:
  - In `fetchAllArticles`, ensure all sources are 100% English military/conflict wires.
  - Sort all unique articles strictly by `newest first` (`publishedAt` descending) and slice to the **Top 15 newest stories**.
  - Extract true article cover image (`media:content`, `enclosure`, `og:image`, `image`, or embedded `<img src="...">`).
- **Google Images Resolver (`/api/news/search-photos`)**:
  - Accept `title`, `snippet`, `category`, and `currentImageUrl`.
  - If current news has a valid high-resolution image, flag `hasNewsCover: true`.
  - If missing or requested by user, perform targeted Google/web query with entity keywords (location, weapon system, military branch) and return top matching photo and alternatives.

### 2. Frontend Studio (`src/App.tsx`)
- **Smart Cover Image Application**:
  - When a story is selected (or loaded initially):
    - Check if the article has an original cover image (`article.imageUrl` that is not a placeholder).
    - If valid original photo exists: immediately apply it to `editorConfig.background.imageUrl`.
    - If NO photo exists (or user clicks "Cari di Google Image"): automatically call `/api/news/search-photos` to fetch the best matching Google photo and set as canvas cover.
- **Top 15 Newest Feed Sync**:
  - Ensure the Radar displays the top 15 freshest stories with clean "LATEST" / recency badges.
  - Guarantee 100% English headlines and snippets.

### 3. Editor Canvas & Photo Panel (`src/components/SquareEditor.tsx`)
- Add an explicit **"Cari di Google Image"** action with candidate photo gallery:
  - Displays a thumbnail grid of Google Image alternatives matching the current story.
  - Allows 1-click switching between original news cover and Google Image search results.

---

## Verification Plan

### Automated & API Verification
- Test `GET /api/news/fetch` to confirm count is 15, all articles are English, and timestamps are sorted newest first.
- Test `POST /api/news/search-photos` with a headline to verify Google/web image search returns relevant photos.
- Run `lint_applet` and `compile_applet` to ensure zero compilation or TypeScript errors.

### User Flow Verification
- Selecting a story with an existing photo loads the news photo directly.
- Selecting a story without a photo automatically finds and applies a Google Image.
- Clicking "Cari di Google Image" in the editor displays alternative Google photos for selection.
