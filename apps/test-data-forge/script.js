/* -------------------------------------------------------
   Test Data Forge – Main Script
   Modular architecture · LyraZur Tools
------------------------------------------------------- */

/* -------------------------------------------------------
   DOM ELEMENTS
------------------------------------------------------- */

const dataTypeSelect = document.getElementById("dataTypeSelect");
const recordCountInput = document.getElementById("recordCountInput");

const outputFormatToggle = document.getElementById("outputFormatToggle");
const outputBox = document.getElementById("outputBox");

const globalFieldList = document.getElementById("globalFieldList");
const selectAllFieldsBtn = document.getElementById("selectAllFieldsBtn");
const deselectAllFieldsBtn = document.getElementById("deselectAllFieldsBtn");

const generateBtn = document.getElementById("generateBtn");
const copyBtn = document.getElementById("copyBtn");

/* Config sections */
const userConfigCards = document.getElementById("userConfigCards");
const productConfigCards = document.getElementById("productConfigCards");
const orderConfigCards = document.getElementById("orderConfigCards");
const randomStringConfigCards = document.getElementById("randomStringConfigCards");
const dateSetConfigCards = document.getElementById("dateSetConfigCards");
const edgeCasesConfigCards = document.getElementById("edgeCasesConfigCards");

/* -------------------------------------------------------
   FIELD DEFINITIONS
------------------------------------------------------- */

const FIELD_SETS = {
  user: [
    { key: "user_id", label: "ID" },
    { key: "user_name", label: "Name" },
    { key: "user_email", label: "Email" },
    { key: "user_role", label: "Role" },
    { key: "user_active", label: "Active" },
    { key: "user_createdAt", label: "CreatedAt" }
  ],

  product: [
    { key: "product_id", label: "ID" },
    { key: "product_name", label: "Name" },
    { key: "product_category", label: "Category" },
    { key: "product_price", label: "Price" },
    { key: "product_stock", label: "Stock" }
  ],

  order: [],
  randomString: [],
  dateSet: [],
  edgeCases: []
};

/* -------------------------------------------------------
   RENDER GLOBAL FIELD SELECTOR
------------------------------------------------------- */

function renderGlobalFieldSelector(type) {
  globalFieldList.innerHTML = "";

  FIELD_SETS[type].forEach(field => {
    const div = document.createElement("label");
    div.className = "checkbox-option";

    div.innerHTML = `
      <input type="checkbox" class="global-field-checkbox" data-field="${field.key}" checked>
      <span>${field.label}</span>
    `;

    globalFieldList.appendChild(div);
  });
}

/* -------------------------------------------------------
   SELECT / DESELECT ALL FIELDS
------------------------------------------------------- */

selectAllFieldsBtn.addEventListener("click", () => {
  document.querySelectorAll(".global-field-checkbox").forEach(cb => cb.checked = true);
});

deselectAllFieldsBtn.addEventListener("click", () => {
  document.querySelectorAll(".global-field-checkbox").forEach(cb => cb.checked = false);
});

/* -------------------------------------------------------
   SWITCH DATA TYPE – SHOW/HIDE CONFIG CARDS
------------------------------------------------------- */

function updateConfigVisibility(type) {
  userConfigCards.style.display = type === "user" ? "grid" : "none";
  productConfigCards.style.display = type === "product" ? "grid" : "none";
  orderConfigCards.style.display = type === "order" ? "grid" : "none";
  randomStringConfigCards.style.display = type === "randomString" ? "grid" : "none";
  dateSetConfigCards.style.display = type === "dateSet" ? "grid" : "none";
  edgeCasesConfigCards.style.display = type === "edgeCases" ? "grid" : "none";
}

dataTypeSelect.addEventListener("change", () => {
  const type = dataTypeSelect.value;
  renderGlobalFieldSelector(type);
  updateConfigVisibility(type);
});

/* Initial load */
renderGlobalFieldSelector("user");
updateConfigVisibility("user");

