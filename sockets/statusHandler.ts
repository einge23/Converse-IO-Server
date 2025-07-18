import { Server as IoServer, Socket } from "socket.io";
import { UserStatus, UserStatuses } from "../types";
import { StatusService } from "../services/statusService";

export interface SocketAuth {
    userId: string;
}

export function registerStatusHandlers(io: IoServer, socket: Socket) {
    const { userId } = socket.handshake.auth as SocketAuth;

    setTimeout(async () => {
        await StatusService.setUserStatus(userId, "online");
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

        const statuses = StatusService.getUserStatuses(friendIds);
        for (const [friendId, status] of Object.entries(statuses)) {
            if (status) {
                socket.emit("status:update", { userId: friendId, status });
            }
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
            await StatusService.setUserStatus(userId, status);
            io.to(`status:${userId}`).emit("status:update", { userId, status });
        } catch (error) {
            console.error(`Failed to set status for user ${userId}:`, error);
            socket.emit("error", {
                type: "server_error",
                message: "Failed to update status.",
            });
        }
    });

    socket.on("user:logout", async () => {
        try {
            await StatusService.removeUserStatus(userId);
            io.to(`status:${userId}`).emit("status:update", {
                userId,
                status: "offline",
            });
            console.log(
                `User ${userId} logged out - status removed from Redis`
            );
        } catch (error) {
            console.error(
                `Failed to remove status for user ${userId} on logout:`,
                error
            );
        }
    });

    socket.on("disconnect", async () => {
        await StatusService.removeUserStatus(userId);
        io.to(`status:${userId}`).emit("status:update", {
            userId,
            status: "offline",
        });
        console.log(`Broadcasted 'offline' status for user ${userId}`);
    });
}
