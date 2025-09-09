// Initialize CSInterface with proper error handling
var csInterface = null;

try {
    if (typeof CSInterface !== 'undefined') {
        csInterface = new CSInterface();
        console.log("CSInterface initialized successfully");
    } else {
        console.log("CSInterface not available - running in test mode");
    }
} catch (error) {
    console.log("Error initializing CSInterface: " + error);
    console.log("Running in test mode without Adobe integration");
}

// Helper function to safely call evalScript
function safeEvalScript(script, callback) {
    console.log("=== safeEvalScript called ===");
    console.log("Script to execute: " + script);
    console.log("CSInterface object: " + csInterface);
    console.log("CSInterface type: " + typeof csInterface);
    
    if (csInterface && typeof csInterface.evalScript === 'function') {
        console.log("CSInterface.evalScript is available, calling it...");
        try {
            csInterface.evalScript(script, callback);
            console.log("evalScript call completed successfully");
        } catch (error) {
            console.log("ERROR calling evalScript: " + error);
            if (callback) callback(null);
        }
    } else {
        console.log("CSInterface not available or evalScript not a function");
        console.log("CSInterface: " + csInterface);
        console.log("evalScript method: " + (csInterface ? typeof csInterface.evalScript : "N/A"));
        if (callback) callback(null);
    }
}

// Helper function to safely get system path
function safeGetSystemPath(pathType) {
    if (csInterface && typeof csInterface.getSystemPath === 'function') {
        try {
            return csInterface.getSystemPath(pathType);
        } catch (error) {
            console.log("Error getting system path: " + error);
            return null;
        }
    } else {
        console.log("CSInterface not available - cannot get system path");
        return null;
    }
}

// Track if scripts are loaded
var colorScriptLoaded = false;
var staticScriptLoaded = false;
var transliterationScriptLoaded = false;

// Load the appropriate script based on mode
function loadScriptForMode(mode) {
    console.log("=== loadScriptForMode called ===");
    console.log("Mode: " + mode);
    console.log("CSInterface available: " + (csInterface ? "YES" : "NO"));
    
    try {
        if (mode === 'static') {
            if (!staticScriptLoaded) {
                console.log("Loading static script...");
                // Only try to load if CSInterface is available
                var extensionPath = safeGetSystemPath(SystemPath.EXTENSION);
                console.log("Extension path: " + extensionPath);
                if (extensionPath) {
                    var scriptPath = extensionPath + '/jsx/subtitles.jsx';
                    console.log("Loading script: " + scriptPath);
                    safeEvalScript('$.evalFile("' + scriptPath + '")');
                } else {
                    console.log("ERROR: Could not get extension path");
                }
                staticScriptLoaded = true;
                console.log("Static script loaded flag set to true");
            } else {
                console.log("Static script already loaded");
            }
        } else if (mode === 'color') {
            if (!colorScriptLoaded) {
                console.log("Loading color script...");
                var extensionPath = safeGetSystemPath(SystemPath.EXTENSION);
                console.log("Extension path: " + extensionPath);
                if (extensionPath) {
                    var scriptPath = extensionPath + '/jsx/colorSubtitles.jsx';
                    console.log("Loading script: " + scriptPath);
                    safeEvalScript('$.evalFile("' + scriptPath + '")');
                } else {
                    console.log("ERROR: Could not get extension path");
                }
                colorScriptLoaded = true;
                console.log("Color script loaded flag set to true");
            } else {
                console.log("Color script already loaded");
            }
        } else if (mode === 'transliteration') {
            if (!transliterationScriptLoaded) {
                console.log("Loading transliteration script...");
                var extensionPath = safeGetSystemPath(SystemPath.EXTENSION);
                console.log("Extension path: " + extensionPath);
                if (extensionPath) {
                    var scriptPath = extensionPath + '/jsx/transliterationSubtitles.jsx';
                    console.log("Loading script: " + scriptPath);
                    safeEvalScript('$.evalFile("' + scriptPath + '")');
                } else {
                    console.log("ERROR: Could not get extension path");
                }
                transliterationScriptLoaded = true;
                console.log("Transliteration script loaded flag set to true");
    } else {
                console.log("Transliteration script already loaded");
            }
        }
    } catch (error) {
        console.log("ERROR loading script for mode " + mode + ": " + error);
    }
}

// Global variables for file paths
var selectedSrtFile = null;
var selectedMogrtFile = null;
var selectedMogrtFile2 = null;
var selectedAnimatedMogrtFile = null;

// Global variables for transliteration feature
var selectedTransliterationSrtFile = null;
var selectedTranscriptionSrtFile = null;
var selectedTransliterationMogrtFile = null;
var selectedTranscriptionMogrtFile = null;

var selectedCropTransition = "wipe"; // Default crop transition style

// Feature dropdown change listener
var subtitleModeElement = document.getElementById("subtitleMode");
if (subtitleModeElement) {
    subtitleModeElement.addEventListener("change", function () {
        var mode = this.value;
        console.log("Feature mode changed to: " + mode);
        
        // Hide all feature panels
        var staticControls = document.getElementById("staticModeControls");
        var colorControls = document.getElementById("colorModeControls");
        var transliterationControls = document.getElementById("transliterationModeControls");
        
        if (staticControls) staticControls.style.display = "none";
        if (colorControls) colorControls.style.display = "none";
        if (transliterationControls) transliterationControls.style.display = "none";
        
        // Show the selected feature panel
        if (mode === "static") {
            if (staticControls) staticControls.style.display = "block";
            loadScriptForMode(mode);
        } else if (mode === "color") {
            if (colorControls) colorControls.style.display = "block";
            loadScriptForMode(mode);
            // Ensure correct file groups are shown
            setTimeout(function() {
                ensureCorrectFileGroups();
                updateManualTextModeUI();
            }, 100);
        } else if (mode === "transliteration") {
            if (transliterationControls) transliterationControls.style.display = "block";
    loadScriptForMode(mode);
            // Ensure correct file groups are shown
            setTimeout(function() {
                ensureCorrectFileGroups();
            }, 100);
        }
        
        // Reset file status displays
        resetFileStatus();
    });
} else {
    console.log("Warning: subtitleMode element not found");
}

// Function to update current line info display
function updateCurrentLineInfo() {
    var mode = getCurrentMode();
    if (mode === 'color') {
        loadScriptForMode(mode);
        safeEvalScript("getManualTimingStatus()", function (status) {
            if (status) {
                var currentLineInfoElement = document.getElementById("currentLineInfo");
                var timingProgressInfoElement = document.getElementById("timingProgressInfo");
                
                if (currentLineInfoElement) {
                    currentLineInfoElement.textContent = status;
                }
                
                if (timingProgressInfoElement) {
                    // Extract progress information from status
                    if (status.indexOf("Completed:") !== -1) {
                        var completedMatch = status.match(/Completed: (\d+) lines/);
                        var totalMatch = status.match(/Text file: (\d+) lines/);
                        if (completedMatch && totalMatch) {
                            var completed = parseInt(completedMatch[1]);
                            var total = parseInt(totalMatch[1]);
                            if (completed > 0) {
                                timingProgressInfoElement.textContent = "Progress: " + completed + "/" + total + " lines completed";
                            }
                        }
                    }
                }
            }
        });
    }
}

// Function to check if all files are selected and enable insertion buttons
function checkAndEnableInsertionButtons() {
    var textFileStatus = document.getElementById("textFileStatus");
    var manualWhiteMogrtStatus = document.getElementById("manualWhiteMogrtStatus");
    var manualGreenMogrtStatus = document.getElementById("manualGreenMogrtStatus");
    
    var insertManualTimedMogrtsBtn = document.getElementById("insertManualTimedMogrtsBtn");
    var insertManualTimedMogrtsWithCropBtn = document.getElementById("insertManualTimedMogrtsWithCropBtn");
    
    if (textFileStatus && manualWhiteMogrtStatus && manualGreenMogrtStatus &&
        textFileStatus.textContent !== "No file selected" &&
        manualWhiteMogrtStatus.textContent !== "No file selected" &&
        manualGreenMogrtStatus.textContent !== "No file selected") {
        
        // All files are selected, enable insertion buttons
        if (insertManualTimedMogrtsBtn) insertManualTimedMogrtsBtn.disabled = false;
        if (insertManualTimedMogrtsWithCropBtn) insertManualTimedMogrtsWithCropBtn.disabled = false;
        
        // Update timing progress info
        var timingProgressInfo = document.getElementById("timingProgressInfo");
        if (timingProgressInfo) {
            timingProgressInfo.textContent = "All files selected. Ready to insert subtitles.";
        }
    }
}

// Function to update UI for manual text mode
function updateManualTextModeUI() {
    var colorModeSelect = document.getElementById("colorModeSelect");
    var colorControls = document.getElementById("colorModeControls");
    
    if (colorModeSelect && colorControls) {
        var selectedMode = colorModeSelect.value;
        
        if (selectedMode === "manualText") {
            // Add manual-text-mode class to hide unnecessary elements
            colorControls.classList.add("manual-text-mode");
            
            // Show manual timing section if text file is loaded
            var textFileStatus = document.getElementById("textFileStatus");
            var manualTimingSection = document.getElementById("manualTimingSection");
            var insertionSection = document.getElementById("insertionSection");
            
            if (textFileStatus && textFileStatus.textContent !== "No file selected") {
                if (manualTimingSection) manualTimingSection.style.display = "block";
                if (insertionSection) insertionSection.style.display = "block";
            }
        } else {
            // Remove manual-text-mode class to show all elements
            colorControls.classList.remove("manual-text-mode");
        }
    }
}

