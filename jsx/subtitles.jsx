var subtitleLines = [];
var currentIndex = 0;
var subtitleMode = 'static'; 

function setSubtitleMode(mode) {
    if (mode === 'static') {
        subtitleMode = mode;
        alert("Subtitle mode set to: " + mode);
    } else {
        alert("Invalid subtitle mode for static subtitles: " + mode);
    }
}

// SRT parsing utility
function parseSRT(srtText) {
    var lines = srtText.split(/\r?\n/);
    var entries = [];
    var i = 0;
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
        while (i < lines.length && lines[i] && lines[i].trim() !== '') {
            text += (text ? '\n' : '') + lines[i];
            i++;
        }
        entries.push({
            text: text,
            start: start,
            end: end
        });
        while (i < lines.length && lines[i].trim() === '') i++;
    }
    return entries;
}

function main() {
    subtitleLines = [];
    currentIndex = 0;
    if (!app.project) {
        alert("No active project found.");
        return;
    }
    var file = File.openDialog("Select your subtitle file", "*.txt;*.srt");
    if (!file) {
        alert("No file selected.");
        return;
    }
    if (!file.open("r")) {
        alert("Failed to open file.");
        return;
    }
    var ext = file.name.split('.').pop().toLowerCase();
    if (ext === 'srt') {
        var srtText = file.read();
        file.close();
        var subs = parseSRT(srtText);
        if (!subs.length) {
            alert("No valid subtitles found in SRT.");
            return;
        }
        subtitleLines = subs;
    } else {
        // TXT fallback
        while (!file.eof) {
            var line = file.readln();
            if (line && line.replace(/\s/g, '').length > 0) {
                subtitleLines.push({
                    text: line,
                    start: null,
                    end: null
                });
            }
        }
        file.close();
        if (subtitleLines.length === 0) {
            alert("No valid lines found in the file.");
            return;
        }
    }
    currentIndex = 0;
    alert("Loaded " + subtitleLines.length + " subtitle lines. Ready to mark Start/End for static mode.");
    $.writeln("Loaded " + subtitleLines.length + " subtitle lines for static mode.");
    updateTextBoxWithCurrentSubtitle();
}

function markStart(mode) {
    if (!app.project || !app.project.activeSequence) {
        alert("No active sequence.");
        return;
    }
    if (currentIndex >= subtitleLines.length) {
        updateTextBoxWithCurrentSubtitle();
        return;
    }
    var time = app.project.activeSequence.getPlayerPosition();
    
    // Static mode: toggle start/end on repeated Start clicks
    if (subtitleLines[currentIndex].start === null) {
        // First click: mark start
        var subtitleText = subtitleLines[currentIndex].text;
        subtitleLines[currentIndex].start = time;
        insertSubtitleMarker(time, time, subtitleText);
        updateTextBoxWithCurrentSubtitle();
    } else if (subtitleLines[currentIndex].end === null) {
        // Second click: mark end for current, start next
        if (time.seconds <= subtitleLines[currentIndex].start.seconds) {
            alert("End time must be after Start time.");
            return;
        }
        subtitleLines[currentIndex].end = time;
        insertSubtitleMarker(subtitleLines[currentIndex].start, time, subtitleLines[currentIndex].text);
        currentIndex++;
        if (currentIndex < subtitleLines.length) {
            // Immediately start next subtitle at the same time
            var nextText = subtitleLines[currentIndex].text;
            subtitleLines[currentIndex].start = time;
            insertSubtitleMarker(time, time, nextText);
        }
        updateTextBoxWithCurrentSubtitle();
        saveSubtitleState();
        if (currentIndex >= subtitleLines.length) {
            autoCreateCaptionTrackFromSubtitles();
            return;
        }
    }
}

function toggleStartMark() {
    if (!app.project || !app.project.activeSequence) {
        alert("No active sequence.");
        return;
    }
    if (currentIndex >= subtitleLines.length) {
        updateTextBoxWithCurrentSubtitle();
        return;
    }
    var time = app.project.activeSequence.getPlayerPosition();
    
    if (subtitleLines[currentIndex].start === null) {
        // First click: mark start
        var subtitleText = subtitleLines[currentIndex].text;
        subtitleLines[currentIndex].start = time;
        insertSubtitleMarker(time, time, subtitleText);
        updateTextBoxWithCurrentSubtitle();
        $.writeln("Marked start for subtitle " + (currentIndex + 1) + ": " + subtitleText);
    } else if (subtitleLines[currentIndex].end === null) {
        // Second click: mark end for current, start next
        if (time.seconds <= subtitleLines[currentIndex].start.seconds) {
            alert("End time must be after Start time.");
            return;
        }
        subtitleLines[currentIndex].end = time;
        insertSubtitleMarker(subtitleLines[currentIndex].start, time, subtitleLines[currentIndex].text);
        $.writeln("Marked end for subtitle " + (currentIndex + 1) + ": " + subtitleLines[currentIndex].text);
        
        currentIndex++;
        if (currentIndex < subtitleLines.length) {
            // Immediately start next subtitle at the same time
            var nextText = subtitleLines[currentIndex].text;
            subtitleLines[currentIndex].start = time;
            insertSubtitleMarker(time, time, nextText);
            $.writeln("Started next subtitle " + (currentIndex + 1) + ": " + nextText);
        }
        updateTextBoxWithCurrentSubtitle();
        saveSubtitleState();
        
        if (currentIndex >= subtitleLines.length) {
            $.writeln("All subtitles marked. Creating caption track...");
            autoCreateCaptionTrackFromSubtitles();
            return;
        }
    }
}

