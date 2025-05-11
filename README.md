# Video Call App Backend

### Running the Backend Locally with Emulator
To run the backend locally and connect with the emulator, follow these steps:

1. Open index.js.
2. Update the server listen configuration to include the host 0.0.0.0

server.listen(config.PORT, "0.0.0.0", () => {
  console.log(`Server connected successfully on port ${config.PORT}`);
});

*This allows the backend server to accept connections from any IP address, which is necessary for emulator communication.*
