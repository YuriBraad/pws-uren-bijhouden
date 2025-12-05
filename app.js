// app.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, deleteDoc } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

// ------------------ Firebase Config ------------------
const firebaseConfig = {
  apiKey: "AIzaSyAsqPXGpMRnoT-NPX5UAMhIW3yFNgamOOs",
  authDomain: "pws-uren-bijhouden.firebaseapp.com",
  projectId: "pws-uren-bijhouden",
  storageBucket: "pws-uren-bijhouden.firebasestorage.app",
  messagingSenderId: "783211206276",
  appId: "1:783211206276:web:7747622261a1a45bf554d1",
  measurementId: "G-G7W3JCSQDC"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ------------------ DOM Elements ------------------
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const timerDisplay = document.getElementById("timerDisplay");
const addOldTimeBtn = document.getElementById("addOldTimeBtn");
const popupOverlay = document.getElementById("popupOverlay");
const reasonInput = document.getElementById("reasonInput");
const personNancy = document.getElementById("personNancy");
const personTijs = document.getElementById("personTijs");
const personNick = document.getElementById("personNick");
const hoursInput = document.getElementById("hoursInput");
const minutesInput = document.getElementById("minutesInput");
const saveBtn = document.getElementById("saveBtn");
const cancelBtn = document.getElementById("cancelBtn");
const logList = document.getElementById("logList");

const hoursNancyEl = document.getElementById("hoursNancy");
const hoursTijsEl = document.getElementById("hoursTijs");
const hoursNickEl = document.getElementById("hoursNick");

// ------------------ Timer Variables ------------------
let timer = null;
let startTime = null;
let elapsedTime = 0;
let isTimerRunning = false;

// ------------------ Persoon Uren ------------------
let totalMinutes = { Nancy: 0, Tijs: 0, Nick: 0 };

// ------------------ Timer Functions ------------------
function updateTimerDisplay() {
    const totalSeconds = Math.floor(elapsedTime / 1000);
    const hrs = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
    const mins = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
    const secs = String(totalSeconds % 60).padStart(2, "0");
    timerDisplay.textContent = `${hrs}:${mins}:${secs}`;
}

function startTimer() {
    if (isTimerRunning) return;
    isTimerRunning = true;
    startTime = Date.now() - elapsedTime;
    timer = setInterval(() => {
        elapsedTime = Date.now() - startTime;
        updateTimerDisplay();
    }, 1000);
}

function stopTimer() {
    if (!isTimerRunning) return;
    isTimerRunning = false;
    clearInterval(timer);
    showPopup("active");
}

// ------------------ Pop-up Functions ------------------
let currentMode = ""; // "active" of "old"

function showPopup(mode) {
    currentMode = mode;
    reasonInput.value = "";
    personNancy.checked = false;
    personTijs.checked = false;
    personNick.checked = false;
    if (mode === "old") {
        hoursInput.style.display = "block";
        minutesInput.style.display = "block";
        hoursInput.value = "";
        minutesInput.value = "";
    } else {
        hoursInput.style.display = "none";
        minutesInput.style.display = "none";
    }
    popupOverlay.style.display = "flex";
}

function hidePopup() {
    popupOverlay.style.display = "none";
}

// ------------------ Save Log ------------------
async function saveLog() {
    const reason = reasonInput.value.trim();
    const persons = [];
    if (personNancy.checked) persons.push("Nancy");
    if (personTijs.checked) persons.push("Tijs");
    if (personNick.checked) persons.push("Nick");

    if (persons.length === 0 || reason === "") {
        alert("Vul een reden in en selecteer minstens één persoon.");
        return;
    }

    let logData = {
        timestamp: new Date(),
        reason,
        persons
    };

    if (currentMode === "active") {
        logData.minutes = Math.floor(elapsedTime / 60000);
    } else if (currentMode === "old") {
        const hrs = parseInt(hoursInput.value) || 0;
        const mins = parseInt(minutesInput.value) || 0;
        if (mins < 1 && hrs < 1) {
            alert("Minuten moeten minimaal 1 zijn als uren 0 is.");
            return;
        }
        logData.minutes = hrs * 60 + mins;
    }

    try {
        await addDoc(collection(db, "logs"), logData);
        hidePopup();
        elapsedTime = 0;
        updateTimerDisplay();
    } catch (err) {
        console.error("Error adding document: ", err);
    }
}

// ------------------ Format Helper ------------------
function formatHoursMinutes(totalMins) {
    const hrs = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    return `${hrs}u ${mins}m`;
}

// ------------------ Update Uren Display + Verwijderen ------------------
function updateTotalHours(logs) {
    totalMinutes = { Nancy: 0, Tijs: 0, Nick: 0 };
    logList.innerHTML = "";

    logs.forEach(docSnap => {
        const data = docSnap.data();
        const logItem = document.createElement("div");
        logItem.className = "log-entry";

        const date = data.timestamp.toDate ? data.timestamp.toDate() : data.timestamp;
        const personsStr = data.persons.join(", ");
        const mins = data.minutes;
        logItem.textContent = `${date.toLocaleString()} - ${personsStr} - ${mins} min - ${data.reason}`;

        // Verwijderknop
        const delBtn = document.createElement("button");
        delBtn.textContent = "Verwijderen";
        delBtn.style.marginLeft = "10px";
        delBtn.style.background = "#e74c3c";
        delBtn.style.color = "white";
        delBtn.style.border = "none";
        delBtn.style.padding = "5px 10px";
        delBtn.style.borderRadius = "6px";
        delBtn.style.cursor = "pointer";
        delBtn.addEventListener("click", async () => {
            if (confirm("Weet je zeker dat je deze tijd wilt verwijderen?")) {
                try {
                    await deleteDoc(docSnap.ref);
                } catch (err) {
                    console.error("Fout bij verwijderen:", err);
                }
            }
        });

        logItem.appendChild(delBtn);
        logList.appendChild(logItem);

        // Optellen per persoon
        data.persons.forEach(p => {
            totalMinutes[p] += mins;
        });
    });

    hoursNancyE1.textContent = formatHoursMinutes(totalMinutes.Nancy);
    hoursTijsEl.textContent = formatHoursMinutes(totalMinutes.Tijs);
    hoursNickEl.textContent = formatHoursMinutes(totalMinutes.Nick);
}

// ------------------ Firestore Listener ------------------
const q = query(collection(db, "logs"), orderBy("timestamp", "asc"));
onSnapshot(q, snapshot => {
    updateTotalHours(snapshot.docs);
});

// ------------------ Event Listeners ------------------
startBtn.addEventListener("click", startTimer);
stopBtn.addEventListener("click", stopTimer);
addOldTimeBtn.addEventListener("click", () => showPopup("old"));
saveBtn.addEventListener("click", saveLog);

// Bij annuleren: sluit popup en reset timer als het een actieve timer was
cancelBtn.addEventListener("click", () => {
    hidePopup();
    if (currentMode === "active") {
        elapsedTime = 0;
        updateTimerDisplay();
    }
});
