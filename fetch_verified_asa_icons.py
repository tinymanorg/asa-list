import json
from pathlib import Path

import requests

current_dir = Path(__file__).parent
build_directory = current_dir / "build"
assets_file_path = build_directory / "assets.json"
icons_file_path = build_directory / "icons.json"

with open(assets_file_path) as file:
    assets_data = json.load(file)

with open(icons_file_path) as file:
    icons_data = json.load(file)


def process_assets(assets):
    for asset in assets:
        asset_id = str(asset["asset_id"])
        if asset_id not in assets_data and asset["logo"]:
            logo_url = asset["logo"] + "?format=png&height=256&width=256"

            icons_data[asset_id] = logo_url

            assets_data[asset_id] = {
                "id": asset_id,
                "name": asset["name"],
                "unit_name": asset["unit_name"],
                "url": "",
                "decimals": asset["fraction_decimals"],
                "total_amount": asset["total"],
                "deleted": asset["is_deleted"],
                "logo": {
                    "png": logo_url,
                    "svg": "",
                },
            }


response = requests.get("https://api.perawallet.app/v1/assets/?status=verified").json()
# Check and process the first page
if "results" in response:
    process_assets(response["results"])

# Iterate over the next pages
while "next" in response and response["next"]:
    response = requests.get(response["next"]).json()
    if "results" in response:
        process_assets(response["results"])


with open(assets_file_path, 'w') as file:
    json.dump(assets_data, file)

with open(icons_file_path, 'w') as file:
    json.dump(icons_data, file)
