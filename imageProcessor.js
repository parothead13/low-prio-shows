const fs = require('fs');
const puppeteer = require('puppeteer');
const sharp = require('sharp');
const csvParser = require('csv-parser');

const fontPath1 = 'fonts/HelveticaNowDisplayXBd.ttf';
const fontData1 = fs.readFileSync(fontPath1);
const base64Font1 = fontData1.toString('base64');

async function convertSvgToPng(svg, outputPath) {
    const browser = await puppeteer.launch({
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });          
    const page = await browser.newPage();
    await page.setContent(svg);
    const element = await page.$('svg');
    await element.screenshot({ path: outputPath, omitBackground: true });
    await browser.close();
}

function generateTextSvg(text, fontBase64, maxFontSize = 190, maxWidth = 1920, maxHeight = 1600) {
    text = String(text);
    const words = text.split(' ');
    let lines = [];
    let currentLine = '';
    
    // Wrap text into lines
    for (const word of words) {
        if ((currentLine.length + word.length + 1) > 15) {
            lines.push(currentLine);
            currentLine = word;
        } else {
            currentLine += (currentLine ? ' ' : '') + word;
        }
    }
    lines.push(currentLine);  // Push the last line

    // If the lines exceed 3, truncate and append ellipsis to the last line
    if (lines.length > 6) {
        lines = lines.slice(0, 6);
        if (lines[5].length < 12) {
            lines[5] = lines[5].substring(0, 9) + "...";
        } else {
            lines[5] = lines[5].substring(0, lines[5].length - 3) + "...";
        }
    }

    // Find the longest line
    const longestLine = lines.reduce((a, b) => a.length > b.length ? a : b, "");

    // Calculate maximum possible font size based on the longest line
    let fontSize = maxFontSize;
    if (longestLine.length * fontSize * 0.7 > maxWidth) {
        fontSize = Math.floor(maxWidth / (longestLine.length * 0.7));
    }
    
    // Calculate total height and adjust if needed
    let totalHeight = lines.length * fontSize * 1.2;
    if (totalHeight > maxHeight) {
        fontSize = Math.floor(maxHeight / (lines.length * 1.2));
        totalHeight = lines.length * fontSize * 1.2;
    }



    let svgText = '';
    
    // Calculate starting y-coordinate for bottom alignment
    let y = 630;

    for (const [index, line] of lines.entries()) {
        const textAnchor = "start";  // Always left-align
        const x = 260;  // Always start at 100 for left alignment
        svgText += `<text x="${x}" y="${y}" font-family="CustomFont" font-size="${fontSize}px" text-anchor="${textAnchor}" fill="#FFFFFF">${line}</text>`;
        y += fontSize * 1.2;  // 1.2 is the line-height factor
    }

    return `
    <svg height="${maxHeight}" width="${maxWidth}" viewBox="0 0 ${maxWidth} ${maxHeight}" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <style>
                    @font-face {
                        font-family: 'CustomFont';
                        src: url(data:font/truetype;charset=utf-8;base64,${fontBase64}) format('truetype');
                    }
                </style>
            </defs>
            ${svgText}
        </svg>
    `;
}

async function combinePngsWithBackground(pngPath, backgroundPath, outputPath) {
    await sharp(backgroundPath)
        .composite([{ input: pngPath, gravity: 'northwest' }])
        .toFile(outputPath);
}


async function addWrappedTextToSvgAndPng(outputPath, text, backgroundImage) {
    console.log("Generating SVG with text:", text); // Add logging to check the text value
    const pngPath =  '_1.png';

    const fontSize1 = 190;

    const svg1 = generateTextSvg(text, base64Font1, fontSize1);

    await convertSvgToPng(svg1, pngPath);

    await combinePngsWithBackground(pngPath, backgroundImage, outputPath);
}



// Export the functions you need accessible outside this module
module.exports = {
    addWrappedTextToSvgAndPng,
    // Include any other functions you wish to export
};