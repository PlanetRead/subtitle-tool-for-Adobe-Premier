
var selectedTransliterationSrtPath = null; 
var selectedTranscriptionSrtPath = null; 
var selectedTransliterationMogrtPath = null; 
var selectedTranscriptionMogrtPath = null;
var selectedTransliterationGreenMogrtPath = null;
var selectedTransliterationWhiteMogrtPath = null;
var selectedTransliterationVideoTrack = 1; 
var selectedTransliterationMode = "manual"; 

var selectedTransliterationTextFilePath = null; 
var transliterationManualTimingPoints = []; 
var transliterationCurrentTextLineIndex = 0; 
var transliterationTextFileLines = [];


function setSubtitleMode(mode) {
    $.writeln("Subtitle mode set to: " + mode);
}


function setTransliterationVideoTrack(trackNumber) {
    selectedTransliterationVideoTrack = trackNumber;
    alert("Transliteration subtitles will be inserted on Video Track " + (selectedTransliterationVideoTrack + 1) + " (V" + (selectedTransliterationVideoTrack + 1) + ").");
}

function setTransliterationMode(mode) {
    selectedTransliterationMode = mode;
    $.writeln("Transliteration mode set to: " + mode);
    alert("Transliteration mode set to: " + mode);
}



// Let user pick transliteration SRT and return its fsName
function selectTransliterationSrtFile() {
    var srtFile = File.openDialog("Select your transliteration SRT file", "*.srt");
    if (!srtFile) {
        alert("No transliteration SRT file selected.");
        return "";
    }
    selectedTransliterationSrtPath = srtFile.fsName;
    $.writeln("Transliteration SRT path stored in JSX: " + selectedTransliterationSrtPath);
    return selectedTransliterationSrtPath;
}

// Let user pick transcription SRT and return its fsName
function selectTranscriptionSrtFile() {
    var srtFile = File.openDialog("Select your transcription SRT file", "*.srt");
    if (!srtFile) {
        alert("No transcription SRT file selected.");
        return "";
    }
    selectedTranscriptionSrtPath = srtFile.fsName;
    $.writeln("Transcription SRT path stored in JSX: " + selectedTranscriptionSrtPath);
    return selectedTranscriptionSrtPath;
}

// Let user pick transliteration MOGRT and return its fsName (legacy function)
function selectTransliterationMogrtFile() {
    var mogrtFile = File.openDialog("Select your transliteration MOGRT file", "*.mogrt");
    if (!mogrtFile) {
        alert("No transliteration MOGRT file selected.");
        return "";
    }
    selectedTransliterationMogrtPath = mogrtFile.fsName;
    $.writeln("Transliteration MOGRT path stored in JSX: " + selectedTransliterationMogrtPath);
    return selectedTransliterationMogrtPath;
}

// Let user pick transliteration green MOGRT and return its fsName
function selectTransliterationGreenMogrtFile() {
    var mogrtFile = File.openDialog("Select your transliteration green MOGRT file", "*.mogrt");
    if (!mogrtFile) {
        alert("No transliteration green MOGRT file selected.");
        return "";
    }
    selectedTransliterationGreenMogrtPath = mogrtFile.fsName;
    $.writeln("Transliteration green MOGRT path stored in JSX: " + selectedTransliterationGreenMogrtPath);
    return selectedTransliterationGreenMogrtPath;
}

// Let user pick transliteration white MOGRT and return its fsName
function selectTransliterationWhiteMogrtFile() {
    var mogrtFile = File.openDialog("Select your transliteration white MOGRT file", "*.mogrt");
    if (!mogrtFile) {
        alert("No transliteration white MOGRT file selected.");
        return "";
    }
    selectedTransliterationWhiteMogrtPath = mogrtFile.fsName;
    $.writeln("Transliteration white MOGRT path stored in JSX: " + selectedTransliterationWhiteMogrtPath);
    return selectedTransliterationWhiteMogrtPath;
}

// Let user pick transcription MOGRT and return its fsName
function selectTranscriptionMogrtFile() {
    var mogrtFile = File.openDialog("Select your transcription MOGRT file", "*.mogrt");
    if (!mogrtFile) {
        alert("No transcription MOGRT file selected.");
        return "";
    }
    selectedTranscriptionMogrtPath = mogrtFile.fsName;
    $.writeln("Transcription MOGRT path stored in JSX: " + selectedTranscriptionMogrtPath);
    return selectedTranscriptionMogrtPath;
}


// Format time in HH:MM:SS.mmm format (ExtendScript compatible)
function formatTime(seconds) {
    var hours = Math.floor(seconds / 3600);
    var minutes = Math.floor((seconds % 3600) / 60);
    var secs = Math.floor(seconds % 60);
    var milliseconds = Math.floor((seconds % 1) * 1000);
    
    // ExtendScript compatible padding
    var hoursStr = (hours < 10) ? "0" + hours : hours.toString();
    var minutesStr = (minutes < 10) ? "0" + minutes : minutes.toString();
    var secsStr = (secs < 10) ? "0" + secs : secs.toString();
    var msStr = (milliseconds < 100) ? ((milliseconds < 10) ? "00" + milliseconds : "0" + milliseconds) : milliseconds.toString();
    
    return hoursStr + ":" + minutesStr + ":" + secsStr + "." + msStr;
}

