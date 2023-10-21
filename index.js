
const chalk = require("chalk");
const httpServer = require("http-server");
const os = require("os");

/*
  Starting up http-server, serving ./
  
  http-server settings:
  CORS: disabled
  Cache: 3600 seconds
  Connection Timeout: 120 seconds
  Directory Listings: visible
  AutoIndex: visible
  Serve GZIP Files: false
  Serve Brotli Files: false
  Default File Extension: none
  
  Available on:
    http://192.168.56.1:8080
    http://192.168.1.109:8080
    http://127.0.0.1:8080
  Hit CTRL-C to stop the server
  
  */

const portInt = parseInt(process.argv[2]);

const port = isNaN(portInt) ? 99 : portInt;
const gzip = true;
const https = false;
const root = "./";

function logErrorAndHold(error) {
  console.log(error);
  require('readline')
    .createInterface(process.stdin, process.stdout)
    .question("Press [Enter] to exit...", function () {
      process.exit();
    });
}

// https://stackoverflow.com/a/29362887/8075004
process.on('uncaughtException', logErrorAndHold);

mainApp().catch(logErrorAndHold);

function requestLogger(req, res, error) {
  const date = new Date().toJSON();
  // var ip = argv['log-ip'] ? req.headers['x-forwarded-for'] || '' + req.connection.remoteAddress : '';
  const ip = req.headers['x-forwarded-for'] || '' + req.connection.remoteAddress;
  if (error) {
    console.log(
      '[%s] %s "%s %s" Error (%s): "%s"',
      date, ip, chalk.red(req.method), chalk.red(req.url),
      chalk.red(error.status.toString()), chalk.red(error.message)
    );
  }
  else {
    console.log(
      '[%s] %s "%s %s" "%s"',
      date, ip, chalk.cyan(req.method), chalk.cyan(req.url),
      req.headers['user-agent']
    );
  }
}

async function mainApp() {

  const server = httpServer.createServer({
    root: root,
    logFn: requestLogger,
    https: https,
    cors: true,
    gzip: gzip,
    cache: 2,
    before: ""
  });

  console.log("%s %s",
    chalk.yellow(`Starting up http-server, serving `), chalk.cyan(`${root}\n`));

  try {
    server.listen(port, () => {
      const obj = os.networkInterfaces();
      const networks = [];
      const protocolStr = https ? "https://" : "http://";
      for (const key of Object.keys(obj)) {
        const valuesArray = obj[key];
        valuesArray.forEach(v => {
          if (v.family === "IPv4") {
            const line = `${protocolStr}${v.address}:${port}`;
            networks.push({ url: line, key: key });
          }
        });
      }

      console.log(chalk.yellow(`Available on:`));

      const lengthOfLongestURL = Math.max(...networks.map(x => x.url.length));
      networks.forEach(x => {
        console.log("  " + x.url.padEnd(lengthOfLongestURL, " ") + `  ${x.key}`);
      });

      console.log(`Hit CTRL - C to stop the server\n`);
    });
  }
  catch (eerr) {
    console.log(eerr);
  }
}

