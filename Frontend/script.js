// ============================================================
// CONFIGURATION
// ============================================================

const API_BASE_URL = "http://127.0.0.1:8000";


// ============================================================
// GLOBAL STATE
// ============================================================

let videoReady = false;

let userId = crypto.randomUUID();  // Generate a new temporary user ID every time

// ============================================================
// DOM ELEMENTS
// ============================================================

const youtubeUrl =
    document.getElementById("youtubeUrl");

const processBtn =
    document.getElementById("processBtn");

const processText =
    document.getElementById("processText");

const processIcon =
    document.getElementById("processIcon");

const loadingOverlay =
    document.getElementById("loadingOverlay");

const loadingText =
    document.getElementById("loadingText");

const videoPreviewCard =
    document.getElementById("videoPreviewCard");

const videoThumb =
    document.getElementById("videoThumb");

const videoThumbTitle =
    document.getElementById("videoThumbTitle");

const chatMessages =
    document.getElementById("chatMessages");

const chatInput =
    document.getElementById("chatInput");

const sendBtn =
    document.getElementById("sendBtn");


// ============================================================
// PROCESS VIDEO
// ============================================================

async function processVideo() {

    const url =
        youtubeUrl.value.trim();

    if (!url) {

        showError(
            "Please enter a YouTube URL."
        );

        return;
    }

    processBtn.disabled = true;

    processText.textContent =
        "Processing...";

    processIcon.textContent =
        "⟳";

    loadingOverlay.classList.add("show");

    try {

        // ----------------------------------------------------
        // SEND URL TO FASTAPI
        // ----------------------------------------------------

        loadingText.textContent =
            "Sending video to AI...";

        setStatus(
            "statusTranscript",
            "active",
            "Processing"
        );

        const response = await fetch(
            `${API_BASE_URL}/youtube_url`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                // FastAPI expects "url"
                body: JSON.stringify({
                    url: url,
                    user_id: userId
                })
            }
        );


        if (!response.ok) {

            throw new Error(
                "Backend processing failed."
            );
        }


        const data =
            await response.json();

        console.log(
            "Backend response:",
            data
        );


        // ----------------------------------------------------
        // PROCESSING COMPLETED
        // ----------------------------------------------------

        loadingText.textContent =
            "Creating document...";

        setStatus(
            "statusTranscript",
            "completed",
            "Completed"
        );

        setStatus(
            "statusDocument",
            "active",
            "Creating"
        );

        await delay(700);

        setStatus(
            "statusDocument",
            "completed",
            "Completed"
        );


        // ----------------------------------------------------
        // PREPARE AI KNOWLEDGE BASE
        // ----------------------------------------------------

        loadingText.textContent =
            "Preparing AI knowledge base...";

        setStatus(
            "statusEmbeddings",
            "active",
            "Creating"
        );

        await delay(700);

        setStatus(
            "statusEmbeddings",
            "completed",
            "Completed"
        );


        // ----------------------------------------------------
        // VIDEO READY
        // ----------------------------------------------------

        videoReady = true;

        loadingOverlay.classList.remove("show");

        processBtn.disabled = false;

        processText.textContent =
            "Video Ready";

        processIcon.textContent =
            "✓";

        showReadyState();


    } catch (error) {

        console.error(error);

        loadingOverlay.classList.remove("show");

        processBtn.disabled = false;

        processText.textContent =
            "Process Video";

        processIcon.textContent =
            "✦";

        showError(
            "Could not process the video."
        );
    }
}


// ============================================================
// READY STATE
// ============================================================

function showReadyState() {

    document
        .getElementById("readyCard")
        .classList.add("show");

    showVideoThumbnail(
        youtubeUrl.value.trim()
    );
}


