// Standalone script for creating subtitles with word spacing

// Function to automatically get video duration from active sequence
function getVideoDuration() {
    var activeSeq = app.project.activeSequence;
    if (!activeSeq) {
        return null;
    }

    // Try several methods, in order of most common to least
    var duration = 0;

    // Method 1: Try to get from sequence end
    try {
        if (activeSeq.end && typeof activeSeq.end.seconds === 'number') {
            duration = activeSeq.end.seconds;
            if (duration > 0) return duration;
        }
    } catch (e) {}

    // Method 2: Try to get from sequence duration property
    try {
        if (activeSeq.duration && typeof activeSeq.duration.seconds === 'number') {
            duration = activeSeq.duration.seconds;
            if (duration > 0) return duration;
        }
    } catch (e) {}

    // Method 3: Calculate from video tracks
    try {
        var totalDuration = 0;
        if (activeSeq.videoTracks && typeof activeSeq.videoTracks.numTracks === 'number') {
            for (var i = 0; i < activeSeq.videoTracks.numTracks; i++) {
                var track = activeSeq.videoTracks[i];
                if (track && track.clips && typeof track.clips.numItems === 'number') {
                    for (var j = 0; j < track.clips.numItems; j++) {
                        var clip = track.clips[j];
                        if (clip && clip.end && typeof clip.end.seconds === 'number') {
                            var clipEnd = clip.end.seconds;
                            if (clipEnd > totalDuration) {
                                totalDuration = clipEnd;
                            }
                        }
                    }
                }
            }
            if (totalDuration > 0) return totalDuration;
        }
    } catch (e) {}

    // Method 4: Try to get from sequence bounds (rare)
    try {
        if (activeSeq.getPlayerBounds && typeof activeSeq.getPlayerBounds === 'function') {
            var bounds = activeSeq.getPlayerBounds();
            if (bounds && bounds.width && typeof bounds.width.seconds === 'number') {
                duration = bounds.width.seconds;
                if (duration > 0) return duration;
            }
        }
    } catch (e) {}

    // If all methods fail, return a default duration
    return 60; // Default to 60 seconds if we can't determine duration
}

// Helper to apply decimal word spacing
function applyWordSpacing(line, spacing) {
    var intSpaces = Math.floor(spacing);
    var extra = spacing - intSpaces;
    var spaceStr = Array(intSpaces + 1).join(' ');
    // Use Unicode thin space (U+2009) for decimal part if needed
    var thinSpace = extra > 0 ? String.fromCharCode(0x2009) : '';
    return line.replace(/ +/g, spaceStr + thinSpace);
}

// Helper to convert seconds to SRT time format
function toSRTTime(timeInSeconds) {
    var totalMilliseconds = Math.round(timeInSeconds * 1000);
    var milliseconds = totalMilliseconds % 1000;
    var totalSeconds = Math.floor(totalMilliseconds / 1000);
    var seconds = totalSeconds % 60;
    var totalMinutes = Math.floor(totalSeconds / 60);
    var minutes = totalMinutes % 60;
    var hours = Math.floor(totalMinutes / 60);
    function pad(num, size) {
        var s = "000" + num;
        return s.substr(s.length - size);
    }
    return pad(hours, 2) + ":" + pad(minutes, 2) + ":" + pad(seconds, 2) + "," + pad(milliseconds, 3);
}

