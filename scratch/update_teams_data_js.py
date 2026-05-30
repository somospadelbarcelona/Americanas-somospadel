import json
import os
import re

auto_js_path = "scraper/teams_data_auto.js"
target_js_path = "js/modules/teams/teams_data.js"

print("Starting local teams_data.js update...")
if not os.path.exists(auto_js_path):
    print(f"Error: {auto_js_path} does not exist yet. Run the bot first.")
    exit(1)

try:
    with open(auto_js_path, "r", encoding="utf-8") as f:
        auto_content = f.read()

    # Find the JSON array inside teams_data_auto.js
    json_match = re.search(r'window\.ExtractedTeamsData\s*=\s*(\[[\s\S]*?\])\s*;', auto_content)
    if not json_match:
        print("Error: Could not find window.ExtractedTeamsData in auto-generated JS.")
        exit(1)
        
    raw_json_str = json_match.group(1)
    
    # Let's make sure it's valid JSON (just to be safe)
    teams_data = json.loads(raw_json_str)
    print(f"Successfully loaded {len(teams_data)} teams from auto-generated data.")

    # Create the new content for teams_data.js
    new_content = "/**\n * teams_data.js - Centralized Club Teams Data\n * Reconstrucción Maestra (Full Standings + Schedules) - Auto-updated\n */\n"
    new_content += "(function () {\n    window.ClubTeamsData = "
    new_content += json.dumps(teams_data, ensure_ascii=False, indent=4)
    new_content += ";\n})();\n"

    # Write to target path
    with open(target_js_path, "w", encoding="utf-8") as f:
        f.write(new_content)
        
    print(f"Successfully updated {target_js_path} with fresh data!")
except Exception as e:
    print(f"Error updating teams_data.js: {e}")