function showVideoThumbnail(url) {

    if (!url) {
        return;
    }

    const videoId =
        extractYouTubeVideoId(url);

    if (!videoId) {
        return;
    }

    videoThumb.src =
        `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

    videoThumb.alt =
        "YouTube video thumbnail";

    videoThumbTitle.textContent =
        "Video ready";

    videoPreviewCard.classList.add("show");
}


function extractYouTubeVideoId(url) {

    const match =
        url.match(
            /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([A-Za-z0-9_-]{11})/
        );

    if (match && match[1]) {
        return match[1];
    }

    const alternateMatch =
        url.match(/([A-Za-z0-9_-]{11})/);

    return alternateMatch ? alternateMatch[1] : null;
}


// ============================================================
// STATUS HELPER
// ============================================================

function setStatus(
    id,
    state,
    text
) {

    const element =
        document.getElementById(id);

    element.classList.remove(
        "active",
        "completed"
    );

    if (state) {

        element.classList.add(state);
    }

    const span =
        element.querySelector("span");

    span.textContent =
        text;
}


// ============================================================
// CHAT
// ============================================================

async function sendMessage() {

    const message =
        chatInput.value.trim();

    if (!message) {
        return;
    }

    if (!videoReady) {

        addMessage(
            "ai",
            "Please process a YouTube video first. Once the document is ready, you can ask me questions about it."
        );

        return;
    }


    // Add user message

    addMessage(
        "user",
        message
    );

    chatInput.value = "";

    chatInput.style.height =
        "auto";

    sendBtn.disabled = true;


    // Typing indicator

    const typingId =
        addTypingIndicator();


    try {

        // ----------------------------------------------------
        // SEND QUESTION TO FASTAPI
        // ----------------------------------------------------

        const response =
            await fetch(
                `${API_BASE_URL}/ask`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    // FastAPI expects "input"
                    body: JSON.stringify({
                        input: message,
                        user_id: userId
                    })
                }
            );


        if (!response.ok) {

            throw new Error(
                "Chat request failed."
            );
        }


        const data =
            await response.json();


        console.log(
            "Chat response:",
            data
        );


        removeTypingIndicator(
            typingId
        );


        // FastAPI returns {"m": response}

        addMessage(
            "ai",
            data.response ||
            "I couldn't generate an answer."
        );


    } catch (error) {

        console.error(error);

        removeTypingIndicator(
            typingId
        );

        addMessage(
            "ai",
            "Sorry, something went wrong while communicating with the AI."
        );


    } finally {

        sendBtn.disabled = false;

        chatInput.focus();
    }
}


// ============================================================
// ADD MESSAGE
// ============================================================

function addMessage(
    type,
    text
) {

    const message =
        document.createElement("div");

    message.className =
        `message ${type}`;

    const content =
        document.createElement("div");

    content.className =
        "message-content";

    content.textContent =
        text;

    message.appendChild(
        content
    );

    chatMessages.appendChild(
        message
    );

    scrollChat();
}

// ============================================================
// CLEANUP TEMPORARY SESSION
// ============================================================

function cleanupSession() {

    const data =
        new URLSearchParams();

    data.append(
        "user_id",
        userId
    );


    navigator.sendBeacon(
        `${API_BASE_URL}/cleanup`,
        data
    );


    console.log(
        "Cleanup requested for:",
        userId
    );
}


// ============================================================
// PAGE LEAVE / RELOAD
// ============================================================

window.addEventListener(
    "pagehide",
    cleanupSession
);


// ============================================================
// TYPING INDICATOR
// ============================================================

function addTypingIndicator() {

    const id =
        "typing-" + Date.now();

    const message =
        document.createElement("div");

    message.className =
        "message ai";

    message.id =
        id;

    message.innerHTML = `

        <div class="message-content">

            <div class="typing">

                <span></span>
                <span></span>
                <span></span>

            </div>

        </div>

    `;

    chatMessages.appendChild(
        message
    );

    scrollChat();

    return id;
}


function removeTypingIndicator(id) {

    const element =
        document.getElementById(id);

    if (element) {

        element.remove();
    }
}


// ============================================================
// SUGGESTION BUTTONS
// ============================================================

function useSuggestion(text) {

    chatInput.value =
        text;

    chatInput.focus();

    autoResizeTextarea();
}


// ============================================================
// ENTER KEY
// ============================================================

function handleEnter(event) {

    if (
        event.key === "Enter" &&
        !event.shiftKey
    ) {

        event.preventDefault();

        sendMessage();
    }
}


// ============================================================
// TEXTAREA AUTO RESIZE
// ============================================================

chatInput.addEventListener(
    "input",
    autoResizeTextarea
);


function autoResizeTextarea() {

    chatInput.style.height =
        "auto";

    chatInput.style.height =
        Math.min(
            chatInput.scrollHeight,
            90
        ) + "px";
}


// ============================================================
// CLEAR CHAT
// ============================================================

function clearChat() {

    chatMessages.innerHTML = `

        <div class="welcome-message">

            <div class="welcome-icon">
                ✦
            </div>

            <h3>
                Ask me anything about this video
            </h3>

            <p>
                Once the video is processed, I can summarize,
                explain concepts, find specific information,
                and answer questions using the video's content.
            </p>

            <div class="suggestions">

                <button
                    onclick="useSuggestion('Summarize this video')"
                >
                    Summarize the video
                </button>

                <button
                    onclick="useSuggestion('What are the main concepts discussed?')"
                >
                    Main concepts
                </button>

                <button
                    onclick="useSuggestion('Explain the most important points')"
                >
                    Important points
                </button>

            </div>

        </div>

    `;
}


// ============================================================
// ERROR MESSAGE
// ============================================================

function showError(message) {

    addMessage(
        "ai",
        `⚠️ ${message}`
    );
}


// ============================================================
// SCROLL CHAT
// ============================================================

function scrollChat() {

    chatMessages.scrollTop =
        chatMessages.scrollHeight;
}


// ============================================================
// DELAY
// ============================================================

function delay(ms) {

    return new Promise(
        resolve =>
            setTimeout(resolve, ms)
    );
}


// ============================================================
// INITIAL STATE
// ============================================================

console.log(
    "VideoMind AI frontend loaded."
);