# Babble App Backend

## 📦 Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/your-username/your-repo-name.git
   cd your-repo-name
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory and add your environment variables (if needed):

   ```
   PORT=5000
   ```

---

## 🚀 Running the Backend Locally with Emulator

To run the backend server and connect it to a mobile emulator:

1. Open `index.js`.

2. Update the server listen configuration to bind the server to all interfaces (`0.0.0.0`):

   ```js
   server.listen(config.PORT, "0.0.0.0", () => {
     console.log(`Server connected successfully on port ${config.PORT}`);
   });
   ```

   *This allows the backend to accept connections from external devices, such as an Android emulator.*

3. Open **Command Prompt** and execute:

   ```bash
   ipconfig
   ```

4. Find your **IPv4 Address** (e.g., `192.168.29.35`).

5. In your Android app, set the **base URL** to your IPv4 address with port `5000`. Example:

   ```
   http://192.168.29.35:5000/
   ```

   > ⚠️ Ensure your computer and emulator are connected to the same local network.

---
