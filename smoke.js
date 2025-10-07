// very small script to verify JS loads and events work
console.log("smoke.js loaded");
document.addEventListener("DOMContentLoaded", function(){
  const btn = document.getElementById("btn");
  const out = document.getElementById("out");
  if(!btn || !out){
    console.error("Missing button or output element");
    return;
  }
  btn.addEventListener("click", function(){
    out.textContent = "Random: " + Math.floor(Math.random()*1000);
  });
});