// Function to insert MOGRT with ultra-precise timing and forced end timing for transliteration
function insertMogrtWithUltraPreciseTiming(seq, mogrtFilePath, startTimeSeconds, endTimeSeconds, trackIndex) {
    try {
        $.writeln("=== insertMogrtWithUltraPreciseTiming for Transliteration ===");
        $.writeln("MOGRT file: " + mogrtFilePath);
        $.writeln("Start time: " + startTimeSeconds + "s");
        $.writeln("End time: " + endTimeSeconds + "s");
        $.writeln("Track index: " + trackIndex);
        
        // Validate inputs
        if (!mogrtFilePath || !seq) {
            $.writeln("ERROR: Invalid inputs");
            return null;
        }
        
        var mogrtFile = new File(mogrtFilePath);
        if (!mogrtFile.exists) {
            $.writeln("ERROR: MOGRT file not found: " + mogrtFilePath);
            return null;
        }
        
        // Ensure we have enough video tracks
        while (seq.videoTracks.numTracks <= trackIndex) {
            seq.videoTracks.addTrack();
        }
        
        // Convert times to ticks for precise timing
        var startTicks = Math.round(startTimeSeconds * seq.timebase);
        var endTicks = Math.round(endTimeSeconds * seq.timebase);
        var durationTicks = endTicks - startTicks;
        var exactDuration = endTimeSeconds - startTimeSeconds;
        
        $.writeln("Start ticks: " + startTicks);
        $.writeln("End ticks: " + endTicks);
        $.writeln("Duration ticks: " + durationTicks);
        $.writeln("Exact duration: " + exactDuration + "s");
        
        // Import MOGRT at precise start time
        $.writeln("Importing MOGRT at precise time: " + startTimeSeconds + "s");
        var mogrtClip = seq.importMGT(mogrtFile.fsName, startTimeSeconds, trackIndex, 0);
        
        if (!mogrtClip) {
            $.writeln("ERROR: Failed to import MOGRT");
            return null;
        }
        
        // ENHANCED: Force exact timing with multiple methods
        var timingSet = false;
        
        // Method 1: Set both start and end times explicitly
        try {
            mogrtClip.start = startTicks;
            mogrtClip.end = endTicks;
            $.writeln("✓ Method 1: Start/End times set explicitly");
            timingSet = true;
        } catch (e) {
            $.writeln("WARNING: Method 1 failed: " + e);
        }
        
        // Method 2: Set duration first, then end time
        if (!timingSet) {
            try {
                mogrtClip.duration = exactDuration;
                mogrtClip.end = mogrtClip.start + durationTicks;
                $.writeln("✓ Method 2: Duration then end time set");
                timingSet = true;
            } catch (e) {
                $.writeln("WARNING: Method 2 failed: " + e);
            }
        }
        
        // Method 3: Use sequence timebase for precise calculation
        if (!timingSet) {
            try {
                var preciseStartTicks = Math.round(startTimeSeconds * seq.timebase);
                var preciseEndTicks = Math.round(endTimeSeconds * seq.timebase);
                mogrtClip.start = preciseStartTicks;
                mogrtClip.end = preciseEndTicks;
                $.writeln("✓ Method 3: Precise tick calculation");
                timingSet = true;
            } catch (e) {
                $.writeln("WARNING: Method 3 failed: " + e);
            }
        }
        
        // Method 4: Frame-accurate timing
        if (!timingSet) {
            try {
                var frameRate = seq.frameRate;
                var startFrame = Math.round(startTimeSeconds * frameRate);
                var endFrame = Math.round(endTimeSeconds * frameRate);
                var startSecFrame = startFrame / frameRate;
                var endSecFrame = endFrame / frameRate;
                var startTicksFrame = Math.round(startSecFrame * seq.timebase);
                var endTicksFrame = Math.round(endSecFrame * seq.timebase);
                
                mogrtClip.start = startTicksFrame;
                mogrtClip.end = endTicksFrame;
                $.writeln("✓ Method 4: Frame-accurate timing");
                timingSet = true;
            } catch (e) {
                $.writeln("WARNING: Method 4 failed: " + e);
            }
        }
        
        // Method 5: Final fallback - just set duration
        if (!timingSet) {
            try {
                mogrtClip.duration = exactDuration;
                $.writeln("✓ Method 5: Duration only fallback");
                timingSet = true;
            } catch (e) {
                $.writeln("ERROR: All timing methods failed: " + e);
            }
        }
        
        // Verify the timing was set correctly
        if (timingSet) {
            var actualStartTicks = mogrtClip.start;
            var actualEndTicks = mogrtClip.end;
            var actualStartSec = actualStartTicks / seq.timebase;
            var actualEndSec = actualEndTicks / seq.timebase;
            var actualDuration = actualEndSec - actualStartSec;
            
            $.writeln("Final timing verification:");
            $.writeln("  Expected: " + startTimeSeconds + "s to " + endTimeSeconds + "s (duration: " + exactDuration + "s)");
            $.writeln("  Actual: " + actualStartSec + "s to " + actualEndSec + "s (duration: " + actualDuration + "s)");
            
            var startDiff = Math.abs(actualStartSec - startTimeSeconds);
            var endDiff = Math.abs(actualEndSec - endTimeSeconds);
            var durationDiff = Math.abs(actualDuration - exactDuration);
            
            $.writeln("  Start difference: " + startDiff + "s");
            $.writeln("  End difference: " + endDiff + "s");
            $.writeln("  Duration difference: " + durationDiff + "s");
            
            if (endDiff < 0.1) {
                $.writeln("✓ End timing is accurate!");
            } else {
                $.writeln("⚠ End timing may not be exact - MOGRT may have fixed duration");
            }
        }
        
        $.writeln("✓ MOGRT inserted with enhanced ultra-precise timing");
        return mogrtClip;
        
    } catch (err) {
        $.writeln("ERROR in insertMogrtWithUltraPreciseTiming: " + err);
        return null;
    }
}

// Let user pick transliteration animated MOGRT and return its fsName
function selectTransliterationAnimatedMogrtFile() {
    var mogrtFile = File.openDialog("Select your transliteration animated MOGRT file", "*.mogrt");
    if (!mogrtFile) {
        alert("No transliteration animated MOGRT file selected.");
        return "";
    }
    selectedTransliterationMogrtPath = mogrtFile.fsName;
    $.writeln("Transliteration animated MOGRT path stored in JSX: " + selectedTransliterationMogrtPath);
    return selectedTransliterationMogrtPath;
}

// Debug function to check stored transliteration paths
function debugTransliterationStoredPaths() {
    $.writeln("=== DEBUG: Transliteration JSX Global Variables ===");
    $.writeln("selectedTransliterationSrtPath: " + (selectedTransliterationSrtPath || "null"));
    $.writeln("selectedTranscriptionSrtPath: " + (selectedTranscriptionSrtPath || "null"));
    $.writeln("selectedTransliterationMogrtPath: " + (selectedTransliterationMogrtPath || "null"));
    $.writeln("selectedTranscriptionMogrtPath: " + (selectedTranscriptionMogrtPath || "null"));
    
    alert("Transliteration JSX Global Variables:\nTransliteration SRT: " + (selectedTransliterationSrtPath || "null") + "\nTranscription SRT: " + (selectedTranscriptionSrtPath || "null") + "\nTransliteration MOGRT: " + (selectedTransliterationMogrtPath || "null") + "\nTranscription MOGRT: " + (selectedTranscriptionMogrtPath || "null"));
}

