# Stream Savers main website !
The main website for Stream Savers. This does not contain the streaming server source code.

![A snippet of streamsavers.live](https://cdn.discordapp.com/attachments/966225601616810014/969124357618151444/Screenshot_from_2022-04-28_16-33-39.png)

Main deployment: [streamsavers.live](https://streamsavers.live)

Minimal loop streaming program: [Click here](https://github.com/codingMASTER398/Stream-Savers-minimal-loop-streaming)

Streaming Server: [Click here](https://github.com/codingMASTER398/Stream-Savers-Streaming-Server)

## Setup
- Node.js 16+ reccomended
- Install a process.env handler
- If not on Replit, swap out ReplDB for some other (used to store minutes streamed)
- In process.env:
  - `hCaptchaSecret` for your hCaptcha secret
  - `hCaptchaSiteKey` for your hCaptcha site key
  - `secretPath` for the random string of characters that the streaming servers also have
  - `servers` for a comma seperated list of streaming server hosts (e.g. `google.com,example.com`)
  - `serversToIdentifier` for a comma seperated list of the server and it's number identifier (e.g. `google.com|1,example.com|2`)
  - `webhook` as a Discord webhook to send updates such as video checks, new streams, stream deletes, etc.

## License
[MIT](https://choosealicense.com/licenses/mit/)
