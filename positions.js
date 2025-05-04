const controlsDiv = document.getElementById("controls");
const seasonsElm = document.createElement('select');
const meetingsElm = document.createElement('select');
const sessionsElm = document.createElement('select');
const positionsElm = document.createElement('button');
let rawData, sessionsForSelectedMeeting, selectedSessionFromMeeting, driversForSelectedSession = [];
getSeasons()

// getSeasons
async function getSeasons() {
    const url = `https://api.openf1.org/v1/meetings`
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    rawData = data
    console.log(rawData);
    // Use the year to create a new array with unique years.
    const uniqueYears = [...new Set(data.map(meeting => meeting.year))];
    // Sort the years in descending order.
    const sortedYears = uniqueYears.sort((a, b) => b - a);
    console.log(sortedYears);
    createSeasonsElm(sortedYears);
    // Sort data by descending meeting_key
    const sortedData = data.sort((a, b) => b.meeting_key - a.meeting_key);
    console.log(sortedData);
    // createMeetingsElm(sortedData);
    // Trigger the change event on the seasons element to load the meetings for the first season
    seasonsElm.dispatchEvent(new Event('change'));
}

// createSeasonsElm
function createSeasonsElm(items) {
    seasonsElm.innerHTML = ""; // Clear previous options
    console.log(items);
    // const seasonsElm = document.createElement('select');
    seasonsElm.id = "seasons";
    items.forEach(item => {
        const seasonsElmOpt = document.createElement('option');
        seasonsElmOpt.value = item; // Create a machine-readable value
        seasonsElmOpt.textContent = item;
        seasonsElm.appendChild(seasonsElmOpt);
    });
    // const controlsDiv = document.getElementById("controls");
    controlsDiv.appendChild(seasonsElm);
}

// createMeetingsElm
function createMeetingsElm(items) {
    meetingsElm.innerHTML = ""; // Clear previous options
    console.log(items);
    // const meetingsElm = document.createElement('select');
    meetingsElm.id = "meetings";
    items.forEach(item => {
        const meetingsElmOpt = document.createElement('option');
        meetingsElmOpt.value = item.meeting_key; // Create a machine-readable value
        meetingsElmOpt.textContent = item.meeting_name + " - " + item.year;
        meetingsElm.appendChild(meetingsElmOpt);
    });
    const controlsDiv = document.getElementById("controls");
    controlsDiv.appendChild(meetingsElm);
    // Trigger the change event on the meetings element to load the sessions for the first meeting
    meetingsElm.dispatchEvent(new Event('change'));
}

seasonsElm.addEventListener('change', async (event) => {
    const selectedSeason = event.target.value;
    console.log(selectedSeason);
    // Filter the rawData array to get the meetings for the selected season
    const filteredMeetings = rawData.filter(meeting => meeting.year == selectedSeason);
    console.log(filteredMeetings);
    createMeetingsElm(filteredMeetings);
}
);

meetingsElm.addEventListener('change', async (event) => {
    const selectedMeeting = event.target.value;
    console.log(selectedMeeting);
    // Filter the rawData array to get the meetings for the selected season
    const filteredMeetings = rawData.filter(meeting => meeting.meeting_key == selectedMeeting);
    console.log(filteredMeetings);
    // Get the meeting_key from the selected meeting
    const meetingKey = filteredMeetings[0].meeting_key;
    console.log(meetingKey);
    createSessionsElm(meetingKey);
}
);

async function createSessionsElm(meetingKey) {
    const url = `https://api.openf1.org/v1/sessions?meeting_key=${meetingKey}`;
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    sessionsForSelectedMeeting = data;
    console.log(sessionsForSelectedMeeting);
    // Create a new select element for sessions
    sessionsElm.innerHTML = ""; // Clear previous options
    // const sessionsElm = document.createElement('select');
    sessionsElm.id = "sessions";
    data.forEach(item => {
        const sessionsElmOpt = document.createElement('option');
        sessionsElmOpt.value = item.session_key; // Create a machine-readable value
        sessionsElmOpt.textContent = item.session_name;
        sessionsElm.appendChild(sessionsElmOpt);
    });
    const controlsDiv = document.getElementById("controls");
    controlsDiv.appendChild(sessionsElm);
    // Trigger the change event on the sessions element to load the data for the first session
    sessionsElm.dispatchEvent(new Event('change'));
    
}