/* -------------------------------------------------------
   OUTPUT FORMAT TOGGLE
------------------------------------------------------- */

let outputFormat = "json";

outputFormatToggle.addEventListener("click", e => {
  if (!e.target.classList.contains("pill-option")) return;

  document.querySelectorAll(".pill-option").forEach(opt => opt.classList.remove("active"));
  e.target.classList.add("active");

  outputFormat = e.target.dataset.format;
});

/* -------------------------------------------------------
   ID GENERATION UTILITIES
------------------------------------------------------- */

function randomDigits(length) {
  let out = "";
  for (let i = 0; i < length; i++) out += Math.floor(Math.random() * 10);
  return out;
}

function applyIdFormat(format, base, prefix = "", suffix = "", pattern = "") {
  switch (format) {
    case "numeric":
      return base;

    case "numericPadded":
      return base.padStart(base.length, "0");

    case "prefix":
      return prefix + base;

    case "suffix":
      return base + suffix;

    case "pattern":
      return pattern.replace("{#####}", base);

    default:
      return base;
  }
}

/* -------------------------------------------------------
   USER ID PREVIEW
------------------------------------------------------- */

const idLengthSelect = document.getElementById("idLengthSelect");
const idCustomLengthField = document.getElementById("idCustomLengthField");
const idCustomLengthInput = document.getElementById("idCustomLengthInput");

const idRangeFromInput = document.getElementById("idRangeFromInput");
const idRangeToInput = document.getElementById("idRangeToInput");

const idFormatSelect = document.getElementById("idFormatSelect");
const idPrefixField = document.getElementById("idPrefixField");
const idSuffixField = document.getElementById("idSuffixField");
const idPatternField = document.getElementById("idPatternField");

const idPrefixInput = document.getElementById("idPrefixInput");
const idSuffixInput = document.getElementById("idSuffixInput");
const idPatternInput = document.getElementById("idPatternInput");

const idPreviewBox = document.getElementById("idPreviewBox");

function updateIdPreview() {
  let length = idLengthSelect.value === "custom"
    ? Number(idCustomLengthInput.value)
    : Number(idLengthSelect.value);

  const base = randomDigits(length);
  const format = idFormatSelect.value;

  const preview = applyIdFormat(
    format,
    base,
    idPrefixInput.value,
    idSuffixInput.value,
    idPatternInput.value
  );

  idPreviewBox.textContent = preview;
}

[idLengthSelect, idCustomLengthInput, idRangeFromInput, idRangeToInput,
 idFormatSelect, idPrefixInput, idSuffixInput, idPatternInput]
.forEach(el => el.addEventListener("input", updateIdPreview));

idLengthSelect.addEventListener("change", () => {
  idCustomLengthField.style.display = idLengthSelect.value === "custom" ? "block" : "none";
  updateIdPreview();
});

idFormatSelect.addEventListener("change", () => {
  idPrefixField.style.display = idFormatSelect.value === "prefix" ? "block" : "none";
  idSuffixField.style.display = idFormatSelect.value === "suffix" ? "block" : "none";
  idPatternField.style.display = idFormatSelect.value === "pattern" ? "block" : "none";
  updateIdPreview();
});

updateIdPreview();

/* -------------------------------------------------------
   PRODUCT ID PREVIEW
------------------------------------------------------- */

const productIdPatternInput = document.getElementById("productIdPatternInput");
const productIdPreviewBox = document.getElementById("productIdPreviewBox");

function updateProductIdPreview() {
  const base = randomDigits(5);
  const pattern = productIdPatternInput.value;
  productIdPreviewBox.textContent = pattern.replace("{#####}", base);
}

productIdPatternInput.addEventListener("input", updateProductIdPreview);
updateProductIdPreview();

/* -------------------------------------------------------
   NAME GENERATION (EN / CZ / MIX / CUSTOM)
------------------------------------------------------- */