function createSubtitlesFromFile(filePath, wordSpacing, totalDuration, startTimeOffset) {
    // Utility: get correct file path separator
    function getSep() {
        if (Folder.fs === 'Macintosh') {
            return '/';
        } else {
            return '\\';
        }
    }

    // Utility: post messages to the Premiere Pro Events panel
    function updateEventPanel(message) {
        app.setSDKEventMessage(message, 'info');
    }

    // Polyfill for String.trim() since ExtendScript does not support it
    function trim(str) {
        return str.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, "");
    }

    // Read the script file robustly for all languages
    var scriptFile = new File(filePath);
    var script = "";
    if (scriptFile && scriptFile.exists) {
        // Try UTF-16 first (best for all languages)
        scriptFile.encoding = "UTF-16";
        if (scriptFile.open("r")) {
            script = scriptFile.read();
            scriptFile.close();
        }
        // Fallback: Try UTF-8 if UTF-16 fails
        if (!script) {
            scriptFile.encoding = "UTF-8";
            if (scriptFile.open("r")) {
                script = scriptFile.read();
                scriptFile.close();
            }
        }
        if (!script) {
            updateEventPanel("Could not read the selected script file. Please save as UTF-16 LE if using non-English text.");
            return;
        }
    } else {
        updateEventPanel("No script file selected or file does not exist.");
        return;
    }

    if (!script) {
        updateEventPanel("Script file is empty.");
        return;
    }

    // Normalize all line endings to \n
    var normalizedScript = script.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    var lines = normalizedScript.split('\n');

    // Filter out empty/whitespace-only lines
    var validLines = [];
    for (var i = 0; i < lines.length; i++) {
        var trimmed = trim(lines[i]);
        if (trimmed.length > 0) {
            validLines.push(trimmed);
        }
    }

    if (validLines.length === 0) {
        updateEventPanel("No valid subtitle lines found in the script.");
        return;
    }

    // Default to 1 if not provided or invalid, and limit to 15
    if (!wordSpacing || wordSpacing < 1) wordSpacing = 1;
    if (wordSpacing > 15) wordSpacing = 15;

    // Count words in each line and total words
    var wordCounts = [];
    var totalWords = 0;
    for (var i = 0; i < validLines.length; i++) {
        // Manual word count for compatibility
        var words = validLines[i].replace(/(^\s+|\s+$)/g, '').split(/\s+/);
        var count = 0;
        for (var w = 0; w < words.length; w++) {
            if (words[w].length > 0) count++;
        }
        wordCounts.push(count);
        totalWords += count;
    }

    if (totalWords === 0) {
        updateEventPanel("No words found in the script.");
        return;
    }

    // Calculate durations for each line
    var durations = [];
    for (var i = 0; i < wordCounts.length; i++) {
        durations.push((wordCounts[i] / totalWords) * totalDuration);
    }

    // Now build the SRT with proportional durations
    var srtContent = "";
    var startTime = (typeof startTimeOffset === 'number' && !isNaN(startTimeOffset)) ? startTimeOffset : 0;
    var captionIndex = 1;
    for (var i = 0; i < validLines.length; i++) {
        var line = validLines[i];
        var duration = durations[i];
        var endTime = startTime + duration;
        var spacedLine = applyWordSpacing(line, wordSpacing);
        srtContent += captionIndex + "\n";
        srtContent += toSRTTime(startTime) + " --> " + toSRTTime(endTime) + "\n";
        srtContent += spacedLine + "\n\n";
        startTime = endTime;
        captionIndex++;
    }

    if (srtContent === "") {
        updateEventPanel("No valid lines found in the script.");
        return;
    }

    // Use a unique filename for each SRT export to avoid caching issues
    var uniqueName = "temp_subtitles_" + (new Date().getTime()) + ".srt";
    var tempFile = new File(Folder.desktop.fsName + getSep() + uniqueName);
    tempFile.encoding = "UTF8";
    tempFile.open("w", "TEXT", "????");
    tempFile.write(srtContent);
    tempFile.close();

    var activeSeq = app.project.activeSequence;
    if (!activeSeq) {
        updateEventPanel("No active sequence. Cannot add captions.");
        // tempFile.remove(); // Do not delete the SRT file to avoid 'Link Media' popup
        return;
    }

    var destBin = app.project.getInsertionBin();
    if (destBin) {
        var prevItemCount = destBin.children.numItems;
        var importThese = [tempFile.fsName];
        app.project.importFiles(importThese, true, destBin, false);
        var newItemCount = destBin.children.numItems;
        if (newItemCount > prevItemCount) {
            var importedSRT = destBin.children[(newItemCount - 1)];
            if (importedSRT) {
                var startAtTime = 0;
                var result = activeSeq.createCaptionTrack(importedSRT, startAtTime);
                if (result) {
                    updateEventPanel("Successfully created caption track from script with dynamic timing.");
                } else {
                    updateEventPanel("Failed to create caption track from imported SRT.");
                }
            } else {
                updateEventPanel("Could not find the imported SRT file in the bin.");
            }
        } else {
            updateEventPanel("Failed to import the generated SRT file.");
        }
    } else {
        updateEventPanel("Could not get insertion bin.");
    }
    // Do not delete the SRT file to avoid 'Link Media' popup
}

// Remove main() and its call, restore panel API for UI-driven workflow

// Expose functions for panel-driven workflow
if (typeof $ === 'undefined') { var $ = {}; }
if (!$.runScript) $.runScript = {};

// Expose getVideoDuration for panel (optional, if UI ever needs it)
$.runScript.getVideoDuration = getVideoDuration;

// Expose createSubtitlesFromFile for panel
$.runScript.createSubtitlesFromFile = function(filePath, wordSpacing, timingMode, startTimeStr, endTimeStr) {
    function parseTimeToSeconds(timeStr) {
        if (!timeStr || timeStr === "") return null;
        timeStr = timeStr.replace(/^\s+|\s+$/g, "");
        var regex = /^(\d{1,2}):(\d{1,2}):(\d{1,2})(?:[\.,](\d{1,3}))?$/;
        var match = timeStr.match(regex);
        if (!match) return null;
        var h = parseInt(match[1], 10), m = parseInt(match[2], 10), s = parseInt(match[3], 10), ms = match[4] ? parseInt(match[4], 10) : 0;
        if (h < 0 || m < 0 || m >= 60 || s < 0 || s >= 60) return null;
        var total = h * 3600 + m * 60 + s + (ms / 1000);
        return isNaN(total) || total < 0 ? null : total;
    }
    var totalDuration = 0, startTime = 0;
    if (timingMode === 'manual') {
        var startTimeVal = parseTimeToSeconds(startTimeStr);
        var endTimeVal = parseTimeToSeconds(endTimeStr);
        if (startTimeVal === null || endTimeVal === null) {
            app.setSDKEventMessage("Invalid start or end time format. Please use HH:MM:SS.", 'error');
            return;
        }
        if (endTimeVal <= startTimeVal) {
            app.setSDKEventMessage("End time must be after start time.", 'error');
            return;
        }
        totalDuration = endTimeVal - startTimeVal;
        startTime = startTimeVal;
        createSubtitlesFromFile(filePath, wordSpacing, totalDuration, startTime);
    } else {
        totalDuration = getVideoDuration();
        if (!totalDuration || totalDuration <= 0) {
            app.setSDKEventMessage("Could not determine video duration. Please make sure your sequence has content.", 'error');
            return;
        }
        startTime = 0;
        createSubtitlesFromFile(filePath, wordSpacing, totalDuration, startTime);
    }
};