// Add an event listener to the sessions element
sessionsElm.addEventListener('change', async (event) => {
    const selectedSession = event.target.value;
    console.log(selectedSession);
    // Filter the sessionsForSelectedMeeting array to get the session for the selected session_key
    const filteredSession = sessionsForSelectedMeeting.filter(session => session.session_key == selectedSession);
    console.log(filteredSession);
    selectedSessionFromMeeting = filteredSession;
    console.log('selectedSessionFromMeeting:', selectedSessionFromMeeting);
    // Get the session_key from the selected session
    const sessionKey = filteredSession[0].session_key;
    console.log(sessionKey);
    // Append the button to the controls div
    positionsElm.innerHTML = "Get Positions";
    positionsElm.id = "positions";
    controlsDiv.appendChild(positionsElm);
}
);

positionsElm.addEventListener('click', async (event) => {
    const fetchAndRenderPositions = async () => {
        console.log("selectedSessionFromMeeting[0].session_key: " + selectedSessionFromMeeting[0].session_key);
        const url = `https://api.openf1.org/v1/position?session_key=${selectedSessionFromMeeting[0].session_key}`;
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log(data);
        // Find all unique driver_numbers
        const uniqueDriverNumbers = [...new Set(data.map(item => item.driver_number))];
        console.log(uniqueDriverNumbers);
        // Find the latest position for each driver_number
        const latestPositions = uniqueDriverNumbers.map(driverNumber => {
            return data.filter(item => item.driver_number === driverNumber).slice(-1)[0];
        });
        console.log(latestPositions);
        // Sort the latest positions by position
        const sortedPositions = latestPositions.sort((a, b) => a.position - b.position);
        console.log(sortedPositions);
        // Load drivers for session
        loadDriversForSession(selectedSessionFromMeeting[0].session_key);
        // Render the positions table
        renderPositionsTable(sortedPositions);
        // Update statusElm with timestamp
        const statusElm = document.getElementById("status");
        const currentTime = new Date();
        const formattedTime = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        statusElm.innerHTML = `Last updated: ${formattedTime}`;
        console.log("Last updated: " + formattedTime);
    };

    // Run the function immediately and then every 8 seconds
    fetchAndRenderPositions();
    setInterval(fetchAndRenderPositions, 8000);
});

// Load drivers for session
async function loadDriversForSession(sessionKey) {
    const url = `https://api.openf1.org/v1/drivers?session_key=${sessionKey}`;
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log(data);
    driversForSelectedSession = data;
    console.log('driversForSelectedSession:', driversForSelectedSession);
}

// Render positions table
function renderPositionsTable(positions) {
    const table = document.createElement('table');
    const headerRow = document.createElement('tr');
    const headers = ['POS', 'DRIVER'];
    headers.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header;
        headerRow.appendChild(th);
    });
    table.appendChild(headerRow);

    positions.forEach(position => {
        const row = document.createElement('tr');

        const positionCell = document.createElement('td');
        positionCell.textContent = position.position;
        row.appendChild(positionCell);

        const driverNumberCell = document.createElement('td');
        driverNumberCell.textContent = `${getDriverFromDriverNumber(position.driver_number, driversForSelectedSession).name_acronym} (${position.driver_number})`;
        row.appendChild(driverNumberCell);

        table.appendChild(row);
    });

    // Clear previous table if any
    const existingTable = document.querySelector('table');
    if (existingTable) {
        existingTable.remove();
    }

    // Append the table to the body or a specific container
    document.body.appendChild(table);
}

// Return driver from driver_number
function getDriverFromDriverNumber(driverNumber, drivers) {
    // Find the driver with the matching driver_number
    const driver = drivers.find(driver => driver.driver_number == driverNumber);
    if (driver) {
        return driver;
    } else {
        console.error(`Driver with driver_number ${driverNumber} not found.`);
        return null;
    }   
}
