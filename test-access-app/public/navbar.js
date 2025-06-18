// public/js/navbar.js

document.addEventListener("DOMContentLoaded", () => {
  const isAdmin = sessionStorage.getItem("adminToken");
  const isStudent = sessionStorage.getItem("studentName");

  const loginBtns = document.querySelectorAll(".login-btn");
  const logoutBtn = document.getElementById("logoutBtn");

  // Navbar tugmalarini sozlash
  if (isAdmin || isStudent) {
    loginBtns.forEach(btn => btn.style.display = "none");
    if (logoutBtn) logoutBtn.style.display = "inline-block";
  } else {
    loginBtns.forEach(btn => btn.style.display = "inline-block");
    if (logoutBtn) logoutBtn.style.display = "none";
  }

  // Sahifa himoyalash
  const currentPage = window.location.pathname;

  if (currentPage.includes("admin.html") && !isAdmin) {
    alert("Faqat adminlar kirishi mumkin!");
    window.location.href = "index.html";
  }

  if (currentPage.includes("test-login.html") && !isStudent) {
    alert("Faqat talabalar foydalanishi mumkin!");
    window.location.href = "index.html";
  }
});

// Chiqish funksiyasi
function logout() {
  sessionStorage.removeItem("studentName");
  sessionStorage.removeItem("adminToken");
  alert("Tizimdan chiqdingiz!");
  window.location.href = "index.html";
}
