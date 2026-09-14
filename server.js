const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { Server } = require("socket.io");

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;
// when using middleware `hostname` and `port` must be provided below
const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handler(req, res, parsedUrl);
  });

  // We'll store the outletId to socket mapping for broadcasting
  const outletSocketMap = new Map(); // outletId -> Set of socket ids

  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // Set global emitter for real-time events
  global.__khandoliEmitOutletEvent = (outletId, type, payload = {}) => {
    if (!outletId) return;
    const sockets = outletSocketMap.get(outletId);
    if (sockets) {
      sockets.forEach((socketId) => {
        io.to(socketId).emit("outletEvent", { type, payload, at: new Date().toISOString() });
      });
    }
  };

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // When a client joins an outlet room
    socket.on("joinOutlet", (outletId) => {
      if (!outletId) return;
      console.log(`Socket ${socket.id} joined outlet ${outletId}`);
      let sockets = outletSocketMap.get(outletId);
      if (!sockets) {
        sockets = new Set();
        outletSocketMap.set(outletId, sockets);
      }
      sockets.add(socket.id);
      socket.outletId = outletId; // store on socket for disconnect
    });

    // When a client leaves an outlet room (or disconnects)
    socket.on("disconnect", (reason) => {
      console.log(`User disconnected: ${socket.id}, reason: ${reason}`);
      if (socket.outletId) {
        const sockets = outletSocketMap.get(socket.outletId);
        if (sockets) {
          sockets.delete(socket.id);
          if (sockets.size === 0) {
            outletSocketMap.delete(socket.outletId);
          }
        }
      }
    });
  });

  // Now we need to modify the real-time bus to use Socket.io
  // We'll create a wrapper that emits via Socket.io to the appropriate outlet room
  const emitOutletEventViaSocket = (outletId, type, payload = {}) => {
    if (!outletId) return;
    const sockets = outletSocketMap.get(outletId);
    if (sockets) {
      sockets.forEach((socketId) => {
        io.to(socketId).emit("outletEvent", { type, payload, at: new Date().toISOString() });
      });
    }
  };

  // We need to replace the existing emitOutletEvent function in lib/realtimeBus.js
  // But we cannot modify that file from here. Instead, we can override the module's export?
  // Alternatively, we can modify the lib/realtimeBus.js to use this function when Socket.io is available.
  // For simplicity, we will modify lib/realtimeBus.js to check for a global Socket.io emitter.

  // However, let's keep the existing realtimeBus.js and create a new version that uses Socket.io.
  // We'll change the API routes to use the new emitter.

  // Since we are in the server, we can modify the lib/realtimeBus.js file to use our Socket.io emitter.
  // But note: we are running the server, and the lib/realtimeBus.js is required in the API routes.
  // We can change the file to conditionally use Socket.io if we are in the server environment.

  // Given the complexity, we will instead create a new file for Socket.io real-time and update the API routes to use it.
  // But we are limited by time.

  // For now, we will just set up the Socket.io server and leave the existing SSE as is.
  // We will then update the client to use Socket.io and change the API routes to emit via Socket.io.

  // We will do that in the next steps.

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});