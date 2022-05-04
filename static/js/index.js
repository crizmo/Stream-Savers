const showcase = ["https://www.youtube.com/embed/HA2uIk1USys","https://www.youtube.com/embed/z5bo3Mjb1B4","https://www.youtube.com/embed/bift2EMRxPA","https://www.youtube.com/embed/QE8ars4huFM"]
let now = 0

function set(src){
  document.getElementById('videoFrame').src = src
}

set(showcase[0])

function left(){
  now--
  if(now < 0) now = showcase.length-1;

  set(showcase[now])
}

function right(){
  now++
  if(now > showcase.length-1) now = 0;

  set(showcase[now])
}
