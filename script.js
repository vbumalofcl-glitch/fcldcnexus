
      

    let currentFileName = "evaluation";

    function prepareSinglePagePrint() {
        window.print();
    }

    function createReferenceRuler() {
        const printable = document.querySelector(".main-content");
        if (!printable) return;

        let ruler = printable.querySelector(".screen-ruler:not(.screen-ruler-vertical)");
        if (!ruler) {
            ruler = document.createElement("div");
            ruler.className = "screen-ruler";
            ruler.setAttribute("aria-hidden", "true");
            printable.prepend(ruler);
        }

        const pxToMm = 25.4 / 96;
        const widthPx = ruler.clientWidth || printable.clientWidth;
        const rootStyles = window.getComputedStyle(document.documentElement);
        const paperWidthRaw = rootStyles.getPropertyValue("--proposal-paper-width").trim();
        let maxMm = 0;

        if (paperWidthRaw.endsWith("mm")) {
            maxMm = parseFloat(paperWidthRaw);
        }

        if (!maxMm || Number.isNaN(maxMm)) {
            maxMm = Math.min(297, Math.max(10, Math.floor((widthPx * pxToMm) / 10) * 10));
        }

        const stepCount = maxMm / 10;
        const stepPx = widthPx / stepCount;

        ruler.style.setProperty("--ruler-step-px", `${stepPx}px`);
        ruler.innerHTML = "";

        for (let mm = 0; mm <= maxMm; mm += 10) {
            const tick = document.createElement("span");
            tick.className = "screen-ruler-label";
            tick.style.left = `${(mm / maxMm) * widthPx}px`;
            tick.textContent = `${mm}`;
            if (mm === 0) tick.classList.add("is-start");
            if (mm === maxMm) tick.classList.add("is-end");
            ruler.appendChild(tick);
        }
    }

    function highlightActiveSidebarLink() {
        const currentPath = window.location.pathname.toLowerCase();
        document.querySelectorAll(".sidebar a").forEach(link => {
            const href = (link.getAttribute("href") || "").toLowerCase();
            const normalizedHref = href.startsWith("./") ? href.replace("./", "/forms/") : href;
            const isActive = Boolean(href) && (currentPath.endsWith(normalizedHref) || currentPath.endsWith(href));
            link.classList.toggle("active-link", isActive);
        });
    }

    function buildProjectDataUrl(relativePath) {
        const cleanRelativePath = String(relativePath || "").replace(/^\.?\//, "");
        const isFormPage = /\/forms\//i.test(window.location.pathname);
        const basePrefix = isFormPage ? "../" : "./";
        return new URL(basePrefix + cleanRelativePath, document.baseURI).href;
    }

    function loadTopNavigation() {

        const path = window.location.pathname.toUpperCase();

        let folder = "";

        if (path.includes("PME")) folder = "PME";
        else if (path.includes("PSE")) folder = "PSE";
        else if (path.includes("QAQC")) folder = "QAQC";
        else if (path.includes("QSE")) folder = "QSE";
        else if (path.includes("PEE")) folder = "PEE";
        else if (path.includes("ARCH")) folder = "ARCH";
        else if (path.includes("ACAD")) folder = "ACAD";
        else if (path.includes("DESIGNBUILDCOSTPROPOSAL")) folder = "CONTRACTS";

        const container = document.getElementById("jsonButtons");

        if (!container || !folder) return;

        container.innerHTML = "";

        fetch(buildProjectDataUrl("data/files.json"))
            .then(res => {
                if (!res.ok) throw new Error("files.json not found");
                return res.json();
            })
            .then(data => {

                const files = data[folder] || [];

                files.forEach(file => {
                    const filePath = buildProjectDataUrl(`data/${folder}/${file}`);

                    const btn = document.createElement("button");
                    const label = document.createElement("span");
                    const progress = document.createElement("span");

                    btn.className = "top-json-btn";
                    label.className = "top-json-btn-label";
                    progress.className = "top-json-btn-progress";

                    label.textContent = file
                        .replace(".json", "")
                        .replace(/_/g, " ");
                    btn.setAttribute("data-file-label", label.textContent);

                    btn.style.marginRight = "8px";
                    btn.style.padding = "6px 10px";

                    btn.appendChild(progress);
                    btn.appendChild(label);

                    btn.onclick = () => {
                        loadJSONData(filePath, btn);
                    };

                    container.appendChild(btn);
                });

            })
            .catch(err => console.error("Error loading files:", err));
    }    
 
    function loadJSONData(path) {
    if (typeof window.showTopJsonLoadProgress === "function") {
        window.showTopJsonLoadProgress();
    }

    fetch(path)
        .then(res => {
            if (!res.ok) throw new Error("File not found");
            return res.json();
        })
        .then(data => {
            loadFormDataFromObject(data);

            // 🔥 FORCE recalculation AFTER DOM updates
            setTimeout(() => {
                recalculateAll();
            }, 50);

        })
        .catch(err => {
            console.error("Error loading JSON:", err);
            alert("Failed to load file.");
        })
        .finally(() => {
            if (typeof window.hideTopJsonLoadProgress === "function") {
                window.hideTopJsonLoadProgress();
            }
        });
}

    function clearTopJsonButtonStates(container) {
    if (!(container instanceof HTMLElement)) return;
    container.querySelectorAll(".top-json-btn").forEach(btn => {
        btn.classList.remove("is-loading", "is-loaded");
        const label = btn.querySelector(".top-json-btn-label");
        const originalLabel = btn.getAttribute("data-file-label") || "";
        if (label instanceof HTMLElement && originalLabel) {
            label.textContent = originalLabel;
        }
        btn.style.color = "";
        btn.style.borderColor = "rgba(14, 47, 87, 0.18)";
        btn.style.boxShadow = "0 4px 10px rgba(14, 47, 87, 0.08)";
    });
}

    function setTopJsonButtonLoading(button) {
    if (!(button instanceof HTMLElement)) return;
    clearTopJsonButtonStates(button.parentElement);
    button.classList.add("is-loading");
    const label = button.querySelector(".top-json-btn-label");
    if (label instanceof HTMLElement) {
        label.textContent = "LOADING...";
    }
    button.style.color = "#ffffff";
    button.style.borderColor = "#15803d";
    button.style.boxShadow = "0 6px 14px rgba(22, 163, 74, 0.22)";
}

    function setTopJsonButtonLoaded(button) {
    if (!(button instanceof HTMLElement)) return;
    button.classList.remove("is-loading");
    button.classList.add("is-loaded");
    const label = button.querySelector(".top-json-btn-label");
    const originalLabel = button.getAttribute("data-file-label") || "";
    if (label instanceof HTMLElement) {
        label.textContent = originalLabel ? `SELECTED: ${originalLabel}` : "SELECTED";
    }
    button.style.color = "#ffffff";
    button.style.borderColor = "#15803d";
    button.style.boxShadow = "0 6px 14px rgba(22, 163, 74, 0.28)";
}

    async function loadJSONData(path, sourceButton) {
    if (sourceButton instanceof HTMLElement) {
        setTopJsonButtonLoading(sourceButton);
    }

    try {
        const response = await fetch(path);

        if (!response.ok) throw new Error("File not found");

        const data = await response.json();
        loadFormDataFromObject(data);

        if (sourceButton instanceof HTMLElement) {
            setTopJsonButtonLoaded(sourceButton);
        }

        setTimeout(() => {
            recalculateAll();
        }, 50);
    } catch (err) {
        console.error("Error loading JSON:", err);
        alert("Failed to load file.");
        if (sourceButton instanceof HTMLElement) {
            sourceButton.classList.remove("is-loading");
            const label = sourceButton.querySelector(".top-json-btn-label");
            const originalLabel = sourceButton.getAttribute("data-file-label") || "";
            if (label instanceof HTMLElement && originalLabel) {
                label.textContent = originalLabel;
            }
            sourceButton.style.background = "rgba(255, 255, 255, 0.92)";
            sourceButton.style.color = "";
            sourceButton.style.borderColor = "rgba(14, 47, 87, 0.18)";
            sourceButton.style.boxShadow = "0 4px 10px rgba(14, 47, 87, 0.08)";
        }
    }
}

 recalculateAll();    

    function computeRowAverage(rowClass, outputId) {
        const inputs = document.querySelectorAll('.' + rowClass);
        let values = [];

        inputs.forEach(i => {
            const v = parseFloat(i.value);
            if (!isNaN(v)) values.push(v);
        });

        const avg = values.length 
            ? (values.reduce((a, b) => a + b, 0) / values.length) 
            : 0;

        // Convert to percent (5 = 100%)
        const percent = avg ? (avg / 5) * 100 : 0;

        const el = document.getElementById(outputId);
        if (el) {
            if (avg) {
                el.innerHTML =
                    avg.toFixed(2) + "<br>" +
                    "or<br>" +
                    "<span style='color:#00008B; font-weight:bold;'>" +
                    percent.toFixed(2) + "%</span>";
            } else {
                el.innerHTML = "";
            }
        }
    }

    // Compute monthly averages per section
    function computeMonthlyAverages(sectionClass, outputPrefix) {
        for (let m = 1; m <= 12; m++) {
            const inputs = document.querySelectorAll('.' + sectionClass + '-m' + m);
            let values = [];

            inputs.forEach(i => {
                const v = parseFloat(i.value);
                if (!isNaN(v)) values.push(v);
            });

            const el = document.getElementById(outputPrefix + m);

            // If no inputs were filled → clear output and continue
            if (values.length === 0) {
                if (el) el.innerHTML = "";
                continue;
            }

            // Compute average
            const avg = values.reduce((a, b) => a + b, 0) / values.length;

            // Convert to percent (5 = 100%)
            const percent = (avg / 5) * 100;

            if (el) {
                el.innerHTML =
                    //"<div style='text-align:center;'>" + avg.toFixed(2) + "</div>" +
                    //"<div style='text-align:center;'>or</div>" +
                    "<div style='text-align:center; color:#00008B; font-weight:bold;'>" +
                    percent.toFixed(0) + "%</div>";
            }
        }
    }

    document.addEventListener("DOMContentLoaded", () => {
        loadTopNavigation();
        createReferenceRuler();
        highlightActiveSidebarLink();
    });

    window.addEventListener("resize", createReferenceRuler);

    // Compute section overall averages (based on row averages)
    function computeSectionOverall(sectionClass, outputId, barId) {
        let rowAverages = [];
        const rows = document.querySelectorAll('[id^="avg-r"]');

        rows.forEach(r => {
            const id = r.id.replace("avg-r", "");
            const rowInputs = document.querySelectorAll('.r' + id);
            if (rowInputs.length > 0 && rowInputs[0].classList.contains(sectionClass)) {
                const val = parseFloat(r.textContent);
                if (!isNaN(val)) rowAverages.push(val);
            }
        });

        const avg = rowAverages.length ? (rowAverages.reduce((a,b)=>a+b,0) / rowAverages.length) : 0;
        const percent = avg * 20;

        const el = document.getElementById(outputId);
        if (el) el.textContent = percent ? percent.toFixed(2) + "%" : "";

        updateBar(barId, percent);

        return avg;
    }

    // Compute final overall score
    function computeFinalOverall() {
        const qaqc = computeSectionOverall("qaqc", "overall-qaqc", "qaqc-bar");
        const qs   = computeSectionOverall("qs", "overall-qs", "qs-bar");
        const tm   = computeSectionOverall("tm", "overall-tm", "tm-bar");

        const valid = [qaqc, qs, tm].filter(v => v > 0);
        const final = valid.length ? (valid.reduce((a,b)=>a+b,0) / valid.length) : 0;

        const percent = final * 20;

        const el = document.getElementById("overall-final");
        if (el) el.textContent = percent ? percent.toFixed(2) + "%" : "";

        updateBar("final-bar", percent);
    }
   
    function updateBar(barId, percent) {
    percent = Number(percent);
    console.log(
        "BAR:", barId,
        "| RAW:", percent,
        "| FIXED(2):", percent.toFixed(2),
        "| ROUNDED:", Math.round(percent)
    );
    
    // Use a rounded value consistently for logic + display
    const rounded = Number(percent.toFixed(2));

    const bar = document.getElementById(barId);
    if (!bar) return;

    bar.style.width = rounded + "%";

    let color = "#ccc";

    if (rounded >= 0 && rounded <= 8) color = "rgb(182, 232, 176)";
    else if (rounded >= 8.1 && rounded <= 17) color = "rgb(127, 220, 110)";
    else if (rounded >= 17.1 && rounded <= 25) color = "rgb(63, 174, 58)";

    else if (rounded >= 25.1 && rounded <= 33) color = "#fff7a8";
    else if (rounded >= 33.1 && rounded <= 42) color = "#ffe766";
    else if (rounded >= 42.1 && rounded <= 50) color = "#ffcf33";

    else if (rounded >= 50.1 && rounded <= 58) color = "#b3d9ff";
    else if (rounded >= 58.1 && rounded <= 67) color = "#66b3ff";
    else if (rounded >= 67.1 && rounded <= 75) color = "#1a75ff";

    else if (rounded >= 75.1 && rounded <= 83) color = "#d2b48c";
    else if (rounded >= 83.1 && rounded <= 92) color = "#a67c52";
    else if (rounded >= 92.1 && rounded <= 100) color = "#7b4f2c";

    bar.style.background = color;

    if (barId === "final-bar") {
        let categoryText = "";

        if (rounded >= 0 && rounded <= 25) categoryText = " CATEGORY PE";
        else if (rounded >= 25.1 && rounded <= 50) categoryText = " CATEGORY PS";
        else if (rounded >= 50.1 && rounded <= 75) categoryText = " CATEGORY PM";
        else if (rounded >= 75.1 && rounded <= 100) categoryText = " CATEGORY OM";

        bar.textContent = rounded.toFixed(2) + "% — " + categoryText;
    } else {
        bar.textContent = rounded.toFixed(2) + "%";
    }
    }

    function recalculateAll() {

        // 1. Recompute all row averages (avg-r1, avg-r2, ...)
        for (let i = 1; i <= 200; i++) {
            const rowId = 'avg-r' + i;
            if (document.getElementById(rowId)) {
                computeRowAverage('r' + i, rowId);
            }
        }

        // 2. Recompute monthly averages
        computeMonthlyAverages('qaqc', 'avg-qaqc-m');
        computeMonthlyAverages('qs',   'avg-qs-m');
        computeMonthlyAverages('tm',   'avg-tm-m');

        // 3. Recompute section overall scores
        computeSectionOverall("qaqc", "overall-qaqc");
        computeSectionOverall("qs",   "overall-qs");
        computeSectionOverall("tm",   "overall-tm");

        // 4. Recompute final overall score
        computeFinalOverall();
    }

   
        function autoExpand(el) {
        el.style.height = "auto";
        el.style.height = el.scrollHeight + "px";
        }

        document.addEventListener("paste", function(e) {
        if (e.target.classList.contains("summary-input")) {
            // Allow browser to keep formatting (bold, color, etc.)
            setTimeout(() => autoExpand(e.target), 10);
        }
        });

        document.addEventListener("input", function(e) {
        if (e.target.classList.contains("summary-input")) {
            autoExpand(e.target);
        }
        });

        
        function applyColor() {
        const color = document.getElementById("colorPicker").value;
        document.execCommand("foreColor", false, color);
        }

        function applyFontSize() {
        const size = document.getElementById("fontSizePicker").value;
        if (!size) return;
        document.execCommand("fontSize", false, "7"); // temporary size
        // Replace <font size="7"> with real CSS size
        document.querySelectorAll('font[size="7"]').forEach(el => {
            el.removeAttribute("size");
            el.style.fontSize = size;
        });
        }

        function toggleBold() {
            document.execCommand("bold", false, null);
        } 
        function alignLeft() {
        document.execCommand("justifyLeft", false, null);
        }

        function alignCenter() {
        document.execCommand("justifyCenter", false, null);
        }

        function alignRight() {
        document.execCommand("justifyRight", false, null);
        } 
   

    function addDemeritRow() {
            const table = document.getElementById("demeritsTable");

            // Count existing data rows (exclude header)
            const rowCount = table.rows.length - 1;
            const newIndex = rowCount + 1;

            const newRow = table.insertRow(-1);

            const cells = [
                `<textarea name="demerit_id_${newIndex}" class="no-box"></textarea>`,
                `<textarea name="demerit_desc_${newIndex}" class="no-box"></textarea>`,
                `<input type="date" name="demerit_date_${newIndex}">`,
                `<textarea name="demerit_impact_${newIndex}" class="no-box"></textarea>`,
                `<textarea name="demerit_action_${newIndex}" class="no-box"></textarea>`,
                `<button class="delete-btn" onclick="deleteRow(this)">Delete</button>`
            ];

            cells.forEach((html, index) => {
                const cell = newRow.insertCell();
                cell.innerHTML = html;
                if (index === 5) cell.classList.add("action-col");
            });
        }


        function deleteRow(button) {
            const row = button.parentNode.parentNode;
            const table = document.getElementById("demeritsTable");

            if (row.rowIndex === 0) return;
            row.remove();
        }

    document.addEventListener("input", function(e) {
        if (e.target.classList.contains("no-box")) {
            e.target.style.height = "auto";
            e.target.style.height = e.target.scrollHeight + "px";
        }
    });
    
    
    async function saveFormData() {
        const data = {};

        // Save all normal inputs
        document.querySelectorAll("input, textarea, select").forEach(el => {
            if (!el.name) return;

            if (el.type === "checkbox" || el.type === "radio") {
                data[el.name] = el.checked;
            } else {
                data[el.name] = el.value;
            }
        });

        // Save contenteditable fields (with formatting)
        document.querySelectorAll("[contenteditable][name]").forEach(el => {
            data[el.getAttribute("name")] = el.innerHTML;
        });

        // Save signatures
        document.querySelectorAll("canvas.sig-pad").forEach(canvas => {
            const name = canvas.getAttribute("name");
            data[name] = canvas.toDataURL("image/png");
        });

        // Filename
        const empName = data.emp_name || "NoName";
        const today = new Date().toISOString().slice(0,10);
        const filename = `PM_Eval_${empName}_${today}.json`;

        try {
            const handle = await window.showSaveFilePicker({
                suggestedName: filename,
                types: [{
                    description: "JSON Files",
                    accept: { "application/json": [".json"] }
                }]
            });

            const writable = await handle.createWritable();
            await writable.write(JSON.stringify(data, null, 2));
            await writable.close();

            alert("File saved successfully.");
        } catch (err) {
            console.log("Save cancelled or failed:", err);
        }
    }


    function loadFormData(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();

        reader.onload = function(e) {
            const data = JSON.parse(e.target.result);

            // Restore demerits structure first
            restoreDemerits(data);

            // Restore normal inputs
            document.querySelectorAll("input, textarea, select").forEach(el => {
                if (!el.name) return;

                if (el.type === "checkbox" || el.type === "radio") {
                    el.checked = data[el.name] || false;
                } else {
                    el.value = data[el.name] || "";
                }
            });

            // Restore contenteditable fields
            document.querySelectorAll("[contenteditable][name]").forEach(el => {
                const key = el.getAttribute("name");
                if (data[key] !== undefined) {
                    el.innerHTML = data[key];
                }
            });

            // Restore signatures
            document.querySelectorAll("canvas.sig-pad").forEach(canvas => {
                const name = canvas.getAttribute("name");
                if (!data[name]) return;

                const ctx = canvas.getContext("2d");
                const img = new Image();
                img.onload = () => ctx.drawImage(img, 0, 0);
                img.src = data[name];
            });

            autoExpandAllTextareas();

            alert("Form data loaded successfully.");
        };

        reader.readAsText(file);
    }




    function restoreDemerits(data) {
        const table = document.getElementById("demeritsTable");

        // Remove all existing rows except header
        while (table.rows.length > 1) {
            table.deleteRow(1);
        }

        // Count how many demerit rows exist in the saved file
        let maxIndex = 0;
        for (const key in data) {
            const match = key.match(/^demerit_id_(\d+)$/);
            if (match) {
                const index = parseInt(match[1]);
                if (index > maxIndex) maxIndex = index;
            }
        }

        // Recreate rows using NO-BOX formatting
        for (let i = 1; i <= maxIndex; i++) {
            const newRow = table.insertRow(-1);

            newRow.innerHTML = `
                <td><textarea name="demerit_id_${i}" class="no-box"></textarea></td>
                <td><textarea name="demerit_desc_${i}" class="no-box"></textarea></td>
                <td><input type="date" name="demerit_date_${i}" class="input-nobox"></td>
                <td><textarea name="demerit_impact_${i}" class="no-box"></textarea></td>
                <td><textarea name="demerit_action_${i}" class="no-box"></textarea></td>
                <td class="action-col">
                    <button class="delete-btn" onclick="deleteRow(this)">Delete</button>
                </td>
            `;
        }
    }

        
    
    function resizeSignaturePad(canvas) {
        const rect = canvas.getBoundingClientRect();
        const ratio = window.devicePixelRatio || 1;
        const width = Math.max(1, Math.round(rect.width * ratio));
        const height = Math.max(1, Math.round(rect.height * ratio));

        if (canvas.width === width && canvas.height === height) return;

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
        ctx.lineWidth = 1.5;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
    }

    document.querySelectorAll(".sig-pad").forEach(canvas => {
        resizeSignaturePad(canvas);
        const ctx = canvas.getContext("2d");
        let drawing = false;

        function pos(e) {
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width / (window.devicePixelRatio || 1);
            const scaleY = canvas.height / rect.height / (window.devicePixelRatio || 1);
            if (e.touches) {
                return {
                    x: (e.touches[0].clientX - rect.left) * scaleX,
                    y: (e.touches[0].clientY - rect.top) * scaleY
                };
            }
            return {
                x: (e.clientX - rect.left) * scaleX,
                y: (e.clientY - rect.top) * scaleY
            };
        }

        canvas.addEventListener("mousedown", e => {
            drawing = true;
            ctx.beginPath();
            const p = pos(e);
            ctx.moveTo(p.x, p.y);
        });

        canvas.addEventListener("mousemove", e => {
            if (!drawing) return;
            const p = pos(e);
            ctx.lineTo(p.x, p.y);
            ctx.stroke();
        });

        canvas.addEventListener("mouseup", () => drawing = false);
        canvas.addEventListener("mouseleave", () => drawing = false);

        canvas.addEventListener("touchstart", e => {
            e.preventDefault();
            drawing = true;
            ctx.beginPath();
            const p = pos(e);
            ctx.moveTo(p.x, p.y);
        });

        canvas.addEventListener("touchmove", e => {
            e.preventDefault();
            if (!drawing) return;
            const p = pos(e);
            ctx.lineTo(p.x, p.y);
            ctx.stroke();
        });

        canvas.addEventListener("touchend", () => drawing = false);
    });

    window.addEventListener("resize", () => {
        document.querySelectorAll(".sig-pad").forEach(resizeSignaturePad);
    });

    function clearPad(btn) {
        const canvas = btn.previousElementSibling;
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
     
    document.getElementById("toggleSidebar").addEventListener("click", function () {
    const sidebar = document.querySelector(".sidebar");
    const content = document.querySelector(".main-content");

    sidebar.classList.toggle("hidden");
    content.classList.toggle("full");
    });


    document.addEventListener('input', recalculateAll);

    window.addEventListener('DOMContentLoaded', recalculateAll);
        
    function loadFormDataFromObject(data) {

        // Restore demerits structure first
        restoreDemerits(data);

        // Restore normal inputs
        document.querySelectorAll("input, textarea, select").forEach(el => {
            if (!el.name) return;

            if (el.type === "checkbox" || el.type === "radio") {
                el.checked = data[el.name] || false;
            } else {
                el.value = data[el.name] || "";
            }
        });

        // Restore contenteditable fields
        document.querySelectorAll("[contenteditable][name]").forEach(el => {
            const key = el.getAttribute("name");
            if (data[key] !== undefined) {
                el.innerHTML = data[key];
            }
        });

        // Restore signatures
        document.querySelectorAll("canvas.sig-pad").forEach(canvas => {
            const name = canvas.getAttribute("name");
            if (!data[name]) return;

            const ctx = canvas.getContext("2d");
            const img = new Image();
            img.onload = () => ctx.drawImage(img, 0, 0);
            img.src = data[name];
        });

        // Expand textareas
        if (typeof autoExpandAllTextareas === "function") {
            autoExpandAllTextareas();
        }

        alert("Form data loaded successfully.");
    }

recalculateAll();

function getDesktopHost() {
    try {
        return window.chrome?.webview?.hostObjects?.sync?.hostBridge || null;
    } catch (err) {
        console.warn("Desktop host bridge unavailable.", err);
        return null;
    }
}

function getAndroidHost() {
    try {
        if (window.AndroidHost) {
            return window.AndroidHost;
        }
    } catch (err) {
        console.warn("Android host bridge unavailable.", err);
    }

    return null;
}

function getCurrentFolderKey() {
    const path = window.location.pathname.toUpperCase();

    if (path.includes("PME")) return "PME";
    if (path.includes("PSE")) return "PSE";
    if (path.includes("QAQC")) return "QAQC";
    if (path.includes("QSE")) return "QSE";
    if (path.includes("PEE")) return "PEE";
    if (path.includes("ARCH")) return "ARCH";
    if (path.includes("ACAD")) return "ACAD";

    return "";
}

function getSuggestedEvaluationFileName(data) {
    const familyName = String(data.emp_family_name || data.emp_name || "NoName")
        .trim()
        .replace(/[<>:"/\\|?*\x00-\x1F]/g, "")
        .replace(/\s+/g, " ");
    const evaluationDate = String(data.emp_date || "")
        .trim()
        .replace(/[<>:"/\\|?*\x00-\x1F]/g, "");
    const safeDate = evaluationDate || new Date().toISOString().slice(0, 10);

    return `${familyName || "NoName"}_${safeDate}.json`;
}

function collectEvaluationData() {
    const data = {};

    document.querySelectorAll("input, textarea, select").forEach(el => {
        if (!el.name) return;

        if (el.type === "checkbox" || el.type === "radio") {
            data[el.name] = el.checked;
        } else {
            data[el.name] = el.value;
        }
    });

    document.querySelectorAll("[contenteditable][name]").forEach(el => {
        data[el.getAttribute("name")] = el.innerHTML;
    });

    document.querySelectorAll("canvas.sig-pad").forEach(canvas => {
        const name = canvas.getAttribute("name");
        if (name) {
            data[name] = canvas.toDataURL("image/png");
        }
    });

    return data;
}

function autoExpandAllTextareas() {
    document.querySelectorAll(".summary-input, .no-box").forEach(el => {
        if (!el.style) return;
        el.style.height = "auto";
        el.style.height = el.scrollHeight + "px";
    });
}

function applyLoadedFormData(data, showMessage = true) {
    restoreDemerits(data);

    document.querySelectorAll("input, textarea, select").forEach(el => {
        if (!el.name) return;

        if (el.type === "checkbox" || el.type === "radio") {
            el.checked = Boolean(data[el.name]);
        } else {
            el.value = data[el.name] || "";
        }
    });

    document.querySelectorAll("[contenteditable][name]").forEach(el => {
        const key = el.getAttribute("name");
        if (data[key] !== undefined) {
            el.innerHTML = data[key];
        }
    });

    document.querySelectorAll("canvas.sig-pad").forEach(canvas => {
        const name = canvas.getAttribute("name");
        const ctx = canvas.getContext("2d");

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (!name || !data[name]) return;

        const img = new Image();
        img.onload = () => ctx.drawImage(img, 0, 0);
        img.src = data[name];
    });

    autoExpandAllTextareas();
    setTimeout(() => recalculateAll(), 50);

    if (showMessage) {
        alert("Form data loaded successfully.");
    }
}

async function saveFormData() {
    const data = collectEvaluationData();
    const suggestedName = getSuggestedEvaluationFileName(data);
    const hostBridge = getDesktopHost();
    const androidHost = getAndroidHost();

    if (hostBridge) {
        try {
            const savedPath = hostBridge.SaveJson(
                getCurrentFolderKey(),
                suggestedName,
                JSON.stringify(data, null, 2)
            );

            if (savedPath) {
                loadTopNavigation();
                alert("File saved successfully.\n" + savedPath);
            }
        } catch (err) {
            console.error("Desktop save failed:", err);
            alert("Failed to save file.");
        }

        return;
    }

    if (androidHost && androidHost.saveJson) {
        try {
            androidHost.saveJson(
                getCurrentFolderKey(),
                suggestedName,
                JSON.stringify(data, null, 2)
            );
            alert("File saved successfully.");
        } catch (err) {
            console.error("Android save failed:", err);
            alert("Failed to save file.");
        }

        return;
    }

    if (!window.showSaveFilePicker) {
        alert("Save is available in the desktop app or a supported browser.");
        return;
    }

    try {
        const handle = await window.showSaveFilePicker({
            suggestedName,
            types: [{
                description: "JSON Files",
                accept: { "application/json": [".json"] }
            }]
        });

        const writable = await handle.createWritable();
        await writable.write(JSON.stringify(data, null, 2));
        await writable.close();

        alert("File saved successfully.");
    } catch (err) {
        console.log("Save cancelled or failed:", err);
    }
}

function loadFormData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = function(e) {
        try {
            applyLoadedFormData(JSON.parse(e.target.result), true);
        } catch (err) {
            console.error("Invalid JSON:", err);
            alert("Failed to load file.");
        } finally {
            event.target.value = "";
        }
    };

    reader.readAsText(file);
}

function loadFormDataFromObject(data) {
    applyLoadedFormData(data, true);
}

document.addEventListener("DOMContentLoaded", function () {
    autoExpandAllTextareas();

    const loadButton = document.querySelector(".load-btn");
    const fileInput = document.getElementById("loadFile");
    const hostBridge = getDesktopHost();
    const androidHost = getAndroidHost();

    if (loadButton && fileInput) {
        loadButton.onclick = function () {
            if (!hostBridge) {
                if (androidHost && androidHost.openJson) {
                    try {
                        androidHost.openJson();
                    } catch (err) {
                        console.error("Android load failed:", err);
                        alert("Failed to load file.");
                    }
                    return;
                }

                fileInput.click();
                return;
            }

            try {
                const jsonPayload = hostBridge.OpenJson(getCurrentFolderKey());
                if (!jsonPayload) return;

                applyLoadedFormData(JSON.parse(jsonPayload), true);
            } catch (err) {
                console.error("Desktop load failed:", err);
                alert("Failed to load file.");
            }
        };
    }

    if (hostBridge) {
        addDesktopSettingsPanel(hostBridge);
    }
});

function handleAndroidLoadedJson(jsonPayload) {
    try {
        applyLoadedFormData(JSON.parse(jsonPayload), true);
    } catch (err) {
        console.error("Invalid Android JSON payload:", err);
        alert("Failed to load file.");
    }
}

function addDesktopSettingsPanel(hostBridge) {
    const sidebar = document.querySelector(".sidebar");
    if (!sidebar) return;

    const settingsButton = sidebar.querySelector(".sidebar-settings-toggle");
    const panel = sidebar.querySelector(".sidebar-submenu");
    if (!settingsButton || !panel) return;

    settingsButton.onclick = function () {
        panel.classList.toggle("open");
    };

    panel.querySelectorAll("[data-edit-target]").forEach(function (button) {
        button.onclick = function () {
            let path = "script.js";
            const target = button.getAttribute("data-edit-target");

            if (target === "current-form") {
                path = window.location.pathname.replace(/^\/+/, "") || "index.html";
            } else if (target === "styles") {
                path = "template.css";
            }

            try {
                hostBridge.EditCurrentForm(path);
            } catch (err) {
                console.error("Failed to open editor:", err);
                alert("Failed to open file in editor.");
            }
        };
    });
}

