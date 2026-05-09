import amqp from "amqplib";
import pool from "./db/connection.js";

let channel = null;
const QUEUE = "user.registered";

async function handleMessage(msg) {
  if (!msg) return;
  try {
    const payload = JSON.parse(msg.content.toString());
    console.log("Message received:", payload);

    if (payload.event === "user.registered") {
      await pool.execute(
        "INSERT INTO subscriptions (user_id, status) VALUES (?, ?)",
        [payload.id, "basic"],
      );
      console.log("Subscription created for user:", payload.id);
    }

    channel.ack(msg);
  } catch (err) {
    console.error("[STREAM-MQ] Failed to process message:", err.message);
    channel.nack(msg, false, false);
  }
}

export async function connect(retries = 5) {
  for (let i = 0; i < retries; i++) {
    try {
      const conn = await amqp.connect(process.env.RABBITMQ_URL);
      channel = await conn.createChannel();
      await channel.assertQueue(QUEUE, { durable: true });

      channel.prefetch(1);
      channel.consume(QUEUE, handleMessage, { noAck: false });

      console.log("[STREAM-MQ] Connected & consuming queue:", QUEUE);

      conn.on("close", () => {
        console.warn("[STREAM-MQ] Reconnecting...");
        setTimeout(connect, 5000);
      });
      return;
    } catch (err) {
      console.error(`[STREAM-MQ] Attempt ${i + 1} failed:`, err.message);
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
}

export function publish(payload) {
  if (!channel) return;
  channel.sendToQueue(QUEUE, Buffer.from(JSON.stringify(payload)), {
    persistent: true,
  });
  console.log("[STREAM-MQ] Message sent:", payload);
}
