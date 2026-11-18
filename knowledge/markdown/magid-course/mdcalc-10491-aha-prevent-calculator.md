---
title: "MDCalc #10491: Predicting Risk of Cardiovascular Disease EVENTs (PREVENT™) Calculator"
source_file: "MDCalc-10491-AHA-PREVENT-Calculator.html"
source_path: "knowledge/sources/magid-course/MDCalc-10491-AHA-PREVENT-Calculator.html"
source_url: "https://www.mdcalc.com/calc/10491/predicting-risk-cardiovascular-disease-events-prevent"
collection: "magid-course"
language: "en"
authors: "AHA PREVENT™ Team (Khan SS et al., Circulation 2024;149:430–449); MDCalc Contributor: Rahul Aggarwal, MD"
publication_date: "2024–2026 (2025 AHA/ACC HTN & 2026 ACC/AHA Dyslipidemia Guidelines)"
topics:
  - "AHA PREVENT cardiovascular risk calculator"
  - "10-year and 30-year Total CVD, ASCVD, and Heart Failure risk"
  - "Cardiovascular-Kidney-Metabolic (CKM) primary prevention"
  - "2025 AHA/ACC blood pressure treatment thresholds"
  - "2026 ACC/AHA primary prevention statin risk tiers"
---

# MDCalc #10491: Predicting Risk of Cardiovascular Disease EVENTs (PREVENT™) Calculator

> **Layer 1 Source Reference:** [`MDCalc-10491-AHA-PREVENT-Calculator.html`](../../sources/magid-course/MDCalc-10491-AHA-PREVENT-Calculator.html)
> **Original Web URL:** https://www.mdcalc.com/calc/10491/predicting-risk-cardiovascular-disease-events-prevent

---

## 1. Purpose, Population & Model Architecture

* **Clinical Scope:** Predicts **10-year** (ages `30–79`) and **30-year** (ages `30–59`) absolute risk of **Total Cardiovascular Disease (`CVD` — composite of `ASCVD` + heart failure)** as well as **individual `ASCVD` and Heart Failure (`HF`) subtypes** in adults **aged `30–79` years without known clinical CVD**.
* **Key Departures from 2013 Pooled Cohort Equations (`PCE`):**
  1. **Sex-specific and race-free** (removes race from risk equations while adjusting for competing risk of non-CVD death).
  2. **Integrates Cardiovascular-Kidney-Metabolic (`CKM`) health:** incorporates **`eGFR`** and **`BMI`** alongside blood pressure, lipids, diabetes, smoking, and current statin/antihypertensive treatment.
  3. **Dual time horizons (`10-year` and `30-year`):** captures long-term atherosclerotic risk in younger/perimenopausal women (`ages 30–59`) whose 10-year absolute risk appears numerically low.
* **Five Model Variants on MDCalc:**
  * **`Base` (Default):** Adequate for most primary-prevention patients.
  * **Single-Add-On Models (`uACR`, `HbA1c`, or `SDI`):** Incorporate urine albumin-to-creatinine ratio (`uACR`), `HbA1c`, or ZIP-code Social Deprivation Index (`SDI`) when a single optional predictor is available (`uACR` and `HbA1c` add the greatest clinical value in severe albuminuria or poorly controlled diabetes).
  * **`Full` Model:** Uses all three optional add-on predictors (`uACR` + `HbA1c` + `SDI`) simultaneously.

---

## 2. Calculator Input Variables & Validated Bounds

| Predictor Variable | Units / Options | Validated PREVENT Range & Clinical Notes |
| :--- | :--- | :--- |
| **Sex** | `Female` / `Male` | Sex-specific equations |
| **Age** | `years` | **`30–79` years** (`10-year` risk for `30–79`; `30-year` risk for `30–59`) |
| **Total Cholesterol** | `mg/dL` *(or `mmol/L`)* | **`130–320 mg/dL`** (`3.37–8.29 mmol/L`) |
| **HDL Cholesterol** | `mg/dL` *(or `mmol/L`)* | **`20–100 mg/dL`** (`0.52–2.59 mmol/L`) |
| **Systolic Blood Pressure (`SBP`)** | `mm Hg` | **`90–200 mm Hg`** |
| **Diabetes** | `No` / `Yes` | History of diabetes mellitus |
| **Current Smoker** | `No` / `Yes` | Active tobacco smoking |
| **eGFR** | `mL/min/1.73 m²` | **`15–140 mL/min/1.73 m²`** *(2021 race-free CKD-EPI creatinine equation)* |
| **Using Anti-Hypertensive Medication** | `No` / `Yes` | Current blood-pressure lowering medication |
| **Using Statins** | `No` / `Yes` | Current statin therapy |
| **Body Mass Index (`BMI`)** | `kg/m²` | **`18.5–39.9 kg/m²`** *(used to estimate Heart Failure risk; if BMI is outside range, HF subtype estimate is omitted while Total CVD / ASCVD subtypes still compute)* |
| **Optional Add-Ons** | `uACR` (`mg/g`), `HbA1c` (`%`), `SDI` (`1–10`) | Selected via `uACR`, `HbA1c`, `SDI`, or `Full` model tabs |

