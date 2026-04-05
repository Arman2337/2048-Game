# 2048 Cloud Game - AWS Setup Guide

Follow this step-by-step guide to deploy your 2048 game to the AWS Cloud using the Free Tier.

## 1. Create an AWS Account
1. Go to [aws.amazon.com](https://aws.amazon.com) and click **Create an AWS Account**.
2. Follow the on-screen instructions to verify your email, phone, and add a credit card. (AWS provides a very generous 12-month free tier. We will only use free tier services).
3. Sign in to the AWS Management Console as the "Root user".

## 2. Create the DynamoDB Table
1. In the top search bar, search for **DynamoDB** and click on it.
2. Ensure you are in your desired region (e.g., `us-east-1` N. Virginia) in the top right corner.
3. Click **Create table**.
   - **Table name**: `scores`
   - **Partition key**: `id` (Type: `String`)
   - Keep settings to **Default** and click **Create table**.
4. Wait for the status to become "Active".

## 3. Deploy the Backend (AWS Lambda)
1. In the top search bar, search for **Lambda** and click on it.
2. Click **Create function**.
   - **Options**: Author from scratch.
   - **Function name**: `gameBackendHandler`
   - **Runtime**: `Node.js 20.x` or `Node.js 18.x`.
   - **Architecture**: `x86_64`.
   - Click **Create function**.
3. Once created, scroll down to the **Code source** section.
4. Open the `index.js` file in the browser editor and paste the complete contents of your local `backend/index.js` file.
5. Click **Deploy** to save the changes.
6. **Important Permissions Step**: By default, Lambda doesn't have permission to write to DynamoDB.
   - Go to the **Configuration** tab.
   - Click **Permissions** on the left menu.
   - Click on the Role name (e.g., `gameBackendHandler-role-xxxxxx`). This opens IAM in a new tab.
   - Click **Add permissions** -> **Attach policies**.
   - Search for `AmazonDynamoDBFullAccess`, select the checkbox, and click **Add permissions**. (Note: In production use least privilege, but this is okay for learning).

## 4. Connect API Gateway
1. Go back to your Lambda function window.
2. In the "Function overview" diagram at the top, click **+ Add trigger**.
3. Select **API Gateway**.
   - **Intent**: Create a new API.
   - **API type**: `REST API`.
   - **Security**: `Open`.
4. Click **Add**.
5. Once added, you will see an **API endpoint** URL (e.g., `https://xxxxx.execute-api.us-east-1.amazonaws.com/default/gameBackendHandler`).
6. **CRITICAL**: Copy this API endpoint URL!
7. **Enable CORS in API Gateway:**
   - Click the link to your API Gateway name under the trigger details to open API Gateway.
   - Select your resource. Click **Actions** (or the CORS settings depending on the UI version) -> **Enable CORS**.
   - Use the default settings and click **Save**. (Sometimes you need to re-deploy the API from Actions -> Deploy API for changes to take effect).

## 5. Update the Frontend Code
1. Open up your local `frontend/script.js`.
2. Locate line 3:
   ```javascript
   const API_URL = 'http://localhost:3000';
   ```
3. Change it to your new API Gateway endpoint URL.
   ```javascript
   const API_URL = 'https://xxxxx.execute-api.us-east-1.amazonaws.com/default/gameBackendHandler'; // Replace with yours but strip trailing slashes!
   ```

## 6. Deploy the Frontend (AWS S3)
1. Ensure your `frontend/script.js` has the updated `API_URL`.
2. In the AWS console, search for **S3** and click it.
3. Click **Create bucket**.
   - **Bucket name**: Choose a unique name globally (e.g., `my-2048-game-app-bucket-999`).
   - Find **Block Public Access settings for this bucket**. **UNCHECK** "Block all public access" and acknowledge the warning.
   - Click **Create bucket**.
4. Open your new bucket.
5. Go to the **Properties** tab. Scroll to the bottom and find **Static website hosting**. Click **Edit**.
   - Choose **Enable**.
   - **Index document**: `index.html`.
   - Click **Save changes**.
6. Go to the **Permissions** tab. Find **Bucket policy** and click **Edit**.
7. Paste this policy, but change `YOUR-BUCKET-NAME` to your actual bucket name:
   ```json
   {
       "Version": "2012-10-17",
       "Statement": [
           {
               "Sid": "PublicReadGetObject",
               "Effect": "Allow",
               "Principal": "*",
               "Action": "s3:GetObject",
               "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/*"
           }
       ]
   }
   ```
   Click **Save changes**.
8. Go to the **Objects** tab. Click **Upload**.
9. Drag and drop all the files from your local `frontend` folder (e.g. `index.html`, `style.css`, `script.js`) and click **Upload**.
10. Once the upload finishes, go to the **Properties** tab again, scroll to **Static website hosting**, and copy your **Bucket website endpoint URL**.

**🎉 Open that URL in your browser, and your cloud-hosted 2048 game is live!**

## 7. CI/CD via GitHub Actions (Optional)
If you want pushing to GitHub to automatically upload files to S3:
1. Add your code to a GitHub repository.
2. In GitHub, go to **Settings > Secrets and variables > Actions**.
3. Add the following repository secrets:
   - `AWS_ACCESS_KEY_ID`: Your AWS IAM User access key.
   - `AWS_SECRET_ACCESS_KEY`: Your AWS IAM User secret key.
   - `S3_BUCKET_NAME`: Your exact S3 bucket name.
4. Whenever you push changes to `main`, the frontend will automatically sync to S3.
