// script.js - Test Data Forge (rewritten to support User, Product, Order, Random String, Date Set, Edge Cases)

/* Small helpers */
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
function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }

/* Safe random integer (inclusive) */
function safeRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  if (max <= min) return min;
  // Use crypto when available for better distribution
  if (window.crypto && window.crypto.getRandomValues) {
    const range = max - min + 1;
    const uint32Max = 0xFFFFFFFF;
    if (range <= uint32Max) {
      const limit = Math.floor((uint32Max + 1) / range) * range;
      const arr = new Uint32Array(1);
      while (true) {
        window.crypto.getRandomValues(arr);
        const r = arr[0];
        if (r < limit) return min + (r % range);
      }
    }
  }
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/* Small random helpers */
function randomChoice(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randomInt(min, max) { return safeRandomInt(min, max); }

/* STATE */
let outputFormat = "json";
let lastGeneratedData = [];
let currentDataType = "user";

/* UI elements */
const userConfigCards = $("userConfigCards");
const productConfigCards = $("productConfigCards");
const orderConfigCards = $("orderConfigCards");
const randomStringConfig = $("randomStringConfig");
const dateSetConfig = $("dateSetConfig");
const edgeCasesConfig = $("edgeCasesConfig");

/* Output meta */
$("outputMetaFormat").textContent = "JSON format";

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
/* keyboard support for pill options */
document.querySelectorAll(".pill-option").forEach(el => {
  el.addEventListener("keydown", (ev) => {
    if (ev.key === "Enter" || ev.key === " ") {
      ev.preventDefault();
      el.click();
    }
  });
});

/* DATA TYPE SWITCH */
$("dataTypeSelect").addEventListener("change", () => {
  currentDataType = $("dataTypeSelect").value;
  userConfigCards.style.display = currentDataType === "user" ? "grid" : "none";
  productConfigCards.style.display = currentDataType === "product" ? "grid" : "none";
  orderConfigCards.style.display = currentDataType === "order" ? "grid" : "none";
  randomStringConfig.style.display = currentDataType === "randomString" ? "grid" : "none";
  dateSetConfig.style.display = currentDataType === "dateSet" ? "grid" : "none";
  edgeCasesConfig.style.display = currentDataType === "edgeCases" ? "grid" : "none";
});

/* ---------- ID / SKU helpers (kept and improved) ---------- */
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

function buildIdFromNumber(num, opts = {}) {
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
    idPreviewBox.setAttribute("aria-invalid", "true");
    return;
  }
  idPreviewBox.removeAttribute("aria-invalid");
  const base = fromNum;
  const lines = [];
  for (let i = 0; i < 3; i++) {
    const n = base + i;
    if (n > toNum) break;
    lines.push(buildIdFromNumber(n));
  }
  idPreviewBox.innerHTML = lines.join("<br>");
}
syncIdRangePlaceholders();
updateIdPreview();

/* Copy ID preview */
$("copyIdPreviewBtn").addEventListener("click", async () => {
  try {
    const text = idPreviewBox.textContent;
    await navigator.clipboard.writeText(text);
    announce("ID preview copied");
  } catch (e) {
    console.warn(e);
    announce("Copy failed");
  }
});

/* ---------- Role adding ---------- */
const addRoleBtn = $("addRoleBtn");
const customRoleField = $("customRoleField");
const customRoleInput = $("customRoleInput");
const confirmAddRoleBtn = $("confirmAddRoleBtn");
const roleCheckboxGroup = $("roleCheckboxGroup");

addRoleBtn.addEventListener("click", () => {
  const expanded = addRoleBtn.getAttribute("aria-expanded") === "true";
  addRoleBtn.setAttribute("aria-expanded", String(!expanded));
  customRoleField.style.display = customRoleField.style.display === "flex" ? "none" : "flex";
  if (customRoleField.style.display === "flex") customRoleInput.focus();
});

confirmAddRoleBtn.addEventListener("click", () => {
  const value = (customRoleInput.value || "").trim();
  if (!value) return;
  const existing = Array.from(roleCheckboxGroup.querySelectorAll("input[type=checkbox]"))
    .map(i => i.value.toLowerCase());
  if (existing.includes(value.toLowerCase())) {
    announce(`Role "${value}" already exists`);
    customRoleInput.value = "";
    customRoleField.style.display = "none";
    addRoleBtn.setAttribute("aria-expanded", "false");
    return;
  }
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
  addRoleBtn.setAttribute("aria-expanded", "false");
  input.focus();
  announce(`Added role ${value}`);
});

/* ---------- Product config ---------- */
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
  const expanded = addProductCategoryBtn.getAttribute("aria-expanded") === "true";
  addProductCategoryBtn.setAttribute("aria-expanded", String(!expanded));
  productCustomCategoryField.style.display = productCustomCategoryField.style.display === "flex" ? "none" : "flex";
  if (productCustomCategoryField.style.display === "flex") productCustomCategoryInput.focus();
});

confirmAddProductCategoryBtn.addEventListener("click", () => {
  const value = (productCustomCategoryInput.value || "").trim();
  if (!value) return;
  const existing = Array.from(productCategoryGroup.querySelectorAll("input[type=checkbox]"))
    .map(i => i.value.toLowerCase());
  if (existing.includes(value.toLowerCase())) {
    announce(`Category "${value}" already exists`);
    productCustomCategoryInput.value = "";
    productCustomCategoryField.style.display = "none";
    addProductCategoryBtn.setAttribute("aria-expanded", "false");
    return;
  }
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
  addProductCategoryBtn.setAttribute("aria-expanded", "false");
  input.focus();
  announce(`Added category ${value}`);
});