// Function to reset file status displays
function resetFileStatus() {
    // Feature 1
    document.getElementById("textFileStatus").textContent = "No file selected";
    
    // Feature 2
    document.getElementById("srtStatus").textContent = "No file selected";
    document.getElementById("whiteMogrtStatus").textContent = "No file selected";
    document.getElementById("greenMogrtStatus").textContent = "No file selected";
    document.getElementById("animatedMogrtStatus").textContent = "No file selected";
    
    // Feature 3
    document.getElementById("transliterationSrtStatus").textContent = "No file selected";
    document.getElementById("transcriptionSrtStatus").textContent = "No file selected";
    document.getElementById("transliterationMogrtStatus").textContent = "No file selected";
    document.getElementById("transcriptionMogrtStatus").textContent = "No file selected";
    document.getElementById("transliterationAnimatedMogrtStatus").textContent = "No file selected";
}

// Set Text button event listener (Feature 1)
var setTextElement = document.getElementById("setText");
if (setTextElement) {
    setTextElement.addEventListener("click", function () {
        console.log("=== setText button clicked (Feature 1) ===");
        console.log("CSInterface available: " + (csInterface ? "YES" : "NO"));
        
        console.log("Loading script for static mode...");
        loadScriptForMode('static');
        console.log("Calling main()...");
        safeEvalScript("main()", function (result) {
            console.log("main() callback received: " + result);
            updateTextBox(0);  // Show first subtitle line
            console.log("Static mode main() called");
        });
    });
} else {
    console.log("ERROR: setText element not found");
}

// Color mode selection event listener
var colorModeSelectElement = document.getElementById("colorModeSelect");
if (colorModeSelectElement) {
    colorModeSelectElement.addEventListener("change", function() {
        console.log("Color mode changed to: " + this.value);
        updateManualTextModeUI();
    });
}

