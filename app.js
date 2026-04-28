// app.js
(function() {
    const STORAGE_KEY = 'sanskrit_retro_stratum_v8';

    // Use the data from data.js (window.SANSKRIT_DATA)
    function getDefaultData() {
        return window.SANSKRIT_DATA || [];
    }

    function getStoredData() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            if (!Array.isArray(parsed) || parsed.length === 0) return null;
            if (!parsed.every(c => typeof c.primary === 'string' && Array.isArray(c.subCategories))) return null;
            return parsed;
        } catch (e) { return null; }
    }

    function setStoredData(data) {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); return true; } catch (e) { return false; }
    }

    function initializeData() {
        const existing = getStoredData();
        if (existing) return existing;
        const defaults = getDefaultData();
        if (defaults.length > 0) setStoredData(defaults);
        return defaults;
    }

    function slugify(text) {
        return text
            .toLowerCase()
            .replace(/&/g, 'and')
            .replace(/[^\w\s-]/g, '')
            .trim()
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-');
    }

    function buildToC(data) {
        const tocContainer = document.getElementById('toc-container');
        if (!tocContainer) return;
        tocContainer.innerHTML = '';

        const titleDiv = document.createElement('div');
        titleDiv.className = 'toc-title';
        titleDiv.textContent = 'Table of Contents';
        tocContainer.appendChild(titleDiv);

        const tocTable = document.createElement('table');
        tocTable.setAttribute('border', '1');
        tocTable.setAttribute('cellpadding', '4');
        tocTable.setAttribute('cellspacing', '0');
        tocTable.setAttribute('width', '100%');

        const tbody = document.createElement('tbody');
        data.forEach(primaryCat => {
            const primaryId = 'cat-' + slugify(primaryCat.primary);
            const trPrimary = document.createElement('tr');
            const tdPrimary = document.createElement('td');
            const linkPrimary = document.createElement('a');
            linkPrimary.href = '#' + primaryId;
            linkPrimary.className = 'toc-primary';
            linkPrimary.textContent = primaryCat.primary;
            tdPrimary.appendChild(linkPrimary);
            trPrimary.appendChild(tdPrimary);
            tbody.appendChild(trPrimary);

            if (primaryCat.subCategories && primaryCat.subCategories.length > 0) {
                primaryCat.subCategories.forEach(subCat => {
                    if (!subCat.name) return;
                    const subId = 'subcat-' + slugify(subCat.name);
                    const trSub = document.createElement('tr');
                    const tdSub = document.createElement('td');
                    const linkSub = document.createElement('a');
                    linkSub.href = '#' + subId;
                    linkSub.className = 'toc-sub';
                    linkSub.textContent = '› ' + subCat.name;
                    tdSub.appendChild(linkSub);
                    trSub.appendChild(tdSub);
                    tbody.appendChild(trSub);
                });
            }
        });
        tocTable.appendChild(tbody);
        tocContainer.appendChild(tocTable);
    }

    function formatDisplayUrl(url) {
        let display = url.replace(/^https?:\/\//, '');
        display = display.replace(/\/$/, '');
        if (display.length > 55) {
            const slashIdx = display.indexOf('/');
            if (slashIdx > 0 && slashIdx < 38) {
                display = display.substring(0, slashIdx) + '/…' + display.substring(display.length - 18);
            } else {
                display = display.substring(0, 38) + '…';
            }
        }
        return display;
    }

    function renderAll(data) {
        const container = document.getElementById('resources-container');
        if (!container) return;
        container.innerHTML = '';

        if (!data || data.length === 0) {
            container.innerHTML = '<p class="no-data">No resources found.</p>';
            return;
        }

        data.forEach(primaryCat => {
            const primaryId = 'cat-' + slugify(primaryCat.primary);
            const h2 = document.createElement('h2');
            h2.id = primaryId;
            h2.textContent = primaryCat.primary;
            container.appendChild(h2);

            primaryCat.subCategories.forEach(subCat => {
                if (subCat.name) {
                    const subId = 'subcat-' + slugify(subCat.name);
                    const h3 = document.createElement('h3');
                    h3.id = subId;
                    h3.textContent = subCat.name;
                    container.appendChild(h3);
                }

                if (!subCat.links || subCat.links.length === 0) {
                    const msg = document.createElement('p');
                    msg.className = 'no-data';
                    msg.textContent = '(No links in this category)';
                    container.appendChild(msg);
                    return;
                }

                const wrapper = document.createElement('div');
                wrapper.className = 'table-scroll';

                const table = document.createElement('table');
                table.setAttribute('border', '1');
                table.setAttribute('cellpadding', '6');
                table.setAttribute('cellspacing', '0');
                table.setAttribute('width', '100%');
                table.setAttribute('aria-label', subCat.name || primaryCat.primary);

                const thead = document.createElement('thead');
                const headerRow = document.createElement('tr');
                const thField = document.createElement('th');
                thField.textContent = 'Field';
                thField.setAttribute('width', '15%');
                thField.style.cssText = 'text-align:left;font-size:0.85rem;font-weight:bold;';
                const thContent = document.createElement('th');
                thContent.textContent = 'Content';
                thContent.style.cssText = 'text-align:left;font-size:0.85rem;font-weight:bold;';
                headerRow.appendChild(thField);
                headerRow.appendChild(thContent);
                thead.appendChild(headerRow);
                table.appendChild(thead);

                const tbody = document.createElement('tbody');
                subCat.links.forEach(linkObj => {
                    const linkRow = document.createElement('tr');
                    const fieldLink = document.createElement('td');
                    fieldLink.textContent = 'Link';
                    fieldLink.setAttribute('width', '15%');
                    fieldLink.style.cssText = 'font-weight:bold;font-size:0.82rem;white-space:nowrap;vertical-align:top;';
                    const valueLink = document.createElement('td');
                    valueLink.style.cssText = 'vertical-align:top;';
                    const anchor = document.createElement('a');
                    anchor.href = linkObj.url;
                    anchor.target = '_blank';
                    anchor.rel = 'noopener noreferrer';
                    anchor.textContent = formatDisplayUrl(linkObj.url);
                    anchor.title = linkObj.url;
                    anchor.style.cssText = 'font-size:0.85rem;';
                    valueLink.appendChild(anchor);
                    linkRow.appendChild(fieldLink);
                    linkRow.appendChild(valueLink);

                    const descRow = document.createElement('tr');
                    const fieldDesc = document.createElement('td');
                    fieldDesc.textContent = 'Description';
                    fieldDesc.style.cssText = 'font-weight:bold;font-size:0.82rem;white-space:nowrap;vertical-align:top;';
                    const valueDesc = document.createElement('td');
                    valueDesc.style.cssText = 'vertical-align:top;font-size:0.82rem;line-height:1.45;';
                    valueDesc.textContent = linkObj.desc;
                    descRow.appendChild(fieldDesc);
                    descRow.appendChild(valueDesc);

                    tbody.appendChild(linkRow);
                    tbody.appendChild(descRow);
                });
                table.appendChild(tbody);
                wrapper.appendChild(table);
                container.appendChild(wrapper);
            });
        });
    }

    function main() {
        const data = initializeData();
        buildToC(data);
        renderAll(data);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', main);
    } else {
        main();
    }
})();
