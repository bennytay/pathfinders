#!/usr/bin/env python3
"""Generate the web demo's fixture layer from the iOS demo.

Circle's web UI is deliberately a browser-native implementation, but its demo
content, assets, and palette must stay identical to the SwiftUI source. This
script is the only supported way to refresh those generated web files.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import shutil
import sys
import time
from datetime import datetime
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
IOS = ROOT / "ios" / "CircleDemo"
WEB = ROOT / "web"
OUTPUT_JS = WEB / "generated" / "ios-demo-data.js"
OUTPUT_CSS = WEB / "generated" / "ios-demo-palette.css"
WEB_IMAGES = WEB / "public" / "images"
SOURCE_FILES = [
    IOS / "CircleStore.swift",
    IOS / "CircleModels.swift",
    IOS / "CirclePalette.swift",
    IOS / "CircleRootView.swift",
]


def source_fingerprint() -> str:
    digest = hashlib.sha256()
    for path in SOURCE_FILES:
        digest.update(path.relative_to(ROOT).as_posix().encode())
        digest.update(path.read_bytes())
    return digest.hexdigest()


def watch_fingerprint() -> str:
    """Include binary assets so a changed iOS photo refreshes the web copy too."""
    digest = hashlib.sha256(source_fingerprint().encode())
    for path in sorted((IOS / "Assets.xcassets").glob("*/*")):
        if path.is_file() and path.suffix.lower() in {".jpg", ".jpeg", ".png"}:
            digest.update(path.name.encode())
            digest.update(path.read_bytes())
    return digest.hexdigest()


def balanced(source: str, start: int, opening: str, closing: str) -> tuple[str, int]:
    """Return the delimited content at start, correctly skipping Swift strings."""
    if source[start] != opening:
        raise ValueError(f"Expected {opening!r} at {start}")
    depth, quote, escaped = 0, False, False
    for index in range(start, len(source)):
        char = source[index]
        if quote:
            if escaped:
                escaped = False
            elif char == "\\":
                escaped = True
            elif char == '"':
                quote = False
            continue
        if char == '"':
            quote = True
        elif char == opening:
            depth += 1
        elif char == closing:
            depth -= 1
            if depth == 0:
                return source[start + 1 : index], index + 1
    raise ValueError(f"Unclosed {opening!r}")


def fixture_list(source: str, name: str) -> str:
    match = re.search(rf"static let {re.escape(name)}:\s*[^=]+?=\s*\[", source)
    if not match:
        raise ValueError(f"Could not find {name}")
    opening = source.index("[", source.index("=", match.start()))
    return balanced(source, opening, "[", "]")[0]


def calls(content: str, name: str) -> list[str]:
    result, cursor = [], 0
    token = f"{name}("
    while (start := content.find(token, cursor)) != -1:
        args, cursor = balanced(content, start + len(name), "(", ")")
        result.append(args)
    return result


def string_field(args: str, name: str) -> str:
    match = re.search(rf'{re.escape(name)}:\s*"((?:\\.|[^"\\])*)"', args)
    if not match:
        raise ValueError(f"Missing string field {name} in {args}")
    return json.loads(f'"{match.group(1)}"')


def number_field(args: str, name: str) -> int:
    match = re.search(rf"{re.escape(name)}:\s*(\d+)", args)
    if not match:
        raise ValueError(f"Missing number field {name} in {args}")
    return int(match.group(1))


def decimal_field(args: str, name: str) -> float:
    match = re.search(rf"{re.escape(name)}:\s*(-?[\d.]+)", args)
    if not match:
        raise ValueError(f"Missing decimal field {name} in {args}")
    return float(match.group(1))


def array_field(args: str, name: str) -> list[str]:
    match = re.search(rf"{re.escape(name)}:\s*\[", args)
    if not match:
        raise ValueError(f"Missing array field {name} in {args}")
    values, _ = balanced(args, args.index("[", match.start()), "[", "]")
    return [json.loads(f'"{value}"') for value in re.findall(r'"((?:\\.|[^"\\])*)"', values)]


def asset_index() -> dict[str, str]:
    assets: dict[str, str] = {}
    for source in (IOS / "Assets.xcassets").glob("*/*"):
        if source.suffix.lower() in {".jpg", ".jpeg", ".png"}:
            assets[source.stem] = source.name
    return assets


def parse_store() -> dict[str, object]:
    source = (IOS / "CircleStore.swift").read_text()
    assets = asset_index()

    friends = []
    for args in calls(fixture_list(source, "demoFriends"), "Friend"):
        image_name = string_field(args, "imageName")
        friends.append({
            "id": string_field(args, "id"),
            "name": string_field(args, "displayName"),
            "interests": array_field(args, "interests"),
            "personality": string_field(args, "personality"),
            "photo": assets[image_name],
        })

    notes = dict(re.findall(r'"((?:\\.|[^"\\])*)"\s*:\s*"((?:\\.|[^"\\])*)"', fixture_list(source, "demoPersonalNotes")))
    notes = {json.loads(f'"{key}"'): json.loads(f'"{value}"') for key, value in notes.items()}

    activities = []
    for args in calls(fixture_list(source, "demoActivities"), "Activity"):
        identifier = string_field(args, "id")
        activities.append({
            "id": identifier,
            "title": string_field(args, "title"),
            "details": string_field(args, "details"),
            "location": string_field(args, "location"),
            "tags": array_field(args, "tags"),
            "category": re.search(r"category:\s*\.([A-Za-z]+)", args).group(1),
            "photo": assets[identifier],
        })

    events = []
    for args in calls(fixture_list(source, "demoCalendarEvents"), "CalendarEvent"):
        events.append({
            "title": string_field(args, "title"),
            "day": number_field(args, "day"),
            "start": number_field(args, "start"),
            "duration": number_field(args, "duration"),
            "tone": re.search(r"tone:\s*\.([A-Za-z]+)", args).group(1),
        })

    map_clusters = []
    for args in calls(fixture_list(source, "demoMapClusters"), "MapCluster"):
        map_clusters.append({
            "id": string_field(args, "id"),
            "name": string_field(args, "name"),
            "latitude": decimal_field(args, "latitude"),
            "longitude": decimal_field(args, "longitude"),
            "activityIds": array_field(args, "activityIDs"),
        })

    profile = {}
    for key in ("profileName", "profileImageName", "profileNeighbourhood", "profileBio"):
        match = re.search(rf'@Published var {key}\s*=\s*"((?:\\.|[^"\\])*)"', source)
        if match:
            profile[key] = json.loads(f'"{match.group(1)}"')

    highlights = []
    for args in calls(fixture_list(source, "demoHighlights"), "Highlight"):
        image_name = string_field(args, "imageName")
        iso_date = re.search(r'capturedAt:\s*isoDate\("([^"]+)"\)', args).group(1)
        captured = datetime.fromisoformat(iso_date.replace("Z", "+00:00"))
        highlights.append({
            "id": string_field(args, "id"),
            "photo": assets[image_name],
            "caption": string_field(args, "caption"),
            "place": string_field(args, "place"),
            "date": f"{captured.strftime('%b')} {captured.day}, {captured.year}",
            "friendIds": array_field(args, "friendIds"),
        })
    return {
        "friends": friends,
        "notes": notes,
        "activities": activities,
        "calendarEvents": events,
        "mapClusters": map_clusters,
        "profile": profile,
        "highlights": highlights,
    }


def parse_palette() -> dict[str, str]:
    source = (IOS / "CirclePalette.swift").read_text()
    palette: dict[str, str] = {}
    for name, red, green, blue in re.findall(
        r"static let (\w+) = Color\(red: ([\d.]+), green: ([\d.]+), blue: ([\d.]+)\)", source
    ):
        css_name = re.sub(r"(?<!^)([A-Z])", r"-\1", name).lower()
        palette[css_name] = f"rgb({round(float(red) * 255)} {round(float(green) * 255)} {round(float(blue) * 255)})"
    return palette


def generated_js(data: dict[str, object], fingerprint: str) -> str:
    payload = json.dumps(data, indent=2, ensure_ascii=False)
    return (
        "// Generated by scripts/sync_ios_demo.py. Do not edit by hand.\n"
        f"// iOS source fingerprint: {fingerprint}\n"
        f"const fixtures = {payload};\n\n"
        "export const { friends, notes, activities, calendarEvents, mapClusters, profile, highlights } = fixtures;\n"
    )


def generated_css(palette: dict[str, str], fingerprint: str) -> str:
    variables = "\n".join(f"  --{name}: {color};" for name, color in palette.items())
    return (
        "/* Generated by scripts/sync_ios_demo.py. Do not edit by hand. */\n"
        f"/* iOS source fingerprint: {fingerprint} */\n"
        f":root {{\n{variables}\n}}\n"
    )


def write_or_compare(path: Path, content: str, check: bool) -> bool:
    existing = path.read_text() if path.exists() else None
    if existing == content:
        return False
    if check:
        print(f"Stale generated file: {path.relative_to(ROOT)}")
        return True
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content)
    print(f"Updated {path.relative_to(ROOT)}")
    return True


def sync_assets(check: bool) -> bool:
    sources = {source.name: source for source in (IOS / "Assets.xcassets").glob("*/*") if source.suffix.lower() in {".jpg", ".jpeg", ".png"}}
    current = {path.name: path for path in WEB_IMAGES.glob("*") if path.is_file()}
    stale = False
    for name, source in sources.items():
        target = WEB_IMAGES / name
        if not target.exists() or source.read_bytes() != target.read_bytes():
            stale = True
            if check:
                print(f"Stale generated asset: web/public/images/{name}")
            else:
                WEB_IMAGES.mkdir(parents=True, exist_ok=True)
                shutil.copy2(source, target)
                print(f"Updated web/public/images/{name}")
    for name, target in current.items():
        if name not in sources:
            stale = True
            if check:
                print(f"Obsolete generated asset: web/public/images/{name}")
            else:
                target.unlink()
                print(f"Removed obsolete generated asset: web/public/images/{name}")
    return stale


def sync(check: bool) -> bool:
    fingerprint = source_fingerprint()
    stale = write_or_compare(OUTPUT_JS, generated_js(parse_store(), fingerprint), check)
    stale |= write_or_compare(OUTPUT_CSS, generated_css(parse_palette(), fingerprint), check)
    stale |= sync_assets(check)
    return stale


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="Fail rather than updating stale generated files.")
    parser.add_argument("--watch", action="store_true", help="Refresh generated web files whenever the iOS demo changes.")
    args = parser.parse_args()
    if args.check and args.watch:
        parser.error("--check and --watch cannot be used together")
    if args.watch:
        sync(check=False)
        previous = watch_fingerprint()
        print("Watching ios/CircleDemo for web-demo changes…")
        try:
            while True:
                time.sleep(1)
                current = watch_fingerprint()
                if current != previous:
                    previous = current
                    sync(check=False)
        except KeyboardInterrupt:
            return 0
    stale = sync(check=args.check)
    if args.check and stale:
        print("Run: python3 scripts/sync_ios_demo.py", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
