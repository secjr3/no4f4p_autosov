let  themeBtm = document.querySelector(".btn-theme")
themeBtm.addEventListener("click",()=>{
  const body = document.body;
  if (body.getAttribute("data-theme") === "dark") {
    body.removeAttribute("data-theme");
    localStorage.setItem("theme", "light");
  } else {
    body.setAttribute("data-theme", "dark");
    localStorage.setItem("theme", "dark");
  }
})
 
let downloadBtn = document.getElementById("downloadBtn")
let downloadBtnDown = document.getElementById("cta-Button")


downloadBtn.addEventListener("click",handleDownload)
function handleDownload() {
  const btn = document.getElementById("downloadBtn");
  btn.style.opacity = "0.7";
  setTimeout(() => {
    btn.style.opacity = "1";
  }, 150);
  window.location.href = "AutoSov.apk";
}

const savedTheme = localStorage.getItem("theme");
if (savedTheme === "dark") {
  document.body.setAttribute("data-theme", "dark");
}

lucide.createIcons();