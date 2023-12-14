# Valoremly Back-end

### Overview

Valoremly Back-end is a straightforward Express server connected to a serverless PostgreSQL database. Which handles the authentication of users and manages different scheduled tasks on the server.
##
### Connected to the following Front-end
- Valoremly Front-end: https://github.com/corgan0746/valoremly-frontend
##

### Features

1.  **Authentication:**
    
    -   Implements JWT token for secure user authentication.
    -   Manually creates CSRF tokens for enhanced security measures.
    -   User creation and verification through email using NodeMailer.
    -   Temporary storage of CSRF tokens using node-cache; tokens change with every post request.
2.  **CRUD Operations:**
    
    -   Manages CRUD operations for deals, items, and users.
    -   Operations are handled using node-pg, which is connected to the PostgreSQL database.
3.  **Router for Differentiating Requests:**
    
    -   Utilizes a router to distinguish between user and item-related requests.
4.  **Scheduled Tasks with node-schedule:**
    
    -   Automatically deletes notifications marked as seen from the database the following day.
    -   Messages related to a deal are deleted after 7 days from the day of creation.
5.  **Photo Handling with S3 Bucket:**
    
    -   Enables the upload and retrieval of photos from an S3 bucket.

##

**Technologies Used:**

-   Node.js
-   Typescript
-   Express.js
-   JWT
-   AWS S3
-   PostgreSQL
##
**Getting Started:**

-   Clone the repository.
-   Install dependencies: `npm install`.
-   Compile typescript: `npx tsc`.
-   Run the development server: `node app.js`.
-   Explore the platform at `http://localhost:4002`.
-   Environment variables
PORT = Port
ACCESS_TOKEN_SECRET= JWT access token
REFRESH_TOKEN_SECRET= JWT refresh token
COCKROACH_DB= Database URL
AWS_ACCESS_KEY= Aws access key
AWS_SECRET_KEY= Aws secret key
AWS_REGION= Aws region
AWS_BUCKET= Aws bucket name
EMAIL= Email address sender ( Must be outlook service )
EMAIL_PASSWORD= Email password

##
**Notes:**
- There might be some functionalities and scheduled processes that do not work properly
- Currently paused to updates due to lack of types in both Frontend and Backend will work on it again after learning Nest.js for the backend and reinforce my knowledge about React.
##
**Contributing:**

Contributions are welcome! Please check our [Contribution Guidelines](https://chat.openai.com/c/CONTRIBUTING.md) for details on how to get involved.
##
**License:**
-This project is dual-licensed under the following licenses: -

 - [MIT License](https://opensource.org/licenses/MIT): For general use.
 - [Creative Commons Attribution-NonCommercial License (CC BY-NC)](https://creativecommons.org/licenses/by-nc/4.0/): For non-commercial use. Please review the specific terms and conditions of each license before using or contributing to this project.