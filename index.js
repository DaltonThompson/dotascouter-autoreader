// Opening message
console.log(
  "The Node.js assistant for Dota Scouter is now running. You can quit at any time using Ctrl-C on Mac."
);

// Require dependencies
const chokidar = require("chokidar"),
  fs = require("fs"),
  os = require("os"),
  open = require("open");

// Check configuration
let config = {};
try {
  config = require("./config.json");
} catch {
  return console.log("Please check that ./config.json is present.");
}

// Set event listener on local file
let server_log;
config.devMode
  ? (server_log = config.testLog)
  : (server_log = os.homedir + config.logPath);
console.log(server_log);
// Observes log for all events
chokidar.watch(server_log).on("all", (event, path) => {
  console.log(event, path, readLog());
});

function readLog() {
  let lines = [];
  fs.readFileSync(server_log)
    .toString()
    .split("\n")
    .forEach((line) => lines.push(line));
  return parseLog(
    lines[lines.length - 1],
    lines[lines.length - 2],
    lines[lines.length - 3]
  );
}

function parseLog(lastLine, penultLine, secondLastLine) {
  let regex = /(.*?) - (.*?): (.*?) \(Lobby (\d+) (\w+) (.*?)\)/,
    match,
    lastLineMatch = lastLine.match(regex),
    penultLineMatch,
    secondLastLineMatch;

  if (config.fallback) {
    if (penultLine) penultLineMatch = penultLine.match(regex);
    if (secondLastLine) secondLastLineMatch = secondLastLine.match(regex);
  }

  if (lastLineMatch) {
    match = lastLineMatch;
  } else if (penultLineMatch) {
    match = penultLineMatch;
  } else if (secondLastLineMatch) {
    match = secondLastLineMatch;
  } else {
    return console.log("No match found in last three lines of file.");
  }

  let playersString = match[6],
    playersRegex = /\d:(\[U:\d:\d+])/g,
    playersMatch;
  let steamIds = [];
  while ((playersMatch = playersRegex.exec(playersString))) {
    let sid = playersMatch[1].substring(5, playersMatch[1].length - 1);
    steamIds.push(sid);
  }

  return openScouterInBrowser(steamIds);
}

function openScouterInBrowser(steamIds) {
  let array = [];
  steamIds.forEach((id) => array.push(`id=${id}`));
  let string = array.join("&");
  open(config.targetUrl + `?${string}&patches=${config.patches}`);
}
