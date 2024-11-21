// Function to add the navbar and footer components to the other pages dynamically
function loadHTMLcomponent(elID, component, callback) {
  fetch(component)
    .then((response) => {
      if (!response.ok) {
        throw new Error(
          `Failed to load ${component} for ${elID}: ${response.status}`
        );
      }
      return response.text();
    })
    .then((data) => {
      document.getElementById(elID).innerHTML = data;

      // Add aria-labels after HTML components are loaded
      if (elID === "navbar") {
        const nav = document.getElementById("nav");
        if (nav) {
          nav.setAttribute("aria-label", "Main navigation");
          nav.setAttribute("role", "banner");
        }
      } else if (elID === "footer") {
        const footer = document.getElementById("footer");
        footer.setAttribute("aria-label", "Footer information");
        footer.setAttribute("role", "contentinfo");
      }

      if (typeof callback === "function") callback();
    })
    .catch((error) => console.error("Error loading HTML component:", error));
}

// Function to highlight the active page link
function highlightActiveLink() {
  const currLink = window.location.pathname.split("/").pop();
  const navLinks = document.querySelectorAll("#nav a");

  navLinks.forEach((link) => {
    if (link.getAttribute("href") === currLink) {
      link.classList.add("active");
    }
  });
}

document.addEventListener("DOMContentLoaded", function () {
  loadHTMLcomponent("navbar", "./nav.html", highlightActiveLink);
  loadHTMLcomponent("footer", "./footer.html");

  // Only call displayReports if the element exists on the page
  if (document.getElementById("reports-list")) {
    displayReports();
  }
});

// Functions to add the form submission info to the map and current reports section
const reports = [];
const markers = [];

const reportForm = document.getElementById("report-form");

// Create the notification element
const notification = document.createElement("div");
notification.classList.add("notification");
document.body.appendChild(notification);

if (reportForm) {
  reportForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const address = document.getElementById("cross-streets").value.trim();
    const animalType = document.querySelector(
      "input[name='animal-type']:checked"
    ).value;
    const inRoad = document.querySelector(
      "input[name='in-road']:checked"
    ).value;
    const description = document.getElementById("description").value.trim();

    const report = {
      id: reports.length + 1,
      address,
      animalType,
      inRoad: inRoad === "yes" ? "In Road" : "Curbside",
      description,
      status: "Open",
      timestamp: new Date().toLocaleString(),
    };

    reports.unshift(report);

    // Retain a maximum of 20 reports in localStorage for performance reasons.
    if (reports.length > 20) {
      reports.pop();
    }

    //  Store reports in localStorage
    localStorage.setItem("reports", JSON.stringify(reports));

    // Update the reports display
    displayReports();

    // Reset the form
    e.target.reset();

    // Geocode the address to get latitude and longitude
    const geocoder = new google.maps.Geocoder();

    geocoder.geocode({ address: address }, (results, status) => {
      if (status === "OK") {
        const location = results[0].geometry.location;

        // Add a new marker to the map
        const newMarker = new google.maps.marker.AdvancedMarkerElement({
          position: location,
          map: map,
          title: `Report: ${address}`,
        });

        // Store the new markers position in localStorage
        markers.push({ lat: location.lat(), lng: location.lng() });
        localStorage.setItem("markers", JSON.stringify(markers));

        // Re-center map to the new marker location
        map.setCenter(location);

        showNotification(
          `Report submitted! Marker added at: ${results[0].formatted_address}`
        );
      } else {
        showNotification(
          "Geocode was not successful for the following reason: " + status
        );
      }
    });
  });
}

// Function to show pop-up confirmation when report is submitted
function showNotification(message) {
  notification.textContent = message;
  notification.classList.add("show");

  // Hide the notification after 5 seconds
  setTimeout(() => {
    notification.classList.remove("show");
  }, 5000);
}

//  Displays reports after the "report-list" element is loaded.
function displayReports() {
  const reportsList = document.getElementById("reports-list");

  //  Retrieve reports from localStorage
  const storedReports = JSON.parse(localStorage.getItem("reports")) || [];
  reportsList.innerHTML = ""; // Clear the list to avoid adding duplicates

  // Slice the first 5 reports for display
  storedReports.slice(0, 5).forEach((report) => {
    const li = document.createElement("li");
    li.classList.add("report-item");

    li.innerHTML = `
        <strong>${report.animalType.toUpperCase()} (${
      report.inRoad
    })</strong><br />
      <div class="location">Location: ${report.address}</div>
      <div class="timestamp">Reported At: ${report.timestamp}</div>
      <div class="status">Status: <span class="status-text">${
        report.status
      }</span></div>
      `;
    reportsList.appendChild(li);
  });

  if (reportsList) {
    reportsList.style.maxHeight = "540px";
    reportsList.style.overflowY = "auto";
  }
}

// Initialize the Google Map
let map;

function initMap() {
  // Phoenix, Arizona as default loaction only because that's where I live.
  const defaultLocation = { lat: 33.4484, lng: -112.074 };

  map = new google.maps.Map(document.getElementById("map"), {
    center: defaultLocation,
    zoom: 10,
    // Unique identifier specifically to this Google map
    mapId: "47c471a16ed7969e",
  });

  // Retrieve markers from localStorage and add them to the map
  const storedMarkers = JSON.parse(localStorage.getItem("markers")) || [];
  storedMarkers.forEach((markerData) => {
    new google.maps.marker.AdvancedMarkerElement({
      position: { lat: markerData.lat, lng: markerData.lng },
      map: map,
      title: "Stored Marker",
    });
  });
}
