# Subtitle Creator for Adobe Premiere Pro

## Overview

This is a modern CEP extension for Adobe Premiere Pro that creates subtitle tracks from plain text files, with flexible timing and professional UI. Each line in your text file becomes a subtitle, and you can choose between automatic or manual timing for precise control.

## Features

- **Automatic or Manual Timing Modes**
  - **Automatic:** Detects video duration from the active sequence and distributes subtitles proportionally.
  - **Manual:** Enter custom start and end times (HH:MM:SS) for the subtitle track.
- **Dynamic Subtitle Timing** - Calculates optimal subtitle duration based on your chosen mode and subtitle word count.
- **Simple File Upload** - Select a .txt file directly in the panel.
- **Word Spacing Control** - Adjust spacing between words (0-15 points) in the panel.
- **Real-time Feedback** - Status and errors are shown in Premiere Pro's Events panel and in the panel UI.
- **No Popups** - All feedback is non-intrusive and shown in the UI.
- **Modern, Accessible UI** - Clean, Premiere Pro–inspired design with tooltips, help, and validation.

## How It Works

1. Open the extension panel in Premiere Pro.
2. Select your subtitle text file (.txt) using the file input (one subtitle per line, UTF-16 LE recommended).
3. Choose your timing mode:
   - **Automatic:** The extension will fetch the sequence duration and distribute subtitles automatically.
   - **Manual:** Enter your desired start and end times (HH:MM:SS). Subtitles will start and end at exactly these times.
4. Adjust word spacing if needed using the slider or number input.
5. Click **Create Subtitles**.
6. Status and errors are shown in the panel and in Premiere Pro's Events panel.

### Manual Timing Mode

- When Manual mode is selected, enter both a start and end time in HH:MM:SS format.
- The subtitle track will start at your chosen start time and end at your chosen end time—no shifting or offset.
- The duration is for your reference only; subtitles are placed exactly as you specify.

### Error Handling & Feedback

- All errors (invalid file, bad time format, sequence issues) are shown in the panel UI and Premiere Pro's Events panel.
- No popups or alerts interrupt your workflow.

## Author

rahul

