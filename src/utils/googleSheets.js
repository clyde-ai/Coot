const { google } = require('googleapis');
const fs = require('fs');
const path = process.env.GOOGLE_CREDENTIALS;

if (!process.env.GOOGLE_CREDENTIALS) {
    throw new Error('GOOGLE_CREDENTIALS environment variable is not set.');
}

const credentials = JSON.parse(fs.readFileSync(path, 'utf8'));

const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

async function writeToSheet(sheetName, data) {
    try {
        await sheets.spreadsheets.values.append({
            spreadsheetId: process.env.GOOGLE_SHEET_ID,
            range: `${sheetName}!A:C`,
            valueInputOption: 'RAW',
            resource: {
                values: [data],
            },
        });
        console.log(`Data written to sheet ${sheetName}`);
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
        console.log(`Sheet ${sheetName} updated at range ${range}`);
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
        console.log(`Data read from sheet ${sheetName} at range ${range}`);
        return res.data.values;
    } catch (error) {
        console.error(`Error reading from sheet ${sheetName}:`, error);
        throw new Error('Failed to read from Google Sheets. Please try again later.');
    }
}

async function setHeaders(sheetName, headers) {
    try {
        await sheets.spreadsheets.values.update({
            spreadsheetId: process.env.GOOGLE_SHEET_ID,
            range: `${sheetName}!A1:${String.fromCharCode(65 + headers.length - 1)}1`,
            valueInputOption: 'RAW',
            resource: {
                values: [headers],
            },
        });
        console.log(`Headers set in sheet ${sheetName}`);
    } catch (error) {
        console.error(`Error setting headers in sheet ${sheetName}:`, error);
        throw new Error('Failed to set headers in Google Sheets. Please try again later.');
    }
}

module.exports = {
    writeToSheet,
    updateSheet,
    readSheet,
    setHeaders,
};
