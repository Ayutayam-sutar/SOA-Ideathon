TRAINING-READY DATA PACKAGE

RAW DATA:
The original 10 CSVs are untouched. This folder contains cleaned/derived copies.

IDENTITY NORMALIZATION:
- Vehicle: TRK + 4-digit numeric suffix. Example TRK008 -> TRK0008.
- Route: R + 4-digit numeric suffix. Example R082 -> R0082.
- Historical shipment: HS + 6-digit numeric suffix. Example S01467 -> HS001467.
- Transport mode is lowercased.
- Raw IDs are retained in *_raw columns.

TARGETS:
- delay_training_ready.csv uses historical_shipments.delayed.
- spoilage_training_ready.csv uses historical_shipments.spoiled.

LEAKAGE CONTROL:
Do NOT train with post-outcome variables such as:
- delay_minutes
- actual_transit_hours
- temperature_excursion_minutes
- future temperature observations from the same shipment
- damage outcomes
- post-trip cost/outcome measurements

Temperature aggregates are provided as AUDIT ONLY because they describe what happened during the shipment. They are not safe live prediction inputs.

HUB ISSUE:
historical_transfer_handling contains HUB01-HUB20 while the hub master contains H001-H015.
HUB01-HUB15 are numerically mappable only if the team confirms that convention.
HUB16-HUB20 have no matching master row and remain unmapped.

TARGET QUALITY:
Keep delayed/spoiled as the supplied targets. Do not overwrite them using delay_minutes or temperature observations.
delay_history.on_time should NOT be the primary delay target because it conflicts with delay_hours in some rows and is extremely imbalanced.

EVALUATION:
The historical shipment file has no explicit shipment date, so the first prototype should use a stratified train/test split. For production, add a true event date and use a time-based split.

NEXT STEP:
Train preprocessing pipelines with imputation + one-hot encoding + model inside one sklearn Pipeline, so the exact same transformations are used during live inference.
