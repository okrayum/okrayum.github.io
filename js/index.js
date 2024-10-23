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
  loadHTMLcomponent("navbar", "nav.html", highlightActiveLink);
  loadHTMLcomponent("footer", "footer.html");
})
