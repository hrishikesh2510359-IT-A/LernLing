# Lernling browser extension: install guide

**Lernling counts the time you really study on Udemy, Coursera and other learning sites, and shares your streak with your friends.**
This page shows you how to install it. It takes about 5 minutes. You do not need to know anything technical. Just do the steps in order.

> **You need:** a computer (not a phone), the **Google Chrome** or **Microsoft Edge** browser, and a **Gmail address**.

---

## Step 0. Send your Gmail address to the person who invited you

Lernling is in private testing. **Before you can sign in, the person who invited you must add your Gmail address to a list.**
Message them your Gmail address now, then wait for them to say "added". If you skip this, sign-in will show "Access blocked".

## Step 1. Download the extension

### 👉 [Click here to download the extension (a .zip file)](https://github.com/hrishikesh2510359-IT-A/LernLing/archive/refs/heads/extension.zip)

Your browser will save a file named something like `LernLing-extension.zip`. It is usually in your **Downloads** folder.

## Step 2. Unzip it and put it somewhere safe

1. Open your **Downloads** folder.
2. **Windows:** right-click the zip file → **Extract All…** → **Extract**.
   **Mac:** double-click the zip file.
3. A new folder appears. Open it. Inside you will see a folder called **`lernling-extension`**.
4. **Move the `lernling-extension` folder to a place you will not clear out**, for example your **Documents** folder.

> ⚠️ **Do not delete or move this folder after installing.** The browser reads the extension from it. If you delete it, Lernling stops working.

## Step 3. Open your browser's extensions page

- **Chrome:** click the address bar at the top, type `chrome://extensions` and press **Enter**.
- **Edge:** click the address bar at the top, type `edge://extensions` and press **Enter**.

## Step 4. Turn on "Developer mode"

- **Chrome:** at the **top right** there is a switch called **Developer mode**. Click it so it turns **blue / on**.
- **Edge:** on the **left side** there is a switch called **Developer mode**. Click it so it turns **on**.

(This is only needed to install from a folder. It does not change anything else.)

## Step 5. Load the extension

1. Click the **Load unpacked** button (Chrome: top left. Edge: it appears after you turn on Developer mode).
2. A file window opens. Go to the **`lernling-extension`** folder you saved in Step 2.
3. **Click the `lernling-extension` folder once to select it** (do not open it), then click **Select Folder**.

✅ You should now see a card called **Lernling** in the list. If you see a red **Errors** button, see "Something went wrong" at the bottom.

## Step 6. Pin it so you can see it

1. Click the **puzzle-piece icon** 🧩 next to your address bar.
2. Find **Lernling** and click the **pin** icon next to it.

A little red panda face now sits next to your address bar.

## Step 7. Sign in

1. Click the **red panda icon**.
2. Click **Sign in with Google** and choose the Gmail you sent in Step 0.
3. If Google says **"Access blocked"**: the person who invited you has not added your Gmail yet. Ask them (Step 0).

## Step 8. Join your friends' group

Use **one** of these:

- **Easiest:** open the **invite link** your friend sent you, in the same browser. Click **Sign in with Google** if asked, then **Join**.
- **Or:** click the red panda icon, type the **invite code** your friend gave you into the box, and click **Join**.

You should now see your group and your friends in the little window.

## Step 9. Start studying

1. Open a lecture on **Udemy** or **Coursera** and play it.
   **If the page was already open before you installed Lernling, refresh it (press F5).**
2. After a minute or two, click the panda icon. You should see minutes counting up.
3. A day counts when you do **any one** of these:
   - study for **10 minutes** (the group owner can change this number),
   - **finish a lesson** (watch a lecture to the end),
   - **pass a quiz** (Udemy).
4. When your day counts, a small card pops up on the page and your flame 🔥 lights up.

Open the website any time to see your streak map and your friends: **https://lernling.vercel.app**

---

## What does Lernling see?

- It counts time **only while a lecture video is really playing** (or you are actively working on a site you added). Just opening a page does **not** count.
- Your group can see your **study minutes, streak and course names**. You can hide course names in **Settings** on the website.
- It does **not** record your browsing history, passwords or page contents.

## Adding another learning site (optional)

Open any learning site, click the red panda icon, and click **Start tracking** on the "Track this site?" card. Choose what should count (watching videos, finishing videos, or active study time).

---

## Something went wrong?

| Problem | What to do |
|---|---|
| **"Manifest file is missing or unreadable"** when loading | You selected the wrong folder. Select the folder called **`lernling-extension`** (the one that has a file called `manifest.json` inside). |
| **Lernling disappeared, or shows an error** | You moved or deleted the folder. Put `lernling-extension` back where it was, or repeat Steps 2–5. |
| **"No SW" or a red "Errors" button** | On the extensions page, click the **reload** icon (circular arrow) on the Lernling card. Then refresh your Udemy/Coursera tab. |
| **Nothing is being counted** | Refresh the Udemy/Coursera tab (F5) after installing. Make sure the video is actually **playing** and the tab is visible. Click the panda icon to check you are signed in. |
| **"Access blocked" when signing in** | Your Gmail is not on the list yet. Ask the person who invited you (Step 0). |
| **No pop-up notifications for nudges** | Windows: Settings → System → Notifications → turn on notifications and allow **Chrome** or **Edge**. Turn off "Do not disturb". |
| **A yellow "Disable developer mode extensions" message** | Click **Keep** / **Cancel**. It is a normal warning for extensions installed this way. |
| **Can't find "Developer mode"** | Make sure you are on `chrome://extensions` (Chrome) or `edge://extensions` (Edge), not a normal web page. |

## Updating to a newer version

When your friend tells you there is an update:
1. Download the new zip again (Step 1) and unzip it.
2. Copy everything from the new `lernling-extension` folder **over** your old `lernling-extension` folder (choose **Replace**).
3. Go to `chrome://extensions` (or `edge://extensions`) and click the **reload** icon on the Lernling card.
4. Refresh any open Udemy or Coursera tabs.

## Removing Lernling

On the extensions page, click **Remove** on the Lernling card. Then you can delete the folder.

---

*Still stuck? Send your friend a screenshot of what you see and tell them which step you are on.*
