function $(id) { return document.getElementById(id); }
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

/* OUTPUT FORMAT TOGGLE */
$("outputFormatToggle").addEventListener("click", (e) => {
  const option = e.target.closest(".pill-option");
  if (!option) return;
  document.querySelectorAll("#outputFormatToggle .pill-option")
    .forEach(el => el.classList.remove("active"));
  option.classList.add("active");
  outputFormat = option.dataset.format;
  $("outputMetaFormat").textContent =
    outputFormat === "json" ? "JSON format" : "Table format";
  renderOutput(lastGeneratedData);
});

/* DATA TYPE SWITCH */
const userConfigCards = $("userConfigCards");
const productConfigCards = $("productConfigCards");

$("dataTypeSelect").addEventListener("change", () => {
  currentDataType = $("dataTypeSelect").value;
  userConfigCards.style.display = currentDataType === "user" ? "grid" : "none";
  productConfigCards.style.display = currentDataType === "product" ? "grid" : "none";
});

/* NAME SETTINGS (USER) */
const nameLanguageGroup = $("nameLanguageGroup");
const czechNameRulesBlock = $("czechNameRulesBlock");
const customNameListBlock = $("customNameListBlock");

nameLanguageGroup.addEventListener("change", () => {
  const value = getRadioValue("nameLanguage");
  czechNameRulesBlock.style.display =
    value === "czech" || value === "mixed" ? "block" : "none";
  customNameListBlock.style.display =
    value === "custom" ? "block" : "none";
});

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
  const val = idLengthSelect.value;
  if (val === "custom") {
    const n = parseInt(idCustomLengthInput.value, 10);
    return isNaN(n) || n < 1 ? 1 : Math.min(n, 12);
  }
  return parseInt(val, 10);
}

