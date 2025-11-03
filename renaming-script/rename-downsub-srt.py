import os
import re
import shutil
from collections import defaultdict

# === Language mapping ===
language_codes = {
    "arabic": "ar",
    "spanish": "es",
    "english": "en",
    "chinese (simplified)": "zh-Hans",
    "chinese (traditional)": "zh-Hant",
    "portuguese": "pt",
    "korean": "ko",
    "malay": "ms",
    "indonesian": "id",
    "thai": "th",
    "vietnamese": "vi",
    "japanese": "ja"
}

# === User inputs ===
input_dir = input("Enter the input directory path: ").strip('"')
title = input("Enter the title: ").strip()

print("\nSelect grouping option:")
print("  1️⃣  Both (Create 'Group by language' & 'Group by episode')")
print("  2️⃣  Language only")
print("  3️⃣  Episode only")
choice = input("Enter your choice (1/2/3): ").strip()

if choice not in ["1", "2", "3"]:
    print("❌ Invalid choice. Please enter 1, 2, or 3.")
    exit(1)

print(f"\n📂 Input directory: {input_dir}")
print(f"🎬 Title: {title}")

# === Core processor ===
def process_grouping(input_dir, title, group_choice, output_dir=None, collect_stats=False):
    """
    Processes and groups .srt files.
    Returns (processed_count, skipped_count, stats_dict)
    """
    group_dir_name = f"Group by {group_choice}"
    group_dir = output_dir if output_dir else os.path.join(input_dir, group_dir_name)
    os.makedirs(group_dir, exist_ok=True)
    print(f"\n📁 Created/Verified folder: {group_dir}")

    # Stage 1: Copy .srt files
    print("\n📤 Stage 1: Copying .srt files...")
    copied_count = 0
    for file in os.listdir(input_dir):
        if file.lower().endswith(".srt"):
            shutil.copy2(os.path.join(input_dir, file), group_dir)
            copied_count += 1
            print(f"  ✅ Copied: {file}")
    print(f"📊 Total copied: {copied_count}")

    # Stage 2: Process
    print(f"\n⚙ Stage 2: Processing files in '{group_dir_name}'...")
    stats = defaultdict(int)
    processed_count = 0
    skipped_count = 0

    for file in sorted(os.listdir(group_dir)):
        if not file.lower().endswith(".srt"):
            continue

        print(f"\n🔍 Processing: {file}")

        lang_match = re.match(r"\[(.+?)\]", file)
        if not lang_match:
            print("  ⚠ Skipped — could not extract language.")
            skipped_count += 1
            continue
        lang_full = lang_match.group(1).strip()
        lang_key = lang_full.lower()
        lang_code = language_codes.get(lang_key)
        if not lang_code:
            print(f"  ⚠ Skipped — language not in mapping: {lang_full}")
            skipped_count += 1
            continue

        ep_match = re.search(r"EP(\d+)", file, re.IGNORECASE)
        if not ep_match:
            print("  ⚠ Skipped — could not extract episode number.")
            skipped_count += 1
            continue
        episode_num = ep_match.group(1).zfill(2)

        # Folder naming
        folder_name = f"{lang_full} - {lang_code}" if group_choice == "language" else f"Episode {episode_num}"
        folder_path = os.path.join(group_dir, folder_name)
        os.makedirs(folder_path, exist_ok=True)

        new_filename = f"{title} - {episode_num}.{lang_code}.srt"
        shutil.move(os.path.join(group_dir, file), os.path.join(folder_path, new_filename))
        print(f"  ✏ Renamed + moved → {folder_name}/{new_filename}")

        stats[folder_name] += 1
        processed_count += 1

    # Stage 3/4 cleanup (only if processing inside same folder)
    if not output_dir:
        removed_count = 0
        print("\n🧹 Stage 3: Removing original .srt files from input directory...")
        for file in os.listdir(input_dir):
            if file.lower().endswith(".srt"):
                os.remove(os.path.join(input_dir, file))
                removed_count += 1
                print(f"  🗑 Deleted: {file}")

        print("\n📦 Stage 4: Moving processed folders back to input directory...")
        for item in os.listdir(group_dir):
            shutil.move(os.path.join(group_dir, item), os.path.join(input_dir, item))
            print(f"  📁 Moved: {item}")

        os.rmdir(group_dir)
        print(f"  🗑 Removed empty '{group_dir_name}' folder")

        # Summary
        print("\n📊 Processing Summary:")
        print(f"  ✅ Processed: {processed_count}")
        print(f"  ⚠ Skipped: {skipped_count}")
        print(f"  🗑 Originals deleted: {removed_count}")
        print(f"\n📌 Per-{group_choice} counts:")
        for key, count in sorted(stats.items()):
            print(f"   - {key}: {count} file(s)")
        print("\n✅ Completed successfully for this mode!")

    if collect_stats:
        return processed_count, skipped_count, stats
    return None


# === Mode logic ===
if choice == "1":
    print("\n🌀 Option 1 selected: Creating both folders inside input directory...\n")

    lang_dir = os.path.join(input_dir, "Group by language")
    ep_dir = os.path.join(input_dir, "Group by episode")
    os.makedirs(lang_dir, exist_ok=True)
    os.makedirs(ep_dir, exist_ok=True)

    # Process both independently and collect stats
    lang_processed, lang_skipped, lang_stats = process_grouping(
        input_dir, title, "language", output_dir=lang_dir, collect_stats=True
    )
    ep_processed, ep_skipped, ep_stats = process_grouping(
        input_dir, title, "episode", output_dir=ep_dir, collect_stats=True
    )

    # Delete originals after both are done
    print("\n🧹 Removing original .srt files from input directory...")
    deleted_count = 0
    for file in os.listdir(input_dir):
        if file.lower().endswith(".srt"):
            os.remove(os.path.join(input_dir, file))
            deleted_count += 1
            print(f"  🗑 Deleted: {file}")

    # Combined Summary
    print("\n📊 Combined Processing Summary:")
    print(f"  ✅ Language Processed: {lang_processed}")
    print(f"  ✅ Episode Processed: {ep_processed}")
    print(f"  ⚠ Language Skipped: {lang_skipped}")
    print(f"  ⚠ Episode Skipped: {ep_skipped}")
    print(f"  🗑 Originals deleted: {deleted_count}")

    print("\n📌 Per-language counts:")
    for key, count in sorted(lang_stats.items()):
        print(f"   - {key}: {count} file(s)")

    print("\n📌 Per-episode counts:")
    for key, count in sorted(ep_stats.items()):
        print(f"   - {key}: {count} file(s)")

    print("\n✅ Completed successfully for both groupings!")

elif choice == "2":
    print("\n🌐 Option 2 selected: Group by language only.")
    process_grouping(input_dir, title, "language")

else:
    print("\n🎞 Option 3 selected: Group by episode only.")
    process_grouping(input_dir, title, "episode")

print("\n🎉 All selected operations completed successfully!")
