import numpy as np
import pandas as pd
from pathlib import Path

DATA_FOLDER = Path("data/ocean")
results = []

latitudes = np.arange(-88, 90, 2)
weights = np.cos(np.deg2rad(latitudes))

for year in range(2020, 2026):
    file_path = DATA_FOLDER / f"ersst.v5.{year}.asc"

    print(f"Processing {year}...")

    monthly_averages = []

    with open(file_path, "r") as file:
        lines = [line.rstrip("\n") for line in file if line.strip()]

    # Each month contains 180 rows of 89 fixed-width values
    for month_start in range(0, len(lines), 180):
        month_lines = lines[month_start:month_start + 180]

        if len(month_lines) != 180:
            break

        grid = []

        for line in month_lines:
            row = [
                int(line[i:i+6])
                for i in range(0, 89 * 6, 6)
            ]
            grid.append(row)

        data = np.array(grid, dtype=float)

        # Convert hundredths of Celsius to Celsius
        data = data / 100.0

        # Remove missing values
        data[data <= -9] = np.nan

        # Latitude-weighted global mean
        valid = np.isfinite(data)
        weighted_values = np.where(valid, data * weights, 0)
        weighted_weights = np.where(valid, weights, 0)

        denominator = weighted_weights.sum()

        if denominator > 0:
            monthly_average = (
                weighted_values.sum() / denominator
            )
            monthly_averages.append(monthly_average)

    if monthly_averages:
        annual_average = np.mean(monthly_averages)

        results.append({
            "Year": year,
            "Ocean_Temperature": round(float(annual_average), 3)
        })

        print(
            year,
            "Average:", round(float(annual_average), 3),
            "°C | Months:", len(monthly_averages)
        )

output = pd.DataFrame(results)
output.to_csv("data/ocean_temperature.csv", index=False)

print("\nCorrected Ocean data created!")
print(output)