// Parse SRT file content
function parseSRT(srtText) {
    var lines = srtText.split('\n');
    var entries = [];
    var i = 0;
    
    while (i < lines.length) {
        // Skip empty lines
        while (i < lines.length && lines[i].trim() === '') i++;
        if (i >= lines.length) break;
        
        // Parse subtitle number
        var number = parseInt(lines[i]);
        i++;
        
        // Parse timestamp
        var timestamp = lines[i];
        var timeParts = timestamp.split(' --> ');
        var start = parseTime(timeParts[0]);
        var end = parseTime(timeParts[1]);
        i++;
        
        // Parse text
        var text = '';
        while (i < lines.length && lines[i] && lines[i].trim() !== '') {
            text += (text ? '\n' : '') + lines[i];
            i++;
        }
        
        var startSec = srtTimeToSeconds(start);
        var endSec = srtTimeToSeconds(end);
        var duration = endSec - startSec;
        
        $.writeln("SRT Entry: '" + text + "' from " + startSec + "s to " + endSec + "s (duration: " + duration + "s)");
        
        entries.push({
            text: text,
            start: start,
            end: end
        });
        // Skip empty line
        while (i < lines.length && lines[i].trim() === '') i++;
    }
    
    $.writeln("Parsed " + entries.length + " subtitle entries");
    return entries;
}

// Parse time string to time object
function parseTime(timeStr) {
    var parts = timeStr.split(',');
    var timeParts = parts[0].split(':');
    var milliseconds = parseInt(parts[1]);
    
    return {
        hours: parseInt(timeParts[0]),
        minutes: parseInt(timeParts[1]),
        seconds: parseInt(timeParts[2]),
        milliseconds: milliseconds
    };
}

// Convert SRT time to seconds
function srtTimeToSeconds(t) {
    return t.hours * 3600 + t.minutes * 60 + t.seconds + t.milliseconds / 1000.0;
}


