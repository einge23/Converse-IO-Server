import amqp, { Channel } from "amqplib";
import { Message } from "../types";

const EXCHANGE = "chat.exchange";
const ROUTING_KEY = "chat.message";

let channel: Channel;

export async function connectRabbitMQ(): Promise<Channel> {
    try {
        const RABBITMQ_URL = process.env.RABBITMQ_URL!;
        const conn = await amqp.connect(RABBITMQ_URL);
        console.log("Successfully connected to RabbitMQ");

        const ch = await conn.createChannel();
        await ch.assertExchange(EXCHANGE, "direct", { durable: true });
        console.log(`Exchange '${EXCHANGE}' asserted successfully`);
        channel = ch;
        return ch;
    } catch (error) {
        console.error("Failed to connect to RabbitMQ:", error);
        throw error;
    }
}

export function publishMessage(payload: Message) {
    const ok = channel.publish(
        EXCHANGE,
        ROUTING_KEY,
        Buffer.from(JSON.stringify(payload)),
        { persistent: true }
    );

    if (!ok) {
        console.warn("⚠️ RabbitMQ backpressure, message not sent immediately");
    } else {
        console.log(
            `✅ Message published to RabbitMQ - Thread: ${payload.thread_id}, Message ID: ${payload.message_id}`
        );
    }
}
