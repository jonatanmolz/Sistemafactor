document.addEventListener("DOMContentLoaded", () => {
    const menuToggleButton = document.getElementById("menuToggleButton");
    const mainNav = document.getElementById("mainNav");

    if (!menuToggleButton || !mainNav) return;

    menuToggleButton.addEventListener("click", () => {
        mainNav.classList.toggle("nav-collapsed");
    });
});