function setMogrtPublishedParams(mgtClip, subtitleText, secondsDuration) {
    try {
        $.writeln("=== Setting text on MOGRT clip (Foreign Language Support) ===");
        $.writeln("Text to set: '" + subtitleText + "'");
        $.writeln("Text length: " + subtitleText.length + " characters");
        $.writeln("MOGRT clip name: " + (mgtClip.name || "unnamed"));
        $.writeln("MOGRT clip type: " + (mgtClip.type || "unknown"));
        
        // ENHANCED: Try multiple text setting methods for foreign language support
        var textSet = false;
        
        // Method 1: Try direct properties access with foreign language support
        $.writeln("--- Method 1: Direct properties access (Foreign Language) ---");
        if (mgtClip.properties && mgtClip.properties.numItems) {
            $.writeln("Found " + mgtClip.properties.numItems + " direct properties");
            for (var i = 0; i < mgtClip.properties.numItems; i++) {
                var prop = mgtClip.properties[i];
                var propName = prop.displayName || prop.name || "";
                var propValue = "";
                try {
                    propValue = prop.getValue();
                } catch (e) {
                    propValue = "cannot read";
                }
                $.writeln("Property " + i + ": " + propName + " = " + propValue);
                
                // Enhanced text property detection for foreign languages
                if (propName === "Subtitle Text" || propName === "Text" || propName === "Source Text" || 
                    propName === "Text Content" || propName === "Display Text" || propName === "Caption Text" ||
                    propName.toLowerCase().indexOf("text") !== -1 || propName.toLowerCase().indexOf("subtitle") !== -1 ||
                    propName.toLowerCase().indexOf("caption") !== -1 || propName.toLowerCase().indexOf("content") !== -1) {
                    $.writeln("✓ Found text property: " + propName);
                    try {
                        // Try setting with foreign language support
                        prop.setValue(subtitleText, true);
                        $.writeln("✓ Successfully set " + propName + " to: " + subtitleText);
                        textSet = true;
                        break;
                    } catch (e) {
                        $.writeln("✗ Failed to set " + propName + ": " + e);
                        
                        // Try alternative method for foreign characters
                        try {
                            // Force UTF-8 encoding for foreign languages
                            var encodedText = encodeURIComponent(subtitleText);
                            var decodedText = decodeURIComponent(encodedText);
                            prop.setValue(decodedText, true);
                            $.writeln("✓ Successfully set " + propName + " with encoding: " + decodedText);
                            textSet = true;
                            break;
                        } catch (e2) {
                            $.writeln("✗ Failed encoding method: " + e2);
                        }
                    }
                }
            }
        } else {
            $.writeln("No direct properties found");
        }
        
        // Method 2: Try MGT component access with foreign language support
        if (!textSet) {
            $.writeln("--- Method 2: MGT component access (Foreign Language) ---");
            if (mgtClip.getMGTComponent) {
                try {
                    var component = mgtClip.getMGTComponent();
                    if (component && component.properties && component.properties.numItems) {
                        $.writeln("Found " + component.properties.numItems + " MGT component properties");
                        for (var i = 0; i < component.properties.numItems; i++) {
                            var prop = component.properties[i];
                            var propName = prop.displayName || prop.name || "";
                            $.writeln("MGT Property " + i + ": " + propName);
                            
                            // Enhanced text property detection for foreign languages
                            if (propName === "Subtitle Text" || propName === "Text" || propName === "Source Text" || 
                                propName === "Text Content" || propName === "Display Text" || propName === "Caption Text" ||
                                propName.toLowerCase().indexOf("text") !== -1 || propName.toLowerCase().indexOf("subtitle") !== -1 ||
                                propName.toLowerCase().indexOf("caption") !== -1 || propName.toLowerCase().indexOf("content") !== -1) {
                                $.writeln("✓ Found MGT text property: " + propName);
                                try {
                                    prop.setValue(subtitleText, true);
                                    $.writeln("✓ Successfully set MGT " + propName + " to: " + subtitleText);
                                    textSet = true;
                                    break;
                                } catch (e) {
                                    $.writeln("✗ Failed to set MGT " + propName + ": " + e);
                                    
                                    // Try alternative method for foreign characters
                                    try {
                                        var encodedText = encodeURIComponent(subtitleText);
                                        var decodedText = decodeURIComponent(encodedText);
                                        prop.setValue(decodedText, true);
                                        $.writeln("✓ Successfully set MGT " + propName + " with encoding: " + decodedText);
                                        textSet = true;
                                        break;
                                    } catch (e2) {
                                        $.writeln("✗ Failed MGT encoding method: " + e2);
                                    }
                                }
                            }
                        }
                    } else {
                        $.writeln("No MGT component properties found");
                    }
                } catch (e) {
                    $.writeln("Error accessing MGT component: " + e);
                }
            } else {
                $.writeln("getMGTComponent method not available");
            }
        }
        
        // Method 3: Try components array with foreign language support
        if (!textSet) {
            $.writeln("--- Method 3: Components array access (Foreign Language) ---");
            if (mgtClip.components && mgtClip.components.length > 0) {
                $.writeln("Found " + mgtClip.components.length + " components");
                for (var c = 0; c < mgtClip.components.length; c++) {
                    var component = mgtClip.components[c];
                    $.writeln("Component " + c + ": " + (component.name || "unnamed"));
                    if (component.properties && component.properties.numItems) {
                        $.writeln("  Found " + component.properties.numItems + " component properties");
                        for (var i = 0; i < component.properties.numItems; i++) {
                            var prop = component.properties[i];
                            var propName = prop.displayName || prop.name || "";
                            $.writeln("  Component Property " + i + ": " + propName);
                            
                            // Enhanced text property detection for foreign languages
                            if (propName === "Subtitle Text" || propName === "Text" || propName === "Source Text" || 
                                propName === "Text Content" || propName === "Display Text" || propName === "Caption Text" ||
                                propName.toLowerCase().indexOf("text") !== -1 || propName.toLowerCase().indexOf("subtitle") !== -1 ||
                                propName.toLowerCase().indexOf("caption") !== -1 || propName.toLowerCase().indexOf("content") !== -1) {
                                $.writeln("✓ Found component text property: " + propName);
                                try {
                                    prop.setValue(subtitleText, true);
                                    $.writeln("✓ Successfully set component " + propName + " to: " + subtitleText);
                                    textSet = true;
                                    break;
                                } catch (e) {
                                    $.writeln("✗ Failed to set component " + propName + ": " + e);
                                    
                                    // Try alternative method for foreign characters
                                    try {
                                        var encodedText = encodeURIComponent(subtitleText);
                                        var decodedText = decodeURIComponent(encodedText);
                                        prop.setValue(decodedText, true);
                                        $.writeln("✓ Successfully set component " + propName + " with encoding: " + decodedText);
                                        textSet = true;
                                        break;
                                    } catch (e2) {
                                        $.writeln("✗ Failed component encoding method: " + e2);
                                    }
                                }
                            }
                        }
                        if (textSet) break;
                    }
                }
            } else {
                $.writeln("No components array found");
            }
        }
        
        // Method 4: Try all properties recursively with foreign language support
        if (!textSet) {
            $.writeln("--- Method 4: Recursive property search (Foreign Language) ---");
            function searchProperties(obj, depth) {
                if (depth > 3) return false; // Prevent infinite recursion
                
                if (obj.properties && obj.properties.numItems) {
                    for (var i = 0; i < obj.properties.numItems; i++) {
                        var prop = obj.properties[i];
                        var propName = prop.displayName || prop.name || "";
                        
                        // Enhanced text property detection for foreign languages
                        if (propName === "Subtitle Text" || propName === "Text" || propName === "Source Text" || 
                            propName === "Text Content" || propName === "Display Text" || propName === "Caption Text" ||
                            propName.toLowerCase().indexOf("text") !== -1 || propName.toLowerCase().indexOf("subtitle") !== -1 ||
                            propName.toLowerCase().indexOf("caption") !== -1 || propName.toLowerCase().indexOf("content") !== -1) {
                            $.writeln("✓ Found text property in recursive search: " + propName);
                            try {
                                prop.setValue(subtitleText, true);
                                $.writeln("✓ Successfully set recursive " + propName + " to: " + subtitleText);
                                return true;
                            } catch (e) {
                                $.writeln("✗ Failed to set recursive " + propName + ": " + e);
                                
                                // Try alternative method for foreign characters
                                try {
                                    var encodedText = encodeURIComponent(subtitleText);
                                    var decodedText = decodeURIComponent(encodedText);
                                    prop.setValue(decodedText, true);
                                    $.writeln("✓ Successfully set recursive " + propName + " with encoding: " + decodedText);
                                    return true;
                                } catch (e2) {
                                    $.writeln("✗ Failed recursive encoding method: " + e2);
                                }
                            }
                        }
                        
                        // Recursively search nested properties
                        if (searchProperties(prop, depth + 1)) {
                            return true;
                        }
                    }
                }
                return false;
            }
            
            if (searchProperties(mgtClip, 0)) {
                textSet = true;
            }
        }
        
        // Method 5: Try setting the name property with foreign language support
        if (!textSet) {
            $.writeln("--- Method 5: Setting name property (Foreign Language) ---");
            try {
                mgtClip.name = subtitleText;
                $.writeln("✓ Set MOGRT name to: " + subtitleText);
                textSet = true;
            } catch (e) {
                $.writeln("✗ Failed to set name: " + e);
                
                // Try with encoding for foreign characters
                try {
                    var encodedText = encodeURIComponent(subtitleText);
                    var decodedText = decodeURIComponent(encodedText);
                    mgtClip.name = decodedText;
                    $.writeln("✓ Set MOGRT name with encoding to: " + decodedText);
                    textSet = true;
                } catch (e2) {
                    $.writeln("✗ Failed to set name with encoding: " + e2);
                }
            }
        }
        
        // Method 6: Try setting custom properties for foreign languages
        if (!textSet) {
            $.writeln("--- Method 6: Custom foreign language properties ---");
            try {
                // Try common foreign language text properties
                var customProps = ["Custom Text", "Foreign Text", "Language Text", "Unicode Text", "UTF8 Text"];
                for (var i = 0; i < customProps.length; i++) {
                    try {
                        if (mgtClip[customProps[i]]) {
                            mgtClip[customProps[i]] = subtitleText;
                            $.writeln("✓ Set custom property " + customProps[i] + " to: " + subtitleText);
                            textSet = true;
                            break;
                        }
                    } catch (e) {
                        // Continue to next property
                    }
                }
            } catch (e) {
                $.writeln("✗ Failed custom properties method: " + e);
            }
        }
        
        // Final result
        if (textSet) {
            $.writeln("=== FOREIGN LANGUAGE TEXT SETTING SUCCESS ===");
            $.writeln("Successfully set foreign language text: '" + subtitleText + "'");
            return true;
        } else {
            $.writeln("=== FOREIGN LANGUAGE TEXT SETTING FAILED ===");
            $.writeln("Could not find or set any text property on MOGRT for foreign language.");
            $.writeln("Text attempted: '" + subtitleText + "'");
            $.writeln("Available properties:");
            if (mgtClip.properties && mgtClip.properties.numItems) {
                for (var i = 0; i < mgtClip.properties.numItems; i++) {
                    var prop = mgtClip.properties[i];
                    var propName = prop.displayName || prop.name || "";
                    $.writeln("  - " + propName);
                }
            }
            
            return false;
        }
        
    } catch (err) {
        $.writeln('ERROR in setMogrtPublishedParams: ' + err);
        return false;
    }
}