/* ---------- Name generators (user) ---------- */
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
  const mode = getRadioValue("nameLanguage") || "english";
  const rules =
    mode === "czech" || mode === "mixed"
      ? {
          genderEnding: $("ruleGenderEnding") ? $("ruleGenderEnding").checked : true,
          allowNonDeclined: $("ruleAllowNonDeclined") ? $("ruleAllowNonDeclined").checked : true,
          noMaleWithOva: $("ruleNoMaleWithOva") ? $("ruleNoMaleWithOva").checked : true,
          noFemaleWithMaleSurname: $("ruleNoFemaleWithMaleSurname") ? $("ruleNoFemaleWithMaleSurname").checked : true,
        }
      : null;
  if (mode === "custom") {
    const raw = $("customNameList").value || "";
    const lines = raw.split("\n").map(l => l.trim()).filter(Boolean);
    if (lines.length > 0) {
      const pick = lines[randomInt(0, lines.length - 1)];
      const parts = pick.split(" ");
      return { fullName: pick, firstName: parts[0] || pick, lastName: parts.slice(1).join(" ") || "" };
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

/* ---------- Email / active / createdAt ---------- */
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
    () => slugify((first[0] || "") + (last || "")),
    () => slugify(first) + randomInt(1, 999),
    () => slugify((first[0] || "") + (last || "")) + randomInt(1, 99),
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

/* ---------- USER RECORD ---------- */
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

/* ---------- PRODUCT RECORD ---------- */
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

function pickProductCategory() {
  const checked = Array.from(
    productCategoryGroup.querySelectorAll("input[type=checkbox]:checked")
  ).map(el => el.value);
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
  const min = parseFloat(productPriceMinInput.value) || 0;
  const max = parseFloat(productPriceMaxInput.value) || min;
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

/* ---------- ORDER RECORD ---------- */
const orderIdPatternInput = $("orderIdPatternInput");
const orderStatusGroup = $("orderStatusGroup");
const orderQtyMinInput = $("orderQtyMinInput");
const orderQtyMaxInput = $("orderQtyMaxInput");
const orderUserLinkSelect = $("orderUserLinkSelect");
const orderProductLinkSelect = $("orderProductLinkSelect");

function pickOrderStatus() {
  const checked = Array.from(orderStatusGroup.querySelectorAll("input[type=checkbox]:checked"))
    .map(el => el.value);
  if (!checked.length) return "pending";
  return checked[randomInt(0, checked.length - 1)];
}

function generateOrderId() {
  const p = orderIdPatternInput.value || "ORD-#####";
  const digits = padNumber(randomInt(0, 99999), 5);
  const match = p.match(/#+/);
  if (match) {
    const count = match[0].length;
    const slice = digits.slice(-count);
    return p.replace(match[0], slice);
  }
  return p + digits;
}

function generateOrderRecord(generatedUsers, generatedProducts) {
  const id = generateOrderId();
  const qtyMin = parseInt(orderQtyMinInput.value, 10) || 1;
  const qtyMax = parseInt(orderQtyMaxInput.value, 10) || qtyMin;
  const qty = randomInt(Math.min(qtyMin, qtyMax), Math.max(qtyMin, qtyMax));
  // choose user
  let userId = null;
  if (orderUserLinkSelect.value === "generated" && generatedUsers && generatedUsers.length) {
    userId = randomChoice(generatedUsers).id;
  } else {
    // synthetic user id
    userId = "USR-" + padNumber(randomInt(0, 99999), 5);
  }
  // choose product
  let product = null;
  if (orderProductLinkSelect.value === "generated" && generatedProducts && generatedProducts.length) {
    product = randomChoice(generatedProducts);
  } else {
    product = { sku: buildSku(productSkuPatternInput.value || "PRD-#####"), price: pickProductPrice(), currency: productCurrencySelect.value || "CZK" };
  }
  const unitPrice = product.price || pickProductPrice();
  const total = Math.round(unitPrice * qty * 100) / 100;
  const status = pickOrderStatus();
  const createdAt = generateCreatedAt();
  return {
    id,
    userId,
    productSku: product.sku || product.id || null,
    quantity: qty,
    unitPrice,
    total,
    currency: product.currency || productCurrencySelect.value || "CZK",
    status,
    createdAt
  };
}

/* ---------- RANDOM STRING ---------- */
const randStrLength = $("randStrLength");
const randStrCharset = $("randStrCharset");
const randStrCustomField = $("randStrCustomField");
const randStrCustomCharset = $("randStrCustomCharset");

randStrCharset.addEventListener("change", () => {
  randStrCustomField.style.display = randStrCharset.value === "custom" ? "flex" : "none";
});

function buildCharset(mode) {
  if (mode === "alphanumeric") return "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  if (mode === "alpha") return "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  if (mode === "numeric") return "0123456789";
  if (mode === "hex") return "0123456789abcdef";
  if (mode === "base64") return "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  if (mode === "custom") return (randStrCustomCharset.value || "").split("").filter(Boolean).join("") || "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  return "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
}

function generateRandomString(len, charset) {
  const chars = charset;
  if (!chars || chars.length === 0) return "";
  let out = "";
  for (let i = 0; i < len; i++) {
    out += chars[randomInt(0, chars.length - 1)];
  }
  return out;
}

/* ---------- DATE SET ---------- */
const dateSetStart = $("dateSetStart");
const dateSetEnd = $("dateSetEnd");
const dateSetFrequency = $("dateSetFrequency");
const dateSetCount = $("dateSetCount");
const dateSetFormat = $("dateSetFormat");

function generateDateSet() {
  const startVal = dateSetStart.value;
  const endVal = dateSetEnd.value;
  let start = startVal ? new Date(startVal) : new Date();
  let end = endVal ? new Date(endVal) : new Date();
  if (isNaN(start.getTime())) start = new Date();
  if (isNaN(end.getTime())) end = new Date();
  if (start > end) [start, end] = [end, start];
  const freq = dateSetFrequency.value || "weekly";
  const count = clamp(parseInt(dateSetCount.value, 10) || 1, 1, 365);
  const dates = [];
  let cursor = new Date(start);
  // build candidate list by stepping frequency until end
  while (cursor <= end && dates.length < count * 5) { // limit to avoid infinite loops
    dates.push(new Date(cursor));
    if (freq === "daily") cursor.setDate(cursor.getDate() + 1);
    else if (freq === "weekly") cursor.setDate(cursor.getDate() + 7);
    else cursor.setMonth(cursor.getMonth() + 1);
  }
  // pick up to count dates randomly from the candidate list
  const out = [];
  for (let i = 0; i < count; i++) {
    if (!dates.length) break;
    out.push(dates[randomInt(0, dates.length - 1)]);
  }
  // format
  const fmt = dateSetFormat.value || "iso";
  return out.map(d => {
    if (fmt === "iso") return d.toISOString();
    if (fmt === "dateOnly") return d.toISOString().slice(0, 10);
    return d.getTime();
  });
}

/* ---------- EDGE CASES ---------- */
function generateEdgeCaseRecord(index, existingIds = []) {
  const includeNulls = getRadioValue("edgeNulls") === "yes";
  const includeEmpty = getRadioValue("edgeEmpty") === "yes";
  const includeSql = getRadioValue("edgeSql") === "yes";
  const includeLong = getRadioValue("edgeLong") === "yes";

  const id = existingIds.length && Math.random() < 0.1 ? randomChoice(existingIds) : "EC-" + padNumber(index, 6);
  const longString = includeLong ? "A".repeat(5000) : "normal string";
  const sqlPayload = includeSql ? "'; DROP TABLE users; --" : "safe";
  const email = includeEmpty ? "" : (includeNulls && Math.random() < 0.2 ? null : `edge${index}@example.com`);
  const numberExtreme = Math.random() < 0.2 ? Number.MAX_SAFE_INTEGER : (Math.random() < 0.2 ? Number.MIN_SAFE_INTEGER : randomInt(-1000000, 1000000));
  const unicode = Math.random() < 0.3 ? "こんにちは世界🌍" : "ascii";
  const maybeNull = includeNulls && Math.random() < 0.3 ? null : "value";
  return {
    id,
    short: includeEmpty ? "" : "s",
    long: longString,
    sql: sqlPayload,
    email,
    extremeNumber: numberExtreme,
    unicode,
    maybeNull
  };
}

/* ---------- OUTPUT RENDERING ---------- */
function renderOutput(data) {
  const box = $("outputBox");
  if (!data || data.length === 0) {
    box.innerHTML =
      '<span class="output-empty">No data generated yet. Click “Generate” to create sample test data.</span><button class="copy-btn" id="copyOutputBtn" aria-label="Copy output">Copy</button>';
    $("outputMetaRecords").textContent = "0 records";
    attachCopyOutputHandler();
    return;
  }
  $("outputMetaRecords").textContent = data.length + " records";
  if (outputFormat === "table") {
    const headers = Object.keys(data[0]);
    const lines = [];
    lines.push(headers.join(" | "));
    lines.push(headers.map(() => "---").join(" | "));
    data.forEach(row => {
      lines.push(headers.map(h => {
        const v = row[h];
        if (v === null || v === undefined) return "";
        if (Array.isArray(v)) return v.join(", ");
        return String(v);
      }).join(" | "));
    });
    box.textContent = lines.join("\n");
  } else {
    box.textContent = JSON.stringify(data, null, 2);
  }
  // add copy button
  const copyBtn = document.createElement("button");
  copyBtn.className = "copy-btn";
  copyBtn.id = "copyOutputBtn";
  copyBtn.setAttribute("aria-label", "Copy output");
  copyBtn.textContent = "Copy";
  box.appendChild(copyBtn);
  attachCopyOutputHandler();
}

/* copy output handler */
function attachCopyOutputHandler() {
  const btn = $("copyOutputBtn");
  if (!btn) return;
  btn.addEventListener("click", async () => {
    try {
      const text = outputFormat === "json" ? JSON.stringify(lastGeneratedData, null, 2) : $("outputBox").textContent;
      await navigator.clipboard.writeText(text);
      announce("Output copied to clipboard");
    } catch (e) {
      console.warn(e);
      announce("Copy failed");
    }
  });
}

/* announce helper (live region) */
let _announceTimeout = null;
function announce(msg) {
  let region = document.getElementById("tdf-live-region");
  if (!region) {
    region = document.createElement("div");
    region.id = "tdf-live-region";
    region.setAttribute("aria-live", "polite");
    region.setAttribute("aria-atomic", "true");
    region.style.position = "absolute";
    region.style.left = "-9999px";
    document.body.appendChild(region);
  }
  region.textContent = msg;
  if (_announceTimeout) clearTimeout(_announceTimeout);
  _announceTimeout = setTimeout(() => { region.textContent = ""; }, 4000);
}

/* ---------- GENERATE BUTTON (chunked generation for responsiveness) ---------- */
$("generateBtn").addEventListener("click", () => {
  const count = parseInt($("recordCountInput").value, 10) || 1;
  const safeCount = Math.max(1, Math.min(count, 200));
  $("recordCountInput").value = safeCount;

  // chunk size
  const chunk = 50;
  let generated = [];
  let i = 0;

  // Pre-generate users/products if needed for linking
  const needUsers = currentDataType === "order" && orderUserLinkSelect.value === "generated";
  const needProducts = currentDataType === "order" && orderProductLinkSelect.value === "generated";
  const preUsers = [];
  const preProducts = [];

  // If order and linking to generated, create small pools first
  if (needUsers) {
    const pool = Math.min(20, safeCount);
    for (let u = 0; u < pool; u++) preUsers.push(generateUserRecord());
  }
  if (needProducts) {
    const pool = Math.min(20, safeCount);
    for (let p = 0; p < pool; p++) preProducts.push(generateProductRecord());
  }

  function step() {
    const end = Math.min(i + chunk, safeCount);
    for (; i < end; i++) {
      if (currentDataType === "user") {
        generated.push(generateUserRecord());
      } else if (currentDataType === "product") {
        generated.push(generateProductRecord());
      } else if (currentDataType === "order") {
        generated.push(generateOrderRecord(preUsers, preProducts));
      } else if (currentDataType === "randomString") {
        const len = clamp(parseInt(randStrLength.value, 10) || 12, 1, 1024);
        const charset = buildCharset(randStrCharset.value || "alphanumeric");
        generated.push({ id: "RS-" + padNumber(i + 1, 5), value: generateRandomString(len, charset) });
      } else if (currentDataType === "dateSet") {
        generated.push({ id: "DS-" + padNumber(i + 1, 5), dates: generateDateSet() });
      } else if (currentDataType === "edgeCases") {
        generated.push(generateEdgeCaseRecord(i + 1, generated.map(r => r.id)));
      }
    }
    // update preview progressively
    lastGeneratedData = generated.slice();
    renderOutput(lastGeneratedData);
    if (i < safeCount) {
      setTimeout(step, 10);
    } else {
      announce(`${generated.length} records generated`);
    }
  }
  // start
  generated = [];
  i = 0;
  step();
});

/* COPY BUTTON (top) */
$("copyBtn").addEventListener("click", async () => {
  if (!lastGeneratedData.length) return;
  const text = outputFormat === "json" ? JSON.stringify(lastGeneratedData, null, 2) : $("outputBox").textContent;
  try {
    await navigator.clipboard.writeText(text);
    announce("Copied to clipboard");
  } catch (e) {
    console.warn(e);
    announce("Copy failed");
  }
});

/* DOWNLOAD BUTTON */
$("downloadBtn").addEventListener("click", () => {
  if (!lastGeneratedData || lastGeneratedData.length === 0) return;
  const blob = new Blob([JSON.stringify(lastGeneratedData, null, 2)], { type: "application/json" });
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

/* Attach copy output handler if button exists on load */
attachCopyOutputHandler();

/* Small initialization */
document.addEventListener("DOMContentLoaded", () => {
  // ensure data type panels reflect initial selection
  currentDataType = $("dataTypeSelect").value;
  userConfigCards.style.display = currentDataType === "user" ? "grid" : "none";
  productConfigCards.style.display = currentDataType === "product" ? "grid" : "none";
  orderConfigCards.style.display = currentDataType === "order" ? "grid" : "none";
  randomStringConfig.style.display = currentDataType === "randomString" ? "grid" : "none";
  dateSetConfig.style.display = currentDataType === "dateSet" ? "grid" : "none";
  edgeCasesConfig.style.display = currentDataType === "edgeCases" ? "grid" : "none";
});
