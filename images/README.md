# Images Folder

This folder contains images used by the bot.

## Structure

```
images/
├── fish/           - All fish images
├── README.md       - This file
└── .gitkeep        - Git tracking
```

## Fish Images

Fish images are displayed when catching Epic, Legendary, or Mythical fish. All fish images go in the `fish/` subfolder.

### Naming Convention

Fish image files should match the fish name with hyphens for spaces:
- **Example**: "Blue Marlin" → `Blue-Marlin.png`
- **Example**: "Giant Yellowfin Tuna" → `Giant-Yellowfin-Tuna.png`
- **Example**: "Bakunawa" → `Bakunawa.png`

### Fish List

**Epic Fish (10 species)**:
- Blue-Marlin.png
- Black-Marlin.png
- Swordfish.png
- Giant-Yellowfin-Tuna.png
- Bluefin-Trevally.png
- Oceanic-Whitetip-Shark.png
- Thresher-Shark.png
- Whale-Shark.png
- Reef-Manta-Ray.png
- Giant-Freshwater-Stingray.png

**Legendary Fish (10 species)**:
- Coelacanth.png
- Oarfish.png
- Goblin-Shark.png
- Megamouth-Shark.png
- Ocean-Sunfish.png
- Frilled-Shark.png ⭐ NEW
- Giant-Isopo.png ⭐ NEW
- Glowing-anglerfish.png ⭐ NEW (Abyssal Anglerfish)
- Giant-Squid.png ⭐ NEW
- Colossal-Manta.png ⭐ NEW

**Mythical Fish (10 species - Filipino Folklore)**:
- Bakunawa.png
- Siyokoy-Guardian.png
- Magindara.png
- Berberoka.png
- Kataw-King.png
- Liwliwa-Leviathan.png ⭐ NEW
- Golden-Bakasi.png ⭐ NEW
- Moonscale-Serpent.png ⭐ NEW
- Diwata-Koi.png ⭐ NEW
- Tidal-Emperor.png ⭐ NEW

## Image Requirements

- **Format**: PNG (transparent background recommended)
- **Size**: Recommended 512x512 or similar square dimensions
- **Quality**: High quality images for best display
- **Location**: Place in `images/fish/` folder

## Usage

Images are automatically loaded and displayed when:
1. A user catches an Epic, Legendary, or Mythical fish
2. The fish name matches an image file in the `fish/` folder
3. The bot shows the image in a media gallery component

## Adding New Fish Images

1. Create/obtain a high-quality PNG image of the fish
2. Name it according to the fish name (spaces → hyphens)
3. Place it in the `images/fish/` folder
4. Restart the bot
5. Image will automatically display when that fish is caught!

## Migration Instructions

**Move all fish images from root `images/` folder to `images/fish/` folder.**

**Windows Command** (run from `C:\Programming\v3\`):
```cmd
move images\*.png images\fish\
```

Or manually move these files to `images/fish/`:
- Blue-Marlin.png (or blue-marlin.png)
- Black-Marlin.png
- Swordfish.png
- Giant-Yellowfin-Tuna.png
- Bluefin-Trevally.png
- Oceanic-Whitetip-Shark.png
- Thresher-Shark.png
- Whale-Shark.png
- Reef-Manta-Ray.png
- Giant-Freshwater-Stingray.png
- Coelacanth.png
- Oarfish.png
- Goblin-Shark.png
- Megamouth-Shark.png
- Ocean-Sunfish.png
- Bakunawa.png
- Siyokoy-Guardian.png
- Magindara.png
- Berberoka.png
- Kataw-King.png

**Note**: Keep `README.md` and `.gitkeep` in the root `images/` folder.

## Verification

After moving files:
1. Restart the bot
2. Catch an Epic/Legendary/Mythical fish
3. Verify the image displays correctly
4. All fish images should now be in `images/fish/` folder

## Future Expansions

You can add more subfolders later for other image types:
- `images/items/` - Item icons
- `images/islands/` - Island backgrounds
- `images/badges/` - Achievement badges
- etc.
