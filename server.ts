import { createServer } from "http";
import { Server as IoServer } from "socket.io";
import dotenv from "dotenv";
import { connectRabbitMQ } from "./services/rabbitmq";
import { onConnection } from "./sockets";

dotenv.config();

async function main() {
    await connectRabbitMQ();

    const httpServer = createServer();
    const io = new IoServer(httpServer, {
        cors: { origin: "*" },
    });

    onConnection(io);

    httpServer.listen(4000, () =>
        console.log("Socket.IO server listening on :4000")
    );
}

main().catch((err) => {
    console.error("Failed to start server:", err);
    process.exit(1);
});
