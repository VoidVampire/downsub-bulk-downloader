# downsub-bulk-downloader

Bulk subtitle downloader scripts made for **[downsub.com](https://downsub.com/)**.
These scripts are designed to be run directly in your browser using **[Tampermonkey](https://www.tampermonkey.net/)**.

> ⚙️ Scripts were written about ~2 months ago and tested primarily on Microsoft Edge.

---

## 📂 Repository Contents

This repository contains **two Tampermonkey scripts**:

### 1. Downsub All SRT Downloader

* Downloads **all available subtitle files (SRT)** for the **current episode/page** — across **all languages**.
* Adds a **green “Download all SRT”** button at the top-right corner of the page.


---

### 2. Downsub All Episodes All SRT V5 Downloader

* Automatically downloads **all subtitles (all languages)** from **all episodes** — no need to manually open each episode page.
* Adds a **red “All eps all langs”** button at the top-right corner.

![Both script icons](https://i.kek.sh/BIdKBN3P1et.png)

---

## 🚀 How to Use

1. Install **[Tampermonkey](https://www.tampermonkey.net/)** in your browser.
2. Import either or both of the scripts from this repository.
3. Go to **downsub.com** and paste a valid link.
4. You’ll see the new icons appear at the **top-right** of the page:

   * 🟩 **Download all SRT** → for single-episode downloads
   * 🟥 **All eps all langs** → for multi-episode bulk downloads
5. Click your desired button, and the script will start working automatically.

---

## ⚠️ Browser Notes

* 🟢 **Microsoft Edge:** Files download **automatically** (no pop-ups).
* 🔴 **Google Chrome:** You’ll get **download confirmation pop-ups** for each file.

  * I swear when I tested this 2 months ago, there was no pop-up.
  * Now, I don’t have the time to find a workaround.

---

## 🎥 Demo Videos

### ▶️ Video 1 — “All Episodes All SRT V5 Downloader”

* Shows full automation for downloading all subtitles from all episodes.
* Known issues:

  1. Occasionally, the **new webpage gets stuck** at `about:blank`, or just doesn't parse the url properly. It breaks the flow and nothing gets downloaded further.
  2. After running for a while, the page **slows down** and only downloads about **30–60%** of the total subtitles on the webpage.


[![](https://img.youtube.com/vi/1GGGMn_MgOs/0.jpg)](https://www.youtube.com/watch?v=1GGGMn_MgOs) 

💡 **Workaround:**
If the show/playlist has **less than 30 episodes**, I recommend using the **Downsub All SRT Downloader** (single-episode script) — it’s more reliable and faster for my setup.

---

### ▶️ Video 2 — “Downsub All SRT Downloader”

* Demonstrates the manual but **stable** method of downloading subtitles episode-by-episode.
* Much **faster and more consistent** on low-end hardware (like my laptop).
* If I had a better PC, I’d stick with the **V5 All Episodes** script 😅

[![](https://img.youtube.com/vi/4GQ8kbeVh0M/0.jpg)](https://www.youtube.com/watch?v=4GQ8kbeVh0M)

---

## 💬 Final Notes

These scripts were built for personal use and convenience — not optimized or maintained further.
You’re free to fork, modify, or improve them as needed.

If you experience issues like incomplete downloads or browser lag — it’s probably due to:

* browser limitations,
* system performance,
* or Downsub’s dynamic page loading behavior.

---

