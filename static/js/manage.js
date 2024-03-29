const key = window.location.pathname.split('/')[2]
let hCaptchaAction = 0;

function msToTime(ms) {
  let seconds = (ms / 1000).toFixed(1);
  let minutes = (ms / (1000 * 60)).toFixed(1);
  let hours = (ms / (1000 * 60 * 60)).toFixed(1);
  let days = (ms / (1000 * 60 * 60 * 24)).toFixed(1);
  if (seconds < 60) return seconds + " seconds";
  else if (minutes < 60) return minutes + " minutes";
  else if (hours < 24) return hours + " hours";
  else return days + " days"
}

(function(){

  Swal.showLoading()
  fetch(`../manageInfo/${key}`).then(async(r)=>{
    const json = await r.json()
    
    function newVideo(url){
      let card = document.getElementById('templateCard').cloneNode( true );
      
      card.children[0].children[2].children[0].innerText = url
      card.children[0].children[2].children[0].href = url
      
      card.children[0].children[1].addEventListener('click',()=>{
        card.parentNode.removeChild(card);
        Swal.fire({
          title: 'Success! Video removed.',
          icon: 'success'
        })
      })

      card.hidden = false

      document.getElementById('cards').appendChild(card)
    }

    $('#add').submit(function(event){
      event.preventDefault();
  
      const formData = new FormData(document.getElementById('add'));
  
      if(formData.get('videoLink').match(/[(http(s)?):\/\/(www\.)?a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/ig)){
        //.replace("anonfiles.com","anonfile.free-24-7-loops.repl.co"
      let lnk = formData.get('videoLink').replace("anonfiles.com","anonfile.free-24-7-loops.repl.co");
        Swal.fire('Checking URL...')
        Swal.showLoading()
        fetch('../check',{
          'method':'POST',//MAN
          'headers':{
            'Content-Type':'Application/JSON'
          },
          'body':JSON.stringify({
            url: lnk
          })
        }).then((r)=>{
          if(r.status == 200){
            Swal.fire({
              title: 'Success! Video added.',
              icon:'success'
            })
  
            newVideo(lnk)
          }else{
            Swal.fire({
              title: 'Uh-oh',
              text: "The link you gave isn't valid or doesn't have an audio and video source.",
              icon: 'error'
            })
          }
        }).catch((e)=>{
          console.log(e)
          Swal.fire({
            title: 'Uh-oh',
            text: "The link you gave isn't valid or doesn't have an audio and video source.",
            icon: 'error'
          })
        })
      }else{
        Swal.fire({
          icon: 'error',
          title: 'Video URL invalid',
          text: "Must be a valid URL. (e.g. https://example.com/video.mp4)"
        })
      }
    })

    let resetTo = `1 day`
    let captchaTime = 86400000
    console.log(json.created)
    if(Date.now() - json.created > 1209600000){
      captchaTime = 259200000
      resetTo = `3 days`
    } else if(Date.now() - json.created > 604800000){
      captchaTime = 172800000
      resetTo = `2 days`
    }
    let timeLeft = captchaTime-(Date.now() - json.captcha)
    console.log(captchaTime, timeLeft)
    if(timeLeft < 0){
      console.log('h')
      document.getElementById('captcha').innerHTML = `Your stream will end shortly if the captcha is not completed! Do it now.<br><button type="submit" class="btn btn-primary" onclick="capt()">Do captcha</button>`
    }else if(timeLeft > 0) {
      document.getElementById('captcha').innerHTML = `Your stream will run for <b>${msToTime(timeLeft)}</b>. To reset this to ${resetTo}, complete the captcha.<br><button type="submit" class="btn btn-primary" onclick="capt()">Do captcha</button>`
    }

    $('#stopForm').submit(function(event){
      event.preventDefault();

      const formData = new FormData(document.getElementById('stopForm'));
      Swal.fire({
        title: 'Are you sure you want to stop the stream?',
        text: "If you do, Stream Savers will play a short video on the next loop, then stop sending data.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#000000',
        cancelButtonColor: '#0000FF',
        confirmButtonText: 'Stop stream'
      }).then((result) => {
        if (result.isConfirmed) {
          Swal.showLoading()
          fetch('../stop',{
            'method':'DELETE',
            'headers':{
              'Content-Type':'Application/JSON'
            },
            'body':JSON.stringify({
              streamKey: formData.get('streamKey'),
              mk: key
            })
          }).then((r)=>{
            if(r.status == 200){
              window.location.href = '/'
            }else{
              Swal.fire({
                title: 'Hmm',
                text: "We couldn't delete the stream. Try again or join our support Discord.",
                icon: 'error'
              })
            }
          }).catch(()=>{
            Swal.fire({
              title: 'Hmm',
              text: "We couldn't delete the stream. Try again or join our support Discord.",
              icon: 'error'
            })
          })
        }
      })
    });
    
    Swal.close()
    Swal.hideLoading()

    document.getElementsByClassName('col-md-12')[0].hidden = false
  }).catch((e)=>{
    console.error(e)
    Swal.fire({
      icon: 'error',
      title: 'Wait what',
      text: 'Something went wrong. Please refresh. If this keeps happening, visit the support server.'
    }).then(()=>{
      window.location.href = '/'
    })
  })
})();

function onSubmit(hKey){
  switch(hCaptchaAction){
    case 1:
      let links = []
      for(let i=0; i<document.getElementById('cards').children.length;i++){
        elem = document.getElementById('cards').children[i]
        console.log(elem)
        if(elem.hidden == false){
          console.log('hmm')
          console.log(elem.children[0].children[2].children[0].href)
          links.push(elem.children[0].children[2].children[0].href)
        }
      }
      if(links.length > 0 && links.length < 16){
        Swal.fire(`Applying...`)
        Swal.showLoading()
        fetch(`../apply`,{
          'method':'POST',
          'headers':{
            'Content-Type':'Application/JSON'
          },
          'body':JSON.stringify({
            'hKey':hKey,
            'links':links,
            'mk': key
          })
        }).then(async(r)=>{
          if(r.status == 400 || r.status == 500){
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: await r.text()
            }).then(()=>{
              window.location.reload()
            })
          }else{
            Swal.fire({
              title: `Applied`,
              text: "On the next loop, your edited video list will play.",
              icon: 'success'
            }).then(()=>{
              window.location.reload()
            }) 
          }
        }).catch(async(e)=>{
          console.log(e)
          if(e.status == 400 || e.status == 500){
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: await e.text()
            }).then(()=>{
              window.location.reload()
            })
          }else{
            Swal.fire({
              icon: 'error',
              title: 'Wait what',
              text: 'Something went wrong. Please refresh. If this keeps happening, visit the support server.'
            }).then(()=>{
              window.location.reload()
            })
          }
        })
      }else{
        Swal.fire({
          title: `Can't finish yet`,
          text: "You must have between 1 and 15 video links!",
          icon: 'error'
        })
      }
      break
    case 0:
      Swal.fire(`Hold on...`)
      Swal.showLoading()
      fetch(`../captcha`,{
        'method':'POST',
        'headers':{
          'Content-Type':'Application/JSON'
        },
        'body':JSON.stringify({
          'hKey':hKey,
          'mk': key
        })
      }).then(async(r)=>{
        if(r.status == 400 || r.status == 500){
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: await r.text()
          }).then(()=>{
            window.location.reload()
          })
        }else{
          Swal.fire({
            title: `Success!`,
            icon: 'success'
          }).then(()=>{
            window.location.reload()
          }) 
        }
      }).catch(async(e)=>{
        console.log(e)
        if(e.status == 400 || e.status == 500){
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: await e.text()
          }).then(()=>{
            window.location.reload()
          })
        }else{
          Swal.fire({
            icon: 'error',
            title: 'Wait what',
            text: 'Something went wrong. Please refresh. If this keeps happening, visit the support server.'
          }).then(()=>{
            window.location.reload()
          })
        }
      })
      break
    default:
      console.log('what')
      break
  }
}

function finish(){
  let links = []
  for(let i=0; i<document.getElementById('cards').children.length;i++){
    elem = document.getElementById('cards').children[i]
    console.log(elem)
    if(elem.hidden == false){
      console.log('hmm')
      console.log(elem.children[0].children[2].children[0].href)
      links.push(elem.children[0].children[2].children[0].href)
    }
  }
  if(links.length > 0 && links.length < 16){
    hCaptchaAction = 1
    hcaptcha.execute();
  }else{
    Swal.fire({
      title: `Can't finish yet`,
      text: "You must have between 1 and 15 video links!",
      icon: 'error'
    })
  }
}

function capt(){
  hCaptchaAction = 0
  hcaptcha.execute();
}