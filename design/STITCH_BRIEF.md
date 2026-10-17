# Lernling: Stitch UI Brief

How to use: open Google Stitch, paste **Global style** first, then one **screen prompt** at a time (Stitch works best one screen per prompt). Export each result (HTML/CSS or Figma, plus a PNG) into `F:\Projects\StreakMap\design\stitch\` and tell me; I will build the real React code from them. I'm not designing the UI myself, only wiring it up.

## Global style (paste first)

Product: **Lernling**, a study-streak app for friend groups. A Chrome extension tracks learning on Udemy/Coursera; a web dashboard shows streaks and friends' progress.
Mascot: a **baby red panda** (cute, round, warm). Appears in moods: sleepy, happy, celebrating, sad/cold. Grows with streak: newborn cub, cub with bamboo leaf, playful cub, student with backpack, explorer with scarf, golden legend with crown.
Tone: warm, friendly, encouraging, never guilt-tripping. Duolingo-like playfulness but calmer and cleaner.
Look: soft rounded corners, generous spacing, a warm palette (red-panda orange/rust accent, cream background, bamboo-green secondary, deep brown text), flame icon for streaks. Light and dark mode. Heatmap uses shades of orange. Accessible contrast.
Platforms: (a) extension popup 360x520 px; (b) in-page toast card; (c) responsive web dashboard (desktop first, works on phone).

## Screen prompts

### 1. Extension popup, main (tracked site, studying)
"Chrome extension popup, 360x520. Top: baby red panda mascot (happy), flame streak number '5 day streak', small circular progress ring '12 / 10 min today' with a 'Day counted' check. Below: today's stats row (watch time, lessons done, content minutes). Section 'Friends today': list of 4 friends with avatar, name, flame streak, status chip (Studied / Not yet), and a small 'Nudge' button on those not yet studied. Footer: tabs Home, Group, Settings. Warm cream background."

### 2. Extension popup, untracked site ("Track this site")
"Chrome extension popup 360x520 shown on a new learning website. Big friendly card: site favicon and domain, headline 'Track this site?'. Checkbox list 'What counts as progress': Watch time (video playing), Lessons completed, Quizzes and assignments, Active study time (reading/coding). Primary button 'Start tracking', secondary 'Not now'. Small note: 'Only time you actually study counts, never just visiting.' Baby red panda peeking from the corner."

### 3. Extension popup, onboarding / sign in
"Three-step onboarding in a 360x520 popup: 1) Welcome with baby red panda and 'Sign in with Google' button; 2) Consent card: 'Your group can see your study minutes, streak and course names' with a toggle 'Hide course names' and 'Continue'; 3) 'You're in <Group name>!' with member avatars and 'Open Udemy or Coursera and start learning'."

### 4. In-page celebration toast (shown only at lesson end / day counted)
"Small floating card, bottom-right of a video lecture page, 320 px wide, auto-hides. Two variants. A) Lesson finished: panda cheering, 'Lesson done! +14 min, 2 lessons today'. B) Day counted: panda celebrating with confetti, 'Day counted! 5 day streak', flame animation. Variant C: milestone (7 days), bigger with a badge. Includes a tiny close (x). Must not cover the video controls."

### 5. Web dashboard: Home
"Desktop dashboard. Left sidebar: logo 'Lernling', Home, Group, Badges, Settings. Main: hero card with baby red panda in current stage and mood, big flame streak, 'longest streak', weekly minutes. Below: a GitHub-style 12-month streakmap heatmap in orange shades with tooltip, then 'Recent activity' list (course name, platform icon, minutes, lessons). Right column: 'Today' ring, XP level, next badge progress."

### 6. Web dashboard: Group
"Group page 'Study Squad': leaderboard of this week's minutes with rank, avatar, name, streak flame, today's status, and a 30-day mini heatmap per person. Top-right: 'Invite friends' button showing a copyable invite link. A 'Nudge' button next to people who haven't studied today. Add a header summary: 'Squad streak: 4 of 5 studied today'."

### 7. Web dashboard: Owner view (member detail)
"Group owner's detail view for one member: avatar, name, streak, total minutes, lessons completed, a 30-day bar chart of daily minutes (watched vs skimmed content), course list with progress bars, and a table of recent sessions (date, platform, course, minutes, lessons). A clear 'Daily goal: 10 min' setting for the group in a side card."

### 8. Join page
"Landing page from an invite link: 'Aman invited you to Study Squad on Lernling'. Baby red panda waving. Two steps with numbers: 1 'Install the Chrome extension' button, 2 'Sign in with Google'. Show member avatars and the group's current streak. Short privacy line."

### 9. Badges page
"Grid of badge cards: 3-day, 7-day, 14-day, 30-day, 100-day streaks, First lesson, First course finished, Night owl, Early bird, Quiz master. Earned ones colorful with the panda accessory, locked ones greyed with progress bar."

### 10. Mascot sheet (ask Stitch for illustration references if it supports it)
"Character sheet of a cute baby red panda mascot in 6 growth stages (sleepy newborn, cub with bamboo leaf, playful cub, student with backpack, explorer with scarf and notebook, golden legend with crown) and 4 moods (happy, sleepy, celebrating, sad). Flat vector style, consistent proportions, transparent background."
Note: for final art, export as SVG or have an illustrator redo it; I will build the app so art can be swapped without code changes.

## What I need back from Stitch
- Exported HTML/CSS (or Figma link) and PNG per screen.
- The color and font tokens it chose (so I can put them in one theme file).