// Set SRT File button event listener (Feature 2)
var setSrtFileElement = document.getElementById("setSrtFile");
if (setSrtFileElement) {
    setSrtFileElement.addEventListener("click", function () {
        console.log("=== setSrtFile button clicked (Feature 2) ===");
        console.log("CSInterface available: " + (csInterface ? "YES" : "NO"));
        
        console.log("Loading script for color mode...");
        loadScriptForMode('color');
        console.log("Calling selectSrtFile()...");
        safeEvalScript("selectSrtFile()", function (srtPath) {
            console.log("selectSrtFile callback received: " + srtPath);
            console.log("Path type: " + typeof srtPath);
            console.log("Path length: " + (srtPath ? srtPath.length : "null"));
            
            if (srtPath) {
                // Log each character to see if there's corruption
                console.log("Path characters:");
                for (var i = 0; i < srtPath.length; i++) {
                    console.log("Char " + i + ": '" + srtPath[i] + "' (code: " + srtPath.charCodeAt(i) + ")");
                }
                
                var srtStatusElement = document.getElementById("srtStatus");
                if (srtStatusElement) {
                    srtStatusElement.textContent = "Selected: " + srtPath.split(/\\\\|\//).pop();
                    console.log("Updated SRT status display");
                } else {
                    console.log("ERROR: srtStatus element not found");
                }
                selectedSrtFile = { path: srtPath };
                console.log("SRT file selected: " + srtPath);
            } else {
                console.log("No SRT path returned from selectSrtFile");
            }
        });
    });
} else {
    console.log("ERROR: setSrtFile element not found");
}

// Set MOGRT button event listener
var setMogrtElement = document.getElementById("setMogrt");
if (setMogrtElement) {
    setMogrtElement.addEventListener("click", function () {
        console.log("setMogrt button clicked");
    var mode = getCurrentMode();
    if (mode === 'color') {
        loadScriptForMode(mode);
            safeEvalScript("selectMogrtFile()", function (mogrtPath) {
                if (mogrtPath) {
                    var whiteMogrtStatusElement = document.getElementById("whiteMogrtStatus");
                    if (whiteMogrtStatusElement) {
                        whiteMogrtStatusElement.textContent = "Selected: " + mogrtPath.split(/\\\\|\//).pop();
                    }
                    selectedMogrtFile = { path: mogrtPath };
                    console.log("White MOGRT selected: " + mogrtPath);
                }
            });
        }
    });
}

// Set MOGRT 2 button event listener
var setMogrt2Element = document.getElementById("setMogrt2");
if (setMogrt2Element) {
    setMogrt2Element.addEventListener("click", function () {
        console.log("setMogrt2 button clicked");
        var mode = getCurrentMode();
        if (mode === 'color') {
            loadScriptForMode(mode);
            safeEvalScript("selectMogrtFile2()", function (mogrtPath) {
                if (mogrtPath) {
                    var greenMogrtStatusElement = document.getElementById("greenMogrtStatus");
                    if (greenMogrtStatusElement) {
                        greenMogrtStatusElement.textContent = "Selected: " + mogrtPath.split(/\\\\|\//).pop();
                    }
                    selectedMogrtFile2 = { path: mogrtPath };
                    console.log("Green MOGRT selected: " + mogrtPath);
                }
            });
        }
    });
}

// Set Animated SRT File button event listener
var setSrtFileAnimatedElement = document.getElementById("setSrtFileAnimated");
if (setSrtFileAnimatedElement) {
    setSrtFileAnimatedElement.addEventListener("click", function () {
        console.log("setSrtFileAnimated button clicked");
        var mode = getCurrentMode();
        if (mode === 'color') {
            loadScriptForMode(mode);
            safeEvalScript("selectSrtFile()", function (srtPath) {
                if (srtPath) {
                    var srtStatusAnimatedElement = document.getElementById("srtStatusAnimated");
                    if (srtStatusAnimatedElement) {
                        srtStatusAnimatedElement.textContent = "Selected: " + srtPath.split(/\\\\|\//).pop();
                    }
                    console.log("Animated SRT file selected: " + srtPath);
                    
                    // Store the selected SRT file for animated mode
                    selectedSrtFile = { path: srtPath };
                }
            });
        }
    });
}

// Set Animated MOGRT button event listener
var setAnimatedMogrtElement = document.getElementById("setAnimatedMogrt");
if (setAnimatedMogrtElement) {
    setAnimatedMogrtElement.addEventListener("click", function () {
        console.log("setAnimatedMogrt button clicked");
        var mode = getCurrentMode();
        if (mode === 'color') {
            loadScriptForMode(mode);
            safeEvalScript("selectAnimatedMogrtFile()", function (mogrtPath) {
                if (mogrtPath) {
                    var animatedMogrtStatusElement = document.getElementById("animatedMogrtStatus");
                    if (animatedMogrtStatusElement) {
                        animatedMogrtStatusElement.textContent = "Selected: " + mogrtPath.split(/\\\\|\//).pop();
                    }
                    selectedAnimatedMogrtFile = { path: mogrtPath };
                    console.log("Animated MOGRT selected: " + mogrtPath);
                    
                    // Store the selected animated MOGRT file
                    selectedAnimatedMogrtFile = { path: mogrtPath };
                }
            });
        }
    });
}

// Manual Text Method - Select Text File button event listener
var setTextFileElement = document.getElementById("setTextFile");
if (setTextFileElement) {
    setTextFileElement.addEventListener("click", function () {
        console.log("setTextFile button clicked (Manual Text Method)");
        var mode = getCurrentMode();
        if (mode === 'color') {
            loadScriptForMode(mode);
            safeEvalScript("selectTextFile()", function (textPath) {
                if (textPath) {
                    var textFileStatusElement = document.getElementById("textFileStatus");
                    if (textFileStatusElement) {
                        textFileStatusElement.textContent = "Selected: " + textPath.split(/\\\\|\//).pop();
                    }
                    console.log("Text file selected: " + textPath);
                    
                    // Update current line info
                    updateCurrentLineInfo();
                    
                    // Enable timing buttons after text file is loaded
                    var markStartBtn = document.getElementById("markStartBtn");
                    var markEndBtn = document.getElementById("markEndBtn");
                    var resetManualTimingBtn = document.getElementById("resetManualTimingBtn");
                    
                    if (markStartBtn) markStartBtn.disabled = false;
                    if (markEndBtn) markEndBtn.disabled = false;
                    if (resetManualTimingBtn) resetManualTimingBtn.disabled = false;
                    
                    // Update timing progress info
                    var timingProgressInfo = document.getElementById("timingProgressInfo");
                    if (timingProgressInfo) {
                        timingProgressInfo.textContent = "Text file loaded. Ready to start timing.";
                    }
                }
            });
        }
    });
}

// Manual Text Method - Select White MOGRT button event listener
var setManualWhiteMogrtElement = document.getElementById("setManualWhiteMogrt");
if (setManualWhiteMogrtElement) {
    setManualWhiteMogrtElement.addEventListener("click", function () {
        console.log("setManualWhiteMogrt button clicked");
        var mode = getCurrentMode();
        if (mode === 'color') {
            loadScriptForMode(mode);
            safeEvalScript("selectMogrtFile()", function (mogrtPath) {
                if (mogrtPath) {
                    var manualWhiteMogrtStatusElement = document.getElementById("manualWhiteMogrtStatus");
                    if (manualWhiteMogrtStatusElement) {
                        manualWhiteMogrtStatusElement.textContent = "Selected: " + mogrtPath.split(/\\\\|\//).pop();
                    }
                    console.log("Manual White MOGRT selected: " + mogrtPath);
                    
                    // Check if all files are selected and enable insertion buttons
                    checkAndEnableInsertionButtons();
                }
            });
        }
    });
}

// Manual Text Method - Select Green MOGRT button event listener
var setManualGreenMogrtElement = document.getElementById("setManualGreenMogrt");
if (setManualGreenMogrtElement) {
    setManualGreenMogrtElement.addEventListener("click", function () {
        console.log("setManualGreenMogrt button clicked");
        var mode = getCurrentMode();
        if (mode === 'color') {
            loadScriptForMode(mode);
            safeEvalScript("selectMogrtFile2()", function (mogrtPath) {
                if (mogrtPath) {
                    var manualGreenMogrtStatusElement = document.getElementById("manualGreenMogrtStatus");
                    if (manualGreenMogrtStatusElement) {
                        manualGreenMogrtStatusElement.textContent = "Selected: " + mogrtPath.split(/\\\\|\//).pop();
                    }
                    console.log("Manual Green MOGRT selected: " + mogrtPath);
                    
                    // Check if all files are selected and enable insertion buttons
                    checkAndEnableInsertionButtons();
                }
            });
        }
    });
}

// Manual Text Method - Mark Start button event listener
var markStartBtnElement = document.getElementById("markStartBtn");
if (markStartBtnElement) {
    markStartBtnElement.addEventListener("click", function () {
        console.log("markStartBtn clicked");
        var mode = getCurrentMode();
        if (mode === 'color') {
            loadScriptForMode(mode);
            safeEvalScript("markStartTime()", function (result) {
                console.log("markStartTime result: " + result);
                // Update current line info after marking start
                updateCurrentLineInfo();
            });
        }
    });
}

// Manual Text Method - Mark End button event listener
var markEndBtnElement = document.getElementById("markEndBtn");
if (markEndBtnElement) {
    markEndBtnElement.addEventListener("click", function () {
        console.log("markEndBtn clicked");
        var mode = getCurrentMode();
        if (mode === 'color') {
            loadScriptForMode(mode);
            safeEvalScript("markEndTime()", function (result) {
                console.log("markEndTime result: " + result);
                // Update current line info after marking end
                updateCurrentLineInfo();
            });
        }
    });
}



// Manual Text Method - Insert Manual Timed MOGRTs button event listener
var insertManualTimedMogrtsBtnElement = document.getElementById("insertManualTimedMogrtsBtn");
if (insertManualTimedMogrtsBtnElement) {
    insertManualTimedMogrtsBtnElement.addEventListener("click", function () {
        console.log("insertManualTimedMogrtsBtn clicked");
        var mode = getCurrentMode();
        if (mode === 'color') {
            loadScriptForMode(mode);
            safeEvalScript("insertManualTimedMogrts()", function (result) {
                console.log("insertManualTimedMogrts result: " + result);
            });
        }
    });
}



// Manual Text Method - Reset Manual Timing button event listener
var resetManualTimingBtnElement = document.getElementById("resetManualTimingBtn");
if (resetManualTimingBtnElement) {
    resetManualTimingBtnElement.addEventListener("click", function () {
        console.log("resetManualTimingBtn clicked");
        var mode = getCurrentMode();
        if (mode === 'color') {
            loadScriptForMode(mode);
            safeEvalScript("resetManualTiming()", function (result) {
                console.log("resetManualTiming result: " + result);
                // Reset status displays
                var textFileStatusElement = document.getElementById("textFileStatus");
                if (textFileStatusElement) {
                    textFileStatusElement.textContent = "No file selected";
                }
                var manualWhiteMogrtStatusElement = document.getElementById("manualWhiteMogrtStatus");
                if (manualWhiteMogrtStatusElement) {
                    manualWhiteMogrtStatusElement.textContent = "No file selected";
                }
                var manualGreenMogrtStatusElement = document.getElementById("manualGreenMogrtStatus");
                if (manualGreenMogrtStatusElement) {
                    manualGreenMogrtStatusElement.textContent = "No file selected";
                }
                updateCurrentLineInfo();
            });
        }
    });
}

// Function to update current line info display
function updateCurrentLineInfo() {
    var mode = getCurrentMode();
    if (mode === 'color') {
        loadScriptForMode(mode);
        safeEvalScript("getManualTimingStatus()", function (status) {
            var currentLineInfoElement = document.getElementById("currentLineInfo");
            if (currentLineInfoElement && status) {
                currentLineInfoElement.textContent = status;
            }
        });
    }
}

// Set Transliteration SRT button event listener
var setTransliterationSrtElement = document.getElementById("setTransliterationSrt");
if (setTransliterationSrtElement) {
    setTransliterationSrtElement.addEventListener("click", function () {
        console.log("setTransliterationSrt button clicked");
        var mode = getCurrentMode();
        if (mode === 'transliteration') {
            loadScriptForMode(mode);
            if (typeof csInterface !== 'undefined' && csInterface.evalScript) {
                csInterface.evalScript("selectTransliterationSrtFile()", function (srtPath) {
                    if (srtPath) {
                        var transliterationSrtStatusElement = document.getElementById("transliterationSrtStatus");
                        if (transliterationSrtStatusElement) {
                            transliterationSrtStatusElement.textContent = "Selected: " + srtPath.split(/\\\\|\//).pop();
                        }
                        selectedTransliterationSrtFile = { path: srtPath };
                        console.log("Transliteration SRT selected: " + srtPath);
                    }
                });
            }
        }
    });
}

// Set Transcription SRT button event listener
var setTranscriptionSrtElement = document.getElementById("setTranscriptionSrt");
if (setTranscriptionSrtElement) {
    setTranscriptionSrtElement.addEventListener("click", function () {
        console.log("setTranscriptionSrt button clicked");
        var mode = getCurrentMode();
        if (mode === 'transliteration') {
            loadScriptForMode(mode);
            if (typeof csInterface !== 'undefined' && csInterface.evalScript) {
                csInterface.evalScript("selectTranscriptionSrtFile()", function (srtPath) {
                    if (srtPath) {
                        var transcriptionSrtStatusElement = document.getElementById("transcriptionSrtStatus");
                        if (transcriptionSrtStatusElement) {
                            transcriptionSrtStatusElement.textContent = "Selected: " + srtPath.split(/\\\\|\//).pop();
                        }
                        selectedTranscriptionSrtFile = { path: srtPath };
                        console.log("Transcription SRT selected: " + srtPath);
                    }
                });
            }
        }
    });
}

// Set Transliteration Green MOGRT button event listener
var setTransliterationGreenMogrtElement = document.getElementById("setTransliterationGreenMogrt");
if (setTransliterationGreenMogrtElement) {
    setTransliterationGreenMogrtElement.addEventListener("click", function () {
        console.log("setTransliterationGreenMogrt button clicked");
        var mode = getCurrentMode();
        if (mode === 'transliteration') {
            loadScriptForMode(mode);
            if (typeof csInterface !== 'undefined' && csInterface.evalScript) {
                csInterface.evalScript("selectTransliterationGreenMogrtFile()", function (mogrtPath) {
                    if (mogrtPath) {
                        var transliterationGreenMogrtStatusElement = document.getElementById("transliterationGreenMogrtStatus");
                        if (transliterationGreenMogrtStatusElement) {
                            transliterationGreenMogrtStatusElement.textContent = "Selected: " + mogrtPath.split(/\\\\|\//).pop();
                        }
                        selectedTransliterationGreenMogrtFile = { path: mogrtPath };
                        console.log("Transliteration Green MOGRT selected: " + mogrtPath);
                    }
                });
            }
        }
    });
}

// Set Transliteration White MOGRT button event listener
var setTransliterationWhiteMogrtElement = document.getElementById("setTransliterationWhiteMogrt");
if (setTransliterationWhiteMogrtElement) {
    setTransliterationWhiteMogrtElement.addEventListener("click", function () {
        console.log("setTransliterationWhiteMogrt button clicked");
        var mode = getCurrentMode();
        if (mode === 'transliteration') {
            loadScriptForMode(mode);
            if (typeof csInterface !== 'undefined' && csInterface.evalScript) {
                csInterface.evalScript("selectTransliterationWhiteMogrtFile()", function (mogrtPath) {
                    if (mogrtPath) {
                        var transliterationWhiteMogrtStatusElement = document.getElementById("transliterationWhiteMogrtStatus");
                        if (transliterationWhiteMogrtStatusElement) {
                            transliterationWhiteMogrtStatusElement.textContent = "Selected: " + mogrtPath.split(/\\\\|\//).pop();
                        }
                        selectedTransliterationWhiteMogrtFile = { path: mogrtPath };
                        console.log("Transliteration White MOGRT selected: " + mogrtPath);
                    }
                });
            }
        }
    });
}

// Set Transcription MOGRT button event listener
var setTranscriptionMogrtElement = document.getElementById("setTranscriptionMogrt");
if (setTranscriptionMogrtElement) {
    setTranscriptionMogrtElement.addEventListener("click", function () {
        console.log("setTranscriptionMogrt button clicked");
        var mode = getCurrentMode();
        if (mode === 'transliteration') {
            loadScriptForMode(mode);
            if (typeof csInterface !== 'undefined' && csInterface.evalScript) {
                csInterface.evalScript("selectTranscriptionMogrtFile()", function (mogrtPath) {
                    if (mogrtPath) {
                        var transcriptionMogrtStatusElement = document.getElementById("transcriptionMogrtStatus");
                        if (transcriptionMogrtStatusElement) {
                            transcriptionMogrtStatusElement.textContent = "Selected: " + mogrtPath.split(/\\\\|\//).pop();
                        }
                        selectedTranscriptionMogrtFile = { path: mogrtPath };
                        console.log("Transcription MOGRT selected: " + mogrtPath);
                    }
                });
            }
        }
    });
}

// Set Transliteration Animated MOGRT button event listener
var setTransliterationAnimatedMogrtElement = document.getElementById("setTransliterationAnimatedMogrt");
if (setTransliterationAnimatedMogrtElement) {
    setTransliterationAnimatedMogrtElement.addEventListener("click", function () {
        console.log("setTransliterationAnimatedMogrt button clicked");
        var mode = getCurrentMode();
        if (mode === 'transliteration') {
            loadScriptForMode(mode);
            if (typeof csInterface !== 'undefined' && csInterface.evalScript) {
                csInterface.evalScript("selectTransliterationAnimatedMogrtFile()", function (mogrtPath) {
                    if (mogrtPath) {
                        var transliterationAnimatedMogrtStatusElement = document.getElementById("transliterationAnimatedMogrtStatus");
                        if (transliterationAnimatedMogrtStatusElement) {
                            transliterationAnimatedMogrtStatusElement.textContent = "Selected: " + mogrtPath.split(/\\\\|\//).pop();
                        }
                        selectedTransliterationAnimatedMogrtFile = { path: mogrtPath };
                        console.log("Transliteration Animated MOGRT selected: " + mogrtPath);
                    }
                });
            }
        }
    });
}

// Feature 1: Static Subtitles event listeners
var startTextElement = document.getElementById("startText");
if (startTextElement) {
    startTextElement.addEventListener("click", function () {
        console.log("startText button clicked");
        var mode = getCurrentMode();
        if (mode === 'static') {
            loadScriptForMode(mode);
            if (typeof csInterface !== 'undefined' && csInterface.evalScript) {
                csInterface.evalScript("toggleStartMark()", function (result) {
                    if (typeof csInterface !== 'undefined' && csInterface.evalScript) {
                        csInterface.evalScript("getCurrentSubtitle()", function (subtitleText) {
                            updateTextBox(subtitleText);
                            console.log("Updated text box with: " + subtitleText);
                        });
                    }
                });
            }
        }
    });
}

var endTextElement = document.getElementById("endText");
if (endTextElement) {
    endTextElement.addEventListener("click", function () {
        console.log("endText button clicked");
        var mode = getCurrentMode();
        if (mode === 'static') {
            loadScriptForMode(mode);
            if (typeof csInterface !== 'undefined' && csInterface.evalScript) {
                csInterface.evalScript("markEnd('" + mode + "')", function (result) {
                    if (typeof csInterface !== 'undefined' && csInterface.evalScript) {
                        csInterface.evalScript("getCurrentSubtitle()", function (subtitleText) {
                            updateTextBox(subtitleText);
                            console.log("Updated text box with: " + subtitleText);
                        });
                    }
                });
            }
        }
    });
}

var exportSRTElement = document.getElementById("exportSRT");
if (exportSRTElement) {
    exportSRTElement.addEventListener("click", function () {
        console.log("exportSRT button clicked");
        var mode = getCurrentMode();
        if (mode === 'static') {
            loadScriptForMode(mode);
            if (typeof csInterface !== 'undefined' && csInterface.evalScript) {
                csInterface.evalScript("exportSRT()");
            }
        }
    });
}

function updateTextBox(subtitleText) {
    var subtitleTextElement = document.getElementById("subtitleText");
    if (subtitleTextElement) {
        subtitleTextElement.value = subtitleText;
    }
}

function getCurrentMode() {
    var subtitleModeElement = document.getElementById("subtitleMode");
    if (subtitleModeElement) {
        return subtitleModeElement.value;
    }
    return "static"; // Default fallback
}

// Show/hide color mode controls based on subtitle mode
// This listener is now handled by the new "subtitleMode" listener

// Handle video track selection
var videoTrackSelectElement = document.getElementById("videoTrackSelect");
if (videoTrackSelectElement) {
    videoTrackSelectElement.addEventListener("change", function () {
        console.log("videoTrackSelect changed to: " + this.value);
    var trackNumber = parseInt(this.value);
    var mode = getCurrentMode();
    if (mode === 'color') {
        loadScriptForMode(mode);
            if (typeof csInterface !== 'undefined' && csInterface.evalScript) {
        csInterface.evalScript("setVideoTrack(" + trackNumber + ")");
            }
        }
    });
}

// Handle crop transition selection
var cropTransitionSelectElement = document.getElementById("cropTransitionSelect");
if (cropTransitionSelectElement) {
    cropTransitionSelectElement.addEventListener("change", function () {
        console.log("cropTransitionSelect changed to: " + this.value);
        selectedCropTransition = this.value;
    var mode = getCurrentMode();
    if (mode === 'color') {
        loadScriptForMode(mode);
            if (typeof csInterface !== 'undefined' && csInterface.evalScript) {
                csInterface.evalScript("setCropTransitionStyle('" + selectedCropTransition + "')");
            }
        }
    });
}

// Handle crop style selection for manual text method
var cropStyleSelectElement = document.getElementById("cropStyleSelect");
if (cropStyleSelectElement) {
    cropStyleSelectElement.addEventListener("change", function () {
        console.log("cropStyleSelect changed to: " + this.value);
        var cropStyle = this.value;
        var mode = getCurrentMode();
        if (mode === 'color') {
            loadScriptForMode(mode);
            if (typeof csInterface !== 'undefined' && csInterface.evalScript) {
                csInterface.evalScript("setCropTransitionStyle('" + cropStyle + "')");
            }
        }
    });
}

// Handle color mode selection
var colorModeSelectElement = document.getElementById("colorModeSelect");
if (colorModeSelectElement) {
    colorModeSelectElement.addEventListener("change", function () {
        console.log("colorModeSelect changed to: " + this.value);
        var colorMode = this.value;
        var mode = getCurrentMode();
        console.log("Current mode: " + mode);
        
        // Show/hide file groups based on mode immediately
        var manualFiles = document.getElementById("manualModeFiles");
        var animatedFiles = document.getElementById("animatedModeFiles");
        var manualTextSection = document.getElementById("manualTextMethodSection");
        var manualTextActions = document.getElementById("manualTextActions");
        
        console.log("Manual files element:", manualFiles);
        console.log("Animated files element:", animatedFiles);
        console.log("Manual text section element:", manualTextSection);
        console.log("Manual text actions element:", manualTextActions);
        
        if (colorMode === "manual") {
            if (manualFiles) {
                manualFiles.style.display = "block";
                console.log("✓ Manual files now visible");
            }
            if (animatedFiles) {
                animatedFiles.style.display = "none";
                console.log("✓ Animated files now hidden");
            }
            if (manualTextSection) {
                manualTextSection.style.display = "none";
                console.log("✓ Manual text section now hidden");
            }
            if (manualTextActions) {
                manualTextActions.style.display = "none";
                console.log("✓ Manual text actions now hidden");
            }
            console.log("Showing manual files, hiding animated files and manual text");
        } else if (colorMode === "manualText") {
            if (manualFiles) {
                manualFiles.style.display = "none";
                console.log("✓ Manual files now hidden");
            }
            if (animatedFiles) {
                animatedFiles.style.display = "none";
                console.log("✓ Animated files now hidden");
            }
            if (manualTextSection) {
                manualTextSection.style.display = "block";
                console.log("✓ Manual text section now visible");
            }
            if (manualTextActions) {
                manualTextActions.style.display = "block";
                console.log("✓ Manual text actions now visible");
            }
            console.log("Showing manual text method, hiding other modes");
        } else if (colorMode === "animated") {
            if (manualFiles) {
                manualFiles.style.display = "none";
                console.log("✓ Manual files now hidden");
            }
            if (animatedFiles) {
                animatedFiles.style.display = "block";
                console.log("✓ Animated files now visible");
            }
            if (manualTextSection) {
                manualTextSection.style.display = "none";
                console.log("✓ Manual text section now hidden");
            }
            if (manualTextActions) {
                manualTextActions.style.display = "none";
                console.log("✓ Manual text actions now hidden");
            }
            console.log("Showing animated files, hiding manual files and manual text");
        }
        
        // Call JSX function if in correct mode
        if (mode === 'color') {
            loadScriptForMode(mode);
            if (typeof csInterface !== 'undefined' && csInterface.evalScript) {
                csInterface.evalScript("setColorMode('" + colorMode + "')");
            }
        }
    });
}

// Handle transliteration mode selection
var transliterationModeSelectElement = document.getElementById("transliterationModeSelect");
if (transliterationModeSelectElement) {
    transliterationModeSelectElement.addEventListener("change", function () {
        console.log("transliterationModeSelect changed to: " + this.value);
        var transliterationMode = this.value;
        var mode = getCurrentMode();
        console.log("Current mode: " + mode);
        
        // Show/hide file groups based on mode immediately
        var manualFiles = document.getElementById("transliterationManualFiles");
        var animatedFiles = document.getElementById("transliterationAnimatedFiles");
        
        console.log("Transliteration manual files element:", manualFiles);
        console.log("Transliteration animated files element:", animatedFiles);
        
        if (transliterationMode === "manual") {
            if (manualFiles) {
                manualFiles.style.display = "block";
                console.log("✓ Transliteration manual files now visible");
            }
            if (animatedFiles) {
                animatedFiles.style.display = "none";
                console.log("✓ Transliteration animated files now hidden");
            }
            var manualTextFiles = document.getElementById("transliterationManualTextFiles");
            var manualTimingSection = document.getElementById("transliterationManualTimingSection");
            var manualInsertionSection = document.getElementById("transliterationManualInsertionSection");
            if (manualTextFiles) manualTextFiles.style.display = "none";
            if (manualTimingSection) manualTimingSection.style.display = "none";
            if (manualInsertionSection) manualInsertionSection.style.display = "none";
            console.log("Showing transliteration manual files, hiding animated and manual text files");
        } else if (transliterationMode === "animated") {
            if (manualFiles) {
                manualFiles.style.display = "none";
                console.log("✓ Transliteration manual files now hidden");
            }
            if (animatedFiles) {
                animatedFiles.style.display = "block";
                console.log("✓ Transliteration animated files now visible");
            }
            var manualTextFiles = document.getElementById("transliterationManualTextFiles");
            var manualTimingSection = document.getElementById("transliterationManualTimingSection");
            var manualInsertionSection = document.getElementById("transliterationManualInsertionSection");
            if (manualTextFiles) manualTextFiles.style.display = "none";
            if (manualTimingSection) manualTimingSection.style.display = "none";
            if (manualInsertionSection) manualInsertionSection.style.display = "none";
            console.log("Showing transliteration animated files, hiding manual and manual text files");
        } else if (transliterationMode === "manual-text") {
            if (manualFiles) {
                manualFiles.style.display = "none";
                console.log("✓ Transliteration manual files now hidden");
            }
            if (animatedFiles) {
                animatedFiles.style.display = "none";
                console.log("✓ Transliteration animated files now hidden");
            }
            var manualTextFiles = document.getElementById("transliterationManualTextFiles");
            var manualTimingSection = document.getElementById("transliterationManualTimingSection");
            var manualInsertionSection = document.getElementById("transliterationManualInsertionSection");
            if (manualTextFiles) manualTextFiles.style.display = "block";
            if (manualTimingSection) manualTimingSection.style.display = "block";
            if (manualInsertionSection) manualInsertionSection.style.display = "block";
            console.log("Showing transliteration manual text files, hiding manual and animated files");
        }
        
        // Call JSX function if in correct mode
        if (mode === 'transliteration') {
            loadScriptForMode(mode);
            if (typeof csInterface !== 'undefined' && csInterface.evalScript) {
                csInterface.evalScript("setTransliterationMode('" + transliterationMode + "')");
            }
        }
    });
}

// Handle transliteration video track selection
var transliterationVideoTrackSelectElement = document.getElementById("transliterationVideoTrackSelect");
if (transliterationVideoTrackSelectElement) {
    transliterationVideoTrackSelectElement.addEventListener("change", function () {
        console.log("transliterationVideoTrackSelect changed to: " + this.value);
        var trackNumber = parseInt(this.value);
        var mode = getCurrentMode();
        if (mode === 'transliteration') {
            loadScriptForMode(mode);
            if (typeof csInterface !== 'undefined' && csInterface.evalScript) {
                csInterface.evalScript("setTransliterationVideoTrack(" + trackNumber + ")");
            }
        }
    });
}

// Handle transliteration crop transition selection
var transliterationCropSelectElement = document.getElementById("transliterationCropSelect");
if (transliterationCropSelectElement) {
    transliterationCropSelectElement.addEventListener("change", function () {
        console.log("transliterationCropSelect changed to: " + this.value);
        var cropStyle = this.value;
    var mode = getCurrentMode();
        if (mode === 'transliteration') {
    loadScriptForMode(mode);
            if (typeof csInterface !== 'undefined' && csInterface.evalScript) {
                csInterface.evalScript("setTransliterationCropTransitionStyle('" + cropStyle + "')");
            }
        }
    });
}

// Auto insert both MOGRTs button event listener
var autoInsertBothMogrtsBtnElement = document.getElementById("autoInsertBothMogrtsBtn");
if (autoInsertBothMogrtsBtnElement) {
    autoInsertBothMogrtsBtnElement.addEventListener("click", function () {
        console.log("autoInsertBothMogrtsBtn clicked");
        var mode = getCurrentMode();
        if (mode === 'color') {
            loadScriptForMode(mode);
            
            // Check which color mode is selected
            var colorModeSelect = document.getElementById("colorModeSelect");
            var colorMode = colorModeSelect ? colorModeSelect.value : "manual";
            console.log("Color mode: " + colorMode);
            
            if (colorMode === "manual") {
                // Manual crop mode - need both MOGRTs
                if (!selectedSrtFile || !selectedMogrtFile || !selectedMogrtFile2) {
                    alert("Please select SRT file, White MOGRT, and Green MOGRT first.");
                    return;
                }
                console.log("Calling insertBothMogrtsFromFiles with:", selectedSrtFile.path, selectedMogrtFile.path, selectedMogrtFile2.path);
                if (typeof csInterface !== 'undefined' && csInterface.evalScript) {
                    // Use the stored paths from JSX instead of passing from JavaScript
                    csInterface.evalScript("insertBothMogrtsFromStoredPaths()");
                }
            } else if (colorMode === "animated") {
                // Animated MOGRT mode - need SRT and animated MOGRT
                if (!selectedSrtFile || !selectedAnimatedMogrtFile) {
                    alert("Please select SRT file and Animated MOGRT first.");
                    return;
                }
                console.log("Calling insertAnimatedMogrtsFromStoredPath");
                if (typeof csInterface !== 'undefined' && csInterface.evalScript) {
                    csInterface.evalScript("insertAnimatedMogrtsFromStoredPath()");
                }
            }
        }
    });
}

// Manual crop instructions button event listener
var manualCropBtnElement = document.getElementById("manualCropBtn");
if (manualCropBtnElement) {
    manualCropBtnElement.addEventListener("click", function () {
        console.log("manualCropBtn clicked");
        var mode = getCurrentMode();
        console.log("Current mode for manual crop: " + mode);
        
        // Show immediate feedback
        alert("Crop Instructions Button Clicked! Opening instructions...");
        
        if (mode === 'color') {
            loadScriptForMode(mode);
            console.log("Calling showManualCropInstructions");
            if (typeof csInterface !== 'undefined' && csInterface.evalScript) {
                csInterface.evalScript("showManualCropInstructions()", function(result) {
                    console.log("showManualCropInstructions result: " + result);
                });
            }
        } else {
            console.log("Wrong mode for manual crop button: " + mode);
            alert("Please select Feature 2: Color Subtitles first!");
        }
    });
}

// Transliteration Manual Text Mode Event Listeners

// Set Transliteration Text File button event listener
var setTransliterationTextFileElement = document.getElementById("setTransliterationTextFile");
if (setTransliterationTextFileElement) {
    setTransliterationTextFileElement.addEventListener("click", function () {
        console.log("setTransliterationTextFile button clicked");
        var mode = getCurrentMode();
        if (mode === 'transliteration') {
            loadScriptForMode(mode);
            if (typeof csInterface !== 'undefined' && csInterface.evalScript) {
                csInterface.evalScript("selectTransliterationTextFile()", function (textPath) {
                    if (textPath) {
                        var transliterationTextFileStatusElement = document.getElementById("transliterationTextFileStatus");
                        if (transliterationTextFileStatusElement) {
                            transliterationTextFileStatusElement.textContent = "Selected: " + textPath.split(/\\\\|\//).pop();
                        }
                        selectedTransliterationTextFile = { path: textPath };
                        console.log("Transliteration text file selected: " + textPath);
                        
                        // Enable timing buttons
                        var markStartBtn = document.getElementById("transliterationMarkStartBtn");
                        var markEndBtn = document.getElementById("transliterationMarkEndBtn");
                        var resetManualTimingBtn = document.getElementById("transliterationResetManualTimingBtn");
                        
                        if (markStartBtn) markStartBtn.disabled = false;
                        if (markEndBtn) markEndBtn.disabled = false;
                        if (resetManualTimingBtn) resetManualTimingBtn.disabled = false;
                        
                        // Update timing progress info
                        var timingProgressInfo = document.getElementById("transliterationTimingProgressInfo");
                        if (timingProgressInfo) {
                            timingProgressInfo.textContent = "Text file loaded. Use START and END buttons to mark timing.";
                        }
                        
                        // Show timing and insertion sections
                        var manualTimingSection = document.getElementById("transliterationManualTimingSection");
                        var manualInsertionSection = document.getElementById("transliterationManualInsertionSection");
                        if (manualTimingSection) manualTimingSection.style.display = "block";
                        if (manualInsertionSection) manualInsertionSection.style.display = "block";
                    }
                });
            }
        }
    });
}

// Set Transliteration Manual Green MOGRT button event listener
var setTransliterationManualGreenMogrtElement = document.getElementById("setTransliterationManualGreenMogrt");
if (setTransliterationManualGreenMogrtElement) {
    setTransliterationManualGreenMogrtElement.addEventListener("click", function () {
        console.log("setTransliterationManualGreenMogrt button clicked");
        var mode = getCurrentMode();
        if (mode === 'transliteration') {
            loadScriptForMode(mode);
            if (typeof csInterface !== 'undefined' && csInterface.evalScript) {
                csInterface.evalScript("selectTransliterationGreenMogrtFile()", function (mogrtPath) {
                    if (mogrtPath) {
                        var transliterationManualGreenMogrtStatusElement = document.getElementById("transliterationManualGreenMogrtStatus");
                        if (transliterationManualGreenMogrtStatusElement) {
                            transliterationManualGreenMogrtStatusElement.textContent = "Selected: " + mogrtPath.split(/\\\\|\//).pop();
                        }
                        selectedTransliterationGreenMogrtFile = { path: mogrtPath };
                        console.log("Transliteration Manual Green MOGRT selected: " + mogrtPath);
                        checkAndEnableTransliterationManualInsertionButtons();
                    }
                });
            }
        }
    });
}

// Set Transliteration Manual White MOGRT button event listener
var setTransliterationManualWhiteMogrtElement = document.getElementById("setTransliterationManualWhiteMogrt");
if (setTransliterationManualWhiteMogrtElement) {
    setTransliterationManualWhiteMogrtElement.addEventListener("click", function () {
        console.log("setTransliterationManualWhiteMogrt button clicked");
        var mode = getCurrentMode();
        if (mode === 'transliteration') {
            loadScriptForMode(mode);
            if (typeof csInterface !== 'undefined' && csInterface.evalScript) {
                csInterface.evalScript("selectTransliterationWhiteMogrtFile()", function (mogrtPath) {
                    if (mogrtPath) {
                        var transliterationManualWhiteMogrtStatusElement = document.getElementById("transliterationManualWhiteMogrtStatus");
                        if (transliterationManualWhiteMogrtStatusElement) {
                            transliterationManualWhiteMogrtStatusElement.textContent = "Selected: " + mogrtPath.split(/\\\\|\//).pop();
                        }
                        selectedTransliterationWhiteMogrtFile = { path: mogrtPath };
                        console.log("Transliteration Manual White MOGRT selected: " + mogrtPath);
                        checkAndEnableTransliterationManualInsertionButtons();
                    }
                });
            }
        }
    });
}

// Set Transliteration Manual Transcription MOGRT button event listener
var setTransliterationManualTranscriptionMogrtElement = document.getElementById("setTransliterationManualTranscriptionMogrt");
if (setTransliterationManualTranscriptionMogrtElement) {
    setTransliterationManualTranscriptionMogrtElement.addEventListener("click", function () {
        console.log("setTransliterationManualTranscriptionMogrt button clicked");
        var mode = getCurrentMode();
        if (mode === 'transliteration') {
            loadScriptForMode(mode);
            if (typeof csInterface !== 'undefined' && csInterface.evalScript) {
                csInterface.evalScript("selectTranscriptionMogrtFile()", function (mogrtPath) {
                    if (mogrtPath) {
                        var transliterationManualTranscriptionMogrtStatusElement = document.getElementById("transliterationManualTranscriptionMogrtStatus");
                        if (transliterationManualTranscriptionMogrtStatusElement) {
                            transliterationManualTranscriptionMogrtStatusElement.textContent = "Selected: " + mogrtPath.split(/\\\\|\//).pop();
                        }
                        selectedTranscriptionMogrtFile = { path: mogrtPath };
                        console.log("Transliteration Manual Transcription MOGRT selected: " + mogrtPath);
                        checkAndEnableTransliterationManualInsertionButtons();
                    }
                });
            }
        }
    });
}

// Transliteration Manual Timing Event Listeners

// Mark Start Time button event listener
var transliterationMarkStartBtnElement = document.getElementById("transliterationMarkStartBtn");
if (transliterationMarkStartBtnElement) {
    transliterationMarkStartBtnElement.addEventListener("click", function () {
        console.log("transliterationMarkStartBtn button clicked");
        var mode = getCurrentMode();
        if (mode === 'transliteration') {
            loadScriptForMode(mode);
            if (typeof csInterface !== 'undefined' && csInterface.evalScript) {
                csInterface.evalScript("markTransliterationStartTime()");
                updateTransliterationCurrentLineInfo();
            }
        }
    });
}

// Mark End Time button event listener
var transliterationMarkEndBtnElement = document.getElementById("transliterationMarkEndBtn");
if (transliterationMarkEndBtnElement) {
    transliterationMarkEndBtnElement.addEventListener("click", function () {
        console.log("transliterationMarkEndBtn button clicked");
        var mode = getCurrentMode();
        if (mode === 'transliteration') {
            loadScriptForMode(mode);
            if (typeof csInterface !== 'undefined' && csInterface.evalScript) {
                csInterface.evalScript("markTransliterationEndTime()");
                updateTransliterationCurrentLineInfo();
            }
        }
    });
}



// Reset Manual Timing button event listener
var transliterationResetManualTimingBtnElement = document.getElementById("transliterationResetManualTimingBtn");
if (transliterationResetManualTimingBtnElement) {
    transliterationResetManualTimingBtnElement.addEventListener("click", function () {
        console.log("transliterationResetManualTimingBtn button clicked");
        var mode = getCurrentMode();
        if (mode === 'transliteration') {
            loadScriptForMode(mode);
            if (typeof csInterface !== 'undefined' && csInterface.evalScript) {
                csInterface.evalScript("resetTransliterationManualTiming()");
                updateTransliterationCurrentLineInfo();
            }
        }
    });
}

// Transliteration Manual Insertion Event Listeners

// Insert Manual Timed MOGRTs button event listener
var insertTransliterationManualTimedMogrtsBtnElement = document.getElementById("insertTransliterationManualTimedMogrtsBtn");
if (insertTransliterationManualTimedMogrtsBtnElement) {
    insertTransliterationManualTimedMogrtsBtnElement.addEventListener("click", function () {
        console.log("insertTransliterationManualTimedMogrtsBtn button clicked");
        var mode = getCurrentMode();
        if (mode === 'transliteration') {
            loadScriptForMode(mode);
            if (typeof csInterface !== 'undefined' && csInterface.evalScript) {
                csInterface.evalScript("insertTransliterationManualTimedMogrts()");
            }
        }
    });
}



// Helper function to check and enable transliteration manual insertion buttons
function checkAndEnableTransliterationManualInsertionButtons() {
    var textFileStatus = document.getElementById("transliterationTextFileStatus");
    var greenMogrtStatus = document.getElementById("transliterationManualGreenMogrtStatus");
    var whiteMogrtStatus = document.getElementById("transliterationManualWhiteMogrtStatus");
    var transcriptionMogrtStatus = document.getElementById("transliterationManualTranscriptionMogrtStatus");
    
    var insertManualTimedMogrtsBtn = document.getElementById("insertTransliterationManualTimedMogrtsBtn");
    var timingProgressInfo = document.getElementById("transliterationTimingProgressInfo");
    
    if (textFileStatus && greenMogrtStatus && whiteMogrtStatus && transcriptionMogrtStatus &&
        textFileStatus.textContent !== "No file selected" &&
        greenMogrtStatus.textContent !== "No file selected" &&
        whiteMogrtStatus.textContent !== "No file selected" &&
        transcriptionMogrtStatus.textContent !== "No file selected") {
        
        if (insertManualTimedMogrtsBtn) insertManualTimedMogrtsBtn.disabled = false;
        if (timingProgressInfo) {
            timingProgressInfo.textContent = "All files selected. Use START and END buttons to mark timing, then insert MOGRTs.";
        }
    }
}

// Helper function to update transliteration current line info
function updateTransliterationCurrentLineInfo() {
    var mode = getCurrentMode();
    if (mode === 'transliteration') {
        loadScriptForMode(mode);
        if (typeof csInterface !== 'undefined' && csInterface.evalScript) {
            csInterface.evalScript("getTransliterationManualTimingStatus()", function (status) {
                var currentLineInfo = document.getElementById("transliterationCurrentLineInfo");
                var timingProgressInfo = document.getElementById("transliterationTimingProgressInfo");
                
                if (currentLineInfo) {
                    currentLineInfo.textContent = status;
                }
                if (timingProgressInfo) {
                    timingProgressInfo.textContent = status;
                }
            });
        }
    }
}

// Insert transliteration subtitles button event listener
var insertTransliterationSubtitlesBtnElement = document.getElementById("insertTransliterationSubtitlesBtn");
if (insertTransliterationSubtitlesBtnElement) {
    insertTransliterationSubtitlesBtnElement.addEventListener("click", function () {
        console.log("insertTransliterationSubtitlesBtn clicked");
        var mode = getCurrentMode();
        if (mode === 'transliteration') {
            loadScriptForMode(mode);
            
            // Check which transliteration mode is selected
            var transliterationModeSelect = document.getElementById("transliterationModeSelect");
            var transliterationMode = transliterationModeSelect ? transliterationModeSelect.value : "manual";
            console.log("Transliteration mode: " + transliterationMode);
            
            if (transliterationMode === "manual") {
                // Manual mode - need both SRTs and 3 MOGRTs (transliteration green, transliteration white, transcription white)
                if (!selectedTransliterationSrtFile || !selectedTranscriptionSrtFile || !selectedTransliterationGreenMogrtFile || !selectedTransliterationWhiteMogrtFile || !selectedTranscriptionMogrtFile) {
                    alert("Please select both SRT files and all 3 MOGRT files:\n- Transliteration SRT\n- Transcription SRT\n- Transliteration Green MOGRT\n- Transliteration White MOGRT\n- Transcription White MOGRT");
                    return;
                }
                console.log("Calling insertTransliterationSubtitles with 3 MOGRTs");
                if (typeof csInterface !== 'undefined' && csInterface.evalScript) {
                    csInterface.evalScript("insertTransliterationSubtitlesWith3Mogrts()");
                }
            } else if (transliterationMode === "manual-text") {
                // Manual text mode - need text file and 3 MOGRTs
                if (!selectedTransliterationTextFile || !selectedTransliterationGreenMogrtFile || !selectedTransliterationWhiteMogrtFile || !selectedTranscriptionMogrtFile) {
                    alert("Please select text file and all 3 MOGRT files:\n- Transliteration Green MOGRT\n- Transliteration White MOGRT\n- Transcription White MOGRT");
                    return;
                }
                console.log("Manual text mode - user should use the manual insertion buttons");
                alert("For manual text mode, please use the 'Insert Manual Timed MOGRTs' or 'Insert with Crop Effects' buttons after marking timing with START and END buttons.");
            } else if (transliterationMode === "animated") {
                // Animated mode - need both SRTs and animated MOGRT
                if (!selectedTransliterationSrtFile || !selectedTranscriptionSrtFile || !selectedTransliterationAnimatedMogrtFile) {
                    alert("Please select both SRT files and Animated MOGRT first.");
                    return;
                }
                console.log("Calling insertTransliterationSubtitles");
                if (typeof csInterface !== 'undefined' && csInterface.evalScript) {
                    csInterface.evalScript("insertTransliterationSubtitles()");
                }
            }
        }
    });
}

// Transliteration crop instructions button event listener
var transliterationCropBtnElement = document.getElementById("transliterationCropBtn");
if (transliterationCropBtnElement) {
    transliterationCropBtnElement.addEventListener("click", function () {
        console.log("transliterationCropBtn clicked");
        var mode = getCurrentMode();
        console.log("Current mode for transliteration crop: " + mode);
        
        // Show immediate feedback
        alert("Transliteration Crop Instructions Button Clicked! Opening instructions...");
        
        if (mode === 'transliteration') {
            loadScriptForMode(mode);
            console.log("Calling showTransliterationManualCropInstructions");
            if (typeof csInterface !== 'undefined' && csInterface.evalScript) {
                csInterface.evalScript("showTransliterationManualCropInstructions()", function(result) {
                    console.log("showTransliterationManualCropInstructions result: " + result);
                });
            }
        } else {
            console.log("Wrong mode for transliteration crop button: " + mode);
            alert("Please select Feature 3: Transliteration Subtitles first!");
        }
    });
}

// Reset button event listener
var resetElement = document.getElementById("reset");
if (resetElement) {
    resetElement.addEventListener("click", function () {
        console.log("reset button clicked");
        var mode = getCurrentMode();
        if (mode === 'static') {
            loadScriptForMode(mode);
            if (typeof csInterface !== 'undefined' && csInterface.evalScript) {
                csInterface.evalScript("resetSubtitles()");
            }
        } else if (mode === 'color') {
            loadScriptForMode(mode);
            if (typeof csInterface !== 'undefined' && csInterface.evalScript) {
                csInterface.evalScript("resetColorSubtitles()");
            }
        } else if (mode === 'transliteration') {
            loadScriptForMode(mode);
            if (typeof csInterface !== 'undefined' && csInterface.evalScript) {
                csInterface.evalScript("resetTransliterationSubtitles()");
            }
        }
        
        // Reset file status displays
        resetFileStatus();
    });
}

window.setTextBox = function(text) {
    document.getElementById("subtitleText").value = text;
};

// Global error handler
window.addEventListener('error', function(event) {
    console.log("Global error caught:", event.error);
    console.log("Error message:", event.message);
    console.log("Error filename:", event.filename);
    console.log("Error line number:", event.lineno);
});

// Test CSInterface functionality
function testCSInterface() {
    console.log("Testing CSInterface functionality...");
    console.log("CSInterface object:", csInterface);
    console.log("CSInterface type:", typeof csInterface);
    
    if (csInterface) {
        console.log("evalScript method:", typeof csInterface.evalScript);
        console.log("getSystemPath method:", typeof csInterface.getSystemPath);
        
        // Test a simple evalScript call
        safeEvalScript("'CSInterface test successful'", function(result) {
            console.log("CSInterface test result:", result);
        });
    } else {
        console.log("CSInterface is not available");
    }
}

// Initialize the UI on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM loaded, initializing UI...");
    
    // Test CSInterface
    testCSInterface();
    
    // Set initial mode
    var initialMode = getCurrentMode();
    console.log("Initial mode: " + initialMode);
    
    if (initialMode === "static") {
        var staticControls = document.getElementById("staticModeControls");
        if (staticControls) staticControls.style.display = "block";
        loadScriptForMode(initialMode);
    } else if (initialMode === "color") {
        var colorControls = document.getElementById("colorModeControls");
        if (colorControls) colorControls.style.display = "block";
        loadScriptForMode(initialMode);
    } else if (initialMode === "transliteration") {
        var transliterationControls = document.getElementById("transliterationModeControls");
        if (transliterationControls) transliterationControls.style.display = "block";
    loadScriptForMode(initialMode);
    }
    
    // Verify all elements exist
    console.log("Verifying elements exist:");
    console.log("colorModeSelect:", document.getElementById("colorModeSelect"));
    console.log("transliterationModeSelect:", document.getElementById("transliterationModeSelect"));
    console.log("manualCropBtn:", document.getElementById("manualCropBtn"));
    console.log("transliterationCropBtn:", document.getElementById("transliterationCropBtn"));
    console.log("manualModeFiles:", document.getElementById("manualModeFiles"));
    console.log("animatedModeFiles:", document.getElementById("animatedModeFiles"));
    console.log("transliterationManualFiles:", document.getElementById("transliterationManualFiles"));
    console.log("transliterationAnimatedFiles:", document.getElementById("transliterationAnimatedFiles"));
    
    console.log("UI initialization complete");
});

// Function to manually test mode changes
function testModeChanges() {
    console.log("=== Testing Mode Changes ===");
    
    // Test Color Mode
    var colorModeSelect = document.getElementById("colorModeSelect");
    if (colorModeSelect) {
        console.log("Testing color mode change to animated");
        colorModeSelect.value = "animated";
        colorModeSelect.dispatchEvent(new Event('change'));
        
        setTimeout(function() {
            console.log("Testing color mode change to manual");
            colorModeSelect.value = "manual";
            colorModeSelect.dispatchEvent(new Event('change'));
        }, 1000);
    }
    
    // Test Transliteration Mode
    var transliterationModeSelect = document.getElementById("transliterationModeSelect");
    if (transliterationModeSelect) {
        setTimeout(function() {
            console.log("Testing transliteration mode change to animated");
            transliterationModeSelect.value = "animated";
            transliterationModeSelect.dispatchEvent(new Event('change'));
            
            setTimeout(function() {
                console.log("Testing transliteration mode change to manual");
                transliterationModeSelect.value = "manual";
                transliterationModeSelect.dispatchEvent(new Event('change'));
            }, 1000);
        }, 2000);
    }
}

// Add test function to window for manual testing
window.testModeChanges = testModeChanges;

// Function to test all workflows
function testAllWorkflows() {
    console.log("=== TESTING ALL WORKFLOWS ===");
    
    // Test Feature 2: Color Subtitles - Manual Mode
    console.log("1. Testing Feature 2 - Manual Mode");
    document.getElementById("subtitleMode").value = "color";
    document.getElementById("subtitleMode").dispatchEvent(new Event('change'));
    
    setTimeout(function() {
        document.getElementById("colorModeSelect").value = "manual";
        document.getElementById("colorModeSelect").dispatchEvent(new Event('change'));
        console.log("✓ Manual mode selected");
        
        // Test file selection buttons
        console.log("Testing file selection buttons...");
        document.getElementById("setSrtFile").click();
        document.getElementById("setMogrt").click();
        document.getElementById("setMogrt2").click();
        
        // Test insert button
        setTimeout(function() {
            console.log("Testing insert button...");
            document.getElementById("autoInsertBothMogrtsBtn").click();
        }, 500);
        
        // Test crop instructions
        setTimeout(function() {
            console.log("Testing crop instructions...");
            document.getElementById("manualCropBtn").click();
        }, 1000);
        
    }, 500);
    
    // Test Feature 2: Color Subtitles - Animated Mode
    setTimeout(function() {
        console.log("2. Testing Feature 2 - Animated Mode");
        document.getElementById("colorModeSelect").value = "animated";
        document.getElementById("colorModeSelect").dispatchEvent(new Event('change'));
        
        setTimeout(function() {
            console.log("Testing animated file selection...");
            document.getElementById("setAnimatedMogrt").click();
            
            setTimeout(function() {
                console.log("Testing animated insert button...");
                document.getElementById("autoInsertBothMogrtsBtn").click();
            }, 500);
        }, 500);
        
    }, 3000);
    
    // Test Feature 3: Transliteration Subtitles - Manual Mode
    setTimeout(function() {
        console.log("3. Testing Feature 3 - Manual Mode");
        document.getElementById("subtitleMode").value = "transliteration";
        document.getElementById("subtitleMode").dispatchEvent(new Event('change'));
        
        setTimeout(function() {
            document.getElementById("transliterationModeSelect").value = "manual";
            document.getElementById("transliterationModeSelect").dispatchEvent(new Event('change'));
            console.log("✓ Transliteration manual mode selected");
            
            // Test file selection buttons
            console.log("Testing transliteration file selection buttons...");
            document.getElementById("setTransliterationSrt").click();
            document.getElementById("setTranscriptionSrt").click();
            document.getElementById("setTransliterationMogrt").click();
            document.getElementById("setTranscriptionMogrt").click();
            
            // Test insert button
            setTimeout(function() {
                console.log("Testing transliteration insert button...");
                document.getElementById("insertTransliterationSubtitlesBtn").click();
            }, 500);
            
            // Test crop instructions
            setTimeout(function() {
                console.log("Testing transliteration crop instructions...");
                document.getElementById("transliterationCropBtn").click();
            }, 1000);
            
        }, 500);
        
    }, 6000);
    
    // Test Feature 3: Transliteration Subtitles - Animated Mode
    setTimeout(function() {
        console.log("4. Testing Feature 3 - Animated Mode");
        document.getElementById("transliterationModeSelect").value = "animated";
        document.getElementById("transliterationModeSelect").dispatchEvent(new Event('change'));
        
        setTimeout(function() {
            console.log("Testing transliteration animated file selection...");
            document.getElementById("setTransliterationAnimatedMogrt").click();
            
            setTimeout(function() {
                console.log("Testing transliteration animated insert button...");
                document.getElementById("insertTransliterationSubtitlesBtn").click();
            }, 500);
        }, 500);
        
    }, 9000);
    
    console.log("=== ALL WORKFLOW TESTS COMPLETE ===");
}

// Add test function to window for manual testing
window.testAllWorkflows = testAllWorkflows;

// Function to show current state and verify all buttons
function showButtonStatus() {
    console.log("=== BUTTON STATUS CHECK ===");
    
    var currentMode = getCurrentMode();
    console.log("Current Feature Mode: " + currentMode);
    
    // Check Feature 2 elements
    if (currentMode === 'color') {
        var colorMode = document.getElementById("colorModeSelect").value;
        console.log("Color Mode: " + colorMode);
        
        console.log("Feature 2 Buttons:");
        console.log("- setSrtFile (SRT): " + (document.getElementById("setSrtFile") ? "✓ Found" : "✗ Missing"));
        console.log("- setMogrt (White): " + (document.getElementById("setMogrt") ? "✓ Found" : "✗ Missing"));
        console.log("- setMogrt2 (Green): " + (document.getElementById("setMogrt2") ? "✓ Found" : "✗ Missing"));
        console.log("- setAnimatedMogrt: " + (document.getElementById("setAnimatedMogrt") ? "✓ Found" : "✗ Missing"));
        console.log("- autoInsertBothMogrtsBtn: " + (document.getElementById("autoInsertBothMogrtsBtn") ? "✓ Found" : "✗ Missing"));
        console.log("- manualCropBtn: " + (document.getElementById("manualCropBtn") ? "✓ Found" : "✗ Missing"));
        
        console.log("Feature 2 Dropdowns:");
        console.log("- colorModeSelect: " + (document.getElementById("colorModeSelect") ? "✓ Found" : "✗ Missing"));
        console.log("- videoTrackSelect: " + (document.getElementById("videoTrackSelect") ? "✓ Found" : "✗ Missing"));
        console.log("- cropTransitionSelect: " + (document.getElementById("cropTransitionSelect") ? "✓ Found" : "✗ Missing"));
        
        console.log("Feature 2 File Groups:");
        console.log("- manualModeFiles: " + (document.getElementById("manualModeFiles") ? "✓ Found" : "✗ Missing"));
        console.log("- animatedModeFiles: " + (document.getElementById("animatedModeFiles") ? "✓ Found" : "✗ Missing"));
    }
    
    // Check Feature 3 elements
    if (currentMode === 'transliteration') {
        var transliterationMode = document.getElementById("transliterationModeSelect").value;
        console.log("Transliteration Mode: " + transliterationMode);
        
        console.log("Feature 3 Buttons:");
        console.log("- setTransliterationSrt: " + (document.getElementById("setTransliterationSrt") ? "✓ Found" : "✗ Missing"));
        console.log("- setTranscriptionSrt: " + (document.getElementById("setTranscriptionSrt") ? "✓ Found" : "✗ Missing"));
        console.log("- setTransliterationMogrt: " + (document.getElementById("setTransliterationMogrt") ? "✓ Found" : "✗ Missing"));
        console.log("- setTranscriptionMogrt: " + (document.getElementById("setTranscriptionMogrt") ? "✓ Found" : "✗ Missing"));
        console.log("- setTransliterationAnimatedMogrt: " + (document.getElementById("setTransliterationAnimatedMogrt") ? "✓ Found" : "✗ Missing"));
        console.log("- insertTransliterationSubtitlesBtn: " + (document.getElementById("insertTransliterationSubtitlesBtn") ? "✓ Found" : "✗ Missing"));
        console.log("- transliterationCropBtn: " + (document.getElementById("transliterationCropBtn") ? "✓ Found" : "✗ Missing"));
        
        console.log("Feature 3 Dropdowns:");
        console.log("- transliterationModeSelect: " + (document.getElementById("transliterationModeSelect") ? "✓ Found" : "✗ Missing"));
        console.log("- transliterationVideoTrackSelect: " + (document.getElementById("transliterationVideoTrackSelect") ? "✓ Found" : "✗ Missing"));
        console.log("- transliterationCropSelect: " + (document.getElementById("transliterationCropSelect") ? "✓ Found" : "✗ Missing"));
        
        console.log("Feature 3 File Groups:");
        console.log("- transliterationManualFiles: " + (document.getElementById("transliterationManualFiles") ? "✓ Found" : "✗ Missing"));
        console.log("- transliterationAnimatedFiles: " + (document.getElementById("transliterationAnimatedFiles") ? "✓ Found" : "✗ Missing"));
    }
    
    console.log("=== STATUS CHECK COMPLETE ===");
}

// Add status function to window for manual testing
window.showButtonStatus = showButtonStatus;

// Function to manually test dropdown changes
function testDropdownChanges() {
    console.log("=== TESTING DROPDOWN CHANGES ===");
    
    // Test Feature 2 dropdown
    console.log("Testing Feature 2 dropdown...");
    var colorModeSelect = document.getElementById("colorModeSelect");
    if (colorModeSelect) {
        console.log("Current color mode: " + colorModeSelect.value);
        
        // Test change to animated
        colorModeSelect.value = "animated";
        colorModeSelect.dispatchEvent(new Event('change'));
        
        setTimeout(function() {
            // Test change to manual
            colorModeSelect.value = "manual";
            colorModeSelect.dispatchEvent(new Event('change'));
        }, 2000);
    } else {
        console.log("❌ colorModeSelect not found!");
    }
    
    // Test Feature 3 dropdown
    setTimeout(function() {
        console.log("Testing Feature 3 dropdown...");
        var transliterationModeSelect = document.getElementById("transliterationModeSelect");
        if (transliterationModeSelect) {
            console.log("Current transliteration mode: " + transliterationModeSelect.value);
            
            // Test change to animated
            transliterationModeSelect.value = "animated";
            transliterationModeSelect.dispatchEvent(new Event('change'));
            
            setTimeout(function() {
                // Test change to manual
                transliterationModeSelect.value = "manual";
                transliterationModeSelect.dispatchEvent(new Event('change'));
            }, 2000);
        } else {
            console.log("❌ transliterationModeSelect not found!");
        }
    }, 5000);
}

// Add test function to window for manual testing
window.testDropdownChanges = testDropdownChanges;

// Function to ensure correct file groups are shown
function ensureCorrectFileGroups() {
    console.log("=== ENSURING CORRECT FILE GROUPS ===");
    
    var currentMode = getCurrentMode();
    console.log("Current feature mode: " + currentMode);
    
    if (currentMode === 'color') {
        var colorMode = document.getElementById("colorModeSelect").value;
        console.log("Color mode: " + colorMode);
        
        var manualFiles = document.getElementById("manualModeFiles");
        var animatedFiles = document.getElementById("animatedModeFiles");
        
        if (colorMode === "manual") {
            if (manualFiles) manualFiles.style.display = "block";
            if (animatedFiles) animatedFiles.style.display = "none";
            console.log("✓ Set color manual files visible");
        } else if (colorMode === "animated") {
            if (manualFiles) manualFiles.style.display = "none";
            if (animatedFiles) animatedFiles.style.display = "block";
            console.log("✓ Set color animated files visible");
        }
    } else if (currentMode === 'transliteration') {
        var transliterationMode = document.getElementById("transliterationModeSelect").value;
        console.log("Transliteration mode: " + transliterationMode);
        
        var manualFiles = document.getElementById("transliterationManualFiles");
        var animatedFiles = document.getElementById("transliterationAnimatedFiles");
        
        if (transliterationMode === "manual") {
            if (manualFiles) manualFiles.style.display = "block";
            if (animatedFiles) animatedFiles.style.display = "none";
            console.log("✓ Set transliteration manual files visible");
        } else if (transliterationMode === "animated") {
            if (manualFiles) manualFiles.style.display = "none";
            if (animatedFiles) animatedFiles.style.display = "block";
            console.log("✓ Set transliteration animated files visible");
        }
    }
}

// Add function to window for manual testing
window.ensureCorrectFileGroups = ensureCorrectFileGroups;