getSeasons()

// getSeasons
async function getSeasons() {
    const url = `https://api.openf1.org/v1/meetings`
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log(data);
    // Use the year to create a new array with unique years.
    const uniqueYears = [...new Set(data.map(meeting => meeting.year))];
    // Sort the years in descending order.
    const sortedYears = uniqueYears.sort((a, b) => b - a);
    console.log(sortedYears);
    createSeasonsElm(sortedYears);
}

// createSeasonsElm
function createSeasonsElm(items) {
    console.log(items);
    const seasonsElm = document.createElement('select');
    seasonsElm.id = "seasons";
    items.forEach(item => {
        const seasonsElmOpt = document.createElement('option');
        seasonsElmOpt.value = item; // Create a machine-readable value
        seasonsElmOpt.textContent = item;
        seasonsElm.appendChild(seasonsElmOpt);
    });
    const controlsDiv = document.getElementById("controls");
    controlsDiv.appendChild(seasonsElm);
}