const { google } = require("googleapis");
require("dotenv").config();

const auth = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  "http://localhost:5000/auth/google/callback"
);

auth.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });

const drive = google.drive({ version: "v3", auth });

const uploadLetter = async (req, res) => {
  try {
    console.log(req.body);
    const fileMetadata = {               
      name: "Letter.docx",
      mimeType: "application/vnd.google-apps.document",
    };

    const media = {
      mimeType: "text/plain",
      body: req.body.content,
    };

    const file = await drive.files.create({
      resource: fileMetadata,
      media,
      fields: "id",
    });
    console.log(file)

    res.json({ fileId: file.data.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { uploadLetter };
