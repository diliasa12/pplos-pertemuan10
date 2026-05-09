import amqp from "amqplib";

let channel = null;
const QUEUE = "user.registered";

export async function connect(retries = 5) {
  for (let i = 0; i < retries; i++) {
    try {
      const conn = await amqp.connect(process.env.RABBITMQ_URL);
      channel = await conn.createChannel();
      await channel.assertQueue(QUEUE, { durable: true });
      console.log("Connected to RabbitMQ");

      conn.on("close", () => {
        console.warn("Connection closed, reconnecting...");
        setTimeout(connect, 5000);
      });
      return;
    } catch (err) {
      console.error(`Attempt ${i + 1} failed:`, err.message);
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
}

export function publish(payload) {
  if (!channel) {
    console.warn("[AUTH-MQ] No channel, skipping publish");
    return;
  }
  channel.sendToQueue(QUEUE, Buffer.from(JSON.stringify(payload)), {
    persistent: true,
  });
  console.log("[AUTH-MQ] Message sent:", payload);
}