const nameLanguageGroup = document.getElementById("nameLanguageGroup");
const czechNameRulesBlock = document.getElementById("czechNameRulesBlock");
const customNameListBlock = document.getElementById("customNameListBlock");
const customNameList = document.getElementById("customNameList");

function updateNameLanguageUI() {
  const selected = document.querySelector("input[name='nameLanguage']:checked").value;

  czechNameRulesBlock.style.display = selected === "czech" ? "block" : "none";
  customNameListBlock.style.display = selected === "custom" ? "block" : "none";
}

nameLanguageGroup.addEventListener("change", updateNameLanguageUI);
updateNameLanguageUI();

/* -------------------------------------------------------
   PRODUCT NAME SOURCE
------------------------------------------------------- */

const productNameSourceGroup = document.getElementById("productNameSourceGroup");
const productCustomNameListBlock = document.getElementById("productCustomNameListBlock");
const productCustomNameList = document.getElementById("productCustomNameList");

function updateProductNameSourceUI() {
  const selected = document.querySelector("input[name='productNameSource']:checked").value;
  productCustomNameListBlock.style.display = selected === "custom" ? "block" : "none";
}

productNameSourceGroup.addEventListener("change", updateProductNameSourceUI);
updateProductNameSourceUI();

/* -------------------------------------------------------
   RANDOM HELPERS
------------------------------------------------------- */

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/* -------------------------------------------------------
   NAME GENERATION
------------------------------------------------------- */

const EN_FIRST = ["John", "Emily", "Michael", "Sarah", "David", "Laura"];
const EN_LAST = ["Smith", "Johnson", "Brown", "Taylor", "Anderson"];

const CZ_FIRST = ["Jan", "Petr", "Lucie", "Tereza", "Martin", "Eva"];
const CZ_LAST = ["Novák", "Svoboda", "Dvořák", "Procházka", "Černý", "Kučera"];

/* Czech rules */
const ruleGenderEnding = document.getElementById("ruleGenderEnding");
const ruleAllowNonDeclined = document.getElementById("ruleAllowNonDeclined");
const ruleNoMaleWithOva = document.getElementById("ruleNoMaleWithOva");
const ruleNoFemaleWithMaleSurname = document.getElementById("ruleNoFemaleWithMaleSurname");

function applyCzechSurnameRules(first, last) {
  const isFemale = first.endsWith("a") || first.endsWith("e");

  if (isFemale) {
    if (ruleNoFemaleWithMaleSurname.checked && !last.endsWith("á")) {
      return last + "ová";
    }
    if (ruleGenderEnding.checked && !last.endsWith("á")) {
      return last + "ová";
    }
  } else {
    if (ruleNoMaleWithOva.checked && last.endsWith("ová")) {
      return last.replace("ová", "");
    }
  }

  return last;
}

function generateName() {
  const mode = document.querySelector("input[name='nameLanguage']:checked").value;

  if (mode === "english") {
    return pickRandom(EN_FIRST) + " " + pickRandom(EN_LAST);
  }

  if (mode === "czech") {
    const first = pickRandom(CZ_FIRST);
    let last = pickRandom(CZ_LAST);
    last = applyCzechSurnameRules(first, last);
    return first + " " + last;
  }

  if (mode === "mixed") {
    const first = pickRandom([...EN_FIRST, ...CZ_FIRST]);
    const last = pickRandom([...EN_LAST, ...CZ_LAST]);
    return first + " " + last;
  }

  if (mode === "custom") {
    const list = customNameList.value
      .split("\n")
      .map(x => x.trim())
      .filter(x => x.length > 0);

    if (list.length === 0) return "Unknown";
    return pickRandom(list);
  }
}

/* -------------------------------------------------------
   EMAIL GENERATION
------------------------------------------------------- */

const emailDomainInput = document.getElementById("emailDomainInput");
const emailFormatSelect = document.getElementById("emailFormatSelect");
const emailCustomPatternInput = document.getElementById("emailCustomPatternInput");
const emailCustomPatternField = document.getElementById("emailCustomPatternField");

