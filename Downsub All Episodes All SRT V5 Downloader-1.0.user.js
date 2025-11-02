// ==UserScript==
// @name         Downsub All Episodes All SRT V5 Downloader
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Download all SRT files from all episodes
// @author       You
// @match        https://downsub.com/*
// @match        https://www.downsub.com/*
// @grant        window.open
// @grant        window.close
// ==/UserScript==

(function() {
    'use strict';

    let allEpisodes = [];
    let currentPage = 1;
    let isScrapingInProgress = false;
    let isDownloadingInProgress = false;
    let currentDownloadIndex = 0;

    // Timing variables
    const newTabInitializationTime = 8000; // Wait 8 seconds for website to analyze and load subs
    const newTabExtraTime = 3000; // Wait 3 seconds after last subtitle is downloaded

    // Wait for page to load
    setTimeout(() => {
        addMainButton();
    }, 2000);

    function addMainButton() {
        if (document.getElementById('scrape-download-btn')) return;

        const mainBtn = document.createElement('button');
        mainBtn.id = 'scrape-download-btn';
        mainBtn.innerHTML = '🎬 All eps all langs';
        mainBtn.style.cssText = `
            position: fixed;
            top: 70px;
            right: 20px;
            z-index: 9999;
            background: #DC143C;
            color: white;
            border: none;
            padding: 12px 16px;
            border-radius: 8px;
            font-weight: bold;
            cursor: pointer;
            box-shadow: 0 4px 8px rgba(0,0,0,0.3);
            font-size: 14px;
        `;

        mainBtn.onmouseover = () => mainBtn.style.background = '#B22222';
        mainBtn.onmouseout = () => mainBtn.style.background = '#DC143C';
        mainBtn.onclick = startScrapeAndDownload;

        document.body.appendChild(mainBtn);
    }

    function getCurrentPageEpisodes() {
        const episodes = [];

        const episodeLinks = document.querySelectorAll('a[href*="/watch"], a[href*="/episode"], a[href*="/ep"], a[class*="episode"], .episode-link');

        if (episodeLinks.length === 0) {
            const possibleEpisodeLinks = document.querySelectorAll('a[href]');
            possibleEpisodeLinks.forEach(link => {
                const text = link.textContent.trim();
                const href = link.href;

                if (href.includes('/watch') ||
                    href.includes('/episode') ||
                    href.includes('/ep') ||
                    /episode|ep\s*\d+|season|s\d+e\d+/i.test(text)) {
                    episodes.push({
                        name: text,
                        url: href
                    });
                }
            });
        } else {
            episodeLinks.forEach(link => {
                episodes.push({
                    name: link.textContent.trim(),
                    url: link.href
                });
            });
        }

        if (episodes.length === 0) {
            const possibleTitles = document.querySelectorAll('h1, h2, h3, h4, .title, [class*="title"], [class*="episode"]');
            possibleTitles.forEach(title => {
                const text = title.textContent.trim();
                if (text && /episode|ep\s*\d+|season|s\d+e\d+/i.test(text)) {
                    episodes.push({
                        name: text,
                        url: window.location.href
                    });
                }
            });
        }

        return episodes.filter(ep => ep.name && ep.name.length > 0);
    }

    function findNextButton() {
        const allButtons = document.querySelectorAll('button, a');

        for (const btn of allButtons) {
            const text = btn.textContent.toLowerCase().trim();
            const className = btn.className.toLowerCase();
            const ariaLabel = (btn.getAttribute('aria-label') || '').toLowerCase();

            if (text.includes('next') ||
                text === '>' ||
                text === '→' ||
                className.includes('next') ||
                ariaLabel.includes('next')) {

                if (!btn.disabled && !btn.classList.contains('disabled')) {
                    return btn;
                }
            }
        }

        return null;
    }

    function goToNextPage() {
        return new Promise((resolve) => {
            const nextBtn = findNextButton();

            if (nextBtn) {
                nextBtn.click();
                currentPage++;
                setTimeout(() => {
                    resolve(true);
                }, 3000);
            } else {
                resolve(false);
            }
        });
    }

    async function scrapeAllPages() {
        const currentPageEpisodes = getCurrentPageEpisodes();
        allEpisodes = allEpisodes.concat(currentPageEpisodes);

        const btn = document.getElementById('scrape-download-btn');
        if (btn) {
            btn.innerHTML = `🔄 Scraping Page ${currentPage} (${allEpisodes.length} total)`;
        }

        const hasNext = await goToNextPage();

        if (hasNext) {
            setTimeout(scrapeAllPages, 4000);
        } else {
            finishScraping();
        }
    }

    function finishScraping() {
        isScrapingInProgress = false;

        // Filter out wetv.vip links when storing in JSON
        const filteredEpisodes = allEpisodes.filter(ep => !ep.url.includes('https://wetv.vip'));

        const jsonOutput = {
            episodes: filteredEpisodes.map(ep => ({
                name: ep.name,
                link: ep.url
            }))
        };

        console.log('=== SCRAPING COMPLETED ===');
        console.log(`Total episodes found: ${allEpisodes.length}`);
        console.log(`Episodes after filtering: ${filteredEpisodes.length}`);
        console.log(`Total pages scraped: ${currentPage}`);
        console.log('\n=== EPISODES JSON ===');
        console.log(JSON.stringify(jsonOutput, null, 2));

        if (filteredEpisodes.length > 0) {
            allEpisodes = filteredEpisodes;
            startSRTDownloading();
        } else {
            resetButton();
        }
    }

    function startSRTDownloading() {
        isDownloadingInProgress = true;
        currentDownloadIndex = 0;

        console.log('\n=== STARTING SRT DOWNLOADS ===');
        console.log(`Will download SRTs from ${allEpisodes.length} episodes`);

        downloadFromNextEpisode();
    }

    function downloadFromNextEpisode() {
        if (currentDownloadIndex >= allEpisodes.length) {
            finishDownloading();
            return;
        }

        const episode = allEpisodes[currentDownloadIndex];
        const btn = document.getElementById('scrape-download-btn');

        if (btn) {
            btn.innerHTML = `📥 Episode ${currentDownloadIndex + 1}/${allEpisodes.length}`;
        }

        console.log(`\n--- Opening episode ${currentDownloadIndex + 1}/${allEpisodes.length}: ${episode.name} ---`);

        const episodeUrl = episode.link || episode.url;

        // Open in background tab - use window.open with specific parameters to prevent focus
        const newTab = window.open('about:blank', '_blank');

        // Immediately redirect without focusing
        setTimeout(() => {
            if (newTab && !newTab.closed) {
                newTab.location.href = episodeUrl;
            }
        }, 100);

        // Wait for website initialization and analysis
        setTimeout(() => {
            if (!newTab || newTab.closed) {
                console.error(`Tab was closed prematurely for episode ${currentDownloadIndex + 1}`);
                currentDownloadIndex++;
                setTimeout(downloadFromNextEpisode, 2000);
                return;
            }

            // Create enhanced script with proper tracking
            const scriptCode = `
                (function() {
                    let totalSRTButtons = 0;
                    let downloadedCount = 0;
                    let downloadStarted = false;

                    console.log('🔍 Analyzing SRT buttons on this page...');

                    function countAndDownloadSRTs() {
                        if (downloadStarted) return;
                        downloadStarted = true;

                        const srtButtons = document.querySelectorAll('button[data-title*="[SRT]"]');
                        totalSRTButtons = srtButtons.length;

                        console.log('📊 Total SRT buttons found: ' + totalSRTButtons);

                        if (totalSRTButtons === 0) {
                            console.log('❌ No SRT buttons found on this page');
                            window.downloadStats = { total: 0, downloaded: 0, completed: true };
                            return;
                        }

                        console.log('🚀 Starting SRT downloads...');
                        window.downloadStats = { total: totalSRTButtons, downloaded: 0, completed: false };

                        srtButtons.forEach((button, index) => {
                            setTimeout(() => {
                                try {
                                    button.click();
                                    downloadedCount++;
                                    console.log('✓ Downloaded SRT ' + downloadedCount + '/' + totalSRTButtons + ' - ' + button.getAttribute('data-title'));

                                    // Update stats
                                    window.downloadStats.downloaded = downloadedCount;

                                    // Check if this is the LAST subtitle
                                    if (downloadedCount === totalSRTButtons) {
                                        console.log('🎯 LAST subtitle downloaded! Waiting ${newTabExtraTime}ms before completing...');
                                        setTimeout(() => {
                                            window.downloadStats.completed = true;
                                            console.log('✅ All ' + totalSRTButtons + ' SRT downloads completed for this page!');
                                        }, ${newTabExtraTime});
                                    }
                                } catch (error) {
                                    console.error('✗ Failed to download SRT ' + (index + 1) + ':', error);
                                    // Still count as attempted
                                    downloadedCount++;
                                    window.downloadStats.downloaded = downloadedCount;

                                    // If this was the last button, still mark as complete
                                    if (downloadedCount === totalSRTButtons) {
                                        setTimeout(() => {
                                            window.downloadStats.completed = true;
                                        }, ${newTabExtraTime});
                                    }
                                }
                            }, index * 2000);
                        });
                    }

                    // Start counting and downloading
                    countAndDownloadSRTs();
                })();
            `;

            try {
                if (newTab && !newTab.closed) {
                    newTab.eval(scriptCode);
                }
            } catch (error) {
                console.error(`❌ Error executing script in tab for episode ${currentDownloadIndex + 1}:`, error);
            }

            // Monitor progress and wait for completion
            const monitorProgress = () => {
                try {
                    if (!newTab || newTab.closed) {
                        console.log(`⚠️ Tab was closed for episode ${currentDownloadIndex + 1}`);
                        currentDownloadIndex++;
                        setTimeout(downloadFromNextEpisode, 2000);
                        return;
                    }

                    const stats = newTab.downloadStats;
                    if (stats && stats.completed) {
                        console.log(`✅ Episode ${currentDownloadIndex + 1} completed - Downloaded: ${stats.downloaded}/${stats.total} SRTs`);

                        // Close tab and move to next episode
                        try {
                            newTab.close();
                        } catch (e) {
                            console.log('Could not close tab automatically');
                        }

                        currentDownloadIndex++;
                        setTimeout(downloadFromNextEpisode, 2000);
                    } else {
                        // Keep monitoring
                        setTimeout(monitorProgress, 3000);
                    }
                } catch (error) {
                    // Tab access error, probably closed
                    console.log(`⚠️ Cannot access tab for episode ${currentDownloadIndex + 1}, moving to next`);
                    currentDownloadIndex++;
                    setTimeout(downloadFromNextEpisode, 2000);
                }
            };

            // Start monitoring after initialization
            setTimeout(monitorProgress, 2000);

        }, newTabInitializationTime);
    }

    function finishDownloading() {
        isDownloadingInProgress = false;

        console.log('\n=== ALL SRT DOWNLOADS COMPLETED ===');
        console.log(`✅ Processed ${allEpisodes.length} episodes`);

        resetButton();
    }

    function resetButton() {
        const btn = document.getElementById('scrape-download-btn');
        if (btn) {
            btn.innerHTML = '✅ Complete!';
            btn.style.background = '#4CAF50';

            setTimeout(() => {
                btn.innerHTML = '🎬 All eps all langs';
                btn.style.background = '#DC143C';
            }, 3000);
        }
    }

    function startScrapeAndDownload() {
        if (isScrapingInProgress || isDownloadingInProgress) {
            alert('Process is already in progress!');
            return;
        }

        isScrapingInProgress = true;
        allEpisodes = [];
        currentPage = 1;
        currentDownloadIndex = 0;

        console.clear();
        console.log('🚀 Starting scraping and SRT downloading process...');

        const btn = document.getElementById('scrape-download-btn');
        btn.style.background = '#FF9800';
        btn.innerHTML = '🔄 Starting...';

        scrapeAllPages();
    }

    async function scrapeAllPages() {
        const currentPageEpisodes = getCurrentPageEpisodes();
        allEpisodes = allEpisodes.concat(currentPageEpisodes);

        const btn = document.getElementById('scrape-download-btn');
        if (btn) {
            btn.innerHTML = `🔄 Scraping Page ${currentPage} (${allEpisodes.length} total)`;
        }

        const hasNext = await goToNextPage();

        if (hasNext) {
            setTimeout(scrapeAllPages, 4000);
        } else {
            finishScraping();
        }
    }

    function finishScraping() {
        isScrapingInProgress = false;

        // Filter out wetv.vip links when storing in JSON
        const filteredEpisodes = allEpisodes.filter(ep => !ep.url.includes('https://wetv.vip'));

        const jsonOutput = {
            episodes: filteredEpisodes.map(ep => ({
                name: ep.name,
                link: ep.url
            }))
        };

        console.log('=== SCRAPING COMPLETED ===');
        console.log(`Total episodes found: ${allEpisodes.length}`);
        console.log(`Episodes after filtering: ${filteredEpisodes.length}`);
        console.log(`Total pages scraped: ${currentPage}`);
        console.log('\n=== EPISODES JSON ===');
        console.log(JSON.stringify(jsonOutput, null, 2));

        if (filteredEpisodes.length > 0) {
            allEpisodes = filteredEpisodes;
            startSRTDownloading();
        } else {
            resetButton();
        }
    }

    function getCurrentPageEpisodes() {
        const episodes = [];

        const episodeLinks = document.querySelectorAll('a[href*="/watch"], a[href*="/episode"], a[href*="/ep"], a[class*="episode"], .episode-link');

        if (episodeLinks.length === 0) {
            const possibleEpisodeLinks = document.querySelectorAll('a[href]');
            possibleEpisodeLinks.forEach(link => {
                const text = link.textContent.trim();
                const href = link.href;

                if (href.includes('/watch') ||
                    href.includes('/episode') ||
                    href.includes('/ep') ||
                    /episode|ep\s*\d+|season|s\d+e\d+/i.test(text)) {
                    episodes.push({
                        name: text,
                        url: href
                    });
                }
            });
        } else {
            episodeLinks.forEach(link => {
                episodes.push({
                    name: link.textContent.trim(),
                    url: link.href
                });
            });
        }

        if (episodes.length === 0) {
            const possibleTitles = document.querySelectorAll('h1, h2, h3, h4, .title, [class*="title"], [class*="episode"]');
            possibleTitles.forEach(title => {
                const text = title.textContent.trim();
                if (text && /episode|ep\s*\d+|season|s\d+e\d+/i.test(text)) {
                    episodes.push({
                        name: text,
                        url: window.location.href
                    });
                }
            });
        }

        return episodes.filter(ep => ep.name && ep.name.length > 0);
    }

    function findNextButton() {
        const allButtons = document.querySelectorAll('button, a');

        for (const btn of allButtons) {
            const text = btn.textContent.toLowerCase().trim();
            const className = btn.className.toLowerCase();
            const ariaLabel = (btn.getAttribute('aria-label') || '').toLowerCase();

            if (text.includes('next') ||
                text === '>' ||
                text === '→' ||
                className.includes('next') ||
                ariaLabel.includes('next')) {

                if (!btn.disabled && !btn.classList.contains('disabled')) {
                    return btn;
                }
            }
        }

        return null;
    }

    function goToNextPage() {
        return new Promise((resolve) => {
            const nextBtn = findNextButton();

            if (nextBtn) {
                nextBtn.click();
                currentPage++;
                setTimeout(() => {
                    resolve(true);
                }, 3000);
            } else {
                resolve(false);
            }
        });
    }

    function startSRTDownloading() {
        isDownloadingInProgress = true;
        currentDownloadIndex = 0;

        console.log('\n=== STARTING SRT DOWNLOADS ===');
        console.log(`📋 Will process ${allEpisodes.length} episodes for SRT downloads`);

        downloadFromNextEpisode();
    }

})();