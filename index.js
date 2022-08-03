let https = require('https')
https.globalAgent.options.rejectUnauthorized = false;

const runCommand = require('./runCommand.js')
const {verify} = require('hcaptcha');
const axios = require('axios')
const express = require('express')
const app = express()

const http = require('http').Server(app);
const io = require('socket.io')(http);

const gotiny = require("gotiny")

const { Webhook } = require('discord-webhook-node');
const hook = new Webhook(process.env.webhook);

const Database = require("@replit/database")
const db = new Database()
//db.set("minutes", 0)

process.on('unhandledRejection', console.error);

const bannedURLs = ['https://www.dropbox.com/s/ktol5s7dsgsaqag/Sunete%20de%20ploaie%20%C3%AEn%20fereastra%20de%20somn%20%C8%99i%20relaxa%20-%20Sunete%20de%20ploaie%20%C8%99i%20furtunile%20noaptea%20-%2010%20ore.mp4?dl=1','https://onedrive.live.com/download?cid=2A080264A12AE01A&resid=2A080264A12AE01A%21117&authkey=AFHVhsnC9TJ5EcU','https://onedrive.live.com/download?cid=2A080264A12AE01A&resid=2A080264A12AE01A%21118&authkey=AL6vij5TlZkBGKk',"https://onedrive.live.com/download?cid=19473F8D5B0F2A13&resid=19473F8D5B0F2A13%21139&authkey=AN4hyXMrijK7moM","https://onedrive.live.com/download?cid=19473F8D5B0F2A13&resid=19473F8D5B0F2A13%21147&authkey=ADf4nT3L5u8sijI","https://anonfile.free-24-7-loops.repl.co/r1McX9z0y8/The_weirdest_live_stream_lol_mp4"]

function hookSend(text){
  console.log(text)
  try{
    hook.send(text)
  }catch{
    console.log('hm')
  }
}

let {
  servers,
  secretPath,
  serversToIdentifier
} = process.env

servers = servers.split(',')
serversToIdentifier = serversToIdentifier.split(',')
let temp = {}
for(let i=0;i<serversToIdentifier.length;i++){
  temp[Number(serversToIdentifier[i].split('|')[1])] = serversToIdentifier[i].split('|')[0]
}
serversToIdentifier = temp

let capacity = 0
let capacityByServer = {}
let slots = 0
let minutes = 0

app.set('view engine', 'ejs');
app.use('/static',express.static('./static'))
app.use(express.json())

function numberWithCommas(x) {
    return x.toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",");
}
app.get('/', (req, res) => {
  res.render('index',{
    slots: slots,
    running: capacity,
    minutes: numberWithCommas(minutes)
  })
})

app.get('/nocaptcha',(req,res)=>{
  res.sendFile(__dirname+'/nocaptcha.png')
})

app.get('/sitemap.xml', (req, res) => {
  res.sendfile('./sitemap.xml')
})

app.get('/robots.txt', (req, res) => {
  res.sendfile('./robots.txt')
})

app.get('/add', (req, res) => {
  res.render('add',{
    siteKey: process.env.hCaptchaSiteKey
  })
})

app.get('/manageInfo/:id', (req, res) => {
  
  if(serversToIdentifier[req.params.id.split('-')[0]]){
    axios.get(`https://${serversToIdentifier[req.params.id.split('-')[0]]}/${process.env.secretPath}/info/${req.params.id}`).then((r)=>{
      res.json(r.data)
    }).catch((r)=>{
      res.status(400).send(`Invalid Management Key`)
    })
  }else{
    console.log('oh')
    res.status(400).send(`Invalid Management Key`)
  }
  
  /*res.json({
    captcha: Date.now()-70000000,
    created: Date.now()
  })*/
})

app.get('/manage/:id', (req, res) => {
  res.render('management',{
    siteKey: process.env.hCaptchaSiteKey
  })
})

app.post('/check',(req,res)=>{
  if(req.body && req.body.url && req.body.url.length < 300){
    hookSend(`Someone is checking the URL ${req.body.url}`)
    if(bannedURLs.includes(req.body.url)){
      hookSend(`No, stop it`)
    }else{
    checkURL(req.body.url).then(()=>{
      res.json({can:true})
      hookSend(`The check succeeded`)
    }).catch(()=>{
      res.status(400).json({can:false})
      hookSend(`The check failed`)
    })
    }
  }else{
    res.status(400).json({can:false})
  }
})

app.post('/captcha',async(req,res)=>{
  if(req.body && req.body.hKey && req.body.mk){
    verify(process.env.hCaptchaSecret, req.body.hKey)
    .then(async(data) => {
      if (data.success === true) {
        if(serversToIdentifier[req.body.mk.split('-')[0]]){
          axios.post(`https://${serversToIdentifier[req.body.mk.split('-')[0]]}/${process.env.secretPath}/captcha`,{
            manageKey: req.body.mk
          }).then(()=>{
            res.send(`OK`)
            hookSend(`Someone did their captcha nice`)
          }).catch(()=>{
            res.status(400).send(`Invalid Management Key`)
          })
        }else{
          res.status(400).send(`Invalid Management Key`)
        }
      } else {
        res.status(400).send(`*le gasp* You ARE a robot!`)
      }
    })
    .catch((e)=>{
      console.error(e);
      res.status(400).send(`*le gasp* You ARE a robot!`)
    });
    
  }else{
    res.status(500).send(`Server Error`)
  }
})

app.post('/apply',async(req,res)=>{
  if(req.body && req.body.hKey && req.body.links && req.body.mk){
    verify(process.env.hCaptchaSecret, req.body.hKey)
    .then(async(data) => {
      if (data.success === true) {
        let urls = req.body.links
        let shortURLs = []
        if(urls.length < 16 && urls.length > 0){
          can = ``
          
          for(let i=0; i<urls.length; i++){
            if(urls[i].length < 300){
              try {
                await checkURL(urls[i])
              } catch (err) {
                can = `Error checking URL ${urls[i]}`
                break;
              }
            }else{
              can = `URLs must be under 300 characters in length`
              break;
            }
          }
          if(can == ``){
            for(let i=0; i<urls.length; i++){
              try {
                const res = await gotiny.set(urls[i])
                shortURLs.push(res[0].code)
              } catch (err) {
                can = `Error shortening URL ${urls[i]}`
                break;
              }
            }
            if(can == ``){
              // Yay
              if(serversToIdentifier[req.body.mk.split('-')[0]]){
                axios.put(`https://${serversToIdentifier[req.body.mk.split('-')[0]]}/${process.env.secretPath}`,{
                  manageKey: req.body.mk,
                  urls: shortURLs
                }).then(()=>{
                  hookSend(`A stream was updated with the new URLs ${urls.join(' ')}`)
                  res.send(`OK`)
                }).catch(()=>{
                  res.status(400).send(`Invalid Management Key`)
                })
              }else{
                res.status(400).send(`Invalid Management Key`)
              }
            }else{
              res.status(400).send(can)
            }
          }else{
            res.status(400).send(can)
          }
        }else{
          res.status(400).send(`You must have 1-15 URLs`)
        }
      } else {
        res.status(400).send(`*le gasp* You ARE a robot!`)
      }
    })
    .catch((e)=>{
      console.error(e);
      res.status(400).send(`*le gasp* You ARE a robot!`)
    });
    
  }else{
    res.status(500).send(`Server Error`)
  }
})

app.delete('/stop',(req,res)=>{
  if(req.body && req.body.streamKey && req.body.mk){
    if(serversToIdentifier[req.body.mk.split('-')[0]]){
      axios.post(`https://${serversToIdentifier[req.body.mk.split('-')[0]]}/${process.env.secretPath}/del`,{
        streamKey: req.body.streamKey
      }).then(()=>{
        res.send(`OK`)
        hookSend(`Someone deleted their stream ):::`)
      }).catch((e)=>{
        console.log(e)
        res.status(400).send(`Invalid Management Key`)
      })
    }else{
      res.status(400).send(`Invalid Management Key`)
    }
  }else{
    res.status(400).send(`Missing parameters`)
  }
})

io.on('connection', function(socket) {
  console.log('A user connected');
  let state = -1
  let shortURLs = []

  let ohNo = function(err){
    hookSend(err)
    socket.emit('ohNo',err);
    socket.disconnect();
  }

  let update = function(text){
    socket.emit('update',text)
  }

  if(slots == 0){
    ohNo(`We don't have any slots for new servers. Check back in a few days.`)
    return
  }else{
    state = 0
    socket.emit(`OK`,`Welcome to Wendys, may I take your order?`)
  }
  
  socket.on('hCaptcha',(key)=>{
    if(state == 0){
      update(`Making sure you aren't a robot...`)
      verify(process.env.hCaptchaSecret, key)
      .then((data) => {
        if (data.success === true) {
          socket.emit('timeForUrls',true)
          state = 1
        } else {
          ohNo('Invalid HCaptcha token')
        }
      })
      .catch((e)=>{
        console.error(e);
        ohNo('Invalid HCaptcha token')
      });
    }
  })

  socket.on('urls',async (urls)=>{
    if(state == 1){
      if(urls.length < 16 && urls.length > 0){
        state = 2

        hookSend(`Possible new stream with URLs ${urls.join(' ')}`)
        
        for(let i=0; i<urls.length; i++){
          update(`Checking video URLs (${i+1}/${urls.length})...`)
          if(urls[i].length < 300){
            try {
              await checkURL(urls[i])
            } catch (err) {
              console.log(err)
              ohNo(`Invalid video URL ${urls[i]}, please try again in a minute or two. If this keeps happening, it's most likely an internal issue we need to look into. Join our support server.`);
              break;
            }
          }else{
            ohNo('URLS must be under 300 characters in length.');
            break;
          }
        }
        if(state == 2){
          for(let i=0; i<urls.length; i++){
            update(`Shortening video URLs (${i+1}/${urls.length})...`)
            if(urls[i].length < 300){
              try {
                const res = await gotiny.set(urls[i])
                shortURLs.push(res[0].code)
              } catch (err) {
                console.log(err)
                ohNo(`Error shortening link ${urls[i]}`);
                break;
              }
            }else{
              ohNo('URLS must be under 300 characters in length.');
              break;
            }
          }
          if(state == 2){
            // Yay
            state = 3
            socket.emit('streamKeyTime',true) 
          }
        }
      }
    }
  })

  socket.on('streamKey',(key)=>{
    if(state == 3){
      state = 4

      update(`Checking stream key...`)
      if(key.length > 25 || key.length < 3){
        ohNo(`Invalid stream key length`)
      }else{
        exists(key).then(()=>{
          ohNo(`We are already streaming to that stream key! Go to the management page and end it.`)
        }).catch(()=>{
          // Yessir

          update(`Testing stream key...`)
          let hmm = true
          setTimeout(()=>{
            hmm = false
          },3000)
          runCommand(
            'ffmpeg',
            `-re -i ./Loop.mp4 -c copy -f flv rtmp://a.rtmp.youtube.com/live2/${key}`,
            (data) => {
              console.log(data)
            },
            () => {
              if(hmm){
                ohNo(`Invalid stream key!`)
              }else{
                console.log(`Holy shi there's actually a new stream`)
                update(`Starting stream...`)
                add(key,shortURLs).then((mk)=>{
                  console.log(`Holy shi it's starting holy shi`)
                  update(`Redirecting to management page...`)
                  socket.emit('management',mk)
                  hookSend(`New stream dispatched to server **${mk[0]}**, look at above messages for possible video URLs.`)
                }).catch((e)=>{
                  ohNo(e)
                })
              }
            }
          )
        })
      }
    }
  })
  
  socket.on('disconnect', () => {
    state = -2
  });
});

http.listen(3000, function() {
   console.log('listening on *:3000');
});

// Technical techies tech tech

function checkURL(url){
  console.log(url)
  return new Promise((res,rej)=>{
    if(!url.match(/[(http(s)?):\/\/(www\.)?a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/ig)){
      rej()
    }else{
      url = url.match(/[(http(s)?):\/\/(www\.)?a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/ig)[0];
      let can = false
      console.log(url)
      runCommand(
        'ffprobe',
        `-loglevel error -show_entries stream=codec_type -of default=nw=1 ${url}`,
        (data) => {
          if(data.toString().includes('codec_type=video') || data.toString().includes('codec_type=audio')){
            can = true
          }
        },
        (...a) => {
          if(a[0] == 0){
            if(can){
              res()
            }else{
              rej()
            }
          }else{
            rej()
          }
        }
      ) 
    }
  })
}

async function calculateCapacity(){
  let tempCapacity = 0
  let tempSlots = 0
  let tempCapacityByServer = {}
  for(let i=0; i<servers.length;i++){
    try{
      let r = await axios.get(`https://${servers[i]}/${secretPath}/capacity`)
      if(r.status == 200){
        tempCapacity += parseInt(r.data)
        tempCapacityByServer[servers[i]] = parseInt(r.data)
        tempSlots += 40-parseInt(r.data)
      }else{
        tempCapacity += 40
        tempCapacityByServer[servers[i]] = 40
      }
    }catch(e){
      console.error(e);
      tempCapacity += 40
      tempCapacityByServer[servers[i]] = 40
    }
  }
  capacity = tempCapacity
  capacityByServer = tempCapacityByServer
  slots = tempSlots

  db.get("minutes").then(value => {
    db.set("minutes", value+capacity).then(() => {
      console.log(`Updated minutes streamed to ${value+capacity}`)
      minutes = value + capacity
    });
  });

  setTimeout(()=>{
    calculateCapacity()
  },60000)
}
calculateCapacity()

function exists(key){
  return new Promise(async(res,rej)=>{
    let has = false
    for(let i=0; i<servers.length;i++){
      try{
        let r = await axios.get(`https://${servers[i]}/${secretPath}/has/${encodeURIComponent}`)
        if(r.status == 200){
          has = true
        }
      }catch{}
    }
    if(has){
      res()
    }else{
      rej()
    }
  })
};

function add(key, urls){
  const sortable = Object.entries(capacityByServer)
    .sort(([,a],[,b]) => a-b)
    .reduce((r, [k, v]) => ({ ...r, [k]: v }), {});
  const server = Object.keys(sortable)[0]
  
  return new Promise(async(res,rej)=>{
    try{
      let r = await axios.post(`https://${server}/${secretPath}/add`,{
        urls: urls,
        streamKey: key
      })
      console.log(r)
      if(r.status == 200){
        res(r.data.managementKey)
      }else{
        if(r.data == 'Nope! Sorry! No room here.'){
          rej(`All of our servers are out of room for new streams! Sorry!`)
        }else{
          rej(`An unexpected error has occured. Sorry!`) 
        }
      }
    }catch(r){
      console.log(r)
      if(r.data == 'Nope! Sorry! No room here.'){
        rej(`All of our servers are out of room for new streams! Sorry!`)
      }else{
        rej(`An unexpected error has occured. Sorry!`) 
      }
    }
  })
};

(async()=>{
  // Async environment for testing, not required.
})();