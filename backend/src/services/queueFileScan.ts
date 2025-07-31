import amqp, { AmqpConnectionManager, ChannelWrapper } from 'amqp-connection-manager';
import dotenv from 'dotenv';
import { Channel } from 'amqplib';

dotenv.config();

// Configuration
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost';
const QUEUE_NAME = 'file_scan_queue';
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

// Singleton connection and channel
let connection: AmqpConnectionManager | null = null;
let channel: ChannelWrapper | null = null;

// Initialize RabbitMQ connection and channel
async function initializeRabbitMQ(): Promise<void> {
  if (connection && channel) {
    return; // Already initialized
  }

  if (!process.env.RABBITMQ_URL) {
    throw new Error('RABBITMQ_URL environment variable is not set');
  }

  try {
    connection = amqp.connect([RABBITMQ_URL], {
      heartbeatIntervalInSeconds: 20,
      reconnectTimeInSeconds: 5,
    });

    channel = connection.createChannel({
      json: true, // Automatically serialize/deserialize JSON
      setup: async (chan: Channel) => {
        await chan.assertQueue(QUEUE_NAME, { durable: true });
        await chan.prefetch(1); // Process one message at a time
      },
    });

    // Handle connection errors
    connection.on('connect', () => console.log('Connected to RabbitMQ'));
    connection.on('disconnect', (err) => console.error('RabbitMQ disconnected:', err));

    // Handle channel errors
    channel.on('error', (err) => console.error('RabbitMQ channel error:', err));
    channel.on('close', () => console.log('RabbitMQ channel closed'));

    await channel.waitForConnect();
  } catch (error: any) {
    console.error('Failed to initialize RabbitMQ:', error.message, error.stack);
    throw new Error(`RabbitMQ initialization failed: ${error.message}`);
  }
}

// Function to publish file to RabbitMQ queue with retries
async function queueFileForScanning(fileId: string, filePath: string, retryCount = 0): Promise<void> {
  try {
    // Ensure RabbitMQ is initialized
    await initializeRabbitMQ();

    if (!channel) {
      throw new Error('RabbitMQ channel is not initialized');
    }

    // Prepare message
    const message = { fileId, filePath };

    // Send message to queue
    const sent = await channel.sendToQueue(QUEUE_NAME, message, { persistent: true });
    if (!sent) {
      throw new Error('Failed to send message to queue');
    }

    console.log(` [x] Sent file ${fileId} to queue`);

  } catch (error: any) {
    console.error(`Error queuing file ${fileId} (attempt ${retryCount + 1}/${MAX_RETRIES}):`, error.message, error.stack);

    if (retryCount < MAX_RETRIES - 1) {
      console.log(`Retrying in ${RETRY_DELAY_MS}ms...`);
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      return queueFileForScanning(fileId, filePath, retryCount + 1);
    }

    // Log and rethrow the error after max retries
    const errorMessage = `Failed to queue file ${fileId} after ${MAX_RETRIES} attempts: ${error.message}`;
    console.error(errorMessage);
    throw new Error(errorMessage);
  }
}

export default queueFileForScanning;