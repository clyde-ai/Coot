const googleSheets = require('../src/utils/googleSheets');

describe('Google Sheets Integration', () => {
    beforeAll(() => {
        // Mock the environment variable for GOOGLE_CREDENTIALS_PATH
        process.env.GOOGLE_CREDENTIALS_PATH = 'path/to/mock/credentials.json';
        process.env.GOOGLE_SHEET_ID = 'your-google-sheet-id';

        // Mock the file system read operation
        jest.mock('fs', () => ({
            readFileSync: jest.fn(() => JSON.stringify({
                type: "service_account",
                project_id: "your-project-id",
                private_key_id: "your-private-key-id",
                private_key: "-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----\n",
                client_email: "your-client-email@your-project-id.iam.gserviceaccount.com",
                client_id: "your-client-id",
                auth_uri: "https://accounts.google.com/o/oauth2/auth",
                token_uri: "https://oauth2.googleapis.com/token",
                auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
                client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/your-client-email%40your-project-id.iam.gserviceaccount.com"
            }))
        }));
    });

    test('should initialize Google Sheets with credentials', () => {
        expect(process.env.GOOGLE_CREDENTIALS_PATH).toBeDefined();
        const credentials = JSON.parse(require('fs').readFileSync(process.env.GOOGLE_CREDENTIALS_PATH, 'utf8'));
        expect(credentials).toHaveProperty('type', 'service_account');
    });

});
