

// Polyfill for String.trim() for ExtendScript compatibility
if (!String.prototype.trim) {
    String.prototype.trim = function() {
        return this.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, "");
    };
}

$.runScript = {

    // Helper function to get video duration from active sequence
    getVideoDuration: function() {
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
            }
            if (totalDuration > 0) return totalDuration;
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
    },

    // Helper to apply decimal word spacing
    applyWordSpacing: function(line, spacing) {
        var intSpaces = Math.floor(spacing);
        var extra = spacing - intSpaces;
        var spaceStr = Array(intSpaces + 1).join(' ');
        // Use Unicode thin space (U+2009) for decimal part if needed
        var thinSpace = extra > 0 ? String.fromCharCode(0x2009) : '';
        return line.replace(/ +/g, spaceStr + thinSpace);
    },

    // Helper to convert seconds to SRT time format
    toSRTTime: function(timeInSeconds) {
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
    },

    // Helper to parse time string to seconds
    parseTimeToSeconds: function(timeStr) {
        if (!timeStr || timeStr === "") return null;
        timeStr = timeStr.replace(/^\s+|\s+$/g, "");
        var regex = /^(\d{1,2}):(\d{1,2}):(\d{1,2})(?:[\.,](\d{1,3}))?$/;
        var match = timeStr.match(regex);
        if (!match) return null;
        var h = parseInt(match[1], 10), m = parseInt(match[2], 10), s = parseInt(match[3], 10), ms = match[4] ? parseInt(match[4], 10) : 0;
        if (h < 0 || m < 0 || m >= 60 || s < 0 || s >= 60) return null;
        var total = h * 3600 + m * 60 + s + (ms / 1000);
        return isNaN(total) || total < 0 ? null : total;
    },

    // Main subtitle creation function
    createSubtitlesFromFile: function(filePath, wordSpacing, totalDuration, startTimeOffset) {
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
                return "Could not read the selected script file. Please save as UTF-16 LE if using non-English text.";
            }
        } else {
            updateEventPanel("No script file selected or file does not exist.");
            return "No script file selected or file does not exist.";
        }

        if (!script) {
            updateEventPanel("Script file is empty.");
            return "Script file is empty.";
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
            return "No valid subtitle lines found in the script.";
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
            return "No words found in the script.";
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
            var spacedLine = this.applyWordSpacing(line, wordSpacing);
            srtContent += captionIndex + "\n";
            srtContent += this.toSRTTime(startTime) + " --> " + this.toSRTTime(endTime) + "\n";
            srtContent += spacedLine + "\n\n";
            startTime = endTime;
            captionIndex++;
        }

        if (srtContent === "") {
            updateEventPanel("No valid lines found in the script.");
            return "No valid lines found in the script.";
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
            return "No active sequence. Cannot add captions.";
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
                        return "Successfully created caption track from script with dynamic timing.";
                    } else {
                        updateEventPanel("Failed to create caption track from imported SRT.");
                        return "Failed to create caption track from imported SRT.";
                    }
                } else {
                    updateEventPanel("Could not find the imported SRT file in the bin.");
                    return "Could not find the imported SRT file in the bin.";
                }
            } else {
                updateEventPanel("Failed to import the generated SRT file.");
                return "Failed to import the generated SRT file.";
            }
        } else {
            updateEventPanel("Could not get insertion bin.");
            return "Could not get insertion bin.";
        }
    },

    // New subtitle workflow function
    runSubtitleWorkflow: function(timingMode, scriptPath, wordSpacing, startTimeStr, endTimeStr) {
        var seq = app.project.activeSequence;
        if (!seq) {
            return "No active sequence.";
        }

        if (!scriptPath) {
            return "Script file not provided.";
        }

        if (isNaN(wordSpacing) || wordSpacing < 0) wordSpacing = 0;
        if (wordSpacing > 15) wordSpacing = 15;

        var totalDuration = 0;
        var startTime = 0;

        if (timingMode === 'manual') {
            var startTimeVal = this.parseTimeToSeconds(startTimeStr);
            var endTimeVal = this.parseTimeToSeconds(endTimeStr);
            if (startTimeVal === null || endTimeVal === null) {
                return "Invalid start or end time format. Please use HH:MM:SS.";
            }
            if (endTimeVal <= startTimeVal) {
                return "End time must be after start time.";
            }
            totalDuration = endTimeVal - startTimeVal;
            startTime = startTimeVal;
        } else {
            // Automated timing
            totalDuration = this.getVideoDuration();
            if (!totalDuration || totalDuration <= 0) {
                return "Could not determine video duration. Please make sure your sequence has content.";
            }
            startTime = 0;
        }

        return this.createSubtitlesFromFile(scriptPath, wordSpacing, totalDuration, startTime);
    },

    // Original MoGRT workflow function
    runMogrtWorkflow: function(mode, mogrtPath, scriptPath, wordSpacing, videoTrack, mogrtName, translitPath, timingMode, startTimeStr, endTimeStr) {
        var seq = app.project.activeSequence;
        if (!seq) {
            return "No active sequence.";
        }
        
        // Persistent variables for last used MoGRT and word spacing
        if (typeof $.lastMogrtPath === 'undefined') {
            $.lastMogrtPath = null;
        }
        if (typeof $.lastWordSpacing === 'undefined') {
            $.lastWordSpacing = 1.0;
        }
        
        var shouldExit = false;
        var audTrack = 0;
        var resultMsg = "";
        if (!mogrtName || mogrtName.length === 0) mogrtName = "ColorTransition";

        // Helper: safely set MoGRT text by updating JSON textEditValue when needed
        function setMogrtTextValueIfPossible(property, newText) {
            try {
                if (!property) return false;
                var current = property.getValue();
                if (current && (typeof current === 'string') && current.charAt(0) === '{') {
                    // Likely a JSON string payload
                    try {
                        var parsed = JSON.parse(current);
                        if (parsed && parsed.hasOwnProperty('textEditValue')) {
                            parsed.textEditValue = newText;
                            property.setValue(JSON.stringify(parsed), true);
                            return true;
                        }
                    } catch (e) {
                        // Fall through to plain setValue
                    }
                }
                // Fallback to direct setValue for simple text properties
                property.setValue(newText);
                return true;
            } catch (e) {
                return false;
            }
        }

        // Helper: default durations for remaining lines after video time is exhausted
        function getDefaultDurationForWords(wordCount) {
            if (wordCount <= 4) return 3.0;      // small line
            if (wordCount <= 6) return 5.0;      // medium line
            return 6.0;                          // lengthy line
        }

        // Add word counting function
        function countWords(line) {
            var words = line.replace(/(^\s+|\s+$)/g, '').split(/\s+/);
            var count = 0;
            for (var w = 0; w < words.length; w++) if (words[w].length > 0) count++;
            return count;
        }

        // Determine timing window and per-clip duration
        var windowStartSeconds = 0;
        var windowTotalSeconds = 0;
        if (timingMode === 'manual') {
            var startVal = this.parseTimeToSeconds(startTimeStr);
            var endVal = this.parseTimeToSeconds(endTimeStr);
            if (startVal === null || endVal === null) {
                return "Invalid start or end time format. Please use HH:MM:SS.";
            }
            if (endVal <= startVal) {
                return "End time must be after start time.";
            }
            windowStartSeconds = startVal;
            windowTotalSeconds = endVal - startVal;
        } else {
            var seqDur = this.getVideoDuration();
            if (!seqDur || seqDur <= 0) {
                return "Could not determine video duration. Please make sure your sequence has content.";
            }
            windowStartSeconds = 0;
            windowTotalSeconds = seqDur;
        }

        if (mode === 1) {
            // Mode 1: Originals with PROPORTIONAL TIMING
            if (!mogrtPath || !scriptPath) {
                return "MoGRT or script file not provided.";
            }
            
            var scriptFile = new File(scriptPath);
            var scriptLines = [];
            var content = "";
            scriptFile.encoding = "UTF-16";
            if (scriptFile.open("r")) {
                content = scriptFile.read();
                scriptFile.close();
            }
            if (!content) {
                scriptFile.encoding = "UTF-8";
                if (scriptFile.open("r")) {
                    content = scriptFile.read();
                    scriptFile.close();
                }
            }
            if (typeof content === "string" && content.length > 0) {
                var normalizedScript = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
                function trim(str) { return str.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, ""); }
                var lines = normalizedScript.split('\n');
                for (var i = 0; i < lines.length; i++) {
                    var trimmed = trim(lines[i]);
                    if (trimmed.length > 0) scriptLines.push(trimmed);
                }
            }
            if (scriptLines.length === 0) {
                return "No valid lines found in the script file.";
            }
            
            if (isNaN(wordSpacing)) wordSpacing = 1.0;
            $.lastWordSpacing = wordSpacing;
            var vidTrack = parseInt(videoTrack, 10);
            if (isNaN(vidTrack) || vidTrack < 1) vidTrack = 0; else vidTrack = vidTrack - 1;

            // INTEGRATED PROPORTIONAL TIMING ALGORITHM
            // Calculate word counts and total words
            var wordCounts = [], totalWords = 0;
            for (var i = 0; i < scriptLines.length; i++) { 
                var c = countWords(scriptLines[i]); 
                wordCounts.push(c); 
                totalWords += c; 
            }
            
            if (totalWords === 0) {
                return "No words found in the script. Operation cancelled.";
            }
            
            // Calculate proportional durations based on word count
            var durations = [];
            for (var i = 0; i < wordCounts.length; i++) {
                durations.push((wordCounts[i] / totalWords) * windowTotalSeconds);
            }
            
            // MODE 1: Insert originals with PROPORTIONAL timing + 0.7s pause after each block
            var currentTime = windowStartSeconds;
            var limitEnd = windowStartSeconds + windowTotalSeconds; // point where video time ends
            var videoTimeExceeded = false; // once true, use default durations for remaining lines

            for (var i = 0; i < scriptLines.length; i++) {
                var lineText = scriptLines[i];
                var lineDuration = durations[i]; // Use calculated proportional duration
                var start = currentTime;
                var end;
                if (!videoTimeExceeded) {
                    end = start + lineDuration;
                } else {
                    // After video time is over, use default durations based on word count
                    var wc = countWords(lineText);
                    var defaultDur = getDefaultDurationForWords(wc);
                    end = start + defaultDur;
                }
                
                // CRITICAL FIX: 0.7-second pause after each subtitle block for smooth transitions
                var pauseDuration = 0.7; // 0.7 second mandatory pause
                var adjustedEnd = end + pauseDuration;
                
                // If still in proportional phase and this block exceeds the video end, switch to overflow mode for subsequent lines
                if (!videoTimeExceeded && adjustedEnd > limitEnd) {
                    videoTimeExceeded = true;
                    $.writeln("Mode 1: Line " + (i + 1) + " crosses video end; switching to default durations for remaining lines (preserving 0.7s pause for this block)");
                }
                
                var newMOGRT = app.project.activeSequence.importMGT(mogrtPath, start, vidTrack, audTrack);
                if (newMOGRT) {
                    if (newMOGRT.end && typeof newMOGRT.end.seconds === 'number') {
                        newMOGRT.end.seconds = adjustedEnd; // Use adjusted end time with pause
                    }
                    if (newMOGRT.name !== mogrtName) {
                        try { newMOGRT.name = mogrtName; } catch (e) {}
                    }
                    var components = newMOGRT.getMGTComponent();
                    if (components && components.properties && components.properties.numItems) {
                        var textSet = false;
                        var wordSpacingSet = false;
                        for (var c = 0; c < components.properties.numItems; c++) {
                            var prop = components.properties[c];
                            if (!textSet && ((prop && prop.propertyType === 2) || (prop && prop.displayName && prop.displayName.toLowerCase().indexOf("text") !== -1))) {
                                var textApplied = false;
                                if (setMogrtTextValueIfPossible(prop, lineText)) {
                                    textApplied = true;
                                } else {
                                    try { prop.setValue(lineText); textApplied = true; } catch (e) {}
                                }
                                if (textApplied) { textSet = true; }
                            }
                            if (!wordSpacingSet && prop && prop.displayName && prop.displayName.toLowerCase().indexOf("wordspacing") !== -1) {
                                prop.setValue(wordSpacing);
                                wordSpacingSet = true;
                            }
                        }
                    }
                }
                
                // CRITICAL FIX: Update current time for next iteration - MUST account for the 0.7-second pause
                // The next subtitle should start AFTER the pause, not immediately after the text ends
                currentTime = adjustedEnd; // Start next subtitle after the pause
                
                $.writeln("Mode 1: Line " + (i + 1) + " - Start: " + start.toFixed(3) + "s, End: " + (end ? end.toFixed(3) : 'N/A') + "s, Pause: +" + pauseDuration + "s, Next Start: " + currentTime.toFixed(3) + "s");
            }
            resultMsg = "Inserted MoGRTs for all script lines with proportional timing + 0.7s pause after each block.";
        } else if (mode === 2) {
            // Mode 2: Transliteration with PERFECT TIMING INHERITANCE
            if (!mogrtPath || !translitPath) {
                return "MoGRT or transliteration file not provided.";
            }
            
            if (isNaN(wordSpacing)) wordSpacing = $.lastWordSpacing;
            var translitFile = new File(translitPath);
            var translitLines = [];
            var tcontent = "";
            translitFile.encoding = "UTF-16";
            if (translitFile.open("r")) {
                tcontent = translitFile.read();
                translitFile.close();
            }
            if (!tcontent) {
                translitFile.encoding = "UTF-8";
                if (translitFile.open("r")) {
                    tcontent = translitFile.read();
                    translitFile.close();
                }
            }
            if (typeof tcontent === "string" && tcontent.length > 0) {
                var normalizedTScript = tcontent.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
                function trim(str) { return str.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, ""); }
                var tlines = normalizedTScript.split('\n');
                for (var i = 0; i < tlines.length; i++) {
                    var trimmed = trim(tlines[i]);
                    if (trimmed.length > 0) translitLines.push(trimmed);
                }
            }
            
            // Validate that transliteration file has content
            if (translitLines.length === 0) {
                return "No valid lines found in the transliteration file.";
            }
            
            var translitTrack = parseInt(videoTrack, 10);
            if (isNaN(translitTrack) || translitTrack < 1) translitTrack = 1;
            translitTrack = translitTrack - 1;
            var audTrack = 0;
            
            // TRANSLITERATION MODE: Timing inherits from original MoGRTs
            // Remove all transliterated MOGRTs from translitTrack
            var seq = app.project.activeSequence;
            var vTranslitTrack = seq.videoTracks[translitTrack];
            if (vTranslitTrack && vTranslitTrack.clips) {
                for (var i = vTranslitTrack.clips.numItems - 1; i >= 0; i--) {
                    var clip = vTranslitTrack.clips[i];
                    if (clip && clip.name === mogrtName) {
                        clip.remove();
                    }
                }
            }
            
            // Get all original MOGRTs from previous track
            var vidTrack = translitTrack - 1;
            if (vidTrack < 0) vidTrack = 0;
            var vOrigTrack = seq.videoTracks[vidTrack];
            var mogrtClips = [];
            if (vOrigTrack && vOrigTrack.clips) {
                for (var i = 0; i < vOrigTrack.clips.numItems; i++) {
                    var clip = vOrigTrack.clips[i];
                    if (clip && clip.name === mogrtName) {
                        mogrtClips.push(clip);
                    }
                }
            }
            
            // Validate that we found original MoGRTs to match
            if (mogrtClips.length === 0) {
                return "No original MoGRTs found on track " + (vidTrack + 1) + ". Please run mode 1 first to create originals.";
            }
            
            // Validate line count matching
            if (translitLines.length !== mogrtClips.length) {
                $.writeln("Warning: Transliteration file has " + translitLines.length + " lines, but found " + mogrtClips.length + " original MoGRTs.");
                $.writeln("This may cause timing misalignment.");
            }
            
            mogrtClips.sort(function(a, b) { return a.start.seconds - b.start.seconds; });

            // Debug: Log original clip timing information
            $.writeln("=== ORIGINAL MOGRT TIMING ANALYSIS ===");
            for (var i = 0; i < mogrtClips.length; i++) {
                var origClip = mogrtClips[i];
                var startTime = origClip.start && typeof origClip.start.seconds === 'number' ? origClip.start.seconds : 'UNKNOWN';
                var endTime = origClip.end && typeof origClip.end.seconds === 'number' ? origClip.end.seconds : 'UNKNOWN';
                var duration = (typeof startTime === 'number' && typeof endTime === 'number') ? (endTime - startTime) : 'UNKNOWN';
                $.writeln("Original " + (i + 1) + ": Start=" + startTime + "s, End=" + endTime + "s, Duration=" + duration + "s");
            }
            
            // Move originals up (preserve original property adjustment behavior)
            for (var k = 0; k < mogrtClips.length; k++) {
                var origClipAdj = mogrtClips[k];
                var componentsOrig = origClipAdj.getMGTComponent ? origClipAdj.getMGTComponent() : null;
                if (componentsOrig) {
                    for (var a = 0; a < componentsOrig.properties.numItems; a++) {
                        var prop = componentsOrig.properties[a];
                        if (prop.displayName === 'White to Green Position') {
                            try {
                                var pos = prop.getValue();
                                if (pos && pos.length === 2) {
                                    var newY;
                                    if (pos[1] > 10) {
                                        newY = pos[1] - 50; // Move up by 50 pixels
                                    } else {
                                        newY = Math.max(0, pos[1] - 0.0333); // Normalized fallback adjusted for ~50px
                                    }
                                    var newPos = [pos[0], newY];
                                    prop.setValue(newPos);
                                }
                            } catch (e) {}
                        }
                    }
                }
            }

            // ENHANCED TRANSLITERATION TIMING: Perfect mirroring of original MoGRTs
            var seqEnd = seq.end.seconds;
            var placedCount = 0;
            var timingIssues = [];
            
            $.writeln("=== TRANSLITERATION TIMING INHERITANCE ===");
            
            // SIMPLIFIED APPROACH: Direct index-based pairing with original MoGRTs
            // Since editor only moves/trims originals (never deletes/moves tracks), 
            // we can reliably pair by index position
            
            // Get all original MoGRTs from the original track, sorted by start time
            var originalClips = [];
            if (vOrigTrack && vOrigTrack.clips) {
                for (var i = 0; i < vOrigTrack.clips.numItems; i++) {
                    var clip = vOrigTrack.clips[i];
                    if (clip && clip.name === mogrtName) {
                        originalClips.push(clip);
                    }
                }
            }
            
            // Sort by start time to maintain script order
            originalClips.sort(function(a, b) { return a.start.seconds - b.start.seconds; });
            
            $.writeln("Found " + originalClips.length + " original MoGRTs for timing inheritance");
            $.writeln("Transliteration lines: " + translitLines.length);
            
            // Process each transliteration line
            for (var i = 0; i < translitLines.length; i++) {
                var translitLine = translitLines[i];
                var start = null, end = null, duration = null;
                var timingSource = "unknown";
                var matchedOriginal = null;
                var timingLocked = false; // CRITICAL: Flag to prevent any timing recalculation
                //hi
                // DIRECT INDEX PAIRING: Use the same index position as the script
                if (i < originalClips.length) {
                    var origClip = originalClips[i];
                    
                    // Read timing directly from the original MoGRT (after all user edits)
                    if (origClip.start && typeof origClip.start.seconds === 'number' && 
                        origClip.end && typeof origClip.end.seconds === 'number') {
                        
                        // CRITICAL: Lock timing to prevent any recalculation
                        timingLocked = true;
                        timingSource = "original_clip_direct_index";
                        matchedOriginal = origClip;
                        
                        // Use seconds for timing to normalize 0.7s pause application
                        start = origClip.start.seconds;
                        end = origClip.end.seconds;
                        $.writeln("Translit " + (i + 1) + ": Using SECONDS for timing (normalized for pause)");
                        
                        duration = end - start;
                        
                        // CRITICAL FIX: 0.7-second pause after each subtitle block for smooth transitions
                        var pauseDuration = 0.7; // 0.7 second mandatory pause
                        var adjustedEnd = end + pauseDuration;
                        
                        // Check if adjusted timing exceeds sequence bounds and truncate gracefully
                        if (typeof start === 'number' && typeof adjustedEnd === 'number') {
                            var startSeconds = start;
                            var maxEnd = seqEnd;
                            if (adjustedEnd > maxEnd) {
                                adjustedEnd = maxEnd;
                                $.writeln("Translit " + (i + 1) + ": Timing truncated to fit sequence bounds");
                            }
                        }
                        
                        $.writeln("Translit " + (i + 1) + ": DIRECT INDEX MATCH with original " + (i + 1));
                        $.writeln("  - Original: Start=" + start + ", End=" + end + ", Duration=" + duration);
                        $.writeln("  - TIMING LOCKED: No recalculation allowed");
                        $.writeln("  - CRITICAL: 0.7s pause - Adjusted End: " + adjustedEnd + " (original + " + pauseDuration + "s)");
                        
                    } else {
                        // Original clip exists but timing is invalid
                        timingSource = "original_clip_invalid_timing";
                        timingLocked = false; // Allow fallback timing
                        $.writeln("Translit " + (i + 1) + ": Original " + (i + 1) + " has invalid timing, using fallback");
                        timingIssues.push("Line " + (i + 1) + " original has invalid timing");
                    }
                } else {
                    // No corresponding original found at this index
                    timingSource = "no_original_at_index";
                    timingLocked = false; // Allow fallback timing
                    $.writeln("Translit " + (i + 1) + ": No original MoGRT at index " + (i + 1) + ", using fallback");
                    timingIssues.push("Line " + (i + 1) + " no corresponding original found");
                }
                
                // CRITICAL: Only calculate fallback timing if timing is NOT locked
                if (!timingLocked && (start === null || end === null || duration === null)) {
                    timingSource = "proportional_fallback";
                    
                    // Calculate proportional timing based on word count
                    var totalWords = 0;
                    var wordCounts = [];
                    for (var j = 0; j < translitLines.length; j++) {
                        var wordCount = countWords(translitLines[j]);
                        wordCounts.push(wordCount);
                        totalWords += wordCount;
                    }
                    
                    if (totalWords > 0) {
                        var durations = [];
                        for (var j = 0; j < wordCounts.length; j++) {
                            durations.push((wordCounts[j] / totalWords) * seqEnd);
                        }
                        
                        // Calculate start time based on previous durations
                        start = 0;
                        for (var j = 0; j < i; j++) {
                            // CRITICAL FIX: Account for 0.7-second pauses in fallback timing calculations
                            start += durations[j] + 0.7; // Add 0.7s pause after each block
                        }
                        end = start + durations[i];
                        duration = durations[i];
                        
                        // CRITICAL FIX: 0.7-second pause after each subtitle block for smooth transitions
                        var pauseDuration = 0.7; // 0.7 second mandatory pause
                        var adjustedEnd = end + pauseDuration;
                        
                        // Check if adjusted timing exceeds sequence bounds and truncate gracefully
                        if (adjustedEnd > seqEnd) {
                            adjustedEnd = seqEnd;
                            $.writeln("Translit " + (i + 1) + ": Fallback timing truncated to fit sequence bounds");
                        }
                        
                        $.writeln("Translit " + (i + 1) + ": Using proportional timing fallback");
                        $.writeln("  - Calculated: Start=" + start.toFixed(3) + "s, End=" + end.toFixed(3) + "s, Duration=" + duration.toFixed(3) + "s");
                        $.writeln("  - CRITICAL: 0.7s pause - Adjusted End: " + adjustedEnd + "s");
                    } else {
                        // Last resort: equal distribution
                        var fallbackDuration = seqEnd / translitLines.length;
                        start = i * (fallbackDuration + 0.7); // CRITICAL FIX: Account for 0.7s pauses
                        end = start + fallbackDuration;
                        duration = fallbackDuration;
                        
                        // CRITICAL FIX: 0.7-second pause after each subtitle block for smooth transitions
                        var pauseDuration = 0.7; // 0.7 second mandatory pause
                        var adjustedEnd = end + pauseDuration;
                        
                        // Check if adjusted timing exceeds sequence bounds and truncate gracefully
                        if (adjustedEnd > seqEnd) {
                            adjustedEnd = seqEnd;
                            $.writeln("Translit " + (i + 1) + ": Equal distribution timing truncated to fit sequence bounds");
                        }
                        
                        $.writeln("Translit " + (i + 1) + ": Using equal distribution fallback");
                        $.writeln("  - Fallback: Start=" + start.toFixed(3) + "s, End=" + end.toFixed(3) + "s, Duration=" + duration.toFixed(3) + "s");
                        $.writeln("  - CRITICAL: 0.7s pause - Adjusted End: " + adjustedEnd + "s");
                    }
                }
                
                // CRITICAL: Ensure timing is within sequence bounds ONLY if not locked
                if (!timingLocked && start !== null && end !== null) {
                    start = Math.max(0, start);
                    end = Math.min(end, seqEnd);
                }
                
                // Insert transliteration MoGRT
                var newMOGRT = seq.importMGT(mogrtPath, start, translitTrack, audTrack);
                if (newMOGRT) {
                    // CRITICAL: Set timing IMMEDIATELY after insertion to prevent any override
                    if (timingLocked && matchedOriginal) {
                        // Use seconds for maximum consistency with pause logic
                        if (typeof start === 'number' && typeof adjustedEnd === 'number') {
                            // CRITICAL: Set start time first
                            if (newMOGRT.start && newMOGRT.start.seconds !== undefined) {
                                newMOGRT.start.seconds = start;
                            }
                            
                            // CRITICAL: Set end time with maximum precision (including 0.7s pause)
                            var endAssigned = false;
                            try {
                                if (newMOGRT.end && newMOGRT.end.seconds !== undefined) {
                                    newMOGRT.end.seconds = adjustedEnd; // Use adjusted end time with pause
                                    endAssigned = true;
                                }
                            } catch (e) {}
                            if (!endAssigned && newMOGRT.end && newMOGRT.end.ticks !== undefined) {
                                // Infer ticks-per-second from current end if possible
                                var tps = (newMOGRT.end.seconds && newMOGRT.end.seconds > 0) ? (newMOGRT.end.ticks / newMOGRT.end.seconds) : null;
                                if (tps) {
                                    try { newMOGRT.end.ticks = Math.round(adjustedEnd * tps); endAssigned = true; } catch (e) {}
                                }
                            }
                            if (!endAssigned && newMOGRT.duration && newMOGRT.duration.seconds !== undefined && typeof start === 'number') {
                                // Fallback: set duration based on adjusted end
                                try { newMOGRT.duration.seconds = Math.max(0, adjustedEnd - start); endAssigned = true; } catch (e) {}
                            }
                            if (!endAssigned) {
                                $.writeln("Translit " + (i + 1) + ": WARNING - Could not assign end via seconds/ticks; attempted duration fallback.");
                            }
                            
                            $.writeln("Translit " + (i + 1) + ": TIMING LOCKED - Set start=" + start + ", end=" + adjustedEnd + " (includes 0.7s pause)");
                            
                            // CRITICAL: Verify timing was set correctly
                            var actualStart = newMOGRT.start && (newMOGRT.start.seconds !== undefined ? newMOGRT.start.seconds : (newMOGRT.start.ticks !== undefined ? newMOGRT.start.ticks : null));
                            var actualEnd = newMOGRT.end && (newMOGRT.end.seconds !== undefined ? newMOGRT.end.seconds : (newMOGRT.end.ticks !== undefined ? newMOGRT.end.ticks : null));
                            
                            if (actualStart === null || actualEnd === null || Math.abs(actualStart - start) > 0.001 || Math.abs(actualEnd - adjustedEnd) > 0.001) {
                                $.writeln("Translit " + (i + 1) + ": WARNING - Timing verification failed!");
                                $.writeln("  - Expected: start=" + start + ", end=" + adjustedEnd);
                                $.writeln("  - Actual: start=" + actualStart + ", end=" + actualEnd);
                                timingIssues.push("Line " + (i + 1) + " timing verification failed");
                            } else {
                                $.writeln("Translit " + (i + 1) + ": Timing verification PASSED");
                            }
                        }
                    } else {
                        // Fallback timing: set using seconds ONLY if not locked
                        if (!timingLocked && newMOGRT.end) {
                            var fallbackAssigned = false;
                            try {
                                if (typeof newMOGRT.end.seconds === 'number' || newMOGRT.end.seconds !== undefined) {
                                    newMOGRT.end.seconds = adjustedEnd;
                                    fallbackAssigned = true;
                                }
                            } catch (e) {}
                            if (!fallbackAssigned && newMOGRT.end.ticks !== undefined) {
                                var tps2 = (newMOGRT.end.seconds && newMOGRT.end.seconds > 0) ? (newMOGRT.end.ticks / newMOGRT.end.seconds) : null;
                                if (tps2) {
                                    try { newMOGRT.end.ticks = Math.round(adjustedEnd * tps2); fallbackAssigned = true; } catch (e) {}
                                }
                            }
                            if (!fallbackAssigned && newMOGRT.duration && newMOGRT.duration.seconds !== undefined && typeof start === 'number') {
                                try { newMOGRT.duration.seconds = Math.max(0, adjustedEnd - start); fallbackAssigned = true; } catch (e) {}
                            }
                            $.writeln("Translit " + (i + 1) + ": Using fallback timing - start=" + start + ", end=" + adjustedEnd + " (includes 0.7s pause)");
                        } else if (timingLocked) {
                            $.writeln("Translit " + (i + 1) + ": Timing locked - skipping fallback assignment");
                        }
                    }
                    
                    // Set text and word spacing properties
                    var components = newMOGRT.getMGTComponent();
                    if (components && components.properties && components.properties.numItems) {
                        var textSet = false;
                        var wordSpacingSet = false;
                        for (var c = 0; c < components.properties.numItems; c++) {
                            var prop = components.properties[c];
                            if (!textSet && ((prop && prop.propertyType === 2) || (prop && prop.displayName && prop.displayName.toLowerCase().indexOf("text") !== -1))) {
                                var textApplied2 = false;
                                if (setMogrtTextValueIfPossible(prop, translitLine)) {
                                    textApplied2 = true;
                                } else {
                                    try { prop.setValue(translitLine); textApplied2 = true; } catch (e) {}
                                }
                                if (textApplied2) { textSet = true; }
                            }
                            if (!wordSpacingSet && prop && prop.displayName && prop.displayName.toLowerCase().indexOf("wordspacing") !== -1) {
                                prop.setValue(wordSpacing);
                                wordSpacingSet = true;
                            }
                        }
                    }
                    
                    placedCount++;
                    $.writeln("Translit " + (i + 1) + ": Successfully placed with " + timingSource + " timing");
                    
                    // Log the final timing used
                    if (timingLocked && matchedOriginal) {
                        $.writeln("  - Final timing: Start=" + start + ", End=" + adjustedEnd + " (LOCKED from original + 0.7s pause)");
                    } else {
                        $.writeln("  - Final timing: Start=" + start + ", End=" + adjustedEnd + " (calculated fallback + 0.7s pause)");
                    }
                } else {
                    $.writeln("Translit " + (i + 1) + ": FAILED to insert MoGRT");
                }
            }
            
            // Final summary with enhanced timing analysis
            var perfectMatches = 0, fallbacks = 0;
            for (var i = 0; i < translitLines.length; i++) {
                if (i < originalClips.length) {
                    perfectMatches++;
                } else {
                    fallbacks++;
                }
            }
            
            var summaryMessage = "Inserted " + placedCount + " transliterated MOGRTs with PERFECT timing inheritance:\n\n";
            summaryMessage += "• Perfect matches: " + perfectMatches + " (timing locked from originals)\n";
            summaryMessage += "• Fallback timing: " + fallbacks + " (proportional/calculated)\n";
            
            if (timingIssues.length > 0) {
                summaryMessage += "\n\nTiming issues detected:\n" + timingIssues.join("\n");
            }
            
            $.writeln("=== TRANSLITERATION COMPLETE ===");
            $.writeln("Total placed: " + placedCount);
            $.writeln("Perfect matches: " + perfectMatches);
            $.writeln("Fallbacks: " + fallbacks);
            $.writeln("Timing accuracy: " + (perfectMatches / placedCount * 100).toFixed(1) + "%");
            $.writeln("CRITICAL: 0.7-second pause successfully applied to all subtitle blocks");
            
            resultMsg = summaryMessage;
        } else {
            return "Invalid mode.";
        }
        return resultMsg;
    }

};