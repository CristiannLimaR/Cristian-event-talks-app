document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const refreshBtn = document.getElementById('refresh-btn');
    const refreshSpinner = document.getElementById('refresh-spinner');
    const lastUpdatedText = document.getElementById('last-updated-text');
    const timelineLoading = document.getElementById('timeline-loading');
    const timelineError = document.getElementById('timeline-error');
    const errorMessage = document.getElementById('error-message');
    const retryBtn = document.getElementById('retry-btn');
    const releaseNotesContainer = document.getElementById('release-notes-container');

    // Tweet Composer Elements
    const tweetEmptyState = document.getElementById('tweet-empty-state');
    const tweetActiveState = document.getElementById('tweet-active-state');
    const clearSelectionBtn = document.getElementById('clear-selection-btn');
    const selectedTextPreview = document.getElementById('selected-text-preview');
    const tweetTextarea = document.getElementById('tweet-textarea');
    const charCountText = document.getElementById('char-count-text');
    const progressRingBar = document.getElementById('progress-ring-bar');
    const charWarning = document.getElementById('char-warning');
    const copyTweetBtn = document.getElementById('copy-tweet-btn');
    const copyBtnText = document.getElementById('copy-btn-text');
    const sendTweetBtn = document.getElementById('send-tweet-btn');
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');

    // Global state
    let selectedUpdate = null;
    const progressRingCircumference = 88; // 2 * pi * r (r=14)

    // Parse the XML content into structured selectable items
    function parseContentToItems(contentHtml, dateStr) {
        const temp = document.createElement('div');
        temp.innerHTML = contentHtml;
        
        const items = [];
        let currentCategory = 'Update';
        
        // Traverse through direct children
        Array.from(temp.children).forEach(child => {
            if (child.tagName === 'H3') {
                currentCategory = child.textContent.trim();
            } else if (child.tagName === 'P') {
                const text = child.textContent.trim();
                const html = child.innerHTML;
                if (text) {
                    items.push({
                        category: currentCategory,
                        text: text,
                        html: html,
                        date: dateStr
                    });
                }
            } else if (child.tagName === 'UL') {
                Array.from(child.children).forEach(li => {
                    if (li.tagName === 'LI') {
                        const text = li.textContent.trim();
                        const html = li.innerHTML;
                        if (text) {
                            items.push({
                                category: currentCategory,
                                text: text,
                                html: html,
                                date: dateStr
                            });
                        }
                    }
                });
            }
        });
        
        // Fallback if feed has flat structure or custom HTML
        if (items.length === 0 && temp.textContent.trim()) {
            items.push({
                category: 'General',
                text: temp.textContent.trim(),
                html: temp.innerHTML,
                date: dateStr
            });
        }
        
        return items;
    }

    // Render release notes on the page
    function renderReleases(releases) {
        releaseNotesContainer.innerHTML = '';
        
        if (!releases || releases.length === 0) {
            releaseNotesContainer.innerHTML = '<div class="glass-panel loading-state"><p>No release notes found.</p></div>';
            return;
        }

        releases.forEach(release => {
            const card = document.createElement('article');
            card.className = 'release-card glass-panel';
            
            // Card Header
            const header = document.createElement('div');
            header.className = 'release-card-header';
            
            const date = document.createElement('h3');
            date.className = 'release-date';
            date.textContent = release.title;
            
            const badge = document.createElement('span');
            badge.className = 'badge';
            badge.textContent = 'BigQuery';
            
            header.appendChild(date);
            header.appendChild(badge);
            card.appendChild(header);
            
            // Card Body (containing selectable elements)
            const body = document.createElement('div');
            body.className = 'release-card-body feed-content';
            
            // Parse and create items
            const items = parseContentToItems(release.content, release.title);
            
            items.forEach(item => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'update-item';
                
                // Add the inner HTML structure
                itemDiv.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
                        <span class="badge" style="background: rgba(139, 92, 246, 0.1); color: var(--accent-purple); border: 1px solid rgba(139, 92, 246, 0.2);">${item.category}</span>
                    </div>
                    <div>${item.html}</div>
                    <div class="item-selector-indicator"></div>
                `;
                
                // Clicking select item
                itemDiv.addEventListener('click', (e) => {
                    // Prevent text selection inside links from selecting card if user clicked a link
                    if (e.target.tagName === 'A') return;
                    
                    selectUpdateItem(itemDiv, item);
                });
                
                body.appendChild(itemDiv);
            });
            
            card.appendChild(body);
            releaseNotesContainer.appendChild(card);
        });
    }

    // Select a specific release note item
    function selectUpdateItem(element, item) {
        // Remove active class from all other items
        document.querySelectorAll('.update-item').forEach(el => {
            el.classList.remove('selected');
        });
        
        // Add active class
        element.classList.add('selected');
        selectedUpdate = item;
        
        // Populate composer
        selectedTextPreview.innerHTML = `
            <strong>[${item.category}]</strong> ${item.html}
            <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.5rem;">Published: ${item.date}</div>
        `;
        
        // Build initial Tweet
        const prefix = `📢 BigQuery Update (${item.date}) [${item.category}]: `;
        const suffix = `\n\n#GoogleCloud #BigQuery`;
        const availableLength = 280 - prefix.length - suffix.length;
        
        let cleanText = item.text;
        if (cleanText.length > availableLength) {
            cleanText = cleanText.substring(0, availableLength - 3) + "...";
        }
        
        tweetTextarea.value = `${prefix}${cleanText}${suffix}`;
        updateCharacterCount();
        
        // Show active composer state
        tweetEmptyState.classList.add('hidden');
        tweetActiveState.classList.remove('hidden');
        
        // Smooth scroll to composer on smaller screens
        if (window.innerWidth <= 900) {
            tweetActiveState.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }

    // Clear composer selection
    function clearSelection() {
        document.querySelectorAll('.update-item').forEach(el => {
            el.classList.remove('selected');
        });
        selectedUpdate = null;
        tweetActiveState.classList.add('hidden');
        tweetEmptyState.classList.remove('hidden');
    }

    // Update character counter and circular progress ring
    function updateCharacterCount() {
        const text = tweetTextarea.value;
        const length = text.length;
        charCountText.textContent = `${length} / 280`;
        
        // Circle progress logic
        const percentage = Math.min(length / 280, 1);
        const offset = progressRingCircumference - (percentage * progressRingCircumference);
        progressRingBar.style.strokeDashoffset = offset;
        
        // Handle limits
        if (length > 280) {
            progressRingBar.style.stroke = 'var(--error)';
            charCountText.style.color = 'var(--error)';
            charWarning.classList.remove('hidden');
            sendTweetBtn.disabled = true;
            sendTweetBtn.style.opacity = '0.5';
            sendTweetBtn.style.cursor = 'not-allowed';
        } else if (length > 250) {
            progressRingBar.style.stroke = 'var(--warning)';
            charCountText.style.color = 'var(--warning)';
            charWarning.classList.add('hidden');
            sendTweetBtn.disabled = false;
            sendTweetBtn.style.opacity = '1';
            sendTweetBtn.style.cursor = 'pointer';
        } else {
            progressRingBar.style.stroke = 'var(--accent-blue)';
            charCountText.style.color = 'var(--text-secondary)';
            charWarning.classList.add('hidden');
            sendTweetBtn.disabled = false;
            sendTweetBtn.style.opacity = '1';
            sendTweetBtn.style.cursor = 'pointer';
        }
    }

    // Show feedback toast
    function showToast(message, isError = false) {
        toastMessage.textContent = message;
        toast.style.background = isError ? 'rgba(239, 68, 68, 0.95)' : 'rgba(16, 185, 129, 0.95)';
        toast.classList.remove('hidden');
        
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 3000);
    }

    // Fetch releases from the API
    async function fetchReleases() {
        // UI updates
        refreshSpinner.classList.add('spinning');
        refreshBtn.disabled = true;
        
        // Hide list/error, show loading if it's the first fetch or container is empty
        if (releaseNotesContainer.children.length === 0) {
            timelineLoading.classList.remove('hidden');
            timelineError.classList.add('hidden');
        }

        try {
            const response = await fetch('/api/releases');
            const data = await response.json();
            
            if (data.status === 'success') {
                renderReleases(data.releases);
                lastUpdatedText.textContent = `Last synced: ${data.last_fetched}`;
                
                timelineLoading.classList.add('hidden');
                timelineError.classList.add('hidden');
            } else {
                throw new Error(data.message || 'Server error occurred');
            }
        } catch (error) {
            console.error('Fetch error:', error);
            errorMessage.textContent = `Could not sync feed details: ${error.message}`;
            
            if (releaseNotesContainer.children.length === 0) {
                timelineLoading.classList.add('hidden');
                timelineError.classList.remove('hidden');
            } else {
                showToast(`Sync failed: ${error.message}`, true);
            }
        } finally {
            refreshSpinner.classList.remove('spinning');
            refreshBtn.disabled = false;
        }
    }

    // Event Listeners
    refreshBtn.addEventListener('click', fetchReleases);
    retryBtn.addEventListener('click', fetchReleases);
    clearSelectionBtn.addEventListener('click', clearSelection);
    tweetTextarea.addEventListener('input', updateCharacterCount);

    // Copy to Clipboard
    copyTweetBtn.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(tweetTextarea.value);
            copyBtnText.textContent = 'Copied!';
            showToast('Tweet text copied to clipboard!');
            setTimeout(() => {
                copyBtnText.textContent = 'Copy';
            }, 2000);
        } catch (err) {
            showToast('Failed to copy text.', true);
        }
    });

    // Send Tweet (Twitter Web Intent)
    sendTweetBtn.addEventListener('click', () => {
        const text = tweetTextarea.value;
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
        window.open(twitterUrl, '_blank', 'noopener,noreferrer');
    });

    // Initial Load
    fetchReleases();
});
