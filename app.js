const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { addWrappedTextToSvgAndPng } = require('./imageProcessor');

const csv = require('csv-parser');

const app = express();
const port = process.env.PORT || 3001;

// Middleware to parse URL-encoded data
app.use(express.urlencoded({ extended: true }));

// Parse JSON bodies (as sent by API clients)
app.use(express.json());

let backgrounds = []; // Array to hold background data


fs.createReadStream('data/backgrounds.csv')
  .pipe(csv())
  .on('data', (data) => backgrounds.push(data))
  .on('end', () => {
    console.log('CSV file successfully processed');
    // Optionally, start the server here if you want to ensure the CSV is read before the server starts
  });

if (!fs.existsSync('./uploads')) {
  fs.mkdirSync('./uploads', { recursive: true });
}

if (!fs.existsSync('./output')) {
  fs.mkdirSync('./output', { recursive: true });
}


// Set up multer for file uploads
const upload = multer({ dest: './uploads/' });


// Handle form submission
app.post('/generate-image', upload.none(), async (req, res) => {
  console.log("Form submission received:", req.body); // Ensure this logs
  const text = req.body.name;
  console.log("Extracted text:", text); // This should log the entered text

  // If text is still undefined here, the issue lies in form submission or data extraction
  if (!text) {
    console.error("Text is undefined.");
    return res.status(400).send("Text field is missing.");
  }
  const backgroundImage = req.body.backgroundImage; // Path to the uploaded background image
  const outputPath = `output/${Date.now()}-image.png`; // Define how you want to name the output file

  try {
    await addWrappedTextToSvgAndPng(outputPath, text, backgroundImage); // Use your existing function
    return res.sendFile(path.join(__dirname, outputPath)); // Send the generated image back to the client
  } catch (error) {
    console.error(error);
    // Use `return` here to exit the function after sending the error response
    return res.status(500).send("An error occurred while generating the image.");
  }
});


app.set('view engine', 'ejs');

app.get('/', (req, res) => {
  res.render('index', { backgrounds: backgrounds }); // Render 'index.ejs' with background data
});

//app.get('/api/backgrounds', (req, res) => {
//  res.json(backgrounds); // Assuming 'backgrounds' is an array of objects [{ background_file_name: "background1.png", name: "Background 1" }, ...]
//});


app.listen(port, () => console.log(`App listening at http://localhost:${port}`));

