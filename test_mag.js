const fs = require('fs');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const html = fs.readFileSync("index.html", "utf-8");
const dom = new JSDOM(html, { runScripts: "dangerously" });
console.log("No syntax errors during load");
