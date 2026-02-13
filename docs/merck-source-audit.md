# Merck Source Audit (NAVLE Tools)

Last reviewed: February 13, 2026

This file tracks the Merck Veterinary Manual source baseline used by the tool pages in `tools/`.

## Tool coverage

- `tools/index.html`
  - https://www.merckvetmanual.com/
  - https://www.merckvetmanual.com/pages-with-widgets/clinical-calculators

- `tools/dose-calculator.html`
  - https://www.merckvetmanual.com/pharmacology
  - https://www.merckvetmanual.com/pages-with-widgets/clinical-calculators

- `tools/fluid-calculator.html`
  - https://www.merckvetmanual.com/multimedia/table/maintenance-fluid-plan-in-animals
  - https://www.merckvetmanual.com/multimedia/table/fluid-resuscitation-treatment-plan-for-small-animals

- `tools/unit-converter.html`
  - https://www.merckvetmanual.com/multimedia/table/conversion-factors-for-serum-biochemical-tests
  - https://www.merckvetmanual.com/multimedia/table/conversion-factors-for-hematologic-tests

- `tools/emergency-drug-chart.html`
  - https://www.merckvetmanual.com/emergency-medicine-and-critical-care/cardiopulmonary-cerebral-resuscitation/cardiopulmonary-resuscitation-in-small-animals
  - https://www.merckvetmanual.com/pages-with-widgets/clinical-calculators

- `tools/cri-calculator.html`
  - https://www.merckvetmanual.com/critical-care-medicine-and-analgesia/overview-of-local-and-regional-analgesic-techniques/local-and-regional-analgesic-techniques-in-small-animals
  - https://www.merckvetmanual.com/pages-with-widgets/clinical-calculators

- `tools/acid-base-electrolyte.html`
  - https://www.merckvetmanual.com/multimedia/table/fluid-resuscitation-treatment-plan-for-small-animals
  - https://www.merckvetmanual.com/emergency-medicine-and-critical-care/monitoring-critically-ill-patients/the-rule-of-20-in-small-animal-critical-care

- `tools/transfusion-helper.html`
  - https://www.merckvetmanual.com/dog-owners/blood-disorders-of-dogs-and-cats/blood-transfusions-in-dogs-and-cats

- `tools/phone-triage.html`
  - https://www.merckvetmanual.com/emergency-medicine-and-critical-care/initial-triage-and-management-of-the-emergency-patient/initial-triage-and-management-of-the-emergency-patient
  - https://www.merckvetmanual.com/emergency-medicine-and-critical-care/monitoring-critically-ill-patients/the-rule-of-20-in-small-animal-critical-care

- `tools/er-algorithms.html`
  - https://www.merckvetmanual.com/emergency-medicine-and-critical-care/initial-triage-and-management-of-the-emergency-patient/initial-triage-and-management-of-the-emergency-patient
  - https://www.merckvetmanual.com/emergency-medicine-and-critical-care/cardiopulmonary-cerebral-resuscitation/cardiopulmonary-resuscitation-in-small-animals

- `tools/dose-label-generator.html`
  - https://www.merckvetmanual.com/pharmacology

- `tools/parasite-control-reference.html`
  - https://www.merckvetmanual.com/circulatory-system/heartworm-disease/heartworm-disease-in-dogs-cats-and-ferrets
  - https://www.merckvetmanual.com/digestive-system/gastrointestinal-parasites-of-small-animals
  - https://www.merckvetmanual.com/integumentary-system/fleas-and-flea-allergy-dermatitis/fleas-in-dogs-and-cats

- `tools/discharge-generator.html`
  - https://www.merckvetmanual.com/emergency-medicine-and-critical-care/initial-triage-and-management-of-the-emergency-patient/initial-triage-and-management-of-the-emergency-patient
  - https://www.merckvetmanual.com/pharmacology

- `tools/insulin-cri-planner.html` (draft)
  - https://www.merckvetmanual.com/endocrine-system/the-pancreas/diabetes-mellitus-in-animals

- `tools/anesthesia-risk-checklist.html` (draft)
  - https://www.merckvetmanual.com/multimedia/table/anesthetic-monitoring-guidelines

- `tools/renal-dose-adjuster.html` (draft)
  - https://www.merckvetmanual.com/urinary-system/renal-disease-in-small-animals/chronic-kidney-disease-in-small-animals

- `tools/sepsis-bundle-planner.html` (draft)
  - https://www.merckvetmanual.com/multimedia/table/the-rule-of-20

## Formula/data updates from this audit

- `assets/js/acid-base-electrolyte.js`
  - Updated estimated osmolality formula to `2 x Na + glucose/18 + BUN/2.8`.

- `assets/js/emergency-drug-chart.js`
  - Updated regular insulin hyperkalemia default dose from `0.1 U/kg` to `0.2 U/kg` and added dextrose co-administration reminder in the standard dose text.
  - Added printable chart output and editable concentration inputs with reset-to-default support.
