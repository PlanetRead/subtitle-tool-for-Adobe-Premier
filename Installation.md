# Installation Instructions

## Tutorial

You can follow a tutorial [here](https://drive.google.com/file/d/1jrdd3F4BDPjGcT03AyVxs8L3jQoH5fLU/view?usp=sharing).

## Enable Player Debug Mode

The CSXS/CEP version differs depending on your Premiere Pro version:

| Premiere Pro Version | CSXS/CEP Version |
| -------------------- | ---------------- |
| 2024.x               | 11               |
| 2025.x               | 12               |

### Windows

1. Open **Registry Editor**.
2. Navigate to:

```
HKEY_CURRENT_USER\Software\Adobe\CSXS.<CEP version>
```

> Replace `<CEP version>` with 11 or 12 depending on Premiere version.

3. Add or edit the key `PlayerDebugMode` and set value to `1`.

### macOS

1. Open **Terminal**.
2. Run the command:

```bash
defaults write com.adobe.CSXS.<CEP version> PlayerDebugMode -bool YES
```

> Replace `<CEP version>` with 11 or 12 depending on Premiere version.

3. Relaunch Finder via **Force Quit → Finder → Relaunch** or reboot.

### Verify Debug Mode

```bash
defaults read com.adobe.CSXS.<CEP version> PlayerDebugMode
```

* Returns `1` or `YES` if debug mode is active.

## Place Panel into Extensions Directory

* **Windows:**

```
C:\Program Files (x86)\Common Files\Adobe\CEP\extensions
```

* **macOS:**

```
/Library/Application Support/Adobe/CEP/extensions
```

> Use the system `/Library`, not `~/Library`.

## Load the Extension

1. Open **Adobe Premiere Pro**.
2. Go to **Window → Extensions**.
3. Select your plugin.
4. If it doesn’t appear, restart Premiere Pro.
