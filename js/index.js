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
        // Keep the copyright year current without manual edits
        const yearEl = document.getElementById("copyright-year");
        if (yearEl) {
          yearEl.textContent = new Date().getFullYear();
        }
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

// Escape user input before injecting it into the page
function escapeHTML(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Clear all inline validation errors on the report form
function clearFormErrors() {
  document.querySelectorAll(".form-error").forEach((el) => {
    el.textContent = "";
  });
  document
    .querySelectorAll("#report-form .invalid")
    .forEach((el) => el.classList.remove("invalid"));
}

function setFieldError(inputEl, errorElId, message) {
  const errorEl = document.getElementById(errorElId);
  if (errorEl) errorEl.textContent = message;
  if (inputEl) inputEl.classList.add("invalid");
}

if (reportForm) {
  // Clear a field's error as soon as the user fixes it
  reportForm.addEventListener("input", (e) => {
    const field = e.target.closest("input, fieldset, textarea");
    if (field) field.classList.remove("invalid");
    const describedBy = field && field.getAttribute("aria-describedby");
    if (describedBy) {
      const errorEl = document.getElementById(describedBy);
      if (errorEl) errorEl.textContent = "";
    }
  });
  reportForm.addEventListener("change", (e) => {
    const fieldset = e.target.closest("fieldset");
    if (fieldset) {
      fieldset.classList.remove("invalid");
      const describedBy = fieldset.getAttribute("aria-describedby");
      if (describedBy) {
        const errorEl = document.getElementById(describedBy);
        if (errorEl) errorEl.textContent = "";
      }
    }
  });

  reportForm.addEventListener("submit", (e) => {
    e.preventDefault();
    clearFormErrors();

    const addressInput = document.getElementById("cross-streets");
    const address = addressInput.value.trim();
    const animalTypeInput = document.querySelector(
      "input[name='animal-type']:checked"
    );
    const inRoadInput = document.querySelector("input[name='in-road']:checked");
    const description = document.getElementById("description").value.trim();

    let firstInvalid = null;

    if (address.length < 3) {
      setFieldError(
        addressInput,
        "cross-streets-error",
        "Please enter a location — a street address or cross streets (at least 3 characters)."
      );
      firstInvalid = firstInvalid || addressInput;
    }
    if (!animalTypeInput) {
      setFieldError(
        document.getElementById("animal-type-fieldset"),
        "animal-type-error",
        "Please select the type of animal."
      );
      firstInvalid =
        firstInvalid || document.getElementById("animal-type-fieldset");
    }
    if (!inRoadInput) {
      setFieldError(
        document.getElementById("in-road-fieldset"),
        "in-road-error",
        "Please tell us whether the animal is in the road."
      );
      firstInvalid = firstInvalid || document.getElementById("in-road-fieldset");
    }

    if (firstInvalid) {
      if (firstInvalid.focus) firstInvalid.focus();
      else {
        const focusable = firstInvalid.querySelector("input");
        if (focusable) focusable.focus();
      }
      return;
    }

    const animalType = animalTypeInput.value;
    const inRoad = inRoadInput.value;

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

    // Confirm the save right away, then update once the map pin is placed
    showNotification("Report saved! Placing it on the map…");

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
          "Report saved, but we couldn't find that address on the map. Please double-check the location details.",
          true
        );
      }
    });
  });
}

// Function to show pop-up confirmation when report is submitted
function showNotification(message, isError = false) {
  notification.textContent = message;
  notification.classList.toggle("error", isError);
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

  // Friendly empty state when nothing has been reported yet
  if (storedReports.length === 0) {
    const empty = document.createElement("li");
    empty.classList.add("empty-reports");
    empty.textContent =
      "No reports yet. If you spot an animal that needs pickup, submit a report and it will show up here.";
    reportsList.appendChild(empty);
    return;
  }

  // Slice the first 5 reports for display
  storedReports.slice(0, 5).forEach((report) => {
    const li = document.createElement("li");
    li.classList.add("report-item");

    li.innerHTML = `
        <strong>${escapeHTML(report.animalType).toUpperCase()} (${escapeHTML(
      report.inRoad
    )})</strong><br />
      <div class="location">Location: ${escapeHTML(report.address)}</div>
      <div class="timestamp">Reported At: ${escapeHTML(report.timestamp)}</div>
      <div class="status">Status: <span class="status-text">${escapeHTML(
        report.status
      )}</span></div>
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
