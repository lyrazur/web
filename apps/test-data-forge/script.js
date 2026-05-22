/* ============================================================
   Test Data Forge – Fully Patched script.js
   - All addEventListener calls guarded
   - All DOM access wrapped in DOMContentLoaded
   - Duplicate copy button creation removed
   ============================================================ */

/* ---------- Helpers ---------- */
function $(id) { return document.getElementById(id); }

function safeOn(idOrEl, event, handler) {
  const el = typeof idOrEl === "string" ? $(idOrEl) : idOrEl;
  if (!el) return false;
  el.addEventListener(event, handler);
  return true;
}

function getRadioValue(name) {
  const el = document.querySelector(`input[name="${name}"]:checked`);
  return el ? el.value : null;
}

function padNumber(num, length) {
  let s = String(Math.floor(Math.abs(num)));
  while (s.length < length) s = "0" + s;
  return s;
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function announce(msg) {
  let region = $("tdf-live-region");
  if (!region) {
    region = document.createElement("div");
    region.id = "tdf-live-region";
    region.setAttribute("aria-live", "polite");
    region.style.position = "absolute";
    region.style.left = "-9999px";
    document.body.appendChild(region);
  }
  region.textContent = msg;
}

/* ============================================================
   DOMContentLoaded – ALL DOM ACCESS HAPPENS HERE
   ============================================================ */
document.addEventListener("DOMContentLoaded", () => {

  /* ---------- Global state ---------- */
  let outputFormat = "json";
  let lastGeneratedData = [];
  let currentDataType = $("dataTypeSelect")?.value || "user";

  /* ---------- Safe element references ---------- */
  const outputBox = $("outputBox");
  const outputMetaFormat = $("outputMetaFormat");
  const outputMetaRecords = $("outputMetaRecords");

  const dataTypeSelect = $("dataTypeSelect");
  const generateBtn = $("generateBtn");
  const copyBtn = $("copyBtn");
  const downloadBtn = $("downloadBtn");

  const outputFormatToggle = $("outputFormatToggle");

  /* ---------- Guarded event listeners ---------- */

  /* Output format toggle */
  safeOn(outputFormatToggle, "click", (e) => {
    const option = e.target.closest(".pill-option");
    if (!option) return;

    document.querySelectorAll("#outputFormatToggle .pill-option")
      .forEach(el => el.classList.remove("active"));

    option.classList.add("active");
    outputFormat = option.dataset.format;
    outputMetaFormat.textContent = outputFormat === "json" ? "JSON format" : "Table format";
    renderOutput(lastGeneratedData);
  });

  /* Data type switch */
  safeOn(dataTypeSelect, "change", () => {
    currentDataType = dataTypeSelect.value;
    showConfigFor(currentDataType);
  });

  /* Generate button */
  safeOn(generateBtn, "click", () => {
    const count = parseInt($("recordCountInput").value, 10) || 1;
    const safeCount = Math.max(1, Math.min(count, 200));
    $("recordCountInput").value = safeCount;

    const records = [];
    for (let i = 0; i < safeCount; i++) {
      if (currentDataType === "user") records.push(generateUserRecord());
      else if (currentDataType === "product") records.push(generateProductRecord());
      else if (currentDataType === "order") records.push(generateOrderRecord());
      else if (currentDataType === "randomString") records.push(generateRandomStringRecord());
      else if (currentDataType === "dateSet") records.push(generateDateSetRecord());
      else if (currentDataType === "edgeCases") records.push(generateEdgeCaseRecord(i));
    }

    lastGeneratedData = records;
    renderOutput(records);
    announce(`${records.length} records generated`);
  });

  /* Copy output */
  safeOn(copyBtn, "click", async () => {
    if (!lastGeneratedData.length) return;
    const text = outputFormat === "json"
      ? JSON.stringify(lastGeneratedData, null, 2)
      : outputBox.textContent;

    try {
      await navigator.clipboard.writeText(text);
      announce("Copied to clipboard");
    } catch {
      announce("Copy failed");
    }
  });

  /* Download JSON */
  safeOn(downloadBtn, "click", () => {
    if (!lastGeneratedData.length) return;

    const blob = new Blob(
      [JSON.stringify(lastGeneratedData, null, 2)],
      { type: "application/json" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "test-data.json";
    a.click();
    URL.revokeObjectURL(url);
    announce("Download started");
  });

  /* ============================================================
     Rendering
     ============================================================ */
  function renderOutput(data) {
    if (!data || !data.length) {
      outputBox.textContent = "No data generated yet.";
      outputMetaRecords.textContent = "0 records";
      return;
    }

    outputMetaRecords.textContent = `${data.length} records`;

    if (outputFormat === "table") {
      const headers = Object.keys(data[0]);
      const lines = [];
      lines.push(headers.join(" | "));
      lines.push(headers.map(() => "---").join(" | "));
      data.forEach(row => {
        lines.push(headers.map(h => String(row[h] ?? "")).join(" | "));
      });
      outputBox.textContent = lines.join("\n");
    } else {
      outputBox.textContent = JSON.stringify(data, null, 2);
    }
  }

  /* ============================================================
     Config panel switching
     ============================================================ */
  function showConfigFor(type) {
    const panels = {
      user: $("userConfigCards"),
      product: $("productConfigCards"),
      order: $("orderConfigCards"),
      randomString: $("randomStringConfig"),
      dateSet: $("dateSetConfig"),
      edgeCases: $("edgeCasesConfig")
    };

    Object.values(panels).forEach(p => p && (p.style.display = "none"));
    if (panels[type]) panels[type].style.display = "grid";
  }

  showConfigFor(currentDataType);

  /* ============================================================
     Generators (same logic you already had)
     ============================================================ */

  function generateUserRecord() {
    return {
      id: "USR-" + padNumber(randomInt(0, 99999), 5),
      name: "John Doe",
      email: "john@example.com",
      role: "user",
      active: true,
      createdAt: new Date().toISOString()
    };
  }

  function generateProductRecord() {
    return {
      id: "PRD-" + padNumber(randomInt(0, 99999), 5),
      name: "Sample Product",
      price: randomInt(10, 200),
      currency: "USD",
      inStock: Math.random() < 0.7
    };
  }

  function generateOrderRecord() {
    return {
      id: "ORD-" + padNumber(randomInt(0, 99999), 5),
      userId: "USR-" + padNumber(randomInt(0, 99999), 5),
      productId: "PRD-" + padNumber(randomInt(0, 99999), 5),
      quantity: randomInt(1, 5),
      total: randomInt(20, 500),
      status: "pending",
      createdAt: new Date().toISOString()
    };
  }

  function generateRandomStringRecord() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let s = "";
    for (let i = 0; i < 12; i++) s += chars[randomInt(0, chars.length - 1)];
    return { id: "RS-" + padNumber(randomInt(0, 99999), 5), value: s };
  }

  function generateDateSetRecord() {
    return {
      id: "DS-" + padNumber(randomInt(0, 99999), 5),
      dates: [
        new Date().toISOString(),
        new Date(Date.now() - 86400000).toISOString()
      ]
    };
  }

  function generateEdgeCaseRecord(i) {
    return {
      id: "EC-" + padNumber(i, 5),
      nullValue: null,
      empty: "",
      longString: "A".repeat(2000),
      sql: "'; DROP TABLE users; --",
      unicode: "こんにちは世界🌍"
    };
  }

});
