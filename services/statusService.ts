import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

console.log(process.env.REDIS_URL);
const redis = new Redis(process.env.REDIS_URL!);

export class StatusService {
    private static readonly STATUS_PREFIX = "user:status:";
    private static readonly STATUS_TTL = 300; // 5 minutes

    static async setUserStatus(userId: string, status: string): Promise<void> {
        await redis.setex(
            `${this.STATUS_PREFIX}${userId}`,
            this.STATUS_TTL,
            status
        );
    }

    static async getUserStatus(userId: string): Promise<string | null> {
        return await redis.get(`${this.STATUS_PREFIX}${userId}`);
    }

    static async getUserStatuses(
        userIds: string[]
    ): Promise<Record<string, string | null>> {
        if (userIds.length === 0) return {};

        const keys = userIds.map((id) => `${this.STATUS_PREFIX}${id}`);
        const statuses = await redis.mget(keys);

        const result: Record<string, string | null> = {};

        userIds.forEach((userId, index) => {
            result[userId] = statuses[index];
        });

        return result;
    }

    static async removeUserStatus(userId: string): Promise<void> {
        await redis.del(`${this.STATUS_PREFIX}${userId}`);
    }
}

export { redis };