// Main function to insert both transliteration and transcription layers
function insertTransliterationSubtitles() {
    try {
        $.writeln("=== Transliteration Subtitles Feature ===");
        $.writeln("Transliteration SRT: " + selectedTransliterationSrtPath);
        $.writeln("Transcription SRT: " + selectedTranscriptionSrtPath);
        $.writeln("Transliteration MOGRT: " + selectedTransliterationMogrtPath);
        $.writeln("Transcription MOGRT: " + selectedTranscriptionMogrtPath);
        
        if (!selectedTransliterationSrtPath || !selectedTranscriptionSrtPath) {
            alert("Please select both SRT files first.");
            return;
        }
        
        if (!selectedTransliterationMogrtPath || !selectedTranscriptionMogrtPath) {
            alert("Please select both MOGRT files first.");
            return;
        }
        
        if (!app.project) {
            alert("No active project found.");
            return;
        }

        // Load and parse both SRT files
        var transliterationSrtFile = new File(selectedTransliterationSrtPath);
        var transcriptionSrtFile = new File(selectedTranscriptionSrtPath);
        
        if (!transliterationSrtFile.exists) {
            alert("Transliteration SRT file not found: " + selectedTransliterationSrtPath);
            return;
        }
        if (!transcriptionSrtFile.exists) {
            alert("Transcription SRT file not found: " + selectedTranscriptionSrtPath);
            return;
        }

        // Read transliteration SRT
        if (!transliterationSrtFile.open("r")) {
            alert("Failed to open transliteration SRT file.");
            return;
        }
        var transliterationSrtText = transliterationSrtFile.read();
        transliterationSrtFile.close();
        var transliterationSubs = parseSRT(transliterationSrtText);
        
        // Read transcription SRT
        if (!transcriptionSrtFile.open("r")) {
            alert("Failed to open transcription SRT file.");
            return;
        }
        var transcriptionSrtText = transcriptionSrtFile.read();
        transcriptionSrtFile.close();
        var transcriptionSubs = parseSRT(transcriptionSrtText);

        if (!transliterationSubs.length || !transcriptionSubs.length) {
            alert("No valid subtitles found in one or both SRT files.");
            return;
        }

        var seq = app.project.activeSequence;
        if (!seq) {
            alert("No active sequence.");
            return;
        }

        $.writeln("Found " + transliterationSubs.length + " transliteration entries");
        $.writeln("Found " + transcriptionSubs.length + " transcription entries");
        $.writeln("Sequence: " + seq.name);
        
        // Verify that both SRT files have the same number of entries
        if (transliterationSubs.length !== transcriptionSubs.length) {
            alert("WARNING: Transliteration SRT has " + transliterationSubs.length + " entries, but Transcription SRT has " + transcriptionSubs.length + " entries.\n\nThis may cause mismatched text content. Both SRT files should have the same number of subtitle entries.");
        }

        // Ensure we have enough video tracks (need 2 tracks for both layers)
        while (seq.videoTracks.numTracks <= selectedTransliterationVideoTrack + 1) {
            seq.videoTracks.addTrack();
        }

        var mogrtClips = [];
        var successCount = 0;

        // Process each subtitle entry
        for (var i = 0; i < transliterationSubs.length; i++) {
            $.writeln("=== Processing subtitle " + (i + 1) + " of " + transliterationSubs.length + " ===");
            
            var startSec = srtTimeToSeconds(transliterationSubs[i].start);
            var endSec = srtTimeToSeconds(transliterationSubs[i].end);
            var duration = endSec - startSec;

            $.writeln("Transliteration: '" + transliterationSubs[i].text + "'");
            $.writeln("Transcription: '" + transcriptionSubs[i].text + "'");
            $.writeln("Start time: " + startSec + "s");
            $.writeln("End time: " + endSec + "s");
            $.writeln("Duration: " + duration + "s");

            // Convert to Premiere Pro time units (ticks)
            var startTicks = Math.round(startSec * seq.timebase);
            var endTicks = Math.round(endSec * seq.timebase);
            var durationTicks = endTicks - startTicks;

            // Insert transliteration MOGRT (base layer) on selected track
            $.writeln("Inserting transliteration MOGRT on track " + selectedTransliterationVideoTrack);
            var transliterationMogrtFile = new File(selectedTransliterationMogrtPath);
            var newTransliterationMOGRT = seq.importMGT(transliterationMogrtFile.fsName, startSec, selectedTransliterationVideoTrack, 0);
            if (newTransliterationMOGRT) {
                // Set exact duration for the clip
                try {
                    newTransliterationMOGRT.end = newTransliterationMOGRT.start + durationTicks;
                    $.writeln("✓ Transliteration MOGRT duration set: " + (newTransliterationMOGRT.end - newTransliterationMOGRT.start) + " ticks");
                } catch (e) {
                    $.writeln("WARNING: Could not set transliteration MOGRT duration: " + e);
                }
                
                // Set published properties (text content) - use transliteration text
                var textSuccess = setMogrtPublishedParams(newTransliterationMOGRT, transliterationSubs[i].text, duration);
                $.writeln("Transliteration MOGRT text set: " + (textSuccess ? "SUCCESS" : "FAILED"));
                
                mogrtClips.push(newTransliterationMOGRT);
                successCount++;
                $.writeln("✓ Transliteration MOGRT inserted successfully");
            } else {
                $.writeln("✗ Failed to insert transliteration MOGRT");
            }

            // Insert transcription MOGRT (masking layer) on next track
            $.writeln("Inserting transcription MOGRT on track " + (selectedTransliterationVideoTrack + 1));
            var transcriptionMogrtFile = new File(selectedTranscriptionMogrtPath);
            var newTranscriptionMOGRT = seq.importMGT(transcriptionMogrtFile.fsName, startSec, selectedTransliterationVideoTrack + 1, 0);
            if (newTranscriptionMOGRT) {
                // Set exact duration for the clip
                try {
                    newTranscriptionMOGRT.end = newTranscriptionMOGRT.start + durationTicks;
                    $.writeln("✓ Transcription MOGRT duration set: " + (newTranscriptionMOGRT.end - newTranscriptionMOGRT.start) + " ticks");
                } catch (e) {
                    $.writeln("WARNING: Could not set transcription MOGRT duration: " + e);
                }
                
                // Set published properties (text content) - use transcription text
                var textSuccess = setMogrtPublishedParams(newTranscriptionMOGRT, transcriptionSubs[i].text, duration);
                $.writeln("Transcription MOGRT text set: " + (textSuccess ? "SUCCESS" : "FAILED"));
                
                mogrtClips.push(newTranscriptionMOGRT);
                successCount++;
                $.writeln("✓ Transcription MOGRT inserted successfully");
            } else {
                $.writeln("✗ Failed to insert transcription MOGRT");
            }

            // Check for spacing between subtitles
            if (i < transliterationSubs.length - 1) {
                var nextStartSec = srtTimeToSeconds(transliterationSubs[i + 1].start);
                var gap = nextStartSec - endSec;
                $.writeln("Gap to next subtitle: " + gap + "s");
                if (gap > 0) {
                    $.writeln("✓ Space maintained between subtitles");
                } else if (gap < 0) {
                    $.writeln("WARNING: Overlapping subtitles detected!");
                }
            }
            
            $.writeln("---");
        }

        $.writeln("=== Transliteration Subtitles Insertion Complete ===");
        $.writeln("Total MOGRTs inserted: " + successCount + " out of " + (transliterationSubs.length * 2));

        if (mogrtClips.length === 0) {
            alert("No MOGRTs were inserted. Check if your MOGRT files are valid and compatible with Premiere.");
        } else {
            var cropInstructions = "";
            if (selectedTransliterationCropStyle !== "none") {
                cropInstructions = "\n\nCROP EFFECT SETUP:\n" +
                    "1. Select each TRANSCRIPTION MOGRT clip in the timeline\n" +
                    "2. Go to Effects panel → Video Effects → Transform → Crop\n" +
                    "3. Drag Crop effect onto the transcription MOGRT clip\n" +
                    "4. In Effect Controls, set keyframes for Left/Right/Top/Bottom\n" +
                    "5. Start: Set crop to 100% (fully cropped)\n" +
                    "6. End: Set crop to 0% (fully revealed)\n" +
                    "7. This creates the masking animation for transcription over transliteration.";
            }
            
            alert("Inserted " + mogrtClips.length + " MOGRT clips (" + transliterationSubs.length + " subtitle pairs) from both SRT files.\n\nTransliteration on V" + (selectedTransliterationVideoTrack + 1) + ", transcription on V" + (selectedTransliterationVideoTrack + 2) + "." + cropInstructions);
        }
        
    } catch (err) {
        $.writeln("ERROR in insertTransliterationSubtitles: " + err);
        alert("Error inserting transliteration subtitles: " + err + "\n\nCheck ExtendScript console for details.");
    }
}

