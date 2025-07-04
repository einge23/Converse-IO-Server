import { createServer } from "http";
import { Server as IoServer, Socket } from "socket.io";
import amqp, { Channel } from "amqplib";
import dotenv from "dotenv";

dotenv.config();
const RABBITMQ_URL = process.env.RABBITMQ_URL!;
const EXCHANGE = "chat.exchange";
const ROUTING_KEY = "chat.message";

export type MessagePayload = {
    message_id: string;
    room_id?: string;
    thread_id?: string;
    content_type: string;
    content: string;
    metadata?: object;
};

export type Message = {
    message_id: string;
    room_id?: string;
    thread_id?: string;
    sender_id: string;
    content_type: string;
    content: string;
    metadata?: object;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
};

async function createRabbitChannel(): Promise<Channel> {
    try {
        console.log("Attempting to connect to RabbitMQ...");
        const conn = await amqp.connect(RABBITMQ_URL);
        console.log("Successfully connected to RabbitMQ");

        const ch = await conn.createChannel();
        await ch.assertExchange(EXCHANGE, "direct", { durable: true });
        console.log(`Exchange '${EXCHANGE}' asserted successfully`);

        return ch;
    } catch (error) {
        console.error("Failed to connect to RabbitMQ:", error);
        throw error;
    }
}

async function main() {
    const rabbitCh = await createRabbitChannel();

    const httpServer = createServer();
    const io = new IoServer(httpServer, {
        cors: { origin: "*" },
    });

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

        socket.on("dm:send", async (msg: MessagePayload) => {
            if (!msg.thread_id) {
                socket.emit("error", {
                    type: "validation_error",
                    message: "thread_id is required for direct messages",
                });
                return;
            }

            await socket.join(msg.thread_id);

            const now = new Date().toISOString().split(".")[0] + "Z";
            const payload: Message = {
                message_id: msg.message_id,
                room_id: msg.room_id,
                thread_id: msg.thread_id,
                sender_id: userId,
                content_type: msg.content_type,
                content: msg.content,
                metadata: msg.metadata,
                created_at: now,
                updated_at: now,
                deleted_at: null,
            };

            const ok = rabbitCh.publish(
                EXCHANGE,
                ROUTING_KEY,
                Buffer.from(JSON.stringify(payload)),
                { persistent: true }
            );
            if (!ok) {
                console.warn(
                    "⚠️ RabbitMQ backpressure, message not sent immediately"
                );
            } else {
                console.log(
                    `✅ Message published to RabbitMQ - Thread: ${msg.thread_id}, Message ID: ${msg.message_id}`
                );
            }

            io.to(msg.thread_id).emit("chat:receive", payload);
        });
    });

    httpServer.listen(4000, () =>
        console.log("Socket.IO server listening on :4000")
    );
}

main().catch((err) => {
    console.error("Failed to start server:", err);
    process.exit(1);
});
