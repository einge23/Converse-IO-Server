import { Server as IoServer, Socket } from "socket.io";
import { UserStatus, UserStatuses } from "../types";
import { updateStatus } from "../api/apiSync";

interface SocketAuth {
    token?: string;
    userId: string;
}

export function registerStatusHandlers(io: IoServer, socket: Socket) {
    const { userId, token } = socket.handshake.auth as SocketAuth;

    setTimeout(() => {
        io.to(`status:${userId}`).emit("status:update", {
            userId,
            status: "online",
        });
        console.log(`Broadcasted 'online' status for user ${userId}`);
    }, 500);

    socket.on("status:subscribe", (friendIds: string[]) => {
        if (!Array.isArray(friendIds)) {
            socket.emit("error", {
                type: "validation_error",
                message: "friendIds must be an array of strings.",
            });
            return;
        }
        for (const friendId of friendIds) {
            socket.join(`status:${friendId}`);
            console.log(
                `User ${userId} subscribed to status updates for ${friendId}`
            );
        }
    });

    socket.on("status:set", async (data: { status: UserStatus }) => {
        const { status } = data;

        if (!UserStatuses.includes(status)) {
            socket.emit("error", {
                type: "validation_error",
                message: `Invalid status. Must be one of: ${UserStatuses.join(
                    ", "
                )}`,
            });
            return;
        }

        if (!userId) {
            throw new Error("UserId is required.");
        }

        try {
            io.to(`status:${userId}`).emit("status:update", { userId, status });
        } catch (error) {
            console.error(`Failed to set status for user ${userId}:`, error);
            socket.emit("error", {
                type: "server_error",
                message: "Failed to update status.",
            });
        }
    });
}