function syncIdRangePlaceholders() {
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

idLengthSelect.addEventListener("change", () => {
  const val = idLengthSelect.value;
  idCustomLengthField.style.display = val === "custom" ? "block" : "none";
  syncIdRangePlaceholders();
  updateIdPreview();
});
idCustomLengthInput.addEventListener("input", () => {
  syncIdRangePlaceholders();
  updateIdPreview();
});
idRangeFromInput.addEventListener("input", updateIdPreview);
idRangeToInput.addEventListener("input", updateIdPreview);

idFormatSelect.addEventListener("change", () => {
  const val = idFormatSelect.value;
  idPrefixField.style.display = val === "prefix" ? "block" : "none";
  idSuffixField.style.display = val === "suffix" ? "block" : "none";
  idPatternField.style.display = val === "pattern" ? "block" : "none";
  updateIdPreview();
});
idPrefixInput.addEventListener("input", updateIdPreview);
idSuffixInput.addEventListener("input", updateIdPreview);
idPatternInput.addEventListener("input", updateIdPreview);

function buildIdFromNumber(num) {
  const len = getIdLength();
  const format = idFormatSelect.value;
  const padded = padNumber(num, len);
  if (format === "numeric") return String(num);
  if (format === "numericPadded") return padded;
  if (format === "prefix") return (idPrefixInput.value || "") + padded;
  if (format === "suffix") return padded + (idSuffixInput.value || "");
  if (format === "pattern") {
    const pattern = idPatternInput.value || "{#####}";
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
  const len = getIdLength();
  const fromStr = idRangeFromInput.value || padNumber(0, len);
  const toStr = idRangeToInput.value || padNumber(Math.pow(10, len) - 1, len);
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

syncIdRangePlaceholders();
updateIdPreview();

/* ROLE ADDING (USER) */
const addRoleBtn = $("addRoleBtn");
const customRoleField = $("customRoleField");
const customRoleInput = $("customRoleInput");
const confirmAddRoleBtn = $("confirmAddRoleBtn");
const roleCheckboxGroup = $("roleCheckboxGroup");

addRoleBtn.addEventListener("click", () => {
  customRoleField.style.display = "flex";
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
  customRoleField.style.display = "none";
});

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
          genderEnding: $("ruleGenderEnding").checked,
          allowNonDeclined: $("ruleAllowNonDeclined").checked,
          noMaleWithOva: $("ruleNoMaleWithOva").checked,
          noFemaleWithMaleSurname: $("ruleNoFemaleWithMaleSurname").checked,
        }
      : null;
  if (mode === "custom") {
    const raw = $("customNameList").value || "";
    const lines = raw.split("\n").map(l => l.trim()).filter(Boolean);
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
  const domain = ($("emailDomainInput").value || "example.com").trim();
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
  const fromVal = $("createdFromInput").value;
  const toVal = $("createdToInput").value;
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

/* USER RECORD */
function generateUserRecord() {
  const fromNum = parseInt(idRangeFromInput.value, 10);
  const toNum = parseInt(idRangeToInput.value, 10);
  const num = randomInt(isNaN(fromNum) ? 0 : fromNum, isNaN(toNum) ? 99999 : toNum);
  const id = buildIdFromNumber(num);
  const nameObj = generateName();
  const email = generateEmail(nameObj);
  const active = generateActive();
  const createdAt = generateCreatedAt();
  const roles = Array.from(
    roleCheckboxGroup.querySelectorAll("input[type=checkbox]:checked")
  ).map(el => el.value);
  const role = roles.length > 0
    ? roles[randomInt(0, roles.length - 1)]
    : null;
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

productNameSourceGroup.addEventListener("change", () => {
  const mode = getRadioValue("productNameSource");
  productCustomNameBlock.style.display = mode === "custom" ? "block" : "none";
});

addProductCategoryBtn.addEventListener("click", () => {
  productCustomCategoryField.style.display = "flex";
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
  productCustomCategoryField.style.display = "none";
});

/* PRODUCT NAME GENERATION */
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
  "Bluetooth Speaker"
];

function pickProductName() {
  const mode = getRadioValue("productNameSource") || "builtin";
  if (mode === "custom") {
    const raw = productCustomNameList.value || "";
    const lines = raw.split("\n").map(l => l.trim()).filter(Boolean);
    if (lines.length > 0) {
      return lines[randomInt(0, lines.length - 1)];
    }
  }
  return builtinProductNames[randomInt(0, builtinProductNames.length - 1)];
}

/* PRODUCT CATEGORY */
function pickProductCategory() {
  const checked = Array.from(
    productCategoryGroup.querySelectorAll("input[type=checkbox]:checked")
  ).map(el => el.value);
  if (!checked.length) return null;
  return checked[randomInt(0, checked.length - 1)];
}

/* PRODUCT STOCK */
function pickProductInStock() {
  const mode = getRadioValue("productStockMode") || "random";
  if (mode === "true") return true;
  if (mode === "false") return false;
  return Math.random() < 0.7; // mírně preferovat in stock
}

/* PRODUCT PRICE */
function pickProductPrice() {
  const min = parseFloat(productPriceMinInput.value) || 0;
  const max = parseFloat(productPriceMaxInput.value) || min;
  const from = Math.min(min, max);
  const to = Math.max(min, max);
  const value = from + Math.random() * (to - from);
  return Math.round(value * 100) / 100;
}

/* PRODUCT SKU */
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

/* PRODUCT RECORD */
function generateProductRecord() {
  const name = pickProductName();
  const category = pickProductCategory();
  const price = pickProductPrice();
  const currency = productCurrencySelect.value || "CZK";
  const inStock = pickProductInStock();
  const sku = buildSku(productSkuPatternInput.value || "PRD-#####");
  const weight = parseFloat(productWeightInput.value) || null;
  const dimensions = (productDimensionsInput.value || "").trim() || null;

  return {
    id: sku,
    name,
    category,
    price,
    currency,
    inStock,
    sku,
    weight,
    dimensions
  };
}

/* OUTPUT RENDERING */
function renderOutput(data) {
  const box = $("outputBox");
  if (!data || data.length === 0) {
    box.innerHTML =
      '<span class="output-empty">No data generated yet. Click “Generate” to create sample test data.</span>';
    $("outputMetaRecords").textContent = "0 records";
    return;
  }
  $("outputMetaRecords").textContent = data.length + " records";
  if (outputFormat === "table") {
    const headers = Object.keys(data[0]);
    const lines = [];
    lines.push(headers.join(" | "));
    lines.push(headers.map(() => "---").join(" | "));
    data.forEach(row => {
      lines.push(headers.map(h => String(row[h])).join(" | "));
    });
    box.textContent = lines.join("\n");
  } else {
    box.textContent = JSON.stringify(data, null, 2);
  }
}

/* GENERATE BUTTON */
$("generateBtn").addEventListener("click", () => {
  const count = parseInt($("recordCountInput").value, 10) || 1;
  const safeCount = Math.max(1, Math.min(count, 200));
  $("recordCountInput").value = safeCount;
  const records = [];
  for (let i = 0; i < safeCount; i++) {
    if (currentDataType === "user") {
      records.push(generateUserRecord());
    } else if (currentDataType === "product") {
      records.push(generateProductRecord());
    }
  }
  lastGeneratedData = records;
  renderOutput(records);
});

/* COPY BUTTON */
$("copyBtn").addEventListener("click", async () => {
  if (!lastGeneratedData.length) return;
  const text =
    outputFormat === "json"
      ? JSON.stringify(lastGeneratedData, null, 2)
      : $("outputBox").textContent;
  try {
    await navigator.clipboard.writeText(text);
  } catch (e) {
    console.warn("Clipboard copy failed", e);
  }
});

/* DOWNLOAD BUTTON */
$("downloadBtn").addEventListener("click", () => {
  if (!lastGeneratedData || lastGeneratedData.length === 0) return;
  const blob = new Blob(
    [JSON.stringify(lastGeneratedData, null, 2)],
    { type: "application/json" }
  );
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "test-data.json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});
