import { db } from './db';
import { consolidationEngine } from './services/consolidationEngine';

async function testEngine() {
  console.log("Testing recommendGrouping()...");
  const clusters = await consolidationEngine.recommendGrouping();
  console.log(`Generated ${clusters.length} clusters.`);
  if (clusters.length > 0) {
    console.log("Sample cluster:", clusters[0]);
    
    console.log("\nTesting recommendRoute()...");
    const route = await consolidationEngine.recommendRoute(clusters[0].id, clusters[0].originHub.name, clusters[0].destinationHub.name);
    console.log("Recommended Route:", JSON.stringify(route, null, 2));

    console.log("\nTesting recommendDepartureTime()...");
    const departure = await consolidationEngine.recommendDepartureTime(clusters[0].id, clusters[0].shipmentIds, route);
    console.log("Recommended Departure:", departure);
  }
  process.exit(0);
}

testEngine().catch(console.error);
