import { Server as IoServer, Socket } from "socket.io";
import { registerDmHandlers } from "./dmHandler";

export function onConnection(io: IoServer) {
    io.on("connection", (socket: Socket) => {
        const userId = socket.handshake.auth.userId as string;

        if (!userId) {
            socket.emit("error", {
                type: "auth_error",
                message: "userId is required in auth",
            });
            socket.disconnect();
            return;
        }
        console.log(`User connected: ${userId} (Socket ID: ${socket.id})`);

        // Register all handlers for this socket
        registerDmHandlers(io, socket);
        // You can add other handlers like registerStatusHandlers(io, socket) here

        socket.on("disconnect", () => {
            console.log(
                `User disconnected: ${userId} (Socket ID: ${socket.id})`
            );
        });
    });
}
