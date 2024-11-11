// Funtion to add the navbar and footer components to the other pages
function loadHTMLcomponent(elID, component, callback) {
  fetch(component)
    .then(response => {
      if (!response.ok) {
        throw new Error("Faild to load " + component);
      }
      return response.text();
    })
    .then(data => {
      document.getElementById(elID).innerHTML = data;
      if (callback) callback();
    })
    .catch(error => console.error("Error loadin HTML component:", error));
}

// Function to highlight the active page link
function highlightActiveLink() {
  const currLink = window.location.pathname.split("/").pop();
  const navLinks = document.querySelectorAll("#nav a");
  
  navLinks.forEach(link => {
    if (link.getAttribute("href") === currLink) {
      link.classList.add("active");
    }
  });
}

document.addEventListener("DOMContentLoaded", function() {
  loadHTMLcomponent("navbar", "./nav.html", highlightActiveLink);
  loadHTMLcomponent("footer", "./footer.html");
})

// Functions to add the form submission info to the map and current reports section
const reports = [];

const reportForm = document.getElementById("report-form");
const reportsList = document.getElementById("reports-list");

reportForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const address = document.getElementById("cross-streets").value.trim();
  const animalType = document.querySelector("input[name='animal-type']:checked").value;
  const inRoad = document.querySelector("input[name='in-road']:checked").value;
  const description = document.getElementById("description").value.trim();

  const report = {
    id: reports.length + 1,
    address,
    animalType,
    inRoad: inRoad === "yes" ? "In Road" : "Curbside",
    description,
    status: "Open",
    timestamp: new Date().toLocaleString()
  }

  reports.unshift(report);

  // Keep only the last 10 reports (scrollable section)
  if (reports.length > 10) {
    reports.pop(); // Remove the oldest report
  }

  // Update the reports display
  displayReports();

  // Reset the form
  e.target.reset();
})

function displayReports() {
  reportsList.innerHTML = ''; // Clear the list

  // Slice the first 5 reports for display, keep 10 accessible via scroll
  reports.slice(0, 5).forEach(report => {
    const li = document.createElement('li');
    li.classList.add('report-item');
    li.innerHTML = `
      <strong>${report.animalType.toUpperCase()} (${report.inRoad})</strong><br />
      Location: ${report.address}<br />
      Description: ${report.description}<br />
      Status: <span class="status">${report.status}</span><br />
      Reported At: ${report.timestamp}
    `;
    reportsList.appendChild(li);
  });
}

// Optional: Scrollable styling to make it clear that more than 5 reports are available
reportsList.style.maxHeight = '200px';
reportsList.style.overflowY = 'auto';