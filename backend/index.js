const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, ScanCommand } = require("@aws-sdk/lib-dynamodb");
const crypto = require("crypto");

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = "scores";

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*", // Required for CORS
    "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  try {
    const path = event.resource || event.path; // API Gateway resource path

    // POST /score
    if (event.httpMethod === "POST" && (path === "/score" || path.endsWith("/score"))) {
      const body = JSON.parse(event.body);
      const { username, score } = body;

      if (!username || typeof score !== 'number') {
        return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid input" }) };
      }

      const id = crypto.randomUUID();
      const timestamp = new Date().toISOString();

      await ddbDocClient.send(new PutCommand({
        TableName: TABLE_NAME,
        Item: { id, username, score, timestamp }
      }));

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({ message: "Success", id })
      };
    }

    // GET /leaderboard
    if (event.httpMethod === "GET" && (path === "/leaderboard" || path.endsWith("/leaderboard"))) {
      const response = await ddbDocClient.send(new ScanCommand({
        TableName: TABLE_NAME
      }));

      // In a production environment, Scan is inefficient for large tables.
      // But for AWS free tier with a low-traffic 2048 game, it is perfectly fine.
      // We sort the results in memory to find the Top 10.
      let items = response.Items || [];
      items.sort((a, b) => b.score - a.score);
      const top10 = items.slice(0, 10);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(top10)
      };
    }

    // Not Found
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: "Not Found" })
    };

  } catch (err) {
    console.error("Error:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Internal Server Error" })
    };
  }
};
