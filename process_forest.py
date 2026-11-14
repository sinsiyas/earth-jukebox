
import pandas as pd
import os

# World Bank alternative: Our World in Data
url = "https://ourworldindata.org/grapher/forest-area-km.csv?v=1&csvType=full&useColumnShortNames=false"

print("Downloading Forest Data...")

try:
    df = pd.read_csv(url)

    print("Available columns:", df.columns.tolist())

    # Find the forest area column automatically
    forest_columns = [
        col for col in df.columns
        if "forest" in col.lower()
    ]

    if not forest_columns:
        raise ValueError("Forest area column not found!")

    forest_col = forest_columns[0]

    # Select global data
    world = df[
        df["Entity"].astype(str).str.lower() == "world"
    ].copy()

    if world.empty:
        raise ValueError("Global World data not found!")

    # Select 2020 onwards
    world = world[world["Year"] >= 2020]

    world = world[["Year", forest_col]].copy()

    world.columns = ["Year", "Forest_Area_km2"]

    # Create output folder
    os.makedirs("data/forest", exist_ok=True)

    # Save CSV
    output_file = "data/forest/forest_data.csv"
    world.to_csv(output_file, index=False)

    print("\nForest data created successfully!")
    print(world.to_string(index=False))
    print("\nSaved at:", output_file)

except Exception as e:
    print("\nERROR:", e)
