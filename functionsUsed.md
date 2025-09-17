# Functions Documentation

## Helper Functions (Used Everywhere)

### getVideoDuration
```javascript
getVideoDuration: function() {
    var activeSeq = app.project.activeSequence;
    if (!activeSeq) {
        return null;
    }
    // ... tries different ways to get video length
    return 60; // gives 60 seconds if nothing works
}
```
Finds out how long your video is. Tries all possible ways to get the video length from Premiere Pro. If it can't figure it out, it just says 60 seconds.

### parseTimeToSeconds
```javascript
parseTimeToSeconds: function(timeStr) {
    if (!timeStr || timeStr === "") return null;
    timeStr = timeStr.replace(/^\s+|\s+$/g, "");
    var regex = /^(\d{1,2}):(\d{1,2}):(\d{1,2})(?:[\.,](\d{1,3}))?$/;
    // ... converts time to seconds
    return isNaN(total) || total < 0 ? null : total;
}
```
Takes a time like "01:30:45" and turns it into seconds (5445). Makes sure the time format is correct. Returns nothing if the time is wrong.

### countWords
```javascript
function countWords(line) {
    var words = line.replace(/(^\s+|\s+$)/g, '').split(/\s+/);
    var count = 0;
    for (var w = 0; w < words.length; w++) if (words[w].length > 0) count++;
    return count;
}
```
Counts how many words are in a line of text. Splits the text by spaces and counts each word. Ignores empty spaces.

### trim
```javascript
function trim(str) {
    return str.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, "");
}
```
Removes extra spaces from the beginning and end of text. Like cleaning up messy text. Works because ExtendScript doesn't have this built-in.

---

## Subtitle Creation Functions

### runSubtitleWorkflow
```javascript
runSubtitleWorkflow: function(timingMode, scriptPath, wordSpacing, startTimeStr, endTimeStr) {
    var seq = app.project.activeSequence;
    if (!seq) {
        return "No active sequence.";
    }
    // ... figures out timing and makes subtitles
    return this.createSubtitlesFromFile(scriptPath, wordSpacing, totalDuration, startTime);
}
```
The main function that creates subtitles. You can choose automatic timing or set your own start/end times. Makes sure there's a video open first.

### createSubtitlesFromFile
```javascript
createSubtitlesFromFile: function(filePath, wordSpacing, totalDuration, startTimeOffset) {
    // reads your script file
    // figures out how long each subtitle should show
    // makes an SRT file and puts it in Premiere Pro
    return "Successfully created caption track from script with dynamic timing.";
}
```
Reads your script file and makes subtitle tracks in Premiere Pro. Each subtitle shows for the right amount of time based on how many words it has. Handles different text languages.

### toSRTTime
```javascript
toSRTTime: function(timeInSeconds) {
    var totalMilliseconds = Math.round(timeInSeconds * 1000);
    var milliseconds = totalMilliseconds % 1000;
    var totalSeconds = Math.floor(totalMilliseconds / 1000);
    // ... converts to HH:MM:SS,mmm format
    return pad(hours, 2) + ":" + pad(minutes, 2) + ":" + pad(seconds, 2) + "," + pad(milliseconds, 3);
}
```
Turns seconds (like 65.5) into subtitle time format (like 00:01:05,500). Makes sure hours, minutes, and seconds always have 2 digits.

### pad
```javascript
function pad(num, size) {
    var s = "000" + num;
    return s.substr(s.length - size);
}
```
Adds zeros to the front of numbers. Turns "5" into "05" or "005". Makes sure time formatting looks nice.

### applyWordSpacing
```javascript
applyWordSpacing: function(line, spacing) {
    var intSpaces = Math.floor(spacing);
    var extra = spacing - intSpaces;
    var spaceStr = Array(intSpaces + 1).join(' ');
    var thinSpace = extra > 0 ? String.fromCharCode(0x2009) : '';
    return line.replace(/ +/g, spaceStr + thinSpace);
}
```
Changes how much space is between words in your subtitles. You can use decimal numbers like 1.5 for more precise spacing. Uses special thin spaces for the decimal part.

### getSep
```javascript
function getSep() {
    if (Folder.fs === 'Macintosh') {
        return '/';
    } else {
        return '\\';
    }
}
```
Gets the right slash for file paths. Mac uses "/" and Windows uses "\". Makes sure file paths work on both systems.

### updateEventPanel
```javascript
function updateEventPanel(message) {
    app.setSDKEventMessage(message, 'info');
}
```
Shows messages in Premiere Pro's Events panel. Tells you what's happening, like "Success!" or "Error reading file". Helps you know if things are working.

---

## Original Text Workflow (Mode 1)

### runMogrtWorkflow (Mode 1 - Originals)
```javascript
runMogrtWorkflow: function(mode, mogrtPath, scriptPath, wordSpacing, videoTrack, mogrtName, translitPath, timingMode, startTimeStr, endTimeStr) {
    // Mode 1: puts original text in MoGRTs
    // figures out timing based on word count
    // adds 0.7 second pause between each subtitle
}
```
Puts your original script text into MoGRT graphics. Each subtitle shows for the right amount of time based on how many words it has. Adds a small pause between each subtitle so they don't overlap.

### getDefaultDurationForWords
```javascript
function getDefaultDurationForWords(wordCount) {
    if (wordCount <= 4) return 3.0;      // short line
    if (wordCount <= 6) return 5.0;      // medium line
    return 6.0;                          // long line
}
```
Decides how long a subtitle should show based on how many words it has. Short lines (4 words or less) show for 3 seconds. Medium lines show for 5 seconds. Long lines show for 6 seconds.

---

## Transliteration Workflow (Mode 2)

### runMogrtWorkflow (Mode 2 - Transliteration)
```javascript
runMogrtWorkflow: function(mode, mogrtPath, scriptPath, wordSpacing, videoTrack, mogrtName, translitPath, timingMode, startTimeStr, endTimeStr) {
    // Mode 2: puts transliterated text in MoGRTs
    // copies exact timing from original MoGRTs
    // matches each line by position
}
```
Puts your transliterated text (like English versions of foreign text) into MoGRT graphics. Copies the exact timing from the original MoGRTs so they match perfectly. Each transliterated line matches with the same numbered original line.

### setMogrtTextValueIfPossible
```javascript
function setMogrtTextValueIfPossible(property, newText) {
    try {
        if (!property) return false;
        var current = property.getValue();
        if (current && (typeof current === 'string') && current.charAt(0) === '{') {
            // looks like JSON data
            var parsed = JSON.parse(current);
            if (parsed && parsed.hasOwnProperty('textEditValue')) {
                parsed.textEditValue = newText;
                property.setValue(JSON.stringify(parsed), true);
                return true;
            }
        }
        property.setValue(newText);
        return true;
    } catch (e) {
        return false;
    }
}
```
Puts text into MoGRT graphics safely. Some MoGRTs store text in a special JSON format, others use simple text. This function tries both ways and picks the one that works. Won't crash if something goes wrong.
