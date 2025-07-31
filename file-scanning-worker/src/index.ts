import amqp, { AmqpConnectionManager, ChannelWrapper } from 'amqp-connection-manager';
import mongoose from 'mongoose';
import axios from 'axios';
import dotenv from 'dotenv';
import File from './models/File';

// Load environment variables
dotenv.config();

// Configuration
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost';
const QUEUE_NAME = 'file_scan_queue';
const MONGODB_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/cyberx';
const DANGEROUS_KEYWORDS = ['rm -rf', 'eval', 'bitcoin'];

// Interface for RabbitMQ message content
interface QueueMessage {
  fileId: string;
  filePath: string;
}

async function scanFile(fileUrl: string): Promise<boolean> {
  return new Promise(async (resolve) => {
    try {
      const response = await axios.get(fileUrl, {
        responseType: 'text', // For PDFs, DOCs, etc.
        timeout: 10000,
      });

      const content = response.data.toString().toLowerCase();
      const isInfected = DANGEROUS_KEYWORDS.some(keyword => content.includes(keyword));

      // A FAKE DELAY
      setTimeout(() => {
        resolve(isInfected);
      }, 3000);
    } catch (error) {
      console.warn(`Could not fetch or scan file from URL ${fileUrl}:`);
      resolve(false); // Assume clean if it can't be scanned
    }
  });
}


// Worker function to process queue
async function startWorker(): Promise<void> {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URL);
    console.log('Connected to MongoDB');

    // Connect to RabbitMQ
    const connection: AmqpConnectionManager = amqp.connect([RABBITMQ_URL]);
    const channel: ChannelWrapper = connection.createChannel({
      setup: async (chan: any) => {
        await chan.assertQueue(QUEUE_NAME, { durable: true });
        await chan.prefetch(1); // Ensure fair dispatch
      },
    });

    console.log(` [*] Waiting for messages in ${QUEUE_NAME}. To exit press CTRL+C`);

    channel.on('connect', () => console.log('Channel connected'));
    channel.on('error', (err) => console.error('Channel error:', err));
    channel.on('close', () => console.log('Channel closed'));

    await channel.consume(
      QUEUE_NAME,
      async (msg) => {
        if (!msg) {
          console.log('Received null message');
          return;
        }

        try {
          const { fileId, filePath } = JSON.parse(msg.content.toString()) as QueueMessage;
          console.log(` [x] Processing file ${fileId}`);

          const isInfected = await scanFile(filePath);
          const result: 'clean' | 'infected' = isInfected ? 'infected' : 'clean';

          const filedata = await File.findById(fileId)
          const dbres = await File.findByIdAndUpdate(fileId, {
            status: 'scanned',
            result,
            scannedAt: new Date(),
          });
          console.log(fileId, MONGODB_URL, filedata, dbres)

          console.log(` [x] File ${fileId} scanned. Result: ${result}`);

          channel.ack(msg);
        } catch (error) {
          console.error('Error processing file:', error);
          channel.nack(msg, false, false); // Do not requeue failed messages
        }
      },
      { noAck: false } // Manual acknowledgment
    );
  } catch (error) {
    console.error('Worker error:', error);
    setTimeout(startWorker, 5000); // Retry after 5 seconds
  }
}

// Start the worker
startWorker().catch(console.error);