// src/client_loader.ts
import { GridClient } from "grid3_client"; // Adjust the import based on your actual client library

export const config = {
  ssh_key: "your_ssh_key_here", // Replace with your actual SSH key
};

export async function getClient(): Promise<GridClient> {
  // Replace with your actual GridClient initialization logic
  const gridClient = new GridClient({
    // Client configuration
  });
  await gridClient.connect();
  return gridClient;
}