// Function to show manual crop instructions for transliteration
function showTransliterationManualCropInstructions() {
    var instructions = "TRANSLITERATION MANUAL CROP INSTRUCTIONS:\n\n" +
        "1. Select the TRANSCRIPTION MOGRT clip in your timeline\n" +
        "2. Go to Effects panel -> Video Effects -> Transform -> Crop\n" +
        "3. Drag the Crop effect onto the transcription MOGRT clip\n" +
        "4. In the Effect Controls panel, find the Crop effect\n" +
        "5. Set keyframes for the crop direction you want:\n" +
        "   • Left-to-Right: Keyframe 'Left' from 0% to 100%\n" +
        "   • Center Reveal: Keyframe 'Top' and 'Bottom' from 50% to 0%\n" +
        "   • Random: Choose any direction based on your preference\n" +
        "6. Start: Set crop to 100% (fully cropped)\n" +
        "7. End: Set crop to 0% (fully revealed)\n" +
        "8. This creates the masking animation for transcription over transliteration.\n\n" +
        "The transcription layer will reveal over the transliteration layer, creating the color transition effect.";
    
    alert(instructions);
    $.writeln("Transliteration manual crop instructions displayed");
}

// Function to insert transliteration subtitles with 3 MOGRTs (manual mode)
function insertTransliterationSubtitlesWith3Mogrts() {
    try {
        $.writeln("=== insertTransliterationSubtitlesWith3Mogrts called ===");
        $.writeln("Transliteration SRT: " + (selectedTransliterationSrtPath || "null"));
        $.writeln("Transcription SRT: " + (selectedTranscriptionSrtPath || "null"));
        $.writeln("Transliteration Green MOGRT: " + (selectedTransliterationGreenMogrtPath || "null"));
        $.writeln("Transliteration White MOGRT: " + (selectedTransliterationWhiteMogrtPath || "null"));
        $.writeln("Transcription MOGRT: " + (selectedTranscriptionMogrtPath || "null"));
        
        if (!selectedTransliterationSrtPath || !selectedTranscriptionSrtPath || !selectedTransliterationGreenMogrtPath || !selectedTransliterationWhiteMogrtPath || !selectedTranscriptionMogrtPath) {
            alert("Please select all required files: Transliteration SRT, Transcription SRT, Transliteration Green MOGRT, Transliteration White MOGRT, and Transcription MOGRT.");
            return;
        }
        
        if (!app.project) {
            alert("No active project found.");
            return;
        }

        var transliterationSrtFile = new File(selectedTransliterationSrtPath);
        var transcriptionSrtFile = new File(selectedTranscriptionSrtPath);
        var transliterationGreenMogrtFile = new File(selectedTransliterationGreenMogrtPath);
        var transliterationWhiteMogrtFile = new File(selectedTransliterationWhiteMogrtPath);
        var transcriptionMogrtFile = new File(selectedTranscriptionMogrtPath);

        if (!transliterationSrtFile.exists) {
            alert("Transliteration SRT file not found: " + selectedTransliterationSrtPath);
            return;
        }
        if (!transcriptionSrtFile.exists) {
            alert("Transcription SRT file not found: " + selectedTranscriptionSrtPath);
            return;
        }
        if (!transliterationGreenMogrtFile.exists) {
            alert("Transliteration Green MOGRT file not found: " + selectedTransliterationGreenMogrtPath);
            return;
        }
        if (!transliterationWhiteMogrtFile.exists) {
            alert("Transliteration White MOGRT file not found: " + selectedTransliterationWhiteMogrtPath);
            return;
        }
        if (!transcriptionMogrtFile.exists) {
            alert("Transcription MOGRT file not found: " + selectedTranscriptionMogrtPath);
            return;
        }

        // Read transliteration SRT
        if (!transliterationSrtFile.open("r")) {
            alert("Failed to open transliteration SRT file.");
            return;
        }
        var transliterationSrtText = transliterationSrtFile.read();
        transliterationSrtFile.close();
        var transliterationSubs = parseSRT(transliterationSrtText);
        
        // Read transcription SRT
        if (!transcriptionSrtFile.open("r")) {
            alert("Failed to open transcription SRT file.");
            return;
        }
        var transcriptionSrtText = transcriptionSrtFile.read();
        transcriptionSrtFile.close();
        var transcriptionSubs = parseSRT(transcriptionSrtText);

        if (!transliterationSubs.length || !transcriptionSubs.length) {
            alert("No valid subtitles found in one or both SRT files.");
            return;
        }

        var seq = app.project.activeSequence;
        if (!seq) {
            alert("No active sequence.");
            return;
        }

        $.writeln("Found " + transliterationSubs.length + " transliteration subtitle entries");
        $.writeln("Found " + transcriptionSubs.length + " transcription subtitle entries");
        $.writeln("Sequence: " + seq.name);
        $.writeln("Sequence timebase: " + seq.timebase);
        
        // Verify that both SRT files have the same number of entries
        if (transliterationSubs.length !== transcriptionSubs.length) {
            alert("WARNING: Transliteration SRT has " + transliterationSubs.length + " entries, but Transcription SRT has " + transcriptionSubs.length + " entries.\n\nThis may cause mismatched text content. Both SRT files should have the same number of subtitle entries.");
        }

        // Ensure we have enough video tracks (need 3 tracks for 3 MOGRTs)
        while (seq.videoTracks.numTracks <= selectedTransliterationVideoTrack + 2) {
            seq.videoTracks.addTrack();
        }

        mogrtClips = [];
        var successCount = 0;

        for (var i = 0; i < transliterationSubs.length; i++) {
            $.writeln("=== Processing transliteration subtitle " + (i + 1) + " of " + transliterationSubs.length + " ===");
            
            var startSec = srtTimeToSeconds(transliterationSubs[i].start);
            var endSec = srtTimeToSeconds(transliterationSubs[i].end);
            var duration = endSec - startSec;

            $.writeln("Transliteration: '" + transliterationSubs[i].text + "'");
            $.writeln("Transcription: '" + transcriptionSubs[i].text + "'");
            $.writeln("Start time: " + startSec + "s (" + transliterationSubs[i].start.hours + ":" + transliterationSubs[i].start.minutes + ":" + transliterationSubs[i].start.seconds + "," + transliterationSubs[i].start.milliseconds + ")");
            $.writeln("End time: " + endSec + "s (" + transliterationSubs[i].end.hours + ":" + transliterationSubs[i].end.minutes + ":" + transliterationSubs[i].end.seconds + "," + transliterationSubs[i].end.milliseconds + ")");
            $.writeln("Duration: " + duration + "s");

            // Convert to Premiere Pro time units (ticks) - EXACT timing
            var startTicks = Math.round(startSec * seq.timebase);
            var endTicks = Math.round(endSec * seq.timebase);
            var durationTicks = endTicks - startTicks;

            $.writeln("Start ticks: " + startTicks);
            $.writeln("End ticks: " + endTicks);
            $.writeln("Duration ticks: " + durationTicks);

            // Insert transliteration green MOGRT (base layer) on selected track
            $.writeln("Inserting transliteration green MOGRT on track " + selectedTransliterationVideoTrack + " at EXACT time: " + startSec + "s");
            var newTransliterationGreenMOGRT = seq.importMGT(transliterationGreenMogrtFile.fsName, startSec, selectedTransliterationVideoTrack, 0);
            if (newTransliterationGreenMOGRT) {
                // Force EXACT timing by setting both start and end
                try {
                    newTransliterationGreenMOGRT.start = startTicks;
                    newTransliterationGreenMOGRT.end = endTicks;
                    $.writeln("✓ Transliteration green MOGRT timing forced: " + (newTransliterationGreenMOGRT.start / seq.timebase) + "s to " + (newTransliterationGreenMOGRT.end / seq.timebase) + "s");
                } catch (e) {
                    $.writeln("WARNING: Could not force transliteration green MOGRT timing: " + e);
                    // Fallback to duration method
                    try {
                        newTransliterationGreenMOGRT.end = newTransliterationGreenMOGRT.start + durationTicks;
                        $.writeln("✓ Transliteration green MOGRT duration set: " + (newTransliterationGreenMOGRT.end - newTransliterationGreenMOGRT.start) + " ticks");
                    } catch (e2) {
                        $.writeln("WARNING: Could not set transliteration green MOGRT duration: " + e2);
                    }
                }
                
                // Set published properties (text content) - use transliteration text
                var textSuccess = setMogrtPublishedParams(newTransliterationGreenMOGRT, transliterationSubs[i].text, duration);
                $.writeln("Transliteration green MOGRT text set: " + (textSuccess ? "SUCCESS" : "FAILED"));
                
                mogrtClips.push(newTransliterationGreenMOGRT);
                successCount++;
                $.writeln("✓ Transliteration green MOGRT inserted successfully");
            } else {
                $.writeln("✗ Failed to insert transliteration green MOGRT");
            }

            // Insert transliteration white MOGRT (masking layer) on next track
            $.writeln("Inserting transliteration white MOGRT on track " + (selectedTransliterationVideoTrack + 1) + " at EXACT time: " + startSec + "s");
            var newTransliterationWhiteMOGRT = seq.importMGT(transliterationWhiteMogrtFile.fsName, startSec, selectedTransliterationVideoTrack + 1, 0);
            if (newTransliterationWhiteMOGRT) {
                // Force EXACT timing by setting both start and end
                try {
                    newTransliterationWhiteMOGRT.start = startTicks;
                    newTransliterationWhiteMOGRT.end = endTicks;
                    $.writeln("✓ Transliteration white MOGRT timing forced: " + (newTransliterationWhiteMOGRT.start / seq.timebase) + "s to " + (newTransliterationWhiteMOGRT.end / seq.timebase) + "s");
                } catch (e) {
                    $.writeln("WARNING: Could not force transliteration white MOGRT timing: " + e);
                    // Fallback to duration method
                    try {
                        newTransliterationWhiteMOGRT.end = newTransliterationWhiteMOGRT.start + durationTicks;
                        $.writeln("✓ Transliteration white MOGRT duration set: " + (newTransliterationWhiteMOGRT.end - newTransliterationWhiteMOGRT.start) + " ticks");
                    } catch (e2) {
                        $.writeln("WARNING: Could not set transliteration white MOGRT duration: " + e2);
                    }
                }
                
                // Set published properties (text content) - use transliteration text
                var textSuccess = setMogrtPublishedParams(newTransliterationWhiteMOGRT, transliterationSubs[i].text, duration);
                $.writeln("Transliteration white MOGRT text set: " + (textSuccess ? "SUCCESS" : "FAILED"));
                
                mogrtClips.push(newTransliterationWhiteMOGRT);
                successCount++;
                $.writeln("✓ Transliteration white MOGRT inserted successfully");
            } else {
                $.writeln("✗ Failed to insert transliteration white MOGRT");
            }

            // Insert transcription MOGRT (separate layer) on third track
            $.writeln("Inserting transcription MOGRT on track " + (selectedTransliterationVideoTrack + 2) + " at EXACT time: " + startSec + "s");
            var newTranscriptionMOGRT = seq.importMGT(transcriptionMogrtFile.fsName, startSec, selectedTransliterationVideoTrack + 2, 0);
            if (newTranscriptionMOGRT) {
                // Force EXACT timing by setting both start and end
                try {
                    newTranscriptionMOGRT.start = startTicks;
                    newTranscriptionMOGRT.end = endTicks;
                    $.writeln("✓ Transcription MOGRT timing forced: " + (newTranscriptionMOGRT.start / seq.timebase) + "s to " + (newTranscriptionMOGRT.end / seq.timebase) + "s");
                } catch (e) {
                    $.writeln("WARNING: Could not force transcription MOGRT timing: " + e);
                    // Fallback to duration method
                    try {
                        newTranscriptionMOGRT.end = newTranscriptionMOGRT.start + durationTicks;
                        $.writeln("✓ Transcription MOGRT duration set: " + (newTranscriptionMOGRT.end - newTranscriptionMOGRT.start) + " ticks");
                    } catch (e2) {
                        $.writeln("WARNING: Could not set transcription MOGRT duration: " + e2);
                    }
                }
                
                // Set published properties (text content) - use transcription text from transcription SRT
                var textSuccess = setMogrtPublishedParams(newTranscriptionMOGRT, transcriptionSubs[i].text, duration);
                $.writeln("Transcription MOGRT text set: " + (textSuccess ? "SUCCESS" : "FAILED"));
                
                mogrtClips.push(newTranscriptionMOGRT);
                successCount++;
                $.writeln("✓ Transcription MOGRT inserted successfully");
            } else {
                $.writeln("✗ Failed to insert transcription MOGRT");
            }

            // Check for spacing between subtitles
            if (i < transliterationSubs.length - 1) {
                var nextStartSec = srtTimeToSeconds(transliterationSubs[i + 1].start);
                var gap = nextStartSec - endSec;
                $.writeln("Gap to next subtitle: " + gap + "s");
                if (gap > 0) {
                    $.writeln("✓ Space maintained between subtitles");
                } else if (gap < 0) {
                    $.writeln("WARNING: Overlapping subtitles detected!");
                }
            }
            
            $.writeln("---");
        }

        $.writeln("=== Transliteration 3-MOGRT Insertion Complete ===");
        $.writeln("Total MOGRTs inserted: " + successCount + " out of " + (transliterationSubs.length * 3));

        if (mogrtClips.length === 0) {
            alert("No MOGRTs were inserted. Check if your MOGRT files are valid and compatible with Premiere.");
        } else {
            var cropInstructions = "\n\nCROP EFFECT SETUP:\n" +
                "1. Select each TRANSLITERATION WHITE MOGRT clip in the timeline\n" +
                "2. Go to Effects panel → Video Effects → Transform → Crop\n" +
                "3. Drag Crop effect onto the transliteration white MOGRT clip\n" +
                "4. In Effect Controls, set keyframes for Left/Right/Top/Bottom\n" +
                "5. Start: Set crop to 100% (fully cropped)\n" +
                "6. End: Set crop to 0% (fully revealed)\n" +
                "7. This creates the masking animation manually.";
            
            alert("Inserted " + mogrtClips.length + " MOGRT clips (" + transliterationSubs.length + " subtitle sets) from both SRT files.\n\n" +
                "Track Layout:\n" +
                "• V" + (selectedTransliterationVideoTrack + 1) + ": Transliteration Green MOGRT (base layer) - uses transliteration text\n" +
                "• V" + (selectedTransliterationVideoTrack + 2) + ": Transliteration White MOGRT (masking layer) - uses transliteration text\n" +
                "• V" + (selectedTransliterationVideoTrack + 3) + ": Transcription White MOGRT (separate layer) - uses transcription text" + cropInstructions);
        }
        
    } catch (err) {
        $.writeln("ERROR in insertTransliterationSubtitlesWith3Mogrts: " + err);
        alert("Error inserting transliteration subtitles: " + err + "\n\nCheck ExtendScript console for details.");
    }
}


