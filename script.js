//     // Dark mode toggle logic
//     if (localStorage.getItem("theme") === "dark") {
//     document.body.classList.add("dark");
// }
//     const toggle = document.getElementById('darkModeToggle');
//     toggle.addEventListener('click', () => {
//       document.body.classList.toggle('dark-mode');
//     });

// Restore theme on page load
const savedTheme = localStorage.getItem("theme");
if (savedTheme === "dark") {
  document.body.classList.add("dark-mode");
}

// Toggle button
document.getElementById("darkModeToggle").addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");

  // Save the new state
  const isDark = document.body.classList.contains("dark-mode");
  localStorage.setItem("theme", isDark ? "dark" : "light");
});