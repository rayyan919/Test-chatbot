## Follow these steps for development mode

Follow the steps below to run this project in development mode:

### 1. Create `.env` File (inside `server/` directory)

Create a file named `.env` and add the following environment variables:

```env
PORT=3000
DB_HOST=           # e.g., localhost
DB_USER=           # your MySQL username
DB_NAME=test_chat
DB_PASSWORD=       # your MySQL password
DB_PORT=           # e.g., 3306
SECRET_KEY=chemsecret
GEMINI_API_KEY=    # your Gemini Pro API key

Also find the `schema.sql` file in `server/db/` directory and run it in your MYSQL Workbench

### 3. Run the App
In two separate terminals:

For the server:


cd server
npm run dev  

For the client:

cd client
npm run dev

## How to Use ChemBot
Once the app is running, ChemBot will greet you and guide you through your research. You can:

Enter a compound name, CID, or SMILES string.

ChemBot will fetch and display relevant properties and available file types (e.g., 2D SDF, 3D SDF, PNG).

You can choose to download specific files, get drug-likeness predictions, or add more compounds.

For returning users, ChemBot remembers your past interactions and displays your chat history for a seamless experience.

You can interact with ChemBot just like chatting with a research assistant — it will intelligently guide you step-by-step through compound selection, property retrieval, and data export.