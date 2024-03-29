let stream_key = ``;

(function(){
  let stream_url = ``
  
  $('#keyForm').submit(function(event){
    event.preventDefault();
  
    const formData = new FormData(document.getElementById('keyForm'));
    if(formData.get('streamKey').length < 26 && formData.get('streamKey').length > 2){
      //.match(/^(?:http(s)?:\/\/)?[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+$/gm)
      stream_key = formData.get('streamKey')
      document.getElementById('details').hidden = true
      document.getElementById('videos').hidden = false
    }else{
      Swal.fire({
        icon: 'error',
        title: 'Invalid stream key length',
        text: 'Must be between 3 and 25 characters.'
      })
    }
  });

  function newVideo(url){
    let card = document.getElementById('templateCard').cloneNode( true );
    document.getElementById('addedLinks').hidden = false
    
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

      if(formData.get('videoLink').startsWith('https://www.youtube.com') || formData.get('videoLink').startsWith('https://youtu.be')){
        Swal.fire({
          title: 'Uh-oh',
          text: "You can't add YouTube links, as it is against their ToS. Watch the tutorial video.",
          icon: 'error'
        })
      }else{
        if(formData.get('videoLink').startsWith('https://www.reddit.com')){
          Swal.fire({
            title: 'Uh-oh',
            text: "You can't add Reddit links directly. Please go to redditsave.com, enter the video, and copy the link on the 'Download HD Video' button.",
            icon: 'error'
          })
        }else{
          let lnk = formData.get('videoLink').replace("anonfiles.com","anonfile.free-24-7-loops.repl.co")
          if(lnk.startsWith(`https://drive.google.com/uc?export=download&id=`)){
            lnk = lnk + `&confirm=t`
          }
          if(lnk.startsWith('https://drive.google.com/uc?export=download&id=')){
            Swal.fire("Google drive isn't recommend anymore")
          }else{
            Swal.fire('Checking URL...')
          }
          Swal.showLoading()
          fetch('./check',{
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
                text: "The link you gave isn't valid. Try a different video provider (e.g. OneDrive instead of Dropbox), or join our support Discord.",
                icon: 'error'
              })
            }
          }).catch((e)=>{
            console.log(e)
            Swal.fire({
              title: 'Uh-oh',
              text: "The link you gave isn't valid. Try a different video provider (e.g. OneDrive instead of Dropbox), or join our support Discord.",
              icon: 'error'
            })
          })
        }
      }
    }else{
      Swal.fire({
        icon: 'error',
        title: 'Video URL invalid',
        text: "Must be a valid URL. (e.g. https://example.com/video.mp4)"
      })
    }
  })
})();

function onSubmit(hToken){
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
    Swal.fire({
      title: `Let's see here...`,
      text: `Connecting to server`
    })
    Swal.showLoading()

    const socket = io();
    socket.io.on("error", (error) => {
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'Something went wrong! Sorry.'
      }).then((result) => {
        window.location.reload()
      })
      socket.close()
    });

    socket.on(`ohNo`,(e)=>{
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: e
      }).then((result) => {
        window.location.reload()
      })
    })

    socket.on(`update`,(text)=>{
      Swal.getHtmlContainer().textContent = text
    })
    
    socket.on(`OK`,()=>{
      socket.emit('hCaptcha',hToken)
    })

    socket.on('timeForUrls',()=>{
      socket.emit('urls',links)
    })

    socket.on(`streamKeyTime`,()=>{
      socket.emit('streamKey',stream_key)
    })

    socket.on(`management`,(tkn)=>{
      window.location.href = `/manage/${tkn}`
    })
    
  }else{
    Swal.fire({
      title: `Can't finish yet`,
      text: "You must have between 1 and 15 video links!",
      icon: 'error'
    })
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
    hcaptcha.execute();
  }else{
    Swal.fire({
      title: `Can't finish yet`,
      text: "You must have between 1 and 15 video links!",
      icon: 'error'
    })
  }
}