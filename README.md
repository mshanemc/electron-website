# Electron Motors Website

This website showcases how Heroku Connect can be used to easily integrate a public-facing website with Salesforce.

## Setup Instructions

1. [![Deploy to Heroku](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/gabesumner/electron-website/tree/packaging) 

2. Login to Heroku (if you don't already have a Heroku account then sign up for one), then click the **Deploy App** button.

3. After the app is successfully deployed, click the **Manage App** button.

4. Click **Heroku Connect** (this will open in a new tab).

5. Click **Setup** Connection.

6. Click **Next**.

7. *IMPORTANT:* Change the **Environment** to **Sandbox** and click **Authorize**.

8. Login using your Electron Motors Salesforce demo org credentials.

9. Click **Allow**.

10. Click **Settings** and **Import/Export Configuration**.

11. Click **Import**.

12. Click **Choose File**, upload this file, and click **Upload**.

13. Return to your new Heroku app tab (from step 4).

14. Click **Open app**.

15. Inside Salesforce, click **Accounts**, click any Account, and copy & paste the **Username**.

16. Click **Login** on the Electron Motors website and paste the username from step 15 (password doesn't matter).

17. Click **Login**. 

18. Click **Customize** and customize the vehicle and purchase. 

19. Return to the Account in Salesforce, reload the record, click into the Vehicle. Changes will be synced.

20. Strut confidently around the room.


