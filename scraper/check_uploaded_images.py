import os
import glob

artifacts_dir = r'C:\Users\acoscolin\.gemini\antigravity\brain\4e03ea48-6d25-4b4f-81dc-c105e0e25ca2\.user_uploaded'
files = glob.glob(os.path.join(artifacts_dir, '*'))
print(f"Found {len(files)} files in .user_uploaded:")
for f in files:
    print(f, "Size:", os.path.getsize(f))
