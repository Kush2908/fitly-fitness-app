const fs = require("fs");
const vm = require("vm");
const path = require("path");

const root = __dirname;
const babelPath = path.join(root, "web", "vendor", "babel.min.js");
const sourcePath = path.join(root, "web", "app.js");
const outputPath = path.join(root, "web", "app.compiled.js");

const context = {};
vm.createContext(context);
vm.runInContext(fs.readFileSync(babelPath, "utf8"), context);

const source = fs.readFileSync(sourcePath, "utf8");
const compiled = context.Babel.transform(source, {
  presets: [[context.Babel.availablePresets.react, { runtime: "classic" }]],
  sourceType: "script"
}).code;

fs.writeFileSync(outputPath, `${compiled}\n`);
console.log(`Compiled ${path.relative(root, sourcePath)} -> ${path.relative(root, outputPath)}`);
