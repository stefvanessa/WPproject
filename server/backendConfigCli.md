go in root backend folder, from your project
    cd server

reinstall dev dependencies
    npm install -D ts-node-dev

Then check:
    npx ts-node-dev --version

then run,this command that runs your backend files
    npm run dev

for oauth 2 with google I installed
    npm install passport passport-google-oauth20 express-session
and this
    npm install @types/express-session @types/passport @types/passport-google-oauth20 -D


firt 
    npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
LOGIN URL:
    http://localhost:3000/auth/google

For minIO:
-intalling , setupt 

    cd C:\Users\stefv\OneDrive\Desktop\WPproject\server
    mkdir C:\minio-data
    minio.exe server C:\minio-data --console-address ":9001"

- log in via web interface
    in the browser search :  
        http://localhost:9001
    log in with the default credentials
        Username: minioadmin
        Password: minioadmin
- multer
    npm install multer
    npm install -D @types/multer
-uuid
    npm install uuid
    npm install -D @types/uuid



Conecting backend to frontend 
1. installing cors 
    npm install cors
    npm install --save-dev @types/cors

    




How to run the project
1. start the minio server throgh docker
1.1 Open Docker Descktop
1.2 in the project path run:
    C:\Users\stefv\OneDrive\Desktop\WPproject>   docker-compose up -d minio
1.3 login wia minio at
    http://localhost:9000

with thise credentials
         Username: minioadmin
        Password: minioadmin
2. star node/server side
in the project path 
    cd server
    npm run dev
3. star client side
in the project path 
    cd client
    npm run dev