function markEnd(mode) {
    if (!app.project || !app.project.activeSequence) {
        alert("No active sequence.");
        return;
    }
    if (currentIndex >= subtitleLines.length) {
        return;
    }
    if (subtitleLines[currentIndex].start === null) {
        alert("Please mark Start time first.");
        return;
    }
    var time = app.project.activeSequence.getPlayerPosition();
    if (time.seconds <= subtitleLines[currentIndex].start.seconds) {
        alert("End time must be after Start time.");
        return;
    }
    subtitleLines[currentIndex].end = time;
    insertSubtitleMarker(subtitleLines[currentIndex].start, subtitleLines[currentIndex].end, subtitleLines[currentIndex].text);
    currentIndex++;
    if (currentIndex >= subtitleLines.length) {
        autoCreateCaptionTrackFromSubtitles();
        return;
    }
    updateTextBoxWithCurrentSubtitle();
    saveSubtitleState();
}

function insertSubtitleMarker(startTime, endTime, text) {
    var seq = app.project.activeSequence;
    if (!seq) {
        alert("No active sequence.");
        return;
    }

    var marker = seq.markers.createMarker(startTime.seconds);
    marker.name = "Static Subtitle";
    marker.comments = text;
    marker.end = endTime.seconds;

    $.writeln("Static marker created from " + startTime.seconds + " to " + endTime.seconds + " with text: " + text);
}

function getCurrentSubtitle() {
    if (currentIndex >= subtitleLines.length) {
        return "";
    }
    return subtitleLines[currentIndex].text;
}

function resetSubtitles() {
    subtitleLines = [];
    currentIndex = 0;
    
    if (app.project && app.project.activeSequence && app.project.activeSequence.markers) {
        var markers = app.project.activeSequence.markers;
        var marker = markers.getFirst();
        while (marker) {
            var nextMarker = markers.getNext();
            if (marker.name === "Static Subtitle") {
                markers.remove(marker);
            }
            marker = nextMarker;
        }
    }
    alert("Static subtitles and timeline markers have been reset.");
    $.writeln("Static subtitles and markers reset.");
    clearSubtitleState();
}

function updateTextBoxWithCurrentSubtitle() {
    if (typeof app === 'undefined' || typeof app.project === 'undefined') return;
    if (typeof subtitleLines === 'undefined' || currentIndex >= subtitleLines.length) {
        app.setTextBox && app.setTextBox("");
        return;
    }
    var text = subtitleLines[currentIndex].text || "";
    if (typeof app.setTextBox === 'function') {
        app.setTextBox(text);
    }
}


function pad(num, size) {
    var s = "000" + num;
    return s.substr(s.length - size);
}
function formatTime(t) {
    var totalMs = Math.floor(t.seconds * 1000);
    var ms = totalMs % 1000;
    var totalSec = Math.floor(totalMs / 1000);
    var s = totalSec % 60;
    var totalMin = Math.floor(totalSec / 60);
    var m = totalMin % 60;
    var h = Math.floor(totalMin / 60);
    return pad(h,2) + ":" + pad(m,2) + ":" + pad(s,2) + "," + pad(ms,3);
}

function autoCreateCaptionTrackFromSubtitles() {
    try {
        if (subtitleLines.length === 0) {
            alert("No subtitles to export as captions.");
            return;
        }
        var srt = "";
        var idx = 1;
        for (var i = 0; i < subtitleLines.length; i++) {
            var line = subtitleLines[i];
            if (!line.start || !line.end) continue;
            srt += idx + "\n";
            srt += formatTime(line.start) + " --> " + formatTime(line.end) + "\n";
            srt += line.text + "\n\n";
            idx++;
        }
        
        var uniqueName = "temp_subtitles_" + (new Date().getTime()) + ".srt";
        var tempFile = new File(Folder.desktop.fsName + '/' + uniqueName);
        tempFile.encoding = "UTF8";
        if (!tempFile.open("w")) {
            alert("Failed to open temp SRT file for writing.");
            return;
        }
        tempFile.write(srt);
        tempFile.close();
        $.writeln("Temp SRT file exported: " + tempFile.fsName);
        
        var seq = app.project.activeSequence;
        if (!seq) {
            alert("No active sequence. Cannot import captions.");
            return;
        }
        var destBin = app.project.getInsertionBin ? app.project.getInsertionBin() : app.project.rootItem;
        var importThese = [tempFile.fsName];
        app.project.importFiles(importThese, true, destBin, false);
        
        var importedSRT = destBin.children[destBin.children.numItems - 1];
        if (importedSRT) {
            var result = seq.createCaptionTrack(importedSRT, 0);
            if (result) {
                alert("Successfully created caption track from SRT!");
            } else {
                alert("Failed to create caption track from imported SRT.");
            }
        } else {
            alert("Could not find the imported SRT file in the bin.");
        }
    } catch (e) {
        alert("Error auto-creating caption track: " + e);
    }
}



function saveSubtitleState() {
    var state = {
        subtitleLines: subtitleLines,
        currentIndex: currentIndex,
        mode: 'static'
    };
    var file = new File(Folder.userData.fsName + "/static_subtitle_tool_state.json");
    file.encoding = "UTF-8";
    if (file.open("w")) {
        file.write(JSON.stringify(state));
        file.close();
    }
}

function loadSubtitleState() {
    var file = new File(Folder.userData.fsName + "/static_subtitle_tool_state.json");
    if (file.exists) {
        file.encoding = "UTF-8";
        if (file.open("r")) {
            var state = JSON.parse(file.read());
            file.close();
            subtitleLines = state.subtitleLines || [];
            currentIndex = state.currentIndex || 0;
            updateTextBoxWithCurrentSubtitle();
        }
    }
}

function clearSubtitleState() {
    var file = new File(Folder.userData.fsName + "/static_subtitle_tool_state.json");
    if (file.exists) file.remove();
}