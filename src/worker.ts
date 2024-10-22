// worker.ts

import VesselScore from './implementations/VesselScore'

import { Worker, Queue, Job } from 'bullmq';
import { Redis } from 'ioredis';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Create a new Redis connection
const connection = new Redis({
  host: process.env.REDIS_HOST, 
  port: Number(process.env.REDIS_PORT),
  maxRetriesPerRequest: null
});

// Create a queue and a queue scheduler
const queueName = 'cpu-intensive-jobs';
const queue = new Queue(queueName, { connection });

// Function to perform a CPU-intensive task (Fibonacci calculation)
const fibonacci = (n: number): number => {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
};

// Create a worker that processes jobs
const worker = new Worker(queueName, async (job: Job) => {
  console.log(`Processing job ${job.id} with data: ${JSON.stringify(job.data)}`);
  const result = fibonacci(job.data.n);
  console.log(`Job ${job.id} completed with result: ${result}`);
  return result; // Returning result from the job
}, { connection });

// Event listeners for the worker
worker.on('completed', (job: Job) => {
  console.log(`Job ${job.id} has been completed!`);
});

worker.on('ready', () => {
  console.log(`Worker is ready`);
});

worker.on('failed', (job: Job<any, any, string> | undefined, err: Error, prev: string) => {
  console.error(`Job ${job?.id} has failed with error: ${err.message}`);
});

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down worker...');
  await worker.close();
  await connection.quit();
});