emailFormatSelect.addEventListener("change", () => {
  emailCustomPatternField.style.display =
    emailFormatSelect.value === "custom" ? "block" : "none";
});

function generateEmail(fullName) {
  const domain = emailDomainInput.value.trim() || "example.com";
  const [first, last] = fullName.toLowerCase().split(" ");

  switch (emailFormatSelect.value) {
    case "first.last":
      return `${first}.${last}@${domain}`;
    case "firstlast":
      return `${first}${last}@${domain}`;
    case "f.last":
      return `${first[0]}.${last}@${domain}`;
    case "custom":
      return emailCustomPatternInput.value
        .replace("{first}", first)
        .replace("{last}", last)
        .replace("{domain}", domain);
    default:
      return `${first}.${last}@${domain}`;
  }
}

/* -------------------------------------------------------
   ROLE GENERATION
------------------------------------------------------- */

const roleCheckboxGroup = document.getElementById("roleCheckboxGroup");

function generateRole() {
  const selected = [...roleCheckboxGroup.querySelectorAll("input:checked")]
    .map(cb => cb.value);

  if (selected.length === 0) return "none";
  return pickRandom(selected);
}

/* -------------------------------------------------------
   ACTIVE STATUS
------------------------------------------------------- */

function generateActive() {
  const mode = document.querySelector("input[name='activeStatus']:checked").value;

  if (mode === "alwaysTrue") return true;
  if (mode === "alwaysFalse") return false;
  return Math.random() < 0.5;
}

/* -------------------------------------------------------
   CREATED AT DATE
------------------------------------------------------- */

const createdAtFromInput = document.getElementById("createdAtFromInput");
const createdAtToInput = document.getElementById("createdAtToInput");

function generateCreatedAt() {
  const from = new Date(createdAtFromInput.value).getTime();
  const to = new Date(createdAtToInput.value).getTime();
  const random = randomInt(from, to);
  return new Date(random).toISOString().split("T")[0];
}

/* -------------------------------------------------------
   PRODUCT NAME
------------------------------------------------------- */

const PRESET_PRODUCTS = [
  "Laptop Pro 15",
  "Wireless Headphones",
  "Smartwatch X",
  "Coffee Maker Deluxe",
  "LED Desk Lamp",
  "Bluetooth Speaker"
];

function generateProductName() {
  const mode = document.querySelector("input[name='productNameSource']:checked").value;

  if (mode === "preset") return pickRandom(PRESET_PRODUCTS);

  const list = productCustomNameList.value
    .split("\n")
    .map(x => x.trim())
    .filter(x => x.length > 0);

  if (list.length === 0) return "Unnamed Product";
  return pickRandom(list);
}

/* -------------------------------------------------------
   PRODUCT CATEGORY
------------------------------------------------------- */

const productCategoryGroup = document.getElementById("productCategoryGroup");
const productCustomCategoryBlock = document.getElementById("productCustomCategoryBlock");
const productCustomCategoryList = document.getElementById("productCustomCategoryList");

productCategoryGroup.addEventListener("change", () => {
  const customChecked = [...productCategoryGroup.querySelectorAll("input:checked")]
    .some(cb => cb.value === "custom");

  productCustomCategoryBlock.style.display = customChecked ? "block" : "none";
});

function generateProductCategory() {
  const selected = [...productCategoryGroup.querySelectorAll("input:checked")]
    .map(cb => cb.value);

  if (selected.length === 0) return "none";

  if (selected.includes("custom")) {
    const list = productCustomCategoryList.value
      .split("\n")
      .map(x => x.trim())
      .filter(x => x.length > 0);

    if (list.length > 0) return pickRandom(list);
  }

  const filtered = selected.filter(x => x !== "custom");
  return pickRandom(filtered);
}

/* -------------------------------------------------------
   PRODUCT PRICE & STOCK
------------------------------------------------------- */

const productPriceMinInput = document.getElementById("productPriceMinInput");
const productPriceMaxInput = document.getElementById("productPriceMaxInput");

