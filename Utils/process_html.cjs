const fs = require('fs');
const path = require('path');
const jsdom = require('jsdom'); // You'll need to install this: npm install jsdom

async function processHTMLFiles(inputFolderPath) {
    try {
        const files = fs.readdirSync(inputFolderPath);

        for (const file of files) {
            if (path.extname(file).toLowerCase() === '.html') {
                const filePath = path.join(inputFolderPath, file);
                const formattedName = formatFileName(file);

                // Read the HTML file
                const htmlContent = fs.readFileSync(filePath, 'utf-8');

                // Use JSDOM to parse and modify the HTML
                const { JSDOM } = jsdom;
                const dom = new JSDOM(htmlContent);
                const document = dom.window.document;

                // Update the title
                document.title = formattedName;

                // Update the first h1
                const h1Element = document.querySelector('body h1');
                if (h1Element) {
                    h1Element.textContent = formattedName;
                } else {
                    console.warn(`No <h1> found in ${file}.`);
                }


                // Serialize the modified HTML
                const modifiedHtml = dom.serialize();


                // Write the modified HTML back to the file (overwrite the original)
                fs.writeFileSync(filePath, modifiedHtml, 'utf-8');

                console.log(`Processed: ${file} -> ${formattedName}`);
            }
        }

    } catch (err) {
        console.error('Error processing files:', err);
    }
}

function formatFileName(fileName) {
    let formatted = fileName.replace('.html', '');
    const timePartIndex = formatted.indexOf('_2025'); // Find the start of the date/time part
    if (timePartIndex !== -1) {
        formatted = formatted.substring(0, timePartIndex); //remove the time part
    }
    formatted = formatted.replace(/_/g, '/'); // Replace underscores with slashes
    return formatted;
}



// Example usage:  Replace './input_folder' with the actual path
const inputFolder = './Input'; // Or a command-line argument
processHTMLFiles(inputFolder);