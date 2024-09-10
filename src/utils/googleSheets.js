const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

let credentials;

if (process.env.GOOGLE_CREDENTIALS_PATH) {
    console.log('GOOGLE_CREDENTIALS_PATH found, proceeding with local function.');
    const credentialsPath = path.resolve(process.env.GOOGLE_CREDENTIALS_PATH);
    credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
} else if (process.env.GOOGLE_CREDENTIALS) {
    console.log('GOOGLE_CREDENTIALS_PATH not found, proceeding with hosted function.');
    credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
} else {
    throw new Error('No Google Cloud credentials found. Please set either GOOGLE_CREDENTIALS_PATH or GOOGLE_CREDENTIALS environment variable.');
}

const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

async function writeToSheet(sheetName, data) {
    try {
        await sheets.spreadsheets.values.append({
            spreadsheetId: process.env.GOOGLE_SHEET_ID,
            range: `${sheetName}!A:G`,
            valueInputOption: 'RAW',
            resource: {
                values: [data],
            },
        });
        console.log(`Data written to sheet ${sheetName}`);
    } catch (error) {
        console.error(`ERROR writing to sheet ${sheetName}:`, error);
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
        console.error(`ERROR updating sheet ${sheetName}:`, error);
        throw new Error('Failed to update Google Sheets. Please try again later.');
    }
}

async function updateCell(range, value) {
    try {
        await sheets.spreadsheets.values.update({
            spreadsheetId: process.env.GOOGLE_SHEET_ID,
            range: range,
            valueInputOption: 'RAW',
            resource: {
                values: [[value]],
            },
        });
        console.log(`Cell ${range} updated with value ${value}`);
    } catch (error) {
        console.error(`ERROR updating cell ${range}:`, error);
        throw new Error('Failed to update cell in Google Sheets. Please try again later.');
    }
}

async function readSheet(range) {
    try {
        const res = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.GOOGLE_SHEET_ID,
            range,
        });
        console.log(`Data read from sheet at range ${range}`);
        return res.data.values;
    } catch (error) {
        console.error(`ERROR reading from sheet at range ${range}:`, error);
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
        console.error(`ERROR setting headers in sheet ${sheetName}:`, error);
        throw new Error('Failed to set headers in Google Sheets. Please try again later.');
    }
}

async function sortSheet(sheetName, column, order = 'asc') {
    try {
        const sortOrder = order === 'asc' ? 'ASCENDING' : 'DESCENDING';
        await sheets.spreadsheets.batchUpdate({
            spreadsheetId: process.env.GOOGLE_SHEET_ID,
            resource: {
                requests: [
                    {
                        sortRange: {
                            range: {
                                sheetId: await getSheetId(sheetName),
                                startRowIndex: 1, // Skip the header row
                            },
                            sortSpecs: [
                                {
                                    dimensionIndex: column.charCodeAt(0) - 65, // Convert column letter to index
                                    sortOrder,
                                },
                            ],
                        },
                    },
                ],
            },
        });
        console.log(`Sheet ${sheetName} sorted by column ${column} in ${order} order`);
    } catch (error) {
        console.error(`Error sorting sheet ${sheetName}:`, error);
        throw new Error('Failed to sort Google Sheets. Please try again later.');
    }
}

async function getSheetId(sheetName) {
    try {
        const res = await sheets.spreadsheets.get({
            spreadsheetId: process.env.GOOGLE_SHEET_ID,
        });
        const sheet = res.data.sheets.find(sheet => sheet.properties.title === sheetName);
        return sheet.properties.sheetId;
    } catch (error) {
        console.error(`ERROR getting sheet ID for ${sheetName}:`, error);
        throw new Error('Failed to get sheet ID. Please try again later.');
    }
}

async function freezeHeaders(sheetName) {
    try {
        await sheets.spreadsheets.batchUpdate({
            spreadsheetId: process.env.GOOGLE_SHEET_ID,
            resource: {
                requests: [
                    {
                        updateSheetProperties: {
                            properties: {
                                sheetId: await getSheetId(sheetName),
                                gridProperties: {
                                    frozenRowCount: 1,
                                },
                            },
                            fields: 'gridProperties.frozenRowCount',
                        },
                    },
                ],
            },
        });
        console.log(`Headers frozen in sheet ${sheetName}`);
    } catch (error) {
        console.error(`ERROR freezing headers in sheet ${sheetName}:`, error);
        throw new Error('Failed to freeze headers in Google Sheets. Please try again later.');
    }
}

async function clearSheet(range) {
    try {
        await sheets.spreadsheets.values.clear({
            spreadsheetId: process.env.GOOGLE_SHEET_ID,
            range: range,
        });
        console.log(`Sheet cleared at range ${range}`);
    } catch (error) {
        console.error(`ERROR clearing sheet at range ${range}:`, error);
        throw new Error('Failed to clear Google Sheets. Please try again later.');
    }
}

async function readCell(range, variable) {
    try {
        const res = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.GOOGLE_SHEET_ID,
            range,
        });
        console.log(`Cell ${range} read with value ${res.data.values[0][0]}`);
        variable = res.data.values[0][0];
        return variable;
    } catch (error) {
        console.error(`ERROR reading cell ${range}:`, error);
        throw new Error('Failed to read cell in Google Sheets. Please try again later.');
    }
}

module.exports = {
    writeToSheet,
    updateSheet,
    updateCell,
    readSheet,
    setHeaders,
    sortSheet,
    freezeHeaders,
    clearSheet,
    readCell
};
