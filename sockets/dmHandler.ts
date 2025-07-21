import { Server as IoServer, Socket } from "socket.io";
import { Message, MessagePayload } from "../types";
import { publishMessage } from "../services/rabbitmq";

export function registerDmHandlers(io: IoServer, socket: Socket) {
    const userId = socket.handshake.auth.userId as string;

    socket.on("dm:subscribe", (threadIds: string[]) => {
        if (!Array.isArray(threadIds)) {
            socket.emit("error", {
                type: "validation_error",
                message: "threadIds must be an array of strings.",
            });
            return;
        }
        for (const threadId of threadIds) {
            socket.join(threadId);
            console.log(`User ${userId} subscribed to thread: ${threadId}`);
        }
    });

    socket.on("dm:send", async (msg: MessagePayload) => {
        if (!msg.thread_id) {
            socket.emit("error", {
                type: "validation_error",
                message: "thread_id is required for direct messages",
            });
            return;
        }

        await socket.join(msg.thread_id);

        const now = new Date().toISOString();
        const payload: Message = {
            message_id: msg.message_id,
            thread_id: msg.thread_id,
            sender_id: userId,
            content_type: msg.content_type,
            content: msg.content,
            metadata: msg.metadata,
            created_at: now,
            updated_at: now,
            deleted_at: null,
            attachments: msg.attachments,
        };

        publishMessage(payload);
        io.to(msg.thread_id).emit("dm:receive", payload);
    });
}
