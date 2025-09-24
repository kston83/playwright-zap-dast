import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';

const inputFolder = path.join(process.cwd(), 'Input');
const outputFolder = path.join(process.cwd(), 'Output/FormattedTitles');

if (!fs.existsSync(outputFolder)) {
    fs.mkdirSync(outputFolder, { recursive: true });
}

fs.readdirSync(inputFolder).forEach(file => {
    if (path.extname(file) === '.html') {
        let formattedName = file.replace(/\.html$/, '')
            .replace(/(_\d{4}-\d{2}-\d{2}T.*)/, '')
            .replace(/_/g, '/');

        let filePath = path.join(inputFolder, file);
        try {
            const html = fs.readFileSync(filePath, 'utf8');
            const $ = cheerio.load(html);

            $('head title').text(formattedName);

            const h1 = $('body h1').first();
            if (h1.length) {
                h1.text(formattedName);
            }

            const outputFilePath = path.join(outputFolder, file);
            fs.writeFileSync(outputFilePath, $.html(), 'utf8');
            console.log(`Processed: ${file} -> ${formattedName}`);
        } catch (err) {
            console.error(`Error processing ${file}: ${err}`);
        }
    }
});