This project is derived from the CMS Blue Button Sample App, located here: https://github.com/CMSgov/bluebutton-sample-client-nodejs-react

It has been adapted to work with NC Medicaid's Patient Access API, in the sandbox environment.

## Create an NC Medicaid Connect Sandbox Account

Through the Medicaid Connect portal, fill out an application to get credentials to the sandbox patient access API

To ensure this sample application will work properly, make sure that when you register you add
the following url (see below) under the 'Callback URLS/Redirect Uris' section:

http://localhost:3001/api/bluebutton/callback/

When you are ready to run your own application, you can change this value to the url that you need.  
Just log into your Blue Button Sandbox account and select 'View/Edit App->'.

## Setup Docker & Node-js

Install and setup Docker. Go to https://docs.docker.com/get-started/ and follow the directions.

Download and install node. Go to https://nodejs.org/en/download/ and follow the directions.

## Running the Back-end & Front-end

Once you have Docker and Node installed and setup then do the following:

```    
    cp server/sample-bluebutton-config.json server/.bluebutton-config.json
```

Make sure to replace the clientId and clientSecret variables within the config file with
the ones you were provided, for your application, when you created your Blue Button Sandbox account.

```
    docker-compose up -d
```

This single command will create the docker container with all the necessary packages, configuration, and code to
run both the front and back ends of this sample application.

To run the front-end (client component listening on port 3000) in preview mode, set environment variable BB2_APP_LAUNCH=preview when launch docker-compose:

```
   BB2_APP_LAUNCH=preview docker-compose up -d
```

To see the application in action open your browser and enter the following URL:

http://localhost:3000

To see the process of authenticating with Blue Button via Medicare.gov and retrieve EoB data just click on the 'Authorize' button.

## BB2 Sandbox User

To ensure data displays properly in the sample application please use a
Blue Button Sandbox user that has PDE (Part-D Events) EoBs (Explanation of Benefits). An example of a user with this
data would be: BBUser29999 (PWD: PW29999!) or BBUser29998 (PWD: PW29998!)

## Development

Read the DEVELOPER NOTES found in the code to understand the application
and where you will need to make adjustments/changes as well as some
suggestions for best practices.

If you want to run this system locally, you will need to edit the `vite.config.mts` file, and replace the proxy target value from `http://server:3001` to `http://localhost:3001`.  This is because it is currently configured to run in docker.  You may then install all packages in the client and server folders using `yarn install`, and start the client and server indepdently using `yarn start`.

## Usage Examples

To start the sample in Docker :

1. go to the base directory of the repo
2. docker-compose up

To stop the sample:

The sample are running the sample in foreground, logging and tracing from both client and server components are on stdout of the command window, to stop the sample, press Ctl C, which will terminate both the client and server components.

Debugging server component
--------------------------
Node remote debugging is enabled on port 9229 for server in docker compose, developer can attach to server from IDE e.g. vscode.

To set up the run config to debug in vscode, add below contents to `.vscode/launch.json`
```
{
  // Use IntelliSense to learn about possible attributes.
  // Hover to view descriptions of existing attributes.
  // For more information, visit: https://go.microsoft.com/fwlink/?linkid=830387
  "version": "0.2.0",
  "configurations": [
    {
      "address": "0.0.0.0",
      "localRoot": "${workspaceFolder}/server",
      "name": "Attach to Remote",
      "port": 9229,
      "remoteRoot": "/server",
      "request": "attach",
      "skipFiles": ["<node_internals>/**"],
      "type": "node"
    }
  ]
}
```

## Error Responses and handling:

[See ErrorResponses.md](./ErrorResponses.md)
