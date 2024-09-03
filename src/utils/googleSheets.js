const { google } = require('googleapis');

const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);

const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

async function writeToSheet(sheetName, data) {
    try {
        await sheets.spreadsheets.values.append({
            spreadsheetId: process.env.GOOGLE_SHEET_ID,
            range: `${sheetName}!A:E`,
            valueInputOption: 'RAW',
            resource: {
                values: [data],
            },
        });
    } catch (error) {
        console.error(`Error writing to sheet ${sheetName}:`, error);
        throw new Error('Failed to write to Google Sheets. Please try again later.');
    }
}

async function updateSheet(sheetName, range, data) {
    try {
        await sheets.spreadsheets.values.update({
            spreadsheetId: process.env.GOOGLE_SHEET_ID,
            range: `${sheetName}!${range}`,
            valueInputOption: 'RAW',
            resource: {
                values: [data],
            },
        });
    } catch (error) {
        console.error(`Error updating sheet ${sheetName}:`, error);
        throw new Error('Failed to update Google Sheets. Please try again later.');
    }
}

async function readSheet(sheetName, range) {
    try {
        const res = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.GOOGLE_SHEET_ID,
            range: `${sheetName}!${range}`,
        });
        return res.data.values;
    } catch (error) {
        console.error(`Error reading from sheet ${sheetName}:`, error);
        throw new Error('Failed to read from Google Sheets. Please try again later.');
    }
}

module.exports = {
    writeToSheet,
    updateSheet,
    readSheet,
};
