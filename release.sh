#!/bin/bash

set -e

MANIFEST="manifest.json"
ZIP_NAME="bogleheads.zip"
FILES_TO_ZIP="manifest.json content.js styles.css icons/icon16.png icons/icon48.png icons/icon128.png"

# Check for required argument
if [ -z "$1" ]; then
    echo "Error: Release type required."
    echo "Usage: ./release.sh <major|minor|patch>"
    echo "  major - Bump major version (1.0.0 -> 2.0.0)"
    echo "  minor - Bump minor version (1.0.0 -> 1.1.0)"
    echo "  patch - Bump patch version (1.0.0 -> 1.0.1)"
    exit 1
fi

RELEASE_TYPE="$1"

if [[ "$RELEASE_TYPE" != "major" && "$RELEASE_TYPE" != "minor" && "$RELEASE_TYPE" != "patch" ]]; then
    echo "Error: Invalid release type '$RELEASE_TYPE'"
    echo "Must be one of: major, minor, patch"
    exit 1
fi

# Verify all required files exist before proceeding
for file in $FILES_TO_ZIP; do
    if [ ! -f "$file" ]; then
        echo "Error: Missing required file: $file"
        exit 1
    fi
done

# Get current version from manifest.json
if command -v jq &> /dev/null; then
    CURRENT_VERSION=$(jq -r '.version' "$MANIFEST")
else
    CURRENT_VERSION=$(grep '"version"' "$MANIFEST" | sed 's/.*"version": *"\([^"]*\)".*/\1/')
fi

if [ -z "$CURRENT_VERSION" ]; then
    echo "Error: Could not extract version from $MANIFEST"
    exit 1
fi

echo "Current version: $CURRENT_VERSION"

# Parse version components (major.minor or major.minor.patch)
IFS='.' read -ra VERSION_PARTS <<< "$CURRENT_VERSION"
MAJOR=${VERSION_PARTS[0]:-1}
MINOR=${VERSION_PARTS[1]:-0}
PATCH=${VERSION_PARTS[2]:-0}

# Bump version based on release type
case "$RELEASE_TYPE" in
    major)
        MAJOR=$((MAJOR + 1))
        MINOR=0
        PATCH=0
        ;;
    minor)
        MINOR=$((MINOR + 1))
        PATCH=0
        ;;
    patch)
        PATCH=$((PATCH + 1))
        ;;
esac

NEW_VERSION="$MAJOR.$MINOR.$PATCH"

echo "New version: $NEW_VERSION"

# Update version in manifest.json (cross-platform sed)
if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' "s/\"version\": *\"$CURRENT_VERSION\"/\"version\": \"$NEW_VERSION\"/" "$MANIFEST"
else
    sed -i "s/\"version\": *\"$CURRENT_VERSION\"/\"version\": \"$NEW_VERSION\"/" "$MANIFEST"
fi

# Verify the version was updated
if command -v jq &> /dev/null; then
    UPDATED_VERSION=$(jq -r '.version' "$MANIFEST")
else
    UPDATED_VERSION=$(grep '"version"' "$MANIFEST" | sed 's/.*"version": *"\([^"]*\)".*/\1/')
fi

if [ "$UPDATED_VERSION" != "$NEW_VERSION" ]; then
    echo "Error: Failed to update version in $MANIFEST"
    echo "Expected: $NEW_VERSION, Found: $UPDATED_VERSION"
    exit 1
fi

echo "Updated $MANIFEST"

# Remove old zip if it exists
rm -f "$ZIP_NAME"

# Create the zip file
zip -r "$ZIP_NAME" $FILES_TO_ZIP

echo "Created $ZIP_NAME with version $NEW_VERSION"
