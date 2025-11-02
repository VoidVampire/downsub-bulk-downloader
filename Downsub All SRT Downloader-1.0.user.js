// ==UserScript==
// @name         Downsub All SRT Downloader
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Download all SRT files
// @author       You
// @match        https://downsub.com/*
// @match        https://www.downsub.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Wait for page to load
    setTimeout(() => {
        addAutoDownloadButton();
    }, 2000);

    function addAutoDownloadButton() {
        // Check if button already exists
        if (document.getElementById('auto-srt-btn')) return;

        // Create the button
        const autoBtn = document.createElement('button');
        autoBtn.id = 'auto-srt-btn';
        autoBtn.innerHTML = '📥 Download All SRT';
        autoBtn.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            background: #4CAF50;
            color: white;
            border: none;
            padding: 12px 16px;
            border-radius: 8px;
            font-weight: bold;
            cursor: pointer;
            box-shadow: 0 4px 8px rgba(0,0,0,0.3);
            font-size: 14px;
        `;

        // Add hover effect
        autoBtn.onmouseover = () => autoBtn.style.background = '#45a049';
        autoBtn.onmouseout = () => autoBtn.style.background = '#4CAF50';

        // Add click handler
        autoBtn.onclick = downloadAllSRT;

        // Add button to page
        document.body.appendChild(autoBtn);
    }

    function downloadAllSRT() {
        const srtButtons = document.querySelectorAll('button[data-title*="[SRT]"]');

        if (srtButtons.length === 0) {
            alert('No SRT buttons found on this page!');
            return;
        }

        // Disable button during download
        const btn = document.getElementById('auto-srt-btn');
        btn.style.background = '#666';
        btn.innerHTML = '⏳ Downloading...';
        btn.disabled = true;

        console.log(`Found ${srtButtons.length} SRT buttons. Starting downloads with...`);

        srtButtons.forEach((button, index) => {
            setTimeout(() => {
                try {
                    button.click();
                    console.log(`✓ Clicked SRT button ${index + 1}/${srtButtons.length} - ${button.getAttribute('data-title')}`);

                    // Update button text with progress
                    btn.innerHTML = `⏳ ${index + 1}/${srtButtons.length}`;

                    // Re-enable button when done
                    if (index === srtButtons.length - 1) {
                        setTimeout(() => {
                            btn.style.background = '#4CAF50';
                            btn.innerHTML = '📥 Download All SRT';
                            btn.disabled = false;
                            console.log('✓ All SRT downloads completed!');
                        }, 1000);
                    }
                } catch (error) {
                    console.error(`✗ Failed to click button ${index + 1}:`, error);
                }
            }, index * 2000);
        });
    }

    // Also add keyboard shortcut (Ctrl+Shift+D)
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.shiftKey && e.key === 'D') {
            e.preventDefault();
            downloadAllSRT();
        }
    });

})();