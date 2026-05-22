function $(id) {
  return document.getElementById(id);
}

function getRadioValue(name) {
  const el = document.querySelector('input[name="' + name + '"]:checked');
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

/* STATE */
let outputFormat = "json";
let lastGeneratedData = [];
let currentDataType = "user";

/* SAFE EVENT BINDING */
function safeOn(idOrEl, event, handler) {
  const el = typeof idOrEl === "string" ? $(idOrEl) : idOrEl;
  if (!el) return false;
  el.addEventListener(event, handler);
  return true;
}

/* LIVE REGION */
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

/* MAIN INIT */
document.addEventListener("DOMContentLoaded", () => {
  const userConfigCards = $("userConfigCards");
  const productConfigCards = $("productConfigCards");
  const orderConfigCards = $("orderConfigCards");
  const randomStringConfig = $("randomStringConfig");
  const dateSetConfig = $("dateSetConfig");
  const edgeCasesConfig = $("edgeCasesConfig");

  function showConfigFor(type) {
    const map = {
      user: userConfigCards,
      product: productConfigCards,
      order: orderConfigCards,
      randomString: randomStringConfig,
      dateSet: dateSetConfig,
      edgeCases: edgeCasesConfig
    };
    Object.values(map).forEach(el => {
      if (el) el.classList.add("hidden");
    });
    if (map[type]) map[type].classList.remove("hidden");
  }

  /* OUTPUT FORMAT TOGGLE */
  safeOn("outputFormatToggle", "click", (e) => {
    const option = e.target.closest(".pill-option");
    if (!option) return;
    document
      .querySelectorAll("#outputFormatToggle .pill-option")
      .forEach((el) => el.classList.remove("active"));
    option.classList.add("active");
    outputFormat = option.dataset.format;
    const meta = $("outputMetaFormat");
    if (meta) {
      meta.textContent =
        outputFormat === "json" ? "JSON format" : "Table format";
    }
    renderOutput(lastGeneratedData);
  });

  /* DATA TYPE SWITCH */
  safeOn("dataTypeSelect", "change", () => {
    const sel = $("dataTypeSelect");
    currentDataType = sel ? sel.value : "user";
    showConfigFor(currentDataType);
  });

  showConfigFor(currentDataType);

  /* NAME SETTINGS (USER) */
  const nameLanguageGroup = $("nameLanguageGroup");
  const czechNameRulesBlock = $("czechNameRulesBlock");
  const customNameListBlock = $("customNameListBlock");

  if (nameLanguageGroup) {
    nameLanguageGroup.addEventListener("change", () => {
      const value = getRadioValue("nameLanguage");
      if (czechNameRulesBlock) {
        czechNameRulesBlock.style.display =
          value === "czech" || value === "mixed" ? "block" : "none";
      }
      if (customNameListBlock) {
        customNameListBlock.style.display =
          value === "custom" ? "block" : "none";
      }
    });
  }

  /* ID SETTINGS (USER) */
  const idLengthSelect = $("idLengthSelect");
  const idCustomLengthField = $("idCustomLengthField");
  const idCustomLengthInput = $("idCustomLengthInput");
  const idRangeFromInput = $("idRangeFromInput");
  const idRangeToInput = $("idRangeToInput");
  const idFormatSelect = $("idFormatSelect");
  const idPrefixField = $("idPrefixField");
  const idSuffixField = $("idSuffixField");
  const idPatternField = $("idPatternField");
  const idPrefixInput = $("idPrefixInput");
  const idSuffixInput = $("idSuffixInput");
  const idPatternInput = $("idPatternInput");
  const idPreviewBox = $("idPreviewBox");

  function getIdLength() {
    if (!idLengthSelect) return 5;
    const val = idLengthSelect.value;
    if (val === "custom") {
      const n = parseInt(idCustomLengthInput?.value || "5", 10);
      return isNaN(n) || n < 1 ? 1 : Math.min(n, 12);
    }
    return parseInt(val, 10);
  }

  function syncIdRangePlaceholders() {
    if (!idRangeFromInput || !idRangeToInput) return;
    const len = getIdLength();
    const max = Math.pow(10, len) - 1;
    const minStr = padNumber(0, len);
    const maxStr = padNumber(max, len);
    if (!idRangeFromInput.value || idRangeFromInput.value.length !== len) {
      idRangeFromInput.value = minStr;
    }
    if (!idRangeToInput.value || idRangeToInput.value.length !== len) {
      idRangeToInput.value = maxStr;
    }
  }

  function buildIdFromNumber(num) {
    const len = getIdLength();
    const format = idFormatSelect ? idFormatSelect.value : "numericPadded";
    const padded = padNumber(num, len);
    if (format === "numeric") return String(num);
    if (format === "numericPadded") return padded;
    if (format === "prefix") return (idPrefixInput?.value || "") + padded;
    if (format === "suffix") return padded + (idSuffixInput?.value || "");
    if (format === "pattern") {
      const pattern = idPatternInput?.value || "{#####}";
      const digits = padded;
      const match = pattern.match(/\{(#+)\}/);
      if (match) {
        const count = match[1].length;
        const slice = digits.slice(-count);
        return pattern.replace(match[0], slice);
      }
      const hashMatch = pattern.match(/#+/);
      if (hashMatch) {
        const count = hashMatch[0].length;
        const slice = digits.slice(-count);
        return pattern.replace(hashMatch[0], slice);
      }
      return pattern + digits;
    }
    return padded;
  }

  function updateIdPreview() {
    if (!idPreviewBox || !idRangeFromInput || !idRangeToInput) return;
    const len = getIdLength();
    const fromStr = idRangeFromInput.value || padNumber(0, len);
    const toStr =
      idRangeToInput.value || padNumber(Math.pow(10, len) - 1, len);
    const fromNum = parseInt(fromStr, 10);
    const toNum = parseInt(toStr, 10);
    if (isNaN(fromNum) || isNaN(toNum) || fromNum > toNum) {
      idPreviewBox.textContent = "Invalid range.";
      return;
    }
    const base = fromNum;
    const lines = [];
    for (let i = 0; i < 3; i++) {
      const n = base + i;
      if (n > toNum) break;
      lines.push(buildIdFromNumber(n));
    }
    idPreviewBox.textContent = lines.join("\n");
  }

  if (idLengthSelect) {
    idLengthSelect.addEventListener("change", () => {
      const val = idLengthSelect.value;
      if (idCustomLengthField) {
        idCustomLengthField.style.display =
          val === "custom" ? "block" : "none";
      }
      syncIdRangePlaceholders();
      updateIdPreview();
    });
  }

  if (idCustomLengthInput) {
    idCustomLengthInput.addEventListener("input", () => {
      syncIdRangePlaceholders();
      updateIdPreview();
    });
  }

  if (idRangeFromInput) {
    idRangeFromInput.addEventListener("input", updateIdPreview);
  }
  if (idRangeToInput) {
    idRangeToInput.addEventListener("input", updateIdPreview);
  }

  if (idFormatSelect) {
    idFormatSelect.addEventListener("change", () => {
      const val = idFormatSelect.value;
      if (idPrefixField) {
        idPrefixField.style.display = val === "prefix" ? "block" : "none";
      }
      if (idSuffixField) {
        idSuffixField.style.display = val === "suffix" ? "block" : "none";
      }
      if (idPatternField) {
        idPatternField.style.display = val === "pattern" ? "block" : "none";
      }
      updateIdPreview();
    });
  }

  if (idPrefixInput) idPrefixInput.addEventListener("input", updateIdPreview);
  if (idSuffixInput) idSuffixInput.addEventListener("input", updateIdPreview);
  if (idPatternInput) idPatternInput.addEventListener("input", updateIdPreview);

  syncIdRangePlaceholders();
  updateIdPreview();

  /* ROLE ADDING (USER) */
  const addRoleBtn = $("addRoleBtn");
  const customRoleField = $("customRoleField");
  const customRoleInput = $("customRoleInput");
  const confirmAddRoleBtn = $("confirmAddRoleBtn");
  const roleCheckboxGroup = $("roleCheckboxGroup");

  if (addRoleBtn && customRoleField && customRoleInput && confirmAddRoleBtn && roleCheckboxGroup) {
    addRoleBtn.addEventListener("click", () => {
      customRoleField.classList.remove("hidden");
      customRoleInput.focus();
    });

    confirmAddRoleBtn.addEventListener("click", () => {
      const value = (customRoleInput.value || "").trim();
      if (!value) return;
      const label = document.createElement("label");
      label.className = "checkbox-option";
      const input = document.createElement("input");
      input.type = "checkbox";
      input.value = value;
      input.checked = true;
      const span = document.createElement("span");
      span.textContent = value;
      label.appendChild(input);
      label.appendChild(span);
      roleCheckboxGroup.appendChild(label);
      customRoleInput.value = "";
      customRoleField.classList.add("hidden");
    });
  }

  /* USER NAME GENERATION */
  const englishFirstNamesMale = ["John", "Michael", "David", "James", "Robert"];
  const englishFirstNamesFemale = ["Emma", "Olivia", "Sophia", "Ava", "Emily"];
  const englishLastNames = ["Smith", "Johnson", "Brown", "Taylor", "Wilson"];

  const czechFirstNamesMale = ["Miroslav", "Jan", "Petr", "Tomáš", "Martin"];
  const czechFirstNamesFemale = ["Eva", "Lucie", "Jana", "Petra", "Alena"];
  const czechLastNamesBase = ["Novák", "Dvořák", "Svoboda", "Procházka", "Černý"];

  function buildCzechSurname(base, isFemale, allowNonDeclined) {
    if (!isFemale) return base;
    if (!allowNonDeclined) {
      if (base.endsWith("ý")) return base.slice(0, -1) + "á";
      if (base.endsWith("ek")) return base.slice(0, -2) + "ková";
      if (base.endsWith("ák")) return base.slice(0, -2) + "áková";
      return base + "ová";
    }
    const declined =
      base.endsWith("ý") ? base.slice(0, -1) + "á" : base + "ová";
    return Math.random() < 0.5 ? declined : base;
  }

  function generateEnglishName() {
    const isFemale = Math.random() < 0.5;
    const first = isFemale
      ? englishFirstNamesFemale[randomInt(0, englishFirstNamesFemale.length - 1)]
      : englishFirstNamesMale[randomInt(0, englishFirstNamesMale.length - 1)];
    const last =
      englishLastNames[randomInt(0, englishLastNames.length - 1)];
    return { fullName: first + " " + last, firstName: first, lastName: last };
  }

  function generateCzechName(rules) {
    const isFemale = Math.random() < 0.5;
    const first = isFemale
      ? czechFirstNamesFemale[randomInt(0, czechFirstNamesFemale.length - 1)]
      : czechFirstNamesMale[randomInt(0, czechFirstNamesMale.length - 1)];
    const baseSurname =
      czechLastNamesBase[randomInt(0, czechLastNamesBase.length - 1)];
    let surname = baseSurname;
    if (rules && rules.genderEnding) {
      surname = buildCzechSurname(baseSurname, isFemale, !!rules.allowNonDeclined);
    }
    if (rules && rules.noMaleWithOva && !isFemale && surname.endsWith("ová")) {
      surname = baseSurname;
    }
    if (
      rules &&
      rules.noFemaleWithMaleSurname &&
      isFemale &&
      !surname.endsWith("á") &&
      !surname.endsWith("ová")
    ) {
      surname = buildCzechSurname(baseSurname, true, false);
    }
    return { fullName: first + " " + surname, firstName: first, lastName: surname };
  }

  function generateName() {
    const mode = getRadioValue("nameLanguage");
    const rules =
      mode === "czech" || mode === "mixed"
        ? {
            genderEnding: $("ruleGenderEnding")?.checked,
            allowNonDeclined: $("ruleAllowNonDeclined")?.checked,
            noMaleWithOva: $("ruleNoMaleWithOva")?.checked,
            noFemaleWithMaleSurname: $("ruleNoFemaleWithMaleSurname")?.checked,
          }
        : null;
    if (mode === "custom") {
      const raw = $("customNameList")?.value || "";
      const lines = raw.split("\n").map((l) => l.trim()).filter(Boolean);
      if (lines.length > 0) {
        const pick = lines[randomInt(0, lines.length - 1)];
        return { fullName: pick, firstName: pick, lastName: "" };
      }
    }
    if (mode === "mixed") {
      return Math.random() < 0.5
        ? generateEnglishName()
        : generateCzechName(rules);
    }
    if (mode === "czech") return generateCzechName(rules);
    return generateEnglishName();
  }

  /* USER EMAIL / ACTIVE / CREATEDAT */
  function generateEmail(nameObj) {
    const domain = ($("emailDomainInput")?.value || "example.com").trim();
    const format = getRadioValue("emailFormat") || "firstLast";
    const first = nameObj.firstName || "";
    const last = nameObj.lastName || "";
    const full = nameObj.fullName || "";
    function slugify(str) {
      return str
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9]+/g, ".")
        .replace(/^\.+|\.+$/g, "")
        .toLowerCase();
    }
    if (format === "firstLast") {
      return slugify(first) + "." + slugify(last) + "@" + domain;
    }
    if (format === "fullName") {
      return slugify(full) + "@" + domain;
    }
    const patterns = [
      () => slugify(first[0] || "") + slugify(last),
      () => slugify(first) + randomInt(1, 999),
      () => slugify(first[0] || "") + slugify(last) + randomInt(1, 99),
    ];
    return patterns[randomInt(0, patterns.length - 1)]() + "@" + domain;
  }

  function generateActive() {
    const mode = getRadioValue("activeStatus") || "random";
    if (mode === "true") return true;
    if (mode === "false") return false;
    return Math.random() < 0.5;
  }

  function generateCreatedAt() {
    const fromVal = $("createdFromInput")?.value;
    const toVal = $("createdToInput")?.value;
    let fromDate = fromVal ? new Date(fromVal) : null;
    let toDate = toVal ? new Date(toVal) : null;
    if (!fromDate || isNaN(fromDate.getTime())) {
      fromDate = new Date();
      fromDate.setFullYear(fromDate.getFullYear() - 1);
    }
    if (!toDate || isNaN(toDate.getTime())) {
      toDate = new Date();
    }
    if (fromDate > toDate) [fromDate, toDate] = [toDate, fromDate];
    const t = randomInt(fromDate.getTime(), toDate.getTime());
    return new Date(t).toISOString();
  }

  function generateUserRecord() {
    const fromNum = parseInt(idRangeFromInput?.value || "0", 10);
    const toNum = parseInt(idRangeToInput?.value || "99999", 10);
    const num = randomInt(isNaN(fromNum) ? 0 : fromNum, isNaN(toNum) ? 99999 : toNum);
    const id = buildIdFromNumber(num);
    const nameObj = generateName();
    const email = generateEmail(nameObj);
    const active = generateActive();
    const createdAt = generateCreatedAt();
    const roles = roleCheckboxGroup
      ? Array.from(
          roleCheckboxGroup.querySelectorAll("input[type=checkbox]:checked")
        ).map((el) => el.value)
      : [];
    const role =
      roles.length > 0 ? roles[randomInt(0, roles.length - 1)] : null;
    return {
      id,
      name: nameObj.fullName,
      email,
      role,
      active,
      createdAt,
    };
  }

  /* PRODUCT CONFIG JS */
  const productNameSourceGroup = $("productNameSourceGroup");
  const productCustomNameBlock = $("productCustomNameBlock");
  const productCustomNameList = $("productCustomNameList");
  const productCategoryGroup = $("productCategoryGroup");
  const addProductCategoryBtn = $("addProductCategoryBtn");
  const productCustomCategoryField = $("productCustomCategoryField");
  const productCustomCategoryInput = $("productCustomCategoryInput");
  const confirmAddProductCategoryBtn = $("confirmAddProductCategoryBtn");
  const productPriceMinInput = $("productPriceMinInput");
  const productPriceMaxInput = $("productPriceMaxInput");
  const productCurrencySelect = $("productCurrencySelect");
  const productSkuPatternInput = $("productSkuPatternInput");
  const productWeightInput = $("productWeightInput");
  const productDimensionsInput = $("productDimensionsInput");

  if (productNameSourceGroup) {
    productNameSourceGroup.addEventListener("change", () => {
      const mode = getRadioValue("productNameSource");
      if (productCustomNameBlock) {
        productCustomNameBlock.style.display =
          mode === "custom" ? "block" : "none";
      }
    });
  }

  if (
    addProductCategoryBtn &&
    productCustomCategoryField &&
    productCustomCategoryInput &&
    confirmAddProductCategoryBtn &&
    productCategoryGroup
  ) {
    addProductCategoryBtn.addEventListener("click", () => {
      productCustomCategoryField.classList.remove("hidden");
      productCustomCategoryInput.focus();
    });

    confirmAddProductCategoryBtn.addEventListener("click", () => {
      const value = (productCustomCategoryInput.value || "").trim();
      if (!value) return;
      const label = document.createElement("label");
      label.className = "checkbox-option";
      const input = document.createElement("input");
      input.type = "checkbox";
      input.value = value;
      input.checked = true;
      const span = document.createElement("span");
      span.textContent = value;
      label.appendChild(input);
      label.appendChild(span);
      productCategoryGroup.appendChild(label);
      productCustomCategoryInput.value = "";
      productCustomCategoryField.classList.add("hidden");
    });
  }

  const builtinProductNames = [
    "Wireless Mouse",
    "Mechanical Keyboard",
    "Noise‑cancelling Headphones",
    "USB‑C Hub",
    "4K Monitor",
    "Laptop Stand",
    "Ergonomic Chair",
    "Desk Lamp",
    "External SSD",
    "Bluetooth Speaker",
  ];

  function pickProductName() {
    const mode = getRadioValue("productNameSource") || "builtin";
    if (mode === "custom") {
      const raw = productCustomNameList?.value || "";
      const lines = raw.split("\n").map((l) => l.trim()).filter(Boolean);
      if (lines.length > 0) {
        return lines[randomInt(0, lines.length - 1)];
      }
    }
    return builtinProductNames[randomInt(0, builtinProductNames.length - 1)];
  }

  function pickProductCategory() {
    if (!productCategoryGroup) return null;
    const checked = Array.from(
      productCategoryGroup.querySelectorAll("input[type=checkbox]:checked")
    ).map((el) => el.value);
    if (!checked.length) return null;
    return checked[randomInt(0, checked.length - 1)];
  }

  function pickProductInStock() {
    const mode = getRadioValue("productStockMode") || "random";
    if (mode === "true") return true;
    if (mode === "false") return false;
    return Math.random() < 0.7;
  }

  function pickProductPrice() {
    const min = parseFloat(productPriceMinInput?.value || "0") || 0;
    const max = parseFloat(productPriceMaxInput?.value || String(min)) || min;
    const from = Math.min(min, max);
    const to = Math.max(min, max);
    const value = from + Math.random() * (to - from);
    return Math.round(value * 100) / 100;
  }

  function buildSku(pattern) {
    const p = pattern || "PRD-#####";
    const digits = padNumber(randomInt(0, 99999), 5);
    const match = p.match(/#+/);
    if (match) {
      const count = match[0].length;
      const slice = digits.slice(-count);
      return p.replace(match[0], slice);
    }
    return p + digits;
  }

  function generateProductRecord() {
    const name = pickProductName();
    const category = pickProductCategory();
    const price = pickProductPrice();
    const currency = productCurrencySelect?.value || "CZK";
    const inStock = pickProductInStock();
    const sku = buildSku(productSkuPatternInput?.value || "PRD-#####");
    const weight = parseFloat(productWeightInput?.value || "") || null;
    const dimensions = (productDimensionsInput?.value || "").trim() || null;

    return {
      id: sku,
      name,
      category,
      price,
      currency,
      inStock,
      sku,
      weight,
      dimensions,
    };
  }

  /* ORDER GENERATION */
  const orderIdPatternInput = $("orderIdPatternInput");
  const orderQtyMinInput = $("orderQtyMinInput");
  const orderQtyMaxInput = $("orderQtyMaxInput");
  const orderStatusGroup = $("orderStatusGroup");
  const orderDateFromInput = $("orderDateFromInput");
  const orderDateToInput = $("orderDateToInput");
  const orderTotalMinInput = $("orderTotalMinInput");
  const orderTotalMaxInput = $("orderTotalMaxInput");

  function buildOrderId() {
    const pattern = orderIdPatternInput?.value || "ORD-#####";
    const digits = padNumber(randomInt(0, 99999), 5);
    const match = pattern.match(/#+/);
    if (match) {
      const count = match[0].length;
      const slice = digits.slice(-count);
      return pattern.replace(match[0], slice);
    }
    return pattern + digits;
  }

  function pickOrderStatus() {
    if (!orderStatusGroup) return "pending";
    const checked = Array.from(
      orderStatusGroup.querySelectorAll("input[type=checkbox]:checked")
    ).map((el) => el.value);
    if (!checked.length) return "pending";
    return checked[randomInt(0, checked.length - 1)];
  }

  function pickOrderDate() {
    const fromVal = orderDateFromInput?.value;
    const toVal = orderDateToInput?.value;
    let fromDate = fromVal ? new Date(fromVal) : null;
    let toDate = toVal ? new Date(toVal) : null;
    if (!fromDate || isNaN(fromDate.getTime())) {
      fromDate = new Date();
      fromDate.setMonth(fromDate.getMonth() - 3);
    }
    if (!toDate || isNaN(toDate.getTime())) {
      toDate = new Date();
    }
    if (fromDate > toDate) [fromDate, toDate] = [toDate, fromDate];
    const t = randomInt(fromDate.getTime(), toDate.getTime());
    return new Date(t).toISOString();
  }

  function pickOrderTotal() {
    const min = parseFloat(orderTotalMinInput?.value || "0") || 0;
    const max = parseFloat(orderTotalMaxInput?.value || String(min)) || min;
    const from = Math.min(min, max);
    const to = Math.max(min, max);
    const value = from + Math.random() * (to - from);
    return Math.round(value * 100) / 100;
  }

  function pickOrderQty() {
    const min = parseInt(orderQtyMinInput?.value || "1", 10) || 1;
    const max = parseInt(orderQtyMaxInput?.value || "5", 10) || min;
    const from = Math.min(min, max);
    const to = Math.max(min, max);
    return randomInt(from, to);
  }

  function generateOrderRecord() {
    const id = buildOrderId();
    const quantity = pickOrderQty();
    const status = pickOrderStatus();
    const createdAt = pickOrderDate();
    const total = pickOrderTotal();

    // Simple synthetic user/product references
    const userId = "USR-" + padNumber(randomInt(0, 99999), 5);
    const productId = "PRD-" + padNumber(randomInt(0, 99999), 5);

    return {
      id,
      userId,
      productId,
      quantity,
      total,
      status,
      createdAt,
    };
  }

  /* RANDOM STRING GENERATION */
  const rsLengthInput = $("rsLengthInput");
  const rsCustomCharsetField = $("rsCustomCharsetField");
  const rsCustomCharsetInput = $("rsCustomCharsetInput");
  const rsCharsetGroup = $("rsCharsetGroup");

  if (rsCharsetGroup && rsCustomCharsetField) {
    rsCharsetGroup.addEventListener("change", () => {
      const mode = getRadioValue("rsCharset");
      rsCustomCharsetField.classList.toggle("hidden", mode !== "custom");
    });
  }

  function getRandomStringCharset() {
    const mode = getRadioValue("rsCharset") || "alnum";
    if (mode === "alpha") return "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    if (mode === "numeric") return "0123456789";
    if (mode === "hex") return "0123456789abcdef";
    if (mode === "custom") {
      const custom = rsCustomCharsetInput?.value || "";
      return custom || "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    }
    return "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  }

  function generateRandomStringRecord(existingSet) {
    const len = parseInt(rsLengthInput?.value || "16", 10) || 16;
    const charset = getRandomStringCharset();
    const uniqueMode = getRadioValue("rsUniqueMode") || "allowDuplicates";
    let value = "";
    const maxAttempts = 50;
    let attempts = 0;

    function build() {
      let s = "";
      for (let i = 0; i < len; i++) {
        s += charset[randomInt(0, charset.length - 1)];
      }
      return s;
    }

    do {
      value = build();
      attempts++;
      if (uniqueMode !== "unique") break;
    } while (existingSet.has(value) && attempts < maxAttempts);

    existingSet.add(value);

    return {
      id: "RS-" + padNumber(randomInt(0, 99999), 5),
      value,
    };
  }

  /* DATE SET GENERATION */
  const dsStartInput = $("dsStartInput");
  const dsEndInput = $("dsEndInput");
  const dsCountInput = $("dsCountInput");

  function getDateSetBounds() {
    const startVal = dsStartInput?.value;
    const endVal = dsEndInput?.value;
    let start = startVal ? new Date(startVal) : null;
    let end = endVal ? new Date(endVal) : null;
    if (!start || isNaN(start.getTime())) {
      start = new Date();
      start.setDate(start.getDate() - 7);
    }
    if (!end || isNaN(end.getTime())) {
      end = new Date();
    }
    if (start > end) [start, end] = [end, start];
    return { start, end };
  }

  function generateDateSetRecord() {
    const { start, end } = getDateSetBounds();
    const count = parseInt(dsCountInput?.value || "5", 10) || 5;
    const freq = getRadioValue("dsFrequency") || "daily";
    const format = getRadioValue("dsFormat") || "iso";

    const dates = [];
    let current = new Date(start.getTime());
    const stepMs =
      freq === "weekly"
        ? 7 * 86400000
        : freq === "monthly"
        ? 30 * 86400000
        : 86400000;

    while (dates.length < count && current <= end) {
      let value;
      if (format === "date") {
        value = current.toISOString().slice(0, 10);
      } else if (format === "timestamp") {
        value = Math.floor(current.getTime() / 1000);
      } else {
        value = current.toISOString();
      }
      dates.push(value);
      current = new Date(current.getTime() + stepMs);
    }

    if (!dates.length) {
      dates.push(
        format === "timestamp"
          ? Math.floor(start.getTime() / 1000)
          : format === "date"
          ? start.toISOString().slice(0, 10)
          : start.toISOString()
      );
    }

    return {
      id: "DS-" + padNumber(randomInt(0, 99999), 5),
      dates,
    };
  }

  /* EDGE CASES GENERATION */
  const ecIncludeGroup = $("ecIncludeGroup");

  function getEdgeCaseFlags() {
    if (!ecIncludeGroup) {
      return {
        nulls: true,
        emptyStrings: true,
        longStrings: true,
        sql: true,
        unicode: true,
        extremeNumbers: true,
      };
    }
    const checked = Array.from(
      ecIncludeGroup.querySelectorAll("input[type=checkbox]:checked")
    ).map((el) => el.value);
    const has = (k) => checked.includes(k);
    return {
      nulls: has("nulls"),
      emptyStrings: has("emptyStrings"),
      longStrings: has("longStrings"),
      sql: has("sql"),
      unicode: has("unicode"),
      extremeNumbers: has("extremeNumbers"),
    };
  }

  function generateEdgeCaseRecord(index) {
    const flags = getEdgeCaseFlags();
    const record = {
      id: "EC-" + padNumber(index, 5),
    };
    if (flags.nulls) record.nullValue = null;
    if (flags.emptyStrings) record.emptyString = "";
    if (flags.longStrings) record.longString = "A".repeat(2000);
    if (flags.sql) record.sqlPayload = "'; DROP TABLE users; --";
    if (flags.unicode) record.unicode = "こんにちは世界🌍 – 🧪 edge‑case";
    if (flags.extremeNumbers) {
      record.maxInt = Number.MAX_SAFE_INTEGER;
      record.minInt = Number.MIN_SAFE_INTEGER;
      record.infinity = Infinity;
      record.nan = NaN;
    }
    return record;
  }

  /* OUTPUT RENDERING */
  function renderOutput(data) {
    const box = $("outputBox");
    if (!box) return;
    if (!data || data.length === 0) {
      box.innerHTML =
        '<span class="output-empty">No data generated yet. Click “Generate” to create sample test data.</span>';
      const metaRec = $("outputMetaRecords");
      if (metaRec) metaRec.textContent = "0 records";
      return;
    }
    const metaRec = $("outputMetaRecords");
    if (metaRec) metaRec.textContent = data.length + " records";

    if (outputFormat === "table") {
      const headers = Object.keys(data[0]);
      const lines = [];
      lines.push(headers.join(" | "));
      lines.push(headers.map(() => "---").join(" | "));
      data.forEach((row) => {
        lines.push(
          headers
            .map((h) =>
              row[h] === undefined || row[h] === null ? "" : String(row[h])
            )
            .join(" | ")
        );
      });
      box.textContent = lines.join("\n");
    } else {
      box.textContent = JSON.stringify(data, null, 2);
    }
  }

  /* GENERATE BUTTON */
  safeOn("generateBtn", "click", () => {
    const countInput = $("recordCountInput");
    const raw = countInput ? parseInt(countInput.value, 10) : 10;
    const safeCount = Math.max(1, Math.min(raw || 1, 200));
    if (countInput) countInput.value = safeCount;
    const records = [];
    const rsSet = new Set();

    for (let i = 0; i < safeCount; i++) {
      if (currentDataType === "user") {
        records.push(generateUserRecord());
      } else if (currentDataType === "product") {
        records.push(generateProductRecord());
      } else if (currentDataType === "order") {
        records.push(generateOrderRecord());
      } else if (currentDataType === "randomString") {
        records.push(generateRandomStringRecord(rsSet));
      } else if (currentDataType === "dateSet") {
        records.push(generateDateSetRecord());
      } else if (currentDataType === "edgeCases") {
        records.push(generateEdgeCaseRecord(i));
      }
    }

    lastGeneratedData = records;
    renderOutput(records);
    announce(`${records.length} records generated`);
  });

  /* COPY BUTTON */
  safeOn("copyBtn", "click", async () => {
    if (!lastGeneratedData.length) return;
    const box = $("outputBox");
    const text =
      outputFormat === "json"
        ? JSON.stringify(lastGeneratedData, null, 2)
        : box?.textContent || "";
    try {
      await navigator.clipboard.writeText(text);
      announce("Copied to clipboard");
    } catch (e) {
      console.warn("Clipboard copy failed", e);
      announce("Copy failed");
    }
  });

  /* DOWNLOAD BUTTON */
  safeOn("downloadBtn", "click", () => {
    if (!lastGeneratedData || lastGeneratedData.length === 0) return;
    const blob = new Blob([JSON.stringify(lastGeneratedData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "test-data.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    announce("Download started");
  });
});
