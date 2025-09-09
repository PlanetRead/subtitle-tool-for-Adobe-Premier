var subtitleLines = [];
var currentIndex = 0;
var subtitleMode = 'color'; 
var mogrtClips = [];
var selectedVideoTrack = 1; 


var selectedSrtPath = null; 
var selectedMogrtPath = null;
var selectedMogrtPath2 = null;
var selectedAnimatedMogrtPath = null; 
var selectedTransliterationGreenMogrtPath = null; 
var selectedTransliterationWhiteMogrtPath = null; 
var selectedTranscriptionMogrtPath = null; 



var selectedColorMode = "manual"; 

var selectedTextFilePath = null; 
var manualTimingPoints = []; 
var currentTextLineIndex = 0; 
var textFileLines = []; 

function setSubtitleMode(mode) {
    if (mode === 'color') {
        subtitleMode = mode;
        alert("Subtitle mode set to: " + mode);
    } else {
        alert("Invalid subtitle mode for color subtitles: " + mode);
    }
}


function parseSRT(srtText) {
    var lines = srtText.split(/\r?\n/);
     for (var j = 0; j < lines.length; j++) {
        if (typeof lines[j] !== "string") {
            lines[j] = ""; 
        }
    }
    var entries = [];
    var i = 0;
    $.writeln("Parsing SRT with " + lines.length + " lines");
    
    while (i < lines.length) {
  
        if (!lines[i] || !/^\d+$/.test(lines[i])) { i++; continue; }
        i++;
     
        var timeMatch = lines[i] && lines[i].match(/(\d{2}):(\d{2}):(\d{2}),(\d{3}) --> (\d{2}):(\d{2}):(\d{2}),(\d{3})/);
        if (!timeMatch) { i++; continue; }
        var start = {
            hours: parseInt(timeMatch[1]),
            minutes: parseInt(timeMatch[2]),
            seconds: parseInt(timeMatch[3]),
            milliseconds: parseInt(timeMatch[4])
        };
        var end = {
            hours: parseInt(timeMatch[5]),
            minutes: parseInt(timeMatch[6]),
            seconds: parseInt(timeMatch[7]),
            milliseconds: parseInt(timeMatch[8])
        };
        i++;
      
        var text = '';
        while (i < lines.length && lines[i] && typeof lines[i] === "string" && lines[i].trim() !== '') {
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
    
       while (
    i < lines.length &&
    typeof lines[i] === "string" &&
    lines[i].trim() === ''
) i++;
    }
    
    $.writeln("Parsed " + entries.length + " subtitle entries");
    return entries;
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
        
        
        var textSet = false;
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
                
              
                if (propName === "Subtitle Text" || propName === "Text" || propName === "Source Text" || 
                    propName === "Text Content" || propName === "Display Text" || propName === "Caption Text" ||
                    propName.toLowerCase().indexOf("text") !== -1 || propName.toLowerCase().indexOf("subtitle") !== -1 ||
                    propName.toLowerCase().indexOf("caption") !== -1 || propName.toLowerCase().indexOf("content") !== -1) {
                    $.writeln("✓ Found text property: " + propName);
                    try {
                       
                        prop.setValue(subtitleText, true);
                        $.writeln("✓ Successfully set " + propName + " to: " + subtitleText);
                        textSet = true;
                        break;
                    } catch (e) {
                        $.writeln("✗ Failed to set " + propName + ": " + e);
                        
                       
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
        
     
        if (!textSet) {
            $.writeln("--- Method 4: Recursive property search (Foreign Language) ---");
            function searchProperties(obj, depth) {
                if (depth > 3) return false; // Prevent infinite recursion
                
                if (obj.properties && obj.properties.numItems) {
                    for (var i = 0; i < obj.properties.numItems; i++) {
                        var prop = obj.properties[i];
                        var propName = prop.displayName || prop.name || "";
                        
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
        
     
        if (!textSet) {
            $.writeln("--- Method 5: Setting name property (Foreign Language) ---");
            try {
                mgtClip.name = subtitleText;
                $.writeln("✓ Set MOGRT name to: " + subtitleText);
                textSet = true;
            } catch (e) {
                $.writeln("✗ Failed to set name: " + e);
          
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
        
      
        if (!textSet) {
            $.writeln("--- Method 6: Custom foreign language properties ---");
            try {
             
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
                       
                    }
                }
            } catch (e) {
                $.writeln("✗ Failed custom properties method: " + e);
            }
        }
        
  
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

// Function to show manual crop instructions
function showManualCropInstructions() {
    var instructions = "MANUAL CROP INSTRUCTIONS:\n\n" +
        "1. Select the WHITE MOGRT clip in your timeline\n" +
        "2. Go to Effects panel THEN Video Effects THEN Transform THEN Crop\n" +
        "3. Drag the Crop effect onto the white MOGRT clip\n" +
        "4. In the Effect Controls panel, find the Crop effect\n" +
        "5. Set keyframes for the crop direction you want:\n" +
        "   Left-to-Right: Keyframe 'Left' from 0% to 100%\n" +
        "   Center Reveal: Keyframe 'Top' and 'Bottom' from 0% to 50%\n" +
        "   Random: Choose any direction (Left, Right, Top, Bottom)\n" +
        "6. Set the first keyframe at the start of the clip (0%)\n" +
        "7. Set the second keyframe at the end of the clip (100%)\n\n" +
        "This creates a masking animation where white text reveals over green text!";
    
    alert(instructions);
}



// Let user pick SRT in host dialog and return its fsName to JS
function selectSrtFile() {
    var srtFile = File.openDialog("Select your SRT subtitle file", "*.srt");
    if (!srtFile) {
        alert("No SRT file selected.");
        return "";
    }
    selectedSrtPath = srtFile.fsName;
    $.writeln("=== selectSrtFile DEBUG ===");
    $.writeln("Original file name: " + srtFile.name);
    $.writeln("File fsName: " + srtFile.fsName);
    $.writeln("File path: " + srtFile.path);
    $.writeln("Stored path: " + selectedSrtPath);
    $.writeln("Path length: " + selectedSrtPath.length);
    
    // Test if file exists
    var testFile = new File(selectedSrtPath);
    $.writeln("File exists: " + testFile.exists);
    
    return selectedSrtPath;
}

// Let user pick MOGRT and return its fsName
function selectMogrtFile() {
    var mogrtFile = File.openDialog("Select your white text MOGRT file", "*.mogrt");
    if (!mogrtFile) {
        alert("No MOGRT file selected.");
        return "";
    }
    selectedMogrtPath = mogrtFile.fsName;
    $.writeln("White MOGRT path stored in JSX: " + selectedMogrtPath);
    return selectedMogrtPath;
}

// Let user pick second MOGRT (e.g., green text)
function selectMogrtFile2() {
    var mogrtFile = File.openDialog("Select your green text MOGRT file", "*.mogrt");
    if (!mogrtFile) {
        alert("No second MOGRT file selected.");
        return "";
    }
    selectedMogrtPath2 = mogrtFile.fsName;
    $.writeln("Green MOGRT path stored in JSX: " + selectedMogrtPath2);
    return selectedMogrtPath2;
}

// Let user pick animated MOGRT and return its fsName
function selectAnimatedMogrtFile() {
    var mogrtFile = File.openDialog("Select your animated MOGRT file", "*.mogrt");
    if (!mogrtFile) {
        alert("No animated MOGRT file selected.");
        return "";
    }
    selectedAnimatedMogrtPath = mogrtFile.fsName;
    $.writeln("Animated MOGRT path stored in JSX: " + selectedAnimatedMogrtPath);
    return selectedAnimatedMogrtPath;
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



function formatTime(seconds) {
    var hours = Math.floor(seconds / 3600);
    var minutes = Math.floor((seconds % 3600) / 60);
    var secs = Math.floor(seconds % 60);
    var milliseconds = Math.floor((seconds % 1) * 1000);
    

    var hoursStr = (hours < 10) ? "0" + hours : hours.toString();
    var minutesStr = (minutes < 10) ? "0" + minutes : minutes.toString();
    var secsStr = (secs < 10) ? "0" + secs : secs.toString();
    var msStr = (milliseconds < 100) ? ((milliseconds < 10) ? "00" + milliseconds : "0" + milliseconds) : milliseconds.toString();
    
    return hoursStr + ":" + minutesStr + ":" + secsStr + "." + msStr;
}


// Show current color transition settings
function showColorTransitionSettings() {
    var settings = "CURRENT COLOR TRANSITION SETTINGS:\n\n" +
        "Color Mode: " + selectedColorMode + "\n" +
        "Crop Transition Style: " + selectedCropTransitionStyle + "\n" +
        "Video Track: V" + (selectedVideoTrack + 1) + " (green) and V" + (selectedVideoTrack + 2) + " (white)\n\n" +
        "Text File: " + (selectedTextFilePath ? "Loaded (" + textFileLines.length + " lines)" : "Not loaded") + "\n" +
        "White MOGRT: " + (selectedMogrtPath ? "Selected" : "Not selected") + "\n" +
        "Green MOGRT: " + (selectedMogrtPath2 ? "Selected" : "Not selected") + "\n\n" +
        "Manual Timing Progress: " + getManualTimingStatus();
    
    alert(settings);
}

// Debug function to check stored paths
function debugStoredPaths() {
    $.writeln("=== DEBUG: JSX Global Variables ===");
    $.writeln("selectedSrtPath: " + (selectedSrtPath || "null"));
    $.writeln("selectedMogrtPath: " + (selectedMogrtPath || "null"));
    $.writeln("selectedMogrtPath2: " + (selectedMogrtPath2 || "null"));
    $.writeln("selectedAnimatedMogrtPath: " + (selectedAnimatedMogrtPath || "null"));
    
    alert("JSX Global Variables:\nSRT: " + (selectedSrtPath || "null") + "\nWhite MOGRT: " + (selectedMogrtPath || "null") + "\nGreen MOGRT: " + (selectedMogrtPath2 || "null") + "\nAnimated MOGRT: " + (selectedAnimatedMogrtPath || "null"));
}

// Debug function that accepts paths from JavaScript
function debugPathsFromJS(srtPath, whiteMogrtPath, greenMogrtPath) {
    $.writeln("=== DEBUG: Paths from JavaScript ===");
    $.writeln("SRT from JS: " + (srtPath || "null"));
    $.writeln("White MOGRT from JS: " + (whiteMogrtPath || "null"));
    $.writeln("Green MOGRT from JS: " + (greenMogrtPath || "null"));
    
    alert("Paths from JavaScript:\nSRT: " + (srtPath || "null") + "\nWhite MOGRT: " + (whiteMogrtPath || "null") + "\nGreen MOGRT: " + (greenMogrtPath || "null"));
}

// Function to set the video track for MOGRT insertion
function setVideoTrack(trackNumber) {
    selectedVideoTrack = trackNumber;
    alert("MOGRT will be inserted on Video Track " + (selectedVideoTrack + 1) + " (V" + (selectedVideoTrack + 1) + ").");
}

// Function to set color mode
function setColorMode(mode) {
    selectedColorMode = mode;
    $.writeln("Color mode set to: " + mode);
    alert("Color mode set to: " + mode);
}

// Function to set color transition mode for manual crop method
function setColorTransitionMode(mode) {
    selectedColorMode = mode;
    selectedCropTransitionStyle = mode; // Also set crop transition style
    $.writeln("Color transition mode set to: " + mode);
    alert("Color transition mode set to: " + mode + "\n\nThis will be used for automatic crop effects in the manual text method.");
}

// Function to set crop transition style
function setCropTransitionStyle(style) {
    selectedCropTransitionStyle = style;
    alert("Crop transition style set to: " + style);
}

// Main function to insert both MOGRTs with crop effects
function insertBothMogrtsFromFiles(srtFilePath, mogrtFilePath1, mogrtFilePath2) {
    try {
        $.writeln("insertBothMogrtsFromFiles called");
        $.writeln("SRT: " + srtFilePath);
        $.writeln("White MOGRT: " + mogrtFilePath1);
        $.writeln("Green MOGRT: " + mogrtFilePath2);
        
        if (!srtFilePath || !mogrtFilePath1 || !mogrtFilePath2) {
            alert("Please provide all three file paths.");
        return;
    }
        if (!app.project) {
            alert("No active project found.");
            return;
        }

        var srtFile = new File(srtFilePath);
        var mogrtFile1 = new File(mogrtFilePath1); // White MOGRT
        var mogrtFile2 = new File(mogrtFilePath2); // Green MOGRT

        if (!srtFile.exists) {
            alert("SRT file not found: " + srtFilePath);
        return;
    }
        if (!mogrtFile1.exists) {
            alert("White MOGRT file not found: " + mogrtFilePath1);
            return;
        }
        if (!mogrtFile2.exists) {
            alert("Green MOGRT file not found: " + mogrtFilePath2);
            return;
        }

        if (!srtFile.open("r")) {
            alert("Failed to open SRT file.");
            return;
        }

        var srtText = srtFile.read();
        srtFile.close();
        var subs = parseSRT(srtText);
        if (!subs.length) {
            alert("No valid subtitles found in SRT.");
            return;
        }

        var seq = app.project.activeSequence;
        if (!seq) {
            alert("No active sequence.");
        return;
    }

        $.writeln("Found " + subs.length + " subtitle entries");
        $.writeln("Sequence: " + seq.name);
        $.writeln("Sequence timebase: " + seq.timebase);

        // Ensure we have enough video tracks (need 2 tracks for both MOGRTs)
        while (seq.videoTracks.numTracks <= selectedVideoTrack + 1) {
            seq.videoTracks.addTrack();
        }

        mogrtClips = [];
        var successCount = 0;

        for (var i = 0; i < subs.length; i++) {
            $.writeln("=== Processing subtitle " + (i + 1) + " of " + subs.length + " ===");
            
            var startSec = srtTimeToSeconds(subs[i].start);
            var endSec = srtTimeToSeconds(subs[i].end);
            var duration = endSec - startSec;

            $.writeln("Subtitle: '" + subs[i].text + "'");
            $.writeln("Start time: " + startSec + "s (" + subs[i].start.hours + ":" + subs[i].start.minutes + ":" + subs[i].start.seconds + "," + subs[i].start.milliseconds + ")");
            $.writeln("End time: " + endSec + "s (" + subs[i].end.hours + ":" + subs[i].end.minutes + ":" + subs[i].end.seconds + "," + subs[i].end.milliseconds + ")");
            $.writeln("Duration: " + duration + "s");

            // Convert to Premiere Pro time units (ticks) - EXACT timing
            var startTicks = Math.round(startSec * seq.timebase);
            var endTicks = Math.round(endSec * seq.timebase);
            var durationTicks = endTicks - startTicks;

            $.writeln("Start ticks: " + startTicks);
            $.writeln("End ticks: " + endTicks);
            $.writeln("Duration ticks: " + durationTicks);

            // Insert green MOGRT (base layer) on selected track - EXACT timing
            $.writeln("Inserting green MOGRT on track " + selectedVideoTrack + " at EXACT time: " + startSec + "s");
            var newMOGRT2 = seq.importMGT(mogrtFile2.fsName, startSec, selectedVideoTrack, 0);
            if (newMOGRT2) {
                // Force EXACT timing by setting both start and end
                try {
                    newMOGRT2.start = startTicks;
                    newMOGRT2.end = endTicks;
                    $.writeln("Green MOGRT timing forced: " + (newMOGRT2.start / seq.timebase) + "s to " + (newMOGRT2.end / seq.timebase) + "s");
    } catch (e) {
                    $.writeln("WARNING: Could not force green MOGRT timing: " + e);
                    // Fallback to duration method
                    try {
                        newMOGRT2.end = newMOGRT2.start + durationTicks;
                        $.writeln("Green MOGRT duration set: " + (newMOGRT2.end - newMOGRT2.start) + " ticks");
                        $.writeln("Green MOGRT end time: " + (newMOGRT2.end / seq.timebase) + "s");
                    } catch (e2) {
                        $.writeln("WARNING: Could not set green MOGRT duration: " + e2);
                    }
                }
                
                // Set published properties (text content)
                var textSuccess = setMogrtPublishedParams(newMOGRT2, subs[i].text, duration);
                $.writeln("Green MOGRT text set: " + (textSuccess ? "SUCCESS" : "FAILED"));
                
                mogrtClips.push(newMOGRT2);
                successCount++;
                $.writeln("Green MOGRT inserted successfully");
            } else {
                $.writeln("Failed to insert green MOGRT");
            }

            // Insert white MOGRT (masking layer) on next track - EXACT timing
            $.writeln("Inserting white MOGRT on track " + (selectedVideoTrack + 1) + " at EXACT time: " + startSec + "s");
            var newMOGRT1 = seq.importMGT(mogrtFile1.fsName, startSec, selectedVideoTrack + 1, 0);
            if (newMOGRT1) {
                // Force EXACT timing by setting both start and end
                try {
                    newMOGRT1.start = startTicks;
                    newMOGRT1.end = endTicks;
                    $.writeln("White MOGRT timing forced: " + (newMOGRT1.start / seq.timebase) + "s to " + (newMOGRT1.end / seq.timebase) + "s");
                } catch (e) {
                    $.writeln("WARNING: Could not force white MOGRT timing: " + e);
                    // Fallback to duration method
                    try {
                        newMOGRT1.end = newMOGRT1.start + durationTicks;
                        $.writeln("White MOGRT duration set: " + (newMOGRT1.end - newMOGRT1.start) + " ticks");
                        $.writeln("White MOGRT end time: " + (newMOGRT1.end / seq.timebase) + "s");
                    } catch (e2) {
                        $.writeln("WARNING: Could not set white MOGRT duration: " + e2);
                    }
                }
                
                // Set published properties (text content)
                var textSuccess = setMogrtPublishedParams(newMOGRT1, subs[i].text, duration);
                $.writeln("White MOGRT text set: " + (textSuccess ? "SUCCESS" : "FAILED"));
                
                mogrtClips.push(newMOGRT1);
                successCount++;
                $.writeln("✓ White MOGRT inserted successfully");
            } else {
                $.writeln("✗ Failed to insert white MOGRT");
            }

            // Check for spacing between subtitles
            if (i < subs.length - 1) {
                var nextStartSec = srtTimeToSeconds(subs[i + 1].start);
                var gap = nextStartSec - endSec;
                $.writeln("Gap to next subtitle: " + gap + "s");
                if (gap > 0) {
                    $.writeln("Space maintained between subtitles");
                } else if (gap < 0) {
                    $.writeln("WARNING: Overlapping subtitles detected!");
                }
            }
            
            $.writeln("---");
        }

        $.writeln("=== Insertion Complete ===");
        $.writeln("Total MOGRTs inserted: " + successCount + " out of " + (subs.length * 2));

    if (mogrtClips.length === 0) {
            alert("No MOGRTs were inserted. Check if your MOGRT files are valid and compatible with Premiere.");
        } else {
            var cropInstructions = "";
            if (selectedCropTransitionStyle !== "none") {
                cropInstructions = "\n\nCROP EFFECT SETUP:\n" +
                    "1. Select each WHITE MOGRT clip in the timeline\n" +
                    "2. Go to Effects panel -> Video Effects -> Transform -> Crop\n" +
                    "3. Drag Crop effect onto the white MOGRT clip\n" +
                    "4. In Effect Controls, set keyframes for Left/Right/Top/Bottom\n" +
                    "5. Start: Set crop to 100% (fully cropped)\n" +
                    "6. End: Set crop to 0% (fully revealed)\n" +
                    "7. This creates the masking animation manually.";
            }
            
            alert("Inserted " + mogrtClips.length + " MOGRT clips (" + subs.length + " subtitle pairs) from SRT.\n\nGreen text on V" + (selectedVideoTrack + 1) + ", white text on V" + (selectedVideoTrack + 2) + "." + cropInstructions);
        }
        
    } catch (err) {
        $.writeln("ERROR in insertBothMogrtsFromFiles: " + err);
        alert("Error inserting MOGRTs: " + err + "\n\nCheck ExtendScript console for details.");
    }
}

// Insert both MOGRTs simultaneously for each subtitle
function insertBothMogrtsFromSelectedFiles() {
    $.writeln("=== insertBothMogrtsFromSelectedFiles called ===");
    $.writeln("selectedSrtPath: " + (selectedSrtPath || "null"));
    $.writeln("selectedMogrtPath: " + (selectedMogrtPath || "null"));
    $.writeln("selectedMogrtPath2: " + (selectedMogrtPath2 || "null"));
    
    if (!selectedSrtPath) {
        alert("Please select SRT file first using 'Set Text' button.");
        return;
    }
    
    if (!selectedMogrtPath) {
        alert("Please select white MOGRT file first using 'Set White MOGRT' button.");
        return;
    }
    
    if (!selectedMogrtPath2) {
        alert("Please select green MOGRT file first using 'Set Green MOGRT' button.");
        return;
    }
    
    $.writeln("All files selected, proceeding with insertion...");
    insertBothMogrtsFromFiles(selectedSrtPath, selectedMogrtPath, selectedMogrtPath2);
}

// Reset function for color mode
function resetSubtitles() {
    subtitleLines = [];
    currentIndex = 0;
    mogrtClips = [];
    
    if (app.project && app.project.activeSequence && app.project.activeSequence.markers) {
        var markers = app.project.activeSequence.markers;
        var marker = markers.getFirst();
        while (marker) {
            var nextMarker = markers.getNext();
            if (marker.name === "Color Subtitle") {
                markers.remove(marker);
            }
            marker = nextMarker;
        }
    }
    
    // Remove MOGRT clips from video tracks
    if (app.project && app.project.activeSequence && app.project.activeSequence.videoTracks.numTracks > 1) {
        for (var trackNum = 1; trackNum <= 2; trackNum++) {
            if (app.project.activeSequence.videoTracks.numTracks > trackNum) {
                var videoTrack = app.project.activeSequence.videoTracks[trackNum];
        for (var i = videoTrack.clips.numItems - 1; i >= 0; i--) {
            var clip = videoTrack.clips[i];
                    if (clip && clip.name && (clip.name.indexOf("mogrt") !== -1 || clip.name.indexOf("MOGRT") !== -1)) {
                videoTrack.removeClip(clip);
                    }
                }
            }
        }
    }
    
    alert("Color subtitles, timeline markers, and MOGRT clips have been reset.");
    $.writeln("Color subtitles, markers, and MOGRT clips reset.");
} 

// Function to reset color subtitles
function resetColorSubtitles() {
    try {
        // Clear stored paths
        selectedSrtPath = null;
        selectedMogrtPath = null;
        selectedMogrtPath2 = null;
        selectedAnimatedMogrtPath = null;
        
        // Clear manual timing data
        selectedTextFilePath = null;
        manualTimingPoints = [];
        currentTextLineIndex = 0;
        textFileLines = [];
        
        // Clear MOGRT clips array
        mogrtClips = [];
        
        // Reset to default values
        selectedVideoTrack = 1;
        selectedColorMode = "manual";
        selectedCropTransitionStyle = "wipe";
        
        $.writeln("Color subtitles reset successfully");
        alert("Color subtitles have been reset. All file selections and manual timing data cleared.");
        
    } catch (err) {
        $.writeln("ERROR in resetColorSubtitles: " + err);
        alert("Error resetting color subtitles: " + err);
    }
}






// Function to provide instructions for manual crop effect application
function addCropToSelectedMogrts() {
    try {
        var seq = app.project.activeSequence;
        if (!seq) {
            alert("No active sequence found.");
            return;
        }
        
        // Get selected clips
        var selectedClips = seq.getSelection();
        if (!selectedClips || selectedClips.length === 0) {
            alert("Please select one or more MOGRT clips first.");
            return;
        }
        
        var instructions = "MANUAL CROP EFFECT SETUP:\n\n" +
            "Selected clips: " + selectedClips.length + "\n\n" +
            "For each selected MOGRT clip:\n" +
            "1. Select the clip in the timeline\n" +
            "2. Go to Effects panel → Video Effects → Transform → Crop\n" +
            "3. Drag Crop effect onto the clip\n" +
            "4. In Effect Controls panel, find the Crop effect\n" +
            "5. Set keyframes for 'Left' property:\n" +
            "   • Start: Set to 0 (fully visible)\n" +
            "   • End: Set to 100 (fully cropped)\n\n" +
            "This creates the masking animation manually.\n\n" +
            "Note: MOGRT clips require manual effect application.";
        
        alert(instructions);
        
    } catch (err) {
        $.writeln("ERROR: " + err);
        alert("Error: " + err);
    }
}



// Function for Animated MOGRT Mode - uses user-selected animated MOGRT file
function insertAnimatedMogrtsFromSRT(srtFilePath, animatedMogrtFilePath) {
    try {
        $.writeln("=== Animated MOGRT Mode ===");
        $.writeln("SRT file: " + srtFilePath);
        $.writeln("Animated MOGRT file: " + animatedMogrtFilePath);
        
        if (!srtFilePath) {
            alert("Please provide SRT file path.");
            return;
        }
        if (!animatedMogrtFilePath) {
            alert("Please provide animated MOGRT file path.");
            return;
        }
        if (!app.project) {
            alert("No active project found.");
            return;
        }

        // Use the user-selected animated MOGRT file
        var mogrtFile = new File(animatedMogrtFilePath);
        if (!mogrtFile.exists) {
            alert("Animated MOGRT file not found: " + animatedMogrtFilePath);
            return;
        }

        var srtFile = new File(srtFilePath);
        if (!srtFile.exists) {
            alert("SRT file not found: " + srtFilePath);
        return;
    }
    
    if (!srtFile.open("r")) {
        alert("Failed to open SRT file.");
        return;
    }

    var srtText = srtFile.read();
    srtFile.close();
    var subs = parseSRT(srtText);
    if (!subs.length) {
        alert("No valid subtitles found in SRT.");
        return;
    }

    var seq = app.project.activeSequence;
    if (!seq) {
        alert("No active sequence.");
        return;
    }

        $.writeln("Found " + subs.length + " subtitle entries");
        $.writeln("Sequence: " + seq.name);
        $.writeln("Animated MOGRT: " + mogrtFile.fsName);
    
    // Ensure we have enough video tracks
    while (seq.videoTracks.numTracks <= selectedVideoTrack) {
        seq.videoTracks.addTrack();
    }
    
    mogrtClips = [];
        var successCount = 0;
    
    for (var i = 0; i < subs.length; i++) {
            $.writeln("=== Processing subtitle " + (i + 1) + " of " + subs.length + " ===");
            
        var startSec = srtTimeToSeconds(subs[i].start);
        var endSec = srtTimeToSeconds(subs[i].end);
        var duration = endSec - startSec;
        
            $.writeln("Subtitle: '" + subs[i].text + "'");
            $.writeln("Start time: " + startSec + "s (" + subs[i].start.hours + ":" + subs[i].start.minutes + ":" + subs[i].start.seconds + "," + subs[i].start.milliseconds + ")");
            $.writeln("End time: " + endSec + "s (" + subs[i].end.hours + ":" + subs[i].end.minutes + ":" + subs[i].end.seconds + "," + subs[i].end.milliseconds + ")");
            $.writeln("Duration: " + duration + "s");

            // Convert to Premiere Pro time units (ticks)
            var startTicks = Math.round(startSec * seq.timebase);
            var endTicks = Math.round(endSec * seq.timebase);
            var durationTicks = endTicks - startTicks;

            $.writeln("Start ticks: " + startTicks);
            $.writeln("End ticks: " + endTicks);
            $.writeln("Duration ticks: " + durationTicks);

            // Insert animated MOGRT on selected track
            $.writeln("Inserting animated MOGRT on track " + selectedVideoTrack + " at EXACT time: " + startSec + "s");
            var newMOGRT = seq.importMGT(mogrtFile.fsName, startSec, selectedVideoTrack, 0);
            if (newMOGRT) {
                // Set exact duration for the clip
                try {
                    newMOGRT.end = newMOGRT.start + durationTicks;
                    $.writeln("✓ Animated MOGRT duration set: " + (newMOGRT.end - newMOGRT.start) + " ticks");
                    $.writeln("✓ Animated MOGRT end time: " + (newMOGRT.end / seq.timebase) + "s");
                    } catch (e) {
                    $.writeln("WARNING: Could not set animated MOGRT duration: " + e);
                }
                
                // Set published properties (text content)
                var textSuccess = setMogrtPublishedParams(newMOGRT, subs[i].text, duration);
                $.writeln("Animated MOGRT text set: " + (textSuccess ? "SUCCESS" : "FAILED"));
                
                mogrtClips.push(newMOGRT);
                successCount++;
                $.writeln("✓ Animated MOGRT inserted successfully");
            } else {
                $.writeln("✗ Failed to insert animated MOGRT");
            }

            // Check for spacing between subtitles
            if (i < subs.length - 1) {
                var nextStartSec = srtTimeToSeconds(subs[i + 1].start);
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

        $.writeln("=== Animated MOGRT Insertion Complete ===");
        $.writeln("Total animated MOGRTs inserted: " + successCount + " out of " + subs.length);
    
    if (mogrtClips.length === 0) {
            alert("No animated MOGRTs were inserted. Check if your animated MOGRT file is valid and compatible with Premiere.");
    } else {
            alert("Inserted " + mogrtClips.length + " animated MOGRT clips from SRT.\n\nAnimated MOGRTs on V" + (selectedVideoTrack + 1) + " with perfect SRT timing and text content.");
        }
        
    } catch (err) {
        $.writeln("ERROR in insertAnimatedMogrtsFromSRT: " + err);
        alert("Error inserting animated MOGRTs: " + err + "\n\nCheck ExtendScript console for details.");
    }
} 

// Function to insert animated MOGRTs using stored SRT path
function insertAnimatedMogrtsFromStoredPath() {
    $.writeln("=== insertAnimatedMogrtsFromStoredPath called ===");
    $.writeln("selectedSrtPath: " + (selectedSrtPath || "null"));
    
    if (!selectedSrtPath) {
        alert("Please select SRT file first using 'Set Text' button.");
        return;
    }
    
    if (!selectedAnimatedMogrtPath) {
        alert("Please select animated MOGRT file first using 'Set Animated MOGRT' button.");
        return;
    }
    
    $.writeln("SRT file selected, proceeding with animated MOGRT insertion...");
    insertAnimatedMogrtsFromSRT(selectedSrtPath, selectedAnimatedMogrtPath);
}

// Function to insert transliteration subtitles with 3 MOGRTs (manual mode)
function insertTransliterationSubtitlesWith3Mogrts() {
    try {
        $.writeln("=== insertTransliterationSubtitlesWith3Mogrts called ===");
        $.writeln("Transliteration SRT: " + (selectedSrtPath || "null"));
        $.writeln("Transliteration Green MOGRT: " + (selectedTransliterationGreenMogrtPath || "null"));
        $.writeln("Transliteration White MOGRT: " + (selectedTransliterationWhiteMogrtPath || "null"));
        $.writeln("Transcription MOGRT: " + (selectedTranscriptionMogrtPath || "null"));
        
        if (!selectedSrtPath || !selectedTransliterationGreenMogrtPath || !selectedTransliterationWhiteMogrtPath || !selectedTranscriptionMogrtPath) {
            alert("Please select all required files: Transliteration SRT, Transliteration Green MOGRT, Transliteration White MOGRT, and Transcription MOGRT.");
            return;
        }
        
        if (!app.project) {
            alert("No active project found.");
            return;
        }

        var srtFile = new File(selectedSrtPath);
        var transliterationGreenMogrtFile = new File(selectedTransliterationGreenMogrtPath);
        var transliterationWhiteMogrtFile = new File(selectedTransliterationWhiteMogrtPath);
        var transcriptionMogrtFile = new File(selectedTranscriptionMogrtPath);

        if (!srtFile.exists) {
            alert("Transliteration SRT file not found: " + selectedSrtPath);
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

        if (!srtFile.open("r")) {
            alert("Failed to open transliteration SRT file.");
            return;
        }

        var srtText = srtFile.read();
        srtFile.close();
        var subs = parseSRT(srtText);
        if (!subs.length) {
            alert("No valid subtitles found in transliteration SRT.");
            return;
        }

        var seq = app.project.activeSequence;
        if (!seq) {
            alert("No active sequence.");
            return;
        }

        $.writeln("Found " + subs.length + " transliteration subtitle entries");
        $.writeln("Sequence: " + seq.name);
        $.writeln("Sequence timebase: " + seq.timebase);

        // Ensure we have enough video tracks (need 3 tracks for 3 MOGRTs)
        while (seq.videoTracks.numTracks <= selectedVideoTrack + 2) {
            seq.videoTracks.addTrack();
        }

        mogrtClips = [];
        var successCount = 0;

        for (var i = 0; i < subs.length; i++) {
            $.writeln("=== Processing transliteration subtitle " + (i + 1) + " of " + subs.length + " ===");
            
            var startSec = srtTimeToSeconds(subs[i].start);
            var endSec = srtTimeToSeconds(subs[i].end);
            var duration = endSec - startSec;

            $.writeln("Subtitle: '" + subs[i].text + "'");
            $.writeln("Start time: " + startSec + "s (" + subs[i].start.hours + ":" + subs[i].start.minutes + ":" + subs[i].start.seconds + "," + subs[i].start.milliseconds + ")");
            $.writeln("End time: " + endSec + "s (" + subs[i].end.hours + ":" + subs[i].end.minutes + ":" + subs[i].end.seconds + "," + subs[i].end.milliseconds + ")");
            $.writeln("Duration: " + duration + "s");

            // Convert to Premiere Pro time units (ticks) - EXACT timing
            var startTicks = Math.round(startSec * seq.timebase);
            var endTicks = Math.round(endSec * seq.timebase);
            var durationTicks = endTicks - startTicks;

            $.writeln("Start ticks: " + startTicks);
            $.writeln("End ticks: " + endTicks);
            $.writeln("Duration ticks: " + durationTicks);

            // Insert transliteration green MOGRT (base layer) on selected track
            $.writeln("Inserting transliteration green MOGRT on track " + selectedVideoTrack + " at EXACT time: " + startSec + "s");
            var newTransliterationGreenMOGRT = seq.importMGT(transliterationGreenMogrtFile.fsName, startSec, selectedVideoTrack, 0);
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
                
                // Set published properties (text content)
                var textSuccess = setMogrtPublishedParams(newTransliterationGreenMOGRT, subs[i].text, duration);
                $.writeln("Transliteration green MOGRT text set: " + (textSuccess ? "SUCCESS" : "FAILED"));
                
                mogrtClips.push(newTransliterationGreenMOGRT);
                successCount++;
                $.writeln("✓ Transliteration green MOGRT inserted successfully");
            } else {
                $.writeln("✗ Failed to insert transliteration green MOGRT");
            }

            // Insert transliteration white MOGRT (masking layer) on next track
            $.writeln("Inserting transliteration white MOGRT on track " + (selectedVideoTrack + 1) + " at EXACT time: " + startSec + "s");
            var newTransliterationWhiteMOGRT = seq.importMGT(transliterationWhiteMogrtFile.fsName, startSec, selectedVideoTrack + 1, 0);
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
                
                // Set published properties (text content)
                var textSuccess = setMogrtPublishedParams(newTransliterationWhiteMOGRT, subs[i].text, duration);
                $.writeln("Transliteration white MOGRT text set: " + (textSuccess ? "SUCCESS" : "FAILED"));
                
                mogrtClips.push(newTransliterationWhiteMOGRT);
                successCount++;
                $.writeln("✓ Transliteration white MOGRT inserted successfully");
            } else {
                $.writeln("✗ Failed to insert transliteration white MOGRT");
            }

            // Insert transcription MOGRT (separate layer) on third track
            $.writeln("Inserting transcription MOGRT on track " + (selectedVideoTrack + 2) + " at EXACT time: " + startSec + "s");
            var newTranscriptionMOGRT = seq.importMGT(transcriptionMogrtFile.fsName, startSec, selectedVideoTrack + 2, 0);
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
                
                // Set published properties (text content) - use transliteration text for now
                var textSuccess = setMogrtPublishedParams(newTranscriptionMOGRT, subs[i].text, duration);
                $.writeln("Transcription MOGRT text set: " + (textSuccess ? "SUCCESS" : "FAILED"));
                
                mogrtClips.push(newTranscriptionMOGRT);
                successCount++;
                $.writeln("✓ Transcription MOGRT inserted successfully");
            } else {
                $.writeln("✗ Failed to insert transcription MOGRT");
            }

            // Check for spacing between subtitles
            if (i < subs.length - 1) {
                var nextStartSec = srtTimeToSeconds(subs[i + 1].start);
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
        $.writeln("Total MOGRTs inserted: " + successCount + " out of " + (subs.length * 3));

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
            
            alert("Inserted " + mogrtClips.length + " MOGRT clips (" + subs.length + " subtitle sets) from transliteration SRT.\n\n" +
                "Track Layout:\n" +
                "• V" + (selectedVideoTrack + 1) + ": Transliteration Green MOGRT (base layer)\n" +
                "• V" + (selectedVideoTrack + 2) + ": Transliteration White MOGRT (masking layer)\n" +
                "• V" + (selectedVideoTrack + 3) + ": Transcription White MOGRT (separate layer)" + cropInstructions);
        }
        
    } catch (err) {
        $.writeln("ERROR in insertTransliterationSubtitlesWith3Mogrts: " + err);
        alert("Error inserting transliteration subtitles: " + err + "\n\nCheck ExtendScript console for details.");
    }
} 

// Main function to insert both MOGRTs using stored paths
function insertBothMogrtsFromStoredPaths() {
    try {
        $.writeln("=== insertBothMogrtsFromStoredPaths called ===");
        $.writeln("Stored SRT path: " + (selectedSrtPath || "null"));
        $.writeln("Stored White MOGRT path: " + (selectedMogrtPath || "null"));
        $.writeln("Stored Green MOGRT path: " + (selectedMogrtPath2 || "null"));
        
        if (!selectedSrtPath || !selectedMogrtPath || !selectedMogrtPath2) {
            alert("Please select SRT file, White MOGRT, and Green MOGRT first.");
            return;
        }
        
        // Call the existing function with stored paths
        insertBothMogrtsFromFiles(selectedSrtPath, selectedMogrtPath, selectedMogrtPath2);
        
    } catch (error) {
        $.writeln("ERROR in insertBothMogrtsFromStoredPaths: " + error);
        alert("Error inserting MOGRTs: " + error);
    }
}

// Main function to insert both MOGRTs with crop effects

// Function to insert MOGRT with ultra-precise timing and forced end timing
function insertMogrtWithUltraPreciseTiming(seq, mogrtFilePath, startTimeSeconds, endTimeSeconds, trackIndex) {
    try {
        $.writeln("=== insertMogrtWithUltraPreciseTiming ===");
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

// Function to verify and correct timing (missing function)
function verifyAndCorrectTiming(mogrtClip, expectedStartSeconds, expectedEndSeconds, clipName) {
    try {
        $.writeln("=== verifyAndCorrectTiming for " + clipName + " ===");
        
        if (!mogrtClip) {
            $.writeln("ERROR: MOGRT clip is null");
            return false;
        }
        
        var seq = app.project.activeSequence;
        if (!seq) {
            $.writeln("ERROR: No active sequence");
            return false;
        }
        
        // Get actual timing from clip
        var actualStartTicks = mogrtClip.start;
        var actualEndTicks = mogrtClip.end;
        var actualStartSeconds = actualStartTicks / seq.timebase;
        var actualEndSeconds = actualEndTicks / seq.timebase;
        
        // Convert expected times to ticks
        var expectedStartTicks = Math.round(expectedStartSeconds * seq.timebase);
        var expectedEndTicks = Math.round(expectedEndSeconds * seq.timebase);
        
        $.writeln("Expected: " + expectedStartSeconds + "s to " + expectedEndSeconds + "s");
        $.writeln("Actual: " + actualStartSeconds + "s to " + actualEndSeconds + "s");
        
        // Check if timing is accurate (allow 1 frame tolerance)
        var toleranceFrames = 1;
        var toleranceTicks = toleranceFrames * seq.timebase / seq.frameRate;
        
        var startDiff = Math.abs(actualStartTicks - expectedStartTicks);
        var endDiff = Math.abs(actualEndTicks - expectedEndTicks);
        
        $.writeln("Start difference: " + startDiff + " ticks (tolerance: " + toleranceTicks + ")");
        $.writeln("End difference: " + endDiff + " ticks (tolerance: " + toleranceTicks + ")");
        
        if (startDiff <= toleranceTicks && endDiff <= toleranceTicks) {
            $.writeln("Timing verification PASSED");
            return true;
        } else {
            $.writeln(" Timing verification FAILED - attempting correction");
            
            // Attempt to correct timing
            try {
                mogrtClip.start = expectedStartTicks;
                mogrtClip.end = expectedEndTicks;
                
                // Verify correction
                var correctedStartTicks = mogrtClip.start;
                var correctedEndTicks = mogrtClip.end;
                var correctedStartSeconds = correctedStartTicks / seq.timebase;
                var correctedEndSeconds = correctedEndTicks / seq.timebase;
                
                $.writeln("Corrected: " + correctedStartSeconds + "s to " + correctedEndSeconds + "s");
                
                var correctedStartDiff = Math.abs(correctedStartTicks - expectedStartTicks);
                var correctedEndDiff = Math.abs(correctedEndTicks - expectedEndTicks);
                
                if (correctedStartDiff <= toleranceTicks && correctedEndDiff <= toleranceTicks) {
                    $.writeln("✓ Timing correction SUCCESSFUL");
                    return true;
                } else {
                    $.writeln("✗ Timing correction FAILED");
                    return false;
                }
                
            } catch (e) {
                $.writeln("ERROR during timing correction: " + e);
                return false;
            }
        }
        
    } catch (err) {
        $.writeln("ERROR in verifyAndCorrectTiming: " + err);
        return false;
    }
}

// Enhanced function to convert SRT time to Premiere Pro ticks
function srtTimeToTicks(srtTime, seq) {
    try {
        var seconds = srtTimeToSeconds(srtTime);
        var ticks = Math.round(seconds * seq.timebase);
        $.writeln("SRT time " + srtTime.hours + ":" + srtTime.minutes + ":" + srtTime.seconds + "," + srtTime.milliseconds + " = " + seconds + "s = " + ticks + " ticks");
        return ticks;
    } catch (err) {
        $.writeln("ERROR in srtTimeToTicks: " + err);
        return 0;
    }
}