---

## 3. Clinical Interpretation & Shared Decision-Making Advice

* Use `PREVENT` estimates to guide shared decision-making in context of:
  * **Comorbidities:** diabetes, chronic kidney disease (`CKD`), obesity.
  * **Risk-enhancing factors:** premature family history of ASCVD, elevated **lipoprotein(a) (`Lp(a)`)**, chronic **inflammatory/autoimmune conditions**, **coronary artery calcium (`CAC`)** score *(plus female-specific reproductive enhancers such as premature menopause/POI and hypertensive/metabolic pregnancy disorders when contextualizing MHT)*.
  * **Patient preferences and treatment goals.**
* Consider **both 10-year and 30-year risk**, particularly in younger midlife adults (`ages 30–59`), where 30-year risk (`≥10%`) identifies substantial lifetime atherosclerotic burden despite low 10-year risk.
* Reassess risk longitudinally as age, blood pressure, lipids, glycemic status, or smoking change, and evaluate secondary causes of dyslipidemia when appropriate.

---

## 4. Guideline Management Thresholds Linked to PREVENT

### A. Hypertension Management (`2025 AHA/ACC Guideline` — Based on `10-Year Total CVD Risk`)
* **`BP ≥ 130/80 mmHg` (Stage 1 Hypertension):**
  * **Start antihypertensive medication** if **10-year Total CVD risk is `≥ 7.5%`**, OR if **clinical CVD, diabetes, or CKD** is present.
  * If **10-year Total CVD risk is `< 7.5%`**, trial **lifestyle modification for `3–6 months`** first; initiate medication if BP remains `≥130/80 mmHg`.
* **`BP ≥ 140/90 mmHg` (Stage 2 Hypertension):** Treat **all adults** pharmacologically + lifestyle regardless of calculated CVD risk.

### B. Primary Prevention & Statin Thresholds (`2026 ACC/AHA Guideline` — Based on `10-Year PREVENT-ASCVD Risk`)

| 2026 ACC/AHA Risk Category | `10-Year PREVENT-ASCVD` Risk | Primary Prevention & Lipid Target Strategy |
| :--- | :--- | :--- |
| **Low Risk** | **`< 3%`** | Health behavior counseling. If **`LDL-C 160–189 mg/dL`** OR **`30-year ASCVD risk ≥ 10%`**, consider **moderate-intensity statin** |
| **Borderline Risk** | **`3% to < 5%`** | Health behavior counseling + **risk-benefit discussion** incorporating risk enhancers. If moderate-intensity statin started, target **`≥30%` LDL-C reduction** with **`LDL-C < 100 mg/dL`** and **`non-HDL-C < 130 mg/dL`**; consider **`CAC` score** if uncertain |
| **Intermediate Risk** | **`5% to < 10%`** | Health behavior counseling + **start moderate- to high-intensity statin**, targeting **`≥30%` LDL-C reduction**, **`LDL-C < 100 mg/dL`**, and **`non-HDL-C < 130 mg/dL`**; consider **`CAC` score** if treatment/intensity remains uncertain |
| **High Risk** | **`≥ 10%`** | Health behavior counseling + **start high-intensity statin**, targeting **`≥50%` LDL-C reduction**, **`LDL-C < 70 mg/dL`**, and **`non-HDL-C < 100 mg/dL`**; add non-statin agents (`ezetimibe`, `PCSK9i`, `bempedoic acid`) if goals not met on maximally tolerated statin |

* **Groups Recommended Lipid-Lowering Therapy Regardless of Calculated PREVENT Score:**
  1. Established clinical `ASCVD`.
  2. Severe primary hypercholesterolemia (**`LDL-C ≥ 190 mg/dL`**).
  3. Adults **aged `40–75`** with **diabetes mellitus**, **`CKD` stage `≥3`**, or **`HIV`** on stable combination antiretroviral therapy.

### C. Statin Therapy Intensity Reference Table

| Statin Intensity | Daily Average `LDL-C` Lowering | Regimen Options |
| :--- | :--- | :--- |
| **High-intensity** | **`≥ 50%`** | `Atorvastatin 40–80 mg` · `Rosuvastatin 20–40 mg` |
| **Moderate-intensity** | **`30% to < 50%`** | `Atorvastatin 10–20 mg` · `Rosuvastatin 5–10 mg` · `Simvastatin 20–40 mg` · `Pravastatin 40–80 mg` · `Lovastatin 40–80 mg` · `Fluvastatin XL 80 mg` · `Fluvastatin 40 mg BID` · `Pitavastatin 1–4 mg` |
| **Low-intensity** | **`< 30%`** | `Simvastatin 10 mg` · `Pravastatin 10–20 mg` · `Lovastatin 20 mg` · `Fluvastatin 20–40 mg` · `Pitavastatin 1 mg` |
