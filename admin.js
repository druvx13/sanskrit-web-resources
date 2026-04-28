// admin.js
(function() {
    const STORAGE_KEY = 'sanskrit_retro_stratum_v8';
    const TOKEN_KEY = 'github_token';
    const REPO_CONFIG_KEY = 'repo_config';

    let currentData = [];
    let token = '';
    let repoConfig = { owner: '', repo: '', branch: 'main' };

    function loadData() {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                currentData = JSON.parse(stored);
            } catch (e) {
                currentData = cloneDefault();
            }
        } else {
            currentData = cloneDefault();
        }
    }

    function cloneDefault() {
        return JSON.parse(JSON.stringify(window.SANSKRIT_DATA || []));
    }

    function saveLocal() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(currentData));
        displayStatus('Data saved to localStorage.', 'green');
    }

    function loadToken() {
        token = localStorage.getItem(TOKEN_KEY) || '';
        document.getElementById('github-token-input').value = token;
    }

    function saveToken() {
        token = document.getElementById('github-token-input').value.trim();
        if (token) {
            localStorage.setItem(TOKEN_KEY, token);
            displayStatus('Token saved.', 'green');
        } else {
            localStorage.removeItem(TOKEN_KEY);
            displayStatus('Token cleared.', 'darkorange');
        }
    }

    function loadRepoConfig() {
        const saved = localStorage.getItem(REPO_CONFIG_KEY);
        if (saved) {
            try { repoConfig = JSON.parse(saved); } catch (e) {}
        }
        document.getElementById('repo-owner').value = repoConfig.owner;
        document.getElementById('repo-name').value = repoConfig.repo;
        document.getElementById('repo-branch').value = repoConfig.branch;
    }

    function saveRepoConfig() {
        repoConfig.owner = document.getElementById('repo-owner').value.trim();
        repoConfig.repo = document.getElementById('repo-name').value.trim();
        repoConfig.branch = document.getElementById('repo-branch').value.trim();
        localStorage.setItem(REPO_CONFIG_KEY, JSON.stringify(repoConfig));
    }

    function displayStatus(msg, color) {
        const status = document.getElementById('status-message');
        if (status) {
            status.textContent = msg;
            status.style.color = color || 'black';
        }
    }

    // ── UI population ──
    function populateCatSelects() {
        const selects = [
            document.getElementById('edit-cat-select'),
            document.getElementById('sub-cat-target'),
            document.getElementById('link-cat-select')
        ];
        selects.forEach(sel => {
            if (!sel) return;
            const currentVal = sel.value;
            sel.innerHTML = '<option value="">-- select --</option>';
            currentData.forEach((cat, idx) => {
                sel.add(new Option(cat.primary, idx));
            });
            if (currentVal !== '' && sel.querySelector(`option[value="${currentVal}"]`)) {
                sel.value = currentVal;
            }
        });

        // Populate move source/destination category selects separately
        populateMoveCatSelects();
        updateSubSelect();
    }

    function populateMoveCatSelects() {
        const srcCat = document.getElementById('move-src-cat');
        const destCat = document.getElementById('move-dest-cat');
        [srcCat, destCat].forEach(sel => {
            if (!sel) return;
            const currentVal = sel.value;
            sel.innerHTML = '<option value="">-- select --</option>';
            currentData.forEach((cat, idx) => {
                sel.add(new Option(cat.primary, idx));
            });
            if (currentVal !== '' && sel.querySelector(`option[value="${currentVal}"]`)) {
                sel.value = currentVal;
            }
        });
    }

    function updateSubSelect() {
        const catIdx = document.getElementById('link-cat-select')?.value;
        const subSel = document.getElementById('link-sub-select');
        if (!subSel) return;
        subSel.innerHTML = '<option value="">-- select --</option>';
        if (catIdx !== '' && catIdx !== null) {
            const cat = currentData[catIdx];
            cat.subCategories.forEach((sub, idx) => {
                const label = sub.name || '(no label)';
                subSel.add(new Option(label, idx));
            });
        }
    }

    function updateMoveSubSelects() {
        const srcCatIdx = document.getElementById('move-src-cat').value;
        const destCatIdx = document.getElementById('move-dest-cat').value;
        const srcSub = document.getElementById('move-src-sub');
        const destSub = document.getElementById('move-dest-sub');

        [srcSub, destSub].forEach(sel => sel.innerHTML = '<option value="">-- select --</option>');

        if (srcCatIdx !== '' && srcCatIdx !== null) {
            currentData[srcCatIdx].subCategories.forEach((sub, idx) => {
                const label = sub.name || '(no label)';
                srcSub.add(new Option(label, idx));
            });
        }
        if (destCatIdx !== '' && destCatIdx !== null) {
            currentData[destCatIdx].subCategories.forEach((sub, idx) => {
                const label = sub.name || '(no label)';
                destSub.add(new Option(label, idx));
            });
        }
        renderMoveLinkList();
    }

    function renderMoveLinkList() {
        const container = document.getElementById('move-src-links');
        if (!container) return;
        container.innerHTML = '';
        const catIdx = document.getElementById('move-src-cat').value;
        const subIdx = document.getElementById('move-src-sub').value;
        if (catIdx === '' || subIdx === '') return;

        const links = currentData[catIdx].subCategories[subIdx].links;
        if (links.length === 0) {
            container.textContent = '(no links)';
            return;
        }

        links.forEach((link, i) => {
            const div = document.createElement('div');
            div.className = 'move-link-item';
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = 'move-link-' + i;
            checkbox.value = i;
            const label = document.createElement('label');
            label.htmlFor = 'move-link-' + i;
            label.textContent = `${link.url} — ${link.desc.substring(0, 70)}…`;
            div.appendChild(checkbox);
            div.appendChild(label);
            container.appendChild(div);
        });
    }

    function renderPreview() {
        const preview = document.getElementById('data-preview');
        if (!preview) return;
        preview.innerHTML = '';
        currentData.forEach((cat, ci) => {
            const catDiv = document.createElement('div');
            catDiv.innerHTML = `<strong>${cat.primary}</strong>`;
            cat.subCategories.forEach((sub, si) => {
                const subDiv = document.createElement('div');
                subDiv.style.marginLeft = '20px';
                subDiv.textContent = `↳ ${sub.name || '(no label)'} [${sub.links.length} links]`;
                catDiv.appendChild(subDiv);
            });
            preview.appendChild(catDiv);
        });
    }

    function renderLinkList() {
        const container = document.getElementById('link-list-container');
        if (!container) return;
        container.innerHTML = '';
        const catIdx = document.getElementById('link-cat-select').value;
        const subIdx = document.getElementById('link-sub-select').value;
        if (catIdx === '' || subIdx === '') return;
        const links = currentData[catIdx].subCategories[subIdx].links;
        links.forEach((link, li) => {
            const div = document.createElement('div');
            div.className = 'list-item';
            div.innerHTML = `<div class="inline-link">
                <textarea readonly rows="1" style="flex:1;">${link.url}</textarea>
                <textarea readonly rows="1" style="flex:2;">${link.desc}</textarea>
                <button data-index="${li}" class="edit-link-btn">Edit</button>
                <button data-index="${li}" class="delete-link-btn">Delete</button>
            </div>`;
            container.appendChild(div);
        });

        document.querySelectorAll('.edit-link-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const idx = this.getAttribute('data-index');
                const link = currentData[catIdx].subCategories[subIdx].links[idx];
                const newUrl = prompt('Edit URL:', link.url);
                if (newUrl !== null) {
                    link.url = newUrl.trim();
                    const newDesc = prompt('Edit description:', link.desc);
                    if (newDesc !== null) link.desc = newDesc.trim();
                    refreshAll();
                }
            });
        });
        document.querySelectorAll('.delete-link-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const idx = this.getAttribute('data-index');
                if (confirm('Delete this link?')) {
                    currentData[catIdx].subCategories[subIdx].links.splice(idx, 1);
                    refreshAll();
                }
            });
        });
    }

    function refreshAll() {
        populateCatSelects();
        renderPreview();
        renderLinkList();
        // Also refresh move UI if it has selections
        const srcCat = document.getElementById('move-src-cat').value;
        const srcSub = document.getElementById('move-src-sub').value;
        if (srcCat !== '' && srcSub !== '') renderMoveLinkList();
    }

    // ── Move links implementation ──
    function handleMoveLinks() {
        const srcCatIdx = document.getElementById('move-src-cat').value;
        const srcSubIdx = document.getElementById('move-src-sub').value;
        const destCatIdx = document.getElementById('move-dest-cat').value;
        const destSubIdx = document.getElementById('move-dest-sub').value;

        if (srcCatIdx === '' || srcSubIdx === '' || destCatIdx === '' || destSubIdx === '') {
            return displayStatus('Please select both source and destination categories and sub‑categories.', 'red');
        }
        if (srcCatIdx === destCatIdx && srcSubIdx === destSubIdx) {
            return displayStatus('Source and destination are the same. No move performed.', 'darkorange');
        }

        const checkboxes = document.querySelectorAll('#move-src-links input[type="checkbox"]:checked');
        if (checkboxes.length === 0) {
            return displayStatus('No links selected.', 'darkorange');
        }

        const srcLinks = currentData[srcCatIdx].subCategories[srcSubIdx].links;
        const destLinks = currentData[destCatIdx].subCategories[destSubIdx].links;

        // Collect indices to move (in descending order to avoid index shift when removing)
        const indicesToMove = Array.from(checkboxes).map(cb => parseInt(cb.value)).sort((a,b) => b - a);
        const movedLinks = [];

        indicesToMove.forEach(idx => {
            movedLinks.push(srcLinks[idx]);
            srcLinks.splice(idx, 1);
        });

        // Add to destination (in original order, so reverse the movedLinks array)
        movedLinks.reverse();
        destLinks.push(...movedLinks);

        displayStatus(`Moved ${movedLinks.length} link(s).`, 'green');
        refreshAll();
        // Uncheck all
        document.querySelectorAll('#move-src-links input[type="checkbox"]').forEach(cb => cb.checked = false);
    }

    // ── Category / Sub / Link handlers ──
    function handleAddCategory() {
        const nameInput = document.getElementById('new-cat-name');
        const name = nameInput.value.trim();
        if (!name) return displayStatus('Category name required.', 'red');
        currentData.push({ primary: name, subCategories: [] });
        nameInput.value = '';
        refreshAll();
    }

    function handleRenameCategory() {
        const sel = document.getElementById('edit-cat-select');
        if (sel.value === '') return displayStatus('Select a category.', 'red');
        const newName = prompt('New name:', currentData[sel.value].primary);
        if (newName && newName.trim()) {
            currentData[sel.value].primary = newName.trim();
            refreshAll();
        }
    }

    function handleDeleteCategory() {
        const sel = document.getElementById('edit-cat-select');
        if (sel.value === '') return displayStatus('Select a category.', 'red');
        if (confirm(`Delete category "${currentData[sel.value].primary}" and all its sub‑categories?`)) {
            currentData.splice(sel.value, 1);
            refreshAll();
        }
    }

    function handleAddEditSub() {
        const catIdx = document.getElementById('sub-cat-target').value;
        if (catIdx === '') return displayStatus('Select a target category.', 'red');
        const nameInput = document.getElementById('new-sub-name');
        const subName = nameInput.value.trim();
        currentData[catIdx].subCategories.push({ name: subName || null, links: [] });
        nameInput.value = '';
        refreshAll();
    }

    function handleDeleteSub() {
        const catIdx = document.getElementById('link-cat-select').value;
        const subIdx = document.getElementById('link-sub-select').value;
        if (catIdx === '' || subIdx === '') return displayStatus('Select category and sub‑category.', 'red');
        if (confirm(`Delete sub‑category?`)) {
            currentData[catIdx].subCategories.splice(subIdx, 1);
            refreshAll();
        }
    }

    function handleAddLink() {
        const catIdx = document.getElementById('link-cat-select').value;
        const subIdx = document.getElementById('link-sub-select').value;
        if (catIdx === '' || subIdx === '') return displayStatus('Select category and sub‑category first.', 'red');
        const url = document.getElementById('new-link-url').value.trim();
        const desc = document.getElementById('new-link-desc').value.trim();
        if (!url || !desc) return displayStatus('Both URL and description are required.', 'red');
        currentData[catIdx].subCategories[subIdx].links.push({ url, desc });
        document.getElementById('new-link-url').value = '';
        document.getElementById('new-link-desc').value = '';
        refreshAll();
    }

    // ── GitHub API functions ──
    function getAuthHeaders() {
        if (!token) return null;
        return {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json'
        };
    }

    async function getFileSHA() {
        const headers = getAuthHeaders();
        if (!headers) throw new Error('No GitHub token provided.');
        saveRepoConfig();
        const url = `https://api.github.com/repos/${repoConfig.owner}/${repoConfig.repo}/contents/data.js?ref=${repoConfig.branch}`;
        const response = await fetch(url, { headers });
        if (response.status === 404) return null;
        if (!response.ok) throw new Error(`GitHub API error: ${response.statusText}`);
        const data = await response.json();
        return data.sha;
    }

    function generateDataJSContent() {
        return 'window.SANSKRIT_DATA = ' + JSON.stringify(currentData, null, 2) + ';';
    }

    async function pushToGitHub() {
        if (!token) return displayStatus('Please enter and save a GitHub token first.', 'red');
        saveRepoConfig();
        if (!repoConfig.owner || !repoConfig.repo) return displayStatus('Repository owner and name are required.', 'red');

        const content = generateDataJSContent();
        const headers = getAuthHeaders();
        const body = {
            message: 'Update Sanskrit resources data',
            content: btoa(unescape(encodeURIComponent(content))),
            branch: repoConfig.branch
        };

        try {
            const sha = await getFileSHA();
            if (sha) body.sha = sha;
            const url = `https://api.github.com/repos/${repoConfig.owner}/${repoConfig.repo}/contents/data.js`;
            const response = await fetch(url, {
                method: 'PUT',
                headers: { ...headers, 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.message || response.statusText);
            }
            displayStatus('Successfully pushed to GitHub!', 'green');
            saveLocal();
        } catch (error) {
            displayStatus('Push failed: ' + error.message, 'red');
        }
    }

    // ── Initialization ──
    function bindEvents() {
        // Token management
        document.getElementById('save-token-btn').addEventListener('click', saveToken);
        document.getElementById('clear-token-btn').addEventListener('click', function() {
            localStorage.removeItem(TOKEN_KEY);
            token = '';
            document.getElementById('github-token-input').value = '';
            displayStatus('Token removed.', 'darkorange');
        });
        document.getElementById('toggle-token-vis').addEventListener('click', function() {
            const inp = document.getElementById('github-token-input');
            const isPassword = inp.type === 'password';
            inp.type = isPassword ? 'text' : 'password';
            this.textContent = isPassword ? 'Hide' : 'Show';
        });
        document.getElementById('github-token-input').addEventListener('change', saveToken);

        ['repo-owner', 'repo-name', 'repo-branch'].forEach(id => {
            document.getElementById(id).addEventListener('change', saveRepoConfig);
        });

        document.getElementById('add-cat-btn').addEventListener('click', handleAddCategory);
        document.getElementById('rename-cat-btn').addEventListener('click', handleRenameCategory);
        document.getElementById('delete-cat-btn').addEventListener('click', handleDeleteCategory);
        document.getElementById('add-sub-btn').addEventListener('click', handleAddEditSub);
        document.getElementById('delete-sub-btn').addEventListener('click', handleDeleteSub);
        document.getElementById('add-link-btn').addEventListener('click', handleAddLink);
        document.getElementById('link-cat-select').addEventListener('change', function() {
            updateSubSelect();
            renderLinkList();
        });
        document.getElementById('link-sub-select').addEventListener('change', renderLinkList);

        // Move links selects
        document.getElementById('move-src-cat').addEventListener('change', function() {
            updateMoveSubSelects();
        });
        document.getElementById('move-src-sub').addEventListener('change', renderMoveLinkList);
        document.getElementById('move-dest-cat').addEventListener('change', function() {
            updateMoveSubSelects();
        });
        // destination sub change doesn't need special handler
        document.getElementById('move-links-btn').addEventListener('click', handleMoveLinks);

        document.getElementById('save-local-btn').addEventListener('click', saveLocal);
        document.getElementById('push-github-btn').addEventListener('click', pushToGitHub);
        document.getElementById('reset-btn').addEventListener('click', function() {
            if (confirm('Reset to default data? This will replace everything.')) {
                currentData = cloneDefault();
                refreshAll();
                saveLocal();
            }
        });
        document.getElementById('export-btn').addEventListener('click', function() {
            const blob = new Blob([generateDataJSContent()], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'data.js';
            a.click();
            URL.revokeObjectURL(url);
        });
    }

    function init() {
        loadData();
        loadToken();
        loadRepoConfig();
        populateCatSelects();
        renderPreview();
        bindEvents();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
