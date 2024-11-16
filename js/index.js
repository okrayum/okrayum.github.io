// Funtion to add the navbar and footer components to the other pages
function loadHTMLcomponent(elID, component, callback) {
  fetch(component)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Faild to load " + component);
      }
      return response.text();
    })
    .then((data) => {
      document.getElementById(elID).innerHTML = data;
      if (callback) callback();
    })
    .catch((error) => console.error("Error loadin HTML component:", error));
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
});

// Functions to add the form submission info to the map and current reports section
const reports = [];
const markers = [];

const reportForm = document.getElementById("report-form");
const reportsList = document.getElementById("reports-list");

// Create the notification element
const notification = document.createElement("div");
notification.classList.add("notification");
document.body.appendChild(notification);

reportForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const address = document.getElementById("cross-streets").value.trim();
  const animalType = document.querySelector(
    "input[name='animal-type']:checked"
  ).value;
  const inRoad = document.querySelector("input[name='in-road']:checked").value;
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

  // Keep only the last 10 reports
  if (reports.length > 10) {
    reports.pop();
  }

  // Update the reports display
  displayReports();

  // Reset the form
  e.target.reset();
  
  // Geocode the address to get lattitude and longitude
  const geocoder = new google.maps.Geocoder();

  geocoder.geocode({ address: address }, (results, status) => {
    if (status === "OK") {
      const location = results[0].geometry.location;

      // Add a new marker to the map
      const newMarker = new google.maps.Marker({
        position: location,
        map: map,
        title: `Report: ${address}`,
      });

      // Store the new marker in the markers array
      markers.push(newMarker);

      // Re-center map to the new marker location
      map.setCenter(location);

      showNotification(`Report submitted! Marker added at: ${results[0].formatted_address}`);
    } else {
      showNotification("Geocode was not successful for the following reason: " + status);
    }
  });
});

function showNotification(message) {
  notification.textContent = message;
  notification.classList.add("show");

  // Hide the notification after 5 seconds
  setTimeout(() => {
    notification.classList.remove("show");
  }, 5000);
}

function displayReports() {
  reportsList.innerHTML = ""; // Clear the list

  // Slice the first 5 reports for display
  reports.slice(0, 5).forEach((report) => {
    const li = document.createElement("li");
    li.classList.add("report-item");
    li.innerHTML = `
      <strong>${report.animalType.toUpperCase()} (${
      report.inRoad
    })</strong><br />
      Location: ${report.address}<br />
      Description: ${report.description}<br />
      Status: <span class="status">${report.status}</span><br />
      Reported At: ${report.timestamp}
    `;
    reportsList.appendChild(li);
  });
}

// Scrollable styling to make it clear that more than 5 reports are available
reportsList.style.maxHeight = "475px";
reportsList.style.overflowY = "auto";

// Initialize the Google Map
let map;

function initMap() {
  const defaultLocation = { lat: 33.4484, lng: -112.074 }; // Phoenix, Arizona

  map = new google.maps.Map(document.getElementById("map"), {
    center: defaultLocation,
    zoom: 12,
  });
}