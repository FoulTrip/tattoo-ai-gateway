// /**
//  * WebSocket Client Example for Preview Module
//  *
//  * This example demonstrates how to connect to the /preview WebSocket gateway
//  * and interact with the image processing service.
//  *
//  * Prerequisites:
//  * - Install socket.io-client: npm install socket.io-client
//  * - Have a valid JWT token from authentication
//  */

// import { io, Socket } from 'socket.io-client';
// import * as fs from 'fs';
// import * as path from 'path';

// // Configuration
// const SERVER_URL = 'http://localhost:3000'; // Change to your server URL
// const JWT_TOKEN = 'YOUR_JWT_TOKEN_HERE'; // Replace with actual JWT token

// // WebSocket events interface for type safety
// interface ConnectedEvent {
//   message: string;
//   userId: string;
//   socketId: string;
// }

// interface ProcessingStartedEvent {
//   jobId: string;
//   message: string;
//   timestamp: string;
// }

// interface ProcessingProgressEvent {
//   jobId: string;
//   progress: number;
//   message?: string;
//   timestamp: string;
// }

// interface ProcessingCompletedEvent {
//   jobId: string;
//   data: any;
//   timestamp: string;
// }

// interface ProcessingErrorEvent {
//   jobId: string;
//   error: string;
//   timestamp: string;
// }

// interface ErrorEvent {
//   message: string;
// }

// /**
//  * Preview WebSocket Client Class
//  */
// class PreviewWebSocketClient {
//   private socket: Socket | null = null;
//   private isConnected: boolean = false;

//   constructor(private serverUrl: string, private token: string) {}

//   /**
//    * Connect to the WebSocket server
//    */
//   connect(): Promise<void> {
//     return new Promise((resolve, reject) => {
//       console.log('Connecting to WebSocket server...');

//       // Create socket connection with authentication
//       this.socket = io(`${this.serverUrl}/preview`, {
//         auth: {
//           token: this.token,
//         },
//         transports: ['websocket', 'polling'],
//         reconnection: true,
//         reconnectionDelay: 1000,
//         reconnectionAttempts: 5,
//       });

//       // Connection successful
//       this.socket.on('connected', (data: ConnectedEvent) => {
//         this.isConnected = true;
//         console.log('✅ Connected successfully!');
//         console.log(`   User ID: ${data.userId}`);
//         console.log(`   Socket ID: ${data.socketId}`);
//         console.log(`   Message: ${data.message}`);
//         resolve();
//       });

//       // Connection error
//       this.socket.on('connect_error', (error) => {
//         console.error('❌ Connection error:', error.message);
//         reject(error);
//       });

//       // Error events from server
//       this.socket.on('error', (data: ErrorEvent) => {
//         console.error('❌ Server error:', data.message);
//       });

//       // Disconnection
//       this.socket.on('disconnect', (reason) => {
//         this.isConnected = false;
//         console.log('⚠️  Disconnected:', reason);
//       });

//       // Setup event listeners
//       this.setupEventListeners();
//     });
//   }

//   /**
//    * Setup all event listeners for processing events
//    */
//   private setupEventListeners(): void {
//     if (!this.socket) return;

//     // Processing started
//     this.socket.on('processing:started', (data: ProcessingStartedEvent) => {
//       console.log('\n🚀 Processing Started:');
//       console.log(`   Job ID: ${data.jobId}`);
//       console.log(`   Message: ${data.message}`);
//       console.log(`   Timestamp: ${data.timestamp}`);
//     });

//     // Processing progress updates
//     this.socket.on('processing:progress', (data: ProcessingProgressEvent) => {
//       console.log(`\n⏳ Processing Progress: ${data.progress}%`);
//       if (data.message) {
//         console.log(`   Message: ${data.message}`);
//       }
//       console.log(`   Job ID: ${data.jobId}`);
//     });

//     // Processing completed successfully
//     this.socket.on('processing:completed', (data: ProcessingCompletedEvent) => {
//       console.log('\n✅ Processing Completed!');
//       console.log(`   Job ID: ${data.jobId}`);
//       console.log(`   Timestamp: ${data.timestamp}`);
//       console.log('   Result data:', JSON.stringify(data.data, null, 2));

//       // Save result if it's an image URL or base64
//       this.saveResult(data);
//     });

//     // Processing error
//     this.socket.on('processing:error', (data: ProcessingErrorEvent) => {
//       console.error('\n❌ Processing Error:');
//       console.error(`   Job ID: ${data.jobId}`);
//       console.error(`   Error: ${data.error}`);
//       console.error(`   Timestamp: ${data.timestamp}`);
//     });

//     // Pong response for ping
//     this.socket.on('pong', (data: { timestamp: number; socketId: string }) => {
//       console.log('\n🏓 Pong received:');
//       console.log(`   Socket ID: ${data.socketId}`);
//       console.log(`   Timestamp: ${data.timestamp}`);
//     });
//   }

//   /**
//    * Send a ping to test connection
//    */
//   ping(): void {
//     if (!this.isConnected || !this.socket) {
//       console.error('❌ Not connected to server');
//       return;
//     }

//     console.log('\n🏓 Sending ping...');
//     this.socket.emit('ping');
//   }

//   /**
//    * Process images by sending file paths
//    * @param imagePaths Array of 2 image file paths
//    */
//   async processImages(imagePaths: string[]): Promise<void> {
//     if (!this.isConnected || !this.socket) {
//       console.error('❌ Not connected to server');
//       return;
//     }

//     if (imagePaths.length !== 2) {
//       console.error('❌ Exactly 2 images are required');
//       return;
//     }

//     try {
//       console.log('\n📤 Processing images...');

//       // Read images and convert to base64
//       const base64Files: string[] = [];

//       for (const imagePath of imagePaths) {
//         const fullPath = path.resolve(imagePath);

//         if (!fs.existsSync(fullPath)) {
//           throw new Error(`File not found: ${fullPath}`);
//         }

//         const buffer = fs.readFileSync(fullPath);
//         const base64 = buffer.toString('base64');
//         base64Files.push(base64);

//         console.log(`   ✓ Loaded: ${path.basename(fullPath)} (${(buffer.length / 1024).toFixed(2)} KB)`);
//       }

//       // Send to server
//       this.socket.emit('process-images', { files: base64Files });
//       console.log('   ✓ Images sent to server');

//     } catch (error) {
//       console.error('❌ Error processing images:', error.message);
//     }
//   }

//   /**
//    * Process images from base64 strings directly
//    * @param base64Images Array of 2 base64 encoded images
//    */
//   processImagesFromBase64(base64Images: string[]): void {
//     if (!this.isConnected || !this.socket) {
//       console.error('❌ Not connected to server');
//       return;
//     }

//     if (base64Images.length !== 2) {
//       console.error('❌ Exactly 2 images are required');
//       return;
//     }

//     console.log('\n📤 Processing images from base64...');
//     this.socket.emit('process-images', { files: base64Images });
//     console.log('   ✓ Images sent to server');
//   }

//   /**
//    * Save processing result to file
//    */
//   private saveResult(data: ProcessingCompletedEvent): void {
//     try {
//       // Save the result data as JSON
//       const outputDir = path.join(__dirname, 'output');
//       if (!fs.existsSync(outputDir)) {
//         fs.mkdirSync(outputDir, { recursive: true });
//       }

//       const filename = `result_${data.jobId}_${Date.now()}.json`;
//       const filepath = path.join(outputDir, filename);

//       fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
//       console.log(`   💾 Result saved to: ${filepath}`);

//       // If data contains an image URL or base64, save it separately
//       if (data.data.imageUrl) {
//         console.log(`   🖼️  Image URL: ${data.data.imageUrl}`);
//       }

//       if (data.data.base64Image) {
//         const imageFilename = `result_${data.jobId}_${Date.now()}.png`;
//         const imageFilepath = path.join(outputDir, imageFilename);
//         const buffer = Buffer.from(data.data.base64Image, 'base64');
//         fs.writeFileSync(imageFilepath, buffer);
//         console.log(`   💾 Image saved to: ${imageFilepath}`);
//       }
//     } catch (error) {
//       console.error('❌ Error saving result:', error.message);
//     }
//   }

//   /**
//    * Disconnect from the server
//    */
//   disconnect(): void {
//     if (this.socket) {
//       console.log('\n👋 Disconnecting...');
//       this.socket.disconnect();
//       this.isConnected = false;
//     }
//   }

//   /**
//    * Check if client is connected
//    */
//   isClientConnected(): boolean {
//     return this.isConnected;
//   }
// }

// // ============================================================================
// // Usage Examples
// // ============================================================================

// /**
//  * Example 1: Basic connection and ping
//  */
// async function example1_BasicConnection() {
//   console.log('\n========================================');
//   console.log('Example 1: Basic Connection and Ping');
//   console.log('========================================');

//   const client = new PreviewWebSocketClient(SERVER_URL, JWT_TOKEN);

//   try {
//     await client.connect();

//     // Send a ping
//     client.ping();

//     // Wait a bit before disconnecting
//     await new Promise(resolve => setTimeout(resolve, 2000));

//     client.disconnect();
//   } catch (error) {
//     console.error('Error:', error.message);
//   }
// }

// /**
//  * Example 2: Process images from file paths
//  */
// async function example2_ProcessImagesFromFiles() {
//   console.log('\n========================================');
//   console.log('Example 2: Process Images from Files');
//   console.log('========================================');

//   const client = new PreviewWebSocketClient(SERVER_URL, JWT_TOKEN);

//   try {
//     await client.connect();

//     // Process two images
//     await client.processImages([
//       './path/to/image1.jpg',
//       './path/to/image2.jpg',
//     ]);

//     // Wait for processing to complete (adjust timeout as needed)
//     await new Promise(resolve => setTimeout(resolve, 30000)); // 30 seconds

//     client.disconnect();
//   } catch (error) {
//     console.error('Error:', error.message);
//   }
// }

// /**
//  * Example 3: Process images from base64
//  */
// async function example3_ProcessImagesFromBase64() {
//   console.log('\n========================================');
//   console.log('Example 3: Process Images from Base64');
//   console.log('========================================');

//   const client = new PreviewWebSocketClient(SERVER_URL, JWT_TOKEN);

//   try {
//     await client.connect();

//     // Example base64 strings (replace with actual base64 encoded images)
//     const base64Image1 = 'your_base64_encoded_image_1_here';
//     const base64Image2 = 'your_base64_encoded_image_2_here';

//     client.processImagesFromBase64([base64Image1, base64Image2]);

//     // Wait for processing to complete
//     await new Promise(resolve => setTimeout(resolve, 30000)); // 30 seconds

//     client.disconnect();
//   } catch (error) {
//     console.error('Error:', error.message);
//   }
// }

// /**
//  * Example 4: Long-running connection with multiple operations
//  */
// async function example4_LongRunningConnection() {
//   console.log('\n========================================');
//   console.log('Example 4: Long Running Connection');
//   console.log('========================================');

//   const client = new PreviewWebSocketClient(SERVER_URL, JWT_TOKEN);

//   try {
//     await client.connect();

//     // Keep connection alive and process multiple requests
//     let requestCount = 0;
//     const maxRequests = 3;

//     const interval = setInterval(async () => {
//       if (requestCount >= maxRequests) {
//         clearInterval(interval);
//         client.disconnect();
//         return;
//       }

//       requestCount++;
//       console.log(`\n--- Request ${requestCount} of ${maxRequests} ---`);

//       await client.processImages([
//         './path/to/image1.jpg',
//         './path/to/image2.jpg',
//       ]);
//     }, 10000); // Every 10 seconds

//   } catch (error) {
//     console.error('Error:', error.message);
//   }
// }

// /**
//  * Example 5: Connection with auto-reconnect handling
//  */
// async function example5_AutoReconnect() {
//   console.log('\n========================================');
//   console.log('Example 5: Auto Reconnect');
//   console.log('========================================');

//   const client = new PreviewWebSocketClient(SERVER_URL, JWT_TOKEN);

//   try {
//     await client.connect();

//     // The client will automatically try to reconnect if connection is lost
//     console.log('Connection established. Client will auto-reconnect if disconnected.');

//     // Keep alive for demonstration
//     await new Promise(resolve => setTimeout(resolve, 60000)); // 1 minute

//     client.disconnect();
//   } catch (error) {
//     console.error('Error:', error.message);
//   }
// }

// // ============================================================================
// // Run Examples
// // ============================================================================

// // Uncomment the example you want to run:

// // example1_BasicConnection();
// // example2_ProcessImagesFromFiles();
// // example3_ProcessImagesFromBase64();
// // example4_LongRunningConnection();
// // example5_AutoReconnect();

// /**
//  * Main entry point - choose your example
//  */
// async function main() {
//   console.log('WebSocket Client for Preview Module');
//   console.log('====================================\n');
//   console.log('Before running, make sure to:');
//   console.log('1. Install dependencies: npm install socket.io-client');
//   console.log('2. Update SERVER_URL and JWT_TOKEN constants');
//   console.log('3. Uncomment one of the example functions above');
//   console.log('\n');

//   // Run your chosen example here
//   // await example1_BasicConnection();
// }

// // Uncomment to run:
// // main().catch(console.error);

// export { PreviewWebSocketClient };
