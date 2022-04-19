let stream_key = ``;

(function () {
    let stream_url = ``

    $('#keyForm').submit(function (event) {
        event.preventDefault();

        const formData = new FormData(document.getElementById('keyForm'));
        if (formData.get('streamKey').length < 26 && formData.get('streamKey').length > 2) {
            //.match(/^(?:http(s)?:\/\/)?[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+$/gm)
            let keepGoing = function () {
                stream_key = formData.get('streamKey')
                document.getElementById('details').hidden = true
                document.getElementById('videos').hidden = false
            }

            if (formData.get('streamURL') !== '') {
                if (formData.get('streamURL').match(/^(?:http(s)?:\/\/)?[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+$/gm)) {
                    stream_url = formData.get('streamURL')
                    keepGoing()
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Stream URL invalid',
                        text: "Must be a valid URL. Don't want it? Make sure it's empty!"
                    })
                }
            } else {
                keepGoing()
            }
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Invalid stream key length',
                text: 'Must be between 3 and 25 characters.'
            })
        }
    });

    function newVideo(url) {
        let card = document.getElementById('templateCard').cloneNode(true);
        document.getElementById('addedLinks').hidden = false

        card.children[0].children[2].children[0].innerText = url
        card.children[0].children[2].children[0].href = url

        card.children[0].children[1].addEventListener('click', () => {
            card.parentNode.removeChild(card);
            Swal.fire({
                title: 'Success! Video removed.',
                icon: 'success'
            })
        })

        card.hidden = false

        document.getElementById('cards').appendChild(card)
    }

    $('#add').submit(function (event) {
        event.preventDefault();

        const formData = new FormData(document.getElementById('add'));

        if (formData.get('videoLink').match(/^(?:http(s)?:\/\/)?[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+$/gm)) {
            Swal.fire('Checking URL...')
            Swal.showLoading()
            fetch('./check', {
                'method': 'POST',//MAN
                'headers': {
                    'Content-Type': 'Application/JSON'
                },
                'body': JSON.stringify({
                    url: formData.get('videoLink')
                })
            }).then((r) => {
                if (r.status == 200) {
                    Swal.fire({
                        title: 'Success! Video added.',
                        icon: 'success'
                    })

                    newVideo(formData.get('videoLink'))
                } else {
                    Swal.fire({
                        title: 'Uh-oh',
                        text: "The link you gave isn't valid or doesn't have an audio and video source.",
                        icon: 'error'
                    })
                }
            }).catch((e) => {
                console.log(e)
                Swal.fire({
                    title: 'Uh-oh',
                    text: "The link you gave isn't valid or doesn't have an audio and video source.",
                    icon: 'error'
                })
            })
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Video URL invalid',
                text: "Must be a valid URL. (e.g. https://example.com/video.mp4)"
            })
        }
    })
})();

function onSubmit(hToken) {
    let links = []
    for (let i = 0; i < document.getElementById('cards').children.length; i++) {
        elem = document.getElementById('cards').children[i]
        console.log(elem)
        if (elem.hidden == false) {
            console.log('hmm')
            console.log(elem.children[0].children[2].children[0].href)
            links.push(elem.children[0].children[2].children[0].href)
        }
    }
    if (links.length > 0 && links.length < 16) {
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

        socket.on(`ohNo`, (e) => {
            Swal.fire({
                icon: 'error',
                title: 'Oops...',
                text: e
            }).then((result) => {
                window.location.reload()
            })
        })

        socket.on(`update`, (text) => {
            Swal.getHtmlContainer().textContent = text
        })

        socket.on(`OK`, () => {
            socket.emit('hCaptcha', hToken)
        })

        socket.on('timeForUrls', () => {
            socket.emit('urls', links)
        })

        socket.on(`streamKeyTime`, () => {
            socket.emit('streamKey', stream_key)
        })

        socket.on(`management`, (tkn) => {
            window.location.href = `/manage/${tkn}`
        })

    } else {
        Swal.fire({
            title: `Can't finish yet`,
            text: "You must have between 1 and 15 video links!",
            icon: 'error'
        })
    }
}

function finish() {
    let links = []
    for (let i = 0; i < document.getElementById('cards').children.length; i++) {
        elem = document.getElementById('cards').children[i]
        console.log(elem)
        if (elem.hidden == false) {
            console.log('hmm')
            console.log(elem.children[0].children[2].children[0].href)
            links.push(elem.children[0].children[2].children[0].href)
        }
    }
    if (links.length > 0 && links.length < 16) {
        hcaptcha.execute();
    } else {
        Swal.fire({
            title: `Can't finish yet`,
            text: "You must have between 1 and 15 video links!",
            icon: 'error'
        })
    }
}