# Lernling: Build Plan

(Working folder is `StreakMap`; the product name is **Lernling**, mascot is a baby red panda.)

Goal: a browser extension + backend + dashboard so friends can install in one click, get tracked on learning sites (Udemy, Coursera, any site they add), and see each other's streaks and progress. The group owner (you) can see everyone's progress.

---

## 0. Does something similar already exist? (checked 2026-10-16)

Short answer: **pieces exist, the combination does not.** No tool found that auto-tracks verified study on Udemy/Coursera **and** gives friend groups a shared streak view with an owner dashboard.

| Existing tool | What it does | What it lacks vs Lernling |
|---|---|---|
| [CourseBound](https://coursebound.org/) | Chrome extension auto-syncing Udemy, Coursera, YouTube, Skillshare, edX, LinkedIn Learning; streaks, analytics. Pro $9.99/mo (7-day trial) | No friends, groups or leaderboards (none mentioned); paid; doesn't say how progress is verified |
| [LearningStreak](https://github.com/the-shreyash/Learning-streak) | Personal Chrome extension, Udemy (Coursera/YouTube in development); counts real video progress, skips pauses/seeks, tracks content vs actual watch time | No backend or login by design, so no friends. 3 commits, 0 stars, no stated license, so a reference idea only |
| Study-Track | Friend leaderboard for study sessions | Could not confirm Udemy/Coursera auto-tracking; site errored when I checked |
| Udemy Progress / Time Remaining extensions | Better progress %, time left | No streaks or social |
| CodeStreaks, LearnHub Pro, StudyTimer Pro | Generic streak/heatmap/timers | Mostly manual or local-only; no groups |
| Forest, Habitica, Focusmate | Social focus/habit/accountability | Not connected to what you actually watched on a course site |

What this tells us:
- The **gap is real**: friends + verified auto-tracking + owner view.
- **LearningStreak's "content minutes vs real watch minutes"** is the same idea as our watched/content split. It validates the approach.
- CourseBound shows people will pay for auto-sync, so a free friends-first angle is a clear differentiator. If this ever goes public, compare against CourseBound's own roadmap first.
- Do not copy anyone's code (no license on LearningStreak); we build our own.

---

## 1. Stack (decided, all TypeScript)

| Part | Choice | Why |
|---|---|---|
| Extension | **WXT** (Manifest V3) + React | Builds for Chrome/Edge/Brave and Firefox from one codebase; hot reload; handles manifest for you |
| Backend | **Supabase** (Postgres, Auth, Row Level Security, Realtime, Edge Functions) | No server to run, free tier, Google login built in, security rules live in the database |
| Web dashboard | **Vite + React SPA** on Vercel or Cloudflare Pages | Simple, free, no server rendering needed |
| Shared code | `packages/core` | Streak math, tracking rules and types used by both extension and web |
| Repo | pnpm monorepo | One repo, one install |

Cost: about $0/month, plus a one-time $5 Chrome developer fee.

```
StreakMap/
  apps/
    extension/      WXT: content scripts, service worker, popup
    web/            dashboard + invite/join pages
  packages/
    core/           types, streak logic, tracking-rule constants
    adapters/       one file per learning site
  supabase/
    migrations/     SQL schema + security rules
    functions/      edge functions (nudges, badge awarding)
  PLAN.md
```

---

## 2. Friend experience (the "no hassle" part)

1. You send a link: `https://<app>/join/ABC123` (your group invite).
2. Friend clicks: page shows "Install the extension" (Chrome Web Store, unlisted listing, one click, auto-updates) and "Sign in with Google".
3. After sign-in they are **already in your group**. The extension popup says "You're set. Open Udemy or Coursera and start learning."
4. **Adding a site**: on any page the popup shows **"Track this site"**. They click it, then pick what counts as progress (see 3). The browser shows one permission prompt for that site. Udemy and Coursera are pre-supported and need no prompt beyond install.
5. Done. No settings screens, no API keys, no config files.

Consent screen at first run (plain language): "Your group owner and members can see your study minutes, streak, and course names. You can hide course names in Settings."

Distribution:
- **Chrome Web Store, unlisted** (needs a privacy policy page; review takes a few days). Works for Chrome, Edge, Brave, Arc.
- While waiting for review: send a zipped build to load as "unpacked" (more hassle, only for the first 1 to 2 friends).
- Firefox later through the same WXT codebase.

---

## 3. What counts as progress (the core of the product)

Visiting a site never counts. Only **verified activity** counts. The extension records four kinds of evidence:

| Progress type | What is measured | How it is verified |
|---|---|---|
| **Watch time** | Seconds a lecture video is really playing | `<video>` is playing, `currentTime` is advancing, tab is visible, computer not idle or locked |
| **Lesson completed** | A lesson marked done | Site adapter detects the completion state change, tied to a lesson ID, **each lesson counts once ever** |
| **Quiz / assignment** | Submitted or passed | Adapter detects submit/result page |
| **Active study time** (reading, coding, docs sites) | Time with real interaction | Tab visible + input (scroll, key, click, mouse) in each 60-second window; capped per day |
| Manual log (fallback) | Minutes typed by the user | Marked "manual" everywhere and weighted lower |

**Per-site setting** (what "track progress type" means in the UI): each tracked site has checkboxes for which types count. Udemy and Coursera default to Watch time + Lessons + Quizzes. A generic site defaults to Active study time.

### Speed-watching and skipping known content (the fair way)
People legitimately watch at 2x, or jump ahead through parts they already know. The rules must not punish that, and must not let someone skip everything and claim a day. So credit is split into three kinds:

| What the user did | Credit | Why |
|---|---|---|
| **Watched** (video playing, any speed up to 4x, tab visible, user not idle) | Counts as study time, in real minutes spent, **and** recorded as "content minutes" (video time covered) | Real effort; a 2x watcher spends fewer minutes but covers more content, and both are shown |
| **Skipped ahead** (seek forward, then playback continues in the same lesson) | **No study minutes**, but the skipped part is marked "skimmed" and counts toward that lesson's coverage | You don't earn time for content you didn't spend time on, but you aren't penalised for knowing it |
| **Lesson marked complete** after real engagement | **Lesson credit**, which on its own satisfies the daily goal | This is how known content is rewarded: finishing the lesson is the achievement |

Guards so lesson credit can't be farmed:
- A lesson needs engagement to count: at least **60 seconds of watched time AND at least 25% of the lesson watched or skimmed** (both thresholds changeable). Ticking "complete" on 40 lessons in a minute earns nothing.
- Max **6 lesson credits per hour** and a daily cap.
- **Quizzes and assignments** are the strongest proof for known content ("I know this, test me"). A passed quiz always counts toward the day, no watch time needed.

So someone who knows the topic can skim a lecture at 3x, jump to the parts they need, take the quiz and still get the day counted, but someone who just leaves a video running or mass-ticks checkboxes does not.

### Other anti-cheating rules (practical, not perfect)
- Speed never reduces credit. Only repeated rapid seeking with no actual playing earns nothing.
- Playing in a hidden tab doesn't count, except Picture-in-Picture.
- Stop crediting when the OS is locked or idle (`chrome.idle`), and after 10 minutes with zero input while video plays (covers "left it running").
- Muted video still counts, but is flagged `muted` for display (some people do read along).
- **Minute buckets**: the server stores one row per (user, minute). Two tabs or two devices playing at the same time can't double count.
- Daily cap on counted minutes (default 12 hours); lessons deduped by (platform, course, lesson ID).
- Server checks every upload (timestamps not in the future, no impossible rates).

Honest limit: a determined friend can still fake it. This is a trust-based group tool; the design makes accidental and lazy cheating (leaving a video running) not count.

### "Studied today" rule
A day counts for the streak if the user has **at least 10 active minutes OR 1 lesson completed OR 1 quiz submitted**. The group owner can change the threshold. Day boundaries use the user's own timezone (stored in the profile). One **streak freeze** per week is automatic.

---

## 4. Extension design

**Content script** (runs only on supported or user-approved sites)
- Picks an adapter by hostname (`udemy`, `coursera`, or `generic`).
- Adapter interface:
  ```ts
  interface Adapter {
    matches(url: URL): boolean
    getContext(): { courseId; courseTitle; lessonId; lessonTitle } | null
    getVideo(): HTMLVideoElement | null
    onLessonComplete(cb): Unsubscribe     // MutationObserver / network hint
    onQuizSubmit?(cb): Unsubscribe
    getCourseProgressPercent?(): number | null
  }
  ```
- A shared **tracking engine** (site-independent) listens to video events, visibility and input, and emits one-second ticks.

**Service worker** (background)
- Receives ticks, groups them into **30-second segments**, builds minute buckets.
- Keeps an offline queue in IndexedDB; uploads in batches every minute and on tab close; retries; every record has a client UUID so retries are harmless.
- Uses `chrome.idle` for lock/idle state, `chrome.alarms` for periodic sync and reminders.

**Popup** (small, friendly)
- Top: a calm status line: small progress ring (minutes today vs goal), flame and the red panda in its current mood. No nagging.

**Celebration moments (not constant popups).** While you study, Lernling stays out of the way. A small in-page card (bottom-right, auto-hides in about 6 seconds, one per event) appears **only** when:
1. **A video/lesson is finished**: "Lesson done: +14 min, 2 lessons today" with the panda cheering.
2. **The day first becomes counted as studied**: "Day counted! Streak: 5 🔥" with the panda celebrating; milestone streaks (3, 7, 14, 30, 100) get a bigger version.
Nothing pops up in the middle of a lecture. A setting turns the cards off.
- Middle: "Track this site" button when on an untracked site, with the progress-type checkboxes.
- Bottom: friends' streak list with a **Nudge** button next to anyone who hasn't studied today.

**Permissions strategy** (keeps the install prompt light, helps store review)
- Required: `storage`, `alarms`, `idle`, `identity`, `notifications`, plus host access to Udemy and Coursera only.
- **Optional host permissions** requested per site when the user clicks "Track this site".

**Login**: Google sign-in using `chrome.identity.launchWebAuthFlow` against Supabase Auth; session stored in extension storage and shared with the web app login.

---

## 5. Backend design (Supabase)

### Tables
- `profiles(id, display_name, avatar, timezone, share_course_names, created_at)`
- `groups(id, name, invite_code, owner_id, daily_threshold_min)`
- `group_members(group_id, user_id, role)` (role: owner / member)
- `site_settings(user_id, platform, hostname, progress_types[])`
- `activity_minutes(user_id, minute_ts, platform, course_key, lesson_key, source, muted)` with primary key (user_id, minute_ts)
- `lesson_events(user_id, platform, course_key, lesson_key, kind, occurred_at)` with unique (user_id, platform, course_key, lesson_key, kind)
- `daily_summary(user_id, day, active_minutes, lessons_done, quizzes_done, studied bool)` (maintained by trigger, so reads are cheap)
- `streaks(user_id, current, longest, last_day, freezes_available)`
- `badges`, `user_badges`, `nudges(from, to, sent_at, seen_at)`

### Security (Row Level Security: the rules in the database)
- A user can read and write only their own raw rows.
- A user can read `daily_summary`, `streaks`, and (if shared) course names of people **in the same group**.
- Group owner sees every member's summaries.
- Raw minute-level data is never visible to friends, only summaries.
- Writes to `activity_minutes` go through one **ingest function** that validates timestamps and rates.

### Other backend work
- Streak recalculation function (timezone-aware) run on each summary change, plus a nightly job.
- Badge awarding function (streak milestones, first course finished, etc.).
- Realtime channel so the dashboard and popup update when a friend studies or nudges.

---

## 6. Web dashboard

Pages:
- **Home**: my streakmap (12-month heatmap), streak, today's minutes, mascot.
- **Group**: leaderboard (this week), every member's streak and today's status, 30-day mini heatmaps. **Owner view** adds per-member detail: minutes per day, courses, lesson counts.
- **Badges** and **Profile/Settings** (timezone, hide course names, leave group, delete my data).
- **/join/CODE**: sign in, auto-join, install-extension prompt.
- A public streakmap page for sharing (optional, off by default).

---

## 7. Gamification (v1 scope)

- Flame streak counter with milestones (3, 7, 14, 30, 100).
- **Mascot: baby red panda.** It grows with your streak:

  | Streak | Stage |
  |---|---|
  | 0 / new | Sleepy newborn cub, curled up |
  | 1-6 days | Cub with a tiny bamboo leaf |
  | 7-13 days | Playful cub with bamboo |
  | 14-29 days | Student panda (backpack) |
  | 30-99 days | Explorer panda (scarf, notebook) |
  | 100+ days | Golden legend panda (crown) |

  Moods on top of the stage: **happy** (today counted), **sleepy** (not done yet today, gentle), **celebrating** (lesson done, milestone), **cold/sad** (streak just broke or a freeze was used). Built as layered SVG (base panda + accessory + mood face) so one set of art gives every combination. First version uses simple self-made SVGs; swap in polished illustrations later without code changes.
- XP: 1 per active minute, bonus for lesson and quiz; level shown on profile.
- Weekly group leaderboard.
- Nudge a friend (notification: "Riya is waiting for you to study today").
- Later: friend quests, group streak, weekly emails.

---

## 8. Build phases

| Phase | Work | Done when |
|---|---|---|
| **0. Setup** (1-2 days) | Monorepo, Supabase project, Google OAuth, schema + security rules, hosting | Empty extension signs in and a row appears in the database |
| **1. Tracking engine** (3-4 days) | Engine, generic adapter, minute buckets, idle rules, offline queue; unit tests with simulated events; a local fixture page with a test video | Playing a test video produces correct minutes; hidden tab/idle/scrub produce none |
| **2. Udemy + Coursera adapters** (3-4 days) | Context detection, completion and quiz detection, selector self-checks on real sites | A real lesson watched and completed produces correct minutes and one lesson event |
| **3. Backend ingest + streaks** (2-3 days) | Ingest function with validation, triggers, streak and freeze logic, timezone handling | Test data gives correct streaks across timezones, gaps and freezes |
| **4. Extension UI + onboarding** (3 days) | Popup, Track-this-site flow, optional permissions, consent screen, invite flow | A new person goes link to tracking in under 2 minutes |
| **5. Dashboard** (4 days) | Heatmap, group view, owner view, join page | You can see all friends' progress live |
| **6. Social + gamification** (3 days) | Friends in popup, nudges, badges, mascot, leaderboard | Nudge arrives as a browser notification |
| **7. Distribution** (2-3 days + review wait) | Privacy policy, store listing (unlisted), icons, screenshots, store submission | Friends install from one link |
| **8. Beta + hardening** (ongoing) | 3-5 friends for 2 weeks; fix site breakage; tune thresholds; add sites | Streak data matches what people actually studied |

Rough total: **4 to 5 weeks** of focused work to a friends beta; a usable **internal test (phases 0-3 + minimal UI)** is reachable in about 2 weeks.

---

## 9. Testing plan

- **Unit tests** (core): tracking engine and streak logic with simulated event streams (pause, tab switch, idle, scrubbing, two tabs, midnight timezone edges).
- **End-to-end**: Playwright with the extension loaded, against a local fixture page with a real `<video>`.
- **Site adapters**: a small "health check" that reports to the backend when expected selectors disappear, so you hear about a Udemy/Coursera redesign before friends complain.
- **Manual script** per release: watch 2 minutes, pause, switch tab, complete lesson, confirm the numbers on the dashboard.

---

## 10. Risks and how they are handled

| Risk | Handling |
|---|---|
| Udemy/Coursera change their page | Adapters are isolated; health check; quick extension update via store |
| Site terms of service | Only observe what the user sees on their own screen; no scraping course content; don't bypass anything; review terms before any public launch |
| Privacy | Collect minimum data; clear consent; hide-course-names option; delete-my-data button; privacy policy |
| Chrome Web Store rejection | Narrow permissions, single clear purpose, accurate data disclosure |
| Supabase free tier pauses after 1 week of no activity | Fine for a friends group; upgrade ($25) if it becomes a real product |
| Cheating | Rules in section 3; accepted limit in a trust-based group |
| Mobile apps not tracked | Out of scope for v1; add a manual "I studied" log later |

---

## 11. Open decisions

Decided:
1. **Name: Lernling. Mascot: baby red panda.**
2. **Group visibility**: course names visible by default, with a per-user hide option (default kept, not yet explicitly confirmed).
3. **Daily threshold**: 10 active minutes by default, **changeable** by the group owner (and the lesson/quiz alternatives from section 3 also count).
4. **Domain**: free `*.vercel.app` for beta.
5. **Google sign-in only** for v1.

Still to decide later (not blocking): whether the speed cap should be 4x or higher.

Design status (2026-10-16): Stitch screens exported to `design/` (design system "Cozy Canopy" in `design/global_screen/cozy_canopy/DESIGN.md`; Plus Jakarta Sans, rust `#E25D33`, bamboo `#3D8A5A`, cream `#FDFBF7`). Stitch named the mascot **Kiko**; confirm or rename. The mascot art is a **placeholder**: it is more detailed than Duolingo's flat, geometric style. The app loads mascot art through one component with stage + mood props, so replacing the art later needs no code changes. Redo prompt for Stitch/image tool: "Duolingo-style mascot: simple geometric shapes, flat solid colors with no outlines or gradients, very large simple eyes with white highlights, minimal details, thick rounded limbs, max 4 colors plus white, front-facing, bold and instantly readable at 32px."
