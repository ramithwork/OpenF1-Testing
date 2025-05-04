// updateStatus("Fetching session key...")
// const sessionKey = 10028 //Miami
// const sessionKey = 10022 //Jeddah
// const sessionKey = "latest" //Latest

// const sessionKeyInput = document.getElementById("session-key")
// const sessionKey = sessionKeyInput.value
// updateStatus(`Session key: ${sessionKey}`)

let stop = false;
const stopBtn = document.getElementById("stop")
stopBtn.addEventListener("click", function() {
    stop = true;
    updateStatus("Stopping session data fetching...");
    stopBtn.disabled = false;
    startBtn.disabled = false;
    updateStatus("Session data fetching stopped.");
})

const startBtn = document.getElementById("start")
startBtn.addEventListener("click", function() {
    startBtn.disabled = true;
    updateStatus("Fetching session data...")
    const sessionKeyInput = document.getElementById("session-key")
    const sessionKey = sessionKeyInput.value
    updateStatus(`Session key: ${sessionKey}`)
    updateStatus("Session data fetching started.");
    getSessionData(sessionKey); // Initial run is required. Otherwise have to wait for the refresh-rate time delay.
    if (!stop) {
        const sessionKey = sessionKeyInput.value
        updateStatus(`Session key: ${sessionKey}`)
        updateStatus("Session data fetching started.");
        const refreshRate = parseInt(document.getElementById("refresh-rate").value) * 1000;
        setInterval(() => getSessionData(sessionKey), refreshRate);
    }
    else {
        updateStatus("Session data fetching stopped.");
    }
})


async function getSessionData(sessionKey) {
    const url = `https://api.openf1.org/v1/sessions?session_key=${sessionKey}`
    try {
        const response = await fetch(url);
        if (!response.ok) {
            updateStatus("Error fetching session data: " + response.status);
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        console.log(data);
        // Process the session data as needed
        const sessionDiv = document.getElementById("session");
        sessionDiv.innerHTML = `${data[0].circuit_short_name} (${data[0].country_code}) ${data[0].session_type} (${data[0].session_name}) ${getLocalTimeString(data[0].date_start)}`
        updateStatus("Fetching interval data...");
        getIntervalData(sessionKey)
    } catch (error) {
        updateStatus("Error fetching session data: " + error.message);
        console.error('Failed to fetch session data:', error);
    }
}

async function getIntervalData(sessionKey) {
    const url = `https://api.openf1.org/v1/intervals?session_key=${sessionKey}`
    try {
        const response = await fetch(url);
        if (!response.ok) {
            updateStatus("Error fetching interval data: " + response.status);
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        console.log(data);
        // Process the interval data as needed
        // Get unique driver numbers
        updateStatus("Fetching driver numbers...");
        const driverNumbers = [...new Set(data.map(item => item.driver_number))];
        console.log(driverNumbers);
        // Get the latest interval for each driver and put it all to an object array.
        updateStatus("Fetching latest intervals...");
        const latestIntervals = driverNumbers.map(driverNumber => {
            const driverData = data.filter(item => item.driver_number === driverNumber);
            const latestInterval = driverData[driverData.length - 1];
            return {
                date: latestInterval.date,
                driver_number: latestInterval.driver_number,
                gap_to_leader: latestInterval.gap_to_leader,
                interval: latestInterval.interval
            };
        });
        console.log(latestIntervals);
        // Sort the intervals by position
        updateStatus("Sorting intervals...");
        latestIntervals.sort((a, b) => a.gap_to_leader - b.gap_to_leader);
        console.log(latestIntervals);
        // If gap_to_leader is null for any driver, move to the end of the array. If gap_to_leader is showing something like '5L' '6L' '2L' that means the driver is x amount of laps (if '5L' 5 laps behind). Consider this when sorting too.
        latestIntervals.forEach(interval => {
            if (interval.gap_to_leader === null) {
            interval.gap_to_leader = 9999.0;
            } else if (String(interval.gap_to_leader).includes('L')) {
            interval.gap_to_leader = parseFloat(interval.gap_to_leader) * 1000.0;
            } else {
            interval.gap_to_leader = parseFloat(interval.gap_to_leader);
            }
        });
        latestIntervals.sort((a, b) => a.gap_to_leader - b.gap_to_leader);
        console.log(latestIntervals);
        // Create a table to display the intervals
        const table = document.createElement("table");
        const headerRow = document.createElement("tr");
        const headers = ["Driver Number", "Gap to Leader", "Interval"];
        headers.forEach(header => {
            const th = document.createElement("th");
            th.textContent = header;
            headerRow.appendChild(th);
        });
        table.appendChild(headerRow);
        latestIntervals.forEach(interval => {
            const row = document.createElement("tr");
            const driverNumberCell = document.createElement("td");
            driverNumberCell.textContent = interval.driver_number;
            const gapToLeaderCell = document.createElement("td");
            gapToLeaderCell.textContent = interval.gap_to_leader;
            const intervalCell = document.createElement("td");
            intervalCell.textContent = interval.interval;
            row.appendChild(driverNumberCell);
            row.appendChild(gapToLeaderCell);
            row.appendChild(intervalCell);
            table.appendChild(row);
        });
        const intervalDiv = document.getElementById("interval");
        intervalDiv.innerHTML = ""; // Clear previous content
        intervalDiv.appendChild(table);
        updateStatus("Interval data fetched successfully.");
    } catch (error) {
        updateStatus("Error fetching interval data: " + error.message);
        console.error('Failed to fetch interval data:', error);
    }
}

function getLocalTimeString(time) {
    const utcDate = new Date(time);

    const localTimeString = new Intl.DateTimeFormat(undefined, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZoneName: 'short',
    }).format(utcDate);

    console.log(localTimeString);
    return localTimeString;
}

function updateStatus(msg)  {
    // Get datetime stamp
    const now = new Date();
    const datetime = now.toLocaleString(undefined, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
    const statusDiv = document.getElementById("status");
    statusDiv.innerHTML = `${datetime} - ${msg}`;
    console.log(msg);
}