function generateProductPrice() {
  return randomInt(
    Number(productPriceMinInput.value),
    Number(productPriceMaxInput.value)
  );
}

const productStockMinInput = document.getElementById("productStockMinInput");
const productStockMaxInput = document.getElementById("productStockMaxInput");

function generateProductStock() {
  return randomInt(
    Number(productStockMinInput.value),
    Number(productStockMaxInput.value)
  );
}

/* -------------------------------------------------------
   RECORD GENERATION – USER
------------------------------------------------------- */

function generateUserRecord() {
  const fields = [...document.querySelectorAll(".global-field-checkbox:checked")]
    .map(cb => cb.dataset.field);

  const record = {};

  if (fields.includes("user_id")) {
    const length = idLengthSelect.value === "custom"
      ? Number(idCustomLengthInput.value)
      : Number(idLengthSelect.value);

    const base = randomDigits(length);
    record.id = applyIdFormat(
      idFormatSelect.value,
      base,
      idPrefixInput.value,
      idSuffixInput.value,
      idPatternInput.value
    );
  }

  if (fields.includes("user_name")) {
    record.name = generateName();
  }

  if (fields.includes("user_email")) {
    record.email = generateEmail(record.name || generateName());
  }

  if (fields.includes("user_role")) {
    record.role = generateRole();
  }

  if (fields.includes("user_active")) {
    record.active = generateActive();
  }

  if (fields.includes("user_createdAt")) {
    record.createdAt = generateCreatedAt();
  }

  return record;
}

/* -------------------------------------------------------
   RECORD GENERATION – PRODUCT
------------------------------------------------------- */

function generateProductRecord() {
  const fields = [...document.querySelectorAll(".global-field-checkbox:checked")]
    .map(cb => cb.dataset.field);

  const record = {};

  if (fields.includes("product_id")) {
    const base = randomDigits(5);
    record.id = productIdPatternInput.value.replace("{#####}", base);
  }

  if (fields.includes("product_name")) {
    record.name = generateProductName();
  }

  if (fields.includes("product_category")) {
    record.category = generateProductCategory();
  }

  if (fields.includes("product_price")) {
    record.price = generateProductPrice();
  }

  if (fields.includes("product_stock")) {
    record.stock = generateProductStock();
  }

  return record;
}

/* -------------------------------------------------------
   MAIN GENERATOR
------------------------------------------------------- */

function generateRecords() {
  const type = dataTypeSelect.value;
  const count = Number(recordCountInput.value);

  const records = [];

  for (let i = 0; i < count; i++) {
    if (type === "user") records.push(generateUserRecord());
    if (type === "product") records.push(generateProductRecord());
    if (type !== "user" && type !== "product") {
      records.push({ message: "This data type is not implemented yet." });
    }
  }

  return records;
}

/* -------------------------------------------------------
   RENDER OUTPUT
------------------------------------------------------- */

function renderOutput(records) {
  if (outputFormat === "json") {
    outputBox.textContent = JSON.stringify(records, null, 2);
    return;
  }

  if (outputFormat === "table") {
    if (records.length === 0) {
      outputBox.textContent = "No data.";
      return;
    }

    const keys = Object.keys(records[0]);
    let table = keys.join("\t") + "\n";

    records.forEach(rec => {
      table += keys.map(k => rec[k]).join("\t") + "\n";
    });

    outputBox.textContent = table;
  }
}

/* -------------------------------------------------------
   GENERATE BUTTON
------------------------------------------------------- */

generateBtn.addEventListener("click", () => {
  const records = generateRecords();
  renderOutput(records);
});

/* -------------------------------------------------------
   COPY BUTTON
------------------------------------------------------- */

copyBtn.addEventListener("click", () => {
  navigator.clipboard.writeText(outputBox.textContent);
  copyBtn.textContent = "Copied!";
  setTimeout(() => (copyBtn.textContent = "Copy"), 1200);
});

