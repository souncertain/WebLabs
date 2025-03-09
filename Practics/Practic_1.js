function toCamelCase(str) {
    str = str.split(/[-_]/);
    str = str.map((word, index) => index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1, word.end));
    str = str.join('');
    return str;
}

console.log(toCamelCase("the-stealth-warrior"));
console.log(toCamelCase("The-Stealth_Warrior"));


  const fs = require("node:fs");
  const path = require("node:path");
  const MD5 = require("md5.js");
  const commandLineArgs = require("command-line-args");

  const optionDefinitions = [{ name: "dir", type: String, defaultOption: true }];
  const options = commandLineArgs(optionDefinitions);

  if (!options.dir) {
    console.error("Ошибка: Укажите директорию с файлами.");
    process.exit(1);
  }

  fs.readdir(options.dir, (err, files) => {
    files.forEach((file) => {
      const filePath = path.join(options.dir, file);

      fs.stat(filePath, (err, stats) => {
        if (err) {
          console.error(`Ошибка получения информации о файле ${file}:`, err.message);
          return;
        }

        if (stats.isFile()) {
          const stream = fs.createReadStream(filePath);

          let md5 = new MD5();
          stream.on("data", (chunk) => {
            md5.update(chunk);
          });
          
          stream.on("end", () => {
            console.log(`file: ${file} hash: ${md5.digest('hex')}`);
          });
        }
      });
    });
  });
