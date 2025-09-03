# Installation Instructions

## How to load up the extension

We will first need to setup the player debug mode to 1 - here's how to do it -

### For Windows

Go to the registry editor and to the path mentioned below, then change the playerdebugmode to 1, if not present simply add one and set the data to 1.

**Registry Path:** `Computer\HKEY_CURRENT_USER\Software\Adobe\CSXS.11`

![Windows Registry Editor showing PlayerDebugMode setting](https://github.com/PlanetRead/subtitle-tool-for-Adobe-Premier/blob/rahul_featureOne/installation-screenshot.png)

### For Mac

On MacOS, type the following into Terminal, then relaunch Finder (either via rebooting, or from the Force Quit dialog):

```bash
defaults write /Users/<username>/Library/Preferences/com.adobe.CSXS.11.plist PlayerDebugMode 1
```

## Put panel into extensions directory

Put your own panel's containing directory here, to have Premiere Pro load it:

**Windows:** `C:\Program Files (x86)\Common Files\Adobe\CEP\extensions`

**Mac:** `/Library/Application Support/Adobe/CEP/extensions`

> **Note:** That's the root `/Library`, not a specific user's `~/Library`...

## Loading the Extension

1. Simply open Premiere Pro
2. Go into **Window → Extensions**
3. Open up the desired extension

If in case the extension is not visible, restart Premiere Pro and now it should be